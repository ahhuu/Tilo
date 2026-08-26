import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TiloDB } from '@/storage/db';
import { seedDemoData } from '@/storage/seed';

describe('Deterministic Demo Data Seeder', () => {
  let testDb: TiloDB;

  beforeEach(() => {
    testDb = new TiloDB(`test-seed-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`);
  });

  afterEach(async () => {
    await testDb.delete();
  });

  it('populates realistic demo workspace deterministically', async () => {
    await seedDemoData(testDb);

    const goals = await testDb.goals.toArray();
    const projects = await testDb.projects.toArray();
    const tasks = await testDb.tasks.toArray();
    const plannedBlocks = await testDb.plannedBlocks.toArray();
    const sessions = await testDb.sessions.toArray();
    const inboxItems = await testDb.inboxItems.toArray();
    const dailyFocus = await testDb.dailyFocus.toArray();
    const weeklyFocus = await testDb.weeklyFocus.toArray();

    expect(goals.length).toBe(2);
    expect(projects.length).toBe(2);
    expect(tasks.length).toBe(3);
    expect(plannedBlocks.length).toBe(2);
    expect(sessions.length).toBe(1);
    expect(inboxItems.length).toBe(2);
    expect(dailyFocus.length).toBe(2);
    expect(weeklyFocus.length).toBe(2);
  });
});
