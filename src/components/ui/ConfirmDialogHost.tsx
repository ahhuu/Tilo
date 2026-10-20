import React, { useEffect, useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertTriangle } from 'lucide-react';
import { useDialogStore } from '@/services/dialogService';

/**
 * 全局确认 / 输入对话框宿主，替代 window.confirm / window.prompt。
 * 需在 App 根组件挂载一次。
 */
export const ConfirmDialogHost: React.FC = () => {
  const request = useDialogStore((s) => s.request);
  const settle = useDialogStore((s) => s.settle);

  const [value, setValue] = useState('');

  // 每次打开时同步默认值
  useEffect(() => {
    if (request) {
      setValue(request.input?.defaultValue ?? '');
    }
  }, [request]);

  if (!request) return null;

  const isPrompt = !!request.input;

  const handleConfirm = () => {
    settle(isPrompt ? value : true);
  };

  const handleCancel = () => {
    settle(isPrompt ? null : false);
  };

  return (
    <BottomSheet
      isOpen={true}
      onClose={handleCancel}
      ariaLabel={request.title}
      maxWidthClass="sm:max-w-sm"
      title={
        <span className="flex items-center gap-2">
          {request.destructive && (
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          )}
          <span className="truncate">{request.title}</span>
        </span>
      }
      description={request.message}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="md" onClick={handleCancel} className="min-h-11">
            {request.cancelLabel ?? '取消'}
          </Button>
          <Button
            variant={request.destructive ? 'danger' : 'primary'}
            size="md"
            onClick={handleConfirm}
            className="min-h-11"
          >
            {request.confirmLabel ?? '确定'}
          </Button>
        </div>
      }
    >
      {isPrompt && (
        <div className="py-1 space-y-1.5">
          {request.input?.label && (
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              {request.input.label}
            </label>
          )}
          <Input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirm();
            }}
            placeholder={request.input?.placeholder}
            inputMode={request.input?.inputMode === 'numeric' ? 'numeric' : 'text'}
            type={request.input?.inputMode === 'numeric' ? 'number' : 'text'}
            className="h-11"
          />
        </div>
      )}
    </BottomSheet>
  );
};

export default ConfirmDialogHost;
