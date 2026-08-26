import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/storage/db';
import { updateProject } from '@/services/projectCommands';
import { createTask, completeTask, reopenTask } from '@/services/taskCommands';
import {
  ensureWorkflowsInitialized,
  DEFAULT_TASK_WORKFLOW_ID,
} from '@/services/workflowCommands';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { MilestoneList } from '@/components/projects/MilestoneList';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  instantiateTaskFromTemplate,
  type TaskTemplatePayload,
} from '@/services/templateCommands';
import {
  FolderDot,
  Pin,
  Target,
  Plus,
  CheckCircle2,
  Clock,
  ChevronRight,
  ArrowLeft,
  SlidersHorizontal,
  FileText,
  ChevronDown,
} from 'lucide-react';
import type { Task, ProjectStatus } from '@/core/types/domain';

export const ProjectPage: React.FC = () => {
  const { language } = useI18n();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { openInspector, addToast } = useUIStore();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('all');

  useEffect(() => {
    ensureWorkflowsInitialized();
  }, []);

  const project = useLiveQuery(() => (id ? db.projects.get(id) : undefined), [id]);
  const primaryGoal = useLiveQuery(
    () => (project?.primaryGoalId ? db.goals.get(project.primaryGoalId) : undefined),
    [project?.primaryGoalId]
  );
  const tasks =
    useLiveQuery(
      () => (id ? db.tasks.where('projectId').equals(id).filter((t) => !t.deletedAt).toArray() : []),
      [id]
    ) || [];

  const projStatuses = useLiveQuery(
    () => db.workflowStatuses.where('workflowId').equals('wf-proj-default').sortBy('order'),
    []
  ) || [];

  const taskTemplates = useLiveQuery(
    () => db.templates.filter((t) => t.kind === 'task').toArray(),
    []
  ) || [];

  const taskStatuses = useLiveQuery(
    () => db.workflowStatuses.where('workflowId').equals(DEFAULT_TASK_WORKFLOW_ID).sortBy('order'),
    []
  ) || [];

  const taskStatusMap = new Map(taskStatuses.map((s) => [s.id, s]));

  if (!project) {
    return (
      <div className="p-12 text-center text-xs text-slate-400 space-y-2">
        <p>{language === 'zh-CN' ? '未找到项目。' : 'Project not found.'}</p>
        <Button size="sm" variant="ghost" onClick={() => navigate('/goals')}>
          {language === 'zh-CN' ? '返回目标与项目' : 'Back to Goals'}
        </Button>
      </div>
    );
  }

  const openTasks = tasks.filter((t) => {
    const st = taskStatusMap.get(t.statusId);
    const isDone =
      st ? st.semantic === 'completed' || st.semantic === 'cancelled' :
      (t.statusId === 'ws-task-done' ||
       t.statusId === 'ws-proj-completed' ||
       t.statusId?.toLowerCase().includes('done') ||
       t.statusId?.toLowerCase().includes('completed'));
    return !isDone;
  });

  const filteredTasks = tasks.filter((t) => {
    if (activeStatusFilter === 'all') return true;
    if (activeStatusFilter === 'open') {
      const st = taskStatusMap.get(t.statusId);
      const isDone =
        st ? st.semantic === 'completed' || st.semantic === 'cancelled' :
        (t.statusId === 'ws-task-done' ||
         t.statusId === 'ws-proj-completed' ||
         t.statusId?.toLowerCase().includes('done') ||
         t.statusId?.toLowerCase().includes('completed'));
      return !isDone;
    }
    return t.statusId === activeStatusFilter;
  });

  const handleTogglePin = async () => {
    const nextVal = !project.isPinned;
    await updateProject(project.id, { isPinned: nextVal });
    addToast({
      message: nextVal
        ? (language === 'zh-CN' ? '项目已固定至侧边栏' : 'Project pinned to sidebar')
        : (language === 'zh-CN' ? '已取消固定' : 'Project unpinned'),
      type: 'info',
    });
  };

  const handleSetProjectWorkflowStatus = async (statusId: string) => {
    const st = projStatuses.find((s) => s.id === statusId);
    const domainStatus: ProjectStatus =
      st?.semantic === 'completed'
        ? 'completed'
        : st?.semantic === 'cancelled'
        ? 'archived'
        : st?.semantic === 'waiting'
        ? 'paused'
        : 'active';
    await updateProject(project.id, {
      statusId,
      status: domainStatus,
    });
    const label = st?.name || statusId;
    addToast({
      message: language === 'zh-CN' ? `项目阶段已更新为: ${label}` : `Project stage: ${label}`,
      type: 'info',
    });
  };

  const handleSetProjectDomainStatus = async (newStatus: ProjectStatus) => {
    const statusIdMap: Record<ProjectStatus, string> = {
      active: 'ws-proj-active',
      completed: 'ws-proj-completed',
      paused: 'ws-proj-paused',
      archived: 'ws-proj-cancelled',
    };
    await updateProject(project.id, {
      status: newStatus,
      statusId: statusIdMap[newStatus] || 'ws-proj-active',
    });
    const statusLabels: Record<ProjectStatus, string> = {
      active: language === 'zh-CN' ? '进行中' : 'Active',
      completed: language === 'zh-CN' ? '已完成' : 'Completed',
      paused: language === 'zh-CN' ? '已暂停' : 'Paused',
      archived: language === 'zh-CN' ? '已归档' : 'Archived',
    };
    addToast({
      message: language === 'zh-CN' ? `项目状态已更新为: ${statusLabels[newStatus]}` : `Project status: ${statusLabels[newStatus]}`,
      type: 'info',
    });
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    await createTask({
      title: newTaskTitle.trim(),
      projectId: project.id,
    });
    setNewTaskTitle('');
    setIsAddingTask(false);
    addToast({
      message: language === 'zh-CN' ? '已添加任务至项目' : 'Task added to project',
      type: 'success',
    });
  };

  const handleToggleTask = async (task: Task) => {
    const st = taskStatusMap.get(task.statusId);
    const isDone =
      st ? st.semantic === 'completed' :
      (task.statusId === 'ws-task-done' ||
       task.statusId === 'ws-proj-completed' ||
       task.statusId?.toLowerCase().includes('done') ||
       task.statusId?.toLowerCase().includes('completed'));

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

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 pb-20">
      {/* Back button & Navigation */}
      <button
        type="button"
        onClick={() => navigate('/goals')}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{language === 'zh-CN' ? '返回战略目标与项目总览' : 'Back to Goals & Overview'}</span>
      </button>

      {/* Project Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-3 flex-wrap">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shadow-xs"
              style={{ backgroundColor: `${project.color}20` }}
            >
              <FolderDot className="w-4 h-4" style={{ color: project.color }} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {project.name}
            </h1>

            {/* Project Workflow / Domain Status Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  (project.status === 'active' || !project.status)
                    ? 'bg-indigo-500'
                    : project.status === 'completed'
                    ? 'bg-emerald-500'
                    : project.status === 'paused'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
              />
              {projStatuses.length > 0 ? (
                <select
                  value={project.statusId || ''}
                  onChange={(e) => handleSetProjectWorkflowStatus(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  {projStatuses.map((st) => (
                    <option key={st.id} value={st.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                      {st.name}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={project.status || 'active'}
                  onChange={(e) => handleSetProjectDomainStatus(e.target.value as ProjectStatus)}
                  className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="active" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {language === 'zh-CN' ? '进行中' : 'Active'}
                  </option>
                  <option value="completed" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {language === 'zh-CN' ? '已完成' : 'Completed'}
                  </option>
                  <option value="paused" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {language === 'zh-CN' ? '已暂停' : 'Paused'}
                  </option>
                  <option value="archived" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {language === 'zh-CN' ? '已归档' : 'Archived'}
                  </option>
                </select>
              )}
            </div>
          </div>

          {project.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {project.description}
            </p>
          )}

          {/* Primary Goal Link */}
          {primaryGoal && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {language === 'zh-CN' ? '核心目标:' : 'Primary Goal:'}
              </span>
              <button
                type="button"
                onClick={() => navigate('/goals')}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                <Target className="w-3 h-3" />
                <span>{primaryGoal.title}</span>
              </button>
            </div>
          )}
        </div>

        {/* Actions (4 Status Switcher, Edit, Pin) */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 4 Canonical Status Buttons: 进行中 | 已完成 | 已暂停 | 已归档 */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 text-xs font-medium">
            {(['active', 'completed', 'paused', 'archived'] as const).map((st) => {
              const isCurrent = (project.status === st) || (st === 'active' && !project.status);
              const label =
                st === 'active'
                  ? (language === 'zh-CN' ? '进行中' : 'Active')
                  : st === 'completed'
                  ? (language === 'zh-CN' ? '已完成' : 'Completed')
                  : st === 'paused'
                  ? (language === 'zh-CN' ? '已暂停' : 'Paused')
                  : (language === 'zh-CN' ? '已归档' : 'Archived');

              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleSetProjectDomainStatus(st)}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    isCurrent
                      ? st === 'active'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                        : st === 'completed'
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs font-semibold'
                        : st === 'paused'
                        ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-2xs font-semibold'
                        : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => openInspector({ type: 'project', id: project.id, title: project.name })}
            className="h-8 text-xs gap-1.5 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{language === 'zh-CN' ? '编辑项目' : 'Edit Project'}</span>
          </Button>

          <Button
            size="sm"
            variant={project.isPinned ? 'secondary' : 'outline'}
            onClick={handleTogglePin}
            className="h-8 text-xs gap-1.5 cursor-pointer"
          >
            <Pin className="w-3.5 h-3.5" />
            <span>{project.isPinned ? (language === 'zh-CN' ? '已固定' : 'Pinned') : (language === 'zh-CN' ? '固定到侧边' : 'Pin')}</span>
          </Button>
        </div>
      </div>

      {/* Main Grid: Milestones on top / left, Tasks on bottom / right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Milestones */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shadow-2xs">
            <MilestoneList projectId={project.id} />
          </div>
        </div>

        {/* Right Column: Tasks */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              {language === 'zh-CN' ? `项目任务清单 (剩余 ${openTasks.length} 项待办)` : `Project Tasks (${openTasks.length} open)`}
            </h2>

            <div className="flex items-center gap-2">
              {/* Task Status Filters */}
              <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setActiveStatusFilter('all')}
                  className={`px-2 py-0.5 rounded-md cursor-pointer ${
                    activeStatusFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  {language === 'zh-CN' ? '全部' : 'All'} ({tasks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStatusFilter('open')}
                  className={`px-2 py-0.5 rounded-md cursor-pointer ${
                    activeStatusFilter === 'open'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  {language === 'zh-CN' ? '待办' : 'Open'} ({openTasks.length})
                </button>
              </div>

              {/* Task Templates Dropdown */}
              {taskTemplates.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                    className="h-7 px-2 text-xs flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{language === 'zh-CN' ? '应用模板' : 'Templates'}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {showTemplateMenu && (
                    <div className="absolute right-0 mt-1 w-64 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 space-y-1 animate-in fade-in zoom-in-95">
                      <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        {language === 'zh-CN' ? '标准任务模板' : 'Standard Task Templates'}
                      </div>
                      {taskTemplates.map((t) => {
                        const payload = t.payloadJson as TaskTemplatePayload;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={async () => {
                              await instantiateTaskFromTemplate(t, { projectId: project.id });
                              setShowTemplateMenu(false);
                              addToast({
                                message: language === 'zh-CN' ? `已基于模板创建任务: ${t.name}` : `Task created from ${t.name}`,
                                type: 'success',
                              });
                            }}
                            className="w-full text-left p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-xs text-slate-800 dark:text-slate-200 flex flex-col gap-0.5 cursor-pointer transition-colors"
                          >
                            <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                              <span>{t.name}</span>
                              {payload?.estimateMinutes && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {payload.estimateMinutes}m
                                </span>
                              )}
                            </span>
                            {payload?.description && (
                              <span className="text-[11px] text-slate-400 line-clamp-1">
                                {payload.description}
                              </span>
                            )}
                            {payload?.subtaskTitles && payload.subtaskTitles.length > 0 && (
                              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                                包含 {payload.subtaskTitles.length} 个子任务
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {!isAddingTask && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setIsAddingTask(true)}
                  className="h-7 text-xs gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'zh-CN' ? '添加任务' : 'Add Task'}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Inline Add Task Form */}
          {isAddingTask && (
            <form onSubmit={handleCreateTask} className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/60 rounded-xl space-y-2 animate-in fade-in duration-200">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder={language === 'zh-CN' ? '输入任务标题并回车...' : 'Task title...'}
                className="w-full h-8 px-3 text-xs bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setIsAddingTask(false);
                    setNewTaskTitle('');
                  }}
                  className="h-7 text-xs cursor-pointer"
                >
                  {language === 'zh-CN' ? '取消' : 'Cancel'}
                </Button>
                <Button size="sm" variant="primary" type="submit" className="h-7 text-xs cursor-pointer">
                  {language === 'zh-CN' ? '保存任务' : 'Save Task'}
                </Button>
              </div>
            </form>
          )}

          {/* Task List */}
          <div className="space-y-2">
            {filteredTasks.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                {language === 'zh-CN' ? '暂无匹配的任务。' : 'No matching tasks.'}
              </div>
            ) : (
              filteredTasks.map((task) => {
                const st = taskStatusMap.get(task.statusId);
                const isDone =
                  st ? st.semantic === 'completed' :
                  (task.statusId === 'ws-task-done' ||
                   task.statusId === 'ws-proj-completed' ||
                   task.statusId?.toLowerCase().includes('done') ||
                   task.statusId?.toLowerCase().includes('completed'));

                return (
                  <div
                    key={task.id}
                    onClick={() =>
                      openInspector({
                        type: 'task',
                        id: task.id,
                        title: task.title,
                      })
                    }
                    className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTask(task);
                        }}
                        className={`transition-colors shrink-0 cursor-pointer ${
                          isDone
                            ? 'text-emerald-500'
                            : 'text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>

                      <div className="min-w-0">
                        <p
                          className={`text-xs font-semibold truncate transition-colors ${
                            isDone
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                          }`}
                        >
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {st && (
                            <span
                              className="text-[10px] px-1.5 py-0.2 rounded font-medium"
                              style={{
                                backgroundColor: `${st.colorToken || '#6366f1'}15`,
                                color: st.colorToken || '#6366f1',
                              }}
                            >
                              {st.name}
                            </span>
                          )}
                          {task.estimateMinutes && (
                            <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
                              <Clock className="w-3 h-3" />
                              {task.estimateMinutes}m
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={task.priority} size="sm">
                        {task.priority}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
