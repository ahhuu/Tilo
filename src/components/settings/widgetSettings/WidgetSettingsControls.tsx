import React from 'react';

/**
 * 设置项卡片外壳。统一圆角、边框与内间距，避免各 section 重复写同一串类名。
 * 默认使用 space-y-4；需要更紧凑时通过 className 覆盖（后写的类优先级更高）。
 */
export const SettingsCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = 'space-y-4' }) => (
  <section
    className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs ${className}`}
  >
    {children}
  </section>
);

/** 卡片标题行：可选图标 + 标题 + 右侧操作区。 */
export const SettingsCardTitle: React.FC<{
  icon?: React.ReactNode;
  title: React.ReactNode;
  action?: React.ReactNode;
}> = ({ icon, title, action }) => (
  <div
    className={`flex items-center ${
      action ? 'justify-between' : 'gap-2'
    } text-sm font-semibold text-slate-800 dark:text-slate-200`}
  >
    <div className="flex items-center gap-2">
      {icon}
      {title}
    </div>
    {action}
  </div>
);

/** 开关按钮。accentClass 用于「锁定」这类警示语义的开关。 */
export const WidgetToggle: React.FC<{
  checked: boolean;
  onToggle: () => void;
  accentClass?: string;
}> = ({ checked, onToggle, accentClass = 'bg-indigo-600' }) => (
  <button
    type="button"
    onClick={onToggle}
    role="switch"
    aria-checked={checked}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
      checked ? accentClass : 'bg-slate-200 dark:bg-slate-700'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

/** 分段选择器（字号 / 字体 / 按钮尺寸 / 顶栏显隐等）。 */
export const WidgetSegmented = <T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ id: T; label: string }>;
  onChange: (id: T) => void;
}) => (
  <div className="flex items-center gap-1">
    {options.map((opt) => (
      <button
        key={opt.id}
        type="button"
        onClick={() => onChange(opt.id)}
        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
          value === opt.id
            ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);
