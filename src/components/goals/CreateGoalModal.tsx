import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useI18n } from '@/core/i18n';
import { Target, Calendar, Sparkles } from 'lucide-react';
import type { GoalProgressMode } from '@/core/types/domain';

interface CreateGoalModalProps {
  onSave: (params: {
    title: string;
    description?: string;
    color: string;
    progressMode: GoalProgressMode;
    targetProgress?: number;
    targetDate?: string;
    isWeeklyFocus: boolean;
  }) => Promise<void>;
  onClose: () => void;
}

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

export const CreateGoalModal: React.FC<CreateGoalModalProps> = ({ onSave, onClose }) => {
  const { language } = useI18n();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [progressMode, setProgressMode] = useState<GoalProgressMode>('milestones');
  const [targetDate, setTargetDate] = useState('');
  const [isWeeklyFocus, setIsWeeklyFocus] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        color,
        progressMode,
        targetDate: targetDate || undefined,
        isWeeklyFocus,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      ariaLabel={language === 'zh-CN' ? '新建战略目标' : 'Create New Goal'}
      title={
        <span className="flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          {language === 'zh-CN' ? '新建战略目标' : 'Create New Goal'}
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {language === 'zh-CN' ? '目标名称' : 'Goal Title'}
            </label>
            <Input
              type="text"
              placeholder={language === 'zh-CN' ? '例如: 发布产品 V1 正式版本' : 'e.g. Ship Product V1 Release'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {language === 'zh-CN' ? '目标描述' : 'Description'}{' '}
              <span className="text-slate-400 font-normal">
                {language === 'zh-CN' ? '(可选)' : '(Optional)'}
              </span>
            </label>
            <textarea
              rows={2}
              placeholder={language === 'zh-CN' ? '为什么这项成果至关重要...' : 'Why this outcome matters...'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden resize-none"
            />
          </div>

          {/* Color Presets */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {language === 'zh-CN' ? '主题色彩' : 'Theme Color'}
            </label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                    color === c ? 'scale-120 ring-2 ring-offset-2 ring-indigo-500' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Progress Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {language === 'zh-CN' ? '进度追踪方式' : 'Progress Tracking Mode'}
            </label>
            <select
              value={progressMode}
              onChange={(e) => setProgressMode(e.target.value as GoalProgressMode)}
              className="w-full h-8 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 border-0 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="milestones">
                {language === 'zh-CN' ? '里程碑驱动 (由项目里程碑计算)' : 'Milestones (Derived from project milestones)'}
              </option>
              <option value="taskCompletion">
                {language === 'zh-CN' ? '任务完成度 (根据关联任务完成数)' : 'Tasks (Derived from completed task count)'}
              </option>
              <option value="manual">
                {language === 'zh-CN' ? '手动控制 (百分比滑块)' : 'Manual (Direct percentage slider)'}
              </option>
              <option value="metricTarget">
                {language === 'zh-CN' ? '定量指标 (目标数值达成度)' : 'Metric (Quantitative target)'}
              </option>
            </select>
            <p className="text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg leading-relaxed">
              {progressMode === 'milestones'
                ? (language === 'zh-CN' ? '里程碑驱动：根据关联项目中已完成的里程碑比例自动计算进度，适合阶段性交付目标。' : 'Milestones: Auto-calculated from completed milestones in linked projects.')
                : progressMode === 'taskCompletion'
                  ? (language === 'zh-CN' ? '任务完成度：根据关联项目中已完成的任务比例自动实时更新进度，适合执行任务明确的目标。' : 'Tasks: Auto-derived from completed task ratio across linked projects.')
                  : progressMode === 'manual'
                    ? (language === 'zh-CN' ? '手动控制：由您手动调整 0%~100% 进度，适用于定性评估、习惯养成或非任务驱动的目标。' : 'Manual: Adjust 0%-100% directly via slider. Best for habit or qualitative outcomes.')
                    : (language === 'zh-CN' ? '定量指标：设定量化当前值与目标值（如 12/20 篇），适合关键结果与定量考核。' : 'Metric Target: Track progress towards a quantifiable numerical goal (e.g. 12/20).')}
            </p>
          </div>

          {/* Target Date */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{language === 'zh-CN' ? '目标达成截止日期' : 'Target Completion Date'}</span>
            </label>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          {/* Weekly Focus Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                  {language === 'zh-CN' ? '设为本周核心聚焦目标' : 'Set as Weekly Focus'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === 'zh-CN' ? '在当周顶部核心目标看板中高亮展示' : 'Highlight this outcome in the current week header'}
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isWeeklyFocus}
              onChange={(e) => setIsWeeklyFocus(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button size="sm" variant="ghost" type="button" onClick={onClose} className="cursor-pointer">
              {language === 'zh-CN' ? '取消' : 'Cancel'}
            </Button>
            <Button size="sm" variant="primary" type="submit" disabled={isSubmitting || !title.trim()} className="cursor-pointer">
              {language === 'zh-CN' ? '创建目标' : 'Create Goal'}
            </Button>
          </div>
        </form>
    </Modal>
  );
};
