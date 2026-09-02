import React, { useState, useRef, useEffect, useCallback } from 'react';
import { db } from '@/storage/db';
import { useI18n } from '@/core/i18n';
import { timeService } from '@/core/time/timeService';
import { Badge } from '@/components/ui/Badge';
import {
  calculateTimelineLayout,
  calculateDailyCapacity,
  snapTimestamp,
} from '@/core/timeline/timelineEngine';
import { calculateGhostEndTime } from '@/services/elasticPushService';
import { InlineCreatePopover } from './InlineCreatePopover';
import type {
  TimelineFilter,
  DailyCapacityConfig,
} from '@/core/timeline/types';
import type { PlannedBlock, Session, Task, Project, PlannedBlockType } from '@/core/types/domain';
import {
  Clock,
  Layers,
  Target,
  AlertTriangle,
  Trash2,
  Plus,
  Play,
  Sparkles,
} from 'lucide-react';

interface TimelineViewProps {
  dateStr: string; // YYYY-MM-DD
  tasks: Task[];
  projects: Project[];
  plannedBlocks: PlannedBlock[];
  sessions: Session[];
  filter?: TimelineFilter;
  onFilterChange?: (filter: TimelineFilter) => void;
  capacityConfig?: DailyCapacityConfig;
  onUpdateCapacityOverride?: (dateStr: string, minutes: number) => void;
  onInspectTask?: (task: Task) => void;
  onInspectBlock?: (block: PlannedBlock) => void;
  onInspectSession?: (session: Session) => void;
  onCreatePlannedBlock?: (data: {
    title: string;
    type: PlannedBlockType;
    startAt: number;
    endAt: number;
    taskId?: string;
    projectId?: string;
  }) => Promise<PlannedBlock>;
  onUpdatePlannedBlock?: (
    blockId: string,
    updates: Partial<Omit<PlannedBlock, 'id' | 'workspaceId' | 'createdAt'>>
  ) => Promise<PlannedBlock>;
  onDeletePlannedBlock?: (blockId: string) => Promise<void>;
  onDeleteSession?: (sessionId: string) => Promise<void>;
  onStartSession?: (task: Task | { id: string; title: string; projectId?: string }) => void;
  compact?: boolean;
  className?: string;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  dateStr,
  tasks,
  projects,
  plannedBlocks,
  sessions,
  filter: controlledFilter,
  onFilterChange,
  capacityConfig = { weekdayMinutes: 480, weekendMinutes: 240, overrides: {} },
  onUpdateCapacityOverride,
  onInspectTask,
  onInspectBlock,
  onInspectSession,
  onCreatePlannedBlock,
  onUpdatePlannedBlock,
  onDeletePlannedBlock,
  onDeleteSession,
  onStartSession,
  compact = false,
  className = '',
}) => {
  const { language } = useI18n();
  const [internalFilter, setInternalFilter] = useState<TimelineFilter>('all');
  const activeFilter = controlledFilter || internalFilter;

  const handleSetFilter = (newFilter: TimelineFilter) => {
    if (onFilterChange) {
      onFilterChange(newFilter);
    } else {
      setInternalFilter(newFilter);
    }
  };

  const gridRef = useRef<HTMLDivElement>(null);
  const startOfDayMs = timeService.getStartOfLogicalDay(dateStr);
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  // Inline creation state
  const [createDraftRange, setCreateDraftRange] = useState<{
    startAt: number;
    endAt: number;
  } | null>(null);

  // Drag selection on empty grid
  const [isDragCreating, setIsDragCreating] = useState(false);
  const [dragCreateStartMs, setDragCreateStartMs] = useState<number | null>(null);
  const [dragCreateCurrentMs, setDragCreateCurrentMs] = useState<number | null>(null);

  // Drag Move & Resize state
  const [activeResizeBlock, setActiveResizeBlock] = useState<{
    blockId: string;
    edge: 'top' | 'bottom' | 'move';
    initialStartAt: number;
    initialEndAt: number;
    currentStartAt: number;
    currentEndAt: number;
  } | null>(null);

  const HOUR_HEIGHT = 56;

  // Calculate layout with dynamic auto-expanding range
  const layout = calculateTimelineLayout({
    startOfDayMs,
    startHour: 6,
    endHour: 23,
    plannedBlocks,
    sessions,
    filter: activeFilter,
  });

  const capacityInfo = calculateDailyCapacity(dateStr, plannedBlocks, capacityConfig);

  // Current now indicator
  const isToday = dateStr === timeService.getLogicalDate();
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!isToday) return;
    const interval = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(interval);
  }, [isToday]);

  // Keyboard shortcut: Press B to create block starting from now
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable) {
        return;
      }
      if ((e.key === 'b' || e.key === 'B') && !e.ctrlKey && !e.metaKey && !e.altKey && !createDraftRange) {
        e.preventDefault();
        const exactNow = Date.now();
        setCreateDraftRange({
          startAt: exactNow,
          endAt: exactNow + 3600000,
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createDraftRange]);

  const totalRangeMs = (layout.endHour - layout.startHour) * 3600000;
  const nowPercent = isToday
    ? Math.max(
        0,
        Math.min(
          100,
          ((nowMs - (startOfDayMs + layout.startHour * 3600000)) / totalRangeMs) * 100
        )
      )
    : null;

  // Helper to convert Pointer Y to timestamp ms snapped to 15m
  const getTimeFromPointerY = useCallback(
    (clientY: number): number => {
      if (!gridRef.current) return startOfDayMs + layout.startHour * 3600000;
      const rect = gridRef.current.getBoundingClientRect();
      const relativeY = Math.max(0, Math.min(rect.height, clientY - rect.top));
      const percent = relativeY / rect.height;
      const rawMs = startOfDayMs + layout.startHour * 3600000 + percent * totalRangeMs;
      return snapTimestamp(rawMs, 15);
    },
    [startOfDayMs, layout.startHour, totalRangeMs]
  );

  // Handlers for drag-create on grid background
  const handleGridPointerDown = (e: React.PointerEvent) => {
    if (e.target !== gridRef.current && !(e.target as HTMLElement).classList.contains('timeline-slot-bg')) {
      return;
    }
    const snappedMs = getTimeFromPointerY(e.clientY);
    setIsDragCreating(true);
    setDragCreateStartMs(snappedMs);
    setDragCreateCurrentMs(snappedMs + 3600000); // 1 hr draft default
  };

  const handleGridPointerMove = (e: React.PointerEvent) => {
    if (isDragCreating && dragCreateStartMs !== null) {
      const snappedMs = getTimeFromPointerY(e.clientY);
      setDragCreateCurrentMs(snappedMs);
    } else if (activeResizeBlock) {
      const currentMs = getTimeFromPointerY(e.clientY);
      if (activeResizeBlock.edge === 'bottom') {
        const newEndAt = Math.max(activeResizeBlock.initialStartAt + 900000, currentMs);
        setActiveResizeBlock((prev) => prev && { ...prev, currentEndAt: newEndAt });
      } else if (activeResizeBlock.edge === 'top') {
        const newStartAt = Math.min(activeResizeBlock.initialEndAt - 900000, currentMs);
        setActiveResizeBlock((prev) => prev && { ...prev, currentStartAt: newStartAt });
      } else if (activeResizeBlock.edge === 'move') {
        const blockDuration = activeResizeBlock.initialEndAt - activeResizeBlock.initialStartAt;
        const newStartAt = currentMs;
        const newEndAt = newStartAt + blockDuration;
        setActiveResizeBlock((prev) => prev && { ...prev, currentStartAt: newStartAt, currentEndAt: newEndAt });
      }
    }
  };

  const handleGridPointerUp = () => {
    if (isDragCreating && dragCreateStartMs !== null && dragCreateCurrentMs !== null) {
      const startAt = Math.min(dragCreateStartMs, dragCreateCurrentMs);
      const endAt = Math.max(
        startAt + 900000, // min 15m
        Math.max(dragCreateStartMs, dragCreateCurrentMs)
      );
      setCreateDraftRange({ startAt, endAt });
      setIsDragCreating(false);
      setDragCreateStartMs(null);
      setDragCreateCurrentMs(null);
    } else if (activeResizeBlock) {
      if (onUpdatePlannedBlock) {
        onUpdatePlannedBlock(activeResizeBlock.blockId, {
          startAt: activeResizeBlock.currentStartAt,
          endAt: activeResizeBlock.currentEndAt,
        });
      }
      setActiveResizeBlock(null);
    }
  };

  // Drop target for dragging unscheduled task directly into timeline
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('application/json-task-id') || e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    let task = taskMap.get(taskId);
    if (!task) {
      task = await db.tasks.get(taskId);
    }
    if (!task) return;

    const snappedStartAt = getTimeFromPointerY(e.clientY);
    const durationMinutes = task.estimateMinutes && task.estimateMinutes > 0 ? task.estimateMinutes : 30;
    const endAt = snappedStartAt + durationMinutes * 60000;

    if (onCreatePlannedBlock) {
      const created = await onCreatePlannedBlock({
        title: task.title,
        type: 'task',
        startAt: snappedStartAt,
        endAt,
        taskId: task.id,
        projectId: task.projectId,
      });
      // If missing estimate, highlight block for immediate adjustment
      if (!task.estimateMinutes) {
        onInspectBlock?.(created);
      }
    }
  };

  const hours = Array.from(
    { length: layout.endHour - layout.startHour },
    (_, i) => i + layout.startHour
  );

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col overflow-hidden shadow-xs select-none h-full flex-1 ${className}`}
      onPointerMove={handleGridPointerMove}
      onPointerUp={handleGridPointerUp}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
    >
      {/* Header Controls: Filters & Capacity Summary */}
      <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs z-10">
        {/* Left Title / Filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{timeService.formatDateHeader(dateStr, language === 'zh-CN' ? 'zh-CN' : 'en-US')}</span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium ml-2">
            <button
              type="button"
              onClick={() => handleSetFilter('all')}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-300'
              }`}
            >
              {language === 'zh-CN' ? '全部 (Plan+Actual)' : 'All'}
            </button>
            <button
              type="button"
              onClick={() => handleSetFilter('plan')}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                activeFilter === 'plan'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-300'
              }`}
            >
              {language === 'zh-CN' ? '仅计划 (Plan)' : 'Plan'}
            </button>
            <button
              type="button"
              onClick={() => handleSetFilter('actual')}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                activeFilter === 'actual'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-semibold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-300'
              }`}
            >
              {language === 'zh-CN' ? '仅实际 (Actual)' : 'Actual'}
            </button>
          </div>
        </div>

        {/* Right Capacity & Totals */}
        <div className="flex items-center gap-3 text-xs">
          {/* Daily Capacity indicator */}
          <button
            type="button"
            onClick={() => {
              const input = window.prompt(
                language === 'zh-CN'
                  ? '设置今日容量上限 (小时，如 6 或 8)：'
                  : 'Set daily capacity in hours (e.g. 6 or 8):',
                (capacityInfo.capacityMinutes / 60).toString()
              );
              if (input && !isNaN(Number(input))) {
                onUpdateCapacityOverride?.(dateStr, Math.round(Number(input) * 60));
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-indigo-300 transition-colors cursor-pointer"
            title={language === 'zh-CN' ? '点击可自定义该日容量上限' : 'Click to override daily capacity'}
          >
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-mono font-medium">
              {Math.floor(capacityInfo.plannedMinutes / 60)}h
              {capacityInfo.plannedMinutes % 60 > 0 ? `${capacityInfo.plannedMinutes % 60}m` : ''} /{' '}
              {Math.floor(capacityInfo.capacityMinutes / 60)}h
            </span>
            {capacityInfo.isOverCapacity && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold px-1 rounded bg-amber-50 dark:bg-amber-950/60">
                {language === 'zh-CN' ? '超出预期' : 'Over'}
              </span>
            )}
          </button>

          <div className="text-slate-300 dark:text-slate-700">•</div>

          <span className="text-indigo-600 dark:text-indigo-400 font-medium">
            {language === 'zh-CN' ? '计划:' : 'Plan:'} {timeService.formatDuration(layout.totalPlannedSeconds)}
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            {language === 'zh-CN' ? '实际:' : 'Actual:'} {timeService.formatDuration(layout.totalActualSeconds)}
          </span>
        </div>
      </div>

      {/* Main Interactive Grid Container with Vertical Scrolling */}
      <div className={`flex-1 flex overflow-y-auto ${compact ? 'max-h-[380px] min-h-[320px]' : 'min-h-[480px]'} relative divide-x divide-slate-100 dark:divide-slate-800`}>
        {/* Hours Column */}
        <div
          className="w-14 shrink-0 bg-slate-50/40 dark:bg-slate-800/20 select-none flex flex-col py-1 text-right pr-2 sticky left-0 z-20"
          style={{ height: `${hours.length * HOUR_HEIGHT}px` }}
        >
          {hours.map((hour) => (
            <div
              key={hour}
              style={{ height: `${HOUR_HEIGHT}px` }}
              className="text-[11px] font-mono text-slate-400 flex items-start justify-end pt-1"
            >
              {hour.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Primary Timeline Canvas */}
        <div
          ref={gridRef}
          onPointerDown={handleGridPointerDown}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDrop={handleDrop}
          style={{ height: `${hours.length * HOUR_HEIGHT}px` }}
          className="flex-1 relative bg-white dark:bg-slate-900 cursor-crosshair group select-none"
        >
          {/* Horizontal Hour Lines & Half-hour Guide Lines */}
          <div className="absolute inset-0 flex flex-col pointer-events-none">
            {hours.map((hour) => (
              <div
                key={hour}
                style={{ height: `${HOUR_HEIGHT}px` }}
                className="border-b border-slate-100/90 dark:border-slate-800/70 relative"
              >
                {/* Half-hour dashed line */}
                <div className="absolute top-1/2 left-0 right-0 border-b border-dashed border-slate-100/50 dark:border-slate-800/40" />
              </div>
            ))}
          </div>

          {/* Current Time Indicator Line with Interactive Quick Create */}
          {nowPercent !== null && nowPercent >= 0 && nowPercent <= 100 && (
            <div
              className="absolute left-0 right-0 z-30 pointer-events-none flex items-center group/now"
              style={{ top: `${nowPercent}%` }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 shadow-sm -ml-1.5 pointer-events-auto" />
              <div className="flex-1 h-0.5 bg-indigo-600 shadow-2xs" />
              
              <div className="flex items-center gap-1 mr-1 pointer-events-auto">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const exactNow = Date.now();
                    setCreateDraftRange({
                      startAt: exactNow,
                      endAt: exactNow + 3600000,
                    });
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-semibold shadow-xs transition-all cursor-pointer group-hover/now:ring-2 ring-indigo-300 dark:ring-indigo-800"
                  title={language === 'zh-CN' ? '点击从当前时间开始快速新建排期' : 'Click to create planned block from current time'}
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span className="font-mono">{timeService.formatTime(nowMs)}</span>
                  <span className="text-[9px] bg-indigo-500/80 px-1 rounded font-normal">
                    {language === 'zh-CN' ? '从现在开始' : 'Start now'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Drag Selection Box when creating inline */}
          {isDragCreating && dragCreateStartMs !== null && dragCreateCurrentMs !== null && (
            <div
              className="absolute left-2 right-2 bg-indigo-100/60 dark:bg-indigo-900/40 border border-indigo-400/80 rounded-xl pointer-events-none z-20 transition-all flex items-center justify-between px-3"
              style={{
                top: `${Math.max(
                  0,
                  ((Math.min(dragCreateStartMs, dragCreateCurrentMs) - (startOfDayMs + layout.startHour * 3600000)) /
                    totalRangeMs) *
                    100
                )}%`,
                height: `${Math.max(
                  2.5,
                  (Math.abs(dragCreateCurrentMs - dragCreateStartMs) / totalRangeMs) * 100
                )}%`,
              }}
            >
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 font-mono">
                {timeService.formatTime(Math.min(dragCreateStartMs, dragCreateCurrentMs))} –{' '}
                {timeService.formatTime(Math.max(dragCreateStartMs, dragCreateCurrentMs))}
              </span>
              <span className="text-[11px] text-indigo-500 font-medium">
                {language === 'zh-CN' ? '松开以创建...' : 'Release to create...'}
              </span>
            </div>
          )}

          {/* Rendered Timeline Items (Plan Ghosts & Actual Solids) */}
          {layout.mainItems.map((item) => {
            const isPlan = item.itemType === 'plan';
            const isFocus = item.blockType === 'focus';
            const isActivity = item.blockType === 'activity';
            const originalBlock = isPlan ? (item.originalEntity as PlannedBlock) : undefined;
            const originalSession = !isPlan ? (item.originalEntity as Session) : undefined;
            const linkedTask = item.taskId ? taskMap.get(item.taskId) : undefined;
            const linkedProject = item.projectId ? projectMap.get(item.projectId) : undefined;

            const isCurrentlyResizing = activeResizeBlock?.blockId === item.id;
            const effectiveStartAt = isCurrentlyResizing
              ? activeResizeBlock.currentStartAt
              : item.startAt;
            const effectiveEndAt = isCurrentlyResizing
              ? activeResizeBlock.currentEndAt
              : item.endAt;

            const currentTopPercent = Math.max(
              0,
              ((effectiveStartAt - (startOfDayMs + layout.startHour * 3600000)) / totalRangeMs) * 100
            );
            const currentHeightPercent = Math.max(
              2.5,
              ((effectiveEndAt - effectiveStartAt) / totalRangeMs) * 100
            );
            const durationMinutes = Math.round((effectiveEndAt - effectiveStartAt) / 60000);
            const isShortBlock = durationMinutes <= 35;

            return (
              <div
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isPlan && originalBlock) {
                    onInspectBlock?.(originalBlock);
                  } else if (originalSession) {
                    onInspectSession?.(originalSession);
                  }
                }}
                className={`absolute rounded-xl transition-all group/item cursor-pointer z-10 ${
                  isShortBlock
                    ? 'p-1.5 px-2.5 flex items-center justify-between'
                    : 'p-2 flex flex-col justify-between'
                } ${
                  isPlan
                    ? isFocus
                      ? 'border border-dashed border-purple-400 dark:border-purple-600 bg-purple-50/85 dark:bg-purple-950/40 text-purple-950 dark:text-purple-100 shadow-2xs hover:border-purple-500'
                      : isActivity
                        ? 'border border-dotted border-amber-300 dark:border-amber-700/80 bg-amber-50/70 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100 shadow-2xs hover:border-amber-400'
                        : 'border border-dashed border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 text-slate-800 dark:text-slate-200 shadow-2xs hover:border-indigo-500'
                    : 'bg-emerald-600 dark:bg-emerald-600 text-white shadow-xs border border-emerald-500'
                }`}
                style={{
                  top: `${currentTopPercent}%`,
                  height: `${currentHeightPercent}%`,
                  left: `calc(${item.leftOffsetPercent}% + 4px)`,
                  width: `calc(${item.widthPercent}% - 8px)`,
                  borderLeftColor: linkedProject ? linkedProject.color : isFocus ? '#8b5cf6' : isActivity ? '#f59e0b' : undefined,
                  borderLeftWidth: linkedProject || isFocus || isActivity ? '4px' : undefined,
                }}
              >
                {/* Top Resize Handle (for planned blocks) */}
                {isPlan && (
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setActiveResizeBlock({
                        blockId: item.id,
                        edge: 'top',
                        initialStartAt: item.startAt,
                        initialEndAt: item.endAt,
                        currentStartAt: item.startAt,
                        currentEndAt: item.endAt,
                      });
                    }}
                    className="absolute -top-1 left-2 right-2 h-2 cursor-ns-resize z-20 opacity-0 group-hover/item:opacity-100 flex items-center justify-center"
                    title="Drag to adjust start time"
                  >
                    <div className="w-8 h-1 bg-indigo-500 rounded-full" />
                  </div>
                )}

                {/* Card Content Layout: Single Inline Row for Short Blocks (<=35m) vs 2-Row for Taller Blocks */}
                {isShortBlock ? (
                  <>
                    <div className="flex items-center gap-1.5 min-w-0 truncate">
                      {isPlan ? (
                        isFocus ? (
                          <Badge size="sm" className="bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 border border-purple-300 dark:border-purple-700/60 px-1 py-0 text-[10px] font-semibold shrink-0">
                            Focus
                          </Badge>
                        ) : isActivity ? (
                          <Badge size="sm" className="bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60 px-1 py-0 text-[10px] font-semibold shrink-0">
                            Activity
                          </Badge>
                        ) : (
                          <Badge variant="indigo" size="sm" className="px-1 py-0 text-[10px] shrink-0">
                            Plan
                          </Badge>
                        )
                      ) : (
                        <Badge variant="low" size="sm" className="bg-emerald-700 text-white border-0 px-1 py-0 text-[10px] shrink-0">
                          Actual {item.coalescedCount && item.coalescedCount > 1 ? `x${item.coalescedCount}` : ''}
                        </Badge>
                      )}

                      <span
                        onClick={(e) => {
                          if (linkedTask && onInspectTask) {
                            e.stopPropagation();
                            onInspectTask(linkedTask);
                          }
                        }}
                        className="text-xs font-semibold truncate hover:underline"
                      >
                        {item.title || linkedTask?.title}
                      </span>

                      <span className="font-mono text-[10px] opacity-75 shrink-0 ml-1">
                        {timeService.formatTime(effectiveStartAt)}–{timeService.formatTime(effectiveEndAt)} ({timeService.formatDuration(item.durationSeconds)})
                      </span>
                    </div>

                    {/* Right side: Overlap badge or hover action buttons */}
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {item.isOverlapping && (
                        <span
                          className="text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 px-1 rounded flex items-center gap-0.5"
                          title={language === 'zh-CN' ? '时间排期发生重叠' : 'Schedule overlap'}
                        >
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span className="hidden sm:inline">{language === 'zh-CN' ? '重叠' : 'Overlap'}</span>
                        </span>
                      )}

                      <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        {isPlan && linkedTask && onStartSession && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartSession(linkedTask);
                            }}
                            className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer shadow-2xs"
                            title={language === 'zh-CN' ? '快速开启会话' : 'Start session'}
                          >
                            <Play className="w-2.5 h-2.5" />
                          </button>
                        )}

                        {isPlan && onDeletePlannedBlock && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePlannedBlock(item.id);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-red-500 cursor-pointer"
                            title={language === 'zh-CN' ? '删除时间块' : 'Delete block'}
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}

                        {!isPlan && onDeleteSession && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSession(item.id);
                            }}
                            className="p-1 rounded text-emerald-200 hover:text-white hover:bg-emerald-700/80 cursor-pointer transition-colors"
                            title={language === 'zh-CN' ? '删除实际会话' : 'Delete session'}
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Card Header Info */}
                    <div className="flex items-center justify-between gap-1 min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        {isPlan ? (
                          isFocus ? (
                            <Badge size="sm" className="bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 border border-purple-300 dark:border-purple-700/60 px-1 py-0 text-[10px] font-semibold">
                              <Target className="w-2.5 h-2.5 mr-0.5 inline text-purple-600 dark:text-purple-400" />
                              Focus
                            </Badge>
                          ) : isActivity ? (
                            <Badge size="sm" className="bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60 px-1 py-0 text-[10px] font-semibold">
                              <Sparkles className="w-2.5 h-2.5 mr-0.5 inline text-amber-600 dark:text-amber-400" />
                              Activity
                            </Badge>
                          ) : (
                            <Badge variant="indigo" size="sm" className="px-1 py-0 text-[10px]">
                              Plan
                            </Badge>
                          )
                        ) : (
                          <Badge variant="low" size="sm" className="bg-emerald-700 text-white border-0 px-1 py-0 text-[10px]">
                            Actual {item.coalescedCount && item.coalescedCount > 1 ? `x${item.coalescedCount}` : ''}
                          </Badge>
                        )}

                        <span
                          onClick={(e) => {
                            if (linkedTask && onInspectTask) {
                              e.stopPropagation();
                              onInspectTask(linkedTask);
                            }
                          }}
                          className="text-xs font-semibold truncate hover:underline"
                        >
                          {item.title || linkedTask?.title}
                        </span>
                      </div>

                      {/* Overlap Indicator Badge */}
                      {item.isOverlapping && (
                        <span
                          className="text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:bg-amber-200 px-1 rounded flex items-center gap-0.5 shrink-0"
                          title={language === 'zh-CN' ? '时间排期发生重叠' : 'Schedule overlap'}
                        >
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {language === 'zh-CN' ? '重叠' : 'Overlap'}
                        </span>
                      )}
                    </div>

                    {/* Card Footer: Duration & Quick Actions */}
                    <div className="flex items-center justify-between text-[10px] opacity-80 group-hover/item:opacity-100 transition-opacity">
                      <span className="font-mono truncate">
                        {timeService.formatTime(effectiveStartAt)} – {timeService.formatTime(effectiveEndAt)}{' '}
                        ({item.coalescedCount && item.coalescedCount > 1 ? (language === 'zh-CN' ? `共 ${timeService.formatDuration(item.durationSeconds)}` : `total ${timeService.formatDuration(item.durationSeconds)}`) : timeService.formatDuration(item.durationSeconds)})
                      </span>

                      <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        {isPlan && linkedTask && onStartSession && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartSession(linkedTask);
                            }}
                            className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer shadow-2xs"
                            title={language === 'zh-CN' ? '快速开启会话' : 'Start session'}
                          >
                            <Play className="w-2.5 h-2.5" />
                          </button>
                        )}

                        {isPlan && onDeletePlannedBlock && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePlannedBlock(item.id);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-red-500 cursor-pointer"
                            title={language === 'zh-CN' ? '删除时间块' : 'Delete block'}
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}

                        {!isPlan && onDeleteSession && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSession(item.id);
                            }}
                            className="p-1 rounded text-emerald-200 hover:text-white hover:bg-emerald-700/80 cursor-pointer transition-colors"
                            title={language === 'zh-CN' ? '删除实际会话' : 'Delete session'}
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Bottom Resize Handle (for planned blocks) */}
                {isPlan && (
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setActiveResizeBlock({
                        blockId: item.id,
                        edge: 'bottom',
                        initialStartAt: item.startAt,
                        initialEndAt: item.endAt,
                        currentStartAt: item.startAt,
                        currentEndAt: item.endAt,
                      });
                    }}
                    className="absolute -bottom-1 left-2 right-2 h-2 cursor-ns-resize z-20 opacity-0 group-hover/item:opacity-100 flex items-center justify-center"
                    title="Drag to adjust end time"
                  >
                    <div className="w-8 h-1 bg-indigo-500 rounded-full" />
                  </div>
                )}

                {/* Ghost Timebox Prediction Extension (Historical Variance) */}
                {isPlan && originalBlock && (() => {
                  const ghostEndAt = calculateGhostEndTime(originalBlock, linkedTask);
                  if (!ghostEndAt || ghostEndAt <= effectiveEndAt) return null;
                  const ghostDurationMs = ghostEndAt - effectiveEndAt;
                  const totalCanvasHeight = hours.length * HOUR_HEIGHT;
                  const ghostHeightPx = Math.max(
                    18,
                    Math.round((ghostDurationMs / totalRangeMs) * totalCanvasHeight)
                  );
                  return (
                    <div
                      className="absolute left-0 right-0 border-x border-b border-dashed border-indigo-400/60 dark:border-indigo-500/50 bg-indigo-500/10 dark:bg-indigo-950/25 rounded-b-xl pointer-events-none z-0 px-2 py-1 flex items-center justify-between text-[9px] text-indigo-700 dark:text-indigo-300 font-mono shadow-2xs"
                      style={{
                        top: 'calc(100% + 2px)',
                        height: `${ghostHeightPx}px`,
                      }}
                      title={language === 'zh-CN' ? '基于历史类似任务耗时习惯预测的实际可能结束时间' : 'Predicted completion based on historical variance'}
                    >
                      <span className="truncate flex items-center gap-1">
                        <span className="opacity-70">⏳</span>
                        <span>{language === 'zh-CN' ? `预测延至 ${timeService.formatTime(ghostEndAt)}` : `Ghost ${timeService.formatTime(ghostEndAt)}`}</span>
                      </span>
                    </div>
                  );
                })()}
              </div>
            );
          })}

          {/* Empty Canvas Guidance */}
          {layout.mainItems.length === 0 && !isDragCreating && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-300 dark:text-slate-600 text-xs gap-1">
              <Plus className="w-6 h-6 stroke-1" />
              <span>
                {language === 'zh-CN'
                  ? '拖拽待办至此，或在网格上按住鼠标框选规划时间块'
                  : 'Drag tasks here or click & drag on grid to plan time blocks'}
              </span>
            </div>
          )}
        </div>

        {/* Background Track (Visible only if background sessions exist) */}
        {layout.backgroundItems.length > 0 && (
          <div className="w-24 shrink-0 border-l border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 relative overflow-hidden select-none">
            <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 border-b border-slate-100 dark:border-slate-800 text-center uppercase tracking-wider">
              {language === 'zh-CN' ? '后台活动' : 'Background'}
            </div>

            {layout.backgroundItems.map((bgItem) => {
              const bgSession = bgItem.originalEntity as Session;
              return (
                <div
                  key={bgItem.id}
                  onClick={() => onInspectSession?.(bgSession)}
                  className="absolute left-1 right-1 rounded-lg bg-slate-200/90 dark:bg-slate-700/80 p-1 text-[10px] text-slate-700 dark:text-slate-200 truncate cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors shadow-2xs"
                  style={{
                    top: `${bgItem.topPercent}%`,
                    height: `${bgItem.heightPercent}%`,
                  }}
                  title={`${bgItem.title} (${timeService.formatDuration(bgItem.durationSeconds)})`}
                >
                  <span className="font-semibold block truncate">{bgItem.title}</span>
                  <span className="font-mono text-[9px] text-slate-500 dark:text-slate-400">
                    {timeService.formatDuration(bgItem.durationSeconds)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightweight Inline Creation Popover */}
      {createDraftRange && onCreatePlannedBlock && (
        <InlineCreatePopover
          startAt={createDraftRange.startAt}
          endAt={createDraftRange.endAt}
          tasks={tasks}
          projects={projects}
          onClose={() => setCreateDraftRange(null)}
          onCreateBlock={async (data) => {
            await onCreatePlannedBlock(data);
            setCreateDraftRange(null);
          }}
        />
      )}
    </div>
  );
};
