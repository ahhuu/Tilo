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
import { useI18n } from '@/core/i18n';

/** 配置面板里可配置的格子（`goals` 等不在本面板暴露） */
type ConfigurableGridId = 'inbox' | 'tasks' | 'session' | 'timeline' | 'notes';

interface GridMeta {
  id: ConfigurableGridId;
  icon: React.ComponentType<{ className?: string }>;
}

/** 顺序即配置面板里的展示顺序 */
const ALL_GRIDS_META: GridMeta[] = [
  { id: 'inbox', icon: Inbox },
  { id: 'tasks', icon: ListTodo },
  { id: 'session', icon: Timer },
  { id: 'timeline', icon: CalendarClock },
  { id: 'notes', icon: StickyNote },
];

/**
 * 文案字典。
 *
 * 挂件窗口是「英文用户最容易直接看到中文」的地方，而这里字符串密度很高，
 * 逐条内联三元会把结构淹没。用一份 zh/en 对照表，模板保持干净，新增文案时
 * 两栏一起加也不会漏。
 */
const COPY = {
  zh: {
    ariaLabel: '自定义桌面快捷格子',
    title: '自定义桌面快捷格子',
    restoreDefaults: '恢复默认',
    done: '完成',
    enabledSection: '开启的格子组件与排序',
    keepAtLeastOne: '至少保留 1 个',
    moveForward: '向前移',
    moveBackward: '向后移',
    on: '已开启',
    off: '启用',
    perGridSection: '各格子专属细节配置',
    tasksGrid: '今日待办格子',
    showCompletedLabel: '是否默认展示已完成：',
    show: '显示',
    hide: '隐藏',
    sessionGrid: '专注计时格子',
    defaultDurationLabel: '默认专注时长：',
    min15: '15 分钟',
    min25: '25 分钟 (番茄钟)',
    min45: '45 分钟',
    freeCountUp: '自由正向计时',
    appearanceSection: '挂件外观与排版',
    opacityLabel: '卡片半透明度：',
    layoutLabel: '并排排版模式：',
    layoutAuto: '自动',
    layoutTwoCol: '双列',
    layoutOneCol: '单列',
    grids: {
      inbox: { name: '闪念收集', desc: '随时记录临时想法、链接与闪念，一键转今日聚焦' },
      tasks: { name: '今日待办', desc: '聚焦与待办清单，即时勾选完成，闭环执行' },
      session: { name: '专注计时', desc: '番茄钟与正向计时，关联任务跟踪今日专注时长' },
      timeline: { name: '今日日程', desc: '今日规划时间块，当前进行中状态与快速专注' },
      notes: { name: '随手便签', desc: '桌面草稿与随手备忘，免格式即时自动保存' },
    },
  },
  en: {
    ariaLabel: 'Customize desktop grids',
    title: 'Customize desktop grids',
    restoreDefaults: 'Restore defaults',
    done: 'Done',
    enabledSection: 'Enabled grids & order',
    keepAtLeastOne: 'Keep at least 1',
    moveForward: 'Move up',
    moveBackward: 'Move down',
    on: 'Enabled',
    off: 'Enable',
    perGridSection: 'Per-grid options',
    tasksGrid: 'Tasks grid',
    showCompletedLabel: 'Show completed by default:',
    show: 'Show',
    hide: 'Hide',
    sessionGrid: 'Focus timer grid',
    defaultDurationLabel: 'Default duration:',
    min15: '15 min',
    min25: '25 min (Pomodoro)',
    min45: '45 min',
    freeCountUp: 'Free count-up',
    appearanceSection: 'Appearance & layout',
    opacityLabel: 'Card opacity:',
    layoutLabel: 'Layout mode:',
    layoutAuto: 'Auto',
    layoutTwoCol: '2 columns',
    layoutOneCol: '1 column',
    grids: {
      inbox: { name: 'Quick inbox', desc: 'Capture fleeting thoughts and links, promote to focus' },
      tasks: { name: 'Today tasks', desc: 'Focus list and to-dos, tick off inline to close the loop' },
      session: { name: 'Focus timer', desc: 'Pomodoro and count-up, tracking focus time per task' },
      timeline: { name: 'Today timeline', desc: "Today's planned blocks, live status and quick start" },
      notes: { name: 'Scratch notes', desc: 'Desktop scratchpad, auto-saved with no formatting' },
    },
  },
} as const;

