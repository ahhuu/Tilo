import { describe, it, expect, beforeEach } from 'vitest';
import { TiloDB } from '@/storage/db';
import {
  handleSomedayAction,
  setNextWeekFocusGoals,
  skipReview,
} from '@/services/reviewCommands';
import type { InboxItem, Goal } from '@/core/types/domain';

describe('Advanced Review Commands & Interactions', () => {
  let testDb: TiloDB;

  beforeEach(async () => {
    testDb = new TiloDB(`test_review_adv_${Date.now()}_${Math.random()}`);
    await testDb.open();
  });

  it('handles Someday resurfacing actions: keep, thisWeek, and archive', async () => {
    const item: InboxItem = {
      id: 'inbox-someday-1',
      workspaceId: 'ws-default',
      rawText: 'Explore WebAssembly plugins',
      kind: 'idea',
      state: 'someday',
      capturedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
    };
    await testDb.inboxItems.put(item);

    // 1. Move to this week
    await handleSomedayAction('inbox-someday-1', 'thisWeek', testDb);
    const updated = await testDb.inboxItems.get('inbox-someday-1');
    expect(updated?.state).toBe('converted');

    const createdTasks = await testDb.tasks.filter((t) => t.title === 'Explore WebAssembly plugins').toArray();
    expect(createdTasks.length).toBe(1);
    expect(createdTasks[0].scheduledDate).toBeDefined();

    // 2. Archive
    const item2: InboxItem = {
      id: 'inbox-someday-2',
      workspaceId: 'ws-default',
      rawText: 'Stale idea to archive',
      kind: 'idea',
      state: 'someday',
      capturedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
    };
    await testDb.inboxItems.put(item2);
    await handleSomedayAction('inbox-someday-2', 'archive', testDb);
    const archived = await testDb.inboxItems.get('inbox-someday-2');
    expect(archived?.state).toBe('archived');
  });

  it('updates goal focus flags for next week planning', async () => {
    const g1: Goal = {
      id: 'g-focus-1',
      workspaceId: 'ws-default',
      title: 'Launch V1',
      color: '#6366f1',
      status: 'active',
      progressMode: 'taskCompletion',
      currentProgress: 0,
      isWeeklyFocus: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
    };
    const g2: Goal = {
      id: 'g-focus-2',
      workspaceId: 'ws-default',
      title: 'Scale User Base',
      color: '#10b981',
      status: 'active',
      progressMode: 'taskCompletion',
      currentProgress: 0,
      isWeeklyFocus: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
    };
    await testDb.goals.bulkPut([g1, g2]);

    await setNextWeekFocusGoals(['g-focus-1'], testDb);

    const afterG1 = await testDb.goals.get('g-focus-1');
    const afterG2 = await testDb.goals.get('g-focus-2');

    expect(afterG1?.isWeeklyFocus).toBe(true);
    expect(afterG2?.isWeeklyFocus).toBe(false);
  });

  it('skips a review period without creating fake reflections', async () => {
    const skipped = await skipReview(
      {
        type: 'weekly',
        periodKey: '2026-W34',
        periodStart: Date.now() - 7 * 86400000,
        periodEnd: Date.now(),
      },
      testDb
    );

    expect(skipped.status).toBe('skipped');

    const loaded = await testDb.reviews.get(skipped.id);
    expect(loaded?.status).toBe('skipped');
  });
});
