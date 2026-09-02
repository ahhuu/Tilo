import React, { useState, useRef } from 'react';
import {
  Pin,
  Settings2,
  X,
  Inbox,
  CheckSquare,
  Clock,
  Calendar,
  FileText,
  Volume2,
  Sun,
  Moon,
  Magnet,
  Target,
} from 'lucide-react';
import { useWidgetStore } from '@/stores/widgetStore';
import { type WidgetGridId, type InAppGridTransform } from '@/components/widget/widgetTypes';
import { InboxGrid } from '@/components/widget/grids/InboxGrid';
import { TasksGrid } from '@/components/widget/grids/TasksGrid';
import { SessionGrid } from '@/components/widget/grids/SessionGrid';
import { TimelineGrid } from '@/components/widget/grids/TimelineGrid';
import { NotesGrid } from '@/components/widget/grids/NotesGrid';
import { GoalsGrid } from '@/components/widget/grids/GoalsGrid';
import { ambientAudioService, type AmbientSoundType } from '@/core/audio/ambientAudioService';

const GRID_COMPONENTS: Record<WidgetGridId, React.ComponentType> = {
  inbox: InboxGrid,
  tasks: TasksGrid,
  session: SessionGrid,
  timeline: TimelineGrid,
  notes: NotesGrid,
  goals: GoalsGrid,
};

const GRID_ICONS: Record<WidgetGridId, React.ComponentType<{ className?: string }>> = {
  inbox: Inbox,
  tasks: CheckSquare,
  session: Clock,
  timeline: Calendar,
  notes: FileText,
  goals: Target,
};

const GRID_TITLES: Record<WidgetGridId, string> = {
  inbox: '闪念收集 (Inbox)',
  tasks: '今日待办 (Tasks)',
  session: '专注计时 (Focus)',
  timeline: '今日日程 (Timeline)',
  notes: '随手便签 (Notes)',
  goals: '目标看板 (Goals)',
};

interface Props {
  gridId: WidgetGridId;
  transform: InAppGridTransform;
  allTransforms: Record<WidgetGridId, InAppGridTransform>;
  activeIds: WidgetGridId[];
}

