import { describe, it, expect, beforeEach } from 'vitest';
import { TiloDB } from '@/storage/db';
import { getFocusHeatmapData, getChronotypeMatrixData } from '@/services/chronotypeAnalyticsService';
import 'fake-indexeddb/auto';

describe('Chronotype & Focus Heatmap Service', () => {
  let db: TiloDB;

  beforeEach(async () => {
    db = new TiloDB(`test-chronotype-${Math.random()}`);
    await db.open();

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    // Create session records across different days and hours
    await db.sessions.bulkPut([
      {
        id: 'session-1',
        workspaceId: 'default',
        kind: 'active',
        source: 'timer',
        startedAt: now - 2 * oneDay, // 2 days ago
        activeDurationSeconds: 60 * 60, // 60 mins
        elapsedDurationSeconds: 60 * 60,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      {
        id: 'session-2',
        workspaceId: 'default',
        kind: 'active',
        source: 'timer',
        startedAt: now - oneDay, // yesterday
        activeDurationSeconds: 120 * 60, // 120 mins
        elapsedDurationSeconds: 120 * 60,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      {
        id: 'session-3',
        workspaceId: 'default',
        kind: 'active',
        source: 'timer',
        startedAt: now, // today
        activeDurationSeconds: 45 * 60, // 45 mins
        elapsedDurationSeconds: 45 * 60,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
    ]);
  });

  it('aggregates 365-day focus activity heatmap properly', async () => {
    const data = await getFocusHeatmapData(30, db);
    expect(data.days.length).toBe(30);
    expect(data.activeDaysCount).toBeGreaterThanOrEqual(3);
    expect(data.totalMinutes).toBe(60 + 120 + 45);
    expect(data.maxDailyMinutes).toBe(120);
    expect(data.currentStreak).toBeGreaterThanOrEqual(1);
  });

  it('calculates 24-hour chronotype peak window', async () => {
    const matrix = await getChronotypeMatrixData(30, db);
    expect(matrix.hourlyDistribution.length).toBe(24);
    expect(matrix.totalTrackedHours).toBeGreaterThan(0);
    expect(matrix.peakWindow).toBeDefined();
  });
});
