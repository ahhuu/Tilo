import React, { useState } from 'react';
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

  // Live queries
  const sessions = useLiveQuery(() => db.sessions.toArray(), []) || [];
  const plannedBlocks = useLiveQuery(() => db.plannedBlocks.toArray(), []) || [];
  const tasks = useLiveQuery(() => db.tasks.toArray(), []) || [];
  const projects = useLiveQuery(() => db.projects.toArray(), []) || [];
  const goals = useLiveQuery(() => db.goals.toArray(), []) || [];
  const activityEvents = useLiveQuery(() => db.activityEvents.toArray(), []) || [];

  const bounds = getPeriodBounds(period, Date.now(), language);
  const analytics = computeAnalytics({
    period,
    sessions,
    plannedBlocks,
    tasks,
    projects,
    goals,
    activityEvents,
  });

  const visible = layoutConfig.visibleWidgets;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 pb-20">
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

      {/* 1. Headline Metric Cards */}
      {visible.headline && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title={t('analytics.activeFocus')}
            value={timeService.formatDuration(analytics.activeFocusSeconds)}
            subtext={language === 'zh-CN' ? '已记录的前台专注时长总和' : 'Total foreground focus recorded'}
            icon={<Clock className="w-4 h-4" />}
            accentColor="#10b981"
          />

          <MetricCard
            title={t('analytics.plannedTime')}
            value={timeService.formatDuration(analytics.plannedSeconds)}
            subtext={language === 'zh-CN' ? '日历计划排期时间块总和' : 'Total scheduled calendar blocks'}
            icon={<Calendar className="w-4 h-4" />}
            accentColor="#4f46e5"
          />

          <MetricCard
            title={t('analytics.timeAccuracy')}
            value={`${analytics.timeAccuracyPercentage}%`}
            subtext={language === 'zh-CN' ? '加权计划工时方差吻合度' : 'Weighted plan vs actual accuracy'}
            icon={<Percent className="w-4 h-4" />}
            accentColor="#f59e0b"
          />

          <MetricCard
            title={t('analytics.taskCompletion')}
            value={`${analytics.taskCompletionRate}%`}
            subtext={language === 'zh-CN' ? `已完成 ${analytics.completedTasksCount}/${analytics.totalTasksCount} 个任务` : `${analytics.completedTasksCount}/${analytics.totalTasksCount} tasks completed`}
            icon={<CheckSquare className="w-4 h-4" />}
            accentColor="#0284c7"
          />
        </div>
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
        <DailyPlanActualChart
          dailyData={analytics.dailyBreakdown}
        />
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
