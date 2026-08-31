import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/storage/db';
import { updateGoal, deleteGoal, setWeeklyFocusGoals } from '@/services/goalCommands';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { timeService } from '@/core/time/timeService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Sparkles,
  Trash2,
  ChevronDown,
  Layers,
} from 'lucide-react';
import type { Goal, GoalStatus, GoalProgressMode } from '@/core/types/domain';

const PRESET_COLORS = [
  '#4f46e5', // Indigo
  '#0284c7', // Sky
  '#0d9488', // Teal
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ea580c', // Orange
  '#e11d48', // Rose
  '#8b5cf6', // Violet
];

interface GoalInspectorProps {
  goalId: string;
}

export const GoalInspector: React.FC<GoalInspectorProps> = ({ goalId }) => {
  const { language } = useI18n();
  const { closeInspector, addToast } = useUIStore();
  const weekKey = timeService.getWeekKey();

  const goal = useLiveQuery(() => db.goals.get(goalId), [goalId]);
  const linkedProjects = useLiveQuery(
    () => db.projects.where('primaryGoalId').equals(goalId).toArray(),
    [goalId]
  ) || [];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#4f46e5');
  const [status, setStatus] = useState<GoalStatus>('active');
  const [progressMode, setProgressMode] = useState<GoalProgressMode>('manual');
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const [targetProgress, setTargetProgress] = useState<number>(100);
  const [targetDate, setTargetDate] = useState<string>('');
  const [isWeeklyFocus, setIsWeeklyFocus] = useState<boolean>(false);

  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setDescription(goal.description || '');
      setColor(goal.color || '#4f46e5');
      setStatus(goal.status);
      setProgressMode(goal.progressMode);
      setCurrentProgress(goal.currentProgress || 0);
      setTargetProgress(goal.targetProgress || 100);
      setTargetDate(goal.targetDate || '');
      setIsWeeklyFocus(!!goal.isWeeklyFocus);
    }
  }, [goal]);

  if (!goal) {
    return (
      <div className="p-4 text-center text-xs text-slate-400">
        {language === 'zh-CN' ? '未找到目标。' : 'Goal not found.'}
      </div>
    );
  }

  const handleTitleBlur = async () => {
    if (title.trim() && title.trim() !== goal.title) {
      await updateGoal(goal.id, { title: title.trim() });
      addToast({
        message: language === 'zh-CN' ? '目标名称已更新' : 'Goal title updated',
        type: 'info',
      });
    }
  };

  const handleDescriptionBlur = async () => {
    if (description !== (goal.description || '')) {
      await updateGoal(goal.id, { description: description.trim() || undefined });
      addToast({
        message: language === 'zh-CN' ? '目标描述已更新' : 'Goal description updated',
        type: 'info',
      });
    }
  };

  const handleColorChange = async (newColor: string) => {
    setColor(newColor);
    await updateGoal(goal.id, { color: newColor });
  };

  const handleStatusChange = async (newStatus: GoalStatus) => {
    setStatus(newStatus);
    const updates: Partial<Goal> = { status: newStatus };
    if (newStatus === 'completed' || newStatus === 'archived') {
      updates.isWeeklyFocus = false;
      setIsWeeklyFocus(false);
    }
    await updateGoal(goal.id, updates);
    addToast({
      message: language === 'zh-CN' ? `目标状态已调整为: ${newStatus}` : `Status updated to ${newStatus}`,
      type: 'info',
    });
  };

  const handleProgressModeChange = async (newMode: GoalProgressMode) => {
    setProgressMode(newMode);
    await updateGoal(goal.id, { progressMode: newMode });
  };

  const handleProgressChange = async (val: number) => {
    setCurrentProgress(val);
    await updateGoal(goal.id, { currentProgress: val });
  };

  const handleTargetProgressBlur = async () => {
    await updateGoal(goal.id, { targetProgress: Number(targetProgress) || undefined });
  };

  const handleTargetDateChange = async (dateStr: string) => {
    setTargetDate(dateStr);
    await updateGoal(goal.id, { targetDate: dateStr || undefined });
  };

  const handleToggleWeeklyFocus = async () => {
    if ((status === 'completed' || status === 'archived') && !isWeeklyFocus) {
      addToast({
        message: language === 'zh-CN' ? '已达成或已归档的目标无法设为本周核心焦点' : 'Completed or archived goals cannot be set to Weekly Focus',
        type: 'warning',
      });
      return;
    }

    const nextVal = !isWeeklyFocus;
    setIsWeeklyFocus(nextVal);
    await updateGoal(goal.id, { isWeeklyFocus: nextVal });

    const weeklyFocusList = await db.weeklyFocus.where('weekKey').equals(weekKey).toArray();
    const currentIds = weeklyFocusList.map((wf) => wf.goalId);
    let nextIds: string[];
    if (nextVal) {
      nextIds = currentIds.includes(goal.id) ? currentIds : [...currentIds, goal.id];
    } else {
      nextIds = currentIds.filter((id) => id !== goal.id);
    }
    await setWeeklyFocusGoals(weekKey, nextIds);

    addToast({
      message: nextVal
        ? (language === 'zh-CN' ? '已设为本周核心重点' : 'Added to Weekly Focus')
        : (language === 'zh-CN' ? '已取消本周重点' : 'Removed from Weekly Focus'),
      type: 'info',
    });
  };

  const handleDelete = async () => {
    if (!window.confirm(language === 'zh-CN' ? `确定要删除目标 "${goal.title}" 吗？` : `Delete goal "${goal.title}"?`)) {
      return;
    }
    await deleteGoal(goal.id);
    addToast({
      message: language === 'zh-CN' ? '目标已删除' : 'Goal deleted',
      type: 'info',
    });
    closeInspector();
  };

  return (
    <div className="space-y-4 text-xs select-none">
      {/* Title */}
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {language === 'zh-CN' ? '目标名称' : 'Goal Title'}
        </label>
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          className="w-full text-sm font-semibold text-slate-900 dark:text-slate-100"
        />
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {language === 'zh-CN' ? '战略描述与范围' : 'Description'}
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleDescriptionBlur}
          placeholder={language === 'zh-CN' ? '输入目标的业务价值或期望成果...' : 'Goal outcome, purpose, or scope...'}
          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden resize-none"
        />
      </div>

      {/* Color Picker */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {language === 'zh-CN' ? '主题颜色' : 'Color'}
        </label>
        <div className="flex items-center gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => handleColorChange(c)}
              className={`w-5 h-5 rounded-full transition-transform ${
                color === c ? 'scale-125 ring-2 ring-offset-2 ring-indigo-500' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Status & Progress Mode */}
      <div className="grid grid-cols-1 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="grid grid-cols-3 items-center">
          <span className="text-slate-500">{language === 'zh-CN' ? '状态' : 'Status'}</span>
          <div className="col-span-2 relative">
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value as GoalStatus)}
              className="w-full h-7 px-2 pr-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-0 text-xs appearance-none cursor-pointer focus:ring-1 focus:ring-indigo-500 capitalize"
            >
              <option value="active">{language === 'zh-CN' ? '进行中 (Active)' : 'Active'}</option>
              <option value="completed">{language === 'zh-CN' ? '已达成 (Completed)' : 'Completed'}</option>
              <option value="paused">{language === 'zh-CN' ? '已暂停 (Paused)' : 'Paused'}</option>
              <option value="archived">{language === 'zh-CN' ? '已归档 (Archived)' : 'Archived'}</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
          </div>
        </div>

        <div className="grid grid-cols-3 items-center">
          <span className="text-slate-500">{language === 'zh-CN' ? '进度计算' : 'Progress'}</span>
          <div className="col-span-2 relative">
            <select
              value={progressMode}
              onChange={(e) => handleProgressModeChange(e.target.value as GoalProgressMode)}
              className="w-full h-7 px-2 pr-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-0 text-xs appearance-none cursor-pointer focus:ring-1 focus:ring-indigo-500"
            >
              <option value="manual">{language === 'zh-CN' ? '手动滑块 (Manual)' : 'Manual'}</option>
              <option value="milestones">{language === 'zh-CN' ? '里程碑进度 (Milestones)' : 'Milestones'}</option>
              <option value="taskCompletion">{language === 'zh-CN' ? '任务完成率 (Task %)' : 'Task %'}</option>
              <option value="metricTarget">{language === 'zh-CN' ? '数值指标 (Metric Target)' : 'Metric Target'}</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
          </div>
        </div>

        {/* Progress Mode Help Box */}
        <div className="text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg leading-relaxed">
          {progressMode === 'milestones'
            ? (language === 'zh-CN' ? '里程碑驱动：根据关联项目中已完成的里程碑比例自动计算进度，适合阶段性交付目标。' : 'Milestones: Auto-calculated from completed milestones in linked projects.')
            : progressMode === 'taskCompletion'
              ? (language === 'zh-CN' ? '任务完成度：根据关联项目中已完成的任务比例自动实时更新进度，适合执行任务明确的目标。' : 'Tasks: Auto-derived from completed task ratio across linked projects.')
              : progressMode === 'manual'
                ? (language === 'zh-CN' ? '手动控制：由您手动调整 0%~100% 进度，适用于定性评估、习惯养成或非任务驱动的目标。' : 'Manual: Adjust 0%-100% directly via slider. Best for habit or qualitative outcomes.')
                : (language === 'zh-CN' ? '定量指标：设定量化当前值与目标值（如 12/20 篇），适合关键结果与定量考核。' : 'Metric Target: Track progress towards a quantifiable numerical goal (e.g. 12/20).')}
        </div>

        {/* Manual Progress Slider or Metric Inputs */}
        {progressMode === 'manual' && (
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>{language === 'zh-CN' ? '当前进度' : 'Progress'}</span>
              <span className="font-semibold text-indigo-600 font-mono">{currentProgress}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={currentProgress}
              onChange={(e) => handleProgressChange(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>
        )}

        {progressMode === 'metricTarget' && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-[10px] text-slate-400">{language === 'zh-CN' ? '当前值' : 'Current'}</label>
              <Input
                type="number"
                value={currentProgress}
                onChange={(e) => handleProgressChange(Number(e.target.value))}
                className="h-7 text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400">{language === 'zh-CN' ? '目标值' : 'Target'}</label>
              <Input
                type="number"
                value={targetProgress}
                onChange={(e) => setTargetProgress(Number(e.target.value))}
                onBlur={handleTargetProgressBlur}
                className="h-7 text-xs"
              />
            </div>
          </div>
        )}

        {/* Target Date */}
        <div className="grid grid-cols-3 items-center">
          <span className="text-slate-500">{language === 'zh-CN' ? '目标截止' : 'Target Date'}</span>
          <div className="col-span-2">
            <input
              type="date"
              value={targetDate}
              onChange={(e) => handleTargetDateChange(e.target.value)}
              className="w-full h-7 px-2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-0 text-xs cursor-pointer focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Weekly Focus Toggle */}
        <div className={`flex items-center justify-between p-2.5 rounded-xl border transition-opacity ${
          status === 'completed' || status === 'archived'
            ? 'opacity-60 bg-slate-100/60 dark:bg-slate-800/20 border-slate-200/50 dark:border-slate-800/50 cursor-not-allowed'
            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <div className="flex flex-col">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {language === 'zh-CN' ? '设为本周核心焦点' : 'Weekly Focus'}
              </span>
              {(status === 'completed' || status === 'archived') && (
                <span className="text-[10px] text-slate-400">
                  {language === 'zh-CN' ? '已达成或已归档目标不支持聚焦' : 'Completed/archived goals cannot be focused'}
                </span>
              )}
            </div>
          </div>
          <input
            type="checkbox"
            checked={isWeeklyFocus && status !== 'completed' && status !== 'archived'}
            disabled={status === 'completed' || status === 'archived'}
            onChange={handleToggleWeeklyFocus}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Linked Projects */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
          <Layers className="w-3 h-3" />
          <span>{language === 'zh-CN' ? '关联项目' : 'Linked Projects'} ({linkedProjects.length})</span>
        </div>
        {linkedProjects.length === 0 ? (
          <p className="text-slate-400 text-[11px]">
            {language === 'zh-CN' ? '暂无直接归属此目标的项目。' : 'No projects directly linked.'}
          </p>
        ) : (
          <div className="space-y-1">
            {linkedProjects.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color || '#6366f1' }} />
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{p.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
        <Button
          size="sm"
          variant="danger"
          onClick={handleDelete}
          className="h-7 text-xs gap-1.5 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{language === 'zh-CN' ? '删除目标' : 'Delete Goal'}</span>
        </Button>
      </div>
    </div>
  );
};
