import { describe, it, expect, beforeEach } from 'vitest';
import { TiloDB } from '@/storage/db';
import {
  captureInboxItem,
  convertInboxToTodayTask,
  convertInboxToThisWeekTask,
  markInboxAsIdea,
} from '@/services/inboxCommands';

describe('Inbox Continuous Processing Commands', () => {
  let testDb: TiloDB;

  beforeEach(async () => {
    testDb = new TiloDB(`test_inbox_cont_${Date.now()}_${Math.random()}`);
    await testDb.open();
  });

  it('converts an inbox item directly to a task for Today', async () => {
    const item = await captureInboxItem({ rawText: 'Fix broken navigation link' }, testDb);
    expect(item.state).toBe('unsorted');

    const res = await convertInboxToTodayTask(item.id, testDb);
    expect(res.item.state).toBe('converted');
    expect(res.task.title).toBe('Fix broken navigation link');
    expect(res.task.scheduledDate).toBeDefined();

    const storedTask = await testDb.tasks.get(res.task.id);
    expect(storedTask?.title).toBe('Fix broken navigation link');
  });

  it('converts an inbox item directly to a task for This Week', async () => {
    const item = await captureInboxItem({ rawText: 'Research database sharding' }, testDb);

    const res = await convertInboxToThisWeekTask(item.id, testDb);
    expect(res.item.state).toBe('converted');
    expect(res.task.title).toBe('Research database sharding');
    expect(res.task.scheduledDate).toBeDefined();
  });

  it('marks an inbox item as idea and retains in someday', async () => {
    const item = await captureInboxItem({ rawText: 'Novel caching strategy' }, testDb);

    const updated = await markInboxAsIdea(item.id, testDb);
    expect(updated.kind).toBe('idea');
    expect(updated.state).toBe('someday');

    const stored = await testDb.inboxItems.get(item.id);
    expect(stored?.kind).toBe('idea');
    expect(stored?.state).toBe('someday');
  });
});
