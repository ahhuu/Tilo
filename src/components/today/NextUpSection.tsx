import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { useI18n } from '@/core/i18n';
import { Play, Plus, Sparkles, CheckCircle2, Circle, Info } from 'lucide-react';
import type { Task } from '@/core/types/domain';
import type { NextUpCandidate } from '@/core/timeline/nextUpAlgorithm';

interface NextUpSectionProps {
  candidates: NextUpCandidate[];
  onStartSession: (task: Task) => void;
  onInspect: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
  onAddTask: () => void;
}

export const NextUpSection: React.FC<NextUpSectionProps> = ({
  candidates,
  onStartSession,
  onInspect,
  onToggleComplete,
  onAddTask,
}) => {
  const { t, language } = useI18n();

  const formatPriority = (p?: string) => {
    if (language === 'zh-CN') {
      if (p === 'urgent') return '紧急';
      if (p === 'high') return '高';
      if (p === 'medium') return '中';
      if (p === 'low') return '低';
      return '无';
    }
    return p ? p.charAt(0).toUpperCase() + p.slice(1) : 'None';
  };

  const formatDateLabel = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        if (language === 'zh-CN') {
          return `${parseInt(parts[1], 10)}月${parseInt(parts[2], 10)}日`;
        }
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  return (
    <div className="space-y-2">
      {/* Section Header */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>{t('today.nextUp')}</span>
          <span title={language === 'zh-CN' ? '算法根据截止时间、排期与优先级自动推荐的最佳下一步待办' : 'Algorithmic recommendations based on due date, schedule, and priority'}>
            <Info className="w-3 h-3 text-slate-400 inline cursor-help" />
          </span>
        </div>
        <span className="text-[11px] font-normal text-slate-400 lowercase">
          {language === 'zh-CN' ? '智能算法推荐' : 'algorithmic ranking'}
        </span>
      </div>

      {/* Candidate List or Empty State */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden shadow-xs">
        {candidates.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">
            {language === 'zh-CN' ? '暂无待推荐任务，已全部安排妥当。' : 'No upcoming recommendations. You are all caught up.'}
          </div>
        ) : (
          candidates.map(({ task, project }) => (
            <div
              key={task.id}
              onClick={() => onInspect(task)}
              className="flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
            >
              {/* Left: Radio completion circle & Title */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleComplete(task);
                  }}
                  className="text-slate-300 hover:text-indigo-600 dark:text-slate-600 dark:hover:text-indigo-400 transition-colors shrink-0 cursor-pointer"
                  title={
                    task.statusId === 'ws-task-done' || task.statusId?.includes('done')
                      ? (language === 'zh-CN' ? '点击撤销完成 (恢复未完成)' : 'Click to reopen')
                      : (language === 'zh-CN' ? '标记为完成' : 'Mark complete')
                  }
                >
                  {task.statusId === 'ws-task-done' || task.statusId?.includes('done') ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <>
                      <Circle className="w-4 h-4 group-hover:hidden" />
                      <CheckCircle2 className="w-4 h-4 hidden group-hover:block text-indigo-600 dark:text-indigo-400" />
                    </>
                  )}
                </button>

                <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {task.title}
                </span>

                {project && (
                  <span className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: project.color || '#6366f1' }}
                    />
                    <span className="truncate max-w-28">{project.name}</span>
                  </span>
                )}
              </div>

              {/* Right: Priority badge, Date, and Play button */}
              <div className="flex items-center gap-2 shrink-0">
                {task.priority && task.priority !== 'none' && (
                  <Badge variant={task.priority} className="text-[10px] px-1.5 py-0.5">
                    {formatPriority(task.priority)}
                  </Badge>
                )}

                {(task.dueDate || task.scheduledDate) && (
                  <span className="text-xs font-mono text-slate-400 text-right">
                    {formatDateLabel(task.dueDate || task.scheduledDate)}
                  </span>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartSession(task);
                  }}
                  className="sm:opacity-0 sm:group-hover:opacity-100 opacity-80 hover:opacity-100 p-1 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-md transition-all cursor-pointer"
                  title={language === 'zh-CN' ? '开启专注会话' : 'Start Focus Session'}
                >
                  <Play className="w-3.5 h-3.5 fill-indigo-600" />
                </button>
              </div>
            </div>
          ))
        )}

        {/* Add Task Button at bottom */}
        <button
          type="button"
          onClick={onAddTask}
          className="w-full flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{language === 'zh-CN' ? '添加任务' : 'Add task'}</span>
        </button>
      </div>
    </div>
  );
};
