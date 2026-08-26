import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/core/i18n';
import type { StartDelayStats } from '@/services/analyticsService';
import {
  Target,
  Clock,
  CalendarCheck,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface PlanningAccuracySectionProps {
  overallAccuracy: number;
  timeAccuracy: number;
  scheduleAccuracy: number;
  completionAccuracy: number;
  startDelay: StartDelayStats;
}

export const PlanningAccuracySection: React.FC<PlanningAccuracySectionProps> = ({
  overallAccuracy,
  timeAccuracy,
  scheduleAccuracy,
  completionAccuracy,
  startDelay,
}) => {
  const { language } = useI18n();
  const [showFormulaTooltip, setShowFormulaTooltip] = useState(false);

  return (
    <div className="space-y-4">
      {/* Header with Tooltip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {language === 'zh-CN' ? '计划准确率多维归因 (Planning Accuracy Breakdown)' : 'Planning Accuracy Breakdown'}
          </h3>
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setShowFormulaTooltip(true)}
              onMouseLeave={() => setShowFormulaTooltip(false)}
              onClick={() => setShowFormulaTooltip(!showFormulaTooltip)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
              aria-label="Planning Accuracy Formula Info"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>

            {showFormulaTooltip && (
              <div className="absolute left-6 top-0 z-50 w-72 p-3 bg-slate-900 text-slate-100 text-[11px] rounded-xl shadow-xl border border-slate-800 space-y-1.5 animate-in fade-in duration-150">
                <p className="font-semibold text-indigo-300">
                  {language === 'zh-CN' ? '综合计划准确率计算公式' : 'Overall Planning Accuracy Formula'}
                </p>
                <p className="text-slate-300 leading-relaxed">
                  {language === 'zh-CN'
                    ? '综合准确率 = (工时准确率 + 排期起步准时率 + 任务完成率) ÷ 3。用于客观度量排期与执行的吻合程度，不作为评判指标。'
                    : 'Overall = Mean of normalized Time Accuracy, Schedule Start Accuracy, and Completion Rate. Strictly factual attribution.'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg border border-indigo-100 dark:border-indigo-900/60">
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
            {language === 'zh-CN' ? '综合准确率:' : 'Overall Accuracy:'}
          </span>
          <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300 font-mono">
            {overallAccuracy}%
          </span>
        </div>
      </div>

      {/* 3 Component Accuracy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Time Accuracy */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              {language === 'zh-CN' ? '工时准确率 (Time)' : 'Time Accuracy'}
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
              {timeAccuracy}%
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, timeAccuracy)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            {language === 'zh-CN'
              ? '实际专注时长与排期预估工时的方差吻合度'
              : 'Actual focus vs planned block duration accuracy'}
          </p>
        </Card>

        {/* 2. Schedule Accuracy */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5 text-indigo-500" />
              {language === 'zh-CN' ? '排期起步准时率 (Schedule)' : 'Schedule Accuracy'}
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
              {scheduleAccuracy}%
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, scheduleAccuracy)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            {language === 'zh-CN'
              ? '在预定起步时间 15 分钟容差内开始专注的比例'
              : 'Sessions started within 15 mins of scheduled start'}
          </p>
        </Card>

        {/* 3. Completion Accuracy */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {language === 'zh-CN' ? '计划完成率 (Completion)' : 'Completion Rate'}
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
              {completionAccuracy}%
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, completionAccuracy)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            {language === 'zh-CN'
              ? '本周期内排期任务的实际按期完成比例'
              : 'Scheduled tasks completed within this period'}
          </p>
        </Card>
      </div>

      {/* Start Delay Analysis Distribution */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {language === 'zh-CN' ? '起步延迟分布 (Start Delay Analysis)' : 'Start Delay Analysis'}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {language === 'zh-CN'
                ? `共评估 ${startDelay.linkedSessionsCount} 次关联排期专注，中位数延迟: ${startDelay.medianDelayMinutes} 分钟，平均延迟: ${startDelay.averageDelayMinutes} 分钟`
                : `${startDelay.linkedSessionsCount} sessions analyzed • Median delay: ${startDelay.medianDelayMinutes}m • Average delay: ${startDelay.averageDelayMinutes}m`}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {language === 'zh-CN' ? '准时:' : 'On time:'} {startDelay.onTimeCount}
            </span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              &lt;15m: {startDelay.lessThan15MinLateCount}
            </span>
            <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              15-30m: {startDelay.between15And30MinLateCount}
            </span>
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              &gt;30m: {startDelay.moreThan30MinLateCount}
            </span>
          </div>
        </div>

        {/* Stacked bar visualization */}
        {startDelay.linkedSessionsCount > 0 ? (
          <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full flex overflow-hidden">
            <div
              style={{
                width: `${(startDelay.onTimeCount / startDelay.linkedSessionsCount) * 100}%`,
              }}
              className="bg-emerald-500 h-full"
              title={`准时 (On time): ${startDelay.onTimeCount}`}
            />
            <div
              style={{
                width: `${(startDelay.lessThan15MinLateCount / startDelay.linkedSessionsCount) * 100}%`,
              }}
              className="bg-amber-500 h-full"
              title={`<15m 延迟: ${startDelay.lessThan15MinLateCount}`}
            />
            <div
              style={{
                width: `${(startDelay.between15And30MinLateCount / startDelay.linkedSessionsCount) * 100}%`,
              }}
              className="bg-orange-500 h-full"
              title={`15-30m 延迟: ${startDelay.between15And30MinLateCount}`}
            />
            <div
              style={{
                width: `${(startDelay.moreThan30MinLateCount / startDelay.linkedSessionsCount) * 100}%`,
              }}
              className="bg-rose-500 h-full"
              title={`>30m 延迟: ${startDelay.moreThan30MinLateCount}`}
            />
          </div>
        ) : (
          <div className="py-2 text-center text-xs text-slate-400">
            {language === 'zh-CN' ? '本周期内暂无关联排期的专注起步记录' : 'No linked planned sessions in this period'}
          </div>
        )}
      </Card>
    </div>
  );
};
