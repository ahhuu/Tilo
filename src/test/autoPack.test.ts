import { describe, it, expect, beforeEach } from 'vitest';
import { TiloDB } from '@/storage/db';
import { generateAutoPackProposals, applyAutoPackProposals, undoAutoPack } from '@/services/autoPackService';
import { timeService } from '@/core/time/timeService';
import 'fake-indexeddb/auto';

describe('Smart Auto-Pack Service', () => {
  let db: TiloDB;
  const testDate = '2026-08-27';

  beforeEach(async () => {
    db = new TiloDB(`test-autopack-${Math.random()}`);
    await db.open();

    const dayStart = timeService.getStartOfLogicalDay(testDate);

    // Create existing planned block from 10:00 to 11:00 (60m)
    await db.plannedBlocks.put({
      id: 'existing-block-1',
      workspaceId: 'default',
      type: 'activity',
      title: 'Morning Meeting',
      startAt: dayStart + 10 * 60 * 60 * 1000,
      endAt: dayStart + 11 * 60 * 60 * 1000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
    });

    // Create tasks of different priorities
    await db.tasks.bulkPut([
      {
        id: 'task-urgent-1',
        workspaceId: 'default',
        title: 'Fix critical bug',
        statusId: 'todo',
        priority: 'urgent',
        progressMode: 'binary',
        estimateMinutes: 45,
        tagIds: [],
        createdAt: 1000,
        updatedAt: 1000,
        deletedAt: null,
      },
      {
        id: 'task-high-1',
        workspaceId: 'default',
        title: 'Prepare presentation',
        statusId: 'todo',
        priority: 'high',
        progressMode: 'binary',
        estimateMinutes: 30,
        dueDate: '2026-08-27',
        tagIds: [],
        createdAt: 2000,
        updatedAt: 2000,
        deletedAt: null,
      },
      {
        id: 'task-low-1',
        workspaceId: 'default',
        title: 'Clean desktop notes',
        statusId: 'todo',
        priority: 'low',
        progressMode: 'binary',
        estimateMinutes: 20,
        tagIds: [],
        createdAt: 3000,
        updatedAt: 3000,
        deletedAt: null,
      },
    ]);
  });

  it('generates auto-pack proposals fitting free gaps in priority order', async () => {
    const result = await generateAutoPackProposals(
      {
        dateKey: testDate,
        workdayStartHour: 9,
        workdayEndHour: 18,
        bufferMinutes: 5,
        startFromCurrentTimeIfToday: false,
      },
      db
    );

    expect(result.proposals.length).toBe(3);
    // Urgent task should be packed first in 09:00 gap
    expect(result.proposals[0].taskId).toBe('task-urgent-1');
    expect(result.proposals[0].estimateMinutes).toBe(45);

    // High task should be next
    expect(result.proposals[1].taskId).toBe('task-high-1');

    // Low task packed
    expect(result.proposals[2].taskId).toBe('task-low-1');
  });

  it('applies proposals and creates planned blocks in Dexie transaction', async () => {
    const { proposals } = await generateAutoPackProposals(
      {
        dateKey: testDate,
        workdayStartHour: 9,
        workdayEndHour: 18,
        startFromCurrentTimeIfToday: false,
      },
      db
    );

    const createdBlocks = await applyAutoPackProposals(proposals, db);
    expect(createdBlocks.length).toBe(3);

    const savedBlocks = await db.plannedBlocks
      .filter((b) => !b.deletedAt)
      .toArray();

    // 1 pre-existing + 3 new = 4
    expect(savedBlocks.length).toBe(4);

    // Test undo
    const blockIds = createdBlocks.map((b) => b.id);
    await undoAutoPack(blockIds, db);

    const remainingActive = await db.plannedBlocks
      .filter((b) => !b.deletedAt)
      .toArray();
    expect(remainingActive.length).toBe(1);
    expect(remainingActive[0].id).toBe('existing-block-1');
  });
});
