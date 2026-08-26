import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/storage/db';
import {
  createPlannedBlock,
  updatePlannedBlock,
  deletePlannedBlock,
} from '@/services/planCommands';
import { startSession, deleteSession } from '@/services/sessionCommands';
import { timeService } from '@/core/time/timeService';
import { TimelineView } from '@/components/timeline/TimelineView';
import { useUIStore } from '@/stores/uiStore';
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
  const { openInspector, setRunningSession, addToast } = useUIStore();

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

  const handleStartSession = async (target: Task | { id: string; title: string; projectId?: string }) => {
    const isTask = 'statusId' in target;
    const session = await startSession({
      taskId: isTask ? target.id : undefined,
      projectId: target.projectId,
      title: target.title,
    });
    setRunningSession({
      sessionId: session.id,
      taskId: isTask ? target.id : undefined,
      title: target.title,
      startedAt: session.startedAt,
      elapsedSeconds: 0,
      isPaused: false,
    });
  };

  return (
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
  );
};
