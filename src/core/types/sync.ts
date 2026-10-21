/**
 * 同步层公共类型。
 *
 * 为什么需要墓碑（tombstone）：
 * 局域网同步是「整包 + 时间戳 LWW」合并，只能判断「谁的版本更新」，
 * 无法从「对端没有这条记录」推断出「对端删掉了它」——因为本地可能只是
 * 还没收到过这条记录。所以硬删除必须留下一条带删除时间的墓碑，
 * 否则对端会把自己手里的旧副本当成「本地缺少」重新写回来（删除被复活）。
 */

/** 参与同步的实体表名（必须与 SyncPayload['data'] 的键一致） */
export type SyncedTableName =
  | 'tasks'
  | 'projects'
  | 'plannedBlocks'
  | 'sessions'
  | 'sessionSegments'
  | 'inboxItems'
  | 'goals'
  | 'notes'
  | 'milestones'
  | 'templates'
  | 'activityEvents';

export const SYNCED_TABLE_NAMES: readonly SyncedTableName[] = [
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
] as const;

/**
 * 一条删除墓碑：某张表的某条记录在某时刻被硬删除。
 * 只需要时间戳，不需要保留整行快照。
 */
export interface SyncTombstone {
  /** 主键 `${table}:${entityId}`，保证同一实体只有一条墓碑 */
  key: string;
  table: SyncedTableName;
  entityId: string;
  deletedAt: number;
}

export function isSyncedTableName(value: unknown): value is SyncedTableName {
  return typeof value === 'string' && (SYNCED_TABLE_NAMES as readonly string[]).includes(value);
}

export function tombstoneKey(table: SyncedTableName, entityId: string): string {
  return `${table}:${entityId}`;
}

/** 合并时用于比较「谁更新」的版本时间：缺 updatedAt 的实体（如分段）退化到自身时间字段 */
export function mergeVersionTime(record: {
  updatedAt?: number | null;
  createdAt?: number | null;
  endAt?: number | null;
  startAt?: number | null;
}): number {
  return record.updatedAt ?? record.createdAt ?? record.endAt ?? record.startAt ?? 0;
}

/** 软删除标记（trash）是否生效 */
export function isSoftDeleted(record: { deletedAt?: number | null }): boolean {
  return record.deletedAt != null;
}
