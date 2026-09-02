import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/storage/db';
import {
  Plus,
  CheckCircle2,
  Circle,
  Play,
  Trash2,
  Sparkles,
  Calendar,
  ListTodo,
  LayoutGrid,
} from 'lucide-react';
import { useI18n } from '@/core/i18n';
import { useTasks, useDailyFocus } from '@/storage/hooks/useLiveQuery';
import {
  createTask,
  completeTask,
  reopenTask,
  deleteTaskToTrash,
} from '@/services/taskCommands';
import { createPlannedBlock } from '@/services/planCommands';
import { parseQuickCaptureInput } from '@/services/nlpQuickCaptureParser';
import { startSession } from '@/services/sessionCommands';
import { useWidgetStore } from '@/stores/widgetStore';
import { useUIStore } from '@/stores/uiStore';
import { timeService } from '@/core/time/timeService';
import type { PriorityLevel, Task } from '@/core/types/domain';

const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  urgent: 'bg-rose-500',
  high: 'bg-amber-500',
  medium: 'bg-blue-500',
  low: 'bg-slate-400',
  none: 'bg-transparent border border-slate-300 dark:border-slate-600',
};

const STORAGE_KEY_TASKS_TAB_STYLE = 'tilo_widget_tasks_tab_style';

export const TasksGrid: React.FC = () => {
  const { language } = useI18n();
  const isZh = language === 'zh-CN';
  const { settings, updateGridSettings } = useWidgetStore();
  const { addToast, setRunningSession } = useUIStore();
  const gridSetting = settings.gridSettings.tasks;

  // Tab 显示样式：从 gridSetting 或 localStorage 读取，默认仅图标 ('icon')
  const [tabStyle, setTabStyle] = useState<'text' | 'icon' | 'both'>(() => {
    if (gridSetting.tabStyle) return gridSetting.tabStyle;
    const saved = localStorage.getItem(STORAGE_KEY_TASKS_TAB_STYLE);
    if (saved === 'text' || saved === 'icon' || saved === 'both') return saved;
    return 'icon';
  });

  const toggleTabStyle = () => {
    const nextStyle: 'text' | 'icon' | 'both' =
      tabStyle === 'text' ? 'icon' : tabStyle === 'icon' ? 'both' : 'text';
    setTabStyle(nextStyle);
    updateGridSettings('tasks', { tabStyle: nextStyle });
    localStorage.setItem(STORAGE_KEY_TASKS_TAB_STYLE, nextStyle);
    addToast({
      message: isZh
        ? `标签样式已切换为: ${nextStyle === 'text' ? '纯文字' : nextStyle === 'icon' ? '纯图标' : '图文并存'}`
        : `Tab style: ${nextStyle === 'text' ? 'Text Only' : nextStyle === 'icon' ? 'Icon Only' : 'Text & Icon'}`,
      type: 'info',
    });
  };

  const [inputTitle, setInputTitle] = useState('');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const quickInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isQuickAddOpen) {
      // 展开时自动聚焦输入框
      quickInputRef.current?.focus();
    }
  }, [isQuickAddOpen]);

  const projectsData = useLiveQuery(
    () => db.projects.filter((p) => !p.deletedAt).toArray(),
    []
  );
  const projects = useMemo(() => projectsData || [], [projectsData]);

  // 实时自然语言语法解析（支持 30m/1h 工时、!high 优先级、#项目名等）
  const parsed = useMemo(() => {
    if (!inputTitle.trim()) return null;
    return parseQuickCaptureInput(inputTitle, projects);
  }, [inputTitle, projects]);

  const appendHint = (hint: string) => {
    setInputTitle((prev) => `${prev.trim()} ${hint}`.trim() + ' ');
    quickInputRef.current?.focus();
  };

  const [activeFilter, setActiveFilter] = useState<'focus' | 'today' | 'all' | 'done'>(
    gridSetting.defaultFilter
  );
  const [selectedPriority, setSelectedPriority] = useState<PriorityLevel | 'all'>('all');

  const logicalDate = timeService.getLogicalDate();
  const allTasks = useTasks();
  const dailyFocusEntries = useDailyFocus(logicalDate);

  const focusTaskIds = useMemo(
    () => new Set(dailyFocusEntries?.map((f) => f.taskId) || []),
    [dailyFocusEntries]
  );

  const handleFilterChange = (filter: 'focus' | 'today' | 'all' | 'done') => {
    setActiveFilter(filter);
    if (filter !== 'done') {
      updateGridSettings('tasks', { defaultFilter: filter });
    }
  };

  const filteredTasks = useMemo(() => {
    if (!allTasks) return [];

    const list = allTasks.filter((task) => {
      if (task.deletedAt) return false;

      const isCompleted = task.statusId === 'ws-task-done';

      if (activeFilter === 'done') {
        return isCompleted;
      }

      if (isCompleted && !gridSetting.showCompleted) {
        return false;
      }

      if (selectedPriority !== 'all' && task.priority !== selectedPriority) {
        return false;
      }

      if (activeFilter === 'focus') {
        return focusTaskIds.has(task.id);
      }

      if (activeFilter === 'today') {
        return (
          task.scheduledDate === logicalDate ||
          focusTaskIds.has(task.id)
        );
      }

      return true;
    });

    if (gridSetting.sortBy === 'priority') {
      const weight: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1, none: 0 };
      return [...list].sort((a, b) => (weight[b.priority || 'none'] || 0) - (weight[a.priority || 'none'] || 0));
    }

    return list;
  }, [allTasks, activeFilter, focusTaskIds, gridSetting.showCompleted, gridSetting.sortBy, logicalDate, selectedPriority]);

  const todayCount = useMemo(() => {
    return (allTasks || []).filter(
      (t) =>
        !t.deletedAt &&
        t.statusId !== 'ws-task-done' &&
        (t.scheduledDate === logicalDate || focusTaskIds.has(t.id))
    ).length;
  }, [allTasks, logicalDate, focusTaskIds]);

  const focusCount = focusTaskIds.size;

  const doneCount = useMemo(() => {
    return (allTasks || []).filter((t) => !t.deletedAt && t.statusId === 'ws-task-done').length;
  }, [allTasks]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTitle.trim()) return;

    const p = parsed || parseQuickCaptureInput(inputTitle, projects);
    const finalTitle = p.title.trim() || inputTitle.trim();
    if (!finalTitle) return;

    const targetDate = p.scheduledDate || logicalDate;

    try {
      const task = await createTask({
        title: finalTitle,
        projectId: p.projectId,
        priority: p.priority !== 'medium' ? p.priority : (selectedPriority !== 'all' ? selectedPriority : 'none'),
        estimateMinutes: p.estimateMinutes,
        dueDate: targetDate,
        scheduledDate: targetDate, // 用户指定则优先指定日期，否则默认今日
      });

      // 若同时解析出了具体时刻（如 14:00），在该日时间线上自动生成时间块
      if (p.scheduledTime) {
        try {
          const [h, m] = p.scheduledTime.split(':').map(Number);
          const dayStart = timeService.getStartOfLogicalDay(targetDate);
          const startAt = dayStart + (h * 60 + m) * 60 * 1000;
          const durationMs = (p.estimateMinutes || 30) * 60 * 1000;

          await createPlannedBlock({
            taskId: task.id,
            projectId: p.projectId,
            type: 'task',
            title: task.title,
            startAt,
            endAt: startAt + durationMs,
          });
        } catch {
          // ignore planned block error
        }
      }

      setInputTitle('');
      quickInputRef.current?.focus();
      addToast({
        message: isZh ? `已创建待办: 「${task.title}」` : `Task created: "${task.title}"`,
        type: 'success',
      });
    } catch {
      addToast({ message: isZh ? '创建任务失败' : 'Failed to create task', type: 'error' });
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      if (task.statusId === 'ws-task-done') {
        await reopenTask(task.id);
        addToast({ message: isZh ? '任务已重新开启' : 'Task reopened', type: 'info' });
      } else {
        await completeTask(task.id);
        addToast({ message: isZh ? '任务已完成 ✨' : 'Task completed ✨', type: 'success' });
      }
    } catch {
      addToast({ message: isZh ? '更新任务状态失败' : 'Failed to update task', type: 'error' });
    }
  };

  const handleStartSessionForTask = async (task: Task) => {
    try {
      const session = await startSession({
        taskId: task.id,
        kind: 'active',
        source: 'timer',
        title: task.title,
      });

      setRunningSession({
        sessionId: session.id,
        taskId: task.id,
        title: task.title,
        startedAt: session.startedAt,
        elapsedSeconds: 0,
        isPaused: false,
        targetDurationMinutes: task.estimateMinutes && task.estimateMinutes > 0 ? task.estimateMinutes : 25,
        displayMode: 'countdown',
      });

      addToast({ message: isZh ? `开始专注: ${task.title}` : `Focus started: ${task.title}`, type: 'success' });
    } catch {
      addToast({ message: isZh ? '启动专注失败' : 'Failed to start session', type: 'error' });
    }
  };

  const handleClearCompleted = async () => {
    const completedTasks = (allTasks || []).filter(
      (t) => !t.deletedAt && t.statusId === 'ws-task-done'
    );
    if (completedTasks.length === 0) return;

    for (const t of completedTasks) {
      await deleteTaskToTrash(t.id);
    }
    addToast({
      message: isZh ? `已清理 ${completedTasks.length} 项已完成任务` : `Cleared ${completedTasks.length} completed tasks`,
      type: 'info',
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent overflow-hidden select-none">
      {/* 头部标题栏 */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-200/40 dark:border-slate-800/40 bg-slate-50/40 dark:bg-slate-800/20">
        <div className="flex items-center gap-1.5 min-w-0 shrink-0">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
            {isZh ? '待办清单' : 'Tasks'}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
            {filteredTasks.length}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* 任务速记快速展开按钮 (位于切换标签样式按钮左侧) */}
          <button
            type="button"
            onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
            className={`p-1 rounded-md transition-all cursor-pointer ${
              isQuickAddOpen
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-semibold ring-1 ring-emerald-500/40'
                : 'text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200/40 dark:hover:bg-slate-800/60'
            }`}
            title={isZh ? (isQuickAddOpen ? '收起速记输入框 (Esc)' : '快速添加今日待办') : (isQuickAddOpen ? 'Close Quick Add (Esc)' : 'Quick Add Task')}
          >
            <Plus className={`w-3.5 h-3.5 transition-transform duration-200 ${isQuickAddOpen ? 'rotate-45 text-slate-500' : ''}`} />
          </button>

          {/* 纯小图标切换按钮（精致小巧，悬停 Tooltip 提示） */}
          <button
            type="button"
            onClick={toggleTabStyle}
            className="p-1 rounded-md text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200/40 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            title={isZh ? `切换标签样式 (当前: ${tabStyle === 'text' ? '纯文字' : tabStyle === 'icon' ? '纯图标' : '图文'})` : `Toggle tab style (Current: ${tabStyle === 'text' ? 'Text' : tabStyle === 'icon' ? 'Icon' : 'Both'})`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>

          {/* 优先级色点 */}
          <div className="flex items-center gap-1.5 border-l border-slate-200/60 dark:border-slate-700/60 pl-1.5">
            <button
              type="button"
              onClick={() => setSelectedPriority('all')}
              className={`w-2.5 h-2.5 rounded-full border transition-all ${
                selectedPriority === 'all'
                  ? 'bg-slate-700 dark:bg-slate-200 ring-2 ring-slate-400/40 scale-110'
                  : 'bg-slate-300 dark:bg-slate-600'
              }`}
              title={isZh ? '全部优先级' : 'All Priorities'}
            />
            <button
              type="button"
              onClick={() => setSelectedPriority('urgent')}
              className={`w-2.5 h-2.5 rounded-full bg-rose-500 transition-all ${
                selectedPriority === 'urgent' ? 'ring-2 ring-rose-400/60 scale-125' : 'opacity-70'
              }`}
              title={isZh ? '紧急 (Urgent)' : 'Urgent'}
            />
            <button
              type="button"
              onClick={() => setSelectedPriority('high')}
              className={`w-2.5 h-2.5 rounded-full bg-amber-500 transition-all ${
                selectedPriority === 'high' ? 'ring-2 ring-amber-400/60 scale-125' : 'opacity-70'
              }`}
              title={isZh ? '高优先 (High)' : 'High Priority'}
            />
            <button
              type="button"
              onClick={() => setSelectedPriority('medium')}
              className={`w-2.5 h-2.5 rounded-full bg-blue-500 transition-all ${
                selectedPriority === 'medium' ? 'ring-2 ring-blue-400/60 scale-125' : 'opacity-70'
              }`}
              title={isZh ? '中优先 (Medium)' : 'Medium Priority'}
            />
          </div>
        </div>
      </div>

      {/* 筛选标签：支持单行横排、纯文字/纯图标无折行切换 */}
      <div className="flex items-center gap-1 px-3 pt-2 pb-1 text-xs shrink-0 overflow-x-auto no-scrollbar">
        {[
          { id: 'focus' as const, labelZh: '聚焦', labelEn: 'Focus', count: focusCount, icon: Sparkles },
          { id: 'today' as const, labelZh: '今日', labelEn: 'Today', count: todayCount, icon: Calendar },
          { id: 'done' as const, labelZh: '已完成', labelEn: 'Done', count: doneCount, icon: CheckCircle2 },
          { id: 'all' as const, labelZh: '全部', labelEn: 'All', count: (allTasks || []).filter(t => !t.deletedAt && (gridSetting.showCompleted || t.statusId !== 'ws-task-done')).length, icon: ListTodo },
        ].map((item) => {
          const Icon = item.icon;
          const label = isZh ? item.labelZh : item.labelEn;
          const isActive = activeFilter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleFilterChange(item.id)}
              title={`${label} (${item.labelEn})`}
              className={`px-2 py-1 rounded-lg font-medium flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 shadow-2xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/40 dark:hover:bg-slate-800/40'
              }`}
            >
              {tabStyle !== 'text' && <Icon className="w-3.5 h-3.5 shrink-0" />}
              {tabStyle !== 'icon' && <span>{label}</span>}
              {typeof item.count === 'number' && (
                <span className="opacity-70 text-[10px] ml-0.5 font-mono">{item.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 快速新增任务输入条（自然语法速记，时间固定为今日） */}
      {isQuickAddOpen && (
        <div className="px-3 py-2 shrink-0 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200/60 dark:border-slate-800/60 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <form onSubmit={handleAddTask} className="relative flex items-center">
            <input
              ref={quickInputRef}
              type="text"
              value={inputTitle}
              onChange={(e) => setInputTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsQuickAddOpen(false);
                }
              }}
              placeholder={
                isZh
                  ? '输入今日待办，如「写报告 45m !high #项目」...'
                  : 'Add today task, e.g. "Write report 45m !high #project"...'
              }
              className="w-full text-xs pl-2.5 pr-8 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/50 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-xs"
            />
            <button
              type="submit"
              disabled={!inputTitle.trim()}
              className="absolute right-1.5 p-1 rounded-md text-slate-400 hover:text-emerald-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors cursor-pointer"
              title={isZh ? '保存待办 (Enter)' : 'Save task (Enter)'}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* 实时解析预览 Chips (输入了语法标记时动态呈现) */}
          {parsed && (parsed.projectName || parsed.estimateMinutes || parsed.priority !== 'medium' || parsed.scheduledTime || parsed.scheduledDate) && (
            <div className="flex flex-wrap items-center gap-1 text-[10px] pt-0.5 animate-in fade-in duration-150">
              <span className="text-slate-400 font-medium">{isZh ? '识别为:' : 'Parsed:'}</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-100/70 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-semibold text-[9px]">
                📅 {parsed.scheduledDate ? (parsed.scheduledDate === logicalDate ? (isZh ? '今日' : 'Today') : parsed.scheduledDate) : (isZh ? '今日 (默认)' : 'Today')}
              </span>
              {parsed.scheduledTime && (
                <span className="px-1.5 py-0.5 rounded bg-sky-100/70 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 font-medium text-[9px]">
                  ⏰ {parsed.scheduledTime}
                </span>
              )}
              {parsed.estimateMinutes && (
                <span className="px-1.5 py-0.5 rounded bg-purple-100/70 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-medium text-[9px]">
                  ⏱️ {parsed.estimateMinutes}m
                </span>
              )}
              {parsed.priority !== 'medium' && (
                <span
                  className={`px-1.5 py-0.5 rounded font-semibold text-[9px] ${
                    parsed.priority === 'urgent'
                      ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                      : parsed.priority === 'high'
                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  ⚡ {parsed.priority.toUpperCase()}
                </span>
              )}
              {parsed.projectName && (
                <span className="px-1.5 py-0.5 rounded bg-indigo-100/70 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-medium text-[9px]">
                  📁 {parsed.projectName}
                </span>
              )}
            </div>
          )}

          {/* 自然语法提示微型标签行 (始终展示，点击可连续追加多个语法标签) */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 pt-0.5 select-none">
            <button
              type="button"
              onClick={() => appendHint('明天')}
              className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-850 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer font-mono text-[9px]"
              title={isZh ? '追加指定明天日期' : 'Append tomorrow'}
            >
              📅 明天
            </button>
            <button
              type="button"
              onClick={() => appendHint('30m')}
              className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-850 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer font-mono text-[9px]"
              title={isZh ? '追加 30 分钟预估工时' : 'Append 30m estimate'}
            >
              ⏱️ 30m
            </button>
            <button
              type="button"
              onClick={() => appendHint('!high')}
              className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-850 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer font-mono text-[9px]"
              title={isZh ? '追加高优先级' : 'Append !high priority'}
            >
              ⚡ !high
            </button>
            <button
              type="button"
              onClick={() => appendHint('!urgent')}
              className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-850 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer font-mono text-[9px]"
              title={isZh ? '追加紧急优先级' : 'Append !urgent priority'}
            >
              🚨 !urgent
            </button>
            <button
              type="button"
              onClick={() => appendHint('#项目')}
              className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-850 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer font-mono text-[9px]"
              title={isZh ? '追加归属项目' : 'Append #project'}
            >
              🎯 #项目
            </button>
          </div>
        </div>
      )}

      {/* 任务列表 */}
      <div className="flex-1 overflow-y-auto px-3 py-1.5 space-y-1.5 min-h-0">
        {filteredTasks.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-6 h-6 mb-1.5 opacity-40 text-slate-300 dark:text-slate-600" />
            <span>{isZh ? '无待处理任务' : 'No tasks to do'}</span>
            <span className="text-[10px] text-slate-400 mt-0.5">{isZh ? '今天真高效！' : 'Super productive today!'}</span>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.statusId === 'ws-task-done';
            const isFocus = focusTaskIds.has(task.id);

            return (
              <div
                key={task.id}
                className={`group flex items-center justify-between p-2 rounded-xl border transition-all ${
                  isDone
                    ? 'bg-slate-50/50 dark:bg-slate-850/40 border-slate-200/40 dark:border-slate-800/40 opacity-70'
                    : 'bg-white/80 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 border-slate-200/60 dark:border-slate-800/80 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(task)}
                    className="shrink-0 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Circle className="w-4 h-4 hover:border-emerald-500" />
                    )}
                  </button>

                  {gridSetting.showPriorityDots && task.priority && task.priority !== 'none' && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_COLORS[task.priority]}`}
                    />
                  )}

                  <span
                    className={`text-xs truncate ${
                      isDone
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-800 dark:text-slate-100 font-medium'
                    }`}
                  >
                    {task.title}
                  </span>

                  {isFocus && !isDone && (
                    <span className="shrink-0 text-[10px] px-1.5 py-0.2 rounded bg-amber-100/70 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 font-medium">
                      {isZh ? '聚焦' : 'Focus'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {!isDone && (
                    <button
                      type="button"
                      onClick={() => handleStartSessionForTask(task)}
                      className="p-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                      title={isZh ? '立即为该任务开始专注计时' : 'Start focus timer'}
                    >
                      <Play className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 底部清理操作栏 */}
      {doneCount > 0 && (
        <div className="flex items-center justify-between px-3.5 py-2 border-t border-slate-200/50 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/30 text-[10px] text-slate-500">
          <span>{isZh ? `已完成 ${doneCount} 项` : `${doneCount} completed`}</span>
          <button
            type="button"
            onClick={handleClearCompleted}
            className="flex items-center gap-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>{isZh ? '清除已完成' : 'Clear completed'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
