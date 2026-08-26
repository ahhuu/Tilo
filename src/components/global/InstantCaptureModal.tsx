import React, { useState, useEffect, useRef } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { Button } from '@/components/ui/Button';
import { Kbd } from '@/components/ui/Kbd';
import { Sparkles, CornerDownLeft, X } from 'lucide-react';
import { captureInboxItem } from '@/services/inboxCommands';

export const InstantCaptureModal: React.FC = () => {
  const { language } = useI18n();
  const { instantCaptureOpen, closeInstantCapture, addToast } = useUIStore();
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (instantCaptureOpen) {
      setContent('');
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
          ? `已快速收集至收集箱: "${trimmed.slice(0, 24)}${trimmed.length > 24 ? '...' : ''}"`
          : `Captured to Inbox: "${trimmed.slice(0, 24)}${trimmed.length > 24 ? '...' : ''}"`,
        type: 'success',
      });
      setContent('');
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
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-28 bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={closeInstantCapture}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-98 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{language === 'zh-CN' ? '闪念快速收集' : 'Instant Capture'}</span>
          </div>
          <button
            type="button"
            onClick={closeInstantCapture}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <textarea
            ref={textareaRef}
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={language === 'zh-CN' ? '快速记录灵感、想法或待办至收集箱...' : 'Capture an idea, note, or quick task to Inbox...'}
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-none focus:outline-hidden"
          />

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{language === 'zh-CN' ? '保存' : 'Save'}: <Kbd>↵ Enter</Kbd></span>
              <span>{language === 'zh-CN' ? '取消' : 'Cancel'}: <Kbd>ESC</Kbd></span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={closeInstantCapture} className="cursor-pointer">
                {language === 'zh-CN' ? '取消' : 'Cancel'}
              </Button>
              <Button size="sm" variant="primary" type="submit" disabled={!content.trim()} className="cursor-pointer">
                <CornerDownLeft className="w-3.5 h-3.5 mr-1" />
                {language === 'zh-CN' ? '收集' : 'Capture'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
