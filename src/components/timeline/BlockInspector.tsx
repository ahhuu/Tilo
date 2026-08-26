import React from 'react';
import { useI18n } from '@/core/i18n';
import { timeService } from '@/core/time/timeService';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getPlanActualComparison } from '@/core/timeline/timelineEngine';
import {
  Clock,
  Play,
  Trash2,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Target,
  Sparkles,
  Check,
} from 'lucide-react';
import type { PlannedBlock, Session, Task, Project } from '@/core/types/domain';

interface BlockInspectorProps {
  block: PlannedBlock;
  sessions: Session[];
  task?: Task;
  project?: Project;
  onStartSession?: (task: Task | { id: string; title: string; projectId?: string }) => void;
  onDeleteBlock?: (blockId: string) => void;
  onInspectTask?: (task: Task) => void;
}

export const BlockInspector: React.FC<BlockInspectorProps> = ({
  block,
  sessions,
  task,
  project,
  onStartSession,
  onDeleteBlock,
  onInspectTask,
}) => {
  const { language } = useI18n();
  const comparison = getPlanActualComparison(block, sessions);

  const diffMinutes = Math.round(comparison.diffSeconds / 60);

  return (
    <div className="p-4 space-y-6 text-left">
      {/* Title and Type */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {block.type === 'focus' ? (
            <Badge size="sm" className="bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 border border-purple-300 dark:border-purple-700/60 px-2 py-0.5 text-xs font-semibold gap-1">
              <Target className="w-3 h-3 inline text-purple-600 dark:text-purple-400" />
              <span>{language === 'zh-CN' ? '专注时间块 (Focus)' : 'Focus Block'}</span>
            </Badge>
          ) : block.type === 'activity' ? (
            <Badge size="sm" className="bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60 px-2 py-0.5 text-xs font-semibold gap-1">
              <Sparkles className="w-3 h-3 inline text-amber-600 dark:text-amber-400" />
              <span>{language === 'zh-CN' ? '日程活动 (Activity)' : 'Activity'}</span>
            </Badge>
          ) : (
            <Badge variant="indigo" size="sm" className="px-2 py-0.5 text-xs font-semibold gap-1">
              <Check className="w-3 h-3 inline" />
              <span>{language === 'zh-CN' ? '任务排期 (Task Plan)' : 'Task Plan'}</span>
            </Badge>
          )}
          {project && (
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-md"
              style={{
                backgroundColor: `${project.color}15`,
                color: project.color,
              }}
            >
              {project.name}
            </span>
          )}
        </div>

        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {block.title || task?.title || 'Planned Block'}
        </h3>
      </div>

      {/* Plan vs Actual Comparison Matrix */}
      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>{language === 'zh-CN' ? '计划 vs 实际对比' : 'Plan vs Actual Comparison'}</span>
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            {timeService.formatTime(block.startAt)} – {timeService.formatTime(block.endAt)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          {/* Plan Duration */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-0.5">
              {language === 'zh-CN' ? '预估规划工时' : 'Planned Time'}
            </span>
            <span className="text-sm font-semibold font-mono text-indigo-600 dark:text-indigo-400">
              {timeService.formatDuration(comparison.planDurationSeconds)}
            </span>
          </div>

          {/* Actual Duration */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-0.5">
              {language === 'zh-CN' ? '实际执行工时' : 'Actual Time'}
            </span>
            <span className="text-sm font-semibold font-mono text-emerald-600 dark:text-emerald-400">
              {timeService.formatDuration(comparison.actualDurationSeconds)}
            </span>
          </div>
        </div>

        {/* Variance / Difference Status */}
        <div className="pt-1 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            {language === 'zh-CN' ? '工时偏差 (Variance):' : 'Variance:'}
          </span>
          {comparison.actualDurationSeconds === 0 ? (
            <span className="text-slate-400 font-medium">
              {language === 'zh-CN' ? '尚未记录实际工时' : 'No actual time yet'}
            </span>
          ) : diffMinutes > 0 ? (
            <span className="text-amber-600 dark:text-amber-400 font-semibold font-mono flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              +{diffMinutes}m ({language === 'zh-CN' ? '超出计划' : 'overrun'})
            </span>
          ) : diffMinutes < 0 ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" />
              {diffMinutes}m ({language === 'zh-CN' ? '快于预期' : 'faster'})
            </span>
          ) : (
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {language === 'zh-CN' ? '精准契合' : 'Exact match'}
            </span>
          )}
        </div>
      </div>

      {/* Linked Task Details */}
      {task && (
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {language === 'zh-CN' ? '关联任务信息' : 'Linked Task Details'}
          </span>
          <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">{language === 'zh-CN' ? '优先级' : 'Priority'}</span>
              <Badge variant={task.priority === 'urgent' ? 'urgent' : task.priority === 'high' ? 'high' : 'default'} size="sm">
                {task.priority.toUpperCase()}
              </Badge>
            </div>
            {task.dueDate && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{language === 'zh-CN' ? '截止日期' : 'Due Date'}</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{task.dueDate}</span>
              </div>
            )}
            {onInspectTask && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onInspectTask(task)}
                className="w-full text-xs text-indigo-600 dark:text-indigo-400 mt-1"
              >
                {language === 'zh-CN' ? '打开完整任务属性 →' : 'Open Full Task →'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        {onStartSession && (
          <Button
            size="sm"
            variant="primary"
            onClick={() =>
              onStartSession(
                task || {
                  id: block.id,
                  title: block.title || 'Focus Session',
                  projectId: block.projectId,
                }
              )
            }
            className="w-full gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{language === 'zh-CN' ? '立即开启计时会话' : 'Start Focus Session'}</span>
          </Button>
        )}

        {onDeleteBlock && (
          <Button
            size="sm"
            variant="danger"
            onClick={() => onDeleteBlock(block.id)}
            className="w-full gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{language === 'zh-CN' ? '删除此时间块' : 'Delete Planned Block'}</span>
          </Button>
        )}
      </div>
    </div>
  );
};
