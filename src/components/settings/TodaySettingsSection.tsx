import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import {
  DEFAULT_TODAY_LAYOUT_CONFIG,
  type TodayLayoutConfig,
} from '@/components/today/todayLayoutTypes';
import { RotateCcw, Eye, EyeOff } from 'lucide-react';

const STORAGE_KEY_TODAY_LAYOUT = 'tilo_today_layout';

export const TodaySettingsSection: React.FC = () => {
  const { language } = useI18n();
  const { addToast } = useUIStore();

  const [config, setConfig] = useState<TodayLayoutConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TODAY_LAYOUT);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_TODAY_LAYOUT_CONFIG;
  });

  const handleUpdate = (updates: Partial<TodayLayoutConfig>) => {
    const next = { ...config, ...updates };
    setConfig(next);
    localStorage.setItem(STORAGE_KEY_TODAY_LAYOUT, JSON.stringify(next));
    addToast({
      message: language === 'zh-CN' ? '已更新今日视图配置' : 'Today settings updated',
      type: 'info',
    });
  };

  const handleReset = () => {
    setConfig(DEFAULT_TODAY_LAYOUT_CONFIG);
    localStorage.removeItem(STORAGE_KEY_TODAY_LAYOUT);
    addToast({
      message: language === 'zh-CN' ? '已重置今日视图配置为默认' : 'Today settings reset to default',
      type: 'info',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {language === 'zh-CN' ? '今日 (Today) 页面配置' : 'Today Page Configuration'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'zh-CN'
              ? '定制工作台各模块可见性、每日聚焦上限 (1–5 项) 以及分栏显示比例。'
              : 'Customize widget visibility, focus limit (1–5), and column split ratio.'}
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

      {/* Focus Limit Config */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {language === 'zh-CN' ? '每日聚焦 (Daily Focus) 数量上限' : 'Daily Focus Limit'}
            </h4>
            <p className="text-[11px] text-slate-400">
              {language === 'zh-CN' ? '推荐 3 项，最高支持 5 项' : 'Recommended 3 tasks, supports up to 5.'}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleUpdate({ focusCountLimit: num })}
                className={`w-7 h-7 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  config.focusCountLimit === num
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Split Ratio Config */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {language === 'zh-CN' ? '分栏对照比例 (Split Ratio)' : 'Split Ratio'}
            </h4>
            <p className="text-[11px] text-slate-400">
              {language === 'zh-CN' ? '左侧任务列表与右侧时间轴宽度配比' : 'Width ratio between tasks and timeline.'}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
            {(['50/50', '60/40', '40/60'] as const).map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => handleUpdate({ splitRatio: ratio })}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  config.splitRatio === ratio
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Widget Toggles */}
      <Card className="p-4 space-y-3">
        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          {language === 'zh-CN' ? '模块显示与可见性' : 'Widget Visibility'}
        </h4>

        <div className="space-y-2">
          {(
            [
              { key: 'showWeeklyFocus', label: language === 'zh-CN' ? '本周核心战略目标' : 'Weekly Focus Banner' },
              { key: 'showFocusTasks', label: language === 'zh-CN' ? '今日聚焦任务列表 (1–N)' : 'Daily Focus Tasks (1–N)' },
              { key: 'showNextUp', label: language === 'zh-CN' ? '下一项建议卡片 (Next Up)' : 'Next Up Suggestion Card' },
              { key: 'showTimeline', label: language === 'zh-CN' ? '右侧计划与实际时间轴' : 'Plan vs Actual Timeline' },
              { key: 'showUnscheduled', label: language === 'zh-CN' ? '未排期任务池' : 'Unscheduled Task Pool' },
              { key: 'showContextLine', label: language === 'zh-CN' ? '今日客观上下文统计行' : 'Factual Context Line' },
            ] as const
          ).map((w) => {
            const isEnabled = config[w.key];
            return (
              <div
                key={w.key}
                onClick={() => handleUpdate({ [w.key]: !isEnabled })}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 flex items-center justify-between cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-800/30"
              >
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  {w.label}
                </span>
                <button
                  type="button"
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isEnabled
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                  }`}
                >
                  {isEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
