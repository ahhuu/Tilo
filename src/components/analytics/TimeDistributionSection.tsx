import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { timeService } from '@/core/time/timeService';
import { useI18n } from '@/core/i18n';
import type { AllocationItem, TimeAllocationDimension } from '@/services/analyticsService';
import { FolderDot, Target, Flag, Tag, PieChart } from 'lucide-react';

interface TimeDistributionSectionProps {
  projectBreakdown: AllocationItem[];
  goalBreakdown: AllocationItem[];
  priorityBreakdown: AllocationItem[];
  tagBreakdown: AllocationItem[];
}

export const TimeDistributionSection: React.FC<TimeDistributionSectionProps> = ({
  projectBreakdown,
  goalBreakdown,
  priorityBreakdown,
  tagBreakdown,
}) => {
  const { language } = useI18n();
  const [activeDimension, setActiveDimension] = useState<TimeAllocationDimension>('project');

  const dimensionTabs: { id: TimeAllocationDimension; label: string; icon: React.ReactNode }[] = [
    {
      id: 'project',
      label: language === 'zh-CN' ? '按项目 (Project)' : 'Project',
      icon: <FolderDot className="w-3.5 h-3.5" />,
    },
    {
      id: 'goal',
      label: language === 'zh-CN' ? '按目标 (Goal)' : 'Goal',
      icon: <Target className="w-3.5 h-3.5" />,
    },
    {
      id: 'priority',
      label: language === 'zh-CN' ? '按优先级 (Priority)' : 'Priority',
      icon: <Flag className="w-3.5 h-3.5" />,
    },
    {
      id: 'tag',
      label: language === 'zh-CN' ? '按标签 (Tag)' : 'Tag',
      icon: <Tag className="w-3.5 h-3.5" />,
    },
  ];

  const currentItems =
    activeDimension === 'project'
      ? projectBreakdown
      : activeDimension === 'goal'
      ? goalBreakdown
      : activeDimension === 'priority'
      ? priorityBreakdown
      : tagBreakdown;

  return (
    <Card className="p-5 space-y-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {language === 'zh-CN' ? '时间分配多维透视 (Time Allocation)' : 'Time Allocation Breakdown'}
          </h3>
        </div>

        {/* Dimension Switcher Pills */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 text-xs font-medium">
          {dimensionTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveDimension(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                activeDimension === tab.id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Items List */}
      {currentItems.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          {language === 'zh-CN'
            ? '此周期内暂无该维度的专注记录。'
            : 'No focus time recorded for this dimension in this period.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 pt-1">
          {currentItems.map((item) => (
            <div key={item.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {item.name}
                  </span>
                </div>
                <span className="font-mono text-slate-500 shrink-0 text-[11px]">
                  {timeService.formatDuration(item.activeSeconds)} ({item.percentage}%)
                </span>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
