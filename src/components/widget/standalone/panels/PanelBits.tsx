import React from 'react';

/** 挂件配置面板里的一行：左侧说明 + 右侧控件。 */
export const PanelRow: React.FC<{ label: React.ReactNode; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="flex items-center justify-between">
    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">{label}</span>
    <div className="flex items-center gap-1">{children}</div>
  </div>
);

const pillBase = 'px-2 py-0.5 rounded text-[11px] font-medium transition-colors';
const pillActive = 'bg-indigo-600 text-white';
const pillIdle =
  'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700';

/** 单选药丸按钮（当前值高亮为靛蓝）。 */
export const Pill: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}> = ({ active, onClick, children, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`${pillBase} ${active ? pillActive : pillIdle} ${className}`}
  >
    {children}
  </button>
);

/** 布尔开关药丸（开启为绿色）。 */
export const TogglePill: React.FC<{ on: boolean; onClick: () => void; label: string }> = ({
  on,
  onClick,
  label,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-2.5 py-0.5 rounded text-[11px] font-medium ${
      on
        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
    }`}
  >
    {label}
  </button>
);

/** 面板内下拉框统一样式。 */
export const panelSelectClass =
  'px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none text-xs';
