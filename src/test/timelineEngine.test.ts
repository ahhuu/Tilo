import { describe, it, expect } from 'vitest';
import {
  calculateTimelineLayout,
  calculateDailyCapacity,
  calculateAllocationBreakdown,
  getPlanActualComparison,
  snapTimestamp,
} from '@/core/timeline/timelineEngine';
import type { PlannedBlock, Session, Project, Goal } from '@/core/types/domain';

describe('Timeline Engine & Core Calculators', () => {
  const startOfDayMs = new Date('2026-08-21T00:00:00').getTime();

  it('snaps timestamps accurately to 15-minute boundaries', () => {
    const t1 = new Date('2026-08-21T09:07:00').getTime();
    const snapped1 = snapTimestamp(t1, 15);
    expect(new Date(snapped1).getMinutes()).toBe(0);

    const t2 = new Date('2026-08-21T09:08:00').getTime();
    const snapped2 = snapTimestamp(t2, 15);
    expect(new Date(snapped2).getMinutes()).toBe(15);
  });

  it('calculates layout coordinates and detects overlapping items', () => {
    const block1: PlannedBlock = {
      id: 'b1',
      workspaceId: 'ws-default',
      type: 'task',
      title: 'Block 1',
      startAt: startOfDayMs + 9 * 3600000, // 09:00
      endAt: startOfDayMs + 10.5 * 3600000, // 10:30
      createdAt: startOfDayMs,
      updatedAt: startOfDayMs,
      deletedAt: null,
    };

    const block2: PlannedBlock = {
      id: 'b2',
      workspaceId: 'ws-default',
      type: 'focus',
      title: 'Deep Work',
      startAt: startOfDayMs + 10 * 3600000, // 10:00 (overlaps with b1)
      endAt: startOfDayMs + 11 * 3600000, // 11:00
      createdAt: startOfDayMs,
      updatedAt: startOfDayMs,
      deletedAt: null,
    };

    const result = calculateTimelineLayout({
      startOfDayMs,
      plannedBlocks: [block1, block2],
      sessions: [],
      filter: 'all',
    });

    expect(result.mainItems.length).toBe(2);
    expect(result.hasOverlaps).toBe(true);
    expect(result.mainItems[0].isOverlapping).toBe(true);
    expect(result.mainItems[1].isOverlapping).toBe(true);
    expect(result.mainItems[0].widthPercent).toBeLessThanOrEqual(50);
  });

  it('calculates daily capacity correctly with weekday defaults and per-day overrides', () => {
    const plannedBlocks: PlannedBlock[] = [
      {
        id: 'b1',
        workspaceId: 'ws-default',
        type: 'task',
        title: 'Task Plan',
        startAt: startOfDayMs + 9 * 3600000,
        endAt: startOfDayMs + 13 * 3600000, // 4 hours = 240m
        createdAt: startOfDayMs,
        updatedAt: startOfDayMs,
        deletedAt: null,
      },
    ];

    // Weekday standard: 480m (8h)
    const cap1 = calculateDailyCapacity('2026-08-21', plannedBlocks, {
      weekdayMinutes: 480,
      weekendMinutes: 240,
      overrides: {},
    });

    expect(cap1.plannedMinutes).toBe(240);
    expect(cap1.capacityMinutes).toBe(480);
    expect(cap1.percentUsed).toBe(50);
    expect(cap1.isOverCapacity).toBe(false);

    // Override capacity to 180m (3h) -> should be over capacity
    const cap2 = calculateDailyCapacity('2026-08-21', plannedBlocks, {
      weekdayMinutes: 480,
      weekendMinutes: 240,
      overrides: { '2026-08-21': 180 },
    });

    expect(cap2.capacityMinutes).toBe(180);
    expect(cap2.isOverCapacity).toBe(true);
    expect(cap2.hasOverride).toBe(true);
  });

  it('calculates time allocation breakdown by project and goal', () => {
    const projects: Project[] = [
      {
        id: 'p1',
        workspaceId: 'ws-default',
        name: 'Tilo Dev',
        color: '#6366f1',
        primaryGoalId: 'g1',
        status: 'active',
        order: 1,
        createdAt: startOfDayMs,
        updatedAt: startOfDayMs,
      },
    ];

    const goals: Goal[] = [
      {
        id: 'g1',
        workspaceId: 'ws-default',
        title: 'Ship V1',
        status: 'active',
        progressMode: 'milestones',
        currentProgress: 50,
        createdAt: startOfDayMs,
        updatedAt: startOfDayMs,
      },
    ];

    const plannedBlocks: PlannedBlock[] = [
      {
        id: 'b1',
        workspaceId: 'ws-default',
        projectId: 'p1',
        type: 'task',
        title: 'Build Timeline',
        startAt: startOfDayMs + 9 * 3600000,
        endAt: startOfDayMs + 11 * 3600000, // 2h = 7200s
        createdAt: startOfDayMs,
        updatedAt: startOfDayMs,
        deletedAt: null,
      },
    ];

    const allocation = calculateAllocationBreakdown(plannedBlocks, [], projects, goals);
    expect(allocation.projectAllocations.length).toBe(1);
    expect(allocation.projectAllocations[0].name).toBe('Tilo Dev');
    expect(allocation.projectAllocations[0].percentage).toBe(100);
    expect(allocation.goalAllocations.length).toBe(1);
    expect(allocation.goalAllocations[0].name).toBe('Ship V1');
  });

  it('calculates plan vs actual difference and variance', () => {
    const block: PlannedBlock = {
      id: 'b1',
      workspaceId: 'ws-default',
      taskId: 't1',
      type: 'task',
      title: 'Planned Task',
      startAt: startOfDayMs + 9 * 3600000,
      endAt: startOfDayMs + 10 * 3600000, // 1 hour = 3600s
      createdAt: startOfDayMs,
      updatedAt: startOfDayMs,
      deletedAt: null,
    };

    const session: Session = {
      id: 's1',
      workspaceId: 'ws-default',
      taskId: 't1',
      plannedBlockId: 'b1',
      title: 'Executed Task',
      kind: 'active',
      source: 'timer',
      startedAt: startOfDayMs + 9 * 3600000,
      endedAt: startOfDayMs + 10.5 * 3600000,
      activeDurationSeconds: 5400, // 1.5 hours (overrun by 30m)
      elapsedDurationSeconds: 5400,
      createdAt: startOfDayMs,
      updatedAt: startOfDayMs,
    };

    const comp = getPlanActualComparison(block, [session]);
    expect(comp.planDurationSeconds).toBe(3600);
    expect(comp.actualDurationSeconds).toBe(5400);
    expect(comp.diffSeconds).toBe(1800); // +30m variance
    expect(comp.sessionCount).toBe(1);
  });
});
