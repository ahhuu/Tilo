import React from 'react';
import { Button } from '@/components/ui/Button';
import { Archive, Clock, Trash2, X } from 'lucide-react';

interface InboxBatchBarProps {
  selectedCount: number;
  onBatchArchive: () => Promise<void>;
  onBatchSomeday: () => Promise<void>;
  onBatchDelete: () => Promise<void>;
  onClearSelection: () => void;
}

export const InboxBatchBar: React.FC<InboxBatchBarProps> = ({
  selectedCount,
  onBatchArchive,
  onBatchSomeday,
  onBatchDelete,
  onClearSelection,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed inset-x-3 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 bottom-[calc(env(safe-area-inset-bottom,0px)+4.25rem)] md:bottom-6 z-50 flex items-center justify-between md:justify-start gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-4 duration-200">
      <span className="text-xs font-semibold text-slate-300 shrink-0 truncate">
        {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
      </span>

      <div className="w-px h-4 bg-slate-700 shrink-0" />

      {/* 手机上收为图标按钮（44×44 命中区），避免三个带文字按钮撑破窄屏 */}
      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={onBatchSomeday}
          aria-label="Someday"
          title="Someday"
          className="min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 h-11 w-11 sm:h-7 sm:w-auto px-0 sm:px-3 justify-center text-xs text-slate-200 hover:text-white hover:bg-slate-800"
        >
          <Clock className="w-4 h-4 sm:w-3.5 sm:h-3.5 sm:mr-1" />
          <span className="hidden sm:inline">Someday</span>
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={onBatchArchive}
          aria-label="Archive"
          title="Archive"
          className="min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 h-11 w-11 sm:h-7 sm:w-auto px-0 sm:px-3 justify-center text-xs text-slate-200 hover:text-white hover:bg-slate-800"
        >
          <Archive className="w-4 h-4 sm:w-3.5 sm:h-3.5 sm:mr-1" />
          <span className="hidden sm:inline">Archive</span>
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={onBatchDelete}
          aria-label="Delete"
          title="Delete"
          className="min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 h-11 w-11 sm:h-7 sm:w-auto px-0 sm:px-3 justify-center text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40"
        >
          <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 sm:mr-1" />
          <span className="hidden sm:inline">Delete</span>
        </Button>
      </div>

      <button
        type="button"
        onClick={onClearSelection}
        aria-label="Clear Selection"
        className="min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 flex items-center justify-center p-1 rounded text-slate-400 hover:text-slate-200 ml-auto sm:ml-1 shrink-0"
        title="Clear Selection"
      >
        <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
      </button>
    </div>
  );
};
