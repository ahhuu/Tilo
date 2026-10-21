import React from 'react';
import {
  LayoutGrid,
  AlignRight,
  AlignLeft,
  RotateCcw,
  Minimize2,
} from 'lucide-react';
import { useWidgetStore } from '@/stores/widgetStore';
import { useI18n } from '@/core/i18n';
import { InAppWidgetShell } from '@/components/widget/InAppWidgetShell';

/** 格子在工具条上的短名（长名见 WidgetSettingsModal 的描述表） */
const GRID_LABELS: Record<'inbox' | 'tasks' | 'session' | 'timeline' | 'notes', { zh: string; en: string }> = {
  inbox: { zh: '闪念收集', en: 'Inbox' },
  tasks: { zh: '今日待办', en: 'Tasks' },
  session: { zh: '专注计时', en: 'Focus' },
  timeline: { zh: '今日日程', en: 'Timeline' },
  notes: { zh: '随手便签', en: 'Notes' },
};

type ToolbarGridId = keyof typeof GRID_LABELS;

const ALL_GRIDS: { id: ToolbarGridId }[] = [
  { id: 'inbox' },
  { id: 'tasks' },
  { id: 'session' },
  { id: 'timeline' },
  { id: 'notes' },
];

export const InAppWidgetWorkspace: React.FC = () => {
  const { language } = useI18n();
  const {
    settings,
    closeWorkspace,
    openWorkspace,
    toggleActiveGrid,
    alignActiveGrids,
    resetGridPositions,
  } = useWidgetStore();

  const isZh = language === 'zh-CN';
  const { isWorkspaceOpen, activeGrids, gridTransforms } = settings;

  // 当画中画工作区关闭时，在主界面右下角显示小胶囊气泡，可随时展开
  if (!isWorkspaceOpen) {
    return (
      <button
        type="button"
        onClick={openWorkspace}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-3.5 py-2 rounded-full bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-semibold shadow-lg hover:shadow-indigo-500/25 transition-all backdrop-blur-md cursor-pointer group animate-in fade-in zoom-in-95"
        title={isZh ? '展开桌面格子工作区' : 'Open grid workspace'}
      >
        <LayoutGrid className="w-4 h-4 group-hover:rotate-12 transition-transform" />
        <span>{isZh ? '桌面格子' : 'Grids'}</span>
        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
          {activeGrids.length}
        </span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {/* 顶部浮动快捷工具条 */}
      <div className="absolute top-4 right-6 pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
        <div className="flex items-center gap-1.5 pr-2 border-r border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200">
          <LayoutGrid className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>{isZh ? '格子画板' : 'Grid board'}</span>
        </div>

        {/* 快速开关哪些组件 */}
        <div className="flex items-center gap-1">
          {ALL_GRIDS.map((g) => {
            const isActive = activeGrids.includes(g.id);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleActiveGrid(g.id)}
                className={`px-2 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200/60 dark:border-indigo-800/60'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {isZh ? GRID_LABELS[g.id].zh : GRID_LABELS[g.id].en}
              </button>
            );
          })}
        </div>

        {/* 对齐快捷操作 */}
        <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => alignActiveGrids('right')}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title={isZh ? '靠右对齐排列' : 'Align right'}
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => alignActiveGrids('left')}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title={isZh ? '靠左对齐排列' : 'Align left'}
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={resetGridPositions}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title={isZh ? '重置初始位置' : 'Reset positions'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={closeWorkspace}
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer ml-1"
            title={isZh ? '最小化收起画板' : 'Minimize board'}
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 渲染所有处于激活状态的应用内格子 */}
      {activeGrids.map((id) => {
        const transform = gridTransforms[id];
        if (!transform) return null;
        return (
          <div key={id} className="pointer-events-auto">
            <InAppWidgetShell
              gridId={id}
              transform={transform}
              allTransforms={gridTransforms}
              activeIds={activeGrids}
            />
          </div>
        );
      })}
    </div>
  );
};
