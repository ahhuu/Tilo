import { timeService } from '@/core/time/timeService';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
  format,
  eachDayOfInterval,
} from 'date-fns';
import type {
  Task,
  Session,
  PlannedBlock,
  Project,
  Goal,
  ActivityEvent,
} from '@/core/types/domain';

export type AnalyticsPeriod = 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth';

export interface PeriodBounds {
  startMs: number;
  endMs: number;
  label: string;
  days: { dateStr: string; dayName: string }[];
}

export function getPeriodBounds(
  period: AnalyticsPeriod,
  referenceDateMs: number = Date.now(),
  lang: string = 'en'
): PeriodBounds {
  const refDate = new Date(referenceDateMs);

  let startDate: Date;
  let endDate: Date;
  let label: string;

  if (period === 'thisWeek') {
    startDate = startOfWeek(refDate, { weekStartsOn: 1 });
    endDate = endOfWeek(refDate, { weekStartsOn: 1 });
    label =
      lang === 'zh-CN'
        ? `本周 (${startDate.getMonth() + 1}月${startDate.getDate()}日 – ${endDate.getMonth() + 1}月${endDate.getDate()}日)`
        : `This Week (${format(startDate, 'MMM d')} – ${format(endDate, 'MMM d')})`;
  } else if (period === 'lastWeek') {
    const lastWeekDate = subWeeks(refDate, 1);
    startDate = startOfWeek(lastWeekDate, { weekStartsOn: 1 });
    endDate = endOfWeek(lastWeekDate, { weekStartsOn: 1 });
    label =
      lang === 'zh-CN'
        ? `上周 (${startDate.getMonth() + 1}月${startDate.getDate()}日 – ${endDate.getMonth() + 1}月${endDate.getDate()}日)`
        : `Last Week (${format(startDate, 'MMM d')} – ${format(endDate, 'MMM d')})`;
  } else if (period === 'thisMonth') {
    startDate = startOfMonth(refDate);
    endDate = endOfMonth(refDate);
    label =
      lang === 'zh-CN'
        ? `本月 (${startDate.getFullYear()}年${startDate.getMonth() + 1}月)`
        : `This Month (${format(startDate, 'MMMM yyyy')})`;
  } else {
    // lastMonth
    const lastMonthDate = subMonths(refDate, 1);
    startDate = startOfMonth(lastMonthDate);
    endDate = endOfMonth(lastMonthDate);
    label =
      lang === 'zh-CN'
        ? `上月 (${startDate.getFullYear()}年${startDate.getMonth() + 1}月)`
        : `Last Month (${format(startDate, 'MMMM yyyy')})`;
  }

  const firstDayStr = format(startDate, 'yyyy-MM-dd');
  const lastDayStr = format(endDate, 'yyyy-MM-dd');
  const startMs = timeService.getStartOfLogicalDay(firstDayStr);
  const endMs = timeService.getStartOfLogicalDay(lastDayStr) + 86400000;

  const intervalDays = eachDayOfInterval({ start: startDate, end: endDate });
  const days = intervalDays.map((d) => ({
    dateStr: format(d, 'yyyy-MM-dd'),
    dayName: format(d, 'EEE'),
  }));

  return {
    startMs,
    endMs,
    label,
    days,
  };
}

export type TimeAllocationDimension = 'project' | 'goal' | 'priority' | 'tag';

export interface AllocationItem {
  id: string;
  name: string;
  color: string;
  activeSeconds: number;
  percentage: number;
}

export interface StartDelayStats {
  linkedSessionsCount: number;
  onTimeCount: number;
  onTimePercentage: number;
  lessThan15MinLateCount: number;
  between15And30MinLateCount: number;
  moreThan30MinLateCount: number;
  medianDelayMinutes: number;
  averageDelayMinutes: number;
}

export interface EstimateAccuracyStats {
  evaluatedTasksCount: number;
  accurateCount: number;
  accuratePercentage: number;
  underestimatedCount: number;
  underestimatedPercentage: number;
  overestimatedCount: number;
  overestimatedPercentage: number;
  averageSignedErrorPercentage: number;
  medianAbsoluteErrorPercentage: number;
}

export interface ReschedulingStats {
  totalReschedules: number;
  reasonsBreakdown: { reason: string; count: number; percentage: number }[];
  mostRescheduledTasks: { taskId: string; taskTitle: string; count: number }[];
}

