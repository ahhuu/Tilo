import { db, DEFAULT_WORKSPACE_ID, type TiloDB } from '@/storage/db';
import type { Review, ReviewRevision, ReviewType, ActivityEvent } from '@/core/types/domain';
import { timeService } from '@/core/time/timeService';
import { completeTask, rescheduleTask } from '@/services/taskCommands';
import { addDays, format } from 'date-fns';

export interface CreateReviewDraftInput {
  type: ReviewType;
  periodKey: string;
  periodStart: number;
  periodEnd: number;
  workspaceId?: string;
}

export interface CompleteReviewInput {
  reviewId: string;
  snapshotJson: unknown;
  reflectionJson: unknown;
  storyText?: string;
}

export interface LeftoverTaskResolution {
  taskId: string;
  action: 'tomorrow' | 'someday' | 'done' | 'reschedule';
  newDate?: string;
}

/**
 * Creates or gets an existing review draft for the given period.
 */
export async function getOrCreateReviewDraft(
  input: CreateReviewDraftInput,
  database: TiloDB = db
): Promise<Review> {
  const workspaceId = input.workspaceId || DEFAULT_WORKSPACE_ID;

  const existing = await database.reviews
    .where('[workspaceId+periodKey]')
    .equals([workspaceId, input.periodKey])
    .and((r) => r.type === input.type)
    .first();

  if (existing) {
    return existing;
  }

  const now = Date.now();
  const reviewId = `rev-${input.type}-${input.periodKey}`;

  const review: Review = {
    id: reviewId,
    workspaceId,
    type: input.type,
    periodKey: input.periodKey,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    status: 'draft',
    currentRevision: 0,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  await database.reviews.put(review);
  return review;
}

/**
 * Resolves unfinished leftover tasks during Daily Close.
 */
export async function resolveLeftoverTasks(
  resolutions: LeftoverTaskResolution[],
  database: TiloDB = db
): Promise<void> {
  const todayStr = timeService.getLogicalDate();
  const tomorrowStr = format(addDays(new Date(`${todayStr}T12:00:00`), 1), 'yyyy-MM-dd');

  for (const item of resolutions) {
    if (item.action === 'done') {
      await completeTask(item.taskId, database);
    } else if (item.action === 'tomorrow') {
      await rescheduleTask(item.taskId, tomorrowStr, 'Moved during Daily Close', database);
    } else if (item.action === 'someday') {
      await database.tasks.update(item.taskId, {
        scheduledDate: undefined,
        planningBucket: 'someday',
        updatedAt: Date.now(),
      });
    } else if (item.action === 'reschedule' && item.newDate) {
      await rescheduleTask(item.taskId, item.newDate, 'Rescheduled during Daily Close', database);
    }
  }
}

/**
 * Handles Someday resurfacing item action during Weekly Review.
 */
export async function handleSomedayAction(
  inboxItemId: string,
  action: 'keep' | 'thisWeek' | 'archive',
  database: TiloDB = db
): Promise<void> {
  if (action === 'archive') {
    await database.inboxItems.update(inboxItemId, { state: 'archived', updatedAt: Date.now() });
  } else if (action === 'thisWeek') {
    const item = await database.inboxItems.get(inboxItemId);
    if (item) {
      const todayStr = timeService.getLogicalDate();
      await database.tasks.put({
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        workspaceId: item.workspaceId,
        title: item.rawText,
        statusId: 'ws-task-todo',
        priority: 'medium',
        progressMode: 'binary',
        tagIds: [],
        scheduledDate: todayStr,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
      });
      await database.inboxItems.update(inboxItemId, { state: 'converted', updatedAt: Date.now() });
    }
  } else {
    // Keep in someday
    await database.inboxItems.update(inboxItemId, { updatedAt: Date.now() });
  }
}

/**
 * Updates goal weekly focus flags for next week planning.
 */
export async function setNextWeekFocusGoals(
  focusGoalIds: string[],
  database: TiloDB = db
): Promise<void> {
  await database.transaction('rw', [database.goals], async () => {
    const allGoals = await database.goals.toArray();
    for (const g of allGoals) {
      const shouldFocus = focusGoalIds.includes(g.id);
      if (g.isWeeklyFocus !== shouldFocus) {
        await database.goals.update(g.id, { isWeeklyFocus: shouldFocus, updatedAt: Date.now() });
      }
    }
  });
}

/**
 * Skips a review period.
 */
export async function skipReview(
  input: CreateReviewDraftInput,
  database: TiloDB = db
): Promise<Review> {
  const review = await getOrCreateReviewDraft(input, database);
  const now = Date.now();
  const updated: Review = {
    ...review,
    status: 'skipped',
    updatedAt: now,
  };
  await database.reviews.put(updated);
  return updated;
}

/**
 * Rule-based factual weekly narrative story generator.
 */
export async function generateWeeklyStory(
  weekKey: string,
  workspaceId: string = DEFAULT_WORKSPACE_ID,
  database: TiloDB = db
): Promise<string> {
  const allSessions = await database.sessions
    .where('workspaceId')
    .equals(workspaceId)
    .filter((s) => !s.deletedAt && s.kind === 'active')
    .toArray();

  const periodSessions = allSessions.filter(
    (s) => timeService.getWeekKey(s.startedAt) === weekKey
  );

  const totalFocusSec = periodSessions.reduce((acc, s) => acc + s.activeDurationSeconds, 0);
  const totalHours = (totalFocusSec / 3600).toFixed(1);

  const allTasks = await database.tasks
    .where('workspaceId')
    .equals(workspaceId)
    .filter((t) => !t.deletedAt)
    .toArray();

  const periodTasks = allTasks.filter(
    (t) => t.scheduledDate && timeService.getWeekKey(new Date(`${t.scheduledDate}T12:00:00`).getTime()) === weekKey
  );

  const completedCount = periodTasks.filter((t) => t.statusId === 'ws-task-done').length;

  return `During week ${weekKey}, you logged ${totalHours} hours of active focus across ${periodSessions.length} sessions. You completed ${completedCount} out of ${periodTasks.length} scheduled tasks.`;
}

/**
 * Completes a review, creating an immutable ReviewRevision snapshot (Revision N+1).
 */
export async function completeReview(
  input: CompleteReviewInput,
  database: TiloDB = db
): Promise<{ review: Review; revision: ReviewRevision }> {
  const review = await database.reviews.get(input.reviewId);
  if (!review) throw new Error(`Review ${input.reviewId} not found`);

  const now = Date.now();
  const nextRevisionNumber = review.currentRevision + 1;
  const revisionId = `rev-rev-${review.id}-${nextRevisionNumber}`;

  const revision: ReviewRevision = {
    id: revisionId,
    workspaceId: review.workspaceId,
    reviewId: review.id,
    revision: nextRevisionNumber,
    createdAt: now,
    snapshotJson: input.snapshotJson,
    reflectionJson: input.reflectionJson,
    storyText: input.storyText,
  };

  const updatedReview: Review = {
    ...review,
    status: 'completed',
    currentRevision: nextRevisionNumber,
    updatedAt: now,
  };

  const event: ActivityEvent = {
    id: `ev-${now}-${Math.random().toString(36).substr(2, 9)}`,
    workspaceId: review.workspaceId,
    entityType: 'review',
    entityId: review.id,
    eventType: review.type === 'daily' ? 'DAILY_CLOSE_COMPLETED' : 'WEEKLY_REVIEW_COMPLETED',
    occurredAt: now,
    actor: 'user',
    payloadJson: { revision: nextRevisionNumber, periodKey: review.periodKey },
  };

  await database.transaction(
    'rw',
    [database.reviews, database.reviewRevisions, database.activityEvents],
    async () => {
      await database.reviewRevisions.put(revision);
      await database.reviews.put(updatedReview);
      await database.activityEvents.put(event);
    }
  );

  return { review: updatedReview, revision };
}

/**
 * Reopens a completed review for revisions.
 */
export async function reopenReview(
  reviewId: string,
  database: TiloDB = db
): Promise<Review> {
  const review = await database.reviews.get(reviewId);
  if (!review) throw new Error(`Review ${reviewId} not found`);

  const now = Date.now();
  const updated: Review = {
    ...review,
    status: 'reopened',
    updatedAt: now,
  };

  await database.reviews.put(updated);
  return updated;
}
