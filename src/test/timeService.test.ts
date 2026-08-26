import { describe, it, expect } from 'vitest';
import { TimeService, FrozenClock } from '@/core/time/timeService';

describe('Central TimeService', () => {
  it('calculates standard logical date with default 00:00 cutoff', () => {
    // 2026-08-21 14:30:00 UTC
    const fixedMs = new Date('2026-08-21T14:30:00Z').getTime();
    const clock = new FrozenClock(fixedMs);
    const service = new TimeService({ clock, dayStartMinutes: 0 });

    expect(service.getLogicalDate()).toBe('2026-08-21');
    expect(service.getWeekKey()).toBe('2026-W34');
  });

  it('correctly maps early morning hours before dayStart cutoff to previous logical day', () => {
    // 2026-08-22 02:30:00 (Saturday 2:30 AM)
    const fixedMs = new Date('2026-08-22T02:30:00').getTime();
    const clock = new FrozenClock(fixedMs);
    // 04:00 AM cutoff = 240 minutes
    const service = new TimeService({ clock, dayStartMinutes: 240 });

    // At 2:30 AM before 4:00 AM cutoff, it is still logically Friday Aug 21
    expect(service.getLogicalDate()).toBe('2026-08-21');

    // Advance clock to 04:30 AM on Aug 22
    clock.advanceByMinutes(120);
    // Now after 4:00 AM cutoff, it becomes Saturday Aug 22
    expect(service.getLogicalDate()).toBe('2026-08-22');
  });

  it('formats duration in seconds concisely and factually', () => {
    const service = new TimeService();
    expect(service.formatDuration(45)).toBe('45s');
    expect(service.formatDuration(300)).toBe('5m');
    expect(service.formatDuration(3600)).toBe('1h');
    expect(service.formatDuration(5400)).toBe('1h 30m');
  });

  it('calculates week boundaries for Monday-start and Sunday-start weeks', () => {
    const fixedMs = new Date('2026-08-21T12:00:00').getTime(); // Friday
    const clock = new FrozenClock(fixedMs);

    // Monday start
    const serviceMonday = new TimeService({ clock, weekStartDay: 1 });
    const boundsMon = serviceMonday.getWeekBounds();
    expect(boundsMon.weekKey).toBe('2026-W34');

    // Sunday start
    const serviceSunday = new TimeService({ clock, weekStartDay: 0 });
    const boundsSun = serviceSunday.getWeekBounds();
    expect(boundsSun.weekKey).toBe('2026-W34');
  });
});
