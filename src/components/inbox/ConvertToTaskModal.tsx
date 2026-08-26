import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { timeService } from '@/core/time/timeService';
import { useI18n } from '@/core/i18n';
import { CheckSquare, X, Calendar, Clock } from 'lucide-react';
import type { InboxItem, Project, PriorityLevel } from '@/core/types/domain';

interface ConvertToTaskModalProps {
  item: InboxItem;
  projects: Project[];
  onConvert: (params: {
    title: string;
    projectId?: string;
    scheduledDate?: string;
    priority?: PriorityLevel;
    estimateMinutes?: number;
  }) => Promise<void>;
  onClose: () => void;
}

export const ConvertToTaskModal: React.FC<ConvertToTaskModalProps> = ({
  item,
  projects,
  onConvert,
  onClose,
}) => {
  const { language } = useI18n();
  const [title, setTitle] = useState(item.rawText);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('none');
  const [scheduledDate, setScheduledDate] = useState<string>(timeService.getLogicalDate());
  const [priority, setPriority] = useState<PriorityLevel>('none');
  const [estimateMinutes, setEstimateMinutes] = useState<number | undefined>(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onConvert({
        title: title.trim(),
        projectId: selectedProjectId !== 'none' ? selectedProjectId : undefined,
        scheduledDate: scheduledDate || undefined,
        priority,
        estimateMinutes,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 animate-in zoom-in-98 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {language === 'zh-CN' ? '转化为待办任务' : 'Convert to Task'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {language === 'zh-CN' ? '任务标题' : 'Task Title'}
            </label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {language === 'zh-CN' ? '归属项目' : 'Project'}
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full h-8 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 border-0 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="none">{language === 'zh-CN' ? '无归属项目' : 'No Project'}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {language === 'zh-CN' ? '优先级' : 'Priority'}
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full h-8 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 border-0 focus:ring-1 focus:ring-indigo-500 capitalize cursor-pointer"
              >
                <option value="none">{language === 'zh-CN' ? '无' : 'None'}</option>
                <option value="low">{language === 'zh-CN' ? '低 (Low)' : 'Low'}</option>
                <option value="medium">{language === 'zh-CN' ? '中 (Medium)' : 'Medium'}</option>
                <option value="high">{language === 'zh-CN' ? '高 (High)' : 'High'}</option>
                <option value="urgent">{language === 'zh-CN' ? '紧急 (Urgent)' : 'Urgent'}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{language === 'zh-CN' ? '排期日期' : 'Scheduled Date'}</span>
              </label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{language === 'zh-CN' ? '预估工时 (分钟)' : 'Estimate (mins)'}</span>
              </label>
              <Input
                type="number"
                min={0}
                step={15}
                value={estimateMinutes || ''}
                onChange={(e) =>
                  setEstimateMinutes(e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder={language === 'zh-CN' ? '例如: 30' : 'e.g. 30'}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button size="sm" variant="ghost" type="button" onClick={onClose} className="cursor-pointer">
              {language === 'zh-CN' ? '取消' : 'Cancel'}
            </Button>
            <Button size="sm" variant="primary" type="submit" disabled={isSubmitting || !title.trim()} className="cursor-pointer">
              {language === 'zh-CN' ? '确认转化为任务' : 'Convert to Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
