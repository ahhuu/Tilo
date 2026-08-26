import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TiloDB, ensureDefaultWorkspace } from '@/storage/db';
import { TodayTimeline } from '@/components/today/TodayTimeline';
import { timeService } from '@/core/time/timeService';

describe('TodayTimeline Component', () => {
  let testDb: TiloDB;

  beforeEach(async () => {
    testDb = new TiloDB(`test-timeline-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`);
    await ensureDefaultWorkspace(testDb);
  });

  afterEach(async () => {
    await testDb.delete();
  });

  it('renders hour grid slots and summary header', () => {
    const logicalDate = timeService.getLogicalDate();

    render(<TodayTimeline logicalDate={logicalDate} tasks={[]} />);

    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('14:00')).toBeInTheDocument();
    expect(screen.getByText(/全部|Plan\+Actual|All/)).toBeInTheDocument();
  });
});
