import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useI18n } from '@/core/i18n';
import { timeService } from '@/core/time/timeService';
import { calculateTimelineLayout, calculateDailyCapacity } from '@/core/timeline/timelineEngine';
import { InlineCreatePopover } from './InlineCreatePopover';
import { TimelineGridHeader } from './TimelineGridHeader';
import { TimelineBlock } from './TimelineBlock';
import { TimelineBackgroundTrack } from './TimelineBackgroundTrack';
import { useTimelineGestures } from './useTimelineGestures';
import { DEFAULT_END_HOUR, DEFAULT_START_HOUR, HOUR_HEIGHT } from './timelineConstants';
import type { TimelineFilter, DailyCapacityConfig } from '@/core/timeline/types';
import type { PlannedBlock, Session, Task, Project, PlannedBlockType } from '@/core/types/domain';
import { Plus } from 'lucide-react';

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

  // 键盘可达性：方向键改期 / 删除 / 打开检视，配合屏幕阅读器播报
  const [kbAnnounce, setKbAnnounce] = useState('');
  // 记录键盘连续调整后的最新时间：否则快速连按时每次都以旧的 block.startAt 为基准，
  // 多次按键只会位移一次（异步落库尚未回流到 props）。
  const kbPendingTimesRef = useRef<Map<string, { startAt: number; endAt: number }>>(new Map());

  // 数据回流后清空缓存，避免下一次按键基于已被外部改动（拖拽/同步）覆盖的旧时间
  useEffect(() => {
    kbPendingTimesRef.current.clear();
  }, [plannedBlocks]);

  const moveBlockBy = useCallback(
    async (block: PlannedBlock, deltaMs: number) => {
      if (!onUpdatePlannedBlock) return;
      const pending = kbPendingTimesRef.current.get(block.id);
      const baseStart = pending?.startAt ?? block.startAt;
      const baseEnd = pending?.endAt ?? block.endAt;
      // 限制在当天时间轴范围内，避免整块被移出可视区后彻底找不到
      const dayStart = timeService.getStartOfLogicalDay(dateStr);
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      const newStart = Math.min(Math.max(baseStart + deltaMs, dayStart), dayEnd - (baseEnd - baseStart));
      const newEnd = newStart + (baseEnd - baseStart);
      if (newStart === baseStart) {
        setKbAnnounce(language === 'zh-CN' ? '已到当天时间轴边界' : 'Reached the edge of the day timeline');
        return;
      }
      kbPendingTimesRef.current.set(block.id, { startAt: newStart, endAt: newEnd });
      await onUpdatePlannedBlock(block.id, { startAt: newStart, endAt: newEnd });
      setKbAnnounce(
        language === 'zh-CN'
          ? `已移动到 ${timeService.formatTime(newStart)}–${timeService.formatTime(newEnd)}`
          : `Moved to ${timeService.formatTime(newStart)}–${timeService.formatTime(newEnd)}`
      );
    },
    [onUpdatePlannedBlock, language, dateStr]
  );

  // Calculate layout with dynamic auto-expanding range
  const layout = calculateTimelineLayout({
    startOfDayMs,
    startHour: DEFAULT_START_HOUR,
    endHour: DEFAULT_END_HOUR,
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
      if (
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
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
        Math.min(100, ((nowMs - (startOfDayMs + layout.startHour * 3600000)) / totalRangeMs) * 100)
      )
    : null;

  const {
    isDragCreating,
    dragCreateStartMs,
    dragCreateCurrentMs,
    activeResizeBlock,
    handleGridPointerDown,
    handleGridPointerMove,
    handleGridPointerCancel,
    handleGridPointerUp,
    handleDragOver,
    handleDrop,
    handleResizeStart,
  } = useTimelineGestures({
    gridRef,
    startOfDayMs,
    startHour: layout.startHour,
    totalRangeMs,
    taskMap,
    onUpdatePlannedBlock,
    onCreatePlannedBlock,
    onInspectBlock,
    setCreateDraftRange,
  });

  const hours = Array.from(
    { length: layout.endHour - layout.startHour },
    (_, i) => i + layout.startHour
  );

  const openCreateFromNow = () => {
    const exactNow = Date.now();
    setCreateDraftRange({
      startAt: exactNow,
      endAt: exactNow + 3600000,
    });
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col overflow-hidden shadow-xs select-none h-full flex-1 ${className}`}
      onPointerMove={handleGridPointerMove}
      onPointerUp={handleGridPointerUp}
      onPointerCancel={handleGridPointerCancel}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
    >
      {/* Header Controls: Filters & Capacity Summary */}
      <TimelineGridHeader
        dateStr={dateStr}
        activeFilter={activeFilter}
        onSetFilter={handleSetFilter}
        capacityInfo={capacityInfo}
        layout={layout}
        onUpdateCapacityOverride={onUpdateCapacityOverride}
      />

      {/* Main Interactive Grid Container with Vertical Scrolling */}
      <div
        className={`flex-1 flex overflow-y-auto ${
          compact ? 'max-h-[380px] min-h-[320px]' : 'min-h-[480px]'
        } relative divide-x divide-slate-100 dark:divide-slate-800`}
      >
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
          className={`flex-1 relative bg-white dark:bg-slate-900 cursor-crosshair group select-none ${
            isDragCreating ? 'touch-action-none' : ''
          }`}
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
                    openCreateFromNow();
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-semibold shadow-xs transition-all cursor-pointer group-hover/now:ring-2 ring-indigo-300 dark:ring-indigo-800"
                  title={
                    language === 'zh-CN' ? '点击从当前时间开始快速新建排期' : 'Click to create planned block from current time'
                  }
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
                  ((Math.min(dragCreateStartMs, dragCreateCurrentMs) -
                    (startOfDayMs + layout.startHour * 3600000)) /
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
          {layout.mainItems.map((item) => (
            <TimelineBlock
              key={item.id}
              item={item}
              startOfDayMs={startOfDayMs}
              startHour={layout.startHour}
              totalRangeMs={totalRangeMs}
              hourCount={hours.length}
              taskMap={taskMap}
              projectMap={projectMap}
              activeResizeBlock={activeResizeBlock}
              onResizeStart={handleResizeStart}
              onMoveBy={moveBlockBy}
              onInspectTask={onInspectTask}
              onInspectBlock={onInspectBlock}
              onInspectSession={onInspectSession}
              onDeletePlannedBlock={onDeletePlannedBlock}
              onDeleteSession={onDeleteSession}
              onStartSession={onStartSession}
            />
          ))}

          {/* Empty Canvas Guidance */}
          {layout.mainItems.length === 0 && !isDragCreating && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-300 dark:text-slate-600 text-xs gap-1">
              <Plus className="w-6 h-6 stroke-1" />
              <span>
                {language === 'zh-CN'
                  ? '拖拽待办至此，或在网格上长按规划时间块'
                  : 'Drag tasks here or long-press on grid to plan time blocks'}
              </span>
            </div>
          )}
        </div>

        {/* Background Track (Visible only if background sessions exist) */}
        <TimelineBackgroundTrack items={layout.backgroundItems} onInspectSession={onInspectSession} />
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

      {/* 屏幕阅读器播报：键盘改期 / 删除等操作结果 */}
      <div className="sr-only" aria-live="polite" role="status">
        {kbAnnounce}
      </div>
    </div>
  );
};
