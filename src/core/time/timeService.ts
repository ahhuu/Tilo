import {
  format,
  startOfWeek,
  endOfWeek,
  startOfDay,
  addDays,
  getISOWeek,
  getISOWeekYear,
} from 'date-fns';

export interface Clock {
  now(): number;
}

export class SystemClock implements Clock {
  now(): number {
    return Date.now();
  }
}

export class FrozenClock implements Clock {
  private currentMs: number;

  constructor(initialMs: number) {
    this.currentMs = initialMs;
  }

  now(): number {
    return this.currentMs;
  }

  setTime(ms: number): void {
    this.currentMs = ms;
  }

  advanceByMs(ms: number): void {
    this.currentMs += ms;
  }

  advanceByMinutes(mins: number): void {
    this.currentMs += mins * 60 * 1000;
  }

  advanceByDays(days: number): void {
    this.currentMs += days * 24 * 60 * 60 * 1000;
  }
}

export interface TimeServiceOptions {
  clock?: Clock;
  timezone?: string;
  dayStartMinutes?: number; // e.g. 240 for 04:00 AM cutoff
  weekStartDay?: 0 | 1; // 0 for Sunday, 1 for Monday
}

export class TimeService {
  private clock: Clock;
  private timezone: string;
  private dayStartMinutes: number;
  private weekStartDay: 0 | 1;

  constructor(options: TimeServiceOptions = {}) {
    this.clock = options.clock ?? new SystemClock();
    this.timezone =
      options.timezone ??
      (typeof Intl !== 'undefined'
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : 'UTC');
    this.dayStartMinutes = options.dayStartMinutes ?? 0;
    this.weekStartDay = options.weekStartDay ?? 1; // Default Monday
  }

  setOptions(options: Partial<TimeServiceOptions>): void {
    if (options.clock) this.clock = options.clock;
    if (options.timezone) this.timezone = options.timezone;
    if (options.dayStartMinutes !== undefined) this.dayStartMinutes = options.dayStartMinutes;
    if (options.weekStartDay !== undefined) this.weekStartDay = options.weekStartDay;
  }

  getClock(): Clock {
    return this.clock;
  }

  setClock(clock: Clock): void {
    this.clock = clock;
  }

  getTimezone(): string {
    return this.timezone;
  }

  setTimezone(tz: string): void {
    this.timezone = tz;
  }

  getDayStartMinutes(): number {
    return this.dayStartMinutes;
  }

  setDayStartMinutes(minutes: number): void {
    this.dayStartMinutes = minutes;
  }

  getWeekStartDay(): 0 | 1 {
    return this.weekStartDay;
  }

  setWeekStartDay(day: 0 | 1): void {
    this.weekStartDay = day;
  }

  /**
   * Returns current epoch ms from the clock
   */
  now(): number {
    return this.clock.now();
  }

  /**
   * Returns Date instance of current time
   */
  currentDate(): Date {
    return new Date(this.clock.now());
  }

  /**
   * Calculates the logical date string (YYYY-MM-DD) for a given instant or now,
   * accounting for the dayStartMinutes cutoff.
   * e.g., If dayStartMinutes is 240 (04:00 AM), 02:30 AM on 2026-08-22 maps to 2026-08-21.
   */
  getLogicalDate(instantMs: number = this.now()): string {
    // Shift backward by dayStartMinutes
    const shiftedMs = instantMs - this.dayStartMinutes * 60 * 1000;
    const date = new Date(shiftedMs);
    return format(date, 'yyyy-MM-dd');
  }

  /**
   * Returns the ISO week key string (e.g. "2026-W34") for a given instant or now.
   */
  getWeekKey(instantMs: number = this.now()): string {
    const logicalDate = this.getLogicalDate(instantMs);
    const date = new Date(logicalDate + 'T12:00:00');
    const weekNumber = getISOWeek(date);
    const weekYear = getISOWeekYear(date);
    return `${weekYear}-W${weekNumber.toString().padStart(2, '0')}`;
  }

  /**
   * Returns the start of logical day in epoch ms.
   */
  getStartOfLogicalDay(dateStr: string = this.getLogicalDate()): number {
    const baseDate = new Date(`${dateStr}T00:00:00`);
    const dayStartMs = startOfDay(baseDate).getTime();
    return dayStartMs + this.dayStartMinutes * 60 * 1000;
  }

