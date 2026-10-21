import React from 'react';
import { Clock, Layers } from 'lucide-react';
import { useI18n } from '@/core/i18n';
import { timeService } from '@/core/time/timeService';
import { confirmDialog } from '@/services/dialogService';
import type { calculateDailyCapacity, TimelineLayoutResult } from '@/core/timeline/timelineEngine';
import type { TimelineFilter } from '@/core/timeline/types';

const filterPillClass = (active: boolean, activeTextClass: string) =>
  `px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
    active
      ? `bg-white dark:bg-slate-700 ${activeTextClass} font-semibold shadow-2xs`
      : 'text-slate-500 hover:text-slate-800 dark:text-slate-300'
  }`;

/** 时间轴页头：日期标题、Plan/Actual 过滤、当日容量与计划/实际合计。 */
export const TimelineGridHeader: React.FC<{
  dateStr: string;
  activeFilter: TimelineFilter;
  onSetFilter: (filter: TimelineFilter) => void;
  capacityInfo: ReturnType<typeof calculateDailyCapacity>;
  layout: TimelineLayoutResult;
  onUpdateCapacityOverride?: (dateStr: string, minutes: number) => void;
}> = ({ dateStr, activeFilter, onSetFilter, capacityInfo, layout, onUpdateCapacityOverride }) => {
  const { language } = useI18n();

  const handleEditCapacity = async () => {
    const input = await confirmDialog({
      title: language === 'zh-CN' ? '今日容量上限' : 'Daily capacity',
      message: language === 'zh-CN' ? '单位：小时（如 6 或 8）' : 'In hours (e.g. 6 or 8)',
      input: {
        inputMode: 'numeric',
        defaultValue: (capacityInfo.capacityMinutes / 60).toString(),
        placeholder: '8',
      },
    });
    if (typeof input === 'string' && input.trim() && !isNaN(Number(input))) {
      onUpdateCapacityOverride?.(dateStr, Math.round(Number(input) * 60));
    }
  };

  return (
    <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs z-10">
      {/* Left Title / Filter */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>{timeService.formatDateHeader(dateStr, language === 'zh-CN' ? 'zh-CN' : 'en-US')}</span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium ml-2">
          <button
            type="button"
            onClick={() => onSetFilter('all')}
            className={filterPillClass(activeFilter === 'all', 'text-indigo-600 dark:text-indigo-400')}
          >
            {language === 'zh-CN' ? '全部 (Plan+Actual)' : 'All'}
          </button>
          <button
            type="button"
            onClick={() => onSetFilter('plan')}
            className={filterPillClass(activeFilter === 'plan', 'text-indigo-600 dark:text-indigo-400')}
          >
            {language === 'zh-CN' ? '仅计划 (Plan)' : 'Plan'}
          </button>
          <button
            type="button"
            onClick={() => onSetFilter('actual')}
            className={filterPillClass(activeFilter === 'actual', 'text-emerald-600 dark:text-emerald-400')}
          >
            {language === 'zh-CN' ? '仅实际 (Actual)' : 'Actual'}
          </button>
        </div>
      </div>

      {/* Right Capacity & Totals */}
      <div className="flex items-center gap-3 text-xs">
        {/* Daily Capacity indicator */}
        <button
          type="button"
          onClick={handleEditCapacity}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-indigo-300 transition-colors cursor-pointer"
          title={language === 'zh-CN' ? '点击可自定义该日容量上限' : 'Click to override daily capacity'}
        >
          <Clock className="w-3.5 h-3.5 text-indigo-500" />
          <span className="font-mono font-medium">
            {Math.floor(capacityInfo.plannedMinutes / 60)}h
            {capacityInfo.plannedMinutes % 60 > 0 ? `${capacityInfo.plannedMinutes % 60}m` : ''} /{' '}
            {Math.floor(capacityInfo.capacityMinutes / 60)}h
          </span>
          {capacityInfo.isOverCapacity && (
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold px-1 rounded bg-amber-50 dark:bg-amber-950/60">
              {language === 'zh-CN' ? '超出预期' : 'Over'}
            </span>
          )}
        </button>

        <div className="text-slate-300 dark:text-slate-700">•</div>

        <span className="text-indigo-600 dark:text-indigo-400 font-medium">
          {language === 'zh-CN' ? '计划:' : 'Plan:'} {timeService.formatDuration(layout.totalPlannedSeconds)}
        </span>
        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
          {language === 'zh-CN' ? '实际:' : 'Actual:'} {timeService.formatDuration(layout.totalActualSeconds)}
        </span>
      </div>
    </div>
  );
};
