import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TiloDB, ensureDefaultWorkspace } from '@/storage/db';
import { startSession, finishSession } from '@/services/sessionCommands';

describe('Active vs Background Sessions', () => {
  let testDb: TiloDB;

  beforeEach(async () => {
    testDb = new TiloDB(`test-sesstype-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`);
    await ensureDefaultWorkspace(testDb);
  });

  afterEach(async () => {
    await testDb.delete();
  });

  it('differentiates active foreground session from background session', async () => {
    const active = await startSession({ title: 'Coding Foreground', kind: 'active' }, testDb);
    const bg = await startSession({ title: 'Compile in Background', kind: 'background' }, testDb);

    expect(active.kind).toBe('active');
    expect(bg.kind).toBe('background');

    const finishedActive = await finishSession(active.id, testDb);
    const finishedBg = await finishSession(bg.id, testDb);

    expect(finishedActive.endedAt).toBeDefined();
    expect(finishedBg.endedAt).toBeDefined();
  });
});