export interface UnplannedWorkStats {
  unplannedSeconds: number;
  unplannedPercentage: number;
  largestUnplannedSessions: {
    sessionId: string;
    title: string;
    durationSeconds: number;
    startedAt: number;
  }[];
}

export interface CapacityDayAnalysis {
  dateStr: string;
  dayName: string;
  capacitySeconds: number;
  plannedSeconds: number;
  actualSeconds: number;
  isOverCapacity: boolean;
}

export interface CapacityStats {
  dailyCapacityBreakdown: CapacityDayAnalysis[];
  daysPlannedAboveCapacityCount: number;
  totalCapacitySeconds: number;
  totalPlannedSeconds: number;
  totalActualSeconds: number;
}

export interface AnalyticsSummary {
  // 1. Headline Metrics
  activeFocusSeconds: number;
  plannedSeconds: number;
  timeAccuracyPercentage: number;
  scheduleAccuracyPercentage: number;
  completionAccuracyPercentage: number;
  overallPlanningAccuracyPercentage: number;
  taskCompletionRate: number;
  completedTasksCount: number;
  totalTasksCount: number;

  // 2. Daily breakdown
  dailyBreakdown: {
    dateStr: string;
    dayName: string;
    planSeconds: number;
    actualSeconds: number;
  }[];

  // 3. Multi-dimensional Time Allocation
  projectBreakdown: AllocationItem[];
  goalBreakdown: AllocationItem[];
  priorityBreakdown: AllocationItem[];
  tagBreakdown: AllocationItem[];

  // 4. Advanced Analytics & Distributions
  unplannedWork: UnplannedWorkStats;
  capacity: CapacityStats;
  startDelay: StartDelayStats;
  estimateAccuracy: EstimateAccuracyStats;
  rescheduling: ReschedulingStats;
}

export interface ComputeAnalyticsParams {
  period: AnalyticsPeriod;
  sessions: Session[];
  plannedBlocks: PlannedBlock[];
  tasks: Task[];
  projects: Project[];
  goals: Goal[];
  activityEvents?: ActivityEvent[];
  referenceDateMs?: number;
  weekdayCapacityHours?: number;
  weekendCapacityHours?: number;
}

