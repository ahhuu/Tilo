import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { timeService } from '@/core/time/timeService';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { Clock, Calendar } from 'lucide-react';

export const TimeSection: React.FC = () => {
  const { language } = useI18n();
  const { addToast } = useUIStore();
  const [cutoffMinutes, setCutoffMinutes] = useState<number>(240); // 04:00 AM = 240 mins
  const [weekStart, setWeekStart] = useState<0 | 1>(1); // 1 = Monday

  const handleSave = () => {
    // update timeService options
    timeService.setOptions({
      dayStartMinutes: cutoffMinutes,
      weekStartDay: weekStart,
    });
    addToast({
      message: language === 'zh-CN' ? '时间与自然日分割点设置已保存' : 'Time & Logical Day settings saved',
      type: 'success',
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 space-y-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {language === 'zh-CN' ? '自然日与跨日时间分割点' : 'Logical Day & Time Cutoffs'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'zh-CN'
              ? 'Tilo 将凌晨深夜的执行专注自动归入前一个逻辑自然日，直到达到您设置的跨日分割时间。'
              : 'Tilo groups midnight work into the preceding logical day until your configured cutoff time.'}
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>{language === 'zh-CN' ? '跨日分割点 (Day-start Cutoff Time)' : 'Day-start Cutoff Time'}</span>
            </label>
            <select
              value={cutoffMinutes}
              onChange={(e) => setCutoffMinutes(Number(e.target.value))}
              className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value={0}>{language === 'zh-CN' ? '00:00 (自然日午夜)' : '00:00 (Midnight)'}</option>
              <option value={180}>{language === 'zh-CN' ? '03:00 AM (凌晨 3 点)' : '03:00 AM'}</option>
              <option value={240}>{language === 'zh-CN' ? '04:00 AM (凌晨 4 点 • 推荐夜间工作者)' : '04:00 AM (Recommended for night owls)'}</option>
              <option value={300}>{language === 'zh-CN' ? '05:00 AM (清晨 5 点)' : '05:00 AM'}</option>
              <option value={360}>{language === 'zh-CN' ? '06:00 AM (早晨 6 点)' : '06:00 AM'}</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>{language === 'zh-CN' ? '每周起始日' : 'First Day of Week'}</span>
            </label>
            <select
              value={weekStart}
              onChange={(e) => setWeekStart(Number(e.target.value) as 0 | 1)}
              className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value={1}>{language === 'zh-CN' ? '星期一 (ISO 标准工作周)' : 'Monday (ISO standard)'}</option>
              <option value={0}>{language === 'zh-CN' ? '星期日' : 'Sunday'}</option>
            </select>
          </div>

          <div className="flex justify-end pt-2">
            <Button size="sm" variant="primary" onClick={handleSave} className="cursor-pointer">
              {language === 'zh-CN' ? '保存时间设置' : 'Save Time Settings'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
