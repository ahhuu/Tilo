import React from 'react';
import { useI18n } from '@/core/i18n';
import { Button } from '@/components/ui/Button';
import { Sliders, RotateCcw, X, Eye, EyeOff } from 'lucide-react';
import type { TodayLayoutConfig } from './todayLayoutTypes';

interface TodayLayoutCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  config: TodayLayoutConfig;
  onChange: (config: TodayLayoutConfig) => void;
  onReset: () => void;
}

export const TodayLayoutCustomizer: React.FC<TodayLayoutCustomizerProps> = ({
  isOpen,
  onClose,
  config,
  onChange,
  onReset,
}) => {
  const { language } = useI18n();

  if (!isOpen) return null;

  const toggleWidget = (key: keyof TodayLayoutConfig) => {
    onChange({
      ...config,
      [key]: !config[key],
    });
  };

  const setFocusCountLimit = (limit: number) => {
    onChange({
      ...config,
      focusCountLimit: limit,
    });
  };

  const setSplitRatio = (ratio: '50/50' | '60/40' | '40/60') => {
    onChange({
      ...config,
      splitRatio: ratio,
    });
  };

  return (
    <div
      role="dialog"
      aria-label="Customize Today Layout"
      className="absolute top-14 right-4 z-40 w-84 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xl p-4 animate-in fade-in zoom-in-95 duration-150 select-none text-left"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            {language === 'zh-CN' ? '自定义「今日」布局' : 'Customize Today Layout'}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4 py-3 text-xs">
        {/* Widget Toggles */}
        <div className="space-y-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300 block">
            {language === 'zh-CN' ? '模块显示与隐藏' : 'Widgets Visibility'}
          </span>

          <div className="space-y-1.5">
            {[
              { key: 'showWeeklyFocus' as const, label: language === 'zh-CN' ? '本周核心战略目标' : 'Weekly Focus' },
              { key: 'showFocusTasks' as const, label: language === 'zh-CN' ? '今日聚焦 (Focus Tasks)' : 'Focus Tasks' },
              { key: 'showNextUp' as const, label: language === 'zh-CN' ? '接下来 (Next Up 智能推荐)' : 'Next Up' },
              { key: 'showTimeline' as const, label: language === 'zh-CN' ? '时间轴对照 (Timeline)' : 'Timeline' },
              { key: 'showUnscheduled' as const, label: language === 'zh-CN' ? '未排期任务池 (Unscheduled)' : 'Unscheduled Tasks' },
              { key: 'showContextLine' as const, label: language === 'zh-CN' ? '顶部客观状态提示 (Context Line)' : 'Context Line' },
            ].map(({ key, label }) => {
              const isVisible = config[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleWidget(key)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    isVisible
                      ? 'border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                      : 'border-slate-100 dark:border-slate-800/40 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <span className="truncate">{label}</span>
                  {isVisible ? (
                    <Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Focus Limit (1-5) */}
        <div className="space-y-1.5">
          <span className="font-semibold text-slate-700 dark:text-slate-300 block">
            {language === 'zh-CN' ? '每日聚焦上限项数' : 'Focus Count Limit'}
          </span>
          <div className="grid grid-cols-5 gap-1">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setFocusCountLimit(num)}
                className={`py-1.5 rounded-lg border text-center font-mono font-semibold transition-colors cursor-pointer ${
                  config.focusCountLimit === num
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Split View Ratio */}
        <div className="space-y-1.5">
          <span className="font-semibold text-slate-700 dark:text-slate-300 block">
            {language === 'zh-CN' ? '左右分栏比例 (Split Ratio)' : 'Split Ratio'}
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {(['50/50', '60/40', '40/60'] as const).map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => setSplitRatio(ratio)}
                className={`py-1 rounded-lg border text-center font-mono text-[11px] font-semibold transition-colors cursor-pointer ${
                  config.splitRatio === ratio
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Reset & Close */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>{language === 'zh-CN' ? '重置为默认布局' : 'Reset to Default'}</span>
        </button>
        <Button size="sm" variant="primary" onClick={onClose}>
          {language === 'zh-CN' ? '完成' : 'Done'}
        </Button>
      </div>
    </div>
  );
};
