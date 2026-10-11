import React from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/core/i18n';
import { X, AlertCircle } from 'lucide-react';
import type { Task } from '@/core/types/domain';

interface FocusFullModalProps {
  currentFocusTasks: Task[];
  newTaskToPromote: Task;
  onReplace: (taskToReplaceId: string) => Promise<void>;
  onClose: () => void;
}

export const FocusFullModal: React.FC<FocusFullModalProps> = ({
  currentFocusTasks,
  newTaskToPromote,
  onReplace,
  onClose,
}) => {
  const { language } = useI18n();

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl p-5 pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] sm:pb-5 space-y-4 animate-in slide-in-from-bottom-6 sm:zoom-in-98 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {language === 'zh-CN' ? '已达到今日聚焦上限 (3项)' : 'Daily Focus Limit Reached'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'zh-CN' ? '请选择一项已有的今日聚焦任务进行替换。' : 'Select an existing focus item to replace.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/60">
          <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
            {language === 'zh-CN' ? '待置入聚焦的任务' : 'Incoming Task'}
          </span>
          <p className="text-xs font-medium text-slate-900 dark:text-slate-100 mt-0.5 truncate">
            {newTaskToPromote.title}
          </p>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {language === 'zh-CN' ? '选择要替换移出的任务:' : 'Choose Task to Demote:'}
          </span>
          <div className="space-y-1.5">
            {currentFocusTasks.map((task, index) => (
              <button
                key={task.id}
                type="button"
                onClick={async () => {
                  await onReplace(task.id);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-white dark:hover:bg-slate-800 text-left transition-all text-xs group cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    #{index + 1}
                  </span>
                  <span className="truncate text-slate-800 dark:text-slate-200 font-medium">
                    {task.title}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 font-medium shrink-0">
                  {language === 'zh-CN' ? '替换并移出 →' : 'Replace →'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end pt-2">
          <Button size="sm" variant="ghost" onClick={onClose} className="cursor-pointer">
            {language === 'zh-CN' ? '取消' : 'Cancel'}
          </Button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
