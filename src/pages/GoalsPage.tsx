import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/storage/db';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { createGoal, updateGoal, setWeeklyFocusGoals } from '@/services/goalCommands';
import { timeService } from '@/core/time/timeService';
import { CreateGoalModal } from '@/components/goals/CreateGoalModal';
import { GoalCard } from '@/components/goals/GoalCard';
import { RoadmapGanttView } from '@/components/roadmap/RoadmapGanttView';
import {
  Target,
  Plus,
  LayoutGrid,
  List,
  Milestone,
} from 'lucide-react';
import type { Goal, GoalProgressMode, GoalStatus } from '@/core/types/domain';

/** 加载期稳定空数组：`|| []` 每次渲染新建数组会让 useMemo 依赖恒变 */
const EMPTY_ARRAY: never[] = [];

export const GoalsPage: React.FC = () => {
  const { t, language } = useI18n();
  const [tab, setTab] = useState<GoalStatus>('active');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'roadmap'>('grid');
  const [showCreateGoalModal, setShowCreateGoalModal] = useState(false);

  const { openInspector, addToast } = useUIStore();
  const weekKey = timeService.getWeekKey();

  const allGoalsRaw = useLiveQuery<Goal[]>(() => db.goals.filter((g) => !g.deletedAt).toArray(), []);
  const allGoals: Goal[] = useMemo(() => allGoalsRaw || [], [allGoalsRaw]);
  const allProjects = useLiveQuery(() => db.projects.filter((p) => !p.deletedAt).toArray(), []) || [];
  const weeklyFocusEntries =
    useLiveQuery(
      () => db.weeklyFocus.where('weekKey').equals(weekKey).sortBy('rank'),
      [weekKey]
    ) ?? EMPTY_ARRAY;

  // 每周聚焦的 id 集合。原实现在 filter 里做 allGoals.find（O(n²)），
  // 且每次渲染都重建；改为先建 id→goal 映射再判断，并按依赖 memo。
  const weeklyGoalIds = useMemo(() => {
    const goalMap = new Map(allGoals.map((g) => [g.id, g]));
    const ids = new Set<string>();
    for (const entry of weeklyFocusEntries) {
      const goal = goalMap.get(entry.goalId);
      if (goal && goal.status !== 'completed' && goal.status !== 'archived' && !goal.deletedAt) {
        ids.add(entry.goalId);
      }
    }
    return ids;
  }, [weeklyFocusEntries, allGoals]);

  // Self-healing sweep: ensure completed or archived goals never stay in weekly focus
  useEffect(() => {
    const sweepWeeklyFocus = async () => {
      const staleGoals = await db.goals
        .filter((g) => (g.status === 'completed' || g.status === 'archived') && Boolean(g.isWeeklyFocus))
        .toArray();
      if (staleGoals.length > 0) {
        for (const sg of staleGoals) {
          await db.goals.update(sg.id, { isWeeklyFocus: false });
          await db.weeklyFocus.where('goalId').equals(sg.id).delete();
        }
      }
    };
    sweepWeeklyFocus();
  }, [allGoals]);

  // 4 个状态计数原本是 4 次独立 filter（每次渲染各扫一遍），合并为单趟统计并按依赖 memo
  const goalsByStatus = useMemo(() => {
    const counts = { active: 0, completed: 0, paused: 0, archived: 0 };
    for (const goal of allGoals) {
      if (goal.status === 'completed') counts.completed++;
      else if (goal.status === 'paused') counts.paused++;
      else if (goal.status === 'archived') counts.archived++;
      else counts.active++; // 'active' 或未设置状态
    }
    return counts;
  }, [allGoals]);

  const activeGoalsCount = goalsByStatus.active;
  const completedGoalsCount = goalsByStatus.completed;
  const pausedGoalsCount = goalsByStatus.paused;
  const archivedGoalsCount = goalsByStatus.archived;

  const filteredGoals = useMemo(
    () =>
      allGoals.filter((g) => {
        if (tab === 'active') return g.status === 'active' || !g.status;
        return g.status === tab;
      }),
    [allGoals, tab]
  );

  const handleCreateGoal = async (params: {
    title: string;
    description?: string;
    color: string;
    progressMode: GoalProgressMode;
    targetProgress?: number;
    targetDate?: string;
    isWeeklyFocus: boolean;
  }) => {
    const goal = await createGoal(params);
    if (params.isWeeklyFocus) {
      const currentIds = weeklyFocusEntries.map((wf) => wf.goalId);
      await setWeeklyFocusGoals(weekKey, [...currentIds, goal.id]);
    }
    setShowCreateGoalModal(false);
    addToast({
      message: language === 'zh-CN' ? `已创建战略目标 "${goal.title}"` : `Goal "${goal.title}" created`,
      type: 'success',
    });
  };

  const handleToggleWeeklyFocus = async (goal: Goal) => {
    if ((goal.status === 'completed' || goal.status === 'archived') && !goal.isWeeklyFocus) {
      addToast({
        message:
          language === 'zh-CN'
            ? '已达成或已归档的目标无法设为本周核心焦点'
            : 'Completed or archived goals cannot be set to Weekly Focus',
        type: 'warning',
      });
      return;
    }

    const nextVal = !goal.isWeeklyFocus;
    await updateGoal(goal.id, { isWeeklyFocus: nextVal });

    const currentIds = weeklyFocusEntries.map((wf) => wf.goalId);
    let nextIds: string[];
    if (nextVal) {
      nextIds = currentIds.includes(goal.id) ? currentIds : [...currentIds, goal.id];
    } else {
      nextIds = currentIds.filter((id) => id !== goal.id);
    }
    await setWeeklyFocusGoals(weekKey, nextIds);

    addToast({
      message: nextVal
        ? (language === 'zh-CN' ? `已将 "${goal.title}" 设为本周核心重点` : `Added "${goal.title}" to Weekly Focus`)
        : (language === 'zh-CN' ? `已取消本周核心重点` : `Removed from Weekly Focus`),
      type: 'info',
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center">
            <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {t('goals.title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'zh-CN'
                ? '界定并追踪驱动每周执行的核心战略成果。'
                : 'Define and track the core strategic outcomes that drive your weekly execution.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Mode Switcher: Grid | List | Roadmap */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
              title={language === 'zh-CN' ? '网格视图' : 'Grid View'}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
              title={language === 'zh-CN' ? '列表视图' : 'List View'}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('roadmap')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'roadmap'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
              title={language === 'zh-CN' ? '甘特路线图' : 'Roadmap Gantt'}
            >
              <Milestone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 4 Canonical Status Tabs: 进行中 | 已完成 | 已暂停 | 已归档 */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 text-xs font-medium max-w-full overflow-x-auto scrollbar-none [&>button]:shrink-0 [&>button]:whitespace-nowrap">
            <button
              type="button"
              onClick={() => setTab('active')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                tab === 'active'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              {language === 'zh-CN' ? '进行中' : 'Active'} ({activeGoalsCount})
            </button>
            <button
              type="button"
              onClick={() => setTab('completed')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                tab === 'completed'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              {language === 'zh-CN' ? '已完成' : 'Completed'} ({completedGoalsCount})
            </button>
            <button
              type="button"
              onClick={() => setTab('paused')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                tab === 'paused'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              {language === 'zh-CN' ? '已暂停' : 'Paused'} ({pausedGoalsCount})
            </button>
            <button
              type="button"
              onClick={() => setTab('archived')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                tab === 'archived'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              {language === 'zh-CN' ? '已归档' : 'Archived'} ({archivedGoalsCount})
            </button>
          </div>

          {/* New Goal button */}
          <Button
            size="sm"
            variant="primary"
            onClick={() => setShowCreateGoalModal(true)}
            className="h-8 text-xs gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('goals.newGoal')}</span>
          </Button>
        </div>
      </div>

      {/* Strategic Goals Section / Roadmap */}
      {viewMode === 'roadmap' ? (
        <RoadmapGanttView />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
            <span>{language === 'zh-CN' ? '战略目标 (Goals)' : 'Strategic Goals'}</span>
            <span className="text-[11px] font-normal text-slate-400">
              {filteredGoals.length} {language === 'zh-CN' ? '个目标' : 'goals'}
            </span>
          </div>

          {filteredGoals.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
              <Target className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                {language === 'zh-CN' ? '当前状态下暂无目标' : 'No goals with this status'}
              </p>
              <p>
                {language === 'zh-CN' ? '点击右上角「新建目标」定义您的核心战略成果。' : 'Define your high-level outcomes to start tracking execution.'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
          /* Grid View for Goals */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGoals.map((goal) => {
              const linkedProjects = allProjects.filter(
                (p) =>
                  p.primaryGoalId === goal.id ||
                  (p.relatedGoalIds && p.relatedGoalIds.includes(goal.id))
              );

              return (
                <div
                  key={goal.id}
                  onClick={() => openInspector({ type: 'goal', id: goal.id, title: goal.title })}
                  className="cursor-pointer"
                >
                  <GoalCard
                    goal={goal}
                    linkedProjects={linkedProjects}
                    onToggleWeeklyFocus={handleToggleWeeklyFocus}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          /* List View for Goals */
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80 shadow-2xs">
            {filteredGoals.map((goal) => {
              const linkedProjects = allProjects.filter(
                (p) =>
                  p.primaryGoalId === goal.id ||
                  (p.relatedGoalIds && p.relatedGoalIds.includes(goal.id))
              );
              const isWeekly = weeklyGoalIds.has(goal.id);

              return (
                <div
                  key={goal.id}
                  onClick={() => openInspector({ type: 'goal', id: goal.id, title: goal.title })}
                  className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: goal.color || '#6366f1' }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {goal.title}
                        </span>
                        {isWeekly && (
                          <Badge variant="indigo" size="sm">
                            {language === 'zh-CN' ? '本周聚焦' : 'Weekly Focus'}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{goal.progressMode}</span>
                        {goal.targetDate && <span>• 截止: {goal.targetDate}</span>}
                        {linkedProjects.length > 0 && (
                          <span>• 关联 {linkedProjects.length} 个项目</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="w-28 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-400">进度</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {Math.round(goal.currentProgress)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all"
                          style={{ width: `${Math.min(100, goal.currentProgress)}%` }}
                        />
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleWeeklyFocus(goal);
                      }}
                    >
                      {isWeekly ? (language === 'zh-CN' ? '取消聚焦' : 'Unfocus') : (language === 'zh-CN' ? '设为聚焦' : 'Focus')}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* Create Goal Modal */}
      {showCreateGoalModal && (
        <CreateGoalModal
          onClose={() => setShowCreateGoalModal(false)}
          onSave={handleCreateGoal}
        />
      )}
    </div>
  );
};

export default GoalsPage;