export const InAppWidgetShell: React.FC<Props> = ({
  gridId,
  transform,
  allTransforms,
  activeIds,
}) => {
  const {
    settings,
    updateGridTransform,
    bringToFront,
    deactivateGrid,
    updateGridSettings,
    setOpacity,
  } = useWidgetStore();

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showSettings, setShowSettings] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  // 对齐引导线与徽标状态
  const [alignment, setAlignment] = useState<{
    alignLeft: boolean;
    alignRight: boolean;
    alignTop: boolean;
    alignBottom: boolean;
    snapVertical: boolean;
    label: string | null;
  }>({
    alignLeft: false,
    alignRight: false,
    alignTop: false,
    alignBottom: false,
    snapVertical: false,
    label: null,
  });

  const fadeoutTimerRef = useRef<number | null>(null);

  const Component = GRID_COMPONENTS[gridId];
  const IconComponent = GRID_ICONS[gridId];
  const title = GRID_TITLES[gridId];

  // 拖动处理逻辑
  const handleMouseDownHeader = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    bringToFront(gridId);

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startX = transform.x;
    const startY = transform.y;

    if (fadeoutTimerRef.current) clearTimeout(fadeoutTimerRef.current);

    const onMouseMove = (moveEvent: MouseEvent) => {
      let nextX = startX + (moveEvent.clientX - startMouseX);
      let nextY = startY + (moveEvent.clientY - startMouseY);

      // 限制在视口内部
      nextX = Math.max(10, Math.min(window.innerWidth - transform.width - 10, nextX));
      nextY = Math.max(60, Math.min(window.innerHeight - transform.height - 10, nextY));

      // 跨格子对齐计算 (阈值 16px)
      let hasLeft = false;
      let hasRight = false;
      let hasTop = false;
      let hasBottom = false;
      let hasSnap = false;

      for (const otherId of activeIds) {
        if (otherId === gridId) continue;
        const other = allTransforms[otherId];
        if (!other) continue;

        if (Math.abs(nextX - other.x) <= 16) {
          nextX = other.x;
          hasLeft = true;
        }
        if (Math.abs((nextX + transform.width) - (other.x + other.width)) <= 16) {
          nextX = other.x + other.width - transform.width;
          hasRight = true;
        }
        if (Math.abs(nextY - other.y) <= 16) {
          nextY = other.y;
          hasTop = true;
        }
        if (Math.abs((nextY + transform.height) - (other.y + other.height)) <= 16) {
          nextY = other.y + other.height - transform.height;
          hasBottom = true;
        }
        if (Math.abs(nextY - (other.y + other.height)) <= 18) {
          nextY = other.y + other.height + 8;
          hasSnap = true;
        }
      }

      let label: string | null = null;
      if (hasTop && hasBottom) label = '水平并排对齐';
      else if (hasLeft && hasRight) label = '垂直对齐';
      else if (hasSnap) label = '垂直贴靠吸附';
      else if (hasTop) label = '顶部对齐';
      else if (hasBottom) label = '底部对齐';
      else if (hasLeft) label = '左侧对齐';
      else if (hasRight) label = '右侧对齐';

      setAlignment({
        alignLeft: hasLeft,
        alignRight: hasRight,
        alignTop: hasTop,
        alignBottom: hasBottom,
        snapVertical: hasSnap,
        label,
      });

      updateGridTransform(gridId, { x: nextX, y: nextY });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      fadeoutTimerRef.current = window.setTimeout(() => {
        setAlignment({
          alignLeft: false,
          alignRight: false,
          alignTop: false,
          alignBottom: false,
          snapVertical: false,
          label: null,
        });
      }, 800);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // 尺寸拉伸调整逻辑 (Resize)
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    bringToFront(gridId);

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startW = transform.width;
    const startH = transform.height;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const nextW = Math.max(260, Math.min(window.innerWidth - transform.x - 20, startW + (moveEvent.clientX - startMouseX)));
      const nextH = Math.max(260, Math.min(window.innerHeight - transform.y - 20, startH + (moveEvent.clientY - startMouseY)));
      updateGridTransform(gridId, { width: nextW, height: nextH });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleAmbientSoundChange = (sound: 'none' | 'rain' | 'whitenoise' | 'birds' | 'fireplace') => {
    updateGridSettings('session', { ambientSound: sound });
    if (sound === 'none') {
      ambientAudioService.stop();
    } else {
      const typeMap: Record<string, AmbientSoundType> = {
        rain: 'rain',
        whitenoise: 'white_noise',
        birds: 'waves',
        fireplace: 'white_noise',
      };
      ambientAudioService.playSound(typeMap[sound] || 'rain');
    }
  };

  return (
    <div
      onMouseDown={() => bringToFront(gridId)}
      className="absolute select-none transition-shadow duration-150"
      style={{
        left: transform.x,
        top: transform.y,
        width: transform.width,
        height: transform.height,
        zIndex: isPinned ? 999 : transform.zIndex,
      }}
    >
      {/* 核心卡片容器 */}
      <div
        className={`w-full h-full rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 shadow-xl backdrop-blur-xl flex flex-col overflow-hidden relative ${
          theme === 'dark' ? 'dark text-slate-100' : 'text-slate-900'
        }`}
        style={{ opacity: settings.opacityPercent / 100 }}
      >
        {/* 对齐微光边线 */}
        {alignment.alignLeft && (
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-indigo-500 shadow-[0_0_10px_#6366f1] z-50 pointer-events-none" />
        )}
        {alignment.alignRight && (
          <div className="absolute top-0 bottom-0 right-0 w-1 bg-indigo-500 shadow-[0_0_10px_#6366f1] z-50 pointer-events-none" />
        )}
        {alignment.alignTop && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500 shadow-[0_0_10px_#6366f1] z-50 pointer-events-none" />
        )}
        {(alignment.alignBottom || alignment.snapVertical) && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 shadow-[0_0_10px_#6366f1] z-50 pointer-events-none" />
        )}

        {/* 顶栏：按住拖动 */}
        <header
          onMouseDown={handleMouseDownHeader}
          className="flex items-center justify-between px-3.5 py-2 border-b border-slate-200/50 dark:border-slate-800/60 bg-slate-50/80 dark:bg-slate-800/60 shrink-0 cursor-move relative"
        >
          <div className="flex items-center gap-2 min-w-0 pointer-events-none">
            <div className="w-5 h-5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-2xs shrink-0">
              <IconComponent className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 tracking-wide truncate">
              {title}
            </span>
          </div>

          {/* 实时对齐状态徽标 */}
          {alignment.label && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-600/90 text-white text-[10px] font-medium shadow-xs shrink-0 whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-150">
              <Magnet className="w-2.5 h-2.5" />
              <span>{alignment.label}</span>
            </div>
          )}

          {/* 右侧控制按钮 */}
          <div className="flex items-center gap-1 cursor-default shrink-0">
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                isPinned
                  ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-slate-800/60'
              }`}
              title={isPinned ? '取消置顶' : '在画布中始终置顶'}
            >
              <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                showSettings
                  ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-slate-800/60'
              }`}
              title="个性化设置"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              title="切换亮/暗色"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => deactivateGrid(gridId)}
              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="从画中画中关闭"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* 核心内容展示区 */}
        <div className="flex-1 min-h-0 overflow-auto relative">
          <Component />

          {/* 专属抽屉配置面板 */}
          {showSettings && (
            <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-40 p-4 flex flex-col overflow-y-auto animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Settings2 className="w-3.5 h-3.5 text-indigo-500" />
                  {title} 专属配置
                </span>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 通用毛玻璃透明度 */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                  <span>画中画透明度</span>
                  <span className="font-medium">{settings.opacityPercent}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={settings.opacityPercent}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* 随手便签专属设置 */}
              {gridId === 'notes' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">纸张底色主题</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['classic', 'yellow', 'mint', 'dark'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => updateGridSettings('notes', { paperTheme: t })}
                          className={`py-1 rounded text-center border capitalize ${
                            settings.gridSettings.notes.paperTheme === t
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 font-bold text-indigo-600'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {t === 'classic' ? '经典白' : t === 'yellow' ? '暖黄便签' : t === 'mint' ? '薄荷绿' : '极夜黑'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">默认启动模式</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['edit', 'preview'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => updateGridSettings('notes', { defaultMode: m })}
                          className={`py-1 rounded text-center border ${
                            settings.gridSettings.notes.defaultMode === m
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 font-bold text-indigo-600'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {m === 'edit' ? '写作编辑' : '渲染预览'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 专注计时专属设置 */}
              {gridId === 'session' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                      白噪音自然音效
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'none', label: '无声音' },
                        { id: 'rain', label: '细雨淅沥' },
                        { id: 'whitenoise', label: '白噪音' },
                        { id: 'birds', label: '林间鸟鸣' },
                        { id: 'fireplace', label: '壁炉火光' },
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleAmbientSoundChange(s.id as 'none' | 'rain' | 'whitenoise' | 'birds' | 'fireplace')}
                          className={`py-1 px-1.5 rounded text-center border truncate ${
                            settings.gridSettings.session.ambientSound === s.id
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 font-bold text-indigo-600'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 今日待办专属设置 */}
              {gridId === 'tasks' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">任务排序规则</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'priority', label: '按优先级' },
                        { id: 'time', label: '按截止时间' },
                        { id: 'manual', label: '手动排序' },
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => updateGridSettings('tasks', { sortBy: s.id as 'priority' | 'time' | 'manual' })}
                          className={`py-1 rounded text-center border ${
                            settings.gridSettings.tasks.sortBy === s.id
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 font-bold text-indigo-600'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 闪念收集专属设置 */}
              {gridId === 'inbox' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">列表呈现密度</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'comfortable', label: '宽敞模式' },
                        { id: 'compact', label: '紧凑模式' },
                      ].map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => updateGridSettings('inbox', { displayDensity: d.id as 'comfortable' | 'compact' })}
                          className={`py-1 rounded text-center border ${
                            settings.gridSettings.inbox.displayDensity === d.id
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 font-bold text-indigo-600'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 今日日程专属设置 */}
              {gridId === 'timeline' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">日程展示范围</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'upcoming', label: '即将开始' },
                        { id: 'allDay', label: '全天日程' },
                        { id: 'afternoon', label: '午后时间' },
                      ].map((sc) => (
                        <button
                          key={sc.id}
                          type="button"
                          onClick={() => updateGridSettings('timeline', { scope: sc.id as 'upcoming' | 'allDay' | 'afternoon' })}
                          className={`py-1 rounded text-center border ${
                            settings.gridSettings.timeline.scope === sc.id
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 font-bold text-indigo-600'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {sc.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 右下角自由缩放拉伸手柄 (Resize Handle) */}
        <div
          onMouseDown={handleMouseDownResize}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center text-slate-400 hover:text-indigo-600 z-30 group"
          title="按住拖拽调整尺寸"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-indigo-500 transition-colors" />
        </div>
      </div>
    </div>
  );
};
