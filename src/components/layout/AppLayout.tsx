import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';
import { InspectorShell } from '@/components/global/InspectorShell';
import { CommandMenu } from '@/components/global/CommandMenu';
import { InstantCaptureModal } from '@/components/global/InstantCaptureModal';
import { QuickCaptureHUD } from '@/components/global/QuickCaptureHUD';
import { FloatingTimer } from '@/components/global/FloatingTimer';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { GlobalKeyboardShortcuts } from '@/components/global/GlobalKeyboardShortcuts';
import { useUIStore } from '@/stores/uiStore';

export const AppLayout: React.FC = () => {
  const { quickTaskHUDOpen, closeQuickTaskHUD } = useUIStore();

  return (
    // 100dvh：Android WebView 沉浸式 + 手势条下，100vh ≠ 实际可视高度
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <GlobalKeyboardShortcuts />

      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header />

        {/* Workspace Body + Inspector */}
        <div className="flex flex-1 min-h-0 overflow-hidden relative">
          {/* 底部留白单一来源：移动端底部导航 56px + 安全区 + 呼吸间距。
              各页面不要再自行写死 pb-20/pb-24，否则两处不一致会互相打架。 */}
          <main className="flex-1 overflow-y-auto min-w-0 overscroll-contain pb-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] md:pb-0">
            <Outlet />
          </main>

          {/* Reusable Inspector Panel */}
          <InspectorShell />
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav />

      {/* Global Overlays and Modals */}
      <CommandMenu />
      <InstantCaptureModal />
      <QuickCaptureHUD
        isOpen={quickTaskHUDOpen}
        onClose={closeQuickTaskHUD}
      />
      <FloatingTimer />
      <ToastContainer />
    </div>
  );
};

export default AppLayout;
