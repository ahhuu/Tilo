import React, { useState, useMemo } from 'react';
import {
  Target,
  Calendar,
  CheckCircle2,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/storage/db';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { timeService } from '@/core/time/timeService';

export const GoalsGrid: React.FC = () => {
  const { language } = useI18n();
  const isZh = language === 'zh-CN';
  const { openInspector } = useUIStore();

  const [activeTab, setActiveTab] = useState<'active' | 'all'>('active');
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);

  const rawGoals = useLiveQuery(() => db.goals.toArray(), []);
  const rawProjects = useLiveQuery(() => db.projects.toArray(), []);
  const rawTasks = useLiveQuery(() => db.tasks.toArray(), []);

  const goals = useMemo(() => rawGoals || [], [rawGoals]);
  const projects = useMemo(() => rawProjects || [], [rawProjects]);
  const tasks = useMemo(() => rawTasks || [], [rawTasks]);

  const logicalDate = timeService.getLogicalDate();
  const todayMs = new Date(`${logicalDate}T00:00:00`).getTime();

  // 计算每个目标下的任务完成度
  const goalProgressMap = useMemo(() => {
    const map = new Map<string, { total: number; done: number; percent: number }>();

    for (const goal of goals) {
      const goalProjects = projects.filter(
        (p) => (p.primaryGoalId === goal.id || p.relatedGoalIds?.includes(goal.id)) && !p.deletedAt
      );
      const projectIds = new Set(goalProjects.map((p) => p.id));
      const goalTasks = tasks.filter(
        (t) => !t.deletedAt && t.projectId && projectIds.has(t.projectId)
      );

      const total = goalTasks.length;
      const done = goalTasks.filter((t) => t.statusId === 'ws-task-done').length;
      const percent = total > 0 ? Math.round((done / total) * 100) : 0;

      map.set(goal.id, { total, done, percent });
    }

    return map;
  }, [goals, projects, tasks]);

  // 计算 D-Day 倒计时天数
  const calculateDDay = (targetDateStr?: string) => {
    if (!targetDateStr) return null;
    const targetMs = new Date(`${targetDateStr}T00:00:00`).getTime();
    const diffDays = Math.round((targetMs - todayMs) / (1000 * 60 * 60 * 24));
    if (diffDays > 0) return { label: `D-${diffDays}`, days: diffDays, status: 'upcoming' };
    if (diffDays === 0) return { label: isZh ? 'D-Day 今天' : 'D-Day Today', days: 0, status: 'today' };
    return {
      label: isZh ? `逾期 ${Math.abs(diffDays)} 天` : `Overdue ${Math.abs(diffDays)}d`,
      days: diffDays,
      status: 'overdue',
    };
  };

  const filteredGoals = useMemo(() => {
    return goals.filter((g) => {
      if (g.deletedAt) return false;
      if (activeTab === 'active') {
        if (g.status === 'completed' || g.status === 'archived') return false;
        // 如果关联任务已全部完成 (100%)，且存在任务，不属于进行中
        const progress = goalProgressMap.get(g.id);
        if (progress && progress.total > 0 && progress.done >= progress.total) return false;

        // 如果该目标下有项目，且所有项目都已完成或归档，也不属于进行中
        const goalProjects = projects.filter(
          (p) => (p.primaryGoalId === g.id || p.relatedGoalIds?.includes(g.id)) && !p.deletedAt
        );
        if (
          goalProjects.length > 0 &&
          goalProjects.every((p) => p.status === 'completed' || p.status === 'archived')
        ) {
          return false;
        }
      }
      return true;
    });
  }, [goals, activeTab, goalProgressMap, projects]);

  return (
    <div className="flex flex-col h-full w-full bg-transparent overflow-hidden select-none">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-200/40 dark:border-slate-800/40 bg-slate-50/40 dark:bg-slate-800/20">
        <div className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {isZh ? '目标看板' : 'Goals Board'}
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
            {filteredGoals.length}
          </span>
        </div>

        {/* 活跃 / 全部 切换 */}
        <div className="flex items-center gap-0.5 bg-slate-200/50 dark:bg-slate-800/60 p-0.5 rounded-lg text-[10px]">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
              activeTab === 'active'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {isZh ? '进行中' : 'In Progress'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {isZh ? '全部' : 'All'}
          </button>
        </div>
      </div>

      {/* 目标列表 */}
      <div className="flex-1 min-h-0 p-3 space-y-2.5 overflow-y-auto">
        {filteredGoals.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-xs italic space-y-2">
            <Target className="w-8 h-8 text-slate-300 dark:text-slate-700 stroke-1" />
            <span>
              {isZh
                ? '暂无目标，在主应用「战略目标」中设立核心 OKR'
                : 'No goals found. Set up core OKRs in Goals page.'}
            </span>
          </div>
        ) : (
          filteredGoals.map((goal) => {
            const progress = goalProgressMap.get(goal.id) || { total: 0, done: 0, percent: 0 };
            const dday = calculateDDay(goal.targetDate);
            const isExpanded = expandedGoalId === goal.id;
            const rawGoalProjects = projects.filter(
              (p) => (p.primaryGoalId === goal.id || p.relatedGoalIds?.includes(goal.id)) && !p.deletedAt
            );
            const goalProjects = rawGoalProjects.filter((p) => {
              if (activeTab === 'active') {
                return p.status !== 'completed' && p.status !== 'archived';
              }
              return true;
            });

            return (
              <div
                key={goal.id}
                onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}
                className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer space-y-2"
              >
                {/* 目标头部 */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {goal.title}
                      </span>
                      {goal.status === 'completed' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      )}
                    </div>
                    {goal.targetDate && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-2.5 h-2.5" />
                        <span>{isZh ? '目标期: ' : 'Target: '}{goal.targetDate}</span>
                      </span>
                    )}
                  </div>

                  {/* D-Day 倒计时徽标 */}
                  {dday && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        dday.status === 'overdue'
                          ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                          : dday.status === 'today'
                          ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 animate-pulse'
                          : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                      }`}
                    >
                      {dday.label}
                    </span>
                  )}
                </div>

                {/* 进度条 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">
                      {progress.total > 0
                        ? (isZh
                            ? `${progress.done} / ${progress.total} 任务完成`
                            : `${progress.done} / ${progress.total} tasks completed`)
                        : (isZh ? '尚无关联任务' : 'No linked tasks')}
                    </span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {progress.percent}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                </div>

                {/* 展开子项目详情 */}
                {isExpanded && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 animate-in fade-in duration-150">
                    <div className="text-[10px] font-medium text-slate-400">
                      {isZh ? '关联项目' : 'Linked Projects'} ({goalProjects.length}):
                    </div>
                    {goalProjects.length === 0 ? (
                      <div className="text-[10px] text-slate-400 italic">
                        {isZh
                          ? (activeTab === 'active' ? '暂无进行中关联项目' : '暂无直接关联项目')
                          : (activeTab === 'active' ? 'No active linked projects' : 'No linked projects')}
                      </div>
                    ) : (
                      goalProjects.map((p) => (
                        <div
                          key={p.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            openInspector({ type: 'project', id: p.id, title: p.name });
                          }}
                          className="flex items-center justify-between px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-[11px] text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          <span className="truncate">{p.name}</span>
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 底部提示 */}
      <div className="px-3.5 py-1.5 border-t border-slate-200/40 dark:border-slate-800/40 bg-slate-50/40 dark:bg-slate-800/20 flex items-center justify-between text-[10px] text-slate-400">
        <span>{isZh ? '实时与主知识库保持同步' : 'Synced with Knowledge Base'}</span>
        <span className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-indigo-500" />
          <span>{isZh ? '战略聚焦' : 'Strategic Focus'}</span>
        </span>
      </div>
    </div>
  );
};