  /**
   * Returns the end of logical day in epoch ms.
   */
  getEndOfLogicalDay(dateStr: string = this.getLogicalDate()): number {
    const nextDay = addDays(new Date(`${dateStr}T00:00:00`), 1);
    const nextDayStartMs = startOfDay(nextDay).getTime();
    return nextDayStartMs + this.dayStartMinutes * 60 * 1000 - 1;
  }

  /**
   * Returns the ISO week number for a given date or current time.
   */
  getWeekNumber(date: Date = new Date(this.now())): number {
    return getISOWeek(date);
  }

  /**
   * Returns the week start date string (e.g. "Aug 18" or "8月18日")
   */
  getWeekStartDate(dateStr: string = this.getLogicalDate(), lang: string = 'en'): string {
    const date = new Date(`${dateStr}T12:00:00`);
    const start = startOfWeek(date, { weekStartsOn: this.weekStartDay });
    if (lang === 'zh-CN') {
      return `${start.getMonth() + 1}月${start.getDate()}日`;
    }
    return format(start, 'MMM d');
  }

  /**
   * Returns the week end date string (e.g. "Aug 24" or "8月24日")
   */
  getWeekEndDate(dateStr: string = this.getLogicalDate(), lang: string = 'en'): string {
    const date = new Date(`${dateStr}T12:00:00`);
    const end = endOfWeek(date, { weekStartsOn: this.weekStartDay });
    if (lang === 'zh-CN') {
      return `${end.getMonth() + 1}月${end.getDate()}日`;
    }
    return format(end, 'MMM d');
  }

  /**
   * Returns formatted week label (e.g. "8月17日 – 8月23日 (第34周)" or "Aug 17 – Aug 23 (Week 34)")
   */
  getWeekLabel(dateStr: string = this.getLogicalDate(), lang: string = 'en'): string {
    const weekNumber = this.getWeekNumber(new Date(`${dateStr}T12:00:00`));
    const startStr = this.getWeekStartDate(dateStr, lang);
    const endStr = this.getWeekEndDate(dateStr, lang);
    if (lang === 'zh-CN') {
      return `${startStr} – ${endStr} (第${weekNumber}周)`;
    }
    return `${startStr} – ${endStr} (Week ${weekNumber})`;
  }

  /**
   * Formats date range (e.g. "Aug 18 – Aug 24")
   */
  formatDateRange(startDateStr: string, endDateStr: string): string {
    return `${startDateStr} – ${endDateStr}`;
  }

  /**
   * Returns start and end timestamps for the week containing the given date.
   */
  getWeekBounds(instantMs: number = this.now()): { startAt: number; endAt: number; weekKey: string } {
    const logicalDate = this.getLogicalDate(instantMs);
    const date = new Date(`${logicalDate}T12:00:00`);
    const weekStartsOn = this.weekStartDay;

    const start = startOfWeek(date, { weekStartsOn });
    const end = endOfWeek(date, { weekStartsOn });

    const startDateStr = format(start, 'yyyy-MM-dd');
    const endDateStr = format(end, 'yyyy-MM-dd');

    return {
      startAt: this.getStartOfLogicalDay(startDateStr),
      endAt: this.getEndOfLogicalDay(endDateStr),
      weekKey: this.getWeekKey(instantMs),
    };
  }

  /**
   * Formats duration in seconds into human-readable string (e.g. "1h 45m" or "45s")
   */
  formatDuration(totalSeconds: number): string {
    if (totalSeconds < 60) {
      return `${Math.max(0, Math.floor(totalSeconds))}s`;
    }
    const mins = Math.floor(totalSeconds / 60);
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;

    if (hours === 0) {
      return `${remainingMins}m`;
    }
    if (remainingMins === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMins}m`;
  }

  /**
   * Formats time (e.g. "14:30")
   */
  formatTime(instantMs: number): string {
    return format(new Date(instantMs), 'HH:mm');
  }

  /**
   * Formats full date (e.g. "8月22日 星期六" or "Friday, Aug 21")
   */
  formatDateHeader(dateStr: string = this.getLogicalDate(), lang: string = 'zh-CN'): string {
    const date = new Date(`${dateStr}T12:00:00`);
    if (lang === 'zh-CN') {
      const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const weekday = weekdays[date.getDay()];
      return `${month}月${day}日 ${weekday}`;
    }
    return format(date, 'EEEE, MMM d');
  }

  /**
   * Converts a date string + time string into an epoch timestamp
   */
  parseDateTime(dateStr: string, timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(`${dateStr}T00:00:00`);
    date.setHours(hours || 0, minutes || 0, 0, 0);
    return date.getTime();
  }
}

// Global default singleton time service
export const timeService = new TimeService();
