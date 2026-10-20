import React from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { timeService } from '@/core/time/timeService';
import { useI18n } from '@/core/i18n';
import { Plus, Trash2 } from 'lucide-react';
import type { PlannedBlock, Session, Task } from '@/core/types/domain';

interface WeekViewProps {
  currentDateMs: number;
  daysCount: 5 | 7;
  plannedBlocks: PlannedBlock[];
  sessions: Session[];
  tasks: Task[];
  onSlotClick: (dateStr: string, hour: number) => void;
  onDropTask?: (taskId: string, dateStr: string, hour: number) => Promise<void> | void;
  onInspectTask?: (task: Task) => void;
  onDeleteBlock?: (blockId: string) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  currentDateMs,
  daysCount,
  plannedBlocks,
  sessions,
  tasks,
  onSlotClick,
  onDropTask,
  onInspectTask,
  onDeleteBlock,
}) => {
  const { language } = useI18n();
  const logicalDate = timeService.getLogicalDate(currentDateMs);
  const weekStart = startOfWeek(new Date(`${logicalDate}T12:00:00`), { weekStartsOn: 1 }); // Monday

  const weekdayCn = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  const days = Array.from({ length: daysCount }, (_, i) => {
    const d = addDays(weekStart, i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const isToday = dateStr === timeService.getLogicalDate();
    return {
      date: d,
      dateStr,
      dayName: language === 'zh-CN' ? weekdayCn[d.getDay()] : format(d, 'EEE'),
      dayNumber: format(d, 'd'),
      isToday,
      startOfDayMs: timeService.getStartOfLogicalDay(dateStr),
    };
  });

  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  // Hours from 08:00 to 20:00 for compact week view
  const hours = Array.from({ length: 13 }, (_, i) => i + 8);

  return (
    <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col shadow-xs">
      {/* Week Days Header Columns */}
      <div className="flex border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 select-none">
        {/* Hour Gutter placeholder */}
        <div className="w-12 shrink-0 border-r border-slate-100 dark:border-slate-800" />

        {days.map((day) => (
          <div
            key={day.dateStr}
            className={`flex-1 py-2 px-1 text-center border-r border-slate-100 dark:border-slate-800 last:border-r-0 ${
              day.isToday ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''
            }`}
          >
            <span className="text-[11px] font-medium text-slate-400 uppercase">
              {day.dayName}
            </span>
            <div className="flex items-center justify-center mt-0.5">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  day.isToday
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {day.dayNumber}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Week Hours Grid */}
      <div className="flex-1 overflow-y-auto">
        {hours.map((hour) => {
          const timeLabel = `${hour.toString().padStart(2, '0')}:00`;

          return (
            <div
              key={hour}
              className="flex border-b border-slate-100/80 dark:border-slate-800/60 min-h-[56px]"
            >
              {/* Hour gutter */}
              <div className="w-12 shrink-0 p-1 text-[11px] font-mono text-slate-400 border-r border-slate-100 dark:border-slate-800 text-right pr-2 select-none">
                {timeLabel}
              </div>

              {/* Day slots */}
              {days.map((day) => {
                const hourStartMs = day.startOfDayMs + hour * 3600000;
                const hourEndMs = hourStartMs + 3600000;

                // Render planned blocks in their starting slot (or first visible slot if started earlier)
                const dayPlanned = plannedBlocks.filter((b) => {
                  if (b.startAt >= hourStartMs && b.startAt < hourEndMs) return true;
                  if (hour === 8 && b.startAt < hourStartMs && b.endAt > hourStartMs) return true;
                  return false;
                });

                // Render sessions in their starting slot (or first visible slot if started earlier), avoiding multi-row duplication
                const daySessions = sessions.filter((s) => {
                  const effectiveEndMs = s.endedAt || (s.startedAt + Math.max(60000, (s.activeDurationSeconds || 0) * 1000));
                  if (s.startedAt >= hourStartMs && s.startedAt < hourEndMs) return true;
                  if (hour === 8 && s.startedAt < hourStartMs && effectiveEndMs > hourStartMs) return true;
                  return false;
                });

                return (
                  <div
                    key={day.dateStr}
                    onClick={() => onSlotClick(day.dateStr, hour)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'copy';
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'copy';
                    }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      const taskId =
                        e.dataTransfer.getData('application/json-task-id') ||
                        e.dataTransfer.getData('text/plain');
                      if (taskId && onDropTask) {
                        await onDropTask(taskId, day.dateStr, hour);
                      }
                    }}
                    className="flex-1 border-r border-slate-100 dark:border-slate-800/60 last:border-r-0 p-1 space-y-1 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group relative"
                  >
                    {/* Planned blocks */}
                    {dayPlanned.map((block) => {
                      const linkedTask = block.taskId ? taskMap.get(block.taskId) : undefined;
                      return (
                        <div
                          key={block.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (linkedTask) onInspectTask?.(linkedTask);
                          }}
                          className="p-1.5 rounded-lg border-l-3 border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 shadow-2xs text-left group/block"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {block.title || linkedTask?.title || 'Plan'}
                            </span>
                            {onDeleteBlock && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteBlock(block.id);
                                }}
                                className="touch-target opacity-0 group-hover/block:opacity-100 text-slate-400 hover:text-red-500 p-0.5"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Actual sessions */}
                    {daySessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-1.5 rounded-lg border-l-3 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-left"
                      >
                        <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200 truncate block">
                          {session.title}
                        </span>
                      </div>
                    ))}

                    {/* Quick add plan indicator */}
                    {dayPlanned.length === 0 && daySessions.length === 0 && (
                      <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 text-slate-300 dark:text-slate-600 hover:text-indigo-600">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
