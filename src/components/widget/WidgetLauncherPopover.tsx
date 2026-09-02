import React, { useState, useEffect, useRef } from 'react';
import {
  Inbox,
  ListTodo,
  Timer,
  CalendarClock,
  StickyNote,
  Target,
  LayoutGrid,
  ExternalLink,
  MinusCircle,
  Sparkles,
  AlignRight,
  AlignLeft,
} from 'lucide-react';
import { useI18n } from '@/core/i18n';
import { tauriWidgetService } from '@/services/tauriWidgetService';
import type { WidgetGridId } from './widgetTypes';

interface WidgetLauncherPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GridItemConfig {
  id: WidgetGridId;
  nameZh: string;
  nameEn: string;
  descZh: string;
  descEn: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const GRID_ITEMS: GridItemConfig[] = [
  {
    id: 'inbox',
    nameZh: '闪念收集',
    nameEn: 'Inbox',
    descZh: '临时想法、链接与灵感随手捕获',
    descEn: 'Capture ideas, links & quick thoughts',
    icon: Inbox,
    color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60',
  },
  {
    id: 'tasks',
    nameZh: '今日待办',
    nameEn: 'Today Tasks',
    descZh: '今日聚焦清单，即时勾选完成闭环',
    descEn: 'Today focus list & immediate task completion',
    icon: ListTodo,
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60',
  },
  {
    id: 'session',
    nameZh: '专注计时',
    nameEn: 'Focus Timer',
    descZh: '番茄钟与任务关联计时跟踪',
    descEn: 'Pomodoro & task session tracking',
    icon: Timer,
    color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60',
  },
  {
    id: 'timeline',
    nameZh: '今日日程',
    nameEn: 'Timeline',
    descZh: '今日计划时间块与进行中状态',
    descEn: 'Planned blocks & active schedule',
    icon: CalendarClock,
    color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60',
  },
  {
    id: 'notes',
    nameZh: '随手便签',
    nameEn: 'Notes',
    descZh: '桌面免格式草稿与即时自动备忘',
    descEn: 'Quick markdown scratchpad & desktop notes',
    icon: StickyNote,
    color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/60',
  },
  {
    id: 'goals',
    nameZh: '目标看板',
    nameEn: 'Goals Board',
    descZh: '核心目标进度与里程碑 D-Day 倒计时',
    descEn: 'OKR progress & milestone D-Day countdown',
    icon: Target,
    color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60',
  },
];

export const WidgetLauncherPopover: React.FC<WidgetLauncherPopoverProps> = ({
  isOpen,
  onClose,
}) => {
  const { language } = useI18n();
  const isZh = language === 'zh-CN';
  const popoverRef = useRef<HTMLDivElement>(null);
  const [activeIds, setActiveIds] = useState<Set<WidgetGridId>>(new Set());

  // 刷新当前活动的挂件状态
  const refreshActiveStates = async () => {
    const nextSet = new Set<WidgetGridId>();
    for (const item of GRID_ITEMS) {
      const visible = await tauriWidgetService.isWidgetVisible(item.id);
      if (visible) {
        nextSet.add(item.id);
      }
    }
    setActiveIds(nextSet);
  };

  useEffect(() => {
    if (isOpen) {
      refreshActiveStates();
    }
  }, [isOpen]);

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleToggle = async (id: WidgetGridId) => {
    await tauriWidgetService.toggleWidget(id);
    await refreshActiveStates();
  };

  const handleOpenDual = async () => {
    await tauriWidgetService.openDualDefaultWidgets();
    await refreshActiveStates();
    onClose();
  };

  const handleCloseAll = async () => {
    await tauriWidgetService.closeAllWidgets();
    await refreshActiveStates();
  };

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-3.5 z-50 select-none animate-in fade-in zoom-in-95 duration-150"
    >
      {/* 头部 */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <LayoutGrid className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {isZh ? '桌面挂件中心' : 'Desktop Widgets'}
          </h4>
        </div>
        <button
          type="button"
          onClick={handleOpenDual}
          className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 text-[10px] font-medium hover:bg-indigo-100 transition-colors cursor-pointer"
          title={isZh ? '在桌面打开【闪念收集】与【今日待办】' : 'Open Inbox & Today Tasks on desktop'}
        >
          <Sparkles className="w-3 h-3" />
          <span>{isZh ? '打开收集与待办' : 'Launch Inbox & Tasks'}</span>
        </button>
      </div>

      {/* 挂件一键智能贴边对齐 */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-800/60 text-[11px] text-slate-600 dark:text-slate-300 mt-2">
        <span className="font-medium text-slate-500 dark:text-slate-400">
          {isZh ? '一键对齐排列:' : 'Quick Align:'}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => tauriWidgetService.alignWidgets('right')}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-2xs cursor-pointer text-[10px]"
            title={isZh ? '将桌面所有挂件靠右整齐垂直排列' : 'Align all desktop widgets to right edge'}
          >
            <AlignRight className="w-3 h-3" />
            <span>{isZh ? '靠右贴边' : 'Align Right'}</span>
          </button>
          <button
            type="button"
            onClick={() => tauriWidgetService.alignWidgets('left')}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-2xs cursor-pointer text-[10px]"
            title={isZh ? '将桌面所有挂件靠左整齐垂直排列' : 'Align all desktop widgets to left edge'}
          >
            <AlignLeft className="w-3 h-3" />
            <span>{isZh ? '靠左贴边' : 'Align Left'}</span>
          </button>
        </div>
      </div>

      {/* 格子列表 */}
      <div className="py-2.5 space-y-1.5 max-h-72 overflow-y-auto">
        {GRID_ITEMS.map((grid) => {
          const isOpenOnDesktop = activeIds.has(grid.id);
          const IconComp = grid.icon;

          return (
            <button
              key={grid.id}
              type="button"
              onClick={() => handleToggle(grid.id)}
              className={`w-full flex items-center justify-between p-2 rounded-xl border transition-all text-left cursor-pointer group ${
                isOpenOnDesktop
                  ? 'bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/80 shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${grid.color}`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span>{isZh ? grid.nameZh : grid.nameEn}</span>
                    {isOpenOnDesktop && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {isZh ? grid.descZh : grid.descEn}
                  </div>
                </div>
              </div>

              <div className="shrink-0 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </button>
          );
        })}
      </div>

      {/* 底部收起所有 */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
        <span>{isZh ? '支持在桌面边缘自由拉伸改变大小' : 'Freely resize along edges'}</span>
        <button
          type="button"
          onClick={handleCloseAll}
          className="flex items-center gap-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
        >
          <MinusCircle className="w-3 h-3" />
          <span>{isZh ? '收起全部挂件' : 'Close All'}</span>
        </button>
      </div>
    </div>
  );
};
