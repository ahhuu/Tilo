import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { InspectorShell } from '@/components/global/InspectorShell';
import { CommandMenu } from '@/components/global/CommandMenu';
import { InstantCaptureModal } from '@/components/global/InstantCaptureModal';
import { FloatingTimer } from '@/components/global/FloatingTimer';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { GlobalKeyboardShortcuts } from '@/components/global/GlobalKeyboardShortcuts';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <GlobalKeyboardShortcuts />

      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header />

        {/* Workspace Body + Inspector */}
        <div className="flex flex-1 min-h-0 overflow-hidden relative">
          <main className="flex-1 overflow-y-auto min-w-0">
            <Outlet />
          </main>

          {/* Reusable Inspector Panel */}
          <InspectorShell />
        </div>
      </div>

      {/* Global Overlays and Modals */}
      <CommandMenu />
      <InstantCaptureModal />
      <FloatingTimer />
      <ToastContainer />
    </div>
  );
};

export default AppLayout;
