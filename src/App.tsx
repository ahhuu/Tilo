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
import { ProjectsPage } from '@/pages/ProjectsPage';
import { TasksPage } from '@/pages/TasksPage';
import { SingleWidgetPage } from '@/pages/SingleWidgetPage';
import { WindowCloseConfirmModal } from '@/components/global/WindowCloseConfirmModal';
import { ConfirmDialogHost } from '@/components/ui/ConfirmDialogHost';
import { ErrorBoundary } from '@/components/global/ErrorBoundary';
import { db, ensureDefaultWorkspace } from '@/storage/db';
import { seedDemoData } from '@/storage/seed';
import { FirstRunGuide, FIRST_RUN_ONBOARDING_KEY, DEMO_DATA_SEEDED_KEY } from '@/components/onboarding/FirstRunGuide';
import { tauriWidgetService } from '@/services/tauriWidgetService';
import { nativeService } from '@/services/nativeService';
import { useUIStore } from '@/stores/uiStore';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

/**
 * 判断当前是否处于"桌面挂件窗口"上下文。
 * - Tauri 桌面挂件窗口的 label 固定为 `widget-<gridId>`；
 * - Web / 回退场景下挂件走 `#/widget/...` 路由。
 * 挂件窗口不应注入示例数据或弹出新手引导，这些只属于主应用界面。
 */
function isWidgetContext(): boolean {
  if (tauriWidgetService.isTauri()) {
    try {
      const label = getCurrentWebviewWindow().label;
      if (label && label.startsWith('widget-')) return true;
    } catch {
      // 非 Tauri 或非主窗口时忽略
    }
  }
  const path = (window.location.hash || '').replace(/^#/, '');
  return path.startsWith('/widget');
}

export const App: React.FC = () => {
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const theme = useUIStore((s) => s.theme);
  const language = useUIStore((s) => s.language);
  const addToast = useUIStore((s) => s.addToast);

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
        // 桌面挂件窗口（widget-*/#/widget/...）不触发示例数据注入与新手引导，
        // 这些引导只应在主应用界面出现
        const inWidget = isWidgetContext();
        if (!hasInitialized && !inWidget) {
          const count = await db.tasks.count();
          if (count === 0) {
            await seedDemoData(db);
            // 标记已注入示例数据，让设置页展示「一键清空示例数据」入口
            localStorage.setItem(DEMO_DATA_SEEDED_KEY, 'true');
            addToast({
              message:
                language === 'zh-CN'
                  ? '已为你载入示例数据，可在「设置 → 数据」一键清空'
                  : 'Sample data loaded — clear it anytime in Settings → Data',
              type: 'info',
            });
          }
          localStorage.setItem('tilo_has_initialized_seed', 'true');
        }

        // 首次启动（含老用户升级）展示新手引导，讲解「规划 → 执行 → 复盘」闭环，
        // 仅主应用界面展示，桌面挂件窗口不弹
        if (!inWidget && !localStorage.getItem(FIRST_RUN_ONBOARDING_KEY)) {
          setShowOnboarding(true);
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
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectPage />} />
            <Route path="/tasks" element={<TasksPage />} />
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
        {/* 首次启动新手引导（讲解规划 → 执行 → 复盘闭环） */}
        <FirstRunGuide isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />
        {/* 应用内确认 / 输入对话框（替代 window.confirm / window.prompt） */}
        <ConfirmDialogHost />
      </HashRouter>
    </ErrorBoundary>
  );
};

export default App;
