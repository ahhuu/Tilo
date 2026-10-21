import {
  DEFAULT_APPEARANCE_SETTINGS,
  type WidgetAppearanceSettings,
  type WidgetWindowStyle,
} from '../widgetTypes';

export interface WidgetWindowStyleClasses {
  card: string;
  header: string;
  iconBox: string;
  title: string;
}

/** 5 款窗口质感风格映射 */
export const WINDOW_STYLE_MAP: Record<WidgetWindowStyle, WidgetWindowStyleClasses> = {
  glass: {
    card: 'border border-slate-200/50 dark:border-slate-800/70 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl shadow-lg',
    header: 'border-b border-slate-200/50 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/50',
    iconBox: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-2xs',
    title: 'text-slate-800 dark:text-slate-200',
  },
  stealth: {
    card: 'border border-emerald-500/40 dark:border-emerald-500/30 bg-black/95 text-slate-100 shadow-[0_0_25px_rgba(0,0,0,0.85)]',
    header: 'border-b border-emerald-500/20 bg-zinc-950/90 text-emerald-400',
    iconBox: 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 shadow-2xs',
    title: 'text-emerald-300 font-medium',
  },
  paper: {
    card: 'border border-amber-200/70 dark:border-stone-800 bg-[#fbfaf5] dark:bg-[#1c1b18] shadow-md text-stone-800 dark:text-stone-200',
    header: 'border-b border-amber-200/60 dark:border-stone-800/60 bg-[#f5f2e9] dark:bg-[#252420]',
    iconBox: 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 shadow-2xs',
    title: 'text-stone-800 dark:text-stone-200',
  },
  floating: {
    card: 'border border-indigo-500/30 dark:border-indigo-400/30 bg-white/95 dark:bg-slate-900/95 shadow-2xl',
    header: 'border-b-0 bg-transparent',
    iconBox: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-2xs',
    title: 'text-slate-800 dark:text-slate-200',
  },
  terminal: {
    card: 'border border-green-500/50 bg-[#080d08]/95 font-mono shadow-[0_0_15px_rgba(34,197,94,0.15)] text-green-400',
    header: 'border-b border-green-500/40 bg-[#0f170f]/90 text-green-300 font-mono',
    iconBox: 'bg-green-950/80 border border-green-500/40 text-green-400 shadow-2xs',
    title: 'text-green-400 font-mono font-semibold',
  },
};

/** 未设置时回落到出厂外观默认值（与旧实现的 inline 字面量等价）。 */
export const resolveWidgetAppearance = (appearance?: WidgetAppearanceSettings): WidgetAppearanceSettings =>
  appearance || DEFAULT_APPEARANCE_SETTINGS;

/** 由外观设置推导出的尺寸 / 字体 / 圆角类名与窗口质感。 */
export const getWidgetAppearanceTokens = (appearance: WidgetAppearanceSettings) => {
  const zoomLevel = {
    small: 0.84,
    normal: 1.0,
    large: 1.22,
  }[appearance.fontSizeLevel || 'normal'];

  const fontFamilyStyle = {
    system: 'inherit',
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Cascadia Code", Consolas, monospace',
    serif: 'Georgia, "Times New Roman", STSong, SimSun, serif',
  }[appearance.fontFamily || 'system'];

  const fontFamilyClass = {
    system: 'font-sans',
    sans: 'font-sans [&_*]:font-sans',
    mono: 'font-mono [&_*]:font-mono',
    serif: 'font-serif [&_*]:font-serif',
  }[appearance.fontFamily || 'system'];

  const buttonSizeClass = {
    compact: '[&_button]:scale-90 [&_button]:origin-center',
    standard: '',
    generous: '[&_button]:scale-115 [&_button]:origin-center',
  }[appearance.buttonSize || 'standard'];

  const borderRadiusClass =
    {
      'rounded-xl': 'rounded-lg',
      'rounded-2xl': 'rounded-2xl',
      'rounded-3xl': 'rounded-[28px]',
    }[appearance.borderRadius || 'rounded-2xl'] || 'rounded-2xl';

  const windowTheme: WidgetWindowStyle = appearance.windowStyle || 'glass';
  const windowStyle = WINDOW_STYLE_MAP[windowTheme] || WINDOW_STYLE_MAP.glass;

  return { zoomLevel, fontFamilyStyle, fontFamilyClass, buttonSizeClass, borderRadiusClass, windowStyle };
};

/** 各挂件在标题栏展示的中文纯净名（去除括号英文）。 */
export const getLocalizedWidgetTitle = (gridId: string, isZh: boolean, fallback: string): string => {
  if (!isZh) {
    const en: Record<string, string> = {
      inbox: 'Inbox',
      tasks: 'Tasks',
      session: 'Focus Timer',
      timeline: 'Timeline',
      notes: 'Notes',
      goals: 'Goals Board',
    };
    return en[gridId] || fallback;
  }
  const zh: Record<string, string> = {
    inbox: '闪念收集',
    tasks: '今日待办',
    session: '专注计时',
    timeline: '今日日程',
    notes: '随手便签',
    goals: '目标看板',
  };
  return zh[gridId] || fallback;
};
