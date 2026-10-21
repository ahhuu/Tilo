import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/storage/db';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { completeTask, reopenTask } from '@/services/taskCommands';
import { timeService } from '@/core/time/timeService';
import { ListTodo, Check, Flag, CalendarClock, FolderDot } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task, Project } from '@/core/types/domain';

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 };
const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#ef4444',
  high: '#f97316',
  medium: '#6366f1',
  low: '#94a3b8',
  none: '#94a3b8',
};

type FilterKey = 'committed_open' | 'all' | 'committed' | 'someday' | 'completed' | 'overdue';
type SortKey = 'due' | 'priority' | 'scheduled' | 'project' | 'title';
type GroupKey = 'none' | 'project';

export const TasksPage: React.FC = () => {
  const { language } = useI18n();
  const isZh = language === 'zh-CN';
  const { openInspector, addToast } = useUIStore();

  const [filter, setFilter] = useState<FilterKey>('committed_open');
  const [sort, setSort] = useState<SortKey>('priority');
  const [group, setGroup] = useState<GroupKey>('project');

  const tasks = useLiveQuery(() => db.tasks.toArray(), []) ?? [];
  const projects = useLiveQuery(() => db.projects.toArray(), []) ?? [];

  const projectMap = useMemo(() => {
    const m = new Map<string, Project>();
    projects.forEach((p) => m.set(p.id, p));
    return m;
  }, [projects]);

  const todayStr = timeService.getLogicalDate();

  const isCommitted = (t: Task) => t.planningBucket !== 'someday';
  const isDone = (t: Task) => t.statusId === 'ws-task-done';
  const isOverdue = (t: Task) =>
    !!t.dueDate && t.dueDate < todayStr && !isDone(t);

  const filtered = useMemo(() => {
    return tasks
      .filter((t) => !t.deletedAt)
      .filter((t) => {
        switch (filter) {
          case 'committed_open':
            return isCommitted(t) && !isDone(t);
          case 'all':
            return true;
          case 'committed':
            return isCommitted(t);
          case 'someday':
            return t.planningBucket === 'someday';
          case 'completed':
            return isDone(t);
          case 'overdue':
            return isOverdue(t);
        }
      });
  }, [tasks, filter, todayStr]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      switch (sort) {
        case 'due': {
          const av = a.dueDate ?? '9999-99-99';
          const bv = b.dueDate ?? '9999-99-99';
          if (av !== bv) return av < bv ? -1 : 1;
          return cmpPriority(a, b);
        }
        case 'scheduled': {
          const av = a.scheduledDate ?? '9999-99-99';
          const bv = b.scheduledDate ?? '9999-99-99';
          if (av !== bv) return av < bv ? -1 : 1;
          return cmpPriority(a, b);
        }
        case 'project': {
          const an = projectMap.get(a.projectId ?? '')?.name ?? 'zzz';
          const bn = projectMap.get(b.projectId ?? '')?.name ?? 'zzz';
          if (an !== bn) return an < bn ? -1 : 1;
          return a.title.localeCompare(b.title);
        }
        case 'title':
          return a.title.localeCompare(b.title);
        case 'priority':
        default:
          return cmpPriority(a, b);
      }
    });
    return arr;
  }, [filtered, sort, projectMap]);

  const groups = useMemo(() => {
    if (group === 'none') {
      return [{ key: '__all__', label: '', color: undefined, tasks: sorted }];
    }
    const byProject = new Map<string, Task[]>();
    sorted.forEach((t) => {
      const key = t.projectId ?? '__none__';
      if (!byProject.has(key)) byProject.set(key, []);
      byProject.get(key)!.push(t);
    });
    // 保持项目在侧栏/设置中的顺序，未分配的放最后
    const ordered = [...projects.map((p) => p.id), '__none__'].filter((id) =>
      byProject.has(id)
    );
    return ordered.map((id) => ({
      key: id,
      label: id === '__none__' ? (isZh ? '未分配项目' : 'No project') : projectMap.get(id)?.name ?? '',
      color: id === '__none__' ? '#94a3b8' : projectMap.get(id)?.color,
      tasks: byProject.get(id)!,
    }));
  }, [sorted, group, projects, projectMap]);

  const handleToggle = async (e: React.MouseEvent, t: Task) => {
    e.stopPropagation();
    try {
      if (isDone(t)) {
        await reopenTask(t.id);
      } else {
        await completeTask(t.id);
      }
    } catch {
      addToast({
        message: isZh ? '操作失败，请重试' : 'Action failed, please retry',
        type: 'error',
      });
    }
  };

  const filterOptions: { key: FilterKey; label: string }[] = [
    { key: 'committed_open', label: isZh ? '未完成·已承诺' : 'Open & committed' },
    { key: 'all', label: isZh ? '全部' : 'All' },
    { key: 'committed', label: isZh ? '已承诺' : 'Committed' },
    { key: 'someday', label: isZh ? 'Someday' : 'Someday' },
    { key: 'overdue', label: isZh ? '已逾期' : 'Overdue' },
    { key: 'completed', label: isZh ? '已完成' : 'Completed' },
  ];
  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'priority', label: isZh ? '优先级' : 'Priority' },
    { key: 'due', label: isZh ? '截止日' : 'Due' },
    { key: 'scheduled', label: isZh ? '计划日' : 'Scheduled' },
    { key: 'project', label: isZh ? '项目' : 'Project' },
    { key: 'title', label: isZh ? '标题' : 'Title' },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center">
          <ListTodo className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {isZh ? '任务' : 'Tasks'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isZh
              ? `跨项目视图 · 当前 ${sorted.length} 个任务`
              : `Cross-project view · ${sorted.length} tasks now`}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="space-y-2.5">
        {/* Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setFilter(opt.key)}
              className={cn(
                'shrink-0 text-[12px] font-medium px-3 py-1.5 rounded-full border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                filter === opt.key
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Sort + Group */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400">{isZh ? '排序' : 'Sort'}</span>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
            {sortOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSort(opt.key)}
                className={cn(
                  'px-2.5 py-1 rounded-md transition-colors cursor-pointer',
                  sort === opt.key
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <span className="text-slate-400 ml-1">{isZh ? '分组' : 'Group'}</span>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setGroup('none')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-colors cursor-pointer',
                group === 'none'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              )}
            >
              {isZh ? '不分组' : 'None'}
            </button>
            <button
              type="button"
              onClick={() => setGroup('project')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-colors cursor-pointer',
                group === 'project'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              )}
            >
              {isZh ? '按项目' : 'By project'}
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-10 text-center">
          <p className="text-sm text-slate-400">
            {isZh ? '该筛选条件下没有任务' : 'No tasks match this filter'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <div key={g.key} className="space-y-2">
              {group !== 'none' && (
                <div className="flex items-center gap-2 px-1 pt-1">
                  <FolderDot
                    className="w-3.5 h-3.5"
                    style={{ color: g.color }}
                  />
                  <span className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                    {g.label}
                  </span>
                  <span className="text-[11px] text-slate-400">{g.tasks.length}</span>
                </div>
              )}
              <div className="space-y-1.5">
                {g.tasks.map((t) => (
                  <div
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openInspector({ type: 'task', id: t.id, title: t.title })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openInspector({ type: 'task', id: t.id, title: t.title });
                      }
                    }}
                    className="flex items-start gap-3 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <button
                      type="button"
                      aria-label={isDone(t) ? (isZh ? '标记为未完成' : 'Reopen') : isZh ? '标记完成' : 'Complete'}
                      onClick={(e) => handleToggle(e, t)}
                      className={cn(
                        'mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                        isDone(t)
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 dark:border-slate-600 text-transparent hover:border-indigo-400'
                      )}
                    >
                      <Check className="w-3 h-3" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div
                        className={cn(
                          'text-[13px] font-medium text-slate-900 dark:text-slate-100 truncate',
                          isDone(t) && 'line-through text-slate-400 dark:text-slate-500'
                        )}
                      >
                        {t.title}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-400">
                        {t.projectId && projectMap.get(t.projectId) && (
                          <span className="inline-flex items-center gap-1">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: projectMap.get(t.projectId)!.color }}
                            />
                            {projectMap.get(t.projectId)!.name}
                          </span>
                        )}
                        {t.priority !== 'none' && (
                          <span className="inline-flex items-center gap-1">
                            <Flag className="w-3 h-3" style={{ color: PRIORITY_COLORS[t.priority] }} />
                            {isZh
                              ? PRIORITY_LABEL_ZH[t.priority]
                              : PRIORITY_LABEL_EN[t.priority]}
                          </span>
                        )}
                        {t.dueDate && (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1',
                              isOverdue(t) && 'text-red-500 dark:text-red-400 font-medium'
                            )}
                          >
                            <CalendarClock className="w-3 h-3" />
                            {t.dueDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PRIORITY_LABEL_ZH: Record<string, string> = {
  urgent: '紧急',
  high: '高',
  medium: '中',
  low: '低',
  none: '无',
};
const PRIORITY_LABEL_EN: Record<string, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  none: 'None',
};

function cmpPriority(a: Task, b: Task): number {
  const pa = PRIORITY_ORDER[a.priority] ?? 4;
  const pb = PRIORITY_ORDER[b.priority] ?? 4;
  if (pa !== pb) return pa - pb;
  const av = a.dueDate ?? '9999-99-99';
  const bv = b.dueDate ?? '9999-99-99';
  if (av !== bv) return av < bv ? -1 : 1;
  return a.title.localeCompare(b.title);
}

export default TasksPage;
