import type { PlannedBlock, Session, Project, Goal } from '@/core/types/domain';
import type {
  TimelineFilter,
  TimelineEventLayoutItem,
  DailyCapacityConfig,
  AllocationItem,
  PlanActualComparison,
} from './types';

/**
 * Snaps a timestamp to the nearest interval in minutes (e.g. 15m or 5m).
 */
export function snapTimestamp(timestampMs: number, intervalMinutes: number = 15): number {
  const intervalMs = intervalMinutes * 60 * 1000;
  return Math.round(timestampMs / intervalMs) * intervalMs;
}

export interface CalculateLayoutOptions {
  startOfDayMs: number;
  startHour?: number; // default 7 (07:00)
  endHour?: number; // default 21 (21:00)
  plannedBlocks: PlannedBlock[];
  sessions: Session[];
  filter: TimelineFilter;
  includeBackgroundInMain?: boolean;
}

export interface TimelineLayoutResult {
  startHour: number;
  endHour: number;
  mainItems: TimelineEventLayoutItem[];
  backgroundItems: TimelineEventLayoutItem[];
  hasOverlaps: boolean;
  totalPlannedSeconds: number;
  totalActualSeconds: number;
}

/**
 * Calculates visual coordinate positions and overlap columns for timeline items.
 */
export function calculateTimelineLayout(options: CalculateLayoutOptions): TimelineLayoutResult {
  const {
    startOfDayMs,
    plannedBlocks,
    sessions,
    filter,
    includeBackgroundInMain = false,
  } = options;

  // Auto-expand hours if blocks fall outside default range
  let startHour = options.startHour ?? 7;
  let endHour = options.endHour ?? 21;

  const allTimestamps: number[] = [];
  if (filter !== 'actual') {
    plannedBlocks.forEach((b) => {
      allTimestamps.push(b.startAt, b.endAt);
    });
  }
  if (filter !== 'plan') {
    sessions.forEach((s) => {
      allTimestamps.push(s.startedAt, s.endedAt || s.startedAt + s.activeDurationSeconds * 1000);
    });
  }

  if (allTimestamps.length > 0) {
    const minTimestamp = Math.min(...allTimestamps);
    const maxTimestamp = Math.max(...allTimestamps);
    const minHour = new Date(minTimestamp).getHours();
    const maxHour = new Date(maxTimestamp).getHours() + 1;

    if (minHour < startHour) startHour = Math.max(0, minHour - 1);
    if (maxHour > endHour) endHour = Math.min(24, maxHour + 1);
  }

  const rangeStartMs = startOfDayMs + startHour * 3600000;
  const rangeEndMs = startOfDayMs + endHour * 3600000;
  const totalRangeMs = Math.max(3600000, rangeEndMs - rangeStartMs);

  const rawMainItems: TimelineEventLayoutItem[] = [];
  const rawBgItems: TimelineEventLayoutItem[] = [];

  let totalPlannedSeconds = 0;
  let totalActualSeconds = 0;

  // 1. Process Planned Blocks
  if (filter === 'all' || filter === 'plan') {
    plannedBlocks.forEach((block) => {
      if (block.deletedAt) return;
      const durationSeconds = Math.max(60, Math.round((block.endAt - block.startAt) / 1000));
      totalPlannedSeconds += durationSeconds;

      // Position relative to timeline range
      const clampedStart = Math.max(rangeStartMs, block.startAt);
      const clampedEnd = Math.min(rangeEndMs, Math.max(block.startAt + 60000, block.endAt));
      const topPercent = Math.max(0, ((clampedStart - rangeStartMs) / totalRangeMs) * 100);
      const heightPercent = Math.max(2.5, ((clampedEnd - clampedStart) / totalRangeMs) * 100);

      rawMainItems.push({
        id: block.id,
        itemType: 'plan',
        blockType: block.type,
        title: block.title || (block.type === 'focus' ? 'Focus Block' : 'Planned Block'),
        startAt: block.startAt,
        endAt: block.endAt,
        durationSeconds,
        topPercent,
        heightPercent,
        leftOffsetPercent: 0,
        widthPercent: 100,
        isOverlapping: false,
        projectId: block.projectId,
        taskId: block.taskId,
        originalEntity: block,
      });
    });
  }

  // 2. Process Actual Sessions
  if (filter === 'all' || filter === 'actual') {
    sessions.forEach((session) => {
      const isBackground = session.kind === 'background';
      const durationSeconds = session.activeDurationSeconds;
      if (!isBackground) {
        totalActualSeconds += durationSeconds;
      }

      const sessionEndAt =
        session.endedAt || session.startedAt + Math.max(60000, durationSeconds * 1000);
      const clampedStart = Math.max(rangeStartMs, session.startedAt);
      const clampedEnd = Math.min(rangeEndMs, Math.max(session.startedAt + 60000, sessionEndAt));
      const topPercent = Math.max(0, ((clampedStart - rangeStartMs) / totalRangeMs) * 100);
      const heightPercent = Math.max(2.5, ((clampedEnd - clampedStart) / totalRangeMs) * 100);

      const layoutItem: TimelineEventLayoutItem = {
        id: session.id,
        itemType: 'session',
        sessionKind: session.kind,
        title: session.title || (isBackground ? 'Background Session' : 'Active Session'),
        startAt: session.startedAt,
        endAt: sessionEndAt,
        durationSeconds,
        topPercent,
        heightPercent,
        leftOffsetPercent: 0,
        widthPercent: 100,
        isOverlapping: false,
        projectId: session.projectId,
        taskId: session.taskId,
        originalEntity: session,
      };

      if (isBackground && !includeBackgroundInMain) {
        rawBgItems.push(layoutItem);
      } else {
        rawMainItems.push(layoutItem);
      }
    });
  }

  // Sort items chronologically
  rawMainItems.sort((a, b) => a.startAt - b.startAt || a.endAt - b.endAt);

  // 3. Resolve Overlaps and Horizontal Column Stacking
  let hasOverlaps = false;
  const clusters: TimelineEventLayoutItem[][] = [];

  rawMainItems.forEach((item) => {
    let placedInCluster = false;
    for (const cluster of clusters) {
      // Check if item overlaps with any item in the cluster
      const overlapsWithCluster = cluster.some(
        (c) => item.startAt < c.endAt && item.endAt > c.startAt
      );
      if (overlapsWithCluster) {
        cluster.push(item);
        placedInCluster = true;
        break;
      }
    }
    if (!placedInCluster) {
      clusters.push([item]);
    }
  });

  // Assign column width and offsets within each overlap cluster
  clusters.forEach((cluster) => {
    if (cluster.length > 1) {
      hasOverlaps = true;
      const count = cluster.length;
      cluster.forEach((item, index) => {
        item.isOverlapping = true;
        item.overlapGroupSize = count;
        item.overlapIndex = index;
        item.widthPercent = Math.max(30, 100 / count);
        item.leftOffsetPercent = (index / count) * 100;
      });
    }
  });

  return {
    startHour,
    endHour,
    mainItems: rawMainItems,
    backgroundItems: rawBgItems,
    hasOverlaps,
    totalPlannedSeconds,
    totalActualSeconds,
  };
}

