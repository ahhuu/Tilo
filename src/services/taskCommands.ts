import { db, DEFAULT_WORKSPACE_ID, type TiloDB } from '@/storage/db';
import type { Task, PriorityLevel, TaskProgressMode, ActivityEvent } from '@/core/types/domain';

export interface CreateTaskInput {
  title: string;
  projectId?: string;
  parentTaskId?: string;
  statusId?: string;
  priority?: PriorityLevel;
  progressMode?: TaskProgressMode;
  estimateMinutes?: number;
  dueDate?: string;
  scheduledDate?: string;
  planningBucket?: 'someday';
  tagIds?: string[];
  description?: string;
  workspaceId?: string;
}

/**
 * Creates a new Task and logs TASK_CREATED activity event.
 * If parentTaskId is provided, verifies that the parent does not itself have a parent (1-level subtasks).
 */
export async function createTask(
  input: CreateTaskInput,
  database: TiloDB = db
): Promise<Task> {
  const workspaceId = input.workspaceId || DEFAULT_WORKSPACE_ID;
  const now = Date.now();
  const taskId = `task-${now}-${Math.random().toString(36).substr(2, 9)}`;

  // Default statusId if not supplied
  let statusId = input.statusId;
  if (!statusId) {
    const defaultStatus = await database.workflowStatuses
      .where('[workspaceId+workflowId]')
      .equals([workspaceId, 'wf-task-default'])
      .and((s) => s.semantic === 'open')
      .first();
    statusId = defaultStatus?.id || 'ws-task-todo';
  }

  // Validate Subtask Hierarchy: Parent must NOT be a subtask
  if (input.parentTaskId) {
    const parent = await database.tasks.get(input.parentTaskId);
    if (!parent) {
      throw new Error(`Parent task ${input.parentTaskId} not found`);
    }
    if (parent.parentTaskId) {
      throw new Error('Subtasks are strictly restricted to exactly one level deep.');
    }
  }

  const task: Task = {
    id: taskId,
    workspaceId,
    title: input.title.trim(),
    description: input.description,
    projectId: input.projectId,
    parentTaskId: input.parentTaskId,
    statusId,
    priority: input.priority || 'none',
    progressMode: input.progressMode || (input.parentTaskId ? 'binary' : 'binary'),
    estimateMinutes: input.estimateMinutes,
    dueDate: input.dueDate,
    scheduledDate: input.scheduledDate,
    planningBucket: input.planningBucket,
    tagIds: input.tagIds || [],
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  const event: ActivityEvent = {
    id: `ev-${now}-${Math.random().toString(36).substr(2, 9)}`,
    workspaceId,
    entityType: 'task',
    entityId: taskId,
    eventType: 'TASK_CREATED',
    occurredAt: now,
    actor: 'user',
    payloadJson: { title: task.title, priority: task.priority, scheduledDate: task.scheduledDate },
  };

  await database.transaction('rw', [database.tasks, database.activityEvents], async () => {
    await database.tasks.put(task);
    await database.activityEvents.put(event);
  });

  return task;
}

/**
 * Updates a Task and records activity event.
 */
export async function updateTask(
  taskId: string,
  updates: Partial<Omit<Task, 'id' | 'workspaceId' | 'createdAt'>>,
  database: TiloDB = db
): Promise<Task> {
  const now = Date.now();
  const task = await database.tasks.get(taskId);
  if (!task) {
    throw new Error(`Task ${taskId} not found`);
  }

  const updated: Task = {
    ...task,
    ...updates,
    updatedAt: now,
  };

  const event: ActivityEvent = {
    id: `ev-${now}-${Math.random().toString(36).substr(2, 9)}`,
    workspaceId: task.workspaceId,
    entityType: 'task',
    entityId: taskId,
    eventType: 'TASK_UPDATED',
    occurredAt: now,
    actor: 'user',
    payloadJson: { changes: updates },
  };

  await database.transaction('rw', [database.tasks, database.activityEvents], async () => {
    await database.tasks.put(updated);
    await database.activityEvents.put(event);
  });

  return updated;
}

import { DEFAULT_TASK_WORKFLOW_ID } from './workflowCommands';

/**
 * Completes a Task by finding a completed status in its workflow.
 */
export async function completeTask(
  taskId: string,
  database: TiloDB = db
): Promise<Task> {
  const task = await database.tasks.get(taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);

  // Find a completed status in task workflow
  const completedStatus = await database.workflowStatuses
    .where('workflowId')
    .equals(DEFAULT_TASK_WORKFLOW_ID)
    .and((s) => s.semantic === 'completed')
    .first();

  const statusId = completedStatus?.id || 'ws-task-done';
  const now = Date.now();

  const updated: Task = {
    ...task,
    statusId,
    updatedAt: now,
  };

  const event: ActivityEvent = {
    id: `ev-${now}-${Math.random().toString(36).substr(2, 9)}`,
    workspaceId: task.workspaceId,
    entityType: 'task',
    entityId: taskId,
    eventType: 'TASK_COMPLETED',
    occurredAt: now,
    actor: 'user',
    payloadJson: { previousStatusId: task.statusId, newStatusId: statusId },
  };

  await database.transaction('rw', [database.tasks, database.activityEvents], async () => {
    await database.tasks.put(updated);
    await database.activityEvents.put(event);
  });

  return updated;
}

/**
 * Reopens a completed Task to an open state.
 */
export async function reopenTask(
  taskId: string,
  database: TiloDB = db
): Promise<Task> {
  const task = await database.tasks.get(taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);

  const openStatus = await database.workflowStatuses
    .where('workflowId')
    .equals(DEFAULT_TASK_WORKFLOW_ID)
    .and((s) => s.semantic === 'open')
    .first();

  const statusId = openStatus?.id || 'ws-task-todo';
  const now = Date.now();

  const updated: Task = {
    ...task,
    statusId,
    updatedAt: now,
  };

  const event: ActivityEvent = {
    id: `ev-${now}-${Math.random().toString(36).substr(2, 9)}`,
    workspaceId: task.workspaceId,
    entityType: 'task',
    entityId: taskId,
    eventType: 'TASK_REOPENED',
    occurredAt: now,
    actor: 'user',
    payloadJson: { previousStatusId: task.statusId, newStatusId: statusId },
  };

  await database.transaction('rw', [database.tasks, database.activityEvents], async () => {
    await database.tasks.put(updated);
    await database.activityEvents.put(event);
  });

  return updated;
}

/**
 * Reschedules a Task to a new scheduled date, recording the reason if provided.
 */
export async function rescheduleTask(
  taskId: string,
  newScheduledDate: string,
  reason?: string,
  database: TiloDB = db
): Promise<Task> {
  const task = await database.tasks.get(taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);

  const previousDate = task.scheduledDate;
  const now = Date.now();

  const updated: Task = {
    ...task,
    scheduledDate: newScheduledDate ? newScheduledDate : undefined,
    updatedAt: now,
  };

  const event: ActivityEvent = {
    id: `ev-${now}-${Math.random().toString(36).substr(2, 9)}`,
    workspaceId: task.workspaceId,
    entityType: 'task',
    entityId: taskId,
    eventType: 'TASK_RESCHEDULED',
    occurredAt: now,
    actor: 'user',
    payloadJson: { previousDate, newScheduledDate, reason },
  };

  await database.transaction('rw', [database.tasks, database.activityEvents], async () => {
    await database.tasks.put(updated);
    await database.activityEvents.put(event);
  });

  return updated;
}

/**
 * Moves a Task to Trash (soft delete).
 */
export async function deleteTaskToTrash(
  taskId: string,
  database: TiloDB = db
): Promise<void> {
  const task = await database.tasks.get(taskId);
  if (!task) return;

  const now = Date.now();
  const event: ActivityEvent = {
    id: `ev-${now}-${Math.random().toString(36).substr(2, 9)}`,
    workspaceId: task.workspaceId,
    entityType: 'task',
    entityId: taskId,
    eventType: 'TASK_TRASHED',
    occurredAt: now,
    actor: 'user',
    payloadJson: { title: task.title },
  };

  await database.transaction('rw', [database.tasks, database.activityEvents], async () => {
    await database.tasks.update(taskId, { deletedAt: now, updatedAt: now });
    await database.activityEvents.put(event);
  });
}

/**
 * Restores a Task from Trash.
 */
export async function restoreTaskFromTrash(
  taskId: string,
  database: TiloDB = db
): Promise<void> {
  const task = await database.tasks.get(taskId);
  if (!task) return;

  const now = Date.now();
  const event: ActivityEvent = {
    id: `ev-${now}-${Math.random().toString(36).substr(2, 9)}`,
    workspaceId: task.workspaceId,
    entityType: 'task',
    entityId: taskId,
    eventType: 'TASK_RESTORED',
    occurredAt: now,
    actor: 'user',
    payloadJson: { title: task.title },
  };

  await database.transaction('rw', [database.tasks, database.activityEvents], async () => {
    await database.tasks.update(taskId, { deletedAt: null, updatedAt: now });
    await database.activityEvents.put(event);
  });
}
