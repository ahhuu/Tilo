import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TiloDB, ensureDefaultWorkspace } from '@/storage/db';
import {
  getOrCreateReviewDraft,
  completeReview,
  reopenReview,
  resolveLeftoverTasks,
  generateWeeklyStory,
} from '@/services/reviewCommands';
import { createTask } from '@/services/taskCommands';

describe('Review & Revision Lifecycle Engine', () => {
  let testDb: TiloDB;

  beforeEach(async () => {
    testDb = new TiloDB(`test-rev-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`);
    await ensureDefaultWorkspace(testDb);
  });

  afterEach(async () => {
    await testDb.delete();
  });

  it('resolves leftover tasks during Daily Close', async () => {
    const task = await createTask({ title: 'Finish API Draft', scheduledDate: '2026-08-21' }, testDb);

    // Resolve by moving to someday
    await resolveLeftoverTasks([{ taskId: task.id, action: 'someday' }], testDb);

    const updatedTask = await testDb.tasks.get(task.id);
    expect(updatedTask?.planningBucket).toBe('someday');
    expect(updatedTask?.scheduledDate).toBeUndefined();
  });

  it('completes review and maintains immutable revision snapshots', async () => {
    const draft = await getOrCreateReviewDraft(
      {
        type: 'weekly',
        periodKey: '2026-W34',
        periodStart: Date.now() - 7 * 86400000,
        periodEnd: Date.now(),
      },
      testDb
    );

    const { review: rev1, revision: snapshot1 } = await completeReview(
      {
        reviewId: draft.id,
        snapshotJson: { totalActiveSeconds: 7200, completedTasks: 4 },
        reflectionJson: { wins: 'Shipped V1 core' },
        storyText: 'Great focus week.',
      },
      testDb
    );

    expect(rev1.status).toBe('completed');
    expect(rev1.currentRevision).toBe(1);
    expect(snapshot1.revision).toBe(1);

    // Reopen and create revision 2
    await reopenReview(draft.id, testDb);
    const { review: rev2, revision: snapshot2 } = await completeReview(
      {
        reviewId: draft.id,
        snapshotJson: { totalActiveSeconds: 10800, completedTasks: 6 },
        reflectionJson: { wins: 'Shipped V1 core and analytics' },
        storyText: 'Updated focus week.',
      },
      testDb
    );

    expect(rev2.currentRevision).toBe(2);
    expect(snapshot2.revision).toBe(2);

    // Historical snapshot 1 remains intact
    const originalSnapshot = await testDb.reviewRevisions.get(snapshot1.id);
    expect((originalSnapshot?.snapshotJson as { totalActiveSeconds: number }).totalActiveSeconds).toBe(7200);
  });

  it('generates factual rule-based weekly story', async () => {
    const story = await generateWeeklyStory('2026-W34', 'ws-default', testDb);
    expect(story).toContain('During week 2026-W34');
  });
});
