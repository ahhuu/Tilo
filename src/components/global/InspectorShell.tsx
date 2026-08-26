import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/storage/db';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { TaskInspector } from '@/components/task/TaskInspector';
import { TaskDetailModal } from '@/components/task/TaskDetailModal';
import { BlockInspector } from '@/components/timeline/BlockInspector';
import { deletePlannedBlock } from '@/services/planCommands';
import { startSession } from '@/services/sessionCommands';
import { X, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from '@/core/types/domain';

import { GoalInspector } from '@/components/goals/GoalInspector';
import { ProjectInspector } from '@/components/projects/ProjectInspector';
import { SessionInspector } from '@/components/sessions/SessionInspector';

export const InspectorShell: React.FC = () => {
  const { language } = useI18n();
  const { inspectorOpen, closeInspector, inspectorTarget, openInspector, setRunningSession, addToast } = useUIStore();
  const [detailModalTaskId, setDetailModalTaskId] = useState<string | null>(null);

  // Live queries when inspecting a planned block or session
  const inspectedBlock = useLiveQuery(
    () => (inspectorTarget?.type === 'block' ? db.plannedBlocks.get(inspectorTarget.id) : undefined),
    [inspectorTarget?.id, inspectorTarget?.type]
  );

  const inspectedSessions =
    useLiveQuery(
      () =>
        inspectedBlock
          ? db.sessions
              .where('workspaceId')
              .equals(inspectedBlock.workspaceId)
              .filter((s) => s.plannedBlockId === inspectedBlock.id)
              .toArray()
          : [],
      [inspectedBlock]
    ) || [];

  const linkedTask = useLiveQuery(
    () => (inspectedBlock?.taskId ? db.tasks.get(inspectedBlock.taskId) : undefined),
    [inspectedBlock?.taskId]
  );

  const linkedProject = useLiveQuery(
    () => (inspectedBlock?.projectId ? db.projects.get(inspectedBlock.projectId) : undefined),
    [inspectedBlock?.projectId]
  );

  if (!inspectorOpen) return null;

  const handleStartSession = async (target: Task | { id: string; title: string; projectId?: string }) => {
    const isTask = 'statusId' in target;
    const session = await startSession({
      taskId: isTask ? target.id : undefined,
      plannedBlockId: inspectedBlock?.id,
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

    addToast({
      message: language === 'zh-CN' ? `已开启专注会话: "${target.title}"` : `Started session: "${target.title}"`,
      type: 'info',
    });
  };

  const handleDeleteBlock = async (blockId: string) => {
    await deletePlannedBlock(blockId);
    addToast({
      message: language === 'zh-CN' ? '已删除时间块' : 'Planned block deleted',
      type: 'info',
    });
    closeInspector();
  };

  return (
    <>
      <aside
        aria-label="Inspector Panel"
        className={cn(
          'w-88 shrink-0 border-l border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs flex flex-col h-full z-20 select-none animate-in slide-in-from-right-4 duration-200'
        )}
      >
        {/* Inspector Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/70 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {inspectorTarget?.type === 'task'
                ? (language === 'zh-CN' ? '任务属性' : 'Task Inspector')
                : inspectorTarget?.type === 'block'
                  ? (language === 'zh-CN' ? '时间块对比属性' : 'Planned Block Inspector')
                  : inspectorTarget?.type === 'goal'
                    ? (language === 'zh-CN' ? '目标属性' : 'Goal Inspector')
                    : inspectorTarget?.type === 'project'
                      ? (language === 'zh-CN' ? '项目属性' : 'Project Inspector')
                      : (language === 'zh-CN' ? '属性面板' : 'Inspector')}
            </span>
          </div>
          <button
            type="button"
            onClick={closeInspector}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Close Inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inspector Content */}
        <div className="flex-1 overflow-y-auto">
          {inspectorTarget?.type === 'task' ? (
            <div className="p-4">
              <TaskInspector
                taskId={inspectorTarget.id}
                onOpenDetailModal={() => setDetailModalTaskId(inspectorTarget.id)}
              />
            </div>
          ) : inspectorTarget?.type === 'block' && inspectedBlock ? (
            <BlockInspector
              block={inspectedBlock}
              sessions={inspectedSessions}
              task={linkedTask}
              project={linkedProject}
              onStartSession={handleStartSession}
              onDeleteBlock={handleDeleteBlock}
              onInspectTask={(task) => openInspector({ type: 'task', id: task.id, title: task.title })}
            />
          ) : inspectorTarget?.type === 'goal' ? (
            <div className="p-4">
              <GoalInspector goalId={inspectorTarget.id} />
            </div>
          ) : inspectorTarget?.type === 'project' ? (
            <div className="p-4">
              <ProjectInspector projectId={inspectorTarget.id} />
            </div>
          ) : inspectorTarget?.type === 'session' ? (
            <SessionInspector
              sessionId={inspectorTarget.id}
              onInspectTask={(task) => openInspector({ type: 'task', id: task.id, title: task.title })}
            />
          ) : inspectorTarget ? (
            <div className="p-4 space-y-3">
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  {inspectorTarget.type}
                </span>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {inspectorTarget.title || `Item ${inspectorTarget.id}`}
                </h2>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-2">
                <div className="flex justify-between">
                  <span>ID:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {inspectorTarget.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="capitalize text-slate-700 dark:text-slate-300">
                    {inspectorTarget.type}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              {language === 'zh-CN' ? '选择项目以检视详细属性' : 'Select an item to inspect details.'}
            </div>
          )}
        </div>
      </aside>

      {/* Task Detail Modal */}
      {detailModalTaskId && (
        <TaskDetailModal
          taskId={detailModalTaskId}
          onClose={() => setDetailModalTaskId(null)}
        />
      )}
    </>
  );
};
