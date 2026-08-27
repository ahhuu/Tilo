import { describe, it, expect, beforeEach } from 'vitest';
import { TiloDB } from '@/storage/db';
import {
  checkSessionOverflow,
  elasticPushSubsequentBlocks,
  calculateGhostEndTime,
} from '@/services/elasticPushService';
import { timeService } from '@/core/time/timeService';
import type { PlannedBlock, Task } from '@/core/types/domain';

describe('Elastic Push & Ghost Timebox Service', () => {
  let testDb: TiloDB;

  beforeEach(async () => {
    testDb = new TiloDB(`test-push-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
    await testDb.workspaces.add({
      id: 'ws-default',
      workspaceId: 'ws-default',
      name: 'Default Workspace',
      settings: {
        timezone: 'UTC',
        dayStartMinutes: 240,
        weekStartDay: 1,
        focusCountLimit: 3,
        theme: 'dark',
        density: 'comfortable',
        motionLevel: 'balanced',
        backupReminderDays: 7,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });

  it('detects session overflow when elapsed time exceeds block duration', () => {
    const plannedBlocks: PlannedBlock[] = [
      {
        id: 'block-1',
        workspaceId: 'ws-default',
        type: 'task',
        title: 'Deep Coding',
        startAt: 1000000,
        endAt: 1000000 + 30 * 60000, // 30 minutes
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    // Running session at 45 minutes elapsed (exceeds 30 min by 15 min)
    const session = {
      startedAt: 1000000,
      elapsedSeconds: 45 * 60,
    };

    const overflow = checkSessionOverflow(session, plannedBlocks);
    expect(overflow.isOverflowing).toBe(true);
    expect(overflow.overflowMinutes).toBe(15);
    expect(overflow.blockTitle).toBe('Deep Coding');
  });

  it('shifts subsequent blocks downstream when elastic push is triggered', async () => {
    const today = timeService.getLogicalDate();
    const baseTime = timeService.getStartOfLogicalDay(today) + 10 * 3600000; // 10:00 AM

    await testDb.plannedBlocks.bulkAdd([
      {
        id: 'b1',
        workspaceId: 'ws-default',
        type: 'task',
        title: 'Block 1',
        startAt: baseTime,
        endAt: baseTime + 30 * 60000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'b2',
        workspaceId: 'ws-default',
        type: 'task',
        title: 'Block 2',
        startAt: baseTime + 40 * 60000,
        endAt: baseTime + 70 * 60000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]);

    // Push subsequent blocks starting after block 1 by 20 minutes
    const affectedCount = await elasticPushSubsequentBlocks(today, baseTime + 30 * 60000, 20, testDb);
    expect(affectedCount).toBe(1);

    const updatedB2 = await testDb.plannedBlocks.get('b2');
    expect(updatedB2?.startAt).toBe(baseTime + 60 * 60000); // 40 + 20 = 60m
    expect(updatedB2?.endAt).toBe(baseTime + 90 * 60000); // 70 + 20 = 90m
  });

  it('calculates ghost end time based on variance ratio', () => {
    const block: PlannedBlock = {
      id: 'b1',
      workspaceId: 'ws-default',
      type: 'task',
      title: 'Writing Docs',
      startAt: 1000000,
      endAt: 1000000 + 40 * 60000, // 40 min planned
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const task: Task = {
      id: 'task-1',
      workspaceId: 'ws-default',
      title: 'Writing Docs',
      statusId: 'ws-task-todo',
      priority: 'medium',
      progressMode: 'binary',
      tagIds: [],
      estimateMinutes: 40,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // With 1.25x variance ratio: 40m * 1.25 = 50m (+10m ghost)
    const ghostEnd = calculateGhostEndTime(block, task, 1.25);
    expect(ghostEnd).toBe(1000000 + 50 * 60000);
  });
});
