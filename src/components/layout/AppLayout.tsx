import React, { Suspense } from 'react';
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

/**
 * 懒加载页面的占位骨架。
 *
 * 刻意不用 spinner：Tilo 的视觉语言是克制的（Linear 风格），一个居中的转圈
 * 反而比结构相同的骨架更刺眼，也会造成「先空再跳」的布局抖动。这里用与
 * 页面标题 + 内容块同构的灰条，加载完成时视觉上是「填色」而不是「跳变」。
 * 不写任何文案，避免引入 i18n 依赖。
 */
const RouteFallback: React.FC = () => (
  <div className="p-5 md:p-6 space-y-4 animate-pulse" aria-hidden="true">
    <div className="h-6 w-40 rounded-md bg-slate-200 dark:bg-slate-800" />
    <div className="h-3 w-64 rounded bg-slate-100 dark:bg-slate-800/70" />
    <div className="pt-2 space-y-2.5">
      <div className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800/60" />
      <div className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800/60" />
      <div className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800/60" />
    </div>
  </div>
);

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
            {/* 页面按路由懒加载：加载期只显示极轻的骨架，避免整块布局闪烁。
                放在 Outlet 外层是为了让侧栏 / 顶栏在切换页面时保持不动。 */}
            <Suspense fallback={<RouteFallback />}>
              <Outlet />
            </Suspense>
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
