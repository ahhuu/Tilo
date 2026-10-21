import React from 'react';
import { AlertTriangle, Play, Sparkles, Target, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useI18n } from '@/core/i18n';
import { timeService } from '@/core/time/timeService';
import { calculateGhostEndTime } from '@/services/elasticPushService';
import type { TimelineEventLayoutItem } from '@/core/timeline/types';
import type { PlannedBlock, Project, Session, Task } from '@/core/types/domain';
import { HOUR_HEIGHT } from './timelineConstants';
import type { ResizeDragState } from './useTimelineGestures';

type BlockVariant = 'short' | 'tall';

const OverlapBadge: React.FC<{ variant: BlockVariant }> = ({ variant }) => {
  const { language } = useI18n();
  return (
    <span
      className={`text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 px-1 rounded flex items-center gap-0.5${
        variant === 'tall' ? ' shrink-0' : ''
      }`}
      title={language === 'zh-CN' ? '时间排期发生重叠' : 'Schedule overlap'}
    >
      <AlertTriangle className="w-2.5 h-2.5" />
      <span className="hidden sm:inline">{language === 'zh-CN' ? '重叠' : 'Overlap'}</span>
    </span>
  );
};

/** 类型徽标：短块不显示图标以便塞进单行，高块带图标强调 Focus/Activity。 */
const BlockTypeBadge: React.FC<{
  isPlan: boolean;
  isFocus: boolean;
  isActivity: boolean;
  coalescedCount?: number;
  variant: BlockVariant;
}> = ({ isPlan, isFocus, isActivity, coalescedCount, variant }) => {
  const shrink = variant === 'short' ? ' shrink-0' : '';
  const withIcon = variant === 'tall';

  if (!isPlan) {
    return (
      <Badge
        variant="low"
        size="sm"
        className={`bg-emerald-700 text-white border-0 px-1 py-0 text-[10px]${shrink}`}
      >
        Actual {coalescedCount && coalescedCount > 1 ? `x${coalescedCount}` : ''}
      </Badge>
    );
  }

  if (isFocus) {
    return (
      <Badge
        size="sm"
        className={`bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 border border-purple-300 dark:border-purple-700/60 px-1 py-0 text-[10px] font-semibold${shrink}`}
      >
        {withIcon && <Target className="w-2.5 h-2.5 mr-0.5 inline text-purple-600 dark:text-purple-400" />}
        Focus
      </Badge>
    );
  }

  if (isActivity) {
    return (
      <Badge
        size="sm"
        className={`bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60 px-1 py-0 text-[10px] font-semibold${shrink}`}
      >
        {withIcon && <Sparkles className="w-2.5 h-2.5 mr-0.5 inline text-amber-600 dark:text-amber-400" />}
        Activity
      </Badge>
    );
  }

  return (
    <Badge variant="indigo" size="sm" className={`px-1 py-0 text-[10px]${shrink}`}>
      Plan
    </Badge>
  );
};

/** 悬停浮现的快捷动作：开会话 / 删除计划块 / 删除会话。 */
const BlockQuickActions: React.FC<{
  isPlan: boolean;
  itemId: string;
  linkedTask?: Task;
  variant: BlockVariant;
  onStartSession?: (task: Task | { id: string; title: string; projectId?: string }) => void;
  onDeletePlannedBlock?: (blockId: string) => Promise<void>;
  onDeleteSession?: (sessionId: string) => Promise<void>;
}> = ({ isPlan, itemId, linkedTask, variant, onStartSession, onDeletePlannedBlock, onDeleteSession }) => {
  const { language } = useI18n();
  const wrapperClass =
    variant === 'short'
      ? 'flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity'
      : 'flex items-center gap-1 sm:opacity-0 sm:group-hover/item:opacity-100 opacity-80 transition-opacity';

  return (
    <div className={wrapperClass}>
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
            onDeletePlannedBlock(itemId);
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
            onDeleteSession(itemId);
          }}
          className="p-1 rounded text-emerald-200 hover:text-white hover:bg-emerald-700/80 cursor-pointer transition-colors"
          title={language === 'zh-CN' ? '删除实际会话' : 'Delete session'}
        >
          <Trash2 className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
};

