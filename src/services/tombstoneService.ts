import { db, type TiloDB } from '@/storage/db';
import {
  tombstoneKey,
  type SyncTombstone,
  type SyncedTableName,
} from '@/core/types/sync';

/**
 * 删除墓碑（tombstone）与软删除的收口点。
 *
 * 背景：局域网同步是「整包 + LWW 时间戳」合并。合并时只能比较同一条记录
 * 谁的 updatedAt 更新，无法从「对端没有这条记录」推断「对端删了它」——
 * 所以硬删除必须留墓碑，否则对端会把手里的旧副本当成缺失数据重新写回来。
 *
 * 同理，软删除（trash）也必须同时推进 updatedAt，否则墓碑记录的
 * updatedAt 还停留在删除前，合并时输给对端的旧副本，删除同样会被复活。
 */

/** 墓碑保留时长：超过这个时间的墓碑会在本地被清理，避免每次同步都携带无限历史 */
export const TOMBSTONE_RETENTION_MS = 180 * 24 * 60 * 60 * 1000;

/** 具备 update 能力的 Dexie 表（结构最小化，避免 Dexie 泛型污染调用处） */
interface UpdatableTable<T> {
  update(key: string, changes: Partial<T>): Promise<number>;
}

/** 具备 bulkDelete 能力的 Dexie 表 */
interface DeletableTable {
  bulkDelete(keys: string[]): Promise<void>;
}

/**
 * 写入墓碑。必须与删除动作处在同一个事务里（调用方的 transaction 表清单要带上 syncTombstones），
 * 否则可能出现「记录删了但墓碑没写」的半状态——那条记录于是会被对端复活。
 */
export async function recordTombstones(
  table: SyncedTableName,
  entityIds: readonly string[],
  deletedAt: number = Date.now(),
  database: TiloDB = db
): Promise<void> {
  const ids = entityIds.filter((id) => typeof id === 'string' && id.length > 0);
  if (ids.length === 0) return;

  const rows: SyncTombstone[] = ids.map((entityId) => ({
    key: tombstoneKey(table, entityId),
    table,
    entityId,
    deletedAt,
  }));
  await database.syncTombstones.bulkPut(rows);
}

/**
 * 软删除一条记录（移入废纸篓）：同时推进 updatedAt，让「删除」在 LWW 合并中胜出。
 * 项目里所有「删除」都应走这里，不要直接写 `{ deletedAt }`。
 */
export async function softDeleteRow<T extends { deletedAt?: number | null; updatedAt?: number }>(
  table: UpdatableTable<T>,
  id: string,
  deletedAt: number = Date.now()
): Promise<void> {
  await table.update(id, { deletedAt, updatedAt: deletedAt } as Partial<T>);
}

/** 从废纸篓恢复：清空 deletedAt 并推进 updatedAt，让「恢复」在合并中胜出 */
export async function restoreSoftDeletedRow<T extends { deletedAt?: number | null; updatedAt?: number }>(
  table: UpdatableTable<T>,
  id: string,
  restoredAt: number = Date.now()
): Promise<void> {
  await table.update(id, { deletedAt: null, updatedAt: restoredAt } as Partial<T>);
}

/**
 * 硬删除（不留本地记录）+ 写墓碑。用于本来就不进废纸篓的实体
 * （时间块、专注会话、模板等）：UI 与统计都假设它们「查不到就是没了」，
 * 改成软删除会污染几十处读取点，所以用墓碑而不是软删除。
 */
export async function hardDeleteWithTombstone(
  tableRef: DeletableTable,
  table: SyncedTableName,
  entityIds: readonly string[],
  database: TiloDB = db,
  deletedAt: number = Date.now()
): Promise<void> {
  const ids = entityIds.filter((id) => typeof id === 'string' && id.length > 0);
  if (ids.length === 0) return;

  await tableRef.bulkDelete([...ids]);
  await recordTombstones(table, ids, deletedAt, database);
}

/** 读出全部墓碑，构建 `table:entityId -> deletedAt` 的时间表，供合并时判断 */
export async function loadTombstoneTimes(database: TiloDB = db): Promise<Map<string, number>> {
  const rows = await database.syncTombstones.toArray();
  const map = new Map<string, number>();
  for (const row of rows) {
    const prev = map.get(row.key);
    if (prev === undefined || row.deletedAt > prev) map.set(row.key, row.deletedAt);
  }
  return map;
}

/** 清理过期墓碑（默认 180 天）。超过保留期的墓碑不再需要承担「防复活」职责。 */
export async function purgeTombstones(
  database: TiloDB = db,
  retentionMs: number = TOMBSTONE_RETENTION_MS
): Promise<number> {
  const cutoff = Date.now() - retentionMs;
  return database.syncTombstones.where('deletedAt').below(cutoff).delete();
}
