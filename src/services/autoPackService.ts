import { db, DEFAULT_WORKSPACE_ID, type TiloDB } from '@/storage/db';
import { timeService } from '@/core/time/timeService';
import type { PlannedBlock, ActivityEvent } from '@/core/types/domain';

export interface AutoPackSlot {
  startAt: number;
  endAt: number;
  durationMinutes: number;
}

export interface AutoPackProposal {
  taskId: string;
  taskTitle: string;
  projectId?: string;
  priority: string;
  estimateMinutes: number;
  startAt: number;
  endAt: number;
}

export interface AutoPackOptions {
  dateKey?: string; // YYYY-MM-DD, defaults to logical today
  workdayStartHour?: number; // default 9 (09:00)
  workdayEndHour?: number; // default 19 (19:00)
  bufferMinutes?: number; // default 5m
  minBlockMinutes?: number; // default 15m
  defaultEstimateMinutes?: number; // default 30m
  startFromCurrentTimeIfToday?: boolean; // default true
  priorityFilter?: 'all' | 'highAndUrgent' | 'withEstimatesOnly';
  includeSomedayTasks?: boolean;
  maxTasksToPack?: number;
  projectIdFilter?: string;
}

/**
 * Priority weighting for auto-pack sorting
 */
const PRIORITY_WEIGHTS: Record<string, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Generates an optimized auto-packing plan for candidate tasks into free calendar gaps.
 */
export async function generateAutoPackProposals(
  options: AutoPackOptions = {},
  database: TiloDB = db
): Promise<{ proposals: AutoPackProposal[]; freeGaps: AutoPackSlot[]; unassignedTasksCount: number }> {
  const dateKey = options.dateKey || timeService.getLogicalDate(timeService.now());
  const workdayStartHour = options.workdayStartHour ?? 9;
  const workdayEndHour = options.workdayEndHour ?? 19;
  const bufferMinutes = options.bufferMinutes ?? 5;
  const minBlockMinutes = options.minBlockMinutes ?? 15;
  const defaultEstimateMinutes = options.defaultEstimateMinutes ?? 30;
  const startFromCurrentTime = options.startFromCurrentTimeIfToday ?? true;

  const dayStart = timeService.getStartOfLogicalDay(dateKey);
  const dayStartTimestamp = dayStart + workdayStartHour * 60 * 60 * 1000;
  const dayEndTimestamp = dayStart + workdayEndHour * 60 * 60 * 1000;

  // 1. Fetch existing non-deleted planned blocks on target date
  const allBlocks = await database.plannedBlocks
    .filter((b) => !b.deletedAt)
    .toArray();

  const dayBlocks = allBlocks
    .filter((b) => b.startAt < dayEndTimestamp && b.endAt > dayStartTimestamp)
    .sort((a, b) => a.startAt - b.startAt);

  // 2. Determine initial timeline cursor
  const now = Date.now();
  const isToday = timeService.getLogicalDate(now) === dateKey;
  let timelineStart = dayStartTimestamp;

  if (isToday && startFromCurrentTime && now > dayStartTimestamp) {
    // Round up to the next 5-minute boundary
    const fiveMinMs = 5 * 60 * 1000;
    timelineStart = Math.min(dayEndTimestamp, Math.ceil(now / fiveMinMs) * fiveMinMs);
  }

  // 3. Compute available free time gaps
  const freeGaps: AutoPackSlot[] = [];
  let currentCursor = timelineStart;

  for (const block of dayBlocks) {
    if (block.endAt <= currentCursor) continue;

    if (block.startAt > currentCursor) {
      const gapDurationMs = block.startAt - currentCursor;
      const gapMinutes = Math.floor(gapDurationMs / (60 * 1000));
      if (gapMinutes >= minBlockMinutes) {
        freeGaps.push({
          startAt: currentCursor,
          endAt: block.startAt,
          durationMinutes: gapMinutes,
        });
      }
    }
    currentCursor = Math.max(currentCursor, block.endAt);
  }

  // Tail gap until workday end
  if (currentCursor < dayEndTimestamp) {
    const tailDurationMinutes = Math.floor((dayEndTimestamp - currentCursor) / (60 * 1000));
    if (tailDurationMinutes >= minBlockMinutes) {
      freeGaps.push({
        startAt: currentCursor,
        endAt: dayEndTimestamp,
        durationMinutes: tailDurationMinutes,
      });
    }
  }

  // 4. Fetch candidate uncompleted tasks
  const allTasks = await database.tasks
    .filter((t) => !t.deletedAt)
    .toArray();

  const plannedTaskIdsOnDate = new Set(
    dayBlocks.map((b) => b.taskId).filter((id): id is string => Boolean(id))
  );

  const priorityFilter = options.priorityFilter ?? 'all';
  const includeSomedayTasks = options.includeSomedayTasks ?? false;
  const maxTasksToPack = options.maxTasksToPack ?? 15;
  const projectIdFilter = options.projectIdFilter;

  // Candidate tasks: (Scheduled for dateKey OR unscheduled inbox/someday) AND not done AND not already planned on this date
  let candidateTasks = allTasks.filter((task) => {
    if (task.statusId === 'done' || task.statusId === 'cancelled' || task.statusId === 'ws-task-done') return false;
    if (plannedTaskIdsOnDate.has(task.id)) return false;
    if (task.scheduledDate && task.scheduledDate !== dateKey) return false;
    if (!includeSomedayTasks && task.planningBucket === 'someday') return false;
    if (projectIdFilter && task.projectId !== projectIdFilter) return false;

    if (priorityFilter === 'highAndUrgent') {
      if (task.priority !== 'urgent' && task.priority !== 'high') return false;
    } else if (priorityFilter === 'withEstimatesOnly') {
      if (!task.estimateMinutes || task.estimateMinutes <= 0) return false;
    }

    return true;
  });

  // Sort candidate tasks: Priority Desc -> Due Date Asc -> CreatedAt Asc
  candidateTasks.sort((a, b) => {
    const weightA = PRIORITY_WEIGHTS[a.priority] || 2;
    const weightB = PRIORITY_WEIGHTS[b.priority] || 2;
    if (weightB !== weightA) return weightB - weightA;

    if (a.dueDate && b.dueDate) {
      if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    } else if (a.dueDate) {
      return -1;
    } else if (b.dueDate) {
      return 1;
    }

    return a.createdAt - b.createdAt;
  });

  if (candidateTasks.length > maxTasksToPack) {
    candidateTasks = candidateTasks.slice(0, maxTasksToPack);
  }

  // 5. Greedily fit candidate tasks into available gaps
  const proposals: AutoPackProposal[] = [];
  const activeGaps = freeGaps.map((gap) => ({ ...gap }));
  let assignedCount = 0;

  for (const task of candidateTasks) {
    const durationMinutes = Math.max(
      minBlockMinutes,
      task.estimateMinutes || defaultEstimateMinutes
    );
    const requiredDurationMs = durationMinutes * 60 * 1000;
    const bufferMs = bufferMinutes * 60 * 1000;

    // Find the earliest gap that can accommodate this task
    for (const gap of activeGaps) {
      const availableMs = gap.endAt - gap.startAt;
      if (availableMs >= requiredDurationMs) {
        const blockStart = gap.startAt;
        const blockEnd = blockStart + requiredDurationMs;

        proposals.push({
          taskId: task.id,
          taskTitle: task.title,
          projectId: task.projectId,
          priority: task.priority,
          estimateMinutes: durationMinutes,
          startAt: blockStart,
          endAt: blockEnd,
        });

        // Advance gap cursor with buffer
        gap.startAt = blockEnd + bufferMs;
        gap.durationMinutes = Math.max(0, Math.floor((gap.endAt - gap.startAt) / (60 * 1000)));
        assignedCount++;
        break;
      }
    }
  }

  return {
    proposals,
    freeGaps,
    unassignedTasksCount: candidateTasks.length - assignedCount,
  };
}

