import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useI18n } from '@/core/i18n';
import { Clock, X } from 'lucide-react';
import type { Task, Project } from '@/core/types/domain';

interface CreatePlannedBlockModalProps {
  initialDate: string; // YYYY-MM-DD
  initialStartHour?: number; // 9 for 09:00
  tasks: Task[];
  projects: Project[];
  onSave: (params: {
    title: string;
    startAt: number;
    endAt: number;
    taskId?: string;
    projectId?: string;
  }) => Promise<void>;
  onClose: () => void;
}

export const CreatePlannedBlockModal: React.FC<CreatePlannedBlockModalProps> = ({
  initialDate,
  initialStartHour = 9,
  tasks,
  projects,
  onSave,
  onClose,
}) => {
  const { language } = useI18n();
  const [title, setTitle] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('none');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('none');

  const startHourStr = initialStartHour.toString().padStart(2, '0') + ':00';
  const endHourStr = (initialStartHour + 1).toString().padStart(2, '0') + ':00';

  const [dateStr, setDateStr] = useState(initialDate);
  const [startTimeStr, setStartTimeStr] = useState(startHourStr);
  const [endTimeStr, setEndTimeStr] = useState(endHourStr);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const startDateTime = new Date(`${dateStr}T${startTimeStr}:00`).getTime();
      const endDateTime = new Date(`${dateStr}T${endTimeStr}:00`).getTime();

      const linkedTask = selectedTaskId !== 'none' ? tasks.find((t) => t.id === selectedTaskId) : undefined;
      const finalTitle = title.trim() || linkedTask?.title || (language === 'zh-CN' ? '计划时间块' : 'Planned Block');
      const finalProjectId =
        selectedProjectId !== 'none'
          ? selectedProjectId
          : linkedTask?.projectId;

      await onSave({
        title: finalTitle,
        startAt: startDateTime,
        endAt: endDateTime > startDateTime ? endDateTime : startDateTime + 3600000,
        taskId: linkedTask?.id,
        projectId: finalProjectId,
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
        className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 animate-in zoom-in-98 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {language === 'zh-CN' ? '规划时间块' : 'Plan Time Block'}
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

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Link to task */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {language === 'zh-CN' ? '关联任务' : 'Link Task'}{' '}
              <span className="text-slate-400 font-normal">
                {language === 'zh-CN' ? '(可选)' : '(Optional)'}
              </span>
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full h-8 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 border-0 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="none">
                {language === 'zh-CN' ? '无关联任务 (独立时间块)' : 'No task (Stand-alone Block)'}
              </option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          {/* Block Title */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {language === 'zh-CN' ? '时间块名称' : 'Block Title'}
            </label>
            <Input
              type="text"
              placeholder={language === 'zh-CN' ? '例如: 深度专注' : 'e.g. Deep Work Focus'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Date */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {language === 'zh-CN' ? '日期' : 'Date'}
            </label>
            <Input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              required
            />
          </div>

          {/* Start and End Times */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {language === 'zh-CN' ? '开始时间' : 'Start Time'}
              </label>
              <Input
                type="time"
                value={startTimeStr}
                onChange={(e) => setStartTimeStr(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {language === 'zh-CN' ? '结束时间' : 'End Time'}
              </label>
              <Input
                type="time"
                value={endTimeStr}
                onChange={(e) => setEndTimeStr(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Project */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {language === 'zh-CN' ? '归属项目' : 'Project'}{' '}
              <span className="text-slate-400 font-normal">
                {language === 'zh-CN' ? '(可选)' : '(Optional)'}
              </span>
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full h-8 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 border-0 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="none">
                {language === 'zh-CN' ? '默认 / 无归属项目' : 'Default / None'}
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button size="sm" variant="ghost" type="button" onClick={onClose} className="cursor-pointer">
              {language === 'zh-CN' ? '取消' : 'Cancel'}
            </Button>
            <Button size="sm" variant="primary" type="submit" disabled={isSubmitting} className="cursor-pointer">
              {language === 'zh-CN' ? '创建时间块' : 'Create Block'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
