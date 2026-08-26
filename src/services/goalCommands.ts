import { db, DEFAULT_WORKSPACE_ID, type TiloDB } from '@/storage/db';
import type { Goal, GoalProgressMode, WeeklyFocus, ActivityEvent } from '@/core/types/domain';

export interface CreateGoalInput {
  title: string;
  description?: string;
  color?: string;
  progressMode?: GoalProgressMode;
  targetProgress?: number;
  targetDate?: string;
  isWeeklyFocus?: boolean;
  workspaceId?: string;
}

export async function createGoal(
  input: CreateGoalInput,
  database: TiloDB = db
): Promise<Goal> {
  const workspaceId = input.workspaceId || DEFAULT_WORKSPACE_ID;
  const now = Date.now();
  const goalId = `goal-${now}-${Math.random().toString(36).substr(2, 9)}`;

  const goal: Goal = {
    id: goalId,
    workspaceId,
    title: input.title.trim(),
    description: input.description,
    color: input.color || '#4f46e5',
    status: 'active',
    progressMode: input.progressMode || 'manual',
    currentProgress: 0,
    targetProgress: input.targetProgress,
    targetDate: input.targetDate,
    isWeeklyFocus: input.isWeeklyFocus ?? false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  const event: ActivityEvent = {
    id: `ev-${now}-${Math.random().toString(36).substr(2, 9)}`,
    workspaceId,
    entityType: 'goal',
    entityId: goalId,
    eventType: 'GOAL_CREATED',
    occurredAt: now,
    actor: 'user',
    payloadJson: { title: goal.title, progressMode: goal.progressMode },
  };

  await database.transaction('rw', [database.goals, database.activityEvents], async () => {
    await database.goals.put(goal);
    await database.activityEvents.put(event);
  });

  return goal;
}

export async function updateGoal(
  goalId: string,
  updates: Partial<Omit<Goal, 'id' | 'workspaceId' | 'createdAt'>>,
  database: TiloDB = db
): Promise<Goal> {
  const now = Date.now();
  const goal = await database.goals.get(goalId);
  if (!goal) throw new Error(`Goal ${goalId} not found`);

  const updated: Goal = { ...goal, ...updates, updatedAt: now };

  const event: ActivityEvent = {
    id: `ev-${now}-${Math.random().toString(36).substr(2, 9)}`,
    workspaceId: goal.workspaceId,
    entityType: 'goal',
    entityId: goalId,
    eventType: 'GOAL_UPDATED',
    occurredAt: now,
    actor: 'user',
    payloadJson: { updates },
  };

  await database.transaction('rw', [database.goals, database.activityEvents], async () => {
    await database.goals.put(updated);
    await database.activityEvents.put(event);
  });

  return updated;
}

/**
 * Calculates dynamic progress percentage (0-100) for a Goal based on its progressMode.
 */
export async function calculateGoalProgress(
  goalId: string,
  database: TiloDB = db
): Promise<number> {
  const goal = await database.goals.get(goalId);
  if (!goal) return 0;

  if (goal.progressMode === 'manual') {
    return Math.min(100, Math.max(0, Math.round(goal.currentProgress)));
  }

  // Find all projects linked to this goal (as primary or related)
  const linkedProjects = await database.projects
    .where('workspaceId')
    .equals(goal.workspaceId)
    .filter(
      (p) =>
        !p.deletedAt &&
        (p.primaryGoalId === goalId || Boolean(p.relatedGoalIds && p.relatedGoalIds.includes(goalId)))
    )
    .toArray();

  const linkedProjectIds = linkedProjects.map((p) => p.id);

  if (goal.progressMode === 'metricTarget') {
    let completedCount = 0;
    if (linkedProjectIds.length > 0) {
      const allTasks = await database.tasks
        .where('workspaceId')
        .equals(goal.workspaceId)
        .filter((t) => !!t.projectId && linkedProjectIds.includes(t.projectId) && !t.deletedAt)
        .toArray();

      const taskDoneCount = allTasks.filter(
        (t) =>
          t.statusId === 'ws-task-done' ||
          t.statusId === 'ws-proj-completed' ||
          t.statusId?.toLowerCase().includes('done') ||
          t.statusId?.toLowerCase().includes('completed')
      ).length;

      const allMilestones = await database.milestones
        .where('workspaceId')
        .equals(goal.workspaceId)
        .filter((m) => linkedProjectIds.includes(m.projectId) && !m.deletedAt)
        .toArray();

      const milestoneDoneCount = allMilestones.filter((m) => m.status === 'completed').length;
      completedCount = taskDoneCount + milestoneDoneCount;
    }

    const currentVal = Math.max(goal.currentProgress || 0, completedCount);
    if (goal.targetProgress && goal.targetProgress > 0) {
      return Math.min(100, Math.max(0, Math.round((currentVal / goal.targetProgress) * 100)));
    }
    return Math.min(100, Math.max(0, Math.round(currentVal)));
  }

  if (linkedProjectIds.length === 0) {
    return 0;
  }

  if (goal.progressMode === 'milestones') {
    const allMilestones = await database.milestones
      .where('workspaceId')
      .equals(goal.workspaceId)
      .filter((m) => linkedProjectIds.includes(m.projectId) && !m.deletedAt)
      .toArray();

    if (allMilestones.length === 0) return 0;
    const completed = allMilestones.filter((m) => m.status === 'completed').length;
    return Math.round((completed / allMilestones.length) * 100);
  }

  if (goal.progressMode === 'taskCompletion') {
    const allTasks = await database.tasks
      .where('workspaceId')
      .equals(goal.workspaceId)
      .filter((t) => !!t.projectId && linkedProjectIds.includes(t.projectId) && !t.deletedAt)
      .toArray();

    if (allTasks.length === 0) return 0;
    const completed = allTasks.filter(
      (t) =>
        t.statusId === 'ws-task-done' ||
        t.statusId === 'ws-proj-completed' ||
        t.statusId?.toLowerCase().includes('done') ||
        t.statusId?.toLowerCase().includes('completed')
    ).length;
    return Math.round((completed / allTasks.length) * 100);
  }

  return 0;
}

/**
 * Sets Weekly Focus goals for a given weekKey, enforcing rank order.
 */
export async function setWeeklyFocusGoals(
  weekKey: string,
  goalIds: string[],
  workspaceId: string = DEFAULT_WORKSPACE_ID,
  database: TiloDB = db
): Promise<void> {
  const now = Date.now();

  await database.transaction('rw', [database.weeklyFocus, database.goals, database.activityEvents], async () => {
    // Clear existing focus for this weekKey in workspace
    await database.weeklyFocus
      .where('[workspaceId+weekKey]')
      .equals([workspaceId, weekKey])
      .delete();

    // Insert new ranked focus entries
    for (let i = 0; i < goalIds.length; i++) {
      const focusEntry: WeeklyFocus = {
        id: `wf-${weekKey}-${goalIds[i]}`,
        workspaceId,
        weekKey,
        goalId: goalIds[i],
        rank: i + 1,
      };
      await database.weeklyFocus.put(focusEntry);
    }

    const event: ActivityEvent = {
      id: `ev-${now}-${Math.random().toString(36).substr(2, 9)}`,
      workspaceId,
      entityType: 'weeklyFocus',
      entityId: weekKey,
      eventType: 'GOAL_FOCUS_SET',
      occurredAt: now,
      actor: 'user',
      payloadJson: { weekKey, goalIds },
    };
    await database.activityEvents.put(event);
  });
}

/**
 * Soft deletes a Goal and logs activity event.
 */
export async function deleteGoal(
  goalId: string,
  database: TiloDB = db
): Promise<void> {
  const now = Date.now();
  const goal = await database.goals.get(goalId);
  if (!goal) return;

  const event: ActivityEvent = {
    id: `ev-${now}-${Math.random().toString(36).substr(2, 9)}`,
    workspaceId: goal.workspaceId,
    entityType: 'goal',
    entityId: goalId,
    eventType: 'GOAL_DELETED',
    occurredAt: now,
    actor: 'user',
    payloadJson: { title: goal.title },
  };

  await database.transaction('rw', [database.goals, database.weeklyFocus, database.activityEvents], async () => {
    await database.goals.update(goalId, { deletedAt: now, updatedAt: now });
    await database.weeklyFocus.where('goalId').equals(goalId).delete();
    await database.activityEvents.put(event);
  });
}

