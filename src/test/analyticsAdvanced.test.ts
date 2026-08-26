import { describe, it, expect } from 'vitest';
import { computeAnalytics } from '@/services/analyticsService';
import type { Task, Session, PlannedBlock, Project, Goal, ActivityEvent } from '@/core/types/domain';

describe('Advanced Analytics Calculations & Distributions', () => {
  const now = new Date('2026-08-20T10:00:00Z').getTime(); // Thursday of ISO week

  const mockTasks: Task[] = [
    {
      id: 't-1',
      workspaceId: 'ws-default',
      title: 'Completed scheduled task',
      statusId: 'ws-task-done',
      priority: 'high',
      progressMode: 'binary',
      tagIds: [],
      scheduledDate: '2026-08-20',
      estimateMinutes: 60,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    },
    {
      id: 't-2',
      workspaceId: 'ws-default',
      title: 'Pending scheduled task',
      statusId: 'ws-task-todo',
      priority: 'medium',
      progressMode: 'binary',
      tagIds: [],
      scheduledDate: '2026-08-20',
      estimateMinutes: 30,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    },
  ];

  const mockBlocks: PlannedBlock[] = [
    {
      id: 'pb-1',
      workspaceId: 'ws-default',
      taskId: 't-1',
      type: 'task',
      startAt: now,
      endAt: now + 3600000, // 60 mins
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    },
  ];

  const mockSessions: Session[] = [
    {
      id: 's-1',
      workspaceId: 'ws-default',
      taskId: 't-1',
      plannedBlockId: 'pb-1',
      kind: 'active',
      source: 'timer',
      startedAt: now + 5 * 60 * 1000, // 5 min start delay (within 15m tolerance)
      activeDurationSeconds: 3600, // 60 mins
      elapsedDurationSeconds: 3600,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    },
    {
      id: 's-2',
      workspaceId: 'ws-default',
      kind: 'active',
      source: 'timer',
      startedAt: now + 4000000,
      activeDurationSeconds: 1800, // 30 mins unplanned
      elapsedDurationSeconds: 1800,
      title: 'Emergency bugfix',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    },
  ];

  const mockProjects: Project[] = [
    {
      id: 'p-1',
      workspaceId: 'ws-default',
      name: 'Project Alpha',
      color: '#6366f1',
      status: 'active',
      order: 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    },
  ];

  const mockGoals: Goal[] = [
    {
      id: 'g-1',
      workspaceId: 'ws-default',
      title: 'Goal One',
      color: '#10b981',
      status: 'active',
      progressMode: 'taskCompletion',
      currentProgress: 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    },
  ];

  const mockEvents: ActivityEvent[] = [
    {
      id: 'ev-1',
      workspaceId: 'ws-default',
      entityType: 'task',
      entityId: 't-2',
      eventType: 'TASK_RESCHEDULED',
      occurredAt: now,
      actor: 'user',
      payloadJson: { reason: 'Priority shifted' },
    },
  ];

  it('computes Schedule Accuracy, Completion Accuracy, and Overall Planning Accuracy', () => {
    const res = computeAnalytics({
      period: 'thisWeek',
      sessions: mockSessions,
      plannedBlocks: mockBlocks,
      tasks: mockTasks,
      projects: mockProjects,
      goals: mockGoals,
      activityEvents: mockEvents,
      referenceDateMs: now,
    });

    // Schedule Accuracy: s-1 started 5 mins late (<= 15m tolerance) -> 100%
    expect(res.scheduleAccuracyPercentage).toBe(100);
    expect(res.startDelay.onTimeCount).toBe(1);
    expect(res.startDelay.medianDelayMinutes).toBe(5);

    // Completion Accuracy: 1 completed out of 2 scheduled -> 50%
    expect(res.completionAccuracyPercentage).toBe(50);
    expect(res.taskCompletionRate).toBe(50);

    // Overall Planning Accuracy: mean of Time, Schedule, Completion
    expect(res.overallPlanningAccuracyPercentage).toBeGreaterThan(0);
  });

  it('computes Unplanned Work first-class metrics', () => {
    const res = computeAnalytics({
      period: 'thisWeek',
      sessions: mockSessions,
      plannedBlocks: mockBlocks,
      tasks: mockTasks,
      projects: mockProjects,
      goals: mockGoals,
      activityEvents: mockEvents,
      referenceDateMs: now,
    });

    expect(res.unplannedWork.unplannedSeconds).toBe(1800); // 30 mins
    expect(res.unplannedWork.unplannedPercentage).toBe(33); // 1800 / 5400 = 33%
    expect(res.unplannedWork.largestUnplannedSessions.length).toBe(1);
    expect(res.unplannedWork.largestUnplannedSessions[0].title).toBe('Emergency bugfix');
  });

  it('evaluates Estimate Accuracy buckets for completed tasks', () => {
    const res = computeAnalytics({
      period: 'thisWeek',
      sessions: mockSessions,
      plannedBlocks: mockBlocks,
      tasks: mockTasks,
      projects: mockProjects,
      goals: mockGoals,
      activityEvents: mockEvents,
      referenceDateMs: now,
    });

    // Task t-1 estimated 60m, actual 60m -> errorRatio 0 -> accurate
    expect(res.estimateAccuracy.evaluatedTasksCount).toBe(1);
    expect(res.estimateAccuracy.accurateCount).toBe(1);
    expect(res.estimateAccuracy.accuratePercentage).toBe(100);
    expect(res.estimateAccuracy.averageSignedErrorPercentage).toBe(0);
  });

  it('aggregates Rescheduling events and reasons without blame', () => {
    const res = computeAnalytics({
      period: 'thisWeek',
      sessions: mockSessions,
      plannedBlocks: mockBlocks,
      tasks: mockTasks,
      projects: mockProjects,
      goals: mockGoals,
      activityEvents: mockEvents,
      referenceDateMs: now,
    });

    expect(res.rescheduling.totalReschedules).toBe(1);
    expect(res.rescheduling.reasonsBreakdown[0].reason).toBe('Priority shifted');
    expect(res.rescheduling.mostRescheduledTasks[0].taskId).toBe('t-2');
  });
});