export const WidgetSettingsModal: React.FC = () => {
  const { language } = useI18n();
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

  const copy = COPY[language === 'zh-CN' ? 'zh' : 'en'];
  const enabledSet = new Set(settings.enabledGrids);

  return (
    <Modal
      onClose={closeSettingsModal}
      ariaLabel={copy.ariaLabel}
      maxWidthClass="sm:max-w-md"
      bodyClassName="p-5"
      header={
        <div className="w-full -mx-5 -mb-3 px-5 pb-3 border-b border-slate-200 dark:border-slate-800 sm:-mx-5 sm:-mb-3 sm:px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {copy.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={closeSettingsModal}
              aria-label={copy.done}
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
            <span>{copy.restoreDefaults}</span>
          </button>

          <button
            type="button"
            onClick={closeSettingsModal}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
          >
            {copy.done}
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
              {copy.enabledSection}
            </span>
            <span className="text-[10px] text-slate-400">{copy.keepAtLeastOne}</span>
          </div>

          <div className="space-y-1.5">
            {ALL_GRIDS_META.map((grid) => {
              const isEnabled = enabledSet.has(grid.id);
              const orderIndex = settings.enabledGrids.indexOf(grid.id);
              const IconComponent = grid.icon;
              const meta = copy.grids[grid.id];

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
                        {meta.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{meta.desc}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isEnabled && (
                      <div className="flex items-center mr-1">
                        <button
                          type="button"
                          disabled={orderIndex === 0}
                          onClick={() => moveGrid(grid.id, 'up')}
                          aria-label={copy.moveForward}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-20"
                          title={copy.moveForward}
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={orderIndex === settings.enabledGrids.length - 1}
                          onClick={() => moveGrid(grid.id, 'down')}
                          aria-label={copy.moveBackward}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-20"
                          title={copy.moveBackward}
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
                      {isEnabled ? copy.on : copy.off}
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
            {copy.perGridSection}
          </span>

          {/* 待办配置 */}
          <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
            <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <ListTodo className="w-3.5 h-3.5 text-emerald-600" />
              <span>{copy.tasksGrid}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">{copy.showCompletedLabel}</span>
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
                {settings.gridSettings.tasks.showCompleted ? copy.show : copy.hide}
              </button>
            </div>
          </div>

          {/* 专注计时配置 */}
          <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
            <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-amber-600" />
              <span>{copy.sessionGrid}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">{copy.defaultDurationLabel}</span>
              <select
                value={settings.gridSettings.session.defaultDurationMinutes}
                onChange={(e) =>
                  updateGridSettings('session', {
                    defaultDurationMinutes: Number(e.target.value),
                  })
                }
                className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value={15}>{copy.min15}</option>
                <option value={25}>{copy.min25}</option>
                <option value={45}>{copy.min45}</option>
                <option value={0}>{copy.freeCountUp}</option>
              </select>
            </div>
          </div>
        </section>

        {/* 3. 外观透明度与排版 */}
        <section className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="font-semibold text-slate-900 dark:text-slate-100 block">
            {copy.appearanceSection}
          </span>

          {/* 毛玻璃透明度 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span>{copy.opacityLabel}</span>
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
              aria-label={copy.opacityLabel}
              className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* 排版方式 */}
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">{copy.layoutLabel}</span>
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
                  {mode === 'auto'
                    ? copy.layoutAuto
                    : mode === 'columns-2'
                      ? copy.layoutTwoCol
                      : copy.layoutOneCol}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
};
