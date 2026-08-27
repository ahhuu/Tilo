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

  const dayStartMs = startOfDayMs;
  const dayEndMs = startOfDayMs + 86400000;

  // Filter items to only those belonging to or intersecting this specific day
  const dayPlannedBlocks = plannedBlocks.filter(
    (b) => !b.deletedAt && b.startAt < dayEndMs && b.endAt > dayStartMs
  );
  const daySessions = sessions.filter((s) => {
    if (s.deletedAt) return false;
    const sessionEndAt = s.endedAt || s.startedAt + Math.max(60000, (s.activeDurationSeconds || 0) * 1000);
    return s.startedAt < dayEndMs && sessionEndAt > dayStartMs;
  });

  // Auto-expand hours if day blocks fall outside default range (default 6:00 to 23:00)
  let startHour = options.startHour ?? 6;
  let endHour = options.endHour ?? 23;

  const allTimestamps: number[] = [];
  if (filter !== 'actual') {
    dayPlannedBlocks.forEach((b) => {
      allTimestamps.push(b.startAt, b.endAt);
    });
  }
  if (filter !== 'plan') {
    daySessions.forEach((s) => {
      allTimestamps.push(s.startedAt, s.endedAt || s.startedAt + (s.activeDurationSeconds || 0) * 1000);
    });
  }

  if (allTimestamps.length > 0) {
    const minTimestamp = Math.min(...allTimestamps);
    const maxTimestamp = Math.max(...allTimestamps);
    const minHour = new Date(minTimestamp).getHours();
    const maxHour = new Date(maxTimestamp).getHours() + 1;

    if (minHour < startHour) startHour = Math.max(0, minHour);
    if (maxHour > endHour) endHour = Math.min(24, maxHour);
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
    dayPlannedBlocks.forEach((block) => {
      const durationSeconds = Math.max(60, Math.round((block.endAt - block.startAt) / 1000));
      totalPlannedSeconds += durationSeconds;

      // Position relative to timeline range
      const clampedStart = Math.max(rangeStartMs, block.startAt);
      const clampedEnd = Math.min(rangeEndMs, Math.max(clampedStart + 60000, block.endAt));
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

  // 2. Process Actual Sessions (with Smart Session Coalescing for same-task micro-sessions)
  if (filter === 'all' || filter === 'actual') {
    // Sort chronologically
    const sortedSessions = [...daySessions].sort((a, b) => a.startedAt - b.startedAt);

    // Group adjacent or overlapping sessions for the same task/title within 15 mins
    const sessionGroups: Session[][] = [];
    sortedSessions.forEach((session) => {
      const isBackground = session.kind === 'background';
      if (isBackground && !includeBackgroundInMain) {
        // Background sessions are handled separately
        return;
      }

      if (sessionGroups.length === 0) {
        sessionGroups.push([session]);
        return;
      }

      const lastGroup = sessionGroups[sessionGroups.length - 1];
      const lastSession = lastGroup[lastGroup.length - 1];

      const isSameTask =
        (session.taskId && lastSession.taskId && session.taskId === lastSession.taskId) ||
        (!session.taskId && !lastSession.taskId && session.title === lastSession.title && session.projectId === lastSession.projectId);

      const lastEndMs =
        lastSession.endedAt ||
        lastSession.startedAt + Math.max(60000, (lastSession.activeDurationSeconds || 0) * 1000);

      // Coalesce if same task/title and within 15 minutes of each other
      const isCloseInTime = session.startedAt <= lastEndMs + 15 * 60 * 1000;

      if (isSameTask && isCloseInTime) {
        lastGroup.push(session);
      } else {
        sessionGroups.push([session]);
      }
    });

    // Also collect standalone background sessions
    if (!includeBackgroundInMain) {
      sortedSessions
        .filter((s) => s.kind === 'background')
        .forEach((session) => {
          const durationSeconds = session.activeDurationSeconds;
          const sessionEndAt =
            session.endedAt || session.startedAt + Math.max(60000, durationSeconds * 1000);
          const clampedStart = Math.max(rangeStartMs, session.startedAt);
          const clampedEnd = Math.min(rangeEndMs, Math.max(clampedStart + 60000, sessionEndAt));
          const topPercent = Math.max(0, ((clampedStart - rangeStartMs) / totalRangeMs) * 100);
          const heightPercent = Math.max(2.5, ((clampedEnd - clampedStart) / totalRangeMs) * 100);

          rawBgItems.push({
            id: session.id,
            itemType: 'session',
            sessionKind: session.kind,
            title: session.title || 'Background Session',
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
          });
        });
    }

    // Convert groups into layout items
    sessionGroups.forEach((group) => {
      const primary = group[0];
      const totalGroupActiveSeconds = group.reduce((acc, s) => acc + (s.activeDurationSeconds || 0), 0);
      totalActualSeconds += totalGroupActiveSeconds;

      const groupStartAt = Math.min(...group.map((s) => s.startedAt));
      const groupEndAt = Math.max(
        ...group.map((s) => s.endedAt || s.startedAt + Math.max(60000, (s.activeDurationSeconds || 0) * 1000))
      );

      const clampedStart = Math.max(rangeStartMs, groupStartAt);
      const clampedEnd = Math.min(rangeEndMs, Math.max(clampedStart + 60000, groupEndAt));
      const topPercent = Math.max(0, ((clampedStart - rangeStartMs) / totalRangeMs) * 100);
      const heightPercent = Math.max(2.5, ((clampedEnd - clampedStart) / totalRangeMs) * 100);

      const isCoalesced = group.length > 1;

      const layoutItem: TimelineEventLayoutItem = {
        id: isCoalesced ? `coalesced-${primary.id}-${group.length}` : primary.id,
        itemType: 'session',
        sessionKind: primary.kind,
        title: primary.title || (primary.kind === 'background' ? 'Background Session' : 'Active Session'),
        startAt: groupStartAt,
        endAt: groupEndAt,
        durationSeconds: totalGroupActiveSeconds,
        topPercent,
        heightPercent,
        leftOffsetPercent: 0,
        widthPercent: 100,
        isOverlapping: false,
        coalescedCount: group.length,
        coalescedSessions: group,
        projectId: primary.projectId,
        taskId: primary.taskId,
        originalEntity: primary,
      };

      rawMainItems.push(layoutItem);
    });
  }

  // Sort items chronologically by start time, then end time
  rawMainItems.sort((a, b) => a.startAt - b.startAt || a.endAt - b.endAt);

  // 3. Resolve Overlaps and Column Partitioning (Greedy Interval Scheduling with visual minimum collision buffer)
  let hasOverlaps = false;
  const clusters: TimelineEventLayoutItem[][] = [];

  rawMainItems.forEach((item) => {
    let placedInCluster = false;
    const itemVisualStart = item.startAt;
    const itemVisualEnd = Math.max(item.endAt, item.startAt + 15 * 60 * 1000); // minimum 15m collision window

    for (const cluster of clusters) {
      // Check if item overlaps visually with any existing item in this cluster
      const overlapsWithCluster = cluster.some((c) => {
        const cVisualStart = c.startAt;
        const cVisualEnd = Math.max(c.endAt, c.startAt + 15 * 60 * 1000);
        return itemVisualStart < cVisualEnd && itemVisualEnd > cVisualStart;
      });

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
      cluster.sort((a, b) => a.startAt - b.startAt || a.endAt - b.endAt);

      const columns: number[] = []; // Stores the latest visual endAt of each column
      cluster.forEach((item) => {
        const itemVisualEnd = Math.max(item.endAt, item.startAt + 15 * 60 * 1000);
        let placed = false;
        for (let colIdx = 0; colIdx < columns.length; colIdx++) {
          if (columns[colIdx] <= item.startAt) {
            columns[colIdx] = itemVisualEnd;
            item.overlapIndex = colIdx;
            placed = true;
            break;
          }
        }
        if (!placed) {
          item.overlapIndex = columns.length;
          columns.push(itemVisualEnd);
        }
      });

      const totalColumns = columns.length;
      cluster.forEach((item) => {
        item.isOverlapping = totalColumns > 1;
        item.overlapGroupSize = totalColumns;
        item.widthPercent = 100 / totalColumns;
        item.leftOffsetPercent = ((item.overlapIndex ?? 0) / totalColumns) * 100;
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
