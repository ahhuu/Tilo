import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App as CapApp } from '@capacitor/app';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Keyboard } from '@capacitor/keyboard';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Share } from '@capacitor/share';
import { useUIStore } from '@/stores/uiStore';

class NativeService {
  private lastBackPressTime = 0;
  // 专注计时结束本地通知的固定 id（用于取消）
  private static readonly FOCUS_NOTIF_ID = 4242;

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

    // 3. 软键盘适配：弹起时滚动聚焦输入进可视区并写入高度 CSS 变量
    this.setupKeyboardListeners();
  }

  /**
   * 震动反馈（完成 / 删除 / 拖拽等操作的触感）。web 端为空操作。
   */
  public async hapticImpact(style: 'light' | 'medium' | 'heavy' = 'light'): Promise<void> {
    if (!this.isNative()) return;
    try {
      const styleMap = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy,
      };
      await Haptics.impact({ style: styleMap[style] });
    } catch {
      /* 插件不可用或权限未授予时静默 */
    }
  }

  /**
   * 通知类震动（成功 / 警告 / 错误）。
   */
  public async hapticNotification(type: 'success' | 'warning' | 'error' = 'success'): Promise<void> {
    if (!this.isNative()) return;
    try {
      const map = {
        success: NotificationType.Success,
        warning: NotificationType.Warning,
        error: NotificationType.Error,
      };
      await Haptics.notification({ type: map[type] });
    } catch {
      /* 静默 */
    }
  }

  /**
   * 软键盘监听：键盘弹起时把当前聚焦的输入滚动到可视区（沉浸式状态栏下尤为必要），
   * 并通过 --cap-keyboard-height 暴露键盘高度，供布局避让。
   */
  private setupKeyboardListeners(): void {
    if (!this.isNative()) return;
    try {
      Keyboard.addListener('keyboardDidShow', (info: { keyboardHeight: number }) => {
        const el = document.activeElement as HTMLElement | null;
        if (el && typeof el.scrollIntoView === 'function') {
          window.setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 50);
        }
        document.documentElement.style.setProperty('--cap-keyboard-height', `${info.keyboardHeight}px`);
      });
      Keyboard.addListener('keyboardDidHide', () => {
        document.documentElement.style.setProperty('--cap-keyboard-height', '0px');
      });
    } catch {
      /* 静默 */
    }
  }

  /**
   * 排程一条「专注计时结束」本地通知，作为切后台后 WebView 节流 setInterval 的兜底。
   * fireAtMs 为目标结束的绝对时间戳。
   */
  public async scheduleFocusEndNotification(
    fireAtMs: number,
    title: string,
    body?: string
  ): Promise<void> {
    if (!this.isNative()) return;
    try {
      await LocalNotifications.checkPermissions();
      await LocalNotifications.schedule({
        notifications: [
          {
            id: NativeService.FOCUS_NOTIF_ID,
            title,
            body: body ?? '',
            schedule: { at: new Date(fireAtMs) },
          },
        ],
      });
    } catch {
      /* 静默 */
    }
  }

  /**
   * 取消已排程的专注结束通知（正常结束 / 放弃时调用）。
   */
  public async cancelFocusNotifications(): Promise<void> {
    if (!this.isNative()) return;
    try {
      await LocalNotifications.cancel({ notifications: [{ id: NativeService.FOCUS_NOTIF_ID }] });
    } catch {
      /* 静默 */
    }
  }

  /**
   * 调用系统分享面板（报告 / 备份导出等）。
   */
  public async shareFile(options: {
    title?: string;
    text?: string;
    url?: string;
    files?: string[];
  }): Promise<void> {
    if (!this.isNative()) return;
    try {
      await Share.share({
        title: options.title,
        text: options.text,
        url: options.url,
        files: options.files,
      });
    } catch {
      /* 用户取消分享等，静默 */
    }
  }

  /**
   * 分享纯文本/文件内容（原生端走系统分享面板，web 端为空操作）。
   */
  public async shareText(title: string, text: string): Promise<void> {
    if (!this.isNative()) return;
    try {
      await Share.share({ title, text });
    } catch {
      /* 用户取消分享等，静默 */
    }
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
   * 通用遮罩栈：找到当前最上层的可见遮罩并触发它的关闭。
   * 原先只白名单处理 4 个浮层，导致日历抽屉、More 抽屉和其余十几个 Modal
   * 在返回键下直接跳路由甚至退出 App。改为按 z-index + DOM 顺序取最上层。
   */
  private dismissTopOverlay(): boolean {
    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[role="dialog"], [aria-modal="true"], div.fixed.inset-0, aside.fixed.inset-0'
      )
    );

    let topEl: HTMLElement | null = null;
    let topZ = -1;

    for (const el of candidates) {
      if (!el.isConnected) continue;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
      const z = parseInt(style.zIndex, 10);
      if (Number.isNaN(z) || z < 40) continue;
      // z-index 相同时取 DOM 中更靠后的（渲染在更上层）
      if (z >= topZ) {
        topZ = z;
        topEl = el;
      }
    }

    if (!topEl) return false;

    // 直接派发点击到遮罩容器本身：容器的 onClick 即 onClose，
    // 内部卡片通常已 stopPropagation，不会误触内容。
    topEl.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, view: window })
    );
    return true;
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

      // 优先级 1.5: 通用遮罩栈 —— 关闭任意仍处于打开状态的 Modal / 抽屉
      if (this.dismissTopOverlay()) return;

      // 优先级 2: 主标签页（Tab）之间不应通过返回键互相跳转。
      //          日历 / 收件箱 / 复盘 等都是顶层 Tab，按返回键应当：
      //          先关浮层（上面已处理）→ 无浮层则走“双击退出”逻辑，而不是 history.back 跳到上一个 Tab。
      //          只有「项目详情」这类子页面才允许 history.back 返回上一级。
      const currentHash = window.location.hash;
      const isPrimaryTab =
        currentHash === '' ||
        currentHash === '#/' ||
        currentHash === '#/today' ||
        currentHash === '#/inbox' ||
        currentHash === '#/calendar' ||
        currentHash === '#/goals' ||
        currentHash === '#/analytics' ||
        currentHash === '#/review' ||
        currentHash === '#/settings';

      if (!isPrimaryTab && canGoBack) {
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
