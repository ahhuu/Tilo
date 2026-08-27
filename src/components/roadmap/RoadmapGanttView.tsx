import React, { useEffect, useState } from 'react';
import { useI18n } from '@/core/i18n';
import { getRoadmapData, type RoadmapDataResult, type RoadmapProjectItem } from '@/services/roadmapService';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Target,
  Folder,
  Diamond,
  Layers,
  ChevronDown,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export const RoadmapGanttView: React.FC = () => {
  const { language } = useI18n();
  const [data, setData] = useState<RoadmapDataResult | null>(null);
  const [collapsedGoals, setCollapsedGoals] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getRoadmapData().then(setData);
  }, []);

  if (!data) return null;

  const toggleGoal = (goalId: string) => {
    setCollapsedGoals((prev) => ({ ...prev, [goalId]: !prev[goalId] }));
  };

  const renderProjectRow = (project: RoadmapProjectItem) => {
    return (
      <div
        key={project.id}
        className="flex items-center justify-between p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors gap-4"
      >
        {/* Left: Project Info */}
        <div className="flex items-center gap-3 min-w-48 max-w-xs">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: project.color || '#4f46e5' }}
          />
          <div className="min-w-0">
            <span className="font-medium text-xs text-slate-900 dark:text-slate-100 truncate block">
              {project.name}
            </span>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-mono">
              <span>{project.completedTasks}/{project.totalTasks} tasks</span>
            </div>
          </div>
        </div>

        {/* Center: Gantt Progress Bar */}
        <div className="flex-1 max-w-md space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span>{language === 'zh-CN' ? '进行中' : 'In Progress'}</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{project.progressPercentage}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${project.progressPercentage}%`,
                backgroundColor: project.color || '#4f46e5',
              }}
            />
          </div>
        </div>

        {/* Right: Milestones list */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0 max-w-xs overflow-hidden">
          {project.milestones.length > 0 ? (
            project.milestones.map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 font-medium"
                title={`${m.name} (${m.targetDate || 'No date'})`}
              >
                <Diamond className={`w-2.5 h-2.5 ${m.status === 'completed' ? 'text-emerald-500 fill-emerald-500' : 'text-indigo-400'}`} />
                <span className="truncate max-w-24">{m.name}</span>
              </span>
            ))
          ) : (
            <span className="text-[11px] text-slate-400 italic">
              {language === 'zh-CN' ? '暂无里程碑' : 'No milestones'}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 select-none">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">
              {language === 'zh-CN' ? '战略目标总数' : 'Strategic Goals'}
            </span>
            <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
              {data.goals.length}
            </span>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Folder className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">
              {language === 'zh-CN' ? '规划项目总数' : 'Tracked Projects'}
            </span>
            <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
              {data.goals.reduce((acc, g) => acc + g.projects.length, 0) + data.standaloneProjects.length}
            </span>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">
              {language === 'zh-CN' ? '里程碑总数' : 'Total Milestones'}
            </span>
            <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
              {data.goals.flatMap((g) => g.projects).reduce((acc, p) => acc + p.milestones.length, 0) +
                data.standaloneProjects.reduce((acc, p) => acc + p.milestones.length, 0)}
            </span>
          </div>
        </Card>
      </div>

      {/* Goal Tree & Project Gantt Rows */}
      <div className="space-y-4">
        {data.goals.map((goal) => {
          const isCollapsed = collapsedGoals[goal.id];
          return (
            <Card
              key={goal.id}
              className="p-5 space-y-3 border border-slate-200/80 dark:border-slate-800 shadow-2xs"
            >
              {/* Goal Header */}
              <div
                className="flex items-center justify-between cursor-pointer group"
                onClick={() => toggleGoal(goal.id)}
              >
                <div className="flex items-center gap-2.5">
                  <button type="button" className="text-slate-400 group-hover:text-slate-600">
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <div
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: goal.color || '#4f46e5' }}
                  />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {goal.title}
                  </h3>
                  <Badge size="sm" variant="secondary">
                    {goal.projects.length} {language === 'zh-CN' ? '个项目' : 'projects'}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                  {goal.targetDate && <span>Target: {goal.targetDate}</span>}
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {goal.progressPercentage}%
                  </span>
                </div>
              </div>

              {/* Goal Progress Track */}
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${goal.progressPercentage}%` }}
                />
              </div>

              {/* Child Projects Rows */}
              {!isCollapsed && (
                <div className="pl-6 space-y-2 pt-2 border-l-2 border-slate-100 dark:border-slate-800">
                  {goal.projects.length > 0 ? (
                    goal.projects.map(renderProjectRow)
                  ) : (
                    <div className="text-xs text-slate-400 py-2 italic">
                      {language === 'zh-CN' ? '该目标下暂无归属项目' : 'No projects associated with this goal yet.'}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}

        {/* Standalone Projects */}
        {data.standaloneProjects.length > 0 && (
          <Card className="p-5 space-y-3 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {language === 'zh-CN' ? '独立项目 (未关联战略目标)' : 'Standalone Projects'}
              </h3>
            </div>
            <div className="space-y-2 pt-1">
              {data.standaloneProjects.map(renderProjectRow)}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
