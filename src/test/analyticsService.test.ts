import { describe, it, expect } from 'vitest';
import { getPeriodBounds, computeAnalytics } from '@/services/analyticsService';
import type { Task, Session, PlannedBlock } from '@/core/types/domain';

describe('Analytics Calculation Engine', () => {
  const fixedRefMs = new Date('2026-08-21T12:00:00').getTime(); // Friday

  it('calculates period boundaries accurately for thisWeek and thisMonth', () => {
    const thisWeek = getPeriodBounds('thisWeek', fixedRefMs);
    expect(thisWeek.days.length).toBe(7);
    expect(thisWeek.days[0].dayName).toBe('Mon');
    expect(thisWeek.days[6].dayName).toBe('Sun');

    const thisMonth = getPeriodBounds('thisMonth', fixedRefMs);
    expect(thisMonth.days.length).toBe(31); // August has 31 days
  });

  it('computes headline metrics: Active Focus, Planned Time, Time Accuracy, and Task Completion', () => {
    const bounds = getPeriodBounds('thisWeek', fixedRefMs);

    const mockSessions: Session[] = [
      {
        id: 's1',
        workspaceId: 'ws-default',
        title: 'Focus 1',
        plannedBlockId: 'b1',
        kind: 'active',
        source: 'timer',
        startedAt: bounds.startMs + 3600000, // within period
        endedAt: bounds.startMs + 7200000,
        activeDurationSeconds: 3600, // 1 hour
        elapsedDurationSeconds: 3600,
        createdAt: bounds.startMs,
        updatedAt: bounds.startMs,
        deletedAt: null,
      },
    ];

    const mockPlannedBlocks: PlannedBlock[] = [
      {
        id: 'b1',
        workspaceId: 'ws-default',
        type: 'task',
        title: 'Plan 1',
        startAt: bounds.startMs + 3600000,
        endAt: bounds.startMs + 10800000, // 2 hours (7200 sec)
        createdAt: bounds.startMs,
        updatedAt: bounds.startMs,
        deletedAt: null,
      },
    ];

    const mockTasks: Task[] = [
      {
        id: 't1',
        workspaceId: 'ws-default',
        title: 'Task 1',
        statusId: 'ws-task-done',
        scheduledDate: bounds.days[0].dateStr,
        priority: 'none',
        progressMode: 'binary',
        tagIds: [],
        order: 0,
        createdAt: bounds.startMs,
        updatedAt: bounds.startMs,
        deletedAt: null,
      },
      {
        id: 't2',
        workspaceId: 'ws-default',
        title: 'Task 2',
        statusId: 'ws-task-todo',
        scheduledDate: bounds.days[1].dateStr,
        priority: 'none',
        progressMode: 'binary',
        tagIds: [],
        order: 1,
        createdAt: bounds.startMs,
        updatedAt: bounds.startMs,
        deletedAt: null,
      },
    ];

    const result = computeAnalytics({
      period: 'thisWeek',
      sessions: mockSessions,
      plannedBlocks: mockPlannedBlocks,
      tasks: mockTasks,
      projects: [],
      goals: [],
      referenceDateMs: fixedRefMs,
    });

    expect(result.activeFocusSeconds).toBe(3600);
    expect(result.plannedSeconds).toBe(7200);
    expect(result.timeAccuracyPercentage).toBe(50); // 3600 / 7200 = 50%
    expect(result.taskCompletionRate).toBe(50); // 1 done / 2 scheduled = 50%
  });
});
