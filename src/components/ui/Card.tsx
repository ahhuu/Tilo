import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'focus' | 'interactive';
}

export const Card: React.FC<CardProps> = ({
  className,
  variant = 'default',
  children,
  ...props
}) => {
  const variants = {
    default:
      'bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs',
    subtle:
      'bg-slate-50/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800',
    focus:
      'bg-white dark:bg-slate-800 border-2 border-indigo-500/60 dark:border-indigo-500/80 shadow-xs ring-2 ring-indigo-500/10',
    interactive:
      'bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer',
  };

  return (
    <div
      className={cn('rounded-xl p-4 transition-all', variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
};
