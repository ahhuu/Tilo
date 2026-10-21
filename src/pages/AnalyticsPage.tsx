import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/storage/db';
import { timeService } from '@/core/time/timeService';
import { useI18n } from '@/core/i18n';
import {
  type AnalyticsPeriod,
  computeAnalytics,
  getPeriodBounds,
} from '@/services/analyticsService';
import { MetricCard } from '@/components/analytics/MetricCard';
import { DailyPlanActualChart } from '@/components/analytics/DailyPlanActualChart';
import { TimeDistributionSection } from '@/components/analytics/TimeDistributionSection';
import { PlanningAccuracySection } from '@/components/analytics/PlanningAccuracySection';
import { UnplannedAndCapacitySection } from '@/components/analytics/UnplannedAndCapacitySection';
import { EstimateAccuracySection } from '@/components/analytics/EstimateAccuracySection';
import { ReschedulingSection } from '@/components/analytics/ReschedulingSection';
import { FocusHeatmapCard } from '@/components/analytics/FocusHeatmapCard';
import { ChronotypeMatrixCard } from '@/components/analytics/ChronotypeMatrixCard';
import { AnalyticsCustomizerModal } from '@/components/analytics/AnalyticsCustomizerModal';
import { InsightSummary } from '@/components/analytics/InsightSummary';
import { AnalyticsEmptyState } from '@/components/analytics/AnalyticsEmptyState';
import {
  type AnalyticsLayoutConfig,
  DEFAULT_ANALYTICS_LAYOUT_CONFIG,
} from '@/components/analytics/analyticsLayoutTypes';
import { Button } from '@/components/ui/Button';
import {
  BarChart2,
  Clock,
  Calendar,
  Percent,
  CheckSquare,
  Sliders,
} from 'lucide-react';

const STORAGE_KEY_ANALYTICS_PERIOD = 'tilo_analytics_period';
const STORAGE_KEY_ANALYTICS_LAYOUT = 'tilo_analytics_layout';

function getInitialPeriod(): AnalyticsPeriod {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ANALYTICS_PERIOD);
    if (
      saved === 'thisWeek' ||
      saved === 'lastWeek' ||
      saved === 'thisMonth' ||
      saved === 'lastMonth'
    ) {
      return saved;
    }
  } catch {
    // fallback
  }
  return 'thisWeek';
}

function getInitialLayout(): AnalyticsLayoutConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ANALYTICS_LAYOUT);
    if (saved) return JSON.parse(saved);
  } catch {
    // fallback
  }
  return DEFAULT_ANALYTICS_LAYOUT_CONFIG;
}

/**
 * 加载期的稳定空数组。
 *
 * `useLiveQuery` 在首次解析前返回 `undefined`，习惯写法 `|| []` 每次渲染都会
 * 新建一个数组字面量，任何以它为依赖的 useMemo 都会失效（且触发 lint 警告）。
 * 共享同一个只读空数组可以让引用保持稳定。
 */
const EMPTY_ARRAY: never[] = [];

