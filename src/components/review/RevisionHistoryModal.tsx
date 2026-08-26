import React from 'react';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/core/i18n';
import { History, X } from 'lucide-react';
import type { ReviewRevision, Review } from '@/core/types/domain';

interface RevisionHistoryModalProps {
  revision: ReviewRevision;
  review?: Review;
  onClose: () => void;
}

export const RevisionHistoryModal: React.FC<RevisionHistoryModalProps> = ({
  revision,
  review,
  onClose,
}) => {
  const { language } = useI18n();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in zoom-in-98 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {language === 'zh-CN' ? '历史版本' : 'Revision'} #{revision.revision} • {review?.type === 'daily' ? (language === 'zh-CN' ? '每日复盘' : 'Daily Close') : (language === 'zh-CN' ? '每周复盘' : 'Weekly Review')} ({review?.periodKey})
              </h3>
              <p className="text-[11px] text-slate-400">
                {language === 'zh-CN' ? `封存时间: ${new Date(revision.createdAt).toLocaleString('zh-CN')}` : `Sealed on ${new Date(revision.createdAt).toLocaleString()}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Story Text */}
        {revision.storyText && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              {language === 'zh-CN' ? '叙事复盘故事' : 'Narrative Story'}
            </span>
            <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-mono">
              {revision.storyText}
            </p>
          </div>
        )}

        {/* Snapshot Raw JSON */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            {language === 'zh-CN' ? '不可变快照原始载荷 (JSON)' : 'Immutable Snapshot Payload'}
          </span>
          <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48">
            {JSON.stringify(revision.snapshotJson, null, 2)}
          </pre>
        </div>

        {/* Reflection */}
        {revision.reflectionJson ? (
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              {language === 'zh-CN' ? '反思数据明细' : 'Reflection Data'}
            </span>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-36">
              {JSON.stringify(revision.reflectionJson, null, 2)}
            </pre>
          </div>
        ) : null}

        <div className="flex justify-end pt-2">
          <Button size="sm" variant="ghost" onClick={onClose} className="cursor-pointer">
            {language === 'zh-CN' ? '关闭' : 'Close'}
          </Button>
        </div>
      </div>
    </div>
  );
};
