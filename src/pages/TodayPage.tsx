import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { db } from '@/storage/db';
import {
  useTasks,
  useProjects,
  useGoals,
  useWeeklyFocus,
  useDailyFocus,
  usePlannedBlocks,
  useSessions,
} from '@/storage/hooks/useLiveQuery';
import { completeTask, reopenTask, createTask, rescheduleTask } from '@/services/taskCommands';
import { setDailyFocusTasks, createPlannedBlock } from '@/services/planCommands';
import { startSession } from '@/services/sessionCommands';
import { timeService } from '@/core/time/timeService';
import { computeNextUpCandidates } from '@/core/timeline/nextUpAlgorithm';
import { WeeklyFocusSection } from '@/components/today/WeeklyFocusSection';
import { DailyFocusSection } from '@/components/today/DailyFocusSection';
import { NextUpSection } from '@/components/today/NextUpSection';
import { TodayTimeline } from '@/components/today/TodayTimeline';
import { FocusFullModal } from '@/components/today/FocusFullModal';
import { TodayLayoutCustomizer } from '@/components/today/TodayLayoutCustomizer';
import {
  DEFAULT_TODAY_LAYOUT_CONFIG,
  type TodayLayoutConfig,
} from '@/components/today/todayLayoutTypes';
import {
  CheckCircle2,
  Plus,
  Target,
  SlidersHorizontal,
  GripVertical,
  ListTodo,
  Calendar,
} from 'lucide-react';
import type { Task, Goal } from '@/core/types/domain';
import { confirmDialog } from '@/services/dialogService';

const STORAGE_KEY_TODAY_LAYOUT = 'tilo_today_layout';