/**
 * Commits auto-pack proposals into Dexie transactionally.
 */
export async function applyAutoPackProposals(
  proposals: AutoPackProposal[],
  database: TiloDB = db
): Promise<PlannedBlock[]> {
  if (proposals.length === 0) return [];

  const now = Date.now();
  const createdBlocks: PlannedBlock[] = [];
  const events: ActivityEvent[] = [];

  for (const p of proposals) {
    const blockId = `block-${now}-${Math.random().toString(36).substr(2, 9)}`;
    const block: PlannedBlock = {
      id: blockId,
      workspaceId: DEFAULT_WORKSPACE_ID,
      taskId: p.taskId,
      projectId: p.projectId,
      type: 'task',
      title: p.taskTitle,
      startAt: p.startAt,
      endAt: p.endAt,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    const event: ActivityEvent = {
      id: `ev-${now}-${Math.random().toString(36).substr(2, 9)}`,
      workspaceId: DEFAULT_WORKSPACE_ID,
      entityType: 'plannedBlock',
      entityId: blockId,
      eventType: 'PLAN_CREATED',
      occurredAt: now,
      actor: 'user',
      payloadJson: {
        autoPacked: true,
        taskId: p.taskId,
        startAt: p.startAt,
        endAt: p.endAt,
      },
    };

    createdBlocks.push(block);
    events.push(event);
  }

  await database.transaction('rw', [database.plannedBlocks, database.activityEvents], async () => {
    await database.plannedBlocks.bulkPut(createdBlocks);
    await database.activityEvents.bulkPut(events);
  });

  return createdBlocks;
}

/**
 * Reverts auto-packed blocks.
 */
export async function undoAutoPack(
  blockIds: string[],
  database: TiloDB = db
): Promise<void> {
  if (blockIds.length === 0) return;
  const now = Date.now();

  await database.transaction('rw', [database.plannedBlocks, database.activityEvents], async () => {
    for (const id of blockIds) {
      await database.plannedBlocks.update(id, { deletedAt: now });
      await database.activityEvents.put({
        id: `ev-${now}-${Math.random().toString(36).substr(2, 9)}`,
        workspaceId: DEFAULT_WORKSPACE_ID,
        entityType: 'plannedBlock',
        entityId: id,
        eventType: 'PLAN_DELETED',
        occurredAt: now,
        actor: 'user',
        payloadJson: { undoAutoPack: true },
      });
    }
  });
}
