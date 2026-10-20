import React, { useState, useEffect, useRef } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { Button } from '@/components/ui/Button';
import { Kbd } from '@/components/ui/Kbd';
import { Sparkles, CornerDownLeft } from 'lucide-react';
import { captureInboxItem } from '@/services/inboxCommands';
import { BottomSheet } from '@/components/ui/BottomSheet';

export const InstantCaptureModal: React.FC = () => {
  const { language } = useI18n();
  const { instantCaptureOpen, closeInstantCapture, addToast } = useUIStore();
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (instantCaptureOpen) {
      setContent('');
      // 输入框为非受控（IME 友好），重置时需同步写回 DOM
      if (textareaRef.current) textareaRef.current.value = '';
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [instantCaptureOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    try {
      await captureInboxItem({ rawText: trimmed });
      addToast({
        message: language === 'zh-CN'
          ? `已放入收集箱（待分流整理）: "${trimmed.slice(0, 20)}${trimmed.length > 20 ? '...' : ''}"`
          : `Saved to Inbox (Ready for triage): "${trimmed.slice(0, 20)}${trimmed.length > 20 ? '...' : ''}"`,
        type: 'success',
      });
      setContent('');
      if (textareaRef.current) textareaRef.current.value = '';
      closeInstantCapture();
    } catch (err) {
      console.error('Failed to capture:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      closeInstantCapture();
    }
  };

  if (!instantCaptureOpen) return null;

  return (
    <BottomSheet
      isOpen={true}
      onClose={closeInstantCapture}
      ariaLabel={language === 'zh-CN' ? '闪念快速收集' : 'Instant Capture'}
      maxWidthClass="sm:max-w-lg"
      scrollable={false}
      title={
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>{language === 'zh-CN' ? '闪念快速收集' : 'Instant Capture'}</span>
        </span>
      }
    >
      <div className="pb-3">
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            ref={textareaRef}
            rows={3}
            defaultValue={content}
            onChange={(e) => setContent(e.target.value)}
            onCompositionEnd={(e) => setContent(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            placeholder={language === 'zh-CN' ? '零阻力记录闪念、碎片想法或临时事项（保存后进入收集箱待后续统一分流整理）...' : 'Dump a raw idea, snippet, or thought (saved to Inbox for later triage)...'}
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-none focus:outline-hidden"
          />

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* 手机端没有物理键盘，隐藏快捷键提示 */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span>{language === 'zh-CN' ? '保存' : 'Save'}: <Kbd>↵ Enter</Kbd></span>
              <span>{language === 'zh-CN' ? '取消' : 'Cancel'}: <Kbd>ESC</Kbd></span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="md" variant="ghost" onClick={closeInstantCapture} className="min-h-11 cursor-pointer">
                {language === 'zh-CN' ? '取消' : 'Cancel'}
              </Button>
              <Button size="md" variant="primary" type="submit" disabled={!content.trim()} className="min-h-11 cursor-pointer">
                <CornerDownLeft className="w-3.5 h-3.5 mr-1" />
                {language === 'zh-CN' ? '收集' : 'Capture'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </BottomSheet>
  );
};
