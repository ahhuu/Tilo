import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/core/i18n';
import { useUIStore } from '@/stores/uiStore';
import {
  triageInboxItem,
  convertInboxToTodayTask,
  convertInboxToThisWeekTask,
  convertInboxToTask,
  convertInboxToNote,
  markInboxAsIdea,
} from '@/services/inboxCommands';
import { db } from '@/storage/db';
import {
  X,
  Calendar,
  CalendarDays,
  Clock,
  CheckCircle2,
  FileText,
  Lightbulb,
  Archive,
  Trash2,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import type { InboxItem } from '@/core/types/domain';

interface ContinuousProcessingModalProps {
  items: InboxItem[];
  isOpen: boolean;
  onClose: () => void;
}

export const ContinuousProcessingModal: React.FC<ContinuousProcessingModalProps> = ({
  items,
  isOpen,
  onClose,
}) => {
  const { language } = useI18n();
  const { addToast } = useUIStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDetailTaskOpen, setIsDetailTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskScheduledDate, setTaskScheduledDate] = useState('');

  // Reset index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsDetailTaskOpen(false);
    }
  }, [isOpen]);

  const currentItem = items[currentIndex];
  const totalCount = items.length;

  const advanceNext = useCallback(() => {
    setIsDetailTaskOpen(false);
    if (currentIndex >= items.length - 1) {
      // Stay on last or finish
      setCurrentIndex((prev) => prev);
    }
  }, [currentIndex, items.length]);

  const handleAction = useCallback(
    async (
      action:
        | 'today'
        | 'thisWeek'
        | 'someday'
        | 'task'
        | 'note'
        | 'idea'
        | 'archive'
        | 'delete'
    ) => {
      if (!currentItem) return;

      try {
        switch (action) {
          case 'today':
            await convertInboxToTodayTask(currentItem.id);
            addToast({
              message:
                language === 'zh-CN'
                  ? '已转为今日任务并排期'
                  : 'Converted to task for Today',
              type: 'success',
            });
            break;
          case 'thisWeek':
            await convertInboxToThisWeekTask(currentItem.id);
            addToast({
              message:
                language === 'zh-CN'
                  ? '已转为本周任务'
                  : 'Converted to task for This Week',
              type: 'success',
            });
            break;
          case 'someday':
            await triageInboxItem(currentItem.id, 'someday');
            addToast({
              message:
                language === 'zh-CN'
                  ? '已移入 Someday 待办池'
                  : 'Moved to Someday backlog',
              type: 'info',
            });
            break;
          case 'task':
            if (isDetailTaskOpen) {
              await convertInboxToTask(
                currentItem.id,
                taskTitle || currentItem.rawText,
                undefined,
                taskScheduledDate || undefined
              );
              addToast({
                message:
                  language === 'zh-CN'
                    ? `已转为任务: "${taskTitle || currentItem.rawText}"`
                    : `Converted to task: "${taskTitle || currentItem.rawText}"`,
                type: 'success',
              });
            } else {
              setTaskTitle(currentItem.rawText);
              setTaskScheduledDate('');
              setIsDetailTaskOpen(true);
              return; // wait for user confirmation
            }
            break;
          case 'note':
            await convertInboxToNote(
              currentItem.id,
              currentItem.rawText.slice(0, 40),
              currentItem.rawText
            );
            addToast({
              message:
                language === 'zh-CN'
                  ? '已转为工作笔记'
                  : 'Converted to Note',
              type: 'success',
            });
            break;
          case 'idea':
            await markInboxAsIdea(currentItem.id);
            addToast({
              message:
                language === 'zh-CN'
                  ? '已标记为想法并暂存'
                  : 'Marked as Idea and saved',
              type: 'info',
            });
            break;
          case 'archive':
            await triageInboxItem(currentItem.id, 'archived');
            addToast({
              message:
                language === 'zh-CN' ? '条目已归档' : 'Item archived',
              type: 'info',
            });
            break;
          case 'delete':
            await db.inboxItems.update(currentItem.id, { deletedAt: Date.now() });
            addToast({
              message:
                language === 'zh-CN'
                  ? '条目已移入废纸篓'
                  : 'Item moved to Trash',
              type: 'info',
            });
            break;
        }
        advanceNext();
      } catch (err) {
        console.error(err);
      }
    },
    [
      currentItem,
      isDetailTaskOpen,
      taskTitle,
      taskScheduledDate,
      addToast,
      language,
      advanceNext,
    ]
  );

  // Keyboard navigation & quick triage shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        if (e.key === 'Escape') {
          setIsDetailTaskOpen(false);
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === '1') {
        e.preventDefault();
        handleAction('today');
      } else if (e.key === '2') {
        e.preventDefault();
        handleAction('thisWeek');
      } else if (e.key === '3') {
        e.preventDefault();
        handleAction('someday');
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        handleAction('task');
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleAction('note');
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        handleAction('idea');
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleAction('archive');
      } else if (e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        handleAction('delete');
      } else if (e.key === 'j' || e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.min(prev + 1, Math.max(0, items.length - 1)));
      } else if (e.key === 'k' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items.length, handleAction, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{language === 'zh-CN' ? '连续整理模式' : 'Process Inbox Mode'}</span>
              </h3>
              <p className="text-xs text-slate-400">
                {items.length > 0
                  ? language === 'zh-CN'
                    ? `第 ${Math.min(currentIndex + 1, totalCount)} / ${totalCount} 条 • 剩余 ${items.length} 条待整理`
                    : `Item ${Math.min(currentIndex + 1, totalCount)} of ${totalCount} • ${items.length} remaining`
                  : language === 'zh-CN'
                  ? '收件箱已全部清空'
                  : 'Inbox is zero'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {items.length === 0 || !currentItem ? (
            /* Empty State */
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {language === 'zh-CN' ? '收件箱已整理完毕 (Inbox Zero)' : 'Inbox Zero • All items processed'}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {language === 'zh-CN'
                  ? '未整理收件箱中没有更多待处理的想法或条目。'
                  : 'No more unsorted thoughts or capture items in your inbox.'}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
                >
                  {language === 'zh-CN' ? '完成并退出 (Esc)' : 'Finish & Exit (Esc)'}
                </button>
              </div>
            </div>
          ) : (
            /* Current Item Card */
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono">
                    {new Date(currentItem.capturedAt).toLocaleString(
                      language === 'zh-CN' ? 'zh-CN' : 'en-US',
                      {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }
                    )}
                  </span>
                  {currentItem.kind === 'link' && currentItem.url && (
                    <a
                      href={currentItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{currentItem.urlDomain || 'Link'}</span>
                    </a>
                  )}
                </div>

                <p className="text-base font-medium text-slate-900 dark:text-slate-100 leading-relaxed break-words whitespace-pre-wrap select-text">
                  {currentItem.rawText}
                </p>
              </div>

              {/* Task Detail Form (if opened via T) */}
              {isDetailTaskOpen && (
                <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-3 animate-in fade-in duration-100">
                  <div className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                    {language === 'zh-CN' ? '任务转换参数' : 'Task Parameters'}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-slate-500">{language === 'zh-CN' ? '任务标题' : 'Title'}</label>
                      <input
                        type="text"
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-500">{language === 'zh-CN' ? '排期日期' : 'Scheduled Date'}</label>
                      <input
                        type="date"
                        value={taskScheduledDate}
                        onChange={(e) => setTaskScheduledDate(e.target.value)}
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsDetailTaskOpen(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      {language === 'zh-CN' ? '取消' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction('task')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      {language === 'zh-CN' ? '确认创建任务' : 'Confirm Task'}
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Action Matrix (Master Plan Section 6.9) */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {language === 'zh-CN' ? '快速分流操作 (支持键盘单键)' : 'Triage Actions (Single Key Shortcuts)'}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* 1: Today */}
                  <button
                    type="button"
                    onClick={() => handleAction('today')}
                    className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-800 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                        1
                      </span>
                    </div>
                    <div className="mt-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {language === 'zh-CN' ? '今日执行' : 'Today'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {language === 'zh-CN' ? '排入今日任务' : 'Schedule Today'}
                    </div>
                  </button>

                  {/* 2: This Week */}
                  <button
                    type="button"
                    onClick={() => handleAction('thisWeek')}
                    className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-800 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <CalendarDays className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                        2
                      </span>
                    </div>
                    <div className="mt-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {language === 'zh-CN' ? '本周推进' : 'This Week'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {language === 'zh-CN' ? '安排在本周' : 'Schedule Week'}
                    </div>
                  </button>

                  {/* 3: Someday */}
                  <button
                    type="button"
                    onClick={() => handleAction('someday')}
                    className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-800 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                        3
                      </span>
                    </div>
                    <div className="mt-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {language === 'zh-CN' ? '稍后将来' : 'Someday'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {language === 'zh-CN' ? '放入将来清单' : 'Save in Someday'}
                    </div>
                  </button>

                  {/* T: Task */}
                  <button
                    type="button"
                    onClick={() => handleAction('task')}
                    className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-800 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                        T
                      </span>
                    </div>
                    <div className="mt-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {language === 'zh-CN' ? '转为任务' : 'Task'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {language === 'zh-CN' ? '自定义任务参数' : 'Convert to Task'}
                    </div>
                  </button>

                  {/* N: Note */}
                  <button
                    type="button"
                    onClick={() => handleAction('note')}
                    className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-800 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                        N
                      </span>
                    </div>
                    <div className="mt-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {language === 'zh-CN' ? '转为笔记' : 'Note'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {language === 'zh-CN' ? '作为资料保存' : 'Save as Note'}
                    </div>
                  </button>

                  {/* I: Idea */}
                  <button
                    type="button"
                    onClick={() => handleAction('idea')}
                    className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-800 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                        I
                      </span>
                    </div>
                    <div className="mt-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {language === 'zh-CN' ? '标记想法' : 'Idea'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {language === 'zh-CN' ? '设为想法备忘' : 'Mark as Idea'}
                    </div>
                  </button>

                  {/* A: Archive */}
                  <button
                    type="button"
                    onClick={() => handleAction('archive')}
                    className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <Archive className="w-4 h-4 text-slate-500" />
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-slate-200 dark:group-hover:bg-slate-600">
                        A
                      </span>
                    </div>
                    <div className="mt-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {language === 'zh-CN' ? '归档' : 'Archive'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {language === 'zh-CN' ? '保留但无需执行' : 'Keep for reference'}
                    </div>
                  </button>

                  {/* X: Delete */}
                  <button
                    type="button"
                    onClick={() => handleAction('delete')}
                    className="p-3 rounded-xl border border-rose-200/70 dark:border-rose-900/50 hover:border-rose-400 bg-rose-50/30 dark:bg-rose-950/20 hover:bg-rose-50/70 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <Trash2 className="w-4 h-4 text-rose-500" />
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
                        X
                      </span>
                    </div>
                    <div className="mt-2 text-xs font-semibold text-rose-700 dark:text-rose-300">
                      {language === 'zh-CN' ? '移入废纸篓' : 'Delete'}
                    </div>
                    <div className="text-[11px] text-rose-400">
                      {language === 'zh-CN' ? '删除该条目' : 'Move to Trash'}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] sm:pb-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
              className="flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{language === 'zh-CN' ? '上一个 (K)' : 'Prev (K)'}</span>
            </button>
            <button
              type="button"
              disabled={currentIndex >= items.length - 1}
              onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, items.length - 1))}
              className="flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>{language === 'zh-CN' ? '跳过/下一个 (J)' : 'Next (J)'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">
              {language === 'zh-CN' ? '按 Esc 随时退出' : 'Press Esc to exit'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
