import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { timeService } from '@/core/time/timeService';
import { Calendar, Trash2, Clock, CheckCircle2 } from 'lucide-react';
import type { PlannedBlock, Session, Task } from '@/core/types/domain';

interface AgendaViewProps {
  plannedBlocks: PlannedBlock[];
  sessions: Session[];
  tasks: Task[];
  onInspectTask?: (task: Task) => void;
  onDeleteBlock?: (blockId: string) => void;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  plannedBlocks,
  sessions,
  tasks,
  onInspectTask,
  onDeleteBlock,
}) => {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  // Group events by date string
  const grouped = new Map<
    string,
    { planned: PlannedBlock[]; sessions: Session[]; scheduledTasks: Task[] }
  >();

  // 1. Group planned blocks
  plannedBlocks.forEach((block) => {
    const dateStr = timeService.getLogicalDate(block.startAt);
    if (!grouped.has(dateStr)) {
      grouped.set(dateStr, { planned: [], sessions: [], scheduledTasks: [] });
    }
    grouped.get(dateStr)!.planned.push(block);
  });

  // 2. Group sessions
  sessions.forEach((session) => {
    const dateStr = timeService.getLogicalDate(session.startedAt);
    if (!grouped.has(dateStr)) {
      grouped.set(dateStr, { planned: [], sessions: [], scheduledTasks: [] });
    }
    grouped.get(dateStr)!.sessions.push(session);
  });

  // 3. Group scheduled tasks
  tasks.forEach((task) => {
    if (task.scheduledDate) {
      if (!grouped.has(task.scheduledDate)) {
        grouped.set(task.scheduledDate, { planned: [], sessions: [], scheduledTasks: [] });
      }
      grouped.get(task.scheduledDate)!.scheduledTasks.push(task);
    }
  });

  const sortedDates = Array.from(grouped.keys()).sort();

  if (sortedDates.length === 0) {
    return (
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center text-xs text-slate-400 space-y-2">
        <Calendar className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
        <p className="font-semibold text-slate-600 dark:text-slate-300">No Agenda Items Scheduled</p>
        <p>Add planned blocks or schedule tasks to see your sequential agenda here.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 overflow-y-auto space-y-6 shadow-xs">
      {sortedDates.map((dateStr) => {
        const group = grouped.get(dateStr)!;
        const isToday = dateStr === timeService.getLogicalDate();

        return (
          <div key={dateStr} className="space-y-2.5">
            {/* Date Group Header */}
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {timeService.formatDateHeader(dateStr)}
              </span>
              {isToday && (
                <Badge variant="indigo" size="sm">
                  Today
                </Badge>
              )}
            </div>

            {/* List of items */}
            <div className="space-y-1.5 pl-2">
              {/* Planned Blocks */}
              {group.planned.map((block) => {
                const linkedTask = block.taskId ? taskMap.get(block.taskId) : undefined;
                return (
                  <div
                    key={block.id}
                    onClick={() => linkedTask && onInspectTask?.(linkedTask)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/30 hover:border-indigo-300 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Badge variant="indigo" size="sm">
                        Plan
                      </Badge>
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {block.title || linkedTask?.title || 'Planned Block'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-400 font-mono">
                        {timeService.formatTime(block.startAt)}–{timeService.formatTime(block.endAt)}
                      </span>
                      {onDeleteBlock && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteBlock(block.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Sessions */}
              {group.sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/30 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Badge variant="low" size="sm" className="bg-emerald-100 text-emerald-800 border-0">
                      Actual
                    </Badge>
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                      {session.title}
                    </span>
                  </div>
                  <span className="text-xs text-emerald-700 dark:text-emerald-300 font-mono">
                    {timeService.formatDuration(session.activeDurationSeconds)}
                  </span>
                </div>
              ))}

              {/* Scheduled Tasks */}
              {group.scheduledTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onInspectTask?.(task)}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-slate-300 transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CheckCircle2
                      className={`w-3.5 h-3.5 shrink-0 ${
                        task.statusId === 'ws-task-done' ? 'text-emerald-500' : 'text-slate-300'
                      }`}
                    />
                    <span
                      className={`text-xs font-medium truncate ${
                        task.statusId === 'ws-task-done'
                          ? 'line-through text-slate-400'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={task.priority} size="sm">
                      {task.priority}
                    </Badge>
                    {task.estimateMinutes && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {task.estimateMinutes}m
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
