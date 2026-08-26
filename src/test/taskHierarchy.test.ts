import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TiloDB, ensureDefaultWorkspace } from '@/storage/db';
import { createTask, completeTask } from '@/services/taskCommands';
import { createProject } from '@/services/projectCommands';

describe('Task Hierarchy & Subtask Constraints', () => {
  let testDb: TiloDB;

  beforeEach(async () => {
    testDb = new TiloDB(`test-hier-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`);
    await ensureDefaultWorkspace(testDb);
  });

  afterEach(async () => {
    await testDb.delete();
  });

  it('allows standalone tasks without project', async () => {
    const task = await createTask({ title: 'Standalone Task' }, testDb);
    expect(task.projectId).toBeUndefined();
    expect(task.parentTaskId).toBeUndefined();
  });

  it('supports tasks associated with a project', async () => {
    const project = await createProject({ name: 'Alpha Project', color: '#6366f1' }, testDb);
    const task = await createTask({ title: 'Project Task', projectId: project.id }, testDb);
    expect(task.projectId).toBe(project.id);
  });

  it('strictly restricts subtasks to exactly 1 level deep', async () => {
    const parent = await createTask({ title: 'Root Task' }, testDb);
    const child = await createTask({ title: 'Subtask 1', parentTaskId: parent.id }, testDb);
    expect(child.parentTaskId).toBe(parent.id);

    // Creating subtask under child must fail
    await expect(
      createTask({ title: 'Sub-subtask', parentTaskId: child.id }, testDb)
    ).rejects.toThrow(/strictly restricted to exactly one level deep/);
  });

  it('subtasks can be completed independently from parent', async () => {
    const parent = await createTask({ title: 'Root Task' }, testDb);
    const subtask = await createTask({ title: 'Subtask 1', parentTaskId: parent.id }, testDb);

    const completedSubtask = await completeTask(subtask.id, testDb);
    expect(completedSubtask.statusId).toBe('ws-task-done');

    const freshParent = await testDb.tasks.get(parent.id);
    expect(freshParent?.statusId).toBe('ws-task-todo');
  });
});
