import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useI18n } from '@/core/i18n';
import { Modal } from '@/components/ui/Modal';
import { FolderDot, Pin, Target } from 'lucide-react';
import type { Goal } from '@/core/types/domain';

interface CreateProjectModalProps {
  goals: Goal[];
  onSave: (params: {
    name: string;
    description?: string;
    color: string;
    primaryGoalId?: string;
    relatedGoalIds?: string[];
    isPinned: boolean;
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

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  goals,
  onSave,
  onClose,
}) => {
  const { language } = useI18n();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [primaryGoalId, setPrimaryGoalId] = useState<string>('none');
  const [relatedGoalIds, setRelatedGoalIds] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleRelatedGoal = (goalId: string) => {
    setRelatedGoalIds((prev) =>
      prev.includes(goalId) ? prev.filter((id) => id !== goalId) : [...prev, goalId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        primaryGoalId: primaryGoalId !== 'none' ? primaryGoalId : undefined,
        relatedGoalIds: relatedGoalIds.filter((id) => id !== primaryGoalId),
        isPinned,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      ariaLabel={language === 'zh-CN' ? '新建项目' : 'Create New Project'}
      title={
        <span className="flex items-center gap-2">
          <FolderDot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          {language === 'zh-CN' ? '新建项目' : 'Create New Project'}
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {language === 'zh-CN' ? '项目名称' : 'Project Name'}
            </label>
            <Input
              type="text"
              placeholder={language === 'zh-CN' ? '例如: 设计系统 V2、官网改版...' : 'e.g. Design System V2'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {language === 'zh-CN' ? '项目描述与范围' : 'Description'}{' '}
              <span className="text-slate-400 font-normal">{language === 'zh-CN' ? '(可选)' : '(Optional)'}</span>
            </label>
            <textarea
              rows={2}
              placeholder={language === 'zh-CN' ? '输入项目交付目标与范围...' : 'Project purpose and scope...'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden resize-none"
            />
          </div>

          {/* Color Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {language === 'zh-CN' ? '项目标识色' : 'Project Color'}
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

          {/* Primary Goal */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {language === 'zh-CN' ? '归属主目标' : 'Primary Goal'}{' '}
              <span className="text-slate-400 font-normal">{language === 'zh-CN' ? '(主要战略驱动)' : '(Optional)'}</span>
            </label>
            <select
              value={primaryGoalId}
              onChange={(e) => setPrimaryGoalId(e.target.value)}
              className="w-full h-8 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 border-0 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="none">{language === 'zh-CN' ? '独立项目 (不绑定主目标)' : 'Standalone Project (No Goal)'}</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>

          {/* Related Goals Multi-Select */}
          {goals.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-slate-400" />
                <span>{language === 'zh-CN' ? '次要 / 关联目标' : 'Related Goals'}</span>
                <span className="text-slate-400 font-normal">{language === 'zh-CN' ? '(多选协同推进)' : '(Optional)'}</span>
              </label>
              <div className="space-y-1 max-h-28 overflow-y-auto p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
                {goals
                  .filter((g) => g.id !== primaryGoalId)
                  .map((g) => {
                    const isChecked = relatedGoalIds.includes(g.id);
                    return (
                      <label
                        key={g.id}
                        className="flex items-center gap-2 py-1 px-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRelatedGoal(g.id)}
                          className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: g.color || '#6366f1' }} />
                        <span className="text-slate-800 dark:text-slate-200 truncate">{g.title}</span>
                      </label>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Pin in sidebar toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Pin className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                {language === 'zh-CN' ? '固定在侧边栏导航' : 'Pin to Sidebar'}
              </span>
            </div>
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button size="sm" variant="ghost" type="button" onClick={onClose} className="cursor-pointer">
              {language === 'zh-CN' ? '取消' : 'Cancel'}
            </Button>
            <Button size="sm" variant="primary" type="submit" disabled={isSubmitting || !name.trim()} className="cursor-pointer">
              {language === 'zh-CN' ? '创建项目' : 'Create Project'}
            </Button>
          </div>
        </form>
    </Modal>
  );
};
