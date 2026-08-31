import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/storage/db';
import {
  createPlannedBlock,
  updatePlannedBlock,
  deletePlannedBlock,
} from '@/services/planCommands';
import { startSession, deleteSession } from '@/services/sessionCommands';
import { checkSessionOverflow, elasticPushSubsequentBlocks } from '@/services/elasticPushService';
import { timeService } from '@/core/time/timeService';
import { TimelineView } from '@/components/timeline/TimelineView';
import { AutoPackModal } from '@/components/timeline/AutoPackModal';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { Zap, FastForward, X, Sparkles } from 'lucide-react';
import type { Task, Project, PlannedBlock, Session } from '@/core/types/domain';

interface TodayTimelineProps {
  logicalDate: string;
  tasks: Task[];
  projects?: Project[];
  onInspectTask?: (task: Task) => void;
}

export const TodayTimeline: React.FC<TodayTimelineProps> = ({
  logicalDate,
  tasks,
  projects = [],
  onInspectTask,
}) => {
  const { language } = useI18n();
  const { openInspector, runningSession, setRunningSession, addToast } = useUIStore();
  const [dismissedOverflow, setDismissedOverflow] = useState(false);
  const [showAutoPackModal, setShowAutoPackModal] = useState(false);

  const startOfDayMs = timeService.getStartOfLogicalDay(logicalDate);
  const endOfDayMs = timeService.getEndOfLogicalDay(logicalDate);

  const plannedBlocks =
    useLiveQuery(
      () =>
        db.plannedBlocks
          .where('[workspaceId+startAt]')
          .between(['ws-default', startOfDayMs], ['ws-default', endOfDayMs], true, true)
          .toArray(),
      [startOfDayMs, endOfDayMs]
    ) || [];

  const sessions =
    useLiveQuery(
      () =>
        db.sessions
          .where('[workspaceId+startedAt]')
          .between(['ws-default', startOfDayMs], ['ws-default', endOfDayMs], true, true)
          .toArray(),
      [startOfDayMs, endOfDayMs]
    ) || [];

  const allProjects = useLiveQuery(() => db.projects.toArray(), []) || projects;

  const handleInspectBlock = (block: PlannedBlock) => {
    openInspector({
      type: 'block',
      id: block.id,
      title: block.title || 'Planned Block',
      data: { block },
    });
  };

  const handleInspectSession = (session: Session) => {
    openInspector({
      type: 'session',
      id: session.id,
      title: session.title || 'Session',
      data: { session },
    });
  };

  const handleStartSession = async (target: Task | PlannedBlock | { id: string; title: string; projectId?: string; estimateMinutes?: number; startAt?: number; endAt?: number }) => {
    const isTask = 'statusId' in target;
    const isBlock = 'startAt' in target && 'endAt' in target;
    let targetDurationMinutes: number | undefined;
    if (isTask && (target as Task).estimateMinutes) {
      targetDurationMinutes = (target as Task).estimateMinutes;
    } else if (isBlock && (target as PlannedBlock).startAt && (target as PlannedBlock).endAt) {
      targetDurationMinutes = Math.round(((target as PlannedBlock).endAt - (target as PlannedBlock).startAt) / 60000);
    } else if ('estimateMinutes' in target && target.estimateMinutes) {
      targetDurationMinutes = target.estimateMinutes;
    }

    const session = await startSession({
      taskId: isTask ? target.id : undefined,
      projectId: target.projectId,
      title: target.title,
    });
    setRunningSession({
      sessionId: session.id,
      taskId: isTask ? target.id : undefined,
      plannedBlockId: isBlock ? target.id : undefined,
      title: target.title || (language === 'zh-CN' ? '专注会话' : 'Focus Session'),
      startedAt: session.startedAt,
      elapsedSeconds: 0,
      isPaused: false,
      targetDurationMinutes,
      displayMode: targetDurationMinutes ? 'countdown' : 'stopwatch',
    });
  };

  // Check for session overflow against planned blocks
  const overflowInfo = runningSession && !dismissedOverflow
    ? checkSessionOverflow(runningSession, plannedBlocks)
    : { isOverflowing: false, overflowMinutes: 0 };

  const handleElasticPush = async () => {
    if (!overflowInfo.isOverflowing || !overflowInfo.blockEndAt) return;
    const count = await elasticPushSubsequentBlocks(
      logicalDate,
      overflowInfo.blockEndAt,
      overflowInfo.overflowMinutes
    );
    setDismissedOverflow(true);
    addToast({
      message: language === 'zh-CN'
        ? `已自动顺延后续 ${count} 个时间块 (+${overflowInfo.overflowMinutes} 分钟)`
        : `Shifted ${count} subsequent blocks forward (+${overflowInfo.overflowMinutes}m)`,
      type: 'success',
    });
  };

  return (
    <div className="space-y-2.5">
      {/* Elastic Push Action Banner */}
      {overflowInfo.isOverflowing && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/40 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2 duration-150 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <Zap className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
            <span className="font-medium truncate">
              {language === 'zh-CN'
                ? `当前专注「${overflowInfo.blockTitle || '任务'}」已超出排期 ${overflowInfo.overflowMinutes} 分钟`
                : `Session has exceeded schedule by ${overflowInfo.overflowMinutes}m`}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="primary"
              onClick={handleElasticPush}
              className="h-7 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-xs"
            >
              <FastForward className="w-3.5 h-3.5 mr-1" />
              <span>{language === 'zh-CN' ? `自动顺延后续待办 (+${overflowInfo.overflowMinutes}m)` : `Push Next Blocks`}</span>
            </Button>
            <button
              type="button"
              onClick={() => setDismissedOverflow(true)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Timeline Controls Toolbar */}
      <div className="flex items-center justify-between px-1">
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {language === 'zh-CN' ? '今日时间轴排期' : "Today's Timebox Schedule"}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAutoPackModal(true)}
          className="h-7 text-xs gap-1.5 cursor-pointer text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{language === 'zh-CN' ? '智能排盒' : 'Auto-Pack Day'}</span>
        </Button>
      </div>

      <TimelineView
        dateStr={logicalDate}
        tasks={tasks}
        projects={allProjects}
        plannedBlocks={plannedBlocks}
        sessions={sessions}
        onInspectTask={onInspectTask}
        onInspectBlock={handleInspectBlock}
        onInspectSession={handleInspectSession}
        onCreatePlannedBlock={async (data) => {
          const block = await createPlannedBlock(data);
          addToast({ message: '时间块已规划 (Planned block created)', type: 'success' });
          return block;
        }}
        onUpdatePlannedBlock={async (blockId, updates) => {
          const updated = await updatePlannedBlock(blockId, updates);
          addToast({ message: '时间块已调整 (Time block updated)', type: 'info' });
          return updated;
        }}
        onDeletePlannedBlock={async (blockId) => {
          await deletePlannedBlock(blockId);
          addToast({ message: '时间块已删除 (Time block deleted)', type: 'info' });
        }}
        onDeleteSession={async (sessionId) => {
          await deleteSession(sessionId);
          addToast({ message: '实际专注记录已删除 (Session deleted)', type: 'info' });
        }}
        onStartSession={handleStartSession}
      />

      {/* Auto-Pack Modal */}
      <AutoPackModal
        isOpen={showAutoPackModal}
        onClose={() => setShowAutoPackModal(false)}
        dateKey={logicalDate}
      />
    </div>
  );
};
