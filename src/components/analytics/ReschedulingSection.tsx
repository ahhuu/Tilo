import React from 'react';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/core/i18n';
import type { ReschedulingStats } from '@/services/analyticsService';
import { CalendarSync } from 'lucide-react';

interface ReschedulingSectionProps {
  rescheduling: ReschedulingStats;
}

export const ReschedulingSection: React.FC<ReschedulingSectionProps> = ({ rescheduling }) => {
  const { language } = useI18n();

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarSync className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {language === 'zh-CN' ? '重排原因与任务追踪 (Rescheduling Reasons)' : 'Rescheduling Reasons'}
          </h3>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          {language === 'zh-CN' ? '共发生' : 'Total events:'}{' '}
          <strong className="text-indigo-600 dark:text-indigo-400 font-mono">
            {rescheduling.totalReschedules}
          </strong>{' '}
          {language === 'zh-CN' ? '次调整' : 'reschedules'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Reasons distribution */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {language === 'zh-CN' ? '重排原因分布' : 'Reason Breakdown'}
          </span>

          {rescheduling.reasonsBreakdown.length === 0 ? (
            <p className="text-xs text-slate-400 py-3">
              {language === 'zh-CN' ? '本周期内无任务重排记录。' : 'No rescheduling events recorded.'}
            </p>
          ) : (
            <div className="space-y-1.5">
              {rescheduling.reasonsBreakdown.map((r) => (
                <div key={r.reason} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[200px]">
                      {r.reason}
                    </span>
                    <span className="text-slate-400 font-mono">
                      {r.count} 次 ({r.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all"
                      style={{ width: `${r.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most rescheduled tasks */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {language === 'zh-CN' ? '调整最频繁的任务' : 'Most Rescheduled Tasks'}
          </span>

          {rescheduling.mostRescheduledTasks.length === 0 ? (
            <p className="text-xs text-slate-400 py-3">
              {language === 'zh-CN' ? '无频繁调整的任务。' : 'No frequently rescheduled tasks.'}
            </p>
          ) : (
            <div className="space-y-1.5">
              {rescheduling.mostRescheduledTasks.map((t) => (
                <div
                  key={t.taskId}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <span className="truncate text-slate-700 dark:text-slate-300 font-medium max-w-[220px]">
                    {t.taskTitle}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono font-semibold">
                    {t.count} {language === 'zh-CN' ? '次' : 'times'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
