import { db, type TiloDB } from '@/storage/db';
import {
  isSoftDeleted,
  isSyncedTableName,
  mergeVersionTime,
  tombstoneKey,
  type SyncTombstone,
  type SyncedTableName,
} from '@/core/types/sync';
import { loadTombstoneTimes } from '@/services/tombstoneService';
import type {
  Task,
  Project,
  PlannedBlock,
  Session,
  SessionSegment,
  InboxItem,
  Goal,
  Note,
  Milestone,
  Template,
  ActivityEvent,
} from '@/core/types/domain';

export interface SyncPayload {
  version: string;
  timestamp: number;
  deviceName: string;
  data: {
    tasks: Task[];
    projects: Project[];
    plannedBlocks: PlannedBlock[];
    sessions: Session[];
    sessionSegments: SessionSegment[];
    inboxItems: InboxItem[];
    goals: Goal[];
    notes: Note[];
    milestones: Milestone[];
    templates: Template[];
    activityEvents: ActivityEvent[];
  };
  /**
   * 删除墓碑（v1.6.0 起）。
   * 旧版本对端不认识这个字段会直接忽略，只是拿不到「删除」信息，不会报错。
   */
  tombstones?: SyncTombstone[];
}

export interface SyncResultSummary {
  updatedCount: number;
  addedCount: number;
  /** 因对端墓碑而本地删掉的记录数（v1.6.0 起） */
  deletedCount: number;
  timestamp: number;
}

/** 合并时需要读取的时间字段（SessionSegment 没有 updatedAt，退化到 endAt/startAt） */
type VersionedRecord = {
  id: string;
  updatedAt?: number | null;
  createdAt?: number | null;
  endAt?: number | null;
  startAt?: number | null;
  deletedAt?: number | null;
};

const SYNCED_TABLES: readonly SyncedTableName[] = [
  'tasks',
  'projects',
  'plannedBlocks',
  'sessions',
  'sessionSegments',
  'inboxItems',
  'goals',
  'notes',
  'milestones',
  'templates',
  'activityEvents',
];

class LanSyncService {
  public readonly DEFAULT_PORT = 27123;

  /**
   * 导出当前本地 Dexie 数据库中全部实体的同步载荷
   */
  public async exportFullPayload(
    deviceName: string = 'Tilo Device',
    database: TiloDB = db
  ): Promise<SyncPayload> {
    const [
      tasks,
      projects,
      plannedBlocks,
      sessions,
      sessionSegments,
      inboxItems,
      goals,
      notes,
      milestones,
      templates,
      activityEvents,
      tombstones,
    ] = await Promise.all([
      database.tasks.toArray(),
      database.projects.toArray(),
      database.plannedBlocks.toArray(),
      database.sessions.toArray(),
      database.sessionSegments.toArray(),
      database.inboxItems.toArray(),
      database.goals.toArray(),
      database.notes.toArray(),
      database.milestones.toArray(),
      database.templates.toArray(),
      database.activityEvents.toArray(),
      database.syncTombstones.toArray(),
    ]);

    return {
      version: '1.6.0',
      timestamp: Date.now(),
      deviceName,
      data: {
        tasks,
        projects,
        plannedBlocks,
        sessions,
        sessionSegments,
        inboxItems,
        goals,
        notes,
        milestones,
        templates,
        activityEvents,
      },
      tombstones,
    };
  }

  /**
   * 核心双向合并算法。
   *
   * 三条规则（缺一不可）：
   * 1. 先并墓碑、再按墓碑删本地记录——「删除」作为一条事实参与同步，
   *    而不是靠「对端没有这条记录」去猜。
   * 2. 墓碑生效后，同一份载荷里对端带来的旧副本不允许再被写回来（防复活）。
   * 3. 同一条记录时间戳相同时「已删除」优先——删除前不推进 updatedAt 的历史数据
   *    （收件箱/笔记/里程碑的旧删除路径）也能正确传播。
   *
   * updatedAt 比墓碑更新的记录会被保留：说明对端在删除之后又显式改过/重建过它。
   */
  public async mergeRemotePayload(
    remote: SyncPayload,
    database: TiloDB = db
  ): Promise<SyncResultSummary> {
    let updatedCount = 0;
    let addedCount = 0;
    let deletedCount = 0;

    // 防御：对端缓存尚未就绪时可能返回 {}（手机原生服务初始值）或残缺结构，
    // 此时视为「无数据可合并」，避免 remote.data 为 undefined 抛错导致整次同步失败。
    if (!remote || typeof remote !== 'object' || !remote.data) {
      return { updatedCount: 0, addedCount: 0, deletedCount: 0, timestamp: Date.now() };
    }

    await database.transaction(
      'rw',
      [...SYNCED_TABLES.map((name) => database.table(name)), database.syncTombstones],
      async () => {
        // 1. 合并墓碑（对端的 + 本地已有的），得到 `table:id -> deletedAt` 时间表
        const tombstoneTimes = await this.absorbTombstones(remote.tombstones, database);

        // 2. 按墓碑删除本地记录，并统计
        deletedCount = await this.applyTombstones(tombstoneTimes, database);

        // 3. 逐表合并数据（墓碑时间表参与判定，阻止被删记录复活）
        const mergeTable = async (tableName: SyncedTableName, remoteList: VersionedRecord[] = []) => {
          if (!remoteList || remoteList.length === 0) return;
          const table = database.table(tableName);
          const localList = (await table.toArray()) as VersionedRecord[];
          const localMap = new Map<string, VersionedRecord>(localList.map((item) => [item.id, item]));

          for (const remoteItem of remoteList) {
            if (!remoteItem || typeof remoteItem.id !== 'string') continue;

            const localItem = localMap.get(remoteItem.id);
            const remoteTime = mergeVersionTime(remoteItem);
            const deletedAt = tombstoneTimes.get(tombstoneKey(tableName, remoteItem.id));

            if (!localItem) {
              // 本地没有：若已被（本地或对端）删过且对端这份不更新，则不再写回
              if (deletedAt !== undefined && remoteTime <= deletedAt) continue;
              await table.add(remoteItem);
              addedCount++;
              continue;
            }

            const localTime = mergeVersionTime(localItem);
            let shouldWrite = remoteTime > localTime;

            // 时间戳打平（历史数据删除时没推进 updatedAt，或跨设备时钟精度相同）：
            // 「已删除」的一方胜出，否则删除永远传不过去。
            if (!shouldWrite && remoteTime === localTime) {
              shouldWrite = isSoftDeleted(remoteItem) && !isSoftDeleted(localItem);
            }

            if (shouldWrite) {
              // 对端这份早于墓碑、且本地已经按墓碑删过（正常不会走到），保险起见跳过
              if (deletedAt !== undefined && remoteTime <= deletedAt) continue;
              await table.put(remoteItem);
              updatedCount++;
            }
          }
        };

        await mergeTable('tasks', remote.data.tasks);
        await mergeTable('projects', remote.data.projects);
        await mergeTable('plannedBlocks', remote.data.plannedBlocks);
        await mergeTable('sessions', remote.data.sessions);
        await mergeTable('sessionSegments', remote.data.sessionSegments);
        await mergeTable('inboxItems', remote.data.inboxItems);
        await mergeTable('goals', remote.data.goals);
        await mergeTable('notes', remote.data.notes);
        await mergeTable('milestones', remote.data.milestones);
        await mergeTable('templates', remote.data.templates);
        await mergeTable('activityEvents', remote.data.activityEvents);
      }
    );

    return {
      updatedCount,
      addedCount,
      deletedCount,
      timestamp: Date.now(),
    };
  }

