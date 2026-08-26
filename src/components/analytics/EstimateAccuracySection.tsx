import React from 'react';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/core/i18n';
import type { EstimateAccuracyStats } from '@/services/analyticsService';
import { Scale, CheckCircle2, TrendingDown, TrendingUp } from 'lucide-react';

interface EstimateAccuracySectionProps {
  stats: EstimateAccuracyStats;
}

export const EstimateAccuracySection: React.FC<EstimateAccuracySectionProps> = ({ stats }) => {
  const { language } = useI18n();

  return (
    <Card className="p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {language === 'zh-CN' ? '任务预估准确率分布 (Estimate Accuracy)' : 'Estimate Accuracy Distribution'}
          </h3>
        </div>

        <div className="flex items-center gap-3 text-xs font-medium">
          <span className="text-slate-500">
            {language === 'zh-CN' ? '平均偏差:' : 'Avg Signed Error:'}{' '}
            <strong className="text-slate-800 dark:text-slate-200 font-mono">
              {stats.averageSignedErrorPercentage > 0 ? `+${stats.averageSignedErrorPercentage}%` : `${stats.averageSignedErrorPercentage}%`}
            </strong>
          </span>
          <span className="text-slate-500">
            {language === 'zh-CN' ? '中位绝对误差:' : 'Median Abs Error:'}{' '}
            <strong className="text-slate-800 dark:text-slate-200 font-mono">
              {stats.medianAbsoluteErrorPercentage}%
            </strong>
          </span>
        </div>
      </div>

      <p className="text-[11px] text-slate-400">
        {language === 'zh-CN'
          ? `基于本周期内已完成且设定了工时预估的 ${stats.evaluatedTasksCount} 个任务计算误差比例 (实际工时 - 预估工时) ÷ 预估工时。`
          : `Calculated from ${stats.evaluatedTasksCount} completed tasks with estimates.`}
      </p>

      {/* 3 Accuracy Buckets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {/* 1. Accurate (+- 15%) */}
        <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/60 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {language === 'zh-CN' ? '准确 (±15%)' : 'Accurate (±15%)'}
            </span>
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300 font-mono">
              {stats.accuratePercentage}%
            </span>
          </div>
          <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
            {stats.accurateCount} {language === 'zh-CN' ? '项任务预估精准' : 'tasks on target'}
          </p>
        </div>

        {/* 2. Underestimated (> +15%) */}
        <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/60 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
              {language === 'zh-CN' ? '低估工作量 (>15%)' : 'Underestimated (>15%)'}
            </span>
            <span className="text-sm font-bold text-amber-700 dark:text-amber-300 font-mono">
              {stats.underestimatedPercentage}%
            </span>
          </div>
          <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80">
            {stats.underestimatedCount} {language === 'zh-CN' ? '项任务耗时超出预期' : 'tasks took longer'}
          </p>
        </div>

        {/* 3. Overestimated (< -15%) */}
        <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/60 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-indigo-500" />
              {language === 'zh-CN' ? '高估工作量 (<-15%)' : 'Overestimated (<-15%)'}
            </span>
            <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300 font-mono">
              {stats.overestimatedPercentage}%
            </span>
          </div>
          <p className="text-[11px] text-indigo-600/80 dark:text-indigo-400/80">
            {stats.overestimatedCount} {language === 'zh-CN' ? '项任务实际用时更短' : 'tasks finished early'}
          </p>
        </div>
      </div>
    </Card>
  );
};
