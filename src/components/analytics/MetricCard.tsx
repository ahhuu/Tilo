import React from 'react';
import { Card } from '@/components/ui/Card';
import { Info } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  /** 悬停/聚焦时展示的「怎么看」说明，帮助用户理解该指标含义 */
  hint?: string;
  icon: React.ReactNode;
  accentColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtext,
  hint,
  icon,
  accentColor,
}) => {
  return (
    <Card className="p-5 space-y-3 shadow-2xs border border-slate-200/80 dark:border-slate-800">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className="flex items-center gap-1.5">
          {hint && (
            <span className="group relative inline-flex">
              <button
                type="button"
                aria-label={hint}
                title={hint}
                className="flex items-center justify-center w-4 h-4 rounded-full text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 cursor-help focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
              {/* 鼠标悬停提示 */}
              <span
                role="tooltip"
                className="pointer-events-none absolute right-0 top-6 z-20 w-56 rounded-lg bg-slate-900 dark:bg-slate-700 px-3 py-2 text-[11px] leading-relaxed text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 sm:left-auto"
              >
                {hint}
              </span>
            </span>
          )}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: accentColor ? `${accentColor}15` : undefined,
              color: accentColor || '#4f46e5',
            }}
          >
            {icon}
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
          {value}
        </div>
        {subtext && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500">{subtext}</p>
        )}
      </div>
    </Card>
  );
};
