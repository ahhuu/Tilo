import React from 'react';
import { useUIStore, type ToastItem } from '@/stores/uiStore';
import { Button } from './Button';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUIStore();

  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Notifications"
      className="fixed inset-x-3 md:inset-x-auto md:right-4 bottom-[calc(env(safe-area-inset-bottom,0px)+4.25rem)] md:bottom-4 z-[60] flex flex-col gap-2 md:max-w-sm md:w-full pointer-events-none select-none"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </aside>
  );
};

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: () => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast, onDismiss }) => {
  const icons = {
    info: <Info className="w-4 h-4 text-blue-500 shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />,
  };

  const type = toast.type || 'info';

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-lg text-sm text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-bottom-3 duration-200'
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {icons[type]}
        <span className="truncate text-xs font-medium">{toast.message}</span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {toast.undoAction && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
            onClick={() => {
              toast.undoAction?.();
              onDismiss();
            }}
          >
            Undo
          </Button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          aria-label="Close notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
