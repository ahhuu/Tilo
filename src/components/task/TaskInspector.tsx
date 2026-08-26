import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type TiloDB } from '@/storage/db';
import { updateTask, rescheduleTask, deleteTaskToTrash, completeTask, reopenTask } from '@/services/taskCommands';
import { startSession } from '@/services/sessionCommands';
import { useProjects } from '@/storage/hooks/useLiveQuery';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { SubtaskList } from './SubtaskList';
import { RescheduleDialog } from './RescheduleDialog';
import { Button } from '@/components/ui/Button';
import {
  Calendar,
  Play,
  CheckCircle2,
  Trash2,
  History,
  Layers,
  ChevronDown,
  Maximize2,
  X,
} from 'lucide-react';
import type { PriorityLevel } from '@/core/types/domain';

interface TaskInspectorProps {
  taskId: string;
  database?: TiloDB;
  onOpenDetailModal?: () => void;
}

export const TaskInspector: React.FC<TaskInspectorProps> = ({
  taskId,
  database = db,
  onOpenDetailModal,
}) => {
  const { language } = useI18n();
  const { setRunningSession, addToast, closeInspector } = useUIStore();
  const [showReschedule, setShowReschedule] = useState(false);

  const task = useLiveQuery(() => database.tasks.get(taskId), [database, taskId]);
  const projects = useProjects(task?.workspaceId);
  const statuses = useLiveQuery(
    () => database.workflowStatuses.where('workflowId').equals('wf-task-default').sortBy('order'),
    [database]
  );
  const activityEvents = useLiveQuery(
    () =>
      database.activityEvents
        .where('entityId')
        .equals(taskId)
        .reverse()
        .sortBy('occurredAt'),
    [database, taskId]
  );

  if (!task) {
    return (
      <div className="p-4 text-xs text-slate-400 text-center">
        Loading task properties...
      </div>
    );
  }

  const isDone = task.statusId === 'ws-task-done';

  const handleTitleChange = async (newTitle: string) => {
    if (!newTitle.trim()) return;
    await updateTask(taskId, { title: newTitle.trim() }, database);
  };

  const handlePriorityChange = async (priority: PriorityLevel) => {
    await updateTask(taskId, { priority }, database);
  };

  const handleStatusChange = async (statusId: string) => {
    await updateTask(taskId, { statusId }, database);
  };

  const handleProjectChange = async (projectId: string) => {
    await updateTask(taskId, { projectId: projectId === 'none' ? undefined : projectId }, database);
  };

  const handleEstimateChange = async (estimateMinutes: number | undefined) => {
    await updateTask(taskId, { estimateMinutes }, database);
  };

  const handleDueDateChange = async (dueDate: string) => {
    await updateTask(taskId, { dueDate: dueDate || undefined }, database);
  };

  const handleReschedule = async (newDate: string, reason?: string) => {
    await rescheduleTask(taskId, newDate, reason, database);
    addToast({ message: `Task scheduled for ${newDate}`, type: 'info' });
  };

  const handleToggleComplete = async () => {
    if (isDone) {
      await reopenTask(taskId, database);
      addToast({ message: 'Task reopened', type: 'info' });
    } else {
      await completeTask(taskId, database);
      addToast({ message: 'Task completed', type: 'success' });
    }
  };

  const handleStartSession = async (kind: 'active' | 'background') => {
    const session = await startSession({
      taskId: task.id,
      projectId: task.projectId,
      title: task.title,
      kind,
    }, database);

    if (kind === 'active') {
      setRunningSession({
        sessionId: session.id,
        taskId: task.id,
        title: task.title,
        startedAt: session.startedAt,
        elapsedSeconds: 0,
        isPaused: false,
      });
    }

    addToast({
      message: `Started ${kind} session on "${task.title}"`,
      type: 'info',
    });
  };

  const handleDelete = async () => {
    await deleteTaskToTrash(taskId);
    addToast({ message: 'Task moved to Trash', type: 'info' });
    closeInspector();
  };

  return (
    <div className="flex flex-col h-full space-y-5 pb-6">
      {/* Top action row */}
      <div className="flex items-center justify-between">
        <Button
          size="sm"
          variant={isDone ? 'secondary' : 'primary'}
          onClick={handleToggleComplete}
          className="h-7 text-xs gap-1.5"
        >
          <CheckCircle2 className={`w-3.5 h-3.5 ${isDone ? 'text-emerald-600' : ''}`} />
          <span>{isDone ? (language === 'zh-CN' ? '已完成' : 'Completed') : (language === 'zh-CN' ? '标记完成' : 'Mark Complete')}</span>
        </Button>

        <div className="flex items-center gap-1">
          {onOpenDetailModal && (
            <button
              type="button"
              onClick={onOpenDetailModal}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              title={language === 'zh-CN' ? '打开全屏详情' : 'Open full detail modal'}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            className="p-1 rounded-md text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
            title={language === 'zh-CN' ? '移至废纸篓' : 'Move to Trash'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Title input */}
      <div>
        <input
          type="text"
          defaultValue={task.title}
          key={task.title}
          onBlur={(e) => handleTitleChange(e.target.value)}
          placeholder={language === 'zh-CN' ? '任务标题...' : 'Task title'}
          className="w-full text-base font-semibold text-slate-900 dark:text-slate-100 bg-transparent border-0 p-0 focus:outline-hidden focus:ring-0"
        />
      </div>

      {/* Properties Table */}
      <div className="space-y-3 text-xs">
        {/* Status */}
        <div className="grid grid-cols-3 items-center">
          <span className="text-slate-500 dark:text-slate-400">{language === 'zh-CN' ? '任务状态' : 'Status'}</span>
          <div className="col-span-2 relative">
            <select
              value={task.statusId}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full h-7 px-2 pr-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-0 text-xs appearance-none cursor-pointer focus:ring-1 focus:ring-indigo-500"
            >
              {statuses?.map((s) => (
                <option key={s.id} value={s.id}>
                  {language === 'zh-CN'
                    ? (s.name === 'Backlog' ? '待排期 (Backlog)' : s.name === 'Todo' ? '待办 (Todo)' : s.name === 'In Progress' ? '进行中 (In Progress)' : s.name === 'Done' ? '已完成 (Done)' : s.name === 'Canceled' ? '已取消 (Canceled)' : s.name)
                    : s.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
          </div>
        </div>

        {/* Priority */}
        <div className="grid grid-cols-3 items-center">
          <span className="text-slate-500 dark:text-slate-400">{language === 'zh-CN' ? '优先级' : 'Priority'}</span>
          <div className="col-span-2 relative">
            <select
              value={task.priority}
              onChange={(e) => handlePriorityChange(e.target.value as PriorityLevel)}
              className="w-full h-7 px-2 pr-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-0 text-xs appearance-none cursor-pointer focus:ring-1 focus:ring-indigo-500 capitalize"
            >
              <option value="none">{language === 'zh-CN' ? '无优先级' : 'None'}</option>
              <option value="low">{language === 'zh-CN' ? '低 (Low)' : 'Low'}</option>
              <option value="medium">{language === 'zh-CN' ? '中 (Medium)' : 'Medium'}</option>
              <option value="high">{language === 'zh-CN' ? '高 (High)' : 'High'}</option>
              <option value="urgent">{language === 'zh-CN' ? '紧急 (Urgent)' : 'Urgent'}</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
          </div>
        </div>

        {/* Project */}
        <div className="grid grid-cols-3 items-center">
          <span className="text-slate-500 dark:text-slate-400">{language === 'zh-CN' ? '归属项目' : 'Project'}</span>
          <div className="col-span-2 relative">
            <select
              value={task.projectId || 'none'}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full h-7 px-2 pr-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-0 text-xs appearance-none cursor-pointer focus:ring-1 focus:ring-indigo-500"
            >
              <option value="none">{language === 'zh-CN' ? '独立任务 (无项目)' : 'Standalone (No Project)'}</option>
              {projects?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
          </div>
        </div>

        {/* Scheduled Date */}
        <div className="grid grid-cols-3 items-center">
          <span className="text-slate-500 dark:text-slate-400">{language === 'zh-CN' ? '排期日期' : 'Scheduled'}</span>
          <div className="col-span-2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowReschedule(true)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <Calendar className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              <span>{task.scheduledDate || (language === 'zh-CN' ? '未排期' : 'Not scheduled')}</span>
            </button>
            {task.scheduledDate && (
              <button
                type="button"
                onClick={async () => {
                  await rescheduleTask(task.id, '');
                  addToast({
                    message: language === 'zh-CN' ? '已将任务设为未排期' : 'Task unscheduled',
                    type: 'info',
                  });
                }}
                className="p-1 text-slate-400 hover:text-red-500 rounded-md cursor-pointer"
                title={language === 'zh-CN' ? '设为未排期' : 'Clear schedule'}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Focus Mode / Block Nature Tag */}
        <div className="grid grid-cols-3 items-center">
          <span className="text-slate-500 dark:text-slate-400">{language === 'zh-CN' ? '专注模式' : 'Focus Mode'}</span>
          <div className="col-span-2 relative">
            <select
              value={task.tagIds?.[0] || 'Deep Work'}
              onChange={async (e) => {
                const selected = e.target.value;
                const rest = (task.tagIds || []).slice(1);
                await updateTask(task.id, { tagIds: [selected, ...rest] }, database);
                addToast({
                  message: language === 'zh-CN' ? `已设为: ${selected}` : `Set to ${selected}`,
                  type: 'info',
                });
              }}
              className="w-full h-7 px-2 pr-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-0 text-xs appearance-none cursor-pointer focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="Deep Work">Deep Work (深度专注)</option>
              <option value="Shallow Work">Shallow Work (浅度工作)</option>
              <option value="Meeting">Meeting (沟通协作)</option>
              <option value="Admin">Admin (例行杂务)</option>
              <option value="Research">Research (调研探索)</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
          </div>
        </div>

        {/* Due Date */}
        <div className="grid grid-cols-3 items-center">
          <span className="text-slate-500 dark:text-slate-400">{language === 'zh-CN' ? '截止日期' : 'Due Date'}</span>
          <div className="col-span-2">
            <input
              type="date"
              value={task.dueDate || ''}
              onChange={(e) => handleDueDateChange(e.target.value)}
              className="w-full h-7 px-2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-0 text-xs focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Estimate */}
        <div className="grid grid-cols-3 items-center">
          <span className="text-slate-500 dark:text-slate-400">{language === 'zh-CN' ? '预估工时' : 'Estimate'}</span>
          <div className="col-span-2 flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              step={15}
              placeholder="e.g. 60"
              defaultValue={task.estimateMinutes || ''}
              onBlur={(e) =>
                handleEstimateChange(e.target.value ? Number(e.target.value) : undefined)
              }
              className="w-20 h-7 px-2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-0 text-xs focus:ring-1 focus:ring-indigo-500"
            />
            <span className="text-slate-400">{language === 'zh-CN' ? '分钟' : 'minutes'}</span>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-slate-100 dark:bg-slate-800" />

      {/* Session Triggers */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {language === 'zh-CN' ? '专注会话' : 'Focus Sessions'}
        </span>
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="primary"
            className="h-8 text-xs gap-1.5 justify-center"
            onClick={() => handleStartSession('active')}
          >
            <Play className="w-3 h-3 fill-white" />
            <span>{language === 'zh-CN' ? '前台专注' : 'Active Session'}</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5 justify-center"
            onClick={() => handleStartSession('background')}
          >
            <Layers className="w-3 h-3 text-slate-500" />
            <span>{language === 'zh-CN' ? '后台挂起' : 'Background'}</span>
          </Button>
        </div>
      </div>

      <div className="w-full h-px bg-slate-100 dark:bg-slate-800" />

      {/* 1-Level Subtasks */}
      <SubtaskList parentTaskId={task.id} workspaceId={task.workspaceId} />

      <div className="w-full h-px bg-slate-100 dark:bg-slate-800" />

      {/* Activity History Log */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
          <History className="w-3.5 h-3.5" />
          <span>{language === 'zh-CN' ? '变更历史记录' : 'Activity History'}</span>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {!activityEvents || activityEvents.length === 0 ? (
            <div className="text-[11px] text-slate-400">
              {language === 'zh-CN' ? '暂无变更事件日志。' : 'No events logged yet.'}
            </div>
          ) : (
            activityEvents.map((ev) => (
              <div
                key={ev.id}
                className="text-[11px] p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-0.5"
              >
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium">
                  <span>{ev.eventType}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(ev.occurredAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reschedule Dialog Modal */}
      {showReschedule && (
        <RescheduleDialog
          currentDate={task.scheduledDate}
          onReschedule={handleReschedule}
          onClose={() => setShowReschedule(false)}
        />
      )}
    </div>
  );
};
