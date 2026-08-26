import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DayView } from '@/components/calendar/DayView';
import { WeekView } from '@/components/calendar/WeekView';
import { AgendaView } from '@/components/calendar/AgendaView';

describe('Calendar Views Components', () => {
  it('renders DayView with hourly slots', () => {
    render(
      <DayView
        dateStr="2026-08-21"
        plannedBlocks={[]}
        sessions={[]}
        tasks={[]}
      />
    );
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('18:00')).toBeInTheDocument();
  });

  it('renders WeekView with 5-day columns', () => {
    const fixedMs = new Date('2026-08-21T12:00:00').getTime();
    render(
      <WeekView
        currentDateMs={fixedMs}
        daysCount={5}
        plannedBlocks={[]}
        sessions={[]}
        tasks={[]}
        onSlotClick={() => {}}
      />
    );
    expect(screen.getByText(/周一|Mon/)).toBeInTheDocument();
    expect(screen.getByText(/周五|Fri/)).toBeInTheDocument();
  });

  it('renders AgendaView with planned blocks and empty state', () => {
    render(
      <AgendaView
        plannedBlocks={[]}
        sessions={[]}
        tasks={[]}
      />
    );
    expect(screen.getByText(/暂无议程排期|No Agenda Items Scheduled/)).toBeInTheDocument();
  });
});
