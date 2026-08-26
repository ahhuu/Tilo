import React, { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';

export const GlobalKeyboardShortcuts: React.FC = () => {
  const {
    toggleCommandMenu,
    toggleInstantCapture,
    undoLastToast,
    toggleSidebar,
  } = useUIStore();

  useEffect(() => {
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

      // Ctrl/Cmd + Shift + Space -> Instant Capture
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.code === 'Space' || e.key === ' ')) {
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

      // [ key -> Toggle sidebar (when not typing in an input)
      if (e.key === '[' && !isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCommandMenu, toggleInstantCapture, undoLastToast, toggleSidebar]);

  return null;
};
