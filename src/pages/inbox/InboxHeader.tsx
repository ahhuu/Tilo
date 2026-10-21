import React from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/core/i18n';

/** 收件箱页头：标题、快捷键说明、连续整理与新建入口。 */
export const InboxHeader: React.FC<{
  unsortedCount: number;
  onOpenContinuous: () => void;
  onOpenCapture: () => void;
}> = ({ unsortedCount, onOpenContinuous, onOpenCapture }) => {
  const { t, language } = useI18n();

  return (
    <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-4">
      <div className="min-w-0 flex-1">
        <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {t('inbox.title')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">
          {language === 'zh-CN'
            ? '全局想法快速收集与分流中心 • 快捷键：P 连续整理，J/K 上下选择，T 转任务，N 转笔记，S 移入 Someday，E 归档'
            : 'Universal capture and thought processing hub • Keyboard: P process mode, J/K navigate, T task, N note, S someday, E archive'}
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 sm:hidden truncate">
          {language === 'zh-CN' ? '全局想法快速收集与分流中心' : 'Capture & triage center'}
        </p>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {unsortedCount > 0 && (
          <Button
            size="sm"
            variant="secondary"
            onClick={onOpenContinuous}
            className="border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/60 cursor-pointer whitespace-nowrap shrink-0 px-2 sm:px-3 h-8 text-xs"
          >
            <Sparkles className="w-3.5 h-3.5 sm:mr-1.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="hidden sm:inline">
              {language === 'zh-CN' ? '连续整理 (P)' : 'Process Inbox (P)'}
            </span>
            <span className="sm:hidden">{language === 'zh-CN' ? '整理' : 'Process'}</span>
            <span className="ml-1 sm:ml-1.5 px-1.5 py-0.2 rounded-full bg-indigo-200/70 dark:bg-indigo-900/70 text-[10px] font-semibold">
              {unsortedCount}
            </span>
          </Button>
        )}

        <Button
          size="sm"
          variant="primary"
          onClick={onOpenCapture}
          className="cursor-pointer whitespace-nowrap shrink-0 px-2.5 sm:px-3 h-8 text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1 shrink-0" />
          <span>{language === 'zh-CN' ? '新建条目' : 'Add Item'}</span>
        </Button>
      </div>
    </div>
  );
};
