import React from 'react';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/core/i18n';
import { timeService } from '@/core/time/timeService';
import type { UnplannedWorkStats, CapacityStats } from '@/services/analyticsService';
import { Zap, AlertTriangle, BatteryCharging } from 'lucide-react';

interface UnplannedAndCapacitySectionProps {
  unplannedWork: UnplannedWorkStats;
  capacity: CapacityStats;
}

export const UnplannedAndCapacitySection: React.FC<UnplannedAndCapacitySectionProps> = ({
  unplannedWork,
  capacity,
}) => {
  const { language } = useI18n();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Left: Unplanned Work First-Class Metric */}
      <Card className="lg:col-span-5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {language === 'zh-CN' ? '非计划工作 (Unplanned Work)' : 'Unplanned Work'}
            </h3>
          </div>

          <div className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-bold font-mono">
            {unplannedWork.unplannedPercentage}%
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400">
              {language === 'zh-CN' ? '非计划专注时长' : 'Unplanned Duration'}
            </span>
            <p className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
              {timeService.formatDuration(unplannedWork.unplannedSeconds)}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400">
              {language === 'zh-CN' ? '占总专注比例' : 'Share of Active Time'}
            </span>
            <p className="text-base font-bold text-amber-600 dark:text-amber-400 font-mono">
              {unplannedWork.unplannedPercentage}%
            </p>
          </div>
        </div>

        {/* Largest Unplanned Sessions List */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {language === 'zh-CN' ? '主要临时任务记录' : 'Largest Ad-hoc Sessions'}
          </span>

          {unplannedWork.largestUnplannedSessions.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">
              {language === 'zh-CN' ? '本周期内无非计划任务。' : 'No unplanned sessions in this period.'}
            </p>
          ) : (
            <div className="space-y-1">
              {unplannedWork.largestUnplannedSessions.map((s) => (
                <div
                  key={s.sessionId}
                  className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 text-xs shadow-2xs"
                >
                  <span className="truncate text-slate-700 dark:text-slate-300 font-medium max-w-[200px]">
                    {s.title}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-mono shrink-0">
                    {timeService.formatDuration(s.durationSeconds)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Right: Capacity Analysis */}
      <Card className="lg:col-span-7 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BatteryCharging className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {language === 'zh-CN' ? '每日容量与负荷 (Daily Capacity Analysis)' : 'Daily Capacity Analysis'}
            </h3>
          </div>

          {capacity.daysPlannedAboveCapacityCount > 0 ? (
            <span className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              {language === 'zh-CN'
                ? `${capacity.daysPlannedAboveCapacityCount} 天超额排期`
                : `${capacity.daysPlannedAboveCapacityCount} days over capacity`}
            </span>
          ) : (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {language === 'zh-CN' ? '排期负荷适中' : 'Within capacity targets'}
            </span>
          )}
        </div>

        {/* Daily Capacity Bars */}
        <div className="space-y-2 pt-1">
          {capacity.dailyCapacityBreakdown.map((day) => {
            const planHours = (day.plannedSeconds / 3600).toFixed(1);
            const capHours = (day.capacitySeconds / 3600).toFixed(1);
            const actHours = (day.actualSeconds / 3600).toFixed(1);
            const maxVal = Math.max(day.capacitySeconds, day.plannedSeconds, day.actualSeconds, 1);
            const planPct = Math.min(100, Math.round((day.plannedSeconds / maxVal) * 100));
            const actPct = Math.min(100, Math.round((day.actualSeconds / maxVal) * 100));
            const capPct = Math.min(100, Math.round((day.capacitySeconds / maxVal) * 100));

            return (
              <div key={day.dateStr} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {day.dayName} ({day.dateStr.slice(5)})
                  </span>
                  <div className="flex items-center gap-2 text-[11px] font-mono">
                    <span className="text-indigo-600 dark:text-indigo-400">
                      {language === 'zh-CN' ? '计划:' : 'Plan:'} {planHours}h
                    </span>
                    <span className="text-slate-400">/</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {language === 'zh-CN' ? '实际:' : 'Act:'} {actHours}h
                    </span>
                    <span className="text-slate-400">/</span>
                    <span className="text-slate-500">
                      {language === 'zh-CN' ? '容量:' : 'Cap:'} {capHours}h
                    </span>
                  </div>
                </div>

                {/* Comparative bar */}
                <div className="relative h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex flex-col justify-center">
                  {/* Capacity target marker line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
                    style={{ left: `${capPct}%` }}
                    title={`容量上限: ${capHours}h`}
                  />
                  {/* Plan bar */}
                  <div
                    className={`h-1.5 rounded-full transition-all mb-0.5 ${
                      day.isOverCapacity ? 'bg-rose-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${planPct}%` }}
                    title={`计划排期: ${planHours}h`}
                  />
                  {/* Actual bar */}
                  <div
                    className="bg-emerald-500 h-1 rounded-full transition-all"
                    style={{ width: `${actPct}%` }}
                    title={`实际工时: ${actHours}h`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
