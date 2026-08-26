import { db, DEFAULT_WORKSPACE_ID, type TiloDB } from '@/storage/db';
import type { PlannedBlock, PlannedBlockType, DailyFocus, ActivityEvent } from '@/core/types/domain';

export interface CreatePlannedBlockInput {
  taskId?: string;
  projectId?: string;
  type: PlannedBlockType;
  title?: string;
  startAt: number;
  endAt: number;
  recurrenceSeriesId?: string;
  workspaceId?: string;
}

/**
 * Creates a planned time block in Calendar/Timeline.
 */
export async function createPlannedBlock(
  input: CreatePlannedBlockInput,
  database: TiloDB = db
): Promise<PlannedBlock> {
  const workspaceId = input.workspaceId || DEFAULT_WORKSPACE_ID;
  const now = Date.now();
  const blockId = `block-${now}-${Math.random().toString(36).substr(2, 9)}`;

  const block: PlannedBlock = {
    id: blockId,
    workspaceId,
    taskId: input.taskId,
    projectId: input.projectId,
    type: input.type,
    title: input.title,
    startAt: input.startAt,
    endAt: input.endAt,
    recurrenceSeriesId: input.recurrenceSeriesId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  const event: ActivityEvent = {
    id: `ev-${now}-${Math.random().toString(36).substr(2, 9)}`,
    workspaceId,
    entityType: 'plannedBlock',
    entityId: blockId,
    eventType: 'PLAN_CREATED',
    occurredAt: now,
    actor: 'user',
    payloadJson: { startAt: block.startAt, endAt: block.endAt, type: block.type, taskId: block.taskId },
  };

  await database.transaction('rw', [database.plannedBlocks, database.activityEvents], async () => {
    await database.plannedBlocks.put(block);
    await database.activityEvents.put(event);
  });

  return block;
}

export async function updatePlannedBlock(
  blockId: string,
  updates: Partial<Omit<PlannedBlock, 'id' | 'workspaceId' | 'createdAt'>>,
  database: TiloDB = db
): Promise<PlannedBlock> {
  const now = Date.now();
  const block = await database.plannedBlocks.get(blockId);
  if (!block) throw new Error(`PlannedBlock ${blockId} not found`);

  const updated: PlannedBlock = { ...block, ...updates, updatedAt: now };

  const eventType = updates.startAt || updates.endAt ? 'PLAN_MOVED' : 'PLAN_RESIZED';
  const event: ActivityEvent = {
    id: `ev-${now}-${Math.random().toString(36).substr(2, 9)}`,
    workspaceId: block.workspaceId,
    entityType: 'plannedBlock',
    entityId: blockId,
    eventType: eventType,
    occurredAt: now,
    actor: 'user',
    payloadJson: { updates },
  };

  await database.transaction('rw', [database.plannedBlocks, database.activityEvents], async () => {
    await database.plannedBlocks.put(updated);
    await database.activityEvents.put(event);
  });

  return updated;
}

export async function deletePlannedBlock(
  blockId: string,
  database: TiloDB = db
): Promise<void> {
  const block = await database.plannedBlocks.get(blockId);
  if (!block) return;

  const now = Date.now();
  const event: ActivityEvent = {
    id: `ev-${now}-${Math.random().toString(36).substr(2, 9)}`,
    workspaceId: block.workspaceId,
    entityType: 'plannedBlock',
    entityId: blockId,
    eventType: 'PLAN_DELETED',
    occurredAt: now,
    actor: 'user',
    payloadJson: { blockId },
  };

  await database.transaction('rw', [database.plannedBlocks, database.activityEvents], async () => {
    await database.plannedBlocks.delete(blockId);
    await database.activityEvents.put(event);
  });
}

/**
 * Sets Daily Focus tasks for a given logicalDate with ranks (1..N).
 */
export async function setDailyFocusTasks(
  logicalDate: string,
  taskIds: string[],
  workspaceId: string = DEFAULT_WORKSPACE_ID,
  database: TiloDB = db
): Promise<void> {
  await database.transaction('rw', [database.dailyFocus], async () => {
    await database.dailyFocus
      .where('[workspaceId+logicalDate]')
      .equals([workspaceId, logicalDate])
      .delete();

    for (let i = 0; i < taskIds.length; i++) {
      const focus: DailyFocus = {
        id: `df-${logicalDate}-${taskIds[i]}`,
        workspaceId,
        logicalDate,
        taskId: taskIds[i],
        rank: i + 1,
      };
      await database.dailyFocus.put(focus);
    }
  });
}

export interface CreateRecurringPlanSeriesInput {
  frequency: 'daily' | 'weekly';
  interval: number;
  weekdays?: number[]; // [0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat]
  startsOn: string; // YYYY-MM-DD
  endsOn?: string; // YYYY-MM-DD
  title: string;
  type: PlannedBlockType;
  startHour: number; // e.g. 9 or 14.5
  durationMinutes: number;
  taskId?: string;
  projectId?: string;
  workspaceId?: string;
}

/**
 * Creates a recurring schedule series and materializes occurrences for the next 4 weeks.
 */
export async function createRecurringPlanSeries(
  input: CreateRecurringPlanSeriesInput,
  database: TiloDB = db
): Promise<{ seriesId: string; generatedCount: number }> {
  const workspaceId = input.workspaceId || DEFAULT_WORKSPACE_ID;
  const now = Date.now();
  const seriesId = `series-${now}-${Math.random().toString(36).substr(2, 9)}`;

  const series = {
    id: seriesId,
    workspaceId,
    frequency: input.frequency,
    interval: input.interval,
    weekdays: input.weekdays,
    startsOn: input.startsOn,
    endsOn: input.endsOn,
    sourceTemplateJson: {
      title: input.title,
      type: input.type,
      startHour: input.startHour,
      durationMinutes: input.durationMinutes,
      taskId: input.taskId,
      projectId: input.projectId,
    },
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  // Generate occurrences for 28 days
  const generatedBlocks: PlannedBlock[] = [];
  const startDate = new Date(`${input.startsOn}T00:00:00`);
  const totalDays = 28;

  for (let d = 0; d < totalDays; d++) {
    const targetDate = new Date(startDate.getTime() + d * 86400000);
    const dateStr = targetDate.toISOString().split('T')[0];

    if (input.endsOn && dateStr > input.endsOn) break;

    const dayOfWeek = targetDate.getDay();
    let shouldGenerate = false;

    if (input.frequency === 'daily') {
      shouldGenerate = d % input.interval === 0;
    } else if (input.frequency === 'weekly') {
      const allowedDays = input.weekdays && input.weekdays.length > 0 ? input.weekdays : [1, 2, 3, 4, 5];
      shouldGenerate = allowedDays.includes(dayOfWeek);
    }

    if (shouldGenerate) {
      const dayStartMs = new Date(`${dateStr}T00:00:00`).getTime();
      const startAt = dayStartMs + Math.round(input.startHour * 3600000);
      const endAt = startAt + Math.round(input.durationMinutes * 60000);
      const blockId = `block-rec-${seriesId}-${dateStr}`;

      generatedBlocks.push({
        id: blockId,
        workspaceId,
        taskId: input.taskId,
        projectId: input.projectId,
        type: input.type,
        title: input.title,
        startAt,
        endAt,
        recurrenceSeriesId: seriesId,
        recurrenceOccurrenceKey: dateStr,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });
    }
  }

  const event: ActivityEvent = {
    id: `ev-${now}-${Math.random().toString(36).substr(2, 9)}`,
    workspaceId,
    entityType: 'recurrenceSeries',
    entityId: seriesId,
    eventType: 'PLAN_CREATED',
    occurredAt: now,
    actor: 'user',
    payloadJson: { seriesId, count: generatedBlocks.length },
  };

  await database.transaction(
    'rw',
    [database.recurrenceSeries, database.plannedBlocks, database.activityEvents],
    async () => {
      await database.recurrenceSeries.put(series);
      for (const block of generatedBlocks) {
        await database.plannedBlocks.put(block);
      }
      await database.activityEvents.put(event);
    }
  );

  return { seriesId, generatedCount: generatedBlocks.length };
}

/**
 * Deletes all planned blocks belonging to a recurrence series.
 */
export async function deleteRecurrenceSeries(
  seriesId: string,
  database: TiloDB = db
): Promise<void> {
  await database.transaction(
    'rw',
    [database.recurrenceSeries, database.plannedBlocks, database.activityEvents],
    async () => {
      await database.plannedBlocks.where('recurrenceSeriesId').equals(seriesId).delete();
      await database.recurrenceSeries.delete(seriesId);
    }
  );
}
