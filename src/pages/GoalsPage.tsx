import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/storage/db';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { createGoal, updateGoal, setWeeklyFocusGoals } from '@/services/goalCommands';
import { createProject } from '@/services/projectCommands';
import { timeService } from '@/core/time/timeService';
import { CreateGoalModal } from '@/components/goals/CreateGoalModal';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { GoalCard } from '@/components/goals/GoalCard';
import { RoadmapGanttView } from '@/components/roadmap/RoadmapGanttView';
import {
  Target,
  Plus,
  FolderDot,
  LayoutGrid,
  List,
  Pin,
  SlidersHorizontal,
  Milestone,
} from 'lucide-react';
import type { Goal, GoalProgressMode, GoalStatus } from '@/core/types/domain';

export const GoalsPage: React.FC = () => {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const [tab, setTab] = useState<GoalStatus>('active');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'roadmap'>('grid');
  const [showCreateGoalModal, setShowCreateGoalModal] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);

  const { openInspector, addToast } = useUIStore();
  const weekKey = timeService.getWeekKey();

  const allGoals = useLiveQuery(() => db.goals.filter((g) => !g.deletedAt).toArray(), []) || [];
  const allProjects = useLiveQuery(() => db.projects.filter((p) => !p.deletedAt).toArray(), []) || [];
  const allTasks = useLiveQuery(() => db.tasks.filter((t) => !t.deletedAt).toArray(), []) || [];
  const weeklyFocusEntries = useLiveQuery(
    () => db.weeklyFocus.where('weekKey').equals(weekKey).sortBy('rank'),
    [weekKey]
  ) || [];

  const weeklyGoalIds = new Set(weeklyFocusEntries.map((w) => w.goalId));

  // 4 canonical statuses counts for Goals & Projects
  const activeGoalsCount = allGoals.filter((g) => g.status === 'active' || !g.status).length;
  const completedGoalsCount = allGoals.filter((g) => g.status === 'completed').length;
  const pausedGoalsCount = allGoals.filter((g) => g.status === 'paused').length;
  const archivedGoalsCount = allGoals.filter((g) => g.status === 'archived').length;

  const activeProjectsCount = allProjects.filter((p) => p.status === 'active' || p.statusId === 'ws-proj-active' || !p.status).length;
  const completedProjectsCount = allProjects.filter((p) => p.status === 'completed' || p.statusId === 'ws-proj-completed').length;
  const pausedProjectsCount = allProjects.filter((p) => p.status === 'paused' || p.statusId === 'ws-proj-paused' || p.statusId === 'ws-proj-onhold').length;
  const archivedProjectsCount = allProjects.filter((p) => p.status === 'archived').length;

  const filteredGoals = allGoals.filter((g) => {
    if (tab === 'active') return g.status === 'active' || !g.status;
    return g.status === tab;
  });

  const filteredProjects = allProjects.filter((p) => {
    if (tab === 'active') return p.status === 'active' || p.statusId === 'ws-proj-active' || !p.status;
    if (tab === 'completed') return p.status === 'completed' || p.statusId === 'ws-proj-completed';
    if (tab === 'paused') return p.status === 'paused' || p.statusId === 'ws-proj-paused' || p.statusId === 'ws-proj-onhold';
    if (tab === 'archived') return p.status === 'archived';
    return false;
  });

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

  const handleCreateProject = async (params: {
    name: string;
    description?: string;
    color: string;
    primaryGoalId?: string;
    relatedGoalIds?: string[];
    isPinned: boolean;
  }) => {
    const project = await createProject(params);
    setShowCreateProjectModal(false);
    addToast({
      message: language === 'zh-CN' ? `已创建项目 "${project.name}"` : `Project "${project.name}" created`,
      type: 'success',
    });
    navigate(`/projects/${project.id}`);
  };

  const handleToggleWeeklyFocus = async (goal: Goal) => {
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
    <div className="p-6 max-w-5xl mx-auto space-y-8 pb-20">
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
                ? '驱动具体项目推进与每周日常执行的战略目标体系。'
                : 'High-level strategic outcomes driving projects and weekly execution.'}
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
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setTab('active')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                tab === 'active'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              {language === 'zh-CN' ? '进行中' : 'Active'} ({activeGoalsCount}/{activeProjectsCount})
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
              {language === 'zh-CN' ? '已完成' : 'Completed'} ({completedGoalsCount}/{completedProjectsCount})
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
              {language === 'zh-CN' ? '已暂停' : 'Paused'} ({pausedGoalsCount}/{pausedProjectsCount})
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
              {language === 'zh-CN' ? '已归档' : 'Archived'} ({archivedGoalsCount}/{archivedProjectsCount})
            </button>
          </div>

          {/* New Project button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowCreateProjectModal(true)}
            className="h-8 text-xs gap-1.5 cursor-pointer"
          >
            <FolderDot className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{language === 'zh-CN' ? '新建项目' : 'New Project'}</span>
          </Button>

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

      {/* Projects Overview Section */}
      <div className="space-y-3 pt-4 border-t border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
          <div className="flex items-center gap-1.5">
            <FolderDot className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{language === 'zh-CN' ? '项目管理与总览 (Projects)' : 'Projects Overview'}</span>
          </div>
          <span className="text-[11px] font-normal text-slate-400">
            {filteredProjects.length} {language === 'zh-CN' ? '个项目' : 'projects'}
          </span>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            {language === 'zh-CN' ? '当前状态下暂无项目。点击「新建项目」创建执行项目。' : 'No projects with this status. Click "New Project" to create one.'}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View for Projects with balanced height and bottom alignment */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredProjects.map((project) => {
              const primaryGoal = allGoals.find((g) => g.id === project.primaryGoalId);
              const projectTaskCount = allTasks.filter((t) => t.projectId === project.id).length;
              const completedTaskCount = allTasks.filter(
                (t) =>
                  t.projectId === project.id &&
                  (t.statusId === 'ws-task-done' ||
                   t.statusId === 'ws-proj-completed' ||
                   t.statusId?.toLowerCase().includes('done') ||
                   t.statusId?.toLowerCase().includes('completed'))
              ).length;

              return (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-800 transition-all cursor-pointer group flex flex-col justify-between h-full space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-3 h-3 rounded-md shrink-0 shadow-2xs"
                          style={{ backgroundColor: project.color || '#6366f1' }}
                        />
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                          {project.name}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {project.isPinned && (
                          <Pin className="w-3 h-3 text-indigo-500 fill-indigo-500" />
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openInspector({ type: 'project', id: project.id, title: project.name });
                          }}
                          className="p-1 text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors cursor-pointer"
                          title={language === 'zh-CN' ? '编辑项目属性' : 'Edit Project'}
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {project.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-auto pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono text-[11px]">
                      {completedTaskCount}/{projectTaskCount} {language === 'zh-CN' ? '已完成' : 'done'}
                    </span>
                    {primaryGoal && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 truncate max-w-[120px]">
                        <Target className="w-3 h-3 shrink-0" />
                        <span className="truncate">{primaryGoal.title}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View for Projects */
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80 shadow-2xs">
            {filteredProjects.map((project) => {
              const primaryGoal = allGoals.find((g) => g.id === project.primaryGoalId);
              const projectTaskCount = allTasks.filter((t) => t.projectId === project.id).length;
              const completedTaskCount = allTasks.filter(
                (t) =>
                  t.projectId === project.id &&
                  (t.statusId === 'ws-task-done' ||
                   t.statusId === 'ws-proj-completed' ||
                   t.statusId?.toLowerCase().includes('done') ||
                   t.statusId?.toLowerCase().includes('completed'))
              ).length;
              const pct = projectTaskCount > 0 ? Math.round((completedTaskCount / projectTaskCount) * 100) : 0;

              return (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      className="w-3 h-3 rounded-md shrink-0 shadow-2xs"
                      style={{ backgroundColor: project.color || '#6366f1' }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {project.name}
                        </span>
                        {project.isPinned && (
                          <Pin className="w-3 h-3 text-indigo-500 fill-indigo-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        {primaryGoal && <span>目标: {primaryGoal.title}</span>}
                        {project.description && <span>• {project.description}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="w-28 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-400">任务</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {completedTaskCount}/{projectTaskCount} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openInspector({ type: 'project', id: project.id, title: project.name });
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md transition-colors cursor-pointer"
                      title={language === 'zh-CN' ? '属性检视' : 'Inspect'}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Goal Modal */}
      {showCreateGoalModal && (
        <CreateGoalModal
          onClose={() => setShowCreateGoalModal(false)}
          onSave={handleCreateGoal}
        />
      )}

      {/* Create Project Modal */}
      {showCreateProjectModal && (
        <CreateProjectModal
          goals={allGoals}
          onClose={() => setShowCreateProjectModal(false)}
          onSave={handleCreateProject}
        />
      )}
    </div>
  );
};