/**
 * Calculates daily capacity and progress against daily limits or overrides.
 */
export function calculateDailyCapacity(
  dateStr: string,
  plannedBlocks: PlannedBlock[],
  config: DailyCapacityConfig = {
    weekdayMinutes: 480, // 8h
    weekendMinutes: 240, // 4h
    overrides: {},
  }
) {
  const dateObj = new Date(`${dateStr}T12:00:00`);
  const dayOfWeek = dateObj.getDay(); // 0 = Sun, 6 = Sat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const targetMinutes =
    config.overrides[dateStr] !== undefined
      ? config.overrides[dateStr]
      : isWeekend
        ? config.weekendMinutes
        : config.weekdayMinutes;

  const totalPlannedMinutes = plannedBlocks.reduce((acc, b) => {
    if (b.deletedAt) return acc;
    return acc + Math.round((b.endAt - b.startAt) / 60000);
  }, 0);

  const percentUsed = targetMinutes > 0 ? Math.round((totalPlannedMinutes / targetMinutes) * 100) : 0;
  const isOverCapacity = totalPlannedMinutes > targetMinutes;

  return {
    capacityMinutes: targetMinutes,
    plannedMinutes: totalPlannedMinutes,
    percentUsed,
    isOverCapacity,
    isWeekend,
    hasOverride: config.overrides[dateStr] !== undefined,
  };
}

