import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useI18n } from '@/core/i18n';
import { Calendar, X, Tag } from 'lucide-react';

const RESCHEDULE_REASONS_KEY = 'tilo_reschedule_reasons';
const DEFAULT_RESCHEDULE_REASONS = [
  '优先级变动 (Priorities shifted)',
  '低估工作量 (Underestimated effort)',
  '外部阻塞 (External blocker / dependency)',
  '紧急打断 (Urgent interruption)',
  '精力不足 (Low energy / fatigue)',
  '范围变更 (Scope changed)',
];

interface RescheduleDialogProps {
  currentDate?: string;
  onReschedule: (newDate: string, reason?: string) => Promise<void>;
  onClose: () => void;
}

export const RescheduleDialog: React.FC<RescheduleDialogProps> = ({
  currentDate,
  onReschedule,
  onClose,
}) => {
  const { language } = useI18n();
  const [newDate, setNewDate] = useState(currentDate || new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [availableReasons] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RESCHEDULE_REASONS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_RESCHEDULE_REASONS;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) return;

    setIsSubmitting(true);
    try {
      await onReschedule(newDate, reason.trim() || undefined);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectReasonChip = (rName: string) => {
    if (reason === rName) {
      setReason('');
    } else {
      setReason(rName);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      ariaLabel={language === 'zh-CN' ? '重新排期任务' : 'Reschedule Task'}
      maxWidthClass="sm:max-w-sm"
      bodyClassName="px-0 pb-0"
      header={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {language === 'zh-CN' ? '重新排期任务' : 'Reschedule Task'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {language === 'zh-CN' ? '排期日期' : 'Scheduled Date'}
          </label>
          <Input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-400" />
              <span>{language === 'zh-CN' ? '选择调整原因' : 'Select Reason'}</span>
            </label>
            <span className="text-[11px] text-slate-400 font-normal">
              {language === 'zh-CN' ? '一键归因' : 'One-click'}
            </span>
          </div>

          {/* Quick Reason Chips */}
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-0.5 scrollbar-thin">
            {availableReasons.map((r, idx) => {
              const isSelected = reason === r;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectReasonChip(r)}
                  className={`px-2 py-1 rounded-md text-[11px] transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-medium shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>

          <Input
            type="text"
            placeholder={language === 'zh-CN' ? '或手动输入自定义原因...' : 'Or enter custom reason...'}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="text-xs"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={async () => {
              setIsSubmitting(true);
              try {
                await onReschedule('', reason.trim() || undefined);
                onClose();
              } finally {
                setIsSubmitting(false);
              }
            }}
            disabled={isSubmitting}
            className="text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border-red-200 dark:border-red-900/60 cursor-pointer"
          >
            {language === 'zh-CN' ? '设为未排期' : 'Unschedule'}
          </Button>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" type="button" onClick={onClose} className="cursor-pointer">
              {language === 'zh-CN' ? '取消' : 'Cancel'}
            </Button>
            <Button size="sm" variant="primary" type="submit" disabled={isSubmitting || !newDate} className="cursor-pointer">
              {language === 'zh-CN' ? '保存' : 'Save'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
