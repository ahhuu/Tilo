import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TiloDB, ensureDefaultWorkspace } from '@/storage/db';
import {
  createTask,
  completeTask,
  reopenTask,
  rescheduleTask,
  deleteTaskToTrash,
  restoreTaskFromTrash,
} from '@/services/taskCommands';

describe('Task Domain Commands', () => {
  let testDb: TiloDB;

  beforeEach(async () => {
    testDb = new TiloDB(`test-task-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`);
    await ensureDefaultWorkspace(testDb);
  });

  afterEach(async () => {
    await testDb.delete();
  });

  it('creates task and appends TASK_CREATED activity event', async () => {
    const task = await createTask({ title: 'Implement Dexie core', priority: 'high' }, testDb);
    expect(task.id).toBeDefined();
    expect(task.title).toBe('Implement Dexie core');
    expect(task.priority).toBe('high');
    expect(task.statusId).toBe('ws-task-todo');

    const events = await testDb.activityEvents.where('entityId').equals(task.id).toArray();
    expect(events.length).toBe(1);
    expect(events[0].eventType).toBe('TASK_CREATED');
  });

  it('enforces one-level subtask constraint strictly', async () => {
    const parent = await createTask({ title: 'Parent task' }, testDb);
    const subtask = await createTask({ title: 'Subtask 1', parentTaskId: parent.id }, testDb);
    expect(subtask.parentTaskId).toBe(parent.id);

    // Attempting to create a subtask under a subtask should throw
    await expect(
      createTask({ title: 'Nested subtask', parentTaskId: subtask.id }, testDb)
    ).rejects.toThrow(/strictly restricted to exactly one level deep/);
  });

  it('handles task completion and reopening with status and event transitions', async () => {
    const task = await createTask({ title: 'Finish feature' }, testDb);
    const completed = await completeTask(task.id, testDb);
    expect(completed.statusId).toBe('ws-task-done');

    const reopened = await reopenTask(task.id, testDb);
    expect(reopened.statusId).toBe('ws-task-todo');

    const events = await testDb.activityEvents.where('entityId').equals(task.id).toArray();
    expect(events.some((e) => e.eventType === 'TASK_COMPLETED')).toBe(true);
    expect(events.some((e) => e.eventType === 'TASK_REOPENED')).toBe(true);
  });

  it('records rescheduling event with from/to and optional reason', async () => {
    const task = await createTask({ title: 'Review PR', scheduledDate: '2026-08-21' }, testDb);
    const rescheduled = await rescheduleTask(task.id, '2026-08-22', 'Waiting on CI', testDb);
    expect(rescheduled.scheduledDate).toBe('2026-08-22');

    const events = await testDb.activityEvents.where('entityId').equals(task.id).toArray();
    const reschedEvent = events.find((e) => e.eventType === 'TASK_RESCHEDULED');
    expect(reschedEvent).toBeDefined();
    const payload = reschedEvent?.payloadJson as { previousDate: string; newScheduledDate: string; reason: string };
    expect(payload.previousDate).toBe('2026-08-21');
    expect(payload.newScheduledDate).toBe('2026-08-22');
    expect(payload.reason).toBe('Waiting on CI');
  });

  it('supports trash soft-delete and restoration', async () => {
    const task = await createTask({ title: 'Draft note' }, testDb);
    await deleteTaskToTrash(task.id, testDb);

    const trashed = await testDb.tasks.get(task.id);
    expect(trashed?.deletedAt).toBeTypeOf('number');

    await restoreTaskFromTrash(task.id, testDb);
    const restored = await testDb.tasks.get(task.id);
    expect(restored?.deletedAt).toBeNull();
  });
});