/**
 * Calculates time allocation breakdown grouped by Project and Goal.
 */
export function calculateAllocationBreakdown(
  plannedBlocks: PlannedBlock[],
  _sessions: Session[],
  projects: Project[],
  goals: Goal[]
): { projectAllocations: AllocationItem[]; goalAllocations: AllocationItem[] } {
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const goalMap = new Map(goals.map((g) => [g.id, g]));

  // Project map accumulators
  const projSecondsMap = new Map<string, number>();
  let totalSeconds = 0;

  plannedBlocks.forEach((b) => {
    if (b.deletedAt) return;
    const dur = Math.max(0, Math.round((b.endAt - b.startAt) / 1000));
    const projId = b.projectId || 'unassigned';
    projSecondsMap.set(projId, (projSecondsMap.get(projId) || 0) + dur);
    totalSeconds += dur;
  });

  const projectAllocations: AllocationItem[] = [];
  const goalSecondsMap = new Map<string, number>();

  projSecondsMap.forEach((duration, projId) => {
    const proj = projectMap.get(projId);
    const name = proj ? proj.name : projId === 'unassigned' ? '未归类项目 (General)' : 'Unknown';
    const color = proj ? proj.color : '#94a3b8';
    const percentage = totalSeconds > 0 ? Math.round((duration / totalSeconds) * 100) : 0;

    projectAllocations.push({
      id: projId,
      name,
      color,
      durationSeconds: duration,
      percentage,
    });

    if (proj?.primaryGoalId) {
      goalSecondsMap.set(
        proj.primaryGoalId,
        (goalSecondsMap.get(proj.primaryGoalId) || 0) + duration
      );
    }
  });

  projectAllocations.sort((a, b) => b.durationSeconds - a.durationSeconds);

  const goalAllocations: AllocationItem[] = [];
  goalSecondsMap.forEach((duration, goalId) => {
    const goal = goalMap.get(goalId);
    if (!goal) return;
    const percentage = totalSeconds > 0 ? Math.round((duration / totalSeconds) * 100) : 0;
    goalAllocations.push({
      id: goalId,
      name: goal.title,
      color: goal.color || '#6366f1',
      durationSeconds: duration,
      percentage,
    });
  });

  goalAllocations.sort((a, b) => b.durationSeconds - a.durationSeconds);

  return { projectAllocations, goalAllocations };
}

/**
 * Calculates difference between a PlannedBlock and actual Sessions executed against it or its task.
 */
export function getPlanActualComparison(
  block: PlannedBlock,
  sessions: Session[]
): PlanActualComparison {
  const planDurationSeconds = Math.max(0, Math.round((block.endAt - block.startAt) / 1000));

  // Find sessions matching this block directly or by task
  const matchingSessions = sessions.filter(
    (s) => s.plannedBlockId === block.id || (block.taskId && s.taskId === block.taskId)
  );

  const actualDurationSeconds = matchingSessions.reduce(
    (acc, s) => acc + s.activeDurationSeconds,
    0
  );

  const diffSeconds = actualDurationSeconds - planDurationSeconds;

  return {
    planTitle: block.title || 'Planned Block',
    planStartAt: block.startAt,
    planEndAt: block.endAt,
    planDurationSeconds,
    actualDurationSeconds,
    diffSeconds,
    sessionCount: matchingSessions.length,
  };
}
