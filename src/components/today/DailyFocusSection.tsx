import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useI18n } from '@/core/i18n';
import { timeService } from '@/core/time/timeService';
import {
  GripVertical,
  CheckCircle2,
  Play,
  X,
  Target,
  Calendar,
  Plus,
  Info,
  Crosshair,
} from 'lucide-react';
import type { Task, Project, PlannedBlock } from '@/core/types/domain';

interface SortableFocusItemProps {
  task: Task;
  rank: number;
  project?: Project;
  plannedBlock?: PlannedBlock;
  onInspect: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
  onStartSession: (task: Task) => void;
  onRemoveFromFocus: (task: Task) => void;
}

const SortableFocusItem: React.FC<SortableFocusItemProps> = ({
  task,
  rank,
  project,
  plannedBlock,
  onInspect,
  onToggleComplete,
  onStartSession,
  onRemoveFromFocus,
}) => {
  const { language } = useI18n();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 20 : 1,
  };

  const isDone =
    task.statusId === 'ws-task-done' ||
    task.statusId?.toLowerCase().includes('done') ||
    task.statusId?.toLowerCase().includes('completed');

  // Format time range (e.g. 09:00 – 11:30) if planned block exists
  const timeRangeText = plannedBlock
    ? `${timeService.formatTime(plannedBlock.startAt)} – ${timeService.formatTime(plannedBlock.endAt)}`
    : task.scheduledDate
      ? (language === 'zh-CN' ? '今日排期' : 'Today')
      : null;

  // Format duration text (e.g. 2h 30m)
  const durationText = plannedBlock
    ? timeService.formatDuration((plannedBlock.endAt - plannedBlock.startAt) / 1000)
    : task.estimateMinutes && task.estimateMinutes > 0
      ? `${Math.floor(task.estimateMinutes / 60) > 0 ? Math.floor(task.estimateMinutes / 60) + 'h ' : ''}${task.estimateMinutes % 60 > 0 ? (task.estimateMinutes % 60) + 'm' : ''}`.trim()
      : '30m';

  // Priority 1: Planned block title from timeline, Priority 2: Task tag, Priority 3: Default 'Deep Work'
  const blockTag =
    plannedBlock?.title || (task.tagIds && task.tagIds.length > 0 ? task.tagIds[0] : 'Deep Work');

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onInspect(task)}
      className={`p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group select-none ${
        isDone ? 'opacity-60 bg-slate-50/40 dark:bg-slate-900/20' : ''
      }`}
    >
      {/* Responsive layout: Top row with Rank, Title, and Action buttons; Bottom row with Project, Tag & Time */}
      <div className="flex items-start justify-between gap-3">
        {/* Left: Drag handle + Rank/Complete circle + Title */}
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <button
            type="button"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="p-1 text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing sm:opacity-0 sm:group-hover:opacity-100 opacity-60 transition-opacity mt-0.5"
            title={language === 'zh-CN' ? '拖拽调整排序' : 'Drag to reorder'}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>

          {/* Big circular rank pill with interactive complete/reopen toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(task);
            }}
            className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 border transition-all cursor-pointer mt-0.5 ${
              isDone
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-800'
                : 'bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-100/60 dark:border-indigo-900/60 hover:border-emerald-400 hover:text-emerald-600'
            }`}
            title={isDone ? (language === 'zh-CN' ? '点击撤销完成 (恢复未完成)' : 'Click to reopen') : (language === 'zh-CN' ? '点击标记为完成' : 'Click to complete')}
          >
            {isDone ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : rank}
          </button>

          <div className="min-w-0 flex-1">
            <h4
              className={`text-sm font-semibold transition-colors leading-snug break-words line-clamp-2 ${
                isDone
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
              }`}
            >
              {task.title}
            </h4>

            {/* Sub details: Project, Block Tag, Time info */}
            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              <span className="flex items-center gap-1 shrink-0 font-medium">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: project?.color || '#6366f1' }}
                />
                <span className="truncate max-w-32">{project ? project.name : (language === 'zh-CN' ? '独立任务' : 'Standalone')}</span>
              </span>

              {blockTag && (
                <span className="px-1.5 py-0.2 rounded-md text-[10px] font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40 shrink-0">
                  {blockTag}
                </span>
              )}

              {(timeRangeText || durationText) && (
                <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400 shrink-0">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>{timeRangeText ? `${timeRangeText} · ${durationText}` : durationText}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side: Action buttons always accessible on mobile, no hover barrier */}
        <div className="flex items-center gap-1 shrink-0 pl-1 mt-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveFromFocus(task);
            }}
            className="p-1.5 text-slate-400 hover:text-red-500 rounded-full sm:opacity-0 sm:group-hover:opacity-100 opacity-70 transition-all cursor-pointer"
            title={language === 'zh-CN' ? '从聚焦中移除' : 'Remove from Focus'}
          >
            <X className="w-4 h-4" />
          </button>

          {/* Big circular Play button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStartSession(task);
            }}
            className="w-8 h-8 rounded-full border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:border-indigo-400 flex items-center justify-center transition-all shadow-2xs cursor-pointer group/btn shrink-0 ml-1"
            title={language === 'zh-CN' ? '开启专注会话' : 'Start Focus Session'}
          >
            <Play className="w-3.5 h-3.5 fill-indigo-600 ml-0.5 group-hover/btn:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

interface DailyFocusSectionProps {
  focusTasks: Task[];
  projectMap: Map<string, Project>;
  plannedBlocks?: PlannedBlock[];
  limit?: number;
  onReorder: (taskIds: string[]) => Promise<void>;
  onInspect: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
  onStartSession: (task: Task) => void;
  onRemoveFromFocus: (task: Task) => void;
  onAddFocus?: () => void;
}

export const DailyFocusSection: React.FC<DailyFocusSectionProps> = ({
  focusTasks,
  projectMap,
  plannedBlocks = [],
  limit = 3,
  onReorder,
  onInspect,
  onToggleComplete,
  onStartSession,
  onRemoveFromFocus,
  onAddFocus,
}) => {
  const { t, language } = useI18n();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = focusTasks.findIndex((t) => t.id === active.id);
    const newIndex = focusTasks.findIndex((t) => t.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(focusTasks, oldIndex, newIndex);
      await onReorder(reordered.map((t) => t.id));
    }
  };

  const plannedBlockMap = new Map(
    plannedBlocks.filter((b) => b.taskId).map((b) => [b.taskId as string, b])
  );

  return (
    <div className="space-y-2">
      {/* Header bar matching reference FOCUS ⓘ */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
        <div className="flex items-center gap-1.5">
          <Crosshair className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>{t('today.dailyFocus')} ({focusTasks.length}/{limit})</span>
          <span title={language === 'zh-CN' ? '今日最重要的核心战略任务，支持拖拽排序' : 'High-impact core tasks for today'}>
            <Info className="w-3 h-3 text-slate-400 inline cursor-help" />
          </span>
        </div>
        <span className="text-[11px] font-normal text-slate-400 lowercase">
          {language === 'zh-CN' ? '拖拽调整优先级' : 'drag to reorder rank'}
        </span>
      </div>

      {/* Main Rounded Focus Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden shadow-xs">
        {focusTasks.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 space-y-2">
            <Target className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              {language === 'zh-CN' ? '今日未设定聚焦任务' : 'No Daily Focus Selected'}
            </p>
            <p className="text-[11px]">
              {language === 'zh-CN'
                ? `从下方待办中挑选至多 ${limit} 项最具价值的核心任务。`
                : `Pick up to ${limit} high-impact tasks from today’s priorities.`}
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={focusTasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {focusTasks.map((task, index) => (
                <SortableFocusItem
                  key={task.id}
                  task={task}
                  rank={index + 1}
                  project={task.projectId ? projectMap.get(task.projectId) : undefined}
                  plannedBlock={plannedBlockMap.get(task.id)}
                  onInspect={onInspect}
                  onToggleComplete={onToggleComplete}
                  onStartSession={onStartSession}
                  onRemoveFromFocus={onRemoveFromFocus}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}

        {/* Bottom + Add focus button matching reference screenshot */}
        {onAddFocus && focusTasks.length < limit && (
          <button
            type="button"
            onClick={onAddFocus}
            className="w-full flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'zh-CN' ? '添加聚焦任务' : 'Add focus'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
