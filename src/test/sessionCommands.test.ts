import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TiloDB, ensureDefaultWorkspace } from '@/storage/db';
import {
  startSession,
  pauseSession,
  resumeSession,
  finishSession,
} from '@/services/sessionCommands';

describe('Session Domain Commands & Segments', () => {
  let testDb: TiloDB;

  beforeEach(async () => {
    testDb = new TiloDB(`test-sess-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`);
    await ensureDefaultWorkspace(testDb);
  });

  afterEach(async () => {
    await testDb.delete();
  });

  it('handles start, pause, resume, and finish lifecycle with active segments', async () => {
    const session = await startSession({ title: 'Deep coding session' }, testDb);
    expect(session.id).toBeDefined();
    expect(session.kind).toBe('active');

    const initialSegments = await testDb.sessionSegments
      .where('sessionId')
      .equals(session.id)
      .toArray();
    expect(initialSegments.length).toBe(1);
    expect(initialSegments[0].type).toBe('active');
    expect(initialSegments[0].endAt).toBeUndefined();

    // Pause session
    await pauseSession(session.id, testDb);
    const pausedSegments = await testDb.sessionSegments
      .where('sessionId')
      .equals(session.id)
      .toArray();
    expect(pausedSegments.length).toBe(2);
    expect(pausedSegments[0].endAt).toBeDefined();
    expect(pausedSegments[1].type).toBe('paused');
    expect(pausedSegments[1].endAt).toBeUndefined();

    // Resume session
    await resumeSession(session.id, testDb);
    const resumedSegments = await testDb.sessionSegments
      .where('sessionId')
      .equals(session.id)
      .toArray();
    expect(resumedSegments.length).toBe(3);
    expect(resumedSegments[1].endAt).toBeDefined();
    expect(resumedSegments[2].type).toBe('active');

    // Finish session
    const finished = await finishSession(session.id, testDb);
    expect(finished.endedAt).toBeDefined();
    expect(finished.activeDurationSeconds).toBeGreaterThanOrEqual(0);

    const finalSegments = await testDb.sessionSegments
      .where('sessionId')
      .equals(session.id)
      .toArray();
    expect(finalSegments.every((s) => !!s.endAt)).toBe(true);
  });
});
