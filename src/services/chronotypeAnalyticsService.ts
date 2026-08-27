import { db, type TiloDB } from '@/storage/db';
import { timeService } from '@/core/time/timeService';
import { format, subDays } from 'date-fns';

export interface HeatmapDay {
  dateKey: string;
  totalMinutes: number;
  sessionCount: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface FocusHeatmapResult {
  days: HeatmapDay[];
  totalMinutes: number;
  activeDaysCount: number;
  maxDailyMinutes: number;
  currentStreak: number;
  longestStreak: number;
}

export interface HourlyDistributionItem {
  hour: number; // 0 to 23
  totalMinutes: number;
  percent: number; // 0 to 100
}

export interface ChronotypeMatrixResult {
  hourlyDistribution: HourlyDistributionItem[];
  peakHour: number;
  peakWindow: string; // e.g. "09:00 - 11:00"
  totalTrackedHours: number;
}

/**
 * Aggregates 365-day focus activity heatmap matrix.
 */
export async function getFocusHeatmapData(
  daysCount = 365,
  database: TiloDB = db
): Promise<FocusHeatmapResult> {
  const allSessions = await database.sessions
    .filter((s) => !s.deletedAt)
    .toArray();

  const dayMap = new Map<string, { totalSeconds: number; count: number }>();

  for (const s of allSessions) {
    if (!s.startedAt) continue;
    const dateKey = timeService.getLogicalDate(s.startedAt);
    const existing = dayMap.get(dateKey) || { totalSeconds: 0, count: 0 };
    existing.totalSeconds += s.activeDurationSeconds || 0;
    existing.count += 1;
    dayMap.set(dateKey, existing);
  }

  const today = new Date();
  const days: HeatmapDay[] = [];
  let grandTotalMinutes = 0;
  let activeDays = 0;
  let maxMinutes = 0;

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = subDays(today, i);
    const dateKey = format(d, 'yyyy-MM-dd');
    const record = dayMap.get(dateKey);
    const mins = record ? Math.round(record.totalSeconds / 60) : 0;
    const count = record ? record.count : 0;

    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (mins >= 180) level = 4;
    else if (mins >= 90) level = 3;
    else if (mins >= 30) level = 2;
    else if (mins > 0) level = 1;

    if (mins > 0) {
      activeDays++;
      grandTotalMinutes += mins;
      if (mins > maxMinutes) maxMinutes = mins;
    }

    days.push({
      dateKey,
      totalMinutes: mins,
      sessionCount: count,
      level,
    });
  }

  // Calculate streaks
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  for (let i = 0; i < days.length; i++) {
    if (days[i].totalMinutes > 0) {
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  // Current streak (walking backwards from today)
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].totalMinutes > 0) {
      currentStreak++;
    } else {
      // If today has 0, check if yesterday was active
      if (i === days.length - 1) continue;
      break;
    }
  }

  return {
    days,
    totalMinutes: grandTotalMinutes,
    activeDaysCount: activeDays,
    maxDailyMinutes: maxMinutes,
    currentStreak,
    longestStreak,
  };
}

/**
 * Analyzes hourly focus frequency across past N days to calculate Chronotype peak productivity windows.
 */
export async function getChronotypeMatrixData(
  daysRange = 30,
  database: TiloDB = db
): Promise<ChronotypeMatrixResult> {
  const cutoffTimestamp = Date.now() - daysRange * 24 * 60 * 60 * 1000;

  const sessions = await database.sessions
    .filter((s) => !s.deletedAt && (s.startedAt || 0) >= cutoffTimestamp)
    .toArray();

  const hourlyMinutes = new Array(24).fill(0);

  for (const s of sessions) {
    if (!s.startedAt || !s.activeDurationSeconds) continue;
    const startHour = new Date(s.startedAt).getHours();
    const durationMins = Math.round(s.activeDurationSeconds / 60);
    hourlyMinutes[startHour] += durationMins;
  }

  const totalTrackedMinutes = hourlyMinutes.reduce((a, b) => a + b, 0);
  const maxHourMinutes = Math.max(1, ...hourlyMinutes);

  const distribution: HourlyDistributionItem[] = hourlyMinutes.map((mins, hour) => ({
    hour,
    totalMinutes: mins,
    percent: Math.round((mins / maxHourMinutes) * 100),
  }));

  // Find peak 2-hour window
  let bestWindowScore = 0;
  let bestStartHour = 9; // default 09:00

  for (let h = 0; h < 23; h++) {
    const score = hourlyMinutes[h] + hourlyMinutes[h + 1];
    if (score > bestWindowScore) {
      bestWindowScore = score;
      bestStartHour = h;
    }
  }

  const peakWindow = `${bestStartHour.toString().padStart(2, '0')}:00 - ${(bestStartHour + 2).toString().padStart(2, '0')}:00`;

  return {
    hourlyDistribution: distribution,
    peakHour: bestStartHour,
    peakWindow,
    totalTrackedHours: Math.round((totalTrackedMinutes / 60) * 10) / 10,
  };
}
