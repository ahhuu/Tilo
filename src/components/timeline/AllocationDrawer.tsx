import React from 'react';
import { useI18n } from '@/core/i18n';
import { timeService } from '@/core/time/timeService';
import { PieChart, Target, Layers, X } from 'lucide-react';
import type { AllocationItem } from '@/core/timeline/types';

interface AllocationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectAllocations: AllocationItem[];
  goalAllocations: AllocationItem[];
}

export const AllocationDrawer: React.FC<AllocationDrawerProps> = ({
  isOpen,
  onClose,
  projectAllocations,
  goalAllocations,
}) => {
  const { language } = useI18n();

  if (!isOpen) return null;

  return (
    <aside
      aria-label="Time Allocation Drawer"
      className="w-72 shrink-0 border-l border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs flex flex-col h-full z-20 select-none animate-in slide-in-from-right-4 duration-200 overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/70 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            {language === 'zh-CN' ? '时间分配洞察' : 'Time Allocation'}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Breakdown by Project */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>{language === 'zh-CN' ? '按项目分布' : 'By Project'}</span>
          </div>

          {projectAllocations.length === 0 ? (
            <p className="text-xs text-slate-400">
              {language === 'zh-CN' ? '暂无项目排期数据' : 'No project plan recorded.'}
            </p>
          ) : (
            <div className="space-y-2.5">
              {projectAllocations.map((item) => (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-800 dark:text-slate-200 font-medium truncate">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] shrink-0 ml-2">
                      {timeService.formatDuration(item.durationSeconds)} ({item.percentage}%)
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
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
        </div>

        {/* Breakdown by Goal */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <Target className="w-3.5 h-3.5 text-indigo-500" />
            <span>{language === 'zh-CN' ? '按目标推进' : 'By Goal'}</span>
          </div>

          {goalAllocations.length === 0 ? (
            <p className="text-xs text-slate-400">
              {language === 'zh-CN' ? '暂无关联目标的排期' : 'No goal allocations.'}
            </p>
          ) : (
            <div className="space-y-2.5">
              {goalAllocations.map((item) => (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-800 dark:text-slate-200 font-medium truncate">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] shrink-0 ml-2">
                      {timeService.formatDuration(item.durationSeconds)} ({item.percentage}%)
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
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
        </div>
      </div>
    </aside>
  );
};