export function computeAnalytics(params: ComputeAnalyticsParams): AnalyticsSummary {
  const {
    period,
    sessions,
    plannedBlocks,
    tasks,
    projects,
    goals,
    activityEvents = [],
    referenceDateMs,
    weekdayCapacityHours = 8,
    weekendCapacityHours = 4,
  } = params;

  const bounds = getPeriodBounds(period, referenceDateMs);
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const goalMap = new Map(goals.map((g) => [g.id, g]));

  // 1. Filter sessions in period (Foreground active sessions only)
  const periodSessions = sessions.filter(
    (s) =>
      !s.deletedAt &&
      s.kind === 'active' &&
      s.startedAt >= bounds.startMs &&
      s.startedAt < bounds.endMs
  );

  const activeFocusSeconds = periodSessions.reduce(
    (sum, s) => sum + (s.activeDurationSeconds || 0),
    0
  );

  // 2. Filter planned blocks in period
  const periodBlocks = plannedBlocks.filter(
    (b) => !b.deletedAt && b.startAt >= bounds.startMs && b.startAt < bounds.endMs
  );

  const plannedSeconds = periodBlocks.reduce(
    (sum, b) => sum + Math.max(0, Math.floor((b.endAt - b.startAt) / 1000)),
    0
  );

  // 3. Time Accuracy Formula (Master Plan Section 12.8)
  // For each linked Plan/Actual pair: accuracy = 1 - abs(actual - planned) / max(actual, planned), aggregate weighted by planned
  let totalWeightedAccuracy = 0;
  let totalPairedPlannedDuration = 0;

  for (const block of periodBlocks) {
    const blockDuration = Math.max(0, Math.floor((block.endAt - block.startAt) / 1000));
    if (blockDuration <= 0) continue;

    // Find linked sessions
    const linkedSessions = periodSessions.filter(
      (s) => s.plannedBlockId === block.id || (block.taskId && s.taskId === block.taskId)
    );
    const actualDuration = linkedSessions.reduce((sum, s) => sum + s.activeDurationSeconds, 0);

    const maxDur = Math.max(actualDuration, blockDuration);
    const pairAccuracy = maxDur > 0 ? Math.max(0, 1 - Math.abs(actualDuration - blockDuration) / maxDur) : 1;

    totalWeightedAccuracy += pairAccuracy * blockDuration;
    totalPairedPlannedDuration += blockDuration;
  }

  let timeAccuracyPercentage = 0;
  if (totalPairedPlannedDuration > 0) {
    timeAccuracyPercentage = Math.round((totalWeightedAccuracy / totalPairedPlannedDuration) * 100);
  } else if (plannedSeconds === 0) {
    timeAccuracyPercentage = activeFocusSeconds > 0 ? 100 : 100;
  } else {
    timeAccuracyPercentage = Math.min(100, Math.round((activeFocusSeconds / plannedSeconds) * 100));
  }

  // 4. Schedule Accuracy (Master Plan Section 12.8: % of linked sessions starting within 15 min tolerance)
  const TOLERANCE_MS = 15 * 60 * 1000;
  const startDelaysMinutes: number[] = [];
  let onTimeSessionsCount = 0;
  let lessThan15LateCount = 0;
  let between15And30LateCount = 0;
  let moreThan30LateCount = 0;
  let linkedSessionsTotal = 0;

  for (const session of periodSessions) {
    let matchingBlock: PlannedBlock | undefined;
    if (session.plannedBlockId) {
      matchingBlock = periodBlocks.find((b) => b.id === session.plannedBlockId);
    }
    if (!matchingBlock && session.taskId) {
      matchingBlock = periodBlocks.find((b) => b.taskId === session.taskId);
    }

    if (matchingBlock) {
      linkedSessionsTotal++;
      const delayMs = session.startedAt - matchingBlock.startAt;
      const delayMinutes = Math.round(delayMs / 60000);
      startDelaysMinutes.push(delayMinutes);

      if (delayMs <= 0 || delayMs <= 5 * 60 * 1000) {
        onTimeSessionsCount++;
      } else if (delayMs <= TOLERANCE_MS) {
        lessThan15LateCount++;
      } else if (delayMs <= 30 * 60 * 1000) {
        between15And30LateCount++;
      } else {
        moreThan30LateCount++;
      }
    }
  }

  const scheduleAccuracyPercentage =
    linkedSessionsTotal > 0
      ? Math.round(((onTimeSessionsCount + lessThan15LateCount) / linkedSessionsTotal) * 100)
      : 100;

  // 5. Completion Accuracy (Scheduled tasks completed in period)
  const dayDateSet = new Set(bounds.days.map((d) => d.dateStr));
  const periodTasks = tasks.filter(
    (t) =>
      !t.deletedAt &&
      t.scheduledDate &&
      dayDateSet.has(t.scheduledDate)
  );

  const completedTasks = periodTasks.filter((t) => t.statusId === 'ws-task-done');
  const completionAccuracyPercentage =
    periodTasks.length > 0
      ? Math.round((completedTasks.length / periodTasks.length) * 100)
      : 100;

  const taskCompletionRate =
    periodTasks.length > 0
      ? Math.round((completedTasks.length / periodTasks.length) * 100)
      : 0;

  // 6. Overall Planning Accuracy (Master Plan Section 12.8: Mean of normalized components)
  const overallPlanningAccuracyPercentage = Math.round(
    (timeAccuracyPercentage + scheduleAccuracyPercentage + completionAccuracyPercentage) / 3
  );

  // 7. Start Delay Distribution
  startDelaysMinutes.sort((a, b) => a - b);
  const medianDelayMinutes =
    startDelaysMinutes.length > 0
      ? startDelaysMinutes[Math.floor(startDelaysMinutes.length / 2)]
      : 0;
  const averageDelayMinutes =
    startDelaysMinutes.length > 0
      ? Math.round(
          startDelaysMinutes.reduce((sum, d) => sum + Math.max(0, d), 0) /
            startDelaysMinutes.length
        )
      : 0;

  const startDelay: StartDelayStats = {
    linkedSessionsCount: linkedSessionsTotal,
    onTimeCount: onTimeSessionsCount,
    onTimePercentage:
      linkedSessionsTotal > 0 ? Math.round((onTimeSessionsCount / linkedSessionsTotal) * 100) : 100,
    lessThan15MinLateCount: lessThan15LateCount,
    between15And30MinLateCount: between15And30LateCount,
    moreThan30MinLateCount: moreThan30LateCount,
    medianDelayMinutes,
    averageDelayMinutes,
  };

  // 8. Unplanned Work (Master Plan Section 12.10)
  const unplannedSessionsList: {
    sessionId: string;
    title: string;
    durationSeconds: number;
    startedAt: number;
  }[] = [];

  let unplannedSeconds = 0;
  for (const session of periodSessions) {
    const isPlanned = Boolean(
      session.plannedBlockId ||
        (session.taskId && periodBlocks.some((b) => b.taskId === session.taskId))
    );
    if (!isPlanned) {
      unplannedSeconds += session.activeDurationSeconds;
      const t = session.taskId ? taskMap.get(session.taskId) : undefined;
      unplannedSessionsList.push({
        sessionId: session.id,
        title: session.title || t?.title || 'Ad-hoc Focus Session',
        durationSeconds: session.activeDurationSeconds,
        startedAt: session.startedAt,
      });
    }
  }

  unplannedSessionsList.sort((a, b) => b.durationSeconds - a.durationSeconds);
  const unplannedPercentage =
    activeFocusSeconds > 0 ? Math.round((unplannedSeconds / activeFocusSeconds) * 100) : 0;

  const unplannedWork: UnplannedWorkStats = {
    unplannedSeconds,
    unplannedPercentage,
    largestUnplannedSessions: unplannedSessionsList.slice(0, 5),
  };

  // 9. Capacity Analysis (Master Plan Section 12.11)
  let daysPlannedAboveCapacityCount = 0;
  let totalCapacitySeconds = 0;

  const dailyCapacityBreakdown: CapacityDayAnalysis[] = bounds.days.map((d, index) => {
    const dayStart = timeService.getStartOfLogicalDay(d.dateStr);
    const dayEnd = dayStart + 86400000;

    // Check if weekend (index 5 = Saturday, 6 = Sunday in ISO Monday week)
    const isWeekend = index === 5 || index === 6;
    const capacityHours = isWeekend ? weekendCapacityHours : weekdayCapacityHours;
    const capacitySec = capacityHours * 3600;
    totalCapacitySeconds += capacitySec;

    const dayBlocks = periodBlocks.filter((b) => b.startAt >= dayStart && b.startAt < dayEnd);
    const daySessions = periodSessions.filter(
      (s) => s.startedAt >= dayStart && s.startedAt < dayEnd
    );

    const dayPlanSec = dayBlocks.reduce(
      (sum, b) => sum + Math.max(0, Math.floor((b.endAt - b.startAt) / 1000)),
      0
    );
    const dayActualSec = daySessions.reduce(
      (sum, s) => sum + (s.activeDurationSeconds || 0),
      0
    );

    const isOver = dayPlanSec > capacitySec;
    if (isOver) {
      daysPlannedAboveCapacityCount++;
    }

    return {
      dateStr: d.dateStr,
      dayName: d.dayName,
      capacitySeconds: capacitySec,
      plannedSeconds: dayPlanSec,
      actualSeconds: dayActualSec,
      isOverCapacity: isOver,
    };
  });

  const capacity: CapacityStats = {
    dailyCapacityBreakdown,
    daysPlannedAboveCapacityCount,
    totalCapacitySeconds,
    totalPlannedSeconds: plannedSeconds,
    totalActualSeconds: activeFocusSeconds,
  };

  // 10. Estimate Accuracy Buckets (Master Plan Section 12.15)
  // For completed Tasks with estimate and actual Active time: errorRatio = (actual - estimate) / estimate
  let accurateCount = 0;
  let underestimatedCount = 0;
  let overestimatedCount = 0;
  const signedErrors: number[] = [];
  const absoluteErrors: number[] = [];
  let evaluatedTasksCount = 0;

  const allCompletedInPeriod = tasks.filter(
    (t) =>
      !t.deletedAt &&
      t.statusId === 'ws-task-done' &&
      t.scheduledDate &&
      dayDateSet.has(t.scheduledDate) &&
      (t.estimateMinutes || 0) > 0
  );

  for (const t of allCompletedInPeriod) {
    const estimateSec = (t.estimateMinutes || 0) * 60;
    if (estimateSec <= 0) continue;

    const taskSessions = sessions.filter((s) => s.taskId === t.id && !s.deletedAt);
    const actualSec = taskSessions.reduce((sum, s) => sum + s.activeDurationSeconds, 0);
    if (actualSec <= 0) continue;

    evaluatedTasksCount++;
    const errorRatio = (actualSec - estimateSec) / estimateSec;
    signedErrors.push(errorRatio);
    absoluteErrors.push(Math.abs(errorRatio));

    if (Math.abs(errorRatio) <= 0.15) {
      accurateCount++;
    } else if (errorRatio > 0.15) {
      underestimatedCount++;
    } else {
      overestimatedCount++;
    }
  }

  signedErrors.sort((a, b) => a - b);
  absoluteErrors.sort((a, b) => a - b);

  const averageSignedErrorPercentage =
    signedErrors.length > 0
      ? Math.round((signedErrors.reduce((sum, e) => sum + e, 0) / signedErrors.length) * 100)
      : 0;

  const medianAbsoluteErrorPercentage =
    absoluteErrors.length > 0
      ? Math.round(absoluteErrors[Math.floor(absoluteErrors.length / 2)] * 100)
      : 0;

  const estimateAccuracy: EstimateAccuracyStats = {
    evaluatedTasksCount,
    accurateCount,
    accuratePercentage:
      evaluatedTasksCount > 0 ? Math.round((accurateCount / evaluatedTasksCount) * 100) : 100,
    underestimatedCount,
    underestimatedPercentage:
      evaluatedTasksCount > 0 ? Math.round((underestimatedCount / evaluatedTasksCount) * 100) : 0,
    overestimatedCount,
    overestimatedPercentage:
      evaluatedTasksCount > 0 ? Math.round((overestimatedCount / evaluatedTasksCount) * 100) : 0,
    averageSignedErrorPercentage,
    medianAbsoluteErrorPercentage,
  };

  // 11. Rescheduling Analysis (Master Plan Section 12.9)
  const periodRescheduleEvents = activityEvents.filter(
    (ev) =>
      ev.eventType === 'TASK_RESCHEDULED' &&
      ev.occurredAt >= bounds.startMs &&
      ev.occurredAt < bounds.endMs
  );

  const reasonsMap = new Map<string, number>();
  const taskRescheduleCountMap = new Map<string, number>();

  for (const ev of periodRescheduleEvents) {
    const payload = ev.payloadJson as { reason?: string } | undefined;
    const reason = payload?.reason?.trim() || '未指定原因 (Unspecified)';
    reasonsMap.set(reason, (reasonsMap.get(reason) || 0) + 1);

    if (ev.entityId) {
      taskRescheduleCountMap.set(
        ev.entityId,
        (taskRescheduleCountMap.get(ev.entityId) || 0) + 1
      );
    }
  }

  const totalReschedules = periodRescheduleEvents.length;
  const reasonsBreakdown = Array.from(reasonsMap.entries())
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: totalReschedules > 0 ? Math.round((count / totalReschedules) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const mostRescheduledTasks = Array.from(taskRescheduleCountMap.entries())
    .map(([taskId, count]) => {
      const t = taskMap.get(taskId);
      return {
        taskId,
        taskTitle: t?.title || 'Unknown Task',
        count,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const rescheduling: ReschedulingStats = {
    totalReschedules,
    reasonsBreakdown,
    mostRescheduledTasks,
  };

  // 12. Daily Breakdown for Plan vs Actual Chart
  const dailyBreakdown = bounds.days.map((d) => {
    const dayStart = timeService.getStartOfLogicalDay(d.dateStr);
    const dayEnd = dayStart + 86400000;

    const dayBlocks = periodBlocks.filter((b) => b.startAt >= dayStart && b.startAt < dayEnd);
    const daySessions = periodSessions.filter(
      (s) => s.startedAt >= dayStart && s.startedAt < dayEnd
    );

    const dayPlanSec = dayBlocks.reduce(
      (sum, b) => sum + Math.max(0, Math.floor((b.endAt - b.startAt) / 1000)),
      0
    );
    const dayActualSec = daySessions.reduce(
      (sum, s) => sum + (s.activeDurationSeconds || 0),
      0
    );

    return {
      dateStr: d.dateStr,
      dayName: d.dayName,
      planSeconds: dayPlanSec,
      actualSeconds: dayActualSec,
    };
  });

  // 13. Project Distribution Breakdown
  const projectTimeMap = new Map<string, number>();
  periodSessions.forEach((s) => {
    if (s.projectId) {
      projectTimeMap.set(
        s.projectId,
        (projectTimeMap.get(s.projectId) || 0) + s.activeDurationSeconds
      );
    }
  });

  const projectBreakdown: AllocationItem[] = Array.from(projectTimeMap.entries())
    .map(([projectId, activeSec]) => {
      const proj = projectMap.get(projectId);
      return {
        id: projectId,
        name: proj?.name || 'Unassigned Project',
        color: proj?.color || '#64748b',
        activeSeconds: activeSec,
        percentage:
          activeFocusSeconds > 0 ? Math.round((activeSec / activeFocusSeconds) * 100) : 0,
      };
    })
    .sort((a, b) => b.activeSeconds - a.activeSeconds);

  // 14. Goal Distribution Breakdown
  const goalTimeMap = new Map<string, number>();
  periodSessions.forEach((s) => {
    if (s.projectId) {
      const proj = projectMap.get(s.projectId);
      if (proj?.primaryGoalId) {
        goalTimeMap.set(
          proj.primaryGoalId,
          (goalTimeMap.get(proj.primaryGoalId) || 0) + s.activeDurationSeconds
        );
      }
    }
  });

  const goalBreakdown: AllocationItem[] = Array.from(goalTimeMap.entries())
    .map(([goalId, activeSec]) => {
      const goal = goalMap.get(goalId);
      return {
        id: goalId,
        name: goal?.title || 'Unassigned Goal',
        color: goal?.color || '#4f46e5',
        activeSeconds: activeSec,
        percentage:
          activeFocusSeconds > 0 ? Math.round((activeSec / activeFocusSeconds) * 100) : 0,
      };
    })
    .sort((a, b) => b.activeSeconds - a.activeSeconds);

  // 15. Priority Distribution Breakdown
  const priorityTimeMap = new Map<string, number>();
  periodSessions.forEach((s) => {
    const t = s.taskId ? taskMap.get(s.taskId) : undefined;
    const prio = t?.priority || 'medium';
    priorityTimeMap.set(prio, (priorityTimeMap.get(prio) || 0) + s.activeDurationSeconds);
  });

  const priorityColors: Record<string, string> = {
    urgent: '#ef4444',
    high: '#f97316',
    medium: '#6366f1',
    low: '#94a3b8',
  };

  const priorityBreakdown: AllocationItem[] = Array.from(priorityTimeMap.entries())
    .map(([priority, activeSec]) => ({
      id: priority,
      name: priority.toUpperCase(),
      color: priorityColors[priority] || '#6366f1',
      activeSeconds: activeSec,
      percentage:
        activeFocusSeconds > 0 ? Math.round((activeSec / activeFocusSeconds) * 100) : 0,
    }))
    .sort((a, b) => b.activeSeconds - a.activeSeconds);

  // 16. Tag Distribution Breakdown
  const tagTimeMap = new Map<string, { seconds: number; color: string }>();
  periodSessions.forEach((s) => {
    const t = s.taskId ? taskMap.get(s.taskId) : undefined;
    if (t?.tagIds && t.tagIds.length > 0) {
      const perTagSec = Math.floor(s.activeDurationSeconds / t.tagIds.length);
      for (const tagId of t.tagIds) {
        const existing = tagTimeMap.get(tagId) || { seconds: 0, color: '#6366f1' };
        tagTimeMap.set(tagId, {
          seconds: existing.seconds + perTagSec,
          color: existing.color,
        });
      }
    }
  });

  const tagBreakdown: AllocationItem[] = Array.from(tagTimeMap.entries())
    .map(([tagName, info]) => ({
      id: tagName,
      name: `#${tagName}`,
      color: info.color,
      activeSeconds: info.seconds,
      percentage:
        activeFocusSeconds > 0 ? Math.round((info.seconds / activeFocusSeconds) * 100) : 0,
    }))
    .sort((a, b) => b.activeSeconds - a.activeSeconds);

  return {
    activeFocusSeconds,
    plannedSeconds,
    timeAccuracyPercentage,
    scheduleAccuracyPercentage,
    completionAccuracyPercentage,
    overallPlanningAccuracyPercentage,
    taskCompletionRate,
    completedTasksCount: completedTasks.length,
    totalTasksCount: periodTasks.length,
    dailyBreakdown,
    projectBreakdown,
    goalBreakdown,
    priorityBreakdown,
    tagBreakdown,
    unplannedWork,
    capacity,
    startDelay,
    estimateAccuracy,
    rescheduling,
  };
}
