import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'indigo' | 'secondary' | 'urgent' | 'high' | 'medium' | 'low' | 'none' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    indigo: 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/60',
    secondary: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
    urgent: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
    high: 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
    medium: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    low: 'bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700',
    none: 'bg-slate-50 text-slate-400 border border-slate-200 dark:bg-slate-800/30 dark:text-slate-500 dark:border-slate-700/60',
    outline: 'border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300',
  };

  const sizes = {
    sm: 'text-[10px] px-1.5 py-0.5 rounded-sm font-medium',
    md: 'text-xs px-2 py-0.5 rounded-md font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center tracking-tight transition-colors',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
