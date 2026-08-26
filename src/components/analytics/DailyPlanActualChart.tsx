import React from 'react';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/core/i18n';

interface DailyPlanActualChartProps {
  dailyData: {
    dateStr: string;
    dayName: string;
    planSeconds: number;
    actualSeconds: number;
  }[];
}

export const DailyPlanActualChart: React.FC<DailyPlanActualChartProps> = ({ dailyData }) => {
  const { language } = useI18n();
  const maxSeconds = Math.max(
    ...dailyData.map((d) => Math.max(d.planSeconds, d.actualSeconds)),
    3600 * 4 // minimum 4 hours ceiling for nice scaling
  );

  return (
    <Card className="p-5 space-y-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {language === 'zh-CN' ? '每日计划 vs 实际专注' : 'Daily Execution Rhythm (Plan vs Actual)'}
          </h3>
          <p className="text-xs text-slate-400">
            {language === 'zh-CN' ? '日历计划排期时长与实际专注时长对照' : 'Hours scheduled compared against actual focus time recorded'}
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium select-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
            <span className="text-slate-600 dark:text-slate-300">{language === 'zh-CN' ? '计划' : 'Plan'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span className="text-slate-600 dark:text-slate-300">{language === 'zh-CN' ? '实际' : 'Actual'}</span>
          </div>
        </div>
      </div>

      {/* Chart Bars */}
      <div className="h-44 flex items-end justify-between gap-2 pt-6 border-b border-slate-100 dark:border-slate-800">
        {dailyData.map((d) => {
          const planHeightPercent = Math.min(100, Math.max(2, (d.planSeconds / maxSeconds) * 100));
          const actualHeightPercent = Math.min(
            100,
            Math.max(2, (d.actualSeconds / maxSeconds) * 100)
          );

          const planHours = (d.planSeconds / 3600).toFixed(1);
          const actualHours = (d.actualSeconds / 3600).toFixed(1);

          return (
            <div key={d.dateStr} className="flex-1 flex flex-col items-center h-full justify-end group">
              <div className="w-full flex items-end justify-center gap-1 h-32 relative">
                {/* Plan Bar */}
                <div
                  className="w-3 rounded-t-sm bg-indigo-200 dark:bg-indigo-900/60 group-hover:bg-indigo-400 transition-all relative"
                  style={{ height: `${d.planSeconds > 0 ? planHeightPercent : 0}%` }}
                  title={`Plan: ${planHours}h`}
                />

                {/* Actual Bar */}
                <div
                  className="w-3 rounded-t-sm bg-emerald-500 dark:bg-emerald-600 group-hover:bg-emerald-400 transition-all relative shadow-2xs"
                  style={{ height: `${d.actualSeconds > 0 ? actualHeightPercent : 0}%` }}
                  title={`Actual: ${actualHours}h`}
                />
              </div>

              {/* Day Label */}
              <span className="text-[11px] font-mono text-slate-400 mt-2 truncate">
                {d.dayName}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
