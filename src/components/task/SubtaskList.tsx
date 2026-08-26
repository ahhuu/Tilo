import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/storage/db';
import { createTask, completeTask, reopenTask, deleteTaskToTrash } from '@/services/taskCommands';
import { useI18n } from '@/core/i18n';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, Plus, Trash2 } from 'lucide-react';
import type { Task } from '@/core/types/domain';

interface SubtaskListProps {
  parentTaskId: string;
  workspaceId?: string;
}

export const SubtaskList: React.FC<SubtaskListProps> = ({ parentTaskId, workspaceId }) => {
  const { language } = useI18n();
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const subtasks = useLiveQuery(
    () =>
      db.tasks
        .where('parentTaskId')
        .equals(parentTaskId)
        .filter((t) => !t.deletedAt)
        .toArray(),
    [parentTaskId]
  );

  const completedCount = subtasks?.filter((t) => t.statusId === 'ws-task-done').length || 0;
  const totalCount = subtasks?.length || 0;

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    await createTask({
      title: trimmed,
      parentTaskId,
      workspaceId,
    });

    setNewTitle('');
    setIsAdding(false);
  };

  const handleToggle = async (subtask: Task) => {
    if (subtask.statusId === 'ws-task-done') {
      await reopenTask(subtask.id);
    } else {
      await completeTask(subtask.id);
    }
  };

  const handleDelete = async (subtaskId: string) => {
    await deleteTaskToTrash(subtaskId);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
        <span>
          {language === 'zh-CN' ? '子任务' : 'Subtasks'} ({completedCount}/{totalCount})
        </span>
        {!isAdding && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            {language === 'zh-CN' ? '添加' : 'Add'}
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      )}

      {/* Subtask list */}
      <div className="space-y-1">
        {subtasks?.map((subtask) => {
          const isDone = subtask.statusId === 'ws-task-done';
          return (
            <div
              key={subtask.id}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800 group transition-colors text-xs"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => handleToggle(subtask)}
                  className={`transition-colors shrink-0 cursor-pointer ${
                    isDone ? 'text-emerald-500' : 'text-slate-300 hover:text-indigo-600'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
                <span
                  className={`truncate ${
                    isDone
                      ? 'line-through text-slate-400 dark:text-slate-500'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {subtask.title}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(subtask.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity cursor-pointer"
                title={language === 'zh-CN' ? '删除子任务' : 'Delete subtask'}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Inline add form */}
      {isAdding && (
        <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={language === 'zh-CN' ? '输入子任务标题...' : 'Subtask title...'}
            autoFocus
            className="flex-1 h-7 px-2 text-xs rounded-md border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden"
          />
          <Button size="sm" variant="primary" type="submit" className="h-7 px-2 text-xs cursor-pointer">
            {language === 'zh-CN' ? '添加' : 'Add'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            type="button"
            className="h-7 px-2 text-xs cursor-pointer"
            onClick={() => {
              setIsAdding(false);
              setNewTitle('');
            }}
          >
            {language === 'zh-CN' ? '取消' : 'Cancel'}
          </Button>
        </form>
      )}
    </div>
  );
};
