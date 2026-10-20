import React, { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { nativeService } from '@/services/nativeService';

export const GlobalKeyboardShortcuts: React.FC = () => {
  const { language } = useI18n();
  const {
    toggleCommandMenu,
    toggleInstantCapture,
    toggleQuickTaskHUD,
    openQuickTaskHUD,
    undoLastToast,
    toggleSidebar,
    addToast,
  } = useUIStore();

  useEffect(() => {
    // 手机端没有物理键盘：禁用全部快捷键逻辑，避免单键 c / [ 抢字符输入、
    // 以及全局 paste 拦截在触屏上误触发速记面板
    if (nativeService.isNative()) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        document.activeElement?.getAttribute('contenteditable') === 'true';

      // Ctrl/Cmd + K -> Command Palette
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'k' || e.code === 'KeyK')) {
        e.preventDefault();
        toggleCommandMenu();
        return;
      }

      // Ctrl/Cmd + Shift + Space or Shift + Space -> Instant Raw Inbox Capture
      if (e.shiftKey && (e.code === 'Space' || e.key === ' ')) {
        e.preventDefault();
        toggleInstantCapture();
        return;
      }

      // Ctrl/Cmd + Z -> Global Undo (when not in active input)
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'z' || e.code === 'KeyZ') && !isInput) {
        e.preventDefault();
        undoLastToast();
        return;
      }

      // 'c' key -> Natural Language Quick Task Creator HUD (when not in active input)
      if ((e.key.toLowerCase() === 'c' || e.code === 'KeyC') && !isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        toggleQuickTaskHUD();
        return;
      }

      // [ key -> Toggle sidebar (when not typing in an input)
      if (e.key === '[' && !isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        toggleSidebar();
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      const isInput =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        document.activeElement?.getAttribute('contenteditable') === 'true';

      // Only intercept paste when user is NOT focusing a text input
      if (!isInput && e.clipboardData) {
        const text = e.clipboardData.getData('text/plain')?.trim();
        if (text && text.length > 0) {
          e.preventDefault();
          openQuickTaskHUD(text);
          addToast({
            message: language === 'zh-CN' ? '已自动从剪贴板载入任务速记' : 'Loaded task from clipboard',
            type: 'info',
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paste', handlePaste);
    };
  }, [toggleCommandMenu, toggleInstantCapture, toggleQuickTaskHUD, openQuickTaskHUD, undoLastToast, toggleSidebar, addToast, language]);

  return null;
};
