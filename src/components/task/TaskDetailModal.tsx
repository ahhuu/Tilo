import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/storage/db';
import { updateTask, completeTask, reopenTask, deleteTaskToTrash } from '@/services/taskCommands';
import { SubtaskList } from './SubtaskList';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { X, CheckCircle2, Trash2, Calendar, Clock } from 'lucide-react';

interface TaskDetailModalProps {
  taskId: string;
  onClose: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ taskId, onClose }) => {
  const { language } = useI18n();
  const { addToast } = useUIStore();
  const task = useLiveQuery(() => db.tasks.get(taskId), [taskId]);
  const [description, setDescription] = useState<string | undefined>(undefined);

  if (!task) return null;

  const isDone = task.statusId === 'ws-task-done';
  const currentDesc = description !== undefined ? description : task.description || '';

  const handleSaveDescription = async () => {
    if (description !== undefined) {
      await updateTask(taskId, { description: description.trim() || undefined });
      addToast({ message: language === 'zh-CN' ? '任务描述已更新' : 'Description updated', type: 'info' });
    }
  };

  const handleToggleComplete = async () => {
    if (isDone) {
      await reopenTask(taskId);
      addToast({ message: language === 'zh-CN' ? '任务已重新打开' : 'Task reopened', type: 'info' });
    } else {
      await completeTask(taskId);
      addToast({ message: language === 'zh-CN' ? '任务已标记完成' : 'Task completed', type: 'success' });
    }
  };

  const handleDelete = async () => {
    await deleteTaskToTrash(taskId);
    addToast({ message: language === 'zh-CN' ? '任务已移至废纸篓' : 'Task moved to Trash', type: 'info' });
    onClose();
  };

  const getPriorityLabel = (priority: string) => {
    if (language !== 'zh-CN') return priority;
    switch (priority) {
      case 'urgent':
        return '紧急';
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return '无';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isDone ? 'secondary' : 'primary'}
              onClick={handleToggleComplete}
              className="h-7 text-xs gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${isDone ? 'text-emerald-600' : ''}`} />
              <span>{isDone ? (language === 'zh-CN' ? '已完成' : 'Completed') : (language === 'zh-CN' ? '标记完成' : 'Mark Complete')}</span>
            </Button>
            <Badge variant={task.priority}>{getPriorityLabel(task.priority)}</Badge>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleDelete}
              className="p-1.5 text-slate-400 hover:text-red-500 rounded-md cursor-pointer"
              title={language === 'zh-CN' ? '删除任务' : 'Delete task'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {task.title}
            </h2>
            <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
              {task.scheduledDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  {language === 'zh-CN' ? `排期日期: ${task.scheduledDate}` : `Scheduled: ${task.scheduledDate}`}
                </span>
              )}
              {task.dueDate && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-rose-500" />
                  {language === 'zh-CN' ? `截止日期: ${task.dueDate}` : `Due: ${task.dueDate}`}
                </span>
              )}
              {task.estimateMinutes && (
                <span>{language === 'zh-CN' ? `预估工时: ${task.estimateMinutes}分钟` : `Estimate: ${task.estimateMinutes}m`}</span>
              )}
            </div>
          </div>

          {/* Description area */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              {language === 'zh-CN' ? '备注与描述' : 'Notes & Description'}
            </label>
            <textarea
              rows={4}
              value={currentDesc}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSaveDescription}
              placeholder={language === 'zh-CN' ? '添加任务详情、验收标准或 Markdown 格式备注...' : 'Add details, acceptance criteria, or markdown notes...'}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden resize-y"
            />
          </div>

          {/* Subtasks */}
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30">
            <SubtaskList parentTaskId={task.id} workspaceId={task.workspaceId} />
          </div>
        </div>
      </div>
    </div>
  );
};
