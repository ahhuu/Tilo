import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App as CapApp } from '@capacitor/app';
import { useUIStore } from '@/stores/uiStore';

class NativeService {
  private lastBackPressTime = 0;

  /**
   * 判断当前是否运行在 Capacitor 原生移动端容器内
   */
  public isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * 初始化原生环境配置（状态栏、物理按键等）
   */
  public async initNative(): Promise<void> {
    if (!this.isNative()) return;

    try {
      // 1. 设置状态栏内容浮在 Webview 之上 (沉浸式布局)
      await StatusBar.setOverlaysWebView({ overlay: true });
    } catch (err) {
      console.warn('[NativeService] Failed to set StatusBar overlay:', err);
    }

    // 2. 监听 Android 原生物理返回按键
    this.setupBackButtonListener();
  }

  /**
   * 根据应用当前主题动态同步状态栏图标/文字颜色
   */
  public async updateTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
    if (!this.isNative()) return;

    try {
      const isDark =
        theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

      // Style.Dark: 状态栏文字为白色（适用于深色背景）
      // Style.Light: 状态栏文字为黑色（适用于浅色背景）
      await StatusBar.setStyle({
        style: isDark ? Style.Dark : Style.Light,
      });
    } catch (err) {
      console.warn('[NativeService] Failed to update status bar style:', err);
    }
  }

  /**
   * 注册 Android 物理返回键分发拦截
   */
  private setupBackButtonListener(): void {
    CapApp.addListener('backButton', ({ canGoBack }) => {
      const uiStore = useUIStore.getState();

      // 优先级 1: 关闭打开的瞬时弹窗与浮层
      if (uiStore.quickTaskHUDOpen) {
        uiStore.closeQuickTaskHUD();
        return;
      }
      if (uiStore.instantCaptureOpen) {
        uiStore.closeInstantCapture();
        return;
      }
      if (uiStore.commandMenuOpen) {
        uiStore.closeCommandMenu();
        return;
      }
      if (uiStore.inspectorOpen) {
        uiStore.closeInspector();
        return;
      }

      // 优先级 2: 如果前端路由有历史记录可回退
      const currentHash = window.location.hash;
      const isRootPage =
        currentHash === '' ||
        currentHash === '#/' ||
        currentHash === '#/today';

      if (!isRootPage && canGoBack) {
        window.history.back();
        return;
      }

      // 优先级 3: 处于根页面时，双击返回键退出防误触
      const now = Date.now();
      if (now - this.lastBackPressTime < 2000) {
        CapApp.exitApp();
      } else {
        this.lastBackPressTime = now;
        // 可使用轻量原生提示或页面 toast
        const { addToast } = useUIStore.getState();
        if (addToast) {
          addToast({
            message: '再按一次返回键退出 Tilo',
            type: 'info',
            durationMs: 2000,
          });
        }
      }
    });
  }
}

export const nativeService = new NativeService();
export default nativeService;
