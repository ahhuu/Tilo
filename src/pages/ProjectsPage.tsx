import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { db } from '@/storage/db';
import { useI18n } from '@/core/i18n';
import { useUIStore } from '@/stores/uiStore';
import { createProject } from '@/services/projectCommands';
import { Button } from '@/components/ui/Button';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import {
  FolderKanban,
  Plus,
  LayoutGrid,
  List,
  Pin,
  SlidersHorizontal,
  Target,
} from 'lucide-react';
import type { Project, ProjectStatus } from '@/core/types/domain';

export const ProjectsPage: React.FC = () => {
  const { language } = useI18n();
  const isZh = language === 'zh-CN';
  const navigate = useNavigate();
  const { addToast, openInspector } = useUIStore();

  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [tab, setTab] = useState<ProjectStatus>('active');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const projects = useLiveQuery(() => db.projects.toArray(), []) ?? [];
  const tasks = useLiveQuery(() => db.tasks.toArray(), []) ?? [];
  const goals = useLiveQuery(() => db.goals.filter((g) => !g.deletedAt).toArray(), []) ?? [];

  const statsByProject = useMemo(() => {
    const m = new Map<string, { total: number; done: number }>();
    tasks
      .filter((t) => !t.deletedAt)
      .forEach((t) => {
        if (!t.projectId) return;
        const cur = m.get(t.projectId) || { total: 0, done: 0 };
        cur.total += 1;
        if (t.statusId === 'ws-task-done') cur.done += 1;
        m.set(t.projectId, cur);
      });
    return m;
  }, [tasks]);

  // All non-deleted projects
  const allProjects = useMemo(() => projects.filter((p) => !p.deletedAt), [projects]);

  // 4 canonical status counts (mirroring the Goals page)
  const activeCount = allProjects.filter((p) => !p.status || p.status === 'active').length;
  const completedCount = allProjects.filter((p) => p.status === 'completed').length;
  const pausedCount = allProjects.filter((p) => p.status === 'paused').length;
  const archivedCount = allProjects.filter((p) => p.status === 'archived').length;

  const filteredProjects = useMemo(
    () =>
      allProjects
        .filter((p) =>
          tab === 'active' ? !p.status || p.status === 'active' : p.status === tab
        )
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name)),
    [allProjects, tab]
  );

  // Resolve the primary (or first related) goal for the "linked goal" badge
  const goalOf = (p: Project) => {
    if (p.primaryGoalId) {
      const g = goals.find((x) => x.id === p.primaryGoalId);
      if (g) return g;
    }
    if (p.relatedGoalIds && p.relatedGoalIds.length > 0) {
      const g = goals.find((x) => x.id === p.relatedGoalIds![0]);
      if (g) return g;
    }
    return undefined;
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
      message: isZh ? `已创建项目 "${project.name}"` : `Project "${project.name}" created`,
      type: 'success',
    });
    navigate(`/projects/${project.id}`);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center">
            <FolderKanban className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {isZh ? '项目' : 'Projects'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isZh ? `共 ${filteredProjects.length} 个项目` : `${filteredProjects.length} projects`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Mode Switcher: Grid | List */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
              title={isZh ? '网格视图' : 'Grid View'}
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
              title={isZh ? '列表视图' : 'List View'}
            >
              <List className="w-3.5 h-3.5" />
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
              {isZh ? '进行中' : 'Active'} ({activeCount})
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
              {isZh ? '已完成' : 'Completed'} ({completedCount})
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
              {isZh ? '已暂停' : 'Paused'} ({pausedCount})
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
              {isZh ? '已归档' : 'Archived'} ({archivedCount})
            </button>
          </div>

          {/* New Project button */}
          <Button
            size="sm"
            variant="primary"
            onClick={() => setShowCreateProjectModal(true)}
            className="h-8 text-xs gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isZh ? '新建项目' : 'New Project'}</span>
          </Button>
        </div>
      </div>

      {/* Projects grid / list */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-10 text-center">
          <p className="text-sm text-slate-400">
            {isZh ? '当前状态下暂无项目。点击右上角「新建项目」创建执行项目。' : 'No projects with this status. Click "New Project" to create one.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredProjects.map((p: Project) => {
            const stat = statsByProject.get(p.id) || { total: 0, done: 0 };
            const goal = goalOf(p);
            return (
              <div
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-800 transition-all cursor-pointer group flex flex-col justify-between h-full space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-md shrink-0 shadow-2xs"
                        style={{ backgroundColor: p.color || '#6366f1' }}
                      />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                        {p.name}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {p.isPinned && <Pin className="w-3 h-3 text-indigo-500 fill-indigo-500" />}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openInspector({ type: 'project', id: p.id, title: p.name });
                        }}
                        className="p-1 text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors cursor-pointer"
                        title={isZh ? '编辑项目属性' : 'Edit Project'}
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {p.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  )}
                </div>

                <div className="mt-auto pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono text-[11px]">
                    {stat.done}/{stat.total} {isZh ? '已完成' : 'done'}
                  </span>
                  {goal && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 truncate max-w-[120px]">
                      <Target className="w-3 h-3 shrink-0" />
                      <span className="truncate">{goal.title}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80 shadow-2xs">
          {filteredProjects.map((p: Project) => {
            const stat = statsByProject.get(p.id) || { total: 0, done: 0 };
            const progress = stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0;
            const goal = goalOf(p);
            return (
              <div
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer text-xs"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: p.color || '#6366f1' }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{p.name}</span>
                      {p.isPinned && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 shrink-0">
                          {isZh ? '固定' : 'PIN'}
                        </span>
                      )}
                    </div>
                    {p.description && (
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">{p.description}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="w-28 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">{stat.done}/{stat.total}</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  {goal && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 truncate max-w-[120px]">
                      <Target className="w-3 h-3 shrink-0" />
                      <span className="truncate">{goal.title}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreateProjectModal && (
        <CreateProjectModal
          goals={goals}
          onClose={() => setShowCreateProjectModal(false)}
          onSave={handleCreateProject}
        />
      )}
    </div>
  );
};

export default ProjectsPage;
