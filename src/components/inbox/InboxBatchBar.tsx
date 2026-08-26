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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2.5 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-4 duration-200">
      <span className="text-xs font-semibold text-slate-300">
        {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
      </span>

      <div className="w-px h-4 bg-slate-700" />

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={onBatchSomeday}
          className="h-7 text-xs text-slate-200 hover:text-white hover:bg-slate-800"
        >
          <Clock className="w-3.5 h-3.5 mr-1" />
          Someday
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={onBatchArchive}
          className="h-7 text-xs text-slate-200 hover:text-white hover:bg-slate-800"
        >
          <Archive className="w-3.5 h-3.5 mr-1" />
          Archive
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={onBatchDelete}
          className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          Delete
        </Button>
      </div>

      <button
        type="button"
        onClick={onClearSelection}
        className="p-1 rounded text-slate-400 hover:text-slate-200 ml-1"
        title="Clear Selection"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
