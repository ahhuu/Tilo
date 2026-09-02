import React, { useMemo } from 'react';
import { Clock, Play } from 'lucide-react';
import { useI18n } from '@/core/i18n';
import { usePlannedBlocks, useTasks } from '@/storage/hooks/useLiveQuery';
import { useUIStore } from '@/stores/uiStore';
import { startSession } from '@/services/sessionCommands';
import { timeService } from '@/core/time/timeService';
import type { PlannedBlock } from '@/core/types/domain';

export const TimelineGrid: React.FC = () => {
  const { language } = useI18n();
  const isZh = language === 'zh-CN';
  const { setRunningSession, addToast } = useUIStore();

  const logicalDate = timeService.getLogicalDate();
  const startOfDayMs = timeService.getStartOfLogicalDay(logicalDate);
  const endOfDayMs = timeService.getEndOfLogicalDay(logicalDate);
  const nowMs = Date.now();

  const blocks = usePlannedBlocks(startOfDayMs, endOfDayMs);
  const tasks = useTasks();

  const taskMap = useMemo(() => new Map(tasks?.map((t) => [t.id, t])), [tasks]);

  const sortedBlocks = useMemo(() => {
    return [...(blocks || [])].sort((a, b) => a.startAt - b.startAt);
  }, [blocks]);

  const handleStartBlockSession = async (block: PlannedBlock) => {
    const task = block.taskId ? taskMap.get(block.taskId) : null;
    const defaultBlockTitle = isZh ? '时间块计划' : 'Planned Block';
    const title = task?.title || block.title || defaultBlockTitle;

    try {
      const sess = await startSession({
        taskId: block.taskId,
        plannedBlockId: block.id,
        projectId: block.projectId,
        title,
      });

      const durMinutes = Math.round((block.endAt - block.startAt) / 60000);

      setRunningSession({
        sessionId: sess.id,
        taskId: block.taskId,
        plannedBlockId: block.id,
        title,
        startedAt: sess.startedAt,
        elapsedSeconds: 0,
        isPaused: false,
        targetDurationMinutes: durMinutes > 0 ? durMinutes : 25,
        displayMode: 'countdown',
      });

      addToast({ message: isZh ? `开始执行时间块: ${title}` : `Started block: ${title}`, type: 'success' });
    } catch {
      addToast({ message: isZh ? '启动会话失败' : 'Failed to start session', type: 'error' });
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent overflow-hidden select-none">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-200/40 dark:border-slate-800/40 bg-slate-50/40 dark:bg-slate-800/20">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {isZh ? '时间块安排' : 'Timeline Schedule'}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
            {sortedBlocks.length}
          </span>
        </div>
      </div>

      {/* 列表区域 */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
        {sortedBlocks.length === 0 ? (
          <div className="h-36 flex flex-col items-center justify-center text-center text-slate-400 text-xs">
            <Clock className="w-6 h-6 mb-1.5 opacity-40 text-slate-300 dark:text-slate-600" />
            <span>{isZh ? '今日暂无时间块计划' : 'No planned blocks today'}</span>
            <span className="text-[10px] text-slate-400 mt-0.5">{isZh ? '可在 APP 日历中规划时间块' : 'Plan timeboxes in Calendar'}</span>
          </div>
        ) : (
          sortedBlocks.map((block) => {
            const isNow = nowMs >= block.startAt && nowMs <= block.endAt;
            const isPast = nowMs > block.endAt;
            const task = block.taskId ? taskMap.get(block.taskId) : null;
            const defaultBlockTitle = isZh ? '时间块安排' : 'Planned Block';
            const title = task?.title || block.title || defaultBlockTitle;

            return (
              <div
                key={block.id}
                className={`group p-2.5 rounded-xl border transition-all ${
                  isNow
                    ? 'bg-sky-50/90 dark:bg-sky-950/70 border-sky-300 dark:border-sky-800 shadow-xs ring-1 ring-sky-400/40'
                    : isPast
                    ? 'bg-slate-50/40 dark:bg-slate-900/40 border-slate-200/40 dark:border-slate-800/40 opacity-60'
                    : 'bg-white/80 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 border-slate-200/60 dark:border-slate-800/80 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {timeService.formatTime(block.startAt)} - {timeService.formatTime(block.endAt)}
                    </span>
                  </span>

                  {isNow && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-sky-500 text-white animate-pulse">
                      {isZh ? '进行中' : 'Now'}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate flex-1 pr-2">
                    {title}
                  </span>

                  {!isPast && (
                    <button
                      type="button"
                      onClick={() => handleStartBlockSession(block)}
                      className="p-1 rounded-md bg-sky-100 dark:bg-sky-900/80 hover:bg-sky-200 text-sky-700 dark:text-sky-300 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                      title={isZh ? '立即专注此时间块' : 'Focus on this block'}
                    >
                      <Play className="w-3 h-3 fill-current" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
