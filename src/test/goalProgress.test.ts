import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TiloDB, ensureDefaultWorkspace } from '@/storage/db';
import { createGoal, calculateGoalProgress, updateGoal } from '@/services/goalCommands';
import { createProject, createMilestone } from '@/services/projectCommands';
import { createTask, completeTask } from '@/services/taskCommands';

describe('Goal Progress Calculation Engine', () => {
  let testDb: TiloDB;

  beforeEach(async () => {
    testDb = new TiloDB(`test-goalprogress-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`);
    await ensureDefaultWorkspace(testDb);
  });

  afterEach(async () => {
    await testDb.delete();
  });

  it('calculates manual progress accurately', async () => {
    const goal = await createGoal({ title: 'Manual Goal', progressMode: 'manual' }, testDb);
    await updateGoal(goal.id, { currentProgress: 45 }, testDb);

    const progress = await calculateGoalProgress(goal.id, testDb);
    expect(progress).toBe(45);
  });

  it('derives milestone-based progress from linked project milestones', async () => {
    const goal = await createGoal({ title: 'Milestone-based Goal', progressMode: 'milestones' }, testDb);
    const project = await createProject({ name: 'Project 1', color: '#6366f1', primaryGoalId: goal.id }, testDb);

    const m1 = await createMilestone(project.id, 'Milestone 1', undefined, testDb);
    await createMilestone(project.id, 'Milestone 2', undefined, testDb);

    // 0 / 2 = 0%
    expect(await calculateGoalProgress(goal.id, testDb)).toBe(0);

    // Complete 1 milestone: 1 / 2 = 50%
    await testDb.milestones.update(m1.id, { status: 'completed' });
    expect(await calculateGoalProgress(goal.id, testDb)).toBe(50);
  });

  it('derives task-based progress from linked project tasks', async () => {
    const goal = await createGoal({ title: 'Task-based Goal', progressMode: 'taskCompletion' }, testDb);
    const project = await createProject({ name: 'Project 2', color: '#10b981', primaryGoalId: goal.id }, testDb);

    const t1 = await createTask({ title: 'Task 1', projectId: project.id }, testDb);
    await createTask({ title: 'Task 2', projectId: project.id }, testDb);

    // 0 / 2 = 0%
    expect(await calculateGoalProgress(goal.id, testDb)).toBe(0);

    // Complete 1 task: 1 / 2 = 50%
    await completeTask(t1.id, testDb);
    expect(await calculateGoalProgress(goal.id, testDb)).toBe(50);
  });
});
