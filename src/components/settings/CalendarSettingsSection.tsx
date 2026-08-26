import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { RotateCcw } from 'lucide-react';

const STORAGE_KEY_CALENDAR_SETTINGS = 'tilo_calendar_settings';

export interface CalendarSettingsConfig {
  defaultView: 'day' | 'week' | 'agenda';
  daysCount: 5 | 7;
  weekdayCapacityMinutes: number;
  weekendCapacityMinutes: number;
  snapMinutes: 5 | 15;
}

const DEFAULT_CALENDAR_SETTINGS: CalendarSettingsConfig = {
  defaultView: 'week',
  daysCount: 7,
  weekdayCapacityMinutes: 480, // 8h
  weekendCapacityMinutes: 240, // 4h
  snapMinutes: 15,
};

export const CalendarSettingsSection: React.FC = () => {
  const { language } = useI18n();
  const { addToast, setCalendarDaysCount, setCalendarViewMode } = useUIStore();

  const [config, setConfig] = useState<CalendarSettingsConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CALENDAR_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_CALENDAR_SETTINGS;
  });

  const handleUpdate = (updates: Partial<CalendarSettingsConfig>) => {
    const next = { ...config, ...updates };
    setConfig(next);
    localStorage.setItem(STORAGE_KEY_CALENDAR_SETTINGS, JSON.stringify(next));

    if (updates.daysCount) setCalendarDaysCount(updates.daysCount);
    if (updates.defaultView) setCalendarViewMode(updates.defaultView);

    addToast({
      message: language === 'zh-CN' ? '已保存日历配置' : 'Calendar settings saved',
      type: 'info',
    });
  };

  const handleReset = () => {
    setConfig(DEFAULT_CALENDAR_SETTINGS);
    localStorage.removeItem(STORAGE_KEY_CALENDAR_SETTINGS);
    setCalendarDaysCount(7);
    setCalendarViewMode('week');
    addToast({
      message: language === 'zh-CN' ? '已重置日历配置为默认' : 'Calendar settings reset to default',
      type: 'info',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {language === 'zh-CN' ? '日历 (Calendar) 与排期配置' : 'Calendar & Planning Configuration'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'zh-CN'
              ? '定制默认日历视图、工作日/周末容量上限以及时间轴对齐吸附粒度。'
              : 'Configure default calendar view, capacity targets, and grid snapping.'}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleReset}
          className="h-7 text-xs gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{language === 'zh-CN' ? '重置为默认' : 'Reset to Default'}</span>
        </Button>
      </div>

      {/* Default View Mode */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {language === 'zh-CN' ? '默认打开视图' : 'Default View'}
            </h4>
            <p className="text-[11px] text-slate-400">
              {language === 'zh-CN' ? '进入日历页面时的初始视图' : 'Initial view mode when opening Calendar.'}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
            {(
              [
                { id: 'day', label: language === 'zh-CN' ? '日 (Day)' : 'Day' },
                { id: 'week', label: language === 'zh-CN' ? '周 (Week)' : 'Week' },
                { id: 'agenda', label: language === 'zh-CN' ? '议程 (Agenda)' : 'Agenda' },
              ] as const
            ).map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => handleUpdate({ defaultView: v.id })}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  config.defaultView === v.id
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Week Days Count */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {language === 'zh-CN' ? '周视图天数 (Days in Week View)' : 'Days in Week View'}
            </h4>
            <p className="text-[11px] text-slate-400">
              {language === 'zh-CN' ? '工作日 (5天) 或完整周 (7天)' : '5 working days or full 7-day week.'}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
            {([5, 7] as const).map((cnt) => (
              <button
                key={cnt}
                type="button"
                onClick={() => handleUpdate({ daysCount: cnt })}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  config.daysCount === cnt
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                {cnt} {language === 'zh-CN' ? '天' : 'Days'}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Capacity Defaults */}
      <Card className="p-4 space-y-3">
        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          {language === 'zh-CN' ? '默认每日容量上限 (Daily Capacity Target)' : 'Daily Capacity Defaults'}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {language === 'zh-CN' ? '工作日容量 (周一至周五)' : 'Weekday Capacity'}
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={config.weekdayCapacityMinutes / 60}
                onChange={(e) => handleUpdate({ weekdayCapacityMinutes: Math.round(Number(e.target.value) * 60) })}
                className="w-20 h-8 px-2.5 text-xs bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
              />
              <span className="text-xs text-slate-400">{language === 'zh-CN' ? '小时 / 天' : 'hours / day'}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {language === 'zh-CN' ? '周末容量 (周六与周日)' : 'Weekend Capacity'}
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={config.weekendCapacityMinutes / 60}
                onChange={(e) => handleUpdate({ weekendCapacityMinutes: Math.round(Number(e.target.value) * 60) })}
                className="w-20 h-8 px-2.5 text-xs bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
              />
              <span className="text-xs text-slate-400">{language === 'zh-CN' ? '小时 / 天' : 'hours / day'}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