/** 基于历史耗时习惯的「预测结束时间」虚线延伸块。 */
const GhostExtension: React.FC<{
  block: PlannedBlock;
  task?: Task;
  effectiveEndAt: number;
  totalRangeMs: number;
  hourCount: number;
}> = ({ block, task, effectiveEndAt, totalRangeMs, hourCount }) => {
  const { language } = useI18n();
  const ghostEndAt = calculateGhostEndTime(block, task);
  if (!ghostEndAt || ghostEndAt <= effectiveEndAt) return null;

  const ghostDurationMs = ghostEndAt - effectiveEndAt;
  const totalCanvasHeight = hourCount * HOUR_HEIGHT;
  const ghostHeightPx = Math.max(18, Math.round((ghostDurationMs / totalRangeMs) * totalCanvasHeight));

  return (
    <div
      className="absolute left-0 right-0 border-x border-b border-dashed border-indigo-400/60 dark:border-indigo-500/50 bg-indigo-500/10 dark:bg-indigo-950/25 rounded-b-xl pointer-events-none z-0 px-2 py-1 flex items-center justify-between text-[9px] text-indigo-700 dark:text-indigo-300 font-mono shadow-2xs"
      style={{ top: 'calc(100% + 2px)', height: `${ghostHeightPx}px` }}
      title={
        language === 'zh-CN'
          ? '基于历史类似任务耗时习惯预测的实际可能结束时间'
          : 'Predicted completion based on historical variance'
      }
    >
      <span className="truncate flex items-center gap-1">
        <span className="opacity-70">⏳</span>
        <span>
          {language === 'zh-CN'
            ? `预测延至 ${timeService.formatTime(ghostEndAt)}`
            : `Ghost ${timeService.formatTime(ghostEndAt)}`}
        </span>
      </span>
    </div>
  );
};

export interface TimelineBlockProps {
  item: TimelineEventLayoutItem;
  startOfDayMs: number;
  startHour: number;
  totalRangeMs: number;
  hourCount: number;
  taskMap: Map<string, Task>;
  projectMap: Map<string, Project>;
  activeResizeBlock: ResizeDragState | null;
  onResizeStart: (params: {
    blockId: string;
    edge: 'top' | 'bottom';
    initialStartAt: number;
    initialEndAt: number;
  }) => void;
  onMoveBy: (block: PlannedBlock, deltaMs: number) => void;
  onInspectTask?: (task: Task) => void;
  onInspectBlock?: (block: PlannedBlock) => void;
  onInspectSession?: (session: Session) => void;
  onDeletePlannedBlock?: (blockId: string) => Promise<void>;
  onDeleteSession?: (sessionId: string) => Promise<void>;
  onStartSession?: (task: Task | { id: string; title: string; projectId?: string }) => void;
}

