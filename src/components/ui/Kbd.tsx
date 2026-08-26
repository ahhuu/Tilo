import React from 'react';
import { cn } from '@/lib/utils';

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export const Kbd: React.FC<KbdProps> = ({ className, children, ...props }) => {
  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-500 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 select-none',
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  );
};