  /**
   * 把对端墓碑并入本地墓碑表，返回合并后的完整时间表（含本地已有墓碑）。
   * 同一实体只保留更晚的删除时间。
   */
  private async absorbTombstones(
    remoteTombstones: SyncTombstone[] | undefined,
    database: TiloDB
  ): Promise<Map<string, number>> {
    const incoming = (remoteTombstones ?? []).filter(
      (item): item is SyncTombstone =>
        !!item &&
        isSyncedTableName(item.table) &&
        typeof item.entityId === 'string' &&
        item.entityId.length > 0 &&
        typeof item.deletedAt === 'number' &&
        Number.isFinite(item.deletedAt)
    );

    if (incoming.length > 0) {
      const existing = new Map<string, number>();
      for (const row of await database.syncTombstones.toArray()) {
        existing.set(row.key, row.deletedAt);
      }
      const toWrite = incoming
        .map((item) => ({
          key: tombstoneKey(item.table, item.entityId),
          table: item.table,
          entityId: item.entityId,
          deletedAt: item.deletedAt,
        }))
        .filter((item) => {
          const prev = existing.get(item.key);
          return prev === undefined || item.deletedAt > prev;
        });
      if (toWrite.length > 0) {
        await database.syncTombstones.bulkPut(toWrite);
      }
    }

    return loadTombstoneTimes(database);
  }

  /** 按墓碑时间表删除本地记录：本地版本比墓碑新的保留（删除之后被显式改过/重建过） */
  private async applyTombstones(
    tombstoneTimes: Map<string, number>,
    database: TiloDB
  ): Promise<number> {
    if (tombstoneTimes.size === 0) return 0;

    const grouped = new Map<SyncedTableName, Array<{ id: string; deletedAt: number }>>();
    for (const [key, deletedAt] of tombstoneTimes) {
      const sep = key.indexOf(':');
      if (sep < 0) continue;
      const tableName = key.slice(0, sep);
      const entityId = key.slice(sep + 1);
      if (!isSyncedTableName(tableName) || entityId.length === 0) continue;
      const list = grouped.get(tableName) ?? [];
      list.push({ id: entityId, deletedAt });
      grouped.set(tableName, list);
    }

    let deletedCount = 0;
    for (const [tableName, entries] of grouped) {
      const table = database.table(tableName);
      const rows = (await table.bulkGet(entries.map((entry) => entry.id))) as Array<
        VersionedRecord | undefined
      >;
      const toDelete: string[] = [];
      rows.forEach((row, index) => {
        if (!row) return;
        if (mergeVersionTime(row) <= entries[index].deletedAt) toDelete.push(row.id);
      });
      if (toDelete.length > 0) {
        await table.bulkDelete(toDelete);
        deletedCount += toDelete.length;
      }
    }

    return deletedCount;
  }

  /**
   * 手机端向电脑端 IP 发起局域网同步请求
   */
  public async syncWithHost(
    hostIpOrUrl: string,
    clientDeviceName = 'Android Mobile',
    database: TiloDB = db
  ): Promise<SyncResultSummary> {
    let targetUrl = hostIpOrUrl.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `http://${targetUrl}`;
    }
    if (!targetUrl.includes(':', 7)) {
      targetUrl = `${targetUrl}:${this.DEFAULT_PORT}`;
    }

    // 1. 导出本地数据准备推送
    const localPayload = await this.exportFullPayload(clientDeviceName, database);

    // 2. 发起同步合并请求（5秒超时）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(`${targetUrl}/api/sync/merge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(localPayload),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const remoteMergedPayload: SyncPayload = await response.json();

      // 3. 将电脑端合并回来的数据合并回本地
      const summary = await this.mergeRemotePayload(remoteMergedPayload, database);
      return summary;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export const lanSyncService = new LanSyncService();
export default lanSyncService;