export const AnalyticsPage: React.FC = () => {
  const { t, language } = useI18n();
  const [period, setPeriod] = useState<AnalyticsPeriod>(getInitialPeriod);
  const [layoutConfig, setLayoutConfig] = useState<AnalyticsLayoutConfig>(getInitialLayout);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  const handlePeriodChange = (nextPeriod: AnalyticsPeriod) => {
    try {
      localStorage.setItem(STORAGE_KEY_ANALYTICS_PERIOD, nextPeriod);
    } catch {
      // ignore
    }
    setPeriod(nextPeriod);
  };

  const handleLayoutChange = (nextConfig: AnalyticsLayoutConfig) => {
    try {
      localStorage.setItem(STORAGE_KEY_ANALYTICS_LAYOUT, JSON.stringify(nextConfig));
    } catch {
      // ignore
    }
    setLayoutConfig(nextConfig);
  };

  // 参照时刻刻意只在切换周期时取样（下方 useMemo 以 period 为 key）。若每帧都用
  // Date.now()，live query 的依赖会不停变化 → 反复重新查询，周期边界也会抖动。
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const referenceMs = useMemo(() => Date.now(), [period]);
  const bounds = getPeriodBounds(period, referenceMs, language);

  // Live queries
  // sessions / tasks / projects / goals 仍需全量：
  //   - 估算准确率要算「某个任务的**全部**专注时长」（含周期外），见
  //     analyticsService 里 taskSessions 的用法，按周期截断会算错；
  //   - tasks/projects/goals 是 taskMap / projectMap 的查表来源，跨周期引用。
  // plannedBlocks 与 activityEvents 则不同：它们在 computeAnalytics 里只被
  // 「落在周期内」这一个条件消费，因此改成索引范围查询后指标口径完全不变，
  // 只是不再把全部历史读进内存。
  const sessions = useLiveQuery(() => db.sessions.toArray(), []) ?? EMPTY_ARRAY;
  const tasks = useLiveQuery(() => db.tasks.toArray(), []) ?? EMPTY_ARRAY;
  const projects = useLiveQuery(() => db.projects.toArray(), []) ?? EMPTY_ARRAY;
  const goals = useLiveQuery(() => db.goals.toArray(), []) ?? EMPTY_ARRAY;
  const plannedBlocks =
    useLiveQuery(
      () =>
        db.plannedBlocks
          .where('startAt')
          .between(bounds.startMs, bounds.endMs, true, false)
          .toArray(),
      [bounds.startMs, bounds.endMs]
    ) ?? EMPTY_ARRAY;
  const activityEvents =
    useLiveQuery(
      () =>
        db.activityEvents
          .where('occurredAt')
          .between(bounds.startMs, bounds.endMs, true, false)
          .toArray(),
      [bounds.startMs, bounds.endMs]
    ) ?? EMPTY_ARRAY;

  // computeAnalytics 是重计算，且曾直接在渲染体内调用 —— 任何无关状态变化
  // （如打开自定义面板）都会把它整条流水线重跑一遍。
  const analytics = useMemo(
    () =>
      computeAnalytics({
        period,
        sessions,
        plannedBlocks,
        tasks,
        projects,
        goals,
        activityEvents,
        referenceDateMs: referenceMs,
      }),
    [period, sessions, plannedBlocks, tasks, projects, goals, activityEvents, referenceMs]
  );

  const visible = layoutConfig.visibleWidgets;
  const isZh = language === 'zh-CN';

  // 空状态判定：彻底无数据 / 数据不足（样本太少）
  // 注：plannedBlocks 现在是周期内的数量，所以这里的判据以 sessions / tasks 为主
  // （两者仍是全量），避免「只有远期排期块」的用户被判成无数据。
  const hasAnyData = sessions.length > 0 || tasks.length > 0 || plannedBlocks.length > 0;
  const hasEnoughFocus = analytics.activeFocusSeconds >= 3600;
  const showEmptyNone = !hasAnyData;

  const scopeLabel =
    period === 'thisWeek'
      ? isZh
        ? '本周'
        : 'This week'
      : period === 'lastWeek'
        ? isZh
          ? '上周'
          : 'Last week'
        : period === 'thisMonth'
          ? isZh
            ? '本月'
            : 'This month'
          : isZh
            ? '上月'
            : 'Last month';

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header & Period Switcher & Customizer Button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {t('analytics.title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {bounds.label}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Selector Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 text-xs font-medium select-none">
            {(
              [
                { id: 'thisWeek', label: t('analytics.thisWeek') },
                { id: 'lastWeek', label: t('analytics.lastWeek') },
                { id: 'thisMonth', label: t('analytics.thisMonth') },
                { id: 'lastMonth', label: t('analytics.lastMonth') },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePeriodChange(p.id)}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  period === p.id
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Customize Widgets Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsCustomizerOpen(true)}
            className="h-8 text-xs gap-1.5 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{language === 'zh-CN' ? '自定义模块' : 'Customize'}</span>
          </Button>
        </div>
      </div>

      {/* 空状态：彻底无数据 / 数据偏少，分别处理 */}
      {showEmptyNone ? (
        <AnalyticsEmptyState variant="none" language={language} />
      ) : (
        <>
          {/* 数据偏少时的温和提示，不阻断其余模块 */}
          {!hasEnoughFocus && <AnalyticsEmptyState variant="insufficient" language={language} />}

          {/* 1. Headline Metric Cards */}
          {visible.headline && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title={t('analytics.activeFocus')}
                value={timeService.formatDuration(analytics.activeFocusSeconds)}
                subtext={language === 'zh-CN' ? '已记录的前台专注时长总和' : 'Total foreground focus recorded'}
                hint={language === 'zh-CN' ? '这是你在该周期内真正按下计时、前台专注的累计时长，不含暂停与切走。' : 'Total time you actually ran the focus timer this period, excluding pauses.'}
                icon={<Clock className="w-4 h-4" />}
                accentColor="#10b981"
              />

              <MetricCard
                title={t('analytics.plannedTime')}
                value={timeService.formatDuration(analytics.plannedSeconds)}
                subtext={language === 'zh-CN' ? '日历计划排期时间块总和' : 'Total scheduled calendar blocks'}
                hint={language === 'zh-CN' ? '日历里排期的时间块总和。它代表你「打算」投入多少，而非真正做了多少。' : 'Sum of scheduled calendar blocks — what you intended to spend, not what you did.'}
                icon={<Calendar className="w-4 h-4" />}
                accentColor="#4f46e5"
              />

              <MetricCard
                title={t('analytics.timeAccuracy')}
                value={`${analytics.timeAccuracyPercentage}%`}
                subtext={language === 'zh-CN' ? '加权计划工时方差吻合度' : 'Weighted plan vs actual accuracy'}
                hint={language === 'zh-CN' ? '加权后的「计划时长 vs 实际时长」吻合度。100% 代表估得准，越低说明偏差越大。' : 'Weighted match between planned and actual duration. 100% means your estimates were spot-on.'}
                icon={<Percent className="w-4 h-4" />}
                accentColor="#f59e0b"
              />

              <MetricCard
                title={t('analytics.taskCompletion')}
                value={`${analytics.taskCompletionRate}%`}
                subtext={language === 'zh-CN' ? `已完成 ${analytics.completedTasksCount}/${analytics.totalTasksCount} 个任务` : `${analytics.completedTasksCount}/${analytics.totalTasksCount} tasks completed`}
                hint={language === 'zh-CN' ? '该周期内排期任务中已完成的比例。只看「排期日」当天的完成状态。' : 'Share of scheduled tasks completed within the period’s scheduled dates.'}
                icon={<CheckSquare className="w-4 h-4" />}
                accentColor="#0284c7"
              />
            </div>
          )}

          {/* 一句话结论：把数字翻成人话，并回链到今日 / 复盘 */}
          {visible.headline && (
            <InsightSummary analytics={analytics} language={language} scopeLabel={scopeLabel} />
          )}

          {/* 2. Planning Accuracy Breakdown Section */}
          {visible.planningAccuracy && (
            <PlanningAccuracySection
              overallAccuracy={analytics.overallPlanningAccuracyPercentage}
              timeAccuracy={analytics.timeAccuracyPercentage}
              scheduleAccuracy={analytics.scheduleAccuracyPercentage}
              completionAccuracy={analytics.completionAccuracyPercentage}
              startDelay={analytics.startDelay}
            />
          )}

          {/* 3. Unplanned Work & Daily Capacity Section */}
          {visible.unplannedAndCapacity && (
            <UnplannedAndCapacitySection
              unplannedWork={analytics.unplannedWork}
              capacity={analytics.capacity}
            />
          )}

          {/* 4. Daily Plan vs Actual Comparison Chart */}
          {visible.dailyChart && (
            <DailyPlanActualChart dailyData={analytics.dailyBreakdown} />
          )}

          {/* 5. Multi-dimensional Time Allocation Section */}
          {visible.timeAllocation && (
            <TimeDistributionSection
              projectBreakdown={analytics.projectBreakdown}
              goalBreakdown={analytics.goalBreakdown}
              priorityBreakdown={analytics.priorityBreakdown}
              tagBreakdown={analytics.tagBreakdown}
            />
          )}

          {/* 6. Estimate Accuracy Distribution Buckets */}
          {visible.estimateAccuracy && (
            <EstimateAccuracySection stats={analytics.estimateAccuracy} />
          )}

          {/* 7. Rescheduling Analysis */}
          {visible.rescheduling && (
            <ReschedulingSection rescheduling={analytics.rescheduling} />
          )}

          {/* 8. Annual Focus Heatmap Matrix */}
          {visible.focusHeatmap && <FocusHeatmapCard />}

          {/* 9. 24-Hour Chronotype & Energy Distribution */}
          {visible.chronotypeMatrix && <ChronotypeMatrixCard />}
        </>
      )}

      {/* Customizer Modal */}
      <AnalyticsCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        config={layoutConfig}
        onChange={handleLayoutChange}
      />
    </div>
  );
};
