import { describe, it, expect, beforeEach } from 'vitest';
import { TiloDB } from '@/storage/db';
import {
  createRecurringPlanSeries,
  deleteRecurrenceSeries,
} from '@/services/planCommands';

describe('Recurring Schedules & Materialization', () => {
  let testDb: TiloDB;

  beforeEach(async () => {
    testDb = new TiloDB(`test_tilo_recur_${Date.now()}_${Math.random()}`);
    await testDb.open();
  });

  it('creates recurring schedule series and materializes occurrences', async () => {
    const result = await createRecurringPlanSeries(
      {
        frequency: 'weekly',
        interval: 1,
        weekdays: [1, 3, 5], // Mon, Wed, Fri
        startsOn: '2026-08-24', // Monday
        title: 'Team Sync & Focus',
        type: 'focus',
        startHour: 10,
        durationMinutes: 60,
      },
      testDb
    );

    expect(result.seriesId).toBeDefined();
    expect(result.generatedCount).toBeGreaterThan(0);

    const savedSeries = await testDb.recurrenceSeries.get(result.seriesId);
    expect(savedSeries).toBeDefined();
    expect(savedSeries?.frequency).toBe('weekly');

    const generatedBlocks = await testDb.plannedBlocks
      .where('recurrenceSeriesId')
      .equals(result.seriesId)
      .toArray();

    expect(generatedBlocks.length).toBe(result.generatedCount);
    expect(generatedBlocks[0].title).toBe('Team Sync & Focus');
    expect(generatedBlocks[0].type).toBe('focus');
  });

  it('deletes recurring schedule series and cascades to all its occurrences', async () => {
    const result = await createRecurringPlanSeries(
      {
        frequency: 'daily',
        interval: 1,
        startsOn: '2026-08-24',
        title: 'Daily Standup',
        type: 'activity',
        startHour: 9,
        durationMinutes: 30,
      },
      testDb
    );

    const blocksBefore = await testDb.plannedBlocks
      .where('recurrenceSeriesId')
      .equals(result.seriesId)
      .toArray();
    expect(blocksBefore.length).toBeGreaterThan(0);

    await deleteRecurrenceSeries(result.seriesId, testDb);

    const seriesAfter = await testDb.recurrenceSeries.get(result.seriesId);
    expect(seriesAfter).toBeUndefined();

    const blocksAfter = await testDb.plannedBlocks
      .where('recurrenceSeriesId')
      .equals(result.seriesId)
      .toArray();
    expect(blocksAfter.length).toBe(0);
  });
});
