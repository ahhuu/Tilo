import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { TodayPage } from '@/pages/TodayPage';
import { InboxPage } from '@/pages/InboxPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { GoalsPage } from '@/pages/GoalsPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { ReviewPage } from '@/pages/ReviewPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ProjectPage } from '@/pages/ProjectPage';
import { SingleWidgetPage } from '@/pages/SingleWidgetPage';
import { WindowCloseConfirmModal } from '@/components/global/WindowCloseConfirmModal';
import { ConfirmDialogHost } from '@/components/ui/ConfirmDialogHost';
import { ErrorBoundary } from '@/components/global/ErrorBoundary';
import { db, ensureDefaultWorkspace } from '@/storage/db';
import { seedDemoData } from '@/storage/seed';
import { tauriWidgetService } from '@/services/tauriWidgetService';
import { nativeService } from '@/services/nativeService';
import { useUIStore } from '@/stores/uiStore';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

export const App: React.FC = () => {
  const [showCloseModal, setShowCloseModal] = useState(false);
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    // 初始化 Capacitor Android 原生能力（沉浸式状态栏与物理返回键）
    nativeService.initNative();
  }, []);

  useEffect(() => {
    // 主题切换时动态同步 Android 状态栏图标与文字明暗
    nativeService.updateTheme(theme);
  }, [theme]);

  useEffect(() => {
    async function initDB() {
      try {
        await ensureDefaultWorkspace(db);
        const hasInitialized = localStorage.getItem('tilo_has_initialized_seed');
        if (!hasInitialized) {
          localStorage.setItem('tilo_has_initialized_seed', 'true');
          const count = await db.tasks.count();
          if (count === 0) {
            await seedDemoData(db);
          }
        }
      } catch (err) {
        console.warn('Init DB warning:', err);
      }
    }
    initDB();

    // 启动双端局域网同步管理器（内部按平台自动适配：电脑 Tauri / 手机 Capacitor）
    import('@/services/syncManager')
      .then(({ syncManager }) => syncManager.init())
      .catch(() => {});

    // 在 Tauri 桌面端监听主窗口关闭请求
    if (tauriWidgetService.isTauri()) {
      try {
        const win = getCurrentWebviewWindow();
        if (win && win.label === 'main') {
          win.onCloseRequested(async (event) => {
            const pref = tauriWidgetService.getCloseActionPreference();
            if (pref === 'tray') {
              event.preventDefault();
              await win.hide();
            } else if (pref === 'ask') {
              event.preventDefault();
              setShowCloseModal(true);
            }
          });
        }

        // 精准恢复上一次退出或重启前桌面上所有挂件的状态与坐标
        const lastActiveWidgets = tauriWidgetService.getLastActiveWidgetIds();
        const shouldAutoLaunch = tauriWidgetService.isAutoLaunchWidgetsOnStartup();

        if (lastActiveWidgets.length > 0 || shouldAutoLaunch) {
          setTimeout(async () => {
            try {
              let targets = lastActiveWidgets;
              if (targets.length === 0 && shouldAutoLaunch) {
                const { useWidgetStore } = await import('@/stores/widgetStore');
                targets = useWidgetStore.getState().settings.enabledGrids;
              }
              for (const id of targets) {
                // openWidget 自动读取各自上次保存的精准坐标 (x, y)、尺寸与置顶，保持原汁原味
                await tauriWidgetService.openWidget(id);
              }
            } catch (err) {
              console.warn('Failed to restore last desktop widgets state', err);
            }
          }, 400);
        }
      } catch (err) {
        console.warn('Failed to listen close request:', err);
      }
    }
  }, []);

  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/widget/:gridId" element={<SingleWidgetPage />} />
          <Route path="/widget" element={<Navigate to="/widget/tasks" replace />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/today" replace />} />
            <Route path="/today" element={<TodayPage />} />
            <Route path="/inbox" element={<InboxPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/projects/:id" element={<ProjectPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/today" replace />} />
          </Route>
        </Routes>
        <WindowCloseConfirmModal
          isOpen={showCloseModal}
          onClose={() => setShowCloseModal(false)}
        />
        {/* 应用内确认 / 输入对话框（替代 window.confirm / window.prompt） */}
        <ConfirmDialogHost />
      </HashRouter>
    </ErrorBoundary>
  );
};

export default App;
