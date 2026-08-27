import { db, type TiloDB } from '@/storage/db';
import { timeService } from '@/core/time/timeService';
import type { PlannedBlock, Task } from '@/core/types/domain';

export interface OverflowInfo {
  isOverflowing: boolean;
  overflowMinutes: number;
  blockTitle?: string;
  blockEndAt?: number;
}

/**
 * Checks if the currently active session is exceeding its linked planned block or estimate.
 */
export function checkSessionOverflow(
  session: { startedAt: number; elapsedSeconds: number; taskId?: string },
  plannedBlocks: PlannedBlock[]
): OverflowInfo {
  const currentElapsedMinutes = Math.floor(session.elapsedSeconds / 60);

  // Find linked or overlapping block
  const linkedBlock = plannedBlocks.find((b) => {
    if (session.taskId && b.taskId === session.taskId) return true;
    return session.startedAt >= b.startAt && session.startedAt <= b.endAt;
  });

  if (!linkedBlock) {
    return { isOverflowing: false, overflowMinutes: 0 };
  }

  const plannedDurationMinutes = Math.max(15, Math.round((linkedBlock.endAt - linkedBlock.startAt) / 60000));

  if (currentElapsedMinutes > plannedDurationMinutes + 2) {
    const overflow = currentElapsedMinutes - plannedDurationMinutes;
    return {
      isOverflowing: true,
      overflowMinutes: overflow,
      blockTitle: linkedBlock.title,
      blockEndAt: linkedBlock.endAt,
    };
  }

  return { isOverflowing: false, overflowMinutes: 0 };
}

/**
 * Elastic Push: shifts all subsequent planned blocks on a given day forward by `pushMinutes`.
 */
export async function elasticPushSubsequentBlocks(
  dateStr: string,
  fromTimestamp: number,
  pushMinutes: number,
  database: TiloDB = db
): Promise<number> {
  if (pushMinutes <= 0) return 0;
  const pushMs = pushMinutes * 60000;
  const now = Date.now();

  const startOfDayMs = timeService.getStartOfLogicalDay(dateStr);
  const endOfDayMs = timeService.getEndOfLogicalDay(dateStr);

  const blocks = await database.plannedBlocks
    .where('[workspaceId+startAt]')
    .between(['ws-default', startOfDayMs], ['ws-default', endOfDayMs], true, true)
    .toArray();

  const subsequentBlocks = blocks.filter(
    (b) => !b.deletedAt && b.startAt >= fromTimestamp
  );

  if (subsequentBlocks.length === 0) return 0;

  await database.transaction('rw', database.plannedBlocks, database.activityEvents, async () => {
    for (const block of subsequentBlocks) {
      await database.plannedBlocks.update(block.id, {
        startAt: block.startAt + pushMs,
        endAt: block.endAt + pushMs,
        updatedAt: now,
      });
    }

    // Record activity event
    await database.activityEvents.add({
      id: `evt-push-${now}-${Math.random().toString(36).slice(2, 7)}`,
      workspaceId: 'ws-default',
      entityType: 'block',
      entityId: dateStr,
      eventType: 'PLAN_MOVED',
      actor: 'user',
      payloadJson: {
        pushMinutes,
        affectedCount: subsequentBlocks.length,
      },
      occurredAt: now,
    });
  });

  return subsequentBlocks.length;
}

/**
 * Predicts ghost end time based on historical task estimation accuracy variance.
 */
export function calculateGhostEndTime(
  block: PlannedBlock,
  task?: Task,
  averageAccuracyRatio = 1.25 // Default healthy variance ratio (tasks take ~25% longer than initial expectation)
): number | null {
  const blockDurationMs = block.endAt - block.startAt;
  const blockDurationMin = blockDurationMs / 60000;

  // If task has an estimate that exceeds the planned block, or standard variance
  const estimatedMin = task?.estimateMinutes || blockDurationMin;
  const predictedMin = Math.round(estimatedMin * averageAccuracyRatio);

  if (predictedMin > blockDurationMin + 5) {
    return block.startAt + predictedMin * 60000;
  }

  return null;
}
