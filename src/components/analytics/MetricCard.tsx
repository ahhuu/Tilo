import React from 'react';
import { Card } from '@/components/ui/Card';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  accentColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtext,
  icon,
  accentColor,
}) => {
  return (
    <Card className="p-5 space-y-3 shadow-2xs border border-slate-200/80 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
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

      <div className="space-y-1">
        <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
          {value}
        </div>
        {subtext && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            {subtext}
          </p>
        )}
      </div>
    </Card>
  );
};