/** 时间轴上的单个计划块 / 实际会话块：定位、内容、resize 把手、键盘改期。 */
export const TimelineBlock: React.FC<TimelineBlockProps> = ({
  item,
  startOfDayMs,
  startHour,
  totalRangeMs,
  hourCount,
  taskMap,
  projectMap,
  activeResizeBlock,
  onResizeStart,
  onMoveBy,
  onInspectTask,
  onInspectBlock,
  onInspectSession,
  onDeletePlannedBlock,
  onDeleteSession,
  onStartSession,
}) => {
  const { language } = useI18n();

  const isPlan = item.itemType === 'plan';
  const isFocus = item.blockType === 'focus';
  const isActivity = item.blockType === 'activity';
  const originalBlock = isPlan ? (item.originalEntity as PlannedBlock) : undefined;
  const originalSession = !isPlan ? (item.originalEntity as Session) : undefined;
  const linkedTask = item.taskId ? taskMap.get(item.taskId) : undefined;
  const linkedProject = item.projectId ? projectMap.get(item.projectId) : undefined;

  const isCurrentlyResizing = activeResizeBlock?.blockId === item.id;
  const effectiveStartAt = isCurrentlyResizing ? activeResizeBlock.currentStartAt : item.startAt;
  const effectiveEndAt = isCurrentlyResizing ? activeResizeBlock.currentEndAt : item.endAt;

  const currentTopPercent = Math.max(
    0,
    ((effectiveStartAt - (startOfDayMs + startHour * 3600000)) / totalRangeMs) * 100
  );
  const currentHeightPercent = Math.max(2.5, ((effectiveEndAt - effectiveStartAt) / totalRangeMs) * 100);
  const durationMinutes = Math.round((effectiveEndAt - effectiveStartAt) / 60000);
  const isShortBlock = durationMinutes <= 35;
  const variant: BlockVariant = isShortBlock ? 'short' : 'tall';

  return (
    <div
      tabIndex={isPlan ? 0 : undefined}
      role={isPlan ? 'button' : undefined}
      aria-roledescription={
        isPlan ? (language === 'zh-CN' ? '时间块，方向键改期' : 'Time block, arrow keys to reschedule') : undefined
      }
      aria-label={
        isPlan && originalBlock
          ? `${item.title || linkedTask?.title || ''} ${timeService.formatTime(effectiveStartAt)}–${timeService.formatTime(effectiveEndAt)}`
          : undefined
      }
      onClick={(e) => {
        e.stopPropagation();
        if (isPlan && originalBlock) {
          onInspectBlock?.(originalBlock);
        } else if (originalSession) {
          onInspectSession?.(originalSession);
        }
      }}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (!isPlan || !originalBlock) return;
        const STEP = 15 * 60 * 1000;
        const BIG = 60 * 60 * 1000;
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            void onMoveBy(originalBlock, e.shiftKey ? -BIG : -STEP);
            break;
          case 'ArrowDown':
            e.preventDefault();
            void onMoveBy(originalBlock, e.shiftKey ? BIG : STEP);
            break;
          case 'Enter':
          case ' ':
            e.preventDefault();
            onInspectBlock?.(originalBlock);
            break;
          case 'Delete':
          case 'Backspace':
            if (onDeletePlannedBlock) {
              e.preventDefault();
              void onDeletePlannedBlock(item.id);
            }
            break;
          default:
            break;
        }
      }}
      className={`absolute rounded-xl transition-all group/item cursor-pointer z-10 ${
        isShortBlock ? 'p-1.5 px-2.5 flex items-center justify-between' : 'p-2 flex flex-col justify-between'
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
        borderLeftColor: linkedProject
          ? linkedProject.color
          : isFocus
            ? '#8b5cf6'
            : isActivity
              ? '#f59e0b'
              : undefined,
        borderLeftWidth: linkedProject || isFocus || isActivity ? '4px' : undefined,
      }}
    >
      {/* Top Resize Handle (for planned blocks) */}
      {isPlan && (
        <div
          onPointerDown={(e) => {
            e.stopPropagation();
            onResizeStart({
              blockId: item.id,
              edge: 'top',
              initialStartAt: item.startAt,
              initialEndAt: item.endAt,
            });
          }}
          className="absolute -top-1 left-2 right-2 h-2 cursor-ns-resize z-20 opacity-0 group-hover/item:opacity-100 flex items-center justify-center touch-action-none"
          title="Drag to adjust start time"
        >
          <div className="w-8 h-1 bg-indigo-500 rounded-full" />
        </div>
      )}

      {/* Card Content Layout: Single Inline Row for Short Blocks (<=35m) vs 2-Row for Taller Blocks */}
      {isShortBlock ? (
        <>
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <BlockTypeBadge
              isPlan={isPlan}
              isFocus={isFocus}
              isActivity={isActivity}
              coalescedCount={item.coalescedCount}
              variant={variant}
            />

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
              {timeService.formatTime(effectiveStartAt)}–{timeService.formatTime(effectiveEndAt)} (
              {timeService.formatDuration(item.durationSeconds)})
            </span>
          </div>

          {/* Right side: Overlap badge or hover action buttons */}
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {item.isOverlapping && <OverlapBadge variant={variant} />}

            <BlockQuickActions
              isPlan={isPlan}
              itemId={item.id}
              linkedTask={linkedTask}
              variant={variant}
              onStartSession={onStartSession}
              onDeletePlannedBlock={onDeletePlannedBlock}
              onDeleteSession={onDeleteSession}
            />
          </div>
        </>
      ) : (
        <>
          {/* Card Header: Type badge & Overlap & Quick actions */}
          <div className="flex items-center justify-between gap-1 min-w-0 shrink-0">
            <div className="flex items-center gap-1 shrink-0">
              <BlockTypeBadge
                isPlan={isPlan}
                isFocus={isFocus}
                isActivity={isActivity}
                coalescedCount={item.coalescedCount}
                variant={variant}
              />
            </div>

            {/* Right side: Compact overlap warning & Quick actions */}
            <div className="flex items-center gap-1 shrink-0">
              {item.isOverlapping && <OverlapBadge variant={variant} />}

              <BlockQuickActions
                isPlan={isPlan}
                itemId={item.id}
                linkedTask={linkedTask}
                variant={variant}
                onStartSession={onStartSession}
                onDeletePlannedBlock={onDeletePlannedBlock}
                onDeleteSession={onDeleteSession}
              />
            </div>
          </div>

          {/* Middle Title Area: Full width, line-clamp-2 to display full task name */}
          <div
            onClick={(e) => {
              if (linkedTask && onInspectTask) {
                e.stopPropagation();
                onInspectTask(linkedTask);
              }
            }}
            className="text-xs font-semibold leading-snug line-clamp-2 hover:underline break-words my-auto py-0.5"
          >
            {item.title ||
              linkedTask?.title ||
              (isPlan
                ? language === 'zh-CN'
                  ? '排期计划'
                  : 'Planned Task'
                : language === 'zh-CN'
                  ? '专注记录'
                  : 'Session')}
          </div>

          {/* Card Footer: Time info */}
          <div className="flex items-center justify-between text-[10px] opacity-80 shrink-0">
            <span className="font-mono truncate">
              {timeService.formatTime(effectiveStartAt)} – {timeService.formatTime(effectiveEndAt)}
            </span>
            {item.durationSeconds >= 1800 && (
              <span className="font-mono text-[9px] opacity-75 shrink-0 ml-1">
                {timeService.formatDuration(item.durationSeconds)}
              </span>
            )}
          </div>
        </>
      )}

      {/* Bottom Resize Handle (for planned blocks) */}
      {isPlan && (
        <div
          onPointerDown={(e) => {
            e.stopPropagation();
            onResizeStart({
              blockId: item.id,
              edge: 'bottom',
              initialStartAt: item.startAt,
              initialEndAt: item.endAt,
            });
          }}
          className="absolute -bottom-1 left-2 right-2 h-2 cursor-ns-resize z-20 opacity-0 group-hover/item:opacity-100 flex items-center justify-center touch-action-none"
          title="Drag to adjust end time"
        >
          <div className="w-8 h-1 bg-indigo-500 rounded-full" />
        </div>
      )}

      {/* Ghost Timebox Prediction Extension (Historical Variance) */}
      {isPlan && originalBlock && (
        <GhostExtension
          block={originalBlock}
          task={linkedTask}
          effectiveEndAt={effectiveEndAt}
          totalRangeMs={totalRangeMs}
          hourCount={hourCount}
        />
      )}
    </div>
  );
};
