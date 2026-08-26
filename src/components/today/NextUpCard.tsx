import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useI18n } from '@/core/i18n';
import { Play, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import type { Task, Project } from '@/core/types/domain';

interface NextUpCardProps {
  task: Task;
  project?: Project;
  subtaskCount?: { total: number; completed: number };
  onStartSession: (task: Task) => void;
  onInspect: (task: Task) => void;
  onComplete: (task: Task) => void;
}

export const NextUpCard: React.FC<NextUpCardProps> = ({
  task,
  project,
  subtaskCount,
  onStartSession,
  onInspect,
  onComplete,
}) => {
  const { t, language } = useI18n();

  return (
    <Card
      variant="interactive"
      onClick={() => onInspect(task)}
      className="p-4 border-indigo-200/80 dark:border-indigo-900/80 bg-linear-to-r from-indigo-50/40 to-white dark:from-indigo-950/20 dark:to-slate-900 shadow-sm relative overflow-hidden group cursor-pointer"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>{t('today.nextUp')}</span>
        </div>
        <Badge variant={task.priority}>
          {language === 'zh-CN'
            ? (task.priority === 'urgent' ? '紧急' : task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : task.priority === 'low' ? '低' : '无')
            : task.priority}
        </Badge>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
            {task.title}
          </h3>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            {project && (
              <span className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <span>{project.name}</span>
                <span>•</span>
              </span>
            )}
            {task.estimateMinutes && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{task.estimateMinutes}m</span>
              </span>
            )}
            {subtaskCount && subtaskCount.total > 0 && (
              <>
                <span>•</span>
                <span>
                  {subtaskCount.completed}/{subtaskCount.total} {language === 'zh-CN' ? '子任务' : 'subtasks'}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onComplete(task);
            }}
            className="h-8 text-xs gap-1"
            title={language === 'zh-CN' ? '标记为已完成' : 'Mark Complete'}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={(e) => {
              e.stopPropagation();
              onStartSession(task);
            }}
            className="h-8 text-xs gap-1.5 font-medium px-3 shadow-xs"
          >
            <Play className="w-3 h-3 fill-white" />
            <span>{language === 'zh-CN' ? '开始专注' : 'Start Session'}</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};
