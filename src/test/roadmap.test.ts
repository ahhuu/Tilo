import { describe, it, expect, beforeEach } from 'vitest';
import { TiloDB } from '@/storage/db';
import { getRoadmapData } from '@/services/roadmapService';
import 'fake-indexeddb/auto';

describe('Roadmap Gantt Service', () => {
  let db: TiloDB;

  beforeEach(async () => {
    db = new TiloDB(`test-roadmap-${Math.random()}`);
    await db.open();

    const now = Date.now();

    // Goal
    await db.goals.put({
      id: 'goal-1',
      workspaceId: 'default',
      title: '2026 核心系统升级',
      status: 'active',
      targetDate: '2026-12-31',
      color: '#4f46e5',
      progressMode: 'milestones',
      currentProgress: 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    // Project under Goal
    await db.projects.put({
      id: 'proj-1',
      workspaceId: 'default',
      primaryGoalId: 'goal-1',
      name: '架构重构',
      color: '#06b6d4',
      status: 'active',
      order: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    // Tasks under Project
    await db.tasks.bulkPut([
      {
        id: 'task-1',
        workspaceId: 'default',
        projectId: 'proj-1',
        title: 'Task A',
        statusId: 'ws-task-done',
        priority: 'medium',
        progressMode: 'binary',
        tagIds: [],
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      {
        id: 'task-2',
        workspaceId: 'default',
        projectId: 'proj-1',
        title: 'Task B',
        statusId: 'ws-task-todo',
        priority: 'high',
        progressMode: 'binary',
        tagIds: [],
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
    ]);

    // Milestone under Project
    await db.milestones.put({
      id: 'ms-1',
      workspaceId: 'default',
      projectId: 'proj-1',
      title: 'Alpha 版本封版',
      targetDate: '2026-08-30',
      status: 'planned',
      order: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  });

  it('aggregates roadmap data with progress percentages and milestones', async () => {
    const data = await getRoadmapData(db);

    expect(data.goals.length).toBe(1);
    expect(data.goals[0].projects.length).toBe(1);

    const project = data.goals[0].projects[0];
    expect(project.name).toBe('架构重构');
    expect(project.totalTasks).toBe(2);
    expect(project.completedTasks).toBe(1);
    expect(project.progressPercentage).toBe(50);
    expect(project.milestones.length).toBe(1);
  });
});
