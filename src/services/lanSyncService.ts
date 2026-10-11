import { db } from '@/storage/db';
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
}

export interface SyncResultSummary {
  updatedCount: number;
  addedCount: number;
  timestamp: number;
}

class LanSyncService {
  public readonly DEFAULT_PORT = 27123;

  /**
   * 导出当前本地 Dexie 数据库中全部实体的同步载荷
   */
  public async exportFullPayload(deviceName: string = 'Tilo Device'): Promise<SyncPayload> {
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
    ] = await Promise.all([
      db.tasks.toArray(),
      db.projects.toArray(),
      db.plannedBlocks.toArray(),
      db.sessions.toArray(),
      db.sessionSegments.toArray(),
      db.inboxItems.toArray(),
      db.goals.toArray(),
      db.notes.toArray(),
      db.milestones.toArray(),
      db.templates.toArray(),
      db.activityEvents.toArray(),
    ]);

    return {
      version: '1.2.1',
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
    };
  }

  /**
   * 核心双向合并算法：根据各记录的 updatedAt / createdAt 智能合并不丢数据
   */
  public async mergeRemotePayload(remote: SyncPayload): Promise<SyncResultSummary> {
    let updatedCount = 0;
    let addedCount = 0;

    await db.transaction('rw', [
      db.tasks,
      db.projects,
      db.plannedBlocks,
      db.sessions,
      db.sessionSegments,
      db.inboxItems,
      db.goals,
      db.notes,
      db.milestones,
      db.templates,
      db.activityEvents,
    ], async () => {
      // 辅助合并函数
      const mergeTable = async <T extends { id: string; updatedAt?: number; createdAt?: number }>(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        table: any,
        remoteList: T[] = []
      ) => {
        if (!remoteList || remoteList.length === 0) return;
        const localList: T[] = await table.toArray();
        const localMap = new Map<string, T>(localList.map((item) => [item.id, item]));

        for (const remoteItem of remoteList) {
          const localItem = localMap.get(remoteItem.id);
          if (!localItem) {
            // 本地没有，直接添加
            await table.add(remoteItem);
            addedCount++;
          } else {
            // 本地有，比较时间戳（取最新编辑的一方）
            const remoteTime = remoteItem.updatedAt || remoteItem.createdAt || 0;
            const localTime = localItem.updatedAt || localItem.createdAt || 0;

            if (remoteTime > localTime) {
              await table.put(remoteItem);
              updatedCount++;
            }
          }
        }
      };

      await mergeTable(db.tasks, remote.data.tasks);
      await mergeTable(db.projects, remote.data.projects);
      await mergeTable(db.plannedBlocks, remote.data.plannedBlocks);
      await mergeTable(db.sessions, remote.data.sessions);
      await mergeTable(db.sessionSegments, remote.data.sessionSegments);
      await mergeTable(db.inboxItems, remote.data.inboxItems);
      await mergeTable(db.goals, remote.data.goals);
      await mergeTable(db.notes, remote.data.notes);
      await mergeTable(db.milestones, remote.data.milestones);
      await mergeTable(db.templates, remote.data.templates);
      await mergeTable(db.activityEvents, remote.data.activityEvents);
    });

    return {
      updatedCount,
      addedCount,
      timestamp: Date.now(),
    };
  }

  /**
   * 手机端向电脑端 IP 发起局域网同步请求
   */
  public async syncWithHost(hostIpOrUrl: string, clientDeviceName = 'Android Mobile'): Promise<SyncResultSummary> {
    let targetUrl = hostIpOrUrl.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `http://${targetUrl}`;
    }
    if (!targetUrl.includes(':', 7)) {
      targetUrl = `${targetUrl}:${this.DEFAULT_PORT}`;
    }

    // 1. 导出本地数据准备推送
    const localPayload = await this.exportFullPayload(clientDeviceName);

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
      const summary = await this.mergeRemotePayload(remoteMergedPayload);
      return summary;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export const lanSyncService = new LanSyncService();
export default lanSyncService;
