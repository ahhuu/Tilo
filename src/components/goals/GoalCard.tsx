import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { calculateGoalProgress, updateGoal } from '@/services/goalCommands';
import { useI18n } from '@/core/i18n';
import {
  Sparkles,
  FolderDot,
  Calendar,
  Sliders,
} from 'lucide-react';
import type { Goal, Project } from '@/core/types/domain';

interface GoalCardProps {
  goal: Goal;
  linkedProjects: Project[];
  onToggleWeeklyFocus: (goal: Goal) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  linkedProjects,
  onToggleWeeklyFocus,
}) => {
  const { language } = useI18n();

  const liveProgress = useLiveQuery(
    () => calculateGoalProgress(goal.id),
    [goal.id, goal.progressMode, goal.currentProgress, goal.targetProgress]
  );

  const computedProgress = liveProgress !== undefined ? liveProgress : goal.currentProgress;

  const handleManualSliderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    await updateGoal(goal.id, { currentProgress: val });
  };

  const getProgressModeLabel = (mode: string) => {
    if (language !== 'zh-CN') return mode;
    switch (mode) {
      case 'milestones':
        return '里程碑驱动';
      case 'tasks':
      case 'taskCompletion':
        return '任务完成率';
      case 'metricTarget':
        return '数值指标';
      case 'manual':
        return '手动设定';
      case 'sessions':
        return '专注时长';
      default:
        return mode;
    }
  };

  const isEffectivelyWeeklyFocus =
    Boolean(goal.isWeeklyFocus) && goal.status !== 'completed' && goal.status !== 'archived';

  return (
    <Card variant="interactive" className="p-5 space-y-4 shadow-2xs group relative">
      {/* Top badges & progress mode */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge
            variant={isEffectivelyWeeklyFocus ? 'indigo' : 'secondary'}
            size="sm"
            className="gap-1 cursor-pointer"
            onClick={() => onToggleWeeklyFocus(goal)}
            title={language === 'zh-CN' ? '点击切换本周核心聚焦' : 'Click to toggle Weekly Focus'}
          >
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <span>
              {isEffectivelyWeeklyFocus
                ? (language === 'zh-CN' ? '本周聚焦' : 'Weekly Focus')
                : (language === 'zh-CN' ? '常规目标' : 'Goal')}
            </span>
          </Badge>
          <span className="text-[11px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono">
            {getProgressModeLabel(goal.progressMode)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {goal.progressMode === 'metricTarget' && goal.targetProgress && (
            <span className="text-[11px] font-mono text-slate-400">
              ({goal.currentProgress || 0}/{goal.targetProgress})
            </span>
          )}
          <span
            className="text-sm font-bold"
            style={{ color: goal.color || '#4f46e5' }}
          >
            {computedProgress}%
          </span>
        </div>
      </div>

      {/* Goal Title & Description */}
      <div className="space-y-1">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {goal.title}
        </h3>
        {goal.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {goal.description}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(100, Math.max(2, computedProgress))}%`,
              backgroundColor: goal.color || '#4f46e5',
            }}
          />
        </div>

        {/* Manual adjustment slider if manual mode */}
        {goal.progressMode === 'manual' && (
          <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
            <Sliders className="w-3 h-3 text-slate-400" />
            <input
              type="range"
              min={0}
              max={100}
              value={computedProgress}
              onChange={handleManualSliderChange}
              className="w-full accent-indigo-600 cursor-pointer h-1 bg-slate-200 dark:bg-slate-700 rounded-lg"
            />
          </div>
        )}

        {/* Metric stepper if metricTarget mode */}
        {goal.progressMode === 'metricTarget' && goal.targetProgress && (
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>{language === 'zh-CN' ? '指标达成量' : 'Metric Target'}</span>
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={async () => {
                  const nextVal = Math.max(0, (goal.currentProgress || 0) - 1);
                  await updateGoal(goal.id, { currentProgress: nextVal });
                }}
                className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer"
                title="-1"
              >
                -
              </button>
              <span className="font-mono text-slate-700 dark:text-slate-200 font-semibold px-1">
                {goal.currentProgress || 0} / {goal.targetProgress}
              </span>
              <button
                type="button"
                onClick={async () => {
                  const nextVal = (goal.currentProgress || 0) + 1;
                  await updateGoal(goal.id, { currentProgress: nextVal });
                }}
                className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer"
                title="+1"
              >
                +
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Linked Projects Rail */}
      {linkedProjects.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {language === 'zh-CN' ? `关联项目 (${linkedProjects.length})` : `Connected Projects (${linkedProjects.length})`}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {linkedProjects.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium"
              >
                <FolderDot className="w-3 h-3" style={{ color: p.color }} />
                <span>{p.name}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer Info & 4 Status Actions */}
      <div className="flex items-center justify-between pt-2 text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800 gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          {goal.targetDate && (
            <span className="flex items-center gap-1 text-[11px]">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{language === 'zh-CN' ? `目标: ${goal.targetDate}` : `Target: ${goal.targetDate}`}</span>
            </span>
          )}
        </div>

        {/* 4 Canonical Status Switcher in Footer */}
        <div
          className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {(['active', 'completed', 'paused', 'archived'] as const).map((st) => {
            const isCurrent = (goal.status === st) || (st === 'active' && !goal.status);
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
                onClick={async () => {
                  await updateGoal(goal.id, { status: st });
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                  isCurrent
                    ? st === 'active'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs'
                      : st === 'completed'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-semibold shadow-2xs'
                      : st === 'paused'
                      ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 font-semibold shadow-2xs'
                      : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold shadow-2xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title={label}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