export const TodayPage: React.FC = () => {
  const { t, language } = useI18n();
  const [activeTab, setActiveTab] = useState<'split' | 'list' | 'timeline'>('split');
  const [taskToPromote, setTaskToPromote] = useState<Task | null>(null);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showFocusPicker, setShowFocusPicker] = useState(false);

  // Load persisted layout configuration
  const [layoutConfig, setLayoutConfig] = useState<TodayLayoutConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TODAY_LAYOUT);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_TODAY_LAYOUT_CONFIG;
  });

  const handleUpdateLayoutConfig = (newConfig: TodayLayoutConfig) => {
    setLayoutConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY_TODAY_LAYOUT, JSON.stringify(newConfig));
    } catch {
      // ignore
    }
  };

  const handleResetLayout = () => {
    setLayoutConfig(DEFAULT_TODAY_LAYOUT_CONFIG);
    try {
      localStorage.removeItem(STORAGE_KEY_TODAY_LAYOUT);
    } catch {
      // ignore
    }
    addToast({
      message: language === 'zh-CN' ? '已重置「今日」布局为默认' : 'Today layout reset to default',
      type: 'info',
    });
  };

  const { openInspector, setRunningSession, addToast } = useUIStore();

  // 未排期任务「排期」：在手机端用按钮替代失效的 HTML5 拖拽（触屏不派发 drag 事件）
  const handleScheduleTask = async (task: Task) => {
    try {
      const targetDate = task.scheduledDate || logicalDate;
      const isTargetToday = targetDate === logicalDate;
      const startAt = isTargetToday
        ? Date.now()
        : new Date(`${targetDate}T09:00:00`).getTime();
      const endAt = startAt + (task.estimateMinutes || 60) * 60000;
      await createPlannedBlock({
        taskId: task.id,
        projectId: task.projectId,
        type: 'task',
        title: task.title,
        startAt,
        endAt,
      });
      if (!task.scheduledDate) {
        await rescheduleTask(task.id, targetDate);
      }
      addToast({
        message: language === 'zh-CN' ? '已为任务添加具体时间段并排入时间轴' : 'Scheduled time slot on timeline',
        type: 'success',
      });
    } catch {
      addToast({
        message: language === 'zh-CN' ? '排期失败' : 'Scheduling failed',
        type: 'error',
      });
    }
  };

  const logicalDate = timeService.getLogicalDate();
  const weekKey = timeService.getWeekKey();
  const startOfDayMs = timeService.getStartOfLogicalDay(logicalDate);
  const endOfDayMs = timeService.getEndOfLogicalDay(logicalDate);

  const allTasks = useTasks();
  const projects = useProjects();
  const goals = useGoals();
  const weeklyFocus = useWeeklyFocus(weekKey);
  const dailyFocusEntries = useDailyFocus(logicalDate);
  const plannedBlocks = usePlannedBlocks(startOfDayMs, endOfDayMs);
  const sessions = useSessions(startOfDayMs, endOfDayMs);

  const projectMap = new Map(projects?.map((p) => [p.id, p]));
  const taskMap = new Map(allTasks?.map((t) => [t.id, t]));

  // Active weekly focus goals for the week (exclude archived, completed, and deleted)
  const activeWeeklyGoals: Goal[] = (goals || []).filter(
    (g) =>
      !g.deletedAt &&
      g.status !== 'archived' &&
      g.status !== 'completed' &&
      (g.isWeeklyFocus || weeklyFocus?.some((wf) => wf.goalId === g.id))
  );

  // Root tasks scheduled for today
  const todayTasks =
    allTasks?.filter(
      (t) => !t.parentTaskId && (t.scheduledDate === logicalDate || !t.scheduledDate)
    ) || [];

  // Unscheduled tasks
  const unscheduledTasks =
    allTasks?.filter(
      (t) => !t.parentTaskId && !t.scheduledDate && t.statusId !== 'ws-task-done' && !t.deletedAt
    ) || [];

  // Ranked Daily Focus Tasks
  const focusTasks: Task[] = (dailyFocusEntries || [])
    .map((df) => taskMap.get(df.taskId))
    .filter((t): t is Task => !!t && !t.deletedAt);

  const focusTaskIds = new Set(focusTasks.map((t) => t.id));

  // Next Up algorithm candidates
  const nextUpCandidates = computeNextUpCandidates(
    allTasks || [],
    focusTaskIds,
    projectMap,
    logicalDate,
    plannedBlocks || [],
    4
  );

  const completedTasksCount = todayTasks.filter((t) => t.statusId === 'ws-task-done').length;

  // Context Line calculations
  const plannedMinutesTotal = Math.round(
    (plannedBlocks || []).reduce((acc, b) => acc + (b.endAt - b.startAt) / 60000, 0)
  );
  const actualMinutesTotal = Math.round(
    (sessions || []).reduce(
      (acc, s) =>
        acc +
        (s.activeDurationSeconds ||
          s.elapsedDurationSeconds ||
          (s.endedAt ? (s.endedAt - s.startedAt) / 1000 : 0)) /
          60,
      0
    )
  );

  const formatHoursMinutes = (totalMinutes: number) => {
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
  };

  const handleToggleComplete = async (task: Task) => {
    const currentTask = await db.tasks.get(task.id);
    const statusToCheck = currentTask?.statusId || task.statusId;
    const isDone =
      statusToCheck === 'ws-task-done' ||
      statusToCheck === 'done' ||
      statusToCheck?.toLowerCase().includes('done') ||
      statusToCheck?.toLowerCase().includes('completed');

    if (isDone) {
      await reopenTask(task.id);
      addToast({
        message: language === 'zh-CN' ? `已恢复为未完成: "${task.title}"` : `Task reopened: "${task.title}"`,
        type: 'info',
      });
    } else {
      await completeTask(task.id);
      addToast({
        message: language === 'zh-CN' ? `任务已完成: "${task.title}"` : `Task completed: "${task.title}"`,
        type: 'success',
      });
    }
  };

  const handleCreateTask = async () => {
    const title = await confirmDialog({
      title: language === 'zh-CN' ? '新建今日任务' : 'New task for Today',
      input: {
        label: language === 'zh-CN' ? '任务标题' : 'Task title',
        placeholder: language === 'zh-CN' ? '例如：完成周报初稿' : 'e.g. Draft the weekly report',
      },
      confirmLabel: language === 'zh-CN' ? '创建' : 'Create',
    });
    if (typeof title !== 'string' || !title.trim()) return;

    await createTask({
      title: title.trim(),
      scheduledDate: logicalDate,
    });
    addToast({ message: language === 'zh-CN' ? '已添加任务至今日' : 'Task added to Today', type: 'success' });
  };

  const handleCreateUnscheduledTask = async () => {
    const title = await confirmDialog({
      title: language === 'zh-CN' ? '新建未排期任务' : 'New unscheduled task',
      input: {
        label: language === 'zh-CN' ? '任务标题' : 'Task title',
        placeholder: language === 'zh-CN' ? '例如：整理项目资料' : 'e.g. Sort out project files',
      },
      confirmLabel: language === 'zh-CN' ? '创建' : 'Create',
    });
    if (typeof title !== 'string' || !title.trim()) return;

    await createTask({
      title: title.trim(),
      scheduledDate: undefined,
    });
    addToast({ message: language === 'zh-CN' ? '已添加未排期任务' : 'Unscheduled task added', type: 'success' });
  };

  const handleStartSession = async (task: Task) => {
    const session = await startSession({
      taskId: task.id,
      projectId: task.projectId,
      title: task.title,
    });

    setRunningSession({
      sessionId: session.id,
      taskId: task.id,
      title: task.title,
      startedAt: session.startedAt,
      elapsedSeconds: 0,
      isPaused: false,
      targetDurationMinutes: task.estimateMinutes,
      displayMode: task.estimateMinutes ? 'countdown' : 'stopwatch',
    });

    addToast({
      message: language === 'zh-CN' ? `已开启专注会话: "${task.title}"` : `Started session: "${task.title}"`,
      type: 'info',
    });
  };

  const handleReorderFocus = async (newTaskIds: string[]) => {
    await setDailyFocusTasks(logicalDate, newTaskIds);
  };

  const handleAddToFocus = async (task: Task) => {
    const limit = layoutConfig.focusCountLimit || 3;
    if (focusTasks.length >= limit) {
      setTaskToPromote(task);
      return;
    }

    const nextIds = [...focusTasks.map((t) => t.id), task.id];
    await setDailyFocusTasks(logicalDate, nextIds);
    addToast({
      message:
        language === 'zh-CN'
          ? `已将 "${task.title}" 添加至今日聚焦 (#${nextIds.length})`
          : `Added "${task.title}" to Daily Focus (#${nextIds.length})`,
      type: 'success',
    });
  };

  const handleRemoveFromFocus = async (task: Task) => {
    const nextIds = focusTasks.filter((t) => t.id !== task.id).map((t) => t.id);
    await setDailyFocusTasks(logicalDate, nextIds);
    addToast({
      message: language === 'zh-CN' ? `已从今日聚焦移除 "${task.title}"` : `Removed "${task.title}" from Daily Focus`,
      type: 'info',
    });
  };

  const handleReplaceFocus = async (taskToReplaceId: string) => {
    if (!taskToPromote) return;
    const nextIds = focusTasks.map((t) => (t.id === taskToReplaceId ? taskToPromote.id : t.id));
    await setDailyFocusTasks(logicalDate, nextIds);
    addToast({
      message: language === 'zh-CN' ? `已替换聚焦任务为 "${taskToPromote.title}"` : `Replaced focus with "${taskToPromote.title}"`,
      type: 'success',
    });
    setTaskToPromote(null);
  };

  const handleTaskDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('application/json-task-id', taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  // Determine split column grid span classes based on config
  const leftColSpanClass =
    activeTab === 'timeline'
      ? 'hidden'
      : activeTab === 'list'
        ? 'col-span-12 space-y-6'
        : layoutConfig.splitRatio === '60/40'
          ? 'lg:col-span-7 space-y-6'
          : layoutConfig.splitRatio === '40/60'
            ? 'lg:col-span-5 space-y-6'
            : 'lg:col-span-6 space-y-6';

  const rightColSpanClass =
    activeTab === 'list' || !layoutConfig.showTimeline
      ? 'hidden'
      : activeTab === 'timeline'
        ? 'col-span-12'
        : layoutConfig.splitRatio === '60/40'
          ? 'lg:col-span-5'
          : layoutConfig.splitRatio === '40/60'
            ? 'lg:col-span-7'
            : 'lg:col-span-6';

  const weekLabel = timeService.getWeekLabel(logicalDate, language);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 relative">
      {/* Header & Date summary with Navigator */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {t('today.title')}
            </h2>
          </div>

          {/* Context Line matching today.png */}
          {layoutConfig.showContextLine && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'zh-CN' ? (
                <>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {timeService.formatDateHeader(logicalDate, 'zh-CN')}
                  </span>
                  <span className="mx-1.5">•</span>
                  <span>已完成 {completedTasksCount}/{todayTasks.length} 项</span>
                  <span className="mx-1.5">•</span>
                  <span>计划 {formatHoursMinutes(plannedMinutesTotal)} / 容量 8h 00m</span>
                  <span className="mx-1.5">•</span>
                  <span>实际专注 {formatHoursMinutes(actualMinutesTotal)}</span>
                </>
              ) : (
                <>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {timeService.formatDateHeader(logicalDate, 'en-US')}
                  </span>
                  <span className="mx-1.5">•</span>
                  <span>{completedTasksCount}/{todayTasks.length} completed</span>
                  <span className="mx-1.5">•</span>
                  <span>Planned {formatHoursMinutes(plannedMinutesTotal)} / 8h 00m</span>
                  <span className="mx-1.5">•</span>
                  <span>Actual {formatHoursMinutes(actualMinutesTotal)}</span>
                </>
              )}
            </p>
          )}
        </div>

        {/* View switcher & Customizer Trigger */}
        <div className="flex items-center gap-2.5">
          {/* View Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
            {(
              [
                { id: 'split', label: t('today.split') },
                { id: 'list', label: t('today.list') },
                { id: 'timeline', label: t('today.timeline') },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Customize Layout Trigger */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowCustomizer((prev) => !prev)}
            className="h-8 px-2.5 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 gap-1.5 cursor-pointer"
            title={language === 'zh-CN' ? '自定义今日布局' : 'Customize Today Layout'}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{language === 'zh-CN' ? '自定义' : 'Customize'}</span>
          </Button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Tasks, Next Up, Focus, Priorities, Unscheduled */}
        <div className={`${leftColSpanClass} space-y-6`}>
          {/* Weekly Focus Multi-Card Section matching today.png */}
          {layoutConfig.showWeeklyFocus && (
            <WeeklyFocusSection
              goals={activeWeeklyGoals}
              projectMap={projectMap}
              weekLabel={weekLabel}
              onInspectGoal={(g) => openInspector({ type: 'goal', id: g.id, title: g.title })}
            />
          )}

          {/* Daily Focus 1–N Section with Drag Reorder matching today.png */}
          {layoutConfig.showFocusTasks && (
            <DailyFocusSection
              focusTasks={focusTasks}
              projectMap={projectMap}
              plannedBlocks={plannedBlocks || []}
              limit={layoutConfig.focusCountLimit || 3}
              onReorder={handleReorderFocus}
              onInspect={(t) => openInspector({ type: 'task', id: t.id, title: t.title })}
              onToggleComplete={handleToggleComplete}
              onStartSession={handleStartSession}
              onRemoveFromFocus={handleRemoveFromFocus}
              onAddFocus={() => setShowFocusPicker(true)}
            />
          )}

          {/* Algorithmic Next Up Recommendations matching today.png */}
          {layoutConfig.showNextUp && (
            <NextUpSection
              candidates={nextUpCandidates}
              onStartSession={handleStartSession}
              onInspect={(t) => openInspector({ type: 'task', id: t.id, title: t.title })}
              onToggleComplete={handleToggleComplete}
              onAddTask={handleCreateTask}
            />
          )}

          {/* Optional Unscheduled Tasks Section */}
          {layoutConfig.showUnscheduled && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
                <div className="flex items-center gap-1.5">
                  <ListTodo className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{language === 'zh-CN' ? '未排期任务' : 'UNSCHEDULED'}</span>
                  <span className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 font-bold flex items-center justify-center">
                    {unscheduledTasks.length}
                  </span>
                </div>
                <span className="text-[11px] font-normal text-slate-400 lowercase">
                  {language === 'zh-CN' ? '点按排期或拖入时间轴' : 'schedule or drag to timeline'}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden shadow-xs">
                {unscheduledTasks.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    {language === 'zh-CN' ? '暂无未排期任务。' : 'No unscheduled tasks.'}
                  </div>
                ) : (
                  unscheduledTasks.map((task) => {
                    const project = task.projectId ? projectMap.get(task.projectId) : undefined;
                    return (
                      <div
                        key={task.id}
                        draggable={true}
                        onDragStart={(e) => handleTaskDragStart(e, task.id)}
                        onClick={() => openInspector({ type: 'task', id: task.id, title: task.title })}
                        className="flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-grab active:cursor-grabbing group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <GripVertical className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleComplete(task);
                            }}
                            className="text-slate-300 hover:text-indigo-600 transition-colors shrink-0"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <span className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 transition-colors">
                            {task.title}
                          </span>
                          {project && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: project.color || '#6366f1' }}
                              />
                              <span>{project.name}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* 排期：触屏下替代拖拽的可靠入口 */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleScheduleTask(task);
                            }}
                            className="text-slate-400 hover:text-indigo-600 transition-colors shrink-0 p-1"
                            title={language === 'zh-CN' ? '排期到时间轴' : 'Schedule on timeline'}
                            aria-label={language === 'zh-CN' ? '排期到时间轴' : 'Schedule on timeline'}
                          >
                            <Calendar className="w-4 h-4" />
                          </button>

                          {task.priority && task.priority !== 'none' && (
                            <Badge variant={task.priority} className="text-[10px] px-1.5 py-0.5">
                              {language === 'zh-CN'
                                ? task.priority === 'urgent'
                                  ? '紧急'
                                  : task.priority === 'high'
                                    ? '高'
                                    : task.priority === 'medium'
                                      ? '中'
                                      : '低'
                                : task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </Badge>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToFocus(task);
                            }}
                            className="text-[11px] text-indigo-600 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Add to Daily Focus"
                          >
                            +Focus
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}

                <button
                  type="button"
                  onClick={handleCreateUnscheduledTask}
                  className="w-full flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'zh-CN' ? '添加未排期任务' : 'Add unscheduled task'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Plan vs Actual Timeline */}
        <div className={`${rightColSpanClass} sticky top-4`}>
          <TodayTimeline
            logicalDate={logicalDate}
            tasks={[...todayTasks, ...unscheduledTasks]}
            projects={projects}
            onInspectTask={(t) => openInspector({ type: 'task', id: t.id, title: t.title })}
          />
        </div>
      </div>

      {/* Focus Picker Modal (for + Add Focus button) */}
      {showFocusPicker && (
        <Modal
          onClose={() => setShowFocusPicker(false)}
          ariaLabel={language === 'zh-CN' ? '选择任务加入今日聚焦' : 'Select Task for Daily Focus'}
          maxWidthClass="sm:max-w-md"
          scrollable={false}
          bodyClassName="p-5"
          header={
            <div className="w-full -mx-5 -mb-3 px-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {language === 'zh-CN' ? '选择任务加入今日聚焦' : 'Select Task for Daily Focus'}
                  </h3>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowFocusPicker(false)}
                  aria-label={language === 'zh-CN' ? '关闭' : 'Close'}
                >
                  ✕
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {allTasks
              ?.filter((t) => !t.deletedAt && !t.parentTaskId && t.statusId !== 'ws-task-done' && !focusTaskIds.has(t.id))
              .map((task) => (
                <div
                  key={task.id}
                  onClick={() => {
                    handleAddToFocus(task);
                    setShowFocusPicker(false);
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all cursor-pointer flex items-center justify-between text-xs"
                >
                  <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                    {task.title}
                  </span>
                  <Badge variant={task.priority || 'none'} size="sm">
                    {task.priority || 'none'}
                  </Badge>
                </div>
              ))}
          </div>
        </Modal>
      )}

      {/* Focus Full Replace Flow Modal */}
      {taskToPromote && (
        <FocusFullModal
          currentFocusTasks={focusTasks}
          newTaskToPromote={taskToPromote}
          onReplace={handleReplaceFocus}
          onClose={() => setTaskToPromote(null)}
        />
      )}

      {/* Today Layout Customizer Modal */}
      <TodayLayoutCustomizer
        isOpen={showCustomizer}
        onClose={() => setShowCustomizer(false)}
        config={layoutConfig}
        onChange={handleUpdateLayoutConfig}
        onReset={handleResetLayout}
      />
    </div>
  );
};
