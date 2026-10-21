import React from 'react';
import { ChevronDown, Lock, Magnet, Moon, Pin, SlidersHorizontal, Sun, Unlock, X } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { tauriWidgetService } from '@/services/tauriWidgetService';
import {
  DEFAULT_HEADER_BUTTONS_CONFIG,
  type HeaderButtonDisplayMode,
  type WidgetAppearanceSettings,
  type WidgetGridId,
  type WidgetHeaderButtonsConfig,
} from '../widgetTypes';
import type { WidgetWindowStyleClasses } from './widgetAppearanceStyles';
import type { WidgetWindowChrome } from './useWidgetWindowChrome';

interface WidgetHeaderProps {
  gridId: WidgetGridId;
  localizedTitle: string;
  IconComponent: React.ComponentType<{ className?: string }>;
  windowStyle: WidgetWindowStyleClasses;
  appearance: WidgetAppearanceSettings;
  chrome: WidgetWindowChrome;
}

/** 独立挂件顶栏：拖拽区、折叠态提示、对齐徽标与 5 个控制按钮。 */
export const WidgetHeader: React.FC<WidgetHeaderProps> = ({
  gridId,
  localizedTitle,
  IconComponent,
  windowStyle,
  appearance,
  chrome,
}) => {
  const isZh = chrome.isZh;
  const { theme, setTheme } = useUIStore();

  const headerActionsMode = appearance.headerActionsMode || 'hover';
  const headerButtons: WidgetHeaderButtonsConfig = appearance.headerButtons || DEFAULT_HEADER_BUTTONS_CONFIG;

  const getBtnVisibilityClass = (btnKey: keyof WidgetHeaderButtonsConfig) => {
    const mode: HeaderButtonDisplayMode = headerButtons[btnKey] || headerActionsMode;
    if (mode === 'hidden') return 'hidden';
    if (mode === 'always') return 'opacity-100 transition-opacity';
    // 默认悬停模式 (hover)
    return 'opacity-0 group-hover/header:opacity-100 focus-within:opacity-100 transition-opacity duration-200';
  };

  const handleClose = async () => {
    await tauriWidgetService.closeWidget(gridId);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header
      data-tauri-drag-region={!chrome.isLocked ? true : undefined}
      onMouseDown={chrome.handleMouseDownHeader}
      onDoubleClick={chrome.handleToggleCollapse}
      className={`flex items-center justify-between px-3.5 py-2 ${windowStyle.header} shrink-0 relative select-none group/header ${
        chrome.isLocked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
      }`}
      title={
        appearance.collapseOnDoubleClick
          ? isZh
            ? '双击可折叠/展开挂件'
            : 'Double-click to collapse/expand'
          : undefined
      }
    >
      {/* 标题栏 */}
      <div
        data-tauri-drag-region={!chrome.isLocked ? true : undefined}
        className="flex items-center gap-2 pointer-events-none min-w-0"
      >
        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${windowStyle.iconBox}`}>
          <IconComponent className="w-3.5 h-3.5" />
        </div>
        <span className={`text-xs font-semibold tracking-wide truncate ${windowStyle.title}`}>
          {localizedTitle}
        </span>
        {chrome.isCollapsed && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              chrome.handleToggleCollapse();
            }}
            className="text-[10px] text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-0.5 pointer-events-auto cursor-pointer px-1.5 py-0.5 rounded bg-indigo-50/80 dark:bg-indigo-950/60 transition-colors"
            title={isZh ? '点击展开挂件' : 'Click to expand'}
          >
            <ChevronDown className="w-3 h-3 animate-pulse" />
            <span>{isZh ? '已折叠' : 'Collapsed'}</span>
          </button>
        )}
      </div>

      {/* 实时对齐状态精简徽标 (拖动对齐时优雅显示，静止后自动淡出，绝对不撑大或变形) */}
      {chrome.alignment.label && (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-600/90 text-white text-[10px] font-medium shadow-xs shrink-0 whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <Magnet className="w-2.5 h-2.5" />
          <span>{chrome.alignment.label}</span>
        </div>
      )}

      {/* 右侧操作按钮群：支持全局悬停/常显以及单个按钮独立配置 */}
      <div className="flex items-center gap-1 cursor-default shrink-0">
        {/* 始终置顶按钮 (浮在所有软件前面) */}
        <button
          type="button"
          onClick={chrome.handleTogglePin}
          className={`p-1 rounded-md transition-colors cursor-pointer ${getBtnVisibilityClass('pin')} ${
            chrome.isPinned
              ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-slate-800/60'
          }`}
          title={
            chrome.isPinned
              ? isZh
                ? '取消始终置顶 (目前浮在其他软件前)'
                : 'Disable always on top'
              : isZh
                ? '始终置顶 (浮在其他所有软件前)'
                : 'Enable always on top'
          }
        >
          <Pin className={`w-3.5 h-3.5 ${chrome.isPinned ? 'fill-current' : ''}`} />
        </button>

        {/* 锁定位置与尺寸按钮 (禁止拖动防误触) */}
        <button
          type="button"
          onClick={chrome.handleToggleLock}
          className={`p-1 rounded-md transition-colors cursor-pointer ${getBtnVisibilityClass('lock')} ${
            chrome.isLocked
              ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 font-semibold ring-1 ring-amber-500/40'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-slate-800/60'
          }`}
          title={
            chrome.isLocked
              ? isZh
                ? '位置已锁定 (点击解锁拖动)'
                : 'Layout locked (Click to unlock)'
              : isZh
                ? '锁定挂件位置 (禁止拖动防误触)'
                : 'Lock widget layout'
          }
        >
          {chrome.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>

        {/* 专属自定义配置按钮 */}
        <button
          type="button"
          onClick={() => chrome.setShowSettings(!chrome.showSettings)}
          className={`p-1 rounded-md transition-colors cursor-pointer ${getBtnVisibilityClass('settings')} ${
            chrome.showSettings
              ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-slate-800/60'
          }`}
          title={isZh ? '自定义此格子偏好与外观' : 'Customize preferences & appearance'}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>

        {/* 主题切换 */}
        <button
          type="button"
          onClick={toggleTheme}
          className={`p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-slate-800/60 transition-colors cursor-pointer ${getBtnVisibilityClass('theme')}`}
          title={isZh ? '切换深色/浅色模式' : 'Toggle dark/light mode'}
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* 收起挂件 */}
        <button
          type="button"
          onClick={handleClose}
          className={`p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer ml-0.5 ${getBtnVisibilityClass('close')}`}
          title={isZh ? '收起此挂件' : 'Close widget'}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
