import React from 'react';
import Modal from '@/components/ui/Modal';
import {
  X,
  ChevronUp,
  ChevronDown,
  Sliders,
  RotateCcw,
  Inbox,
  ListTodo,
  Timer,
  CalendarClock,
  StickyNote,
} from 'lucide-react';
import { useWidgetStore } from '@/stores/widgetStore';
import type { WidgetGridId } from '@/components/widget/widgetTypes';

interface GridMeta {
  id: WidgetGridId;
  name: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ALL_GRIDS_META: GridMeta[] = [
  {
    id: 'inbox',
    name: '闪念收集 (Inbox)',
    desc: '随时记录临时想法、链接与闪念，一键转今日聚焦',
    icon: Inbox,
  },
  {
    id: 'tasks',
    name: '今日待办 (Tasks)',
    desc: '聚焦与待办清单，即时勾选完成，闭环执行',
    icon: ListTodo,
  },
  {
    id: 'session',
    name: '专注计时 (Session)',
    desc: '番茄钟与正向计时，关联任务跟踪今日专注时长',
    icon: Timer,
  },
  {
    id: 'timeline',
    name: '今日日程 (Timeline)',
    desc: '今日规划时间块，当前进行中状态与快速专注',
    icon: CalendarClock,
  },
  {
    id: 'notes',
    name: '随手便签 (Notes)',
    desc: '桌面草稿与随手备忘，免格式即时自动保存',
    icon: StickyNote,
  },
];

export const WidgetSettingsModal: React.FC = () => {
  const {
    settings,
    isSettingsModalOpen,
    closeSettingsModal,
    toggleGrid,
    moveGrid,
    updateGridSettings,
    setOpacity,
    setLayoutMode,
    resetToDefaults,
  } = useWidgetStore();

  if (!isSettingsModalOpen) return null;

  const enabledSet = new Set(settings.enabledGrids);

  return (
    <Modal
      onClose={closeSettingsModal}
      ariaLabel="自定义桌面快捷格子"
      maxWidthClass="sm:max-w-md"
      bodyClassName="p-5"
      header={
        <div className="w-full -mx-5 -mb-3 px-5 pb-3 border-b border-slate-200 dark:border-slate-800 sm:-mx-5 sm:-mb-3 sm:px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                自定义桌面快捷格子
              </h3>
            </div>
            <button
              type="button"
              onClick={closeSettingsModal}
              aria-label="Close"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={resetToDefaults}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>恢复默认</span>
          </button>

          <button
            type="button"
            onClick={closeSettingsModal}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
          >
            完成
          </button>
        </div>
      }
    >

        {/* 主体滚动区 */}
        <div className="space-y-6 text-xs">
          {/* 1. 启用的格子与顺序 */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                开启的格子组件与排序
              </span>
              <span className="text-[10px] text-slate-400">至少保留 1 个</span>
            </div>

            <div className="space-y-1.5">
              {ALL_GRIDS_META.map((grid) => {
                const isEnabled = enabledSet.has(grid.id);
                const orderIndex = settings.enabledGrids.indexOf(grid.id);
                const IconComponent = grid.icon;

                return (
                  <div
                    key={grid.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isEnabled
                        ? 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700/80 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isEnabled
                            ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {grid.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">{grid.desc}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isEnabled && (
                        <div className="flex items-center mr-1">
                          <button
                            type="button"
                            disabled={orderIndex === 0}
                            onClick={() => moveGrid(grid.id, 'up')}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-20"
                            title="向前移"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={orderIndex === settings.enabledGrids.length - 1}
                            onClick={() => moveGrid(grid.id, 'down')}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-20"
                            title="向后移"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleGrid(grid.id)}
                        className={`px-2.5 py-1 rounded-lg font-medium text-xs transition-colors cursor-pointer ${
                          isEnabled
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {isEnabled ? '已开启' : '启用'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 2. 各格子独立功能定制 */}
          <section className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="font-semibold text-slate-900 dark:text-slate-100 block">
              各格子专属细节配置
            </span>

            {/* 待办配置 */}
            <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
              <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ListTodo className="w-3.5 h-3.5 text-emerald-600" />
                <span>今日待办格子</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">是否默认展示已完成：</span>
                <button
                  type="button"
                  onClick={() =>
                    updateGridSettings('tasks', {
                      showCompleted: !settings.gridSettings.tasks.showCompleted,
                    })
                  }
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                    settings.gridSettings.tasks.showCompleted
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                  }`}
                >
                  {settings.gridSettings.tasks.showCompleted ? '显示' : '隐藏'}
                </button>
              </div>
            </div>

            {/* 专注计时配置 */}
            <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
              <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-amber-600" />
                <span>专注计时格子</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">默认专注时长：</span>
                <select
                  value={settings.gridSettings.session.defaultDurationMinutes}
                  onChange={(e) =>
                    updateGridSettings('session', {
                      defaultDurationMinutes: Number(e.target.value),
                    })
                  }
                  className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value={15}>15 分钟</option>
                  <option value={25}>25 分钟 (番茄钟)</option>
                  <option value={45}>45 分钟</option>
                  <option value={0}>自由正向计时</option>
                </select>
              </div>
            </div>
          </section>

          {/* 3. 外观透明度与排版 */}
          <section className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="font-semibold text-slate-900 dark:text-slate-100 block">
              挂件外观与排版
            </span>

            {/* 毛玻璃透明度 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>卡片半透明度：</span>
                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                  {settings.opacityPercent}%
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={100}
                value={settings.opacityPercent}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* 排版方式 */}
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">并排排版模式：</span>
              <div className="flex items-center gap-1">
                {(['auto', 'columns-2', 'columns-1'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setLayoutMode(mode)}
                    className={`px-2 py-1 rounded-lg font-medium transition-all ${
                      settings.layoutMode === mode
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {mode === 'auto' ? '自动' : mode === 'columns-2' ? '双列' : '单列'}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

    </Modal>
  );
};
