import React from 'react';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/core/i18n';
import { Target } from 'lucide-react';
import type { Goal, Project } from '@/core/types/domain';

interface WeeklyFocusSectionProps {
  goals: Goal[];
  projectMap: Map<string, Project>;
  weekLabel: string;
  onInspectGoal?: (goal: Goal) => void;
}

export const WeeklyFocusSection: React.FC<WeeklyFocusSectionProps> = ({
  goals,
  projectMap,
  weekLabel,
  onInspectGoal,
}) => {
  const { t, language } = useI18n();

  return (
    <div className="space-y-2">
      {/* Header bar */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
        <div className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>{t('today.weeklyFocus')}</span>
        </div>
        <span className="text-[11px] font-normal text-slate-400">
          {weekLabel}
        </span>
      </div>

      {/* Multiple Goal Cards Horizontal Grid */}
      {goals.length === 0 ? (
        <Card variant="default" className="p-3.5 text-center text-xs text-slate-400">
          <p className="text-slate-500 dark:text-slate-400">
            {language === 'zh-CN'
              ? '本周暂未设定核心战略目标（可在「目标」页面设为本周焦点）'
              : 'No weekly focus goals set for this week (set in Goals page)'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {goals.map((goal) => {
            const project = Array.from(projectMap.values()).find(
              (p) => p.primaryGoalId === goal.id || p.relatedGoalIds?.includes(goal.id)
            );

            const progress = Math.min(100, Math.max(0, Math.round(goal.currentProgress || 0)));
            const radius = 16;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (progress / 100) * circumference;

            return (
              <Card
                key={goal.id}
                variant="interactive"
                onClick={() => onInspectGoal?.(goal)}
                className="p-3.5 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-800 transition-all cursor-pointer group"
              >
                {/* Left: Title & Project */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: goal.color || '#6366f1' }}
                    />
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                      {goal.title}
                    </h4>
                  </div>

                  <p className="text-xs text-slate-400 truncate pl-4">
                    {project
                      ? project.name
                      : goal.description || (language === 'zh-CN' ? '战略目标' : 'Strategic Goal')}
                  </p>
                </div>

                {/* Right: Circular Progress Ring Gauge */}
                <div className="relative flex items-center justify-center shrink-0 w-11 h-11">
                  {goal.progressMode === 'metricTarget' && goal.targetProgress ? (
                    <div className="text-center font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      <span>{goal.currentProgress || 0}</span>
                      <span className="text-[9px] text-slate-400">/{goal.targetProgress}</span>
                    </div>
                  ) : (
                    <>
                      <svg className="w-11 h-11 -rotate-90" viewBox="0 0 40 40">
                        {/* Background track */}
                        <circle
                          cx="20"
                          cy="20"
                          r={radius}
                          className="stroke-slate-100 dark:stroke-slate-800"
                          strokeWidth="3.5"
                          fill="transparent"
                        />
                        {/* Progress ring */}
                        <circle
                          cx="20"
                          cy="20"
                          r={radius}
                          className="stroke-indigo-600 dark:stroke-indigo-400 transition-all duration-500 ease-out"
                          strokeWidth="3.5"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          fill="transparent"
                        />
                      </svg>
                      <span className="absolute text-[10px] font-mono font-bold text-slate-800 dark:text-slate-200">
                        {progress}%
                      </span>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
