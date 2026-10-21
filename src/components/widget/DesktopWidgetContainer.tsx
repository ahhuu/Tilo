import React from 'react';
import {
  Sliders,
  Sun,
  Moon,
  Pin,
  Minus,
} from 'lucide-react';
import { useWidgetStore } from '@/stores/widgetStore';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { tauriWidgetService } from '@/services/tauriWidgetService';
import { InboxGrid } from './grids/InboxGrid';
import { TasksGrid } from './grids/TasksGrid';
import { SessionGrid } from './grids/SessionGrid';
import { TimelineGrid } from './grids/TimelineGrid';
import { NotesGrid } from './grids/NotesGrid';
import { WidgetSettingsModal } from './WidgetSettingsModal';
import type { WidgetGridId } from './widgetTypes';

export const DesktopWidgetContainer: React.FC = () => {
  const { language } = useI18n();
  const { settings, openSettingsModal, setAlwaysOnTop } = useWidgetStore();
  const { theme, setTheme, runningSession } = useUIStore();
  const isZh = language === 'zh-CN';

  const enabledGrids = settings.enabledGrids;
  const isPinned = settings.alwaysOnTop;

  const handleTogglePin = async () => {
    const nextPinned = !isPinned;
    setAlwaysOnTop(nextPinned);
    await tauriWidgetService.setAlwaysOnTop(nextPinned);
  };

  const handleHide = async () => {
    await tauriWidgetService.hideCurrentWidget();
  };

  const renderGridComponent = (gridId: WidgetGridId) => {
    switch (gridId) {
      case 'inbox':
        return <InboxGrid key={gridId} />;
      case 'tasks':
        return <TasksGrid key={gridId} />;
      case 'session':
        return <SessionGrid key={gridId} />;
      case 'timeline':
        return <TimelineGrid key={gridId} />;
      case 'notes':
        return <NotesGrid key={gridId} />;
      default:
        return null;
    }
  };

  const getGridColsClass = () => {
    if (settings.layoutMode === 'columns-1') return 'grid-cols-1';
    if (settings.layoutMode === 'columns-2') return 'grid-cols-1 md:grid-cols-2';
    if (enabledGrids.length === 1) return 'grid-cols-1';
    if (enabledGrids.length === 2) return 'grid-cols-1 md:grid-cols-2';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden p-3 font-sans select-none transition-all duration-300 bg-slate-100/80 dark:bg-slate-950/80 backdrop-blur-xl border border-white/50 dark:border-slate-800/80 shadow-2xl rounded-2xl"
      style={{
        opacity: settings.opacityPercent / 100,
      }}
    >
      {/* 挂件顶部控制条（集成 data-tauri-drag-region 支持桌面原生鼠标拖动） */}
      <header
        data-tauri-drag-region
        className="flex items-center justify-between px-3 py-2 mb-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/60 dark:border-slate-800/80 shadow-xs shrink-0 cursor-grab active:cursor-grabbing"
      >
        <div data-tauri-drag-region className="flex items-center gap-2 pointer-events-none">
          <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center text-white shadow-2xs">
            <span className="font-bold text-[11px] leading-none">T</span>
          </div>
          <span className="text-xs font-semibold tracking-wide text-slate-800 dark:text-slate-200">
            {isZh ? 'Tilo 快捷格子' : 'Tilo grids'}
          </span>

          {runningSession && (
            <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-medium animate-pulse ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>
                {isZh ? '专注中' : 'Focusing'}: {runningSession.title}
              </span>
            </div>
          )}
        </div>

        {/* 右侧控制按钮群（允许点击操作，不被拖动阻断） */}
        <div className="flex items-center gap-1.5 cursor-default">
          {/* 置顶挂件切换 */}
          <button
            type="button"
            onClick={handleTogglePin}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              isPinned
                ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-slate-800/60'
            }`}
            title={
              isPinned
                ? isZh
                  ? '取消置顶'
                  : 'Unpin'
                : isZh
                  ? '挂件始终置顶'
                  : 'Always on top'
            }
            aria-label={
              isPinned
                ? isZh
                  ? '取消置顶'
                  : 'Unpin'
                : isZh
                  ? '挂件始终置顶'
                  : 'Always on top'
            }
          >
            <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
          </button>

          {/* 主题切换 */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            title={isZh ? '切换深色/浅色模式' : 'Toggle dark / light mode'}
            aria-label={isZh ? '切换深色/浅色模式' : 'Toggle dark / light mode'}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* 自定义设置 */}
          <button
            type="button"
            onClick={openSettingsModal}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 transition-colors cursor-pointer"
            title={isZh ? '自定义开启的格子与排序' : 'Choose grids and their order'}
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">{isZh ? '自定义' : 'Customize'}</span>
          </button>

          {/* 隐藏到桌面/最小化 */}
          <button
            type="button"
            onClick={handleHide}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            title={isZh ? '隐藏挂件' : 'Hide widget'}
            aria-label={isZh ? '隐藏挂件' : 'Hide widget'}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 格子主体网格展示区 */}
      <main className={`flex-1 grid ${getGridColsClass()} gap-3 min-h-0 overflow-y-auto`}>
        {enabledGrids.map((gridId) => renderGridComponent(gridId))}
      </main>

      {/* 自定义配置抽屉 */}
      <WidgetSettingsModal />
    </div>
  );
};
