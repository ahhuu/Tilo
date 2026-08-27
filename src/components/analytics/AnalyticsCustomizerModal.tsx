import React from 'react';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/core/i18n';
import {
  type AnalyticsLayoutConfig,
  type AnalyticsWidgetId,
  DEFAULT_ANALYTICS_LAYOUT_CONFIG,
} from './analyticsLayoutTypes';
import { X, RotateCcw, Eye, EyeOff, LayoutGrid } from 'lucide-react';

interface AnalyticsCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AnalyticsLayoutConfig;
  onChange: (config: AnalyticsLayoutConfig) => void;
}

export const AnalyticsCustomizerModal: React.FC<AnalyticsCustomizerModalProps> = ({
  isOpen,
  onClose,
  config,
  onChange,
}) => {
  const { language } = useI18n();

  if (!isOpen) return null;

  const widgetsList: { id: AnalyticsWidgetId; title: string; desc: string }[] = [
    {
      id: 'headline',
      title: language === 'zh-CN' ? '核心工时与完成指标卡' : 'Headline Metric Cards',
      desc: language === 'zh-CN' ? '专注总时长、排期时长、工时准确率、完成率' : 'Active focus, planned, time accuracy, and completion rate',
    },
    {
      id: 'planningAccuracy',
      title: language === 'zh-CN' ? '计划准确率多维归因' : 'Planning Accuracy Breakdown',
      desc: language === 'zh-CN' ? '综合准确率、工时、起步准时率与起步延迟分析' : 'Overall accuracy, time, schedule start, and delay distribution',
    },
    {
      id: 'unplannedAndCapacity',
      title: language === 'zh-CN' ? '非计划工作与每日容量分析' : 'Unplanned Work & Capacity',
      desc: language === 'zh-CN' ? '临时任务专注占比与每日容量负荷上限' : 'Ad-hoc work share and daily capacity vs plan vs actual',
    },
    {
      id: 'dailyChart',
      title: language === 'zh-CN' ? '每日计划 vs 实际对比图' : 'Daily Plan vs Actual Chart',
      desc: language === 'zh-CN' ? '每日排期工时与实际执行工时柱状对照' : 'Bar chart comparing daily planned and actual active hours',
    },
    {
      id: 'timeAllocation',
      title: language === 'zh-CN' ? '时间分配多维透视' : 'Time Allocation Breakdown',
      desc: language === 'zh-CN' ? '按项目、战略目标、优先级及标签透视工时投入' : 'Multi-dimensional view by project, goal, priority, or tag',
    },
    {
      id: 'estimateAccuracy',
      title: language === 'zh-CN' ? '任务预估准确率分布' : 'Estimate Accuracy Distribution',
      desc: language === 'zh-CN' ? '准确、低估、高估分布桶与中位绝对误差' : 'Accurate, underestimated, and overestimated buckets',
    },
    {
      id: 'rescheduling',
      title: language === 'zh-CN' ? '任务重排原因与追踪' : 'Rescheduling Reasons & Frequency',
      desc: language === 'zh-CN' ? '客观重排原因分布及调整最频繁的任务' : 'Factual reason breakdown and most-rescheduled tasks',
    },
    {
      id: 'focusHeatmap',
      title: language === 'zh-CN' ? '年度专注热力矩阵' : 'Annual Focus Heatmap Matrix',
      desc: language === 'zh-CN' ? '365天全景打卡热力图、连续专注天数与习惯连续性追踪' : '365-day focus consistency, annual matrix, and streaks tracking',
    },
    {
      id: 'chronotypeMatrix',
      title: language === 'zh-CN' ? '24小时精力生物钟分析' : '24-Hour Chronotype Energy Matrix',
      desc: language === 'zh-CN' ? '按小时统计专注频率分布，智能识别个人黄金高效时段' : 'Hourly focus frequency distribution discovering peak productivity windows',
    },
  ];

  const handleToggleWidget = (id: AnalyticsWidgetId) => {
    onChange({
      ...config,
      visibleWidgets: {
        ...config.visibleWidgets,
        [id]: !config.visibleWidgets[id],
      },
    });
  };

  const handleReset = () => {
    onChange(DEFAULT_ANALYTICS_LAYOUT_CONFIG);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {language === 'zh-CN' ? '自定义数据分析模块' : 'Customize Analytics Widgets'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Widgets toggles */}
        <div className="p-5 overflow-y-auto space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'zh-CN'
              ? '勾选或取消勾选以自定义在数据分析看板中显示的模块：'
              : 'Toggle widgets to show or hide on the Analytics dashboard:'}
          </p>

          <div className="space-y-2">
            {widgetsList.map((w) => {
              const isVisible = config.visibleWidgets[w.id] ?? true;
              return (
                <div
                  key={w.id}
                  onClick={() => handleToggleWidget(w.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                    isVisible
                      ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200/80 dark:border-indigo-900/60'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {w.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{w.desc}</p>
                  </div>

                  <button
                    type="button"
                    className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                      isVisible
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            className="text-xs gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'zh-CN' ? '重置为默认' : 'Reset to Default'}</span>
          </Button>

          <Button size="sm" variant="primary" onClick={onClose} className="text-xs cursor-pointer">
            {language === 'zh-CN' ? '完成' : 'Done'}
          </Button>
        </div>
      </div>
    </div>
  );
};
