import React, { useEffect } from 'react';
import { DesktopWidgetContainer } from '@/components/widget/DesktopWidgetContainer';
import { useUIStore } from '@/stores/uiStore';

export const WidgetPage: React.FC = () => {
  const { theme } = useUIStore();

  useEffect(() => {
    document.title = 'Tilo 桌面挂件';
    const root = document.documentElement;
    // 允许挂件窗口透明穿透
    document.body.style.backgroundColor = 'transparent';
    root.style.backgroundColor = 'transparent';

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden">
      <DesktopWidgetContainer />
    </div>
  );
};

export default WidgetPage;
