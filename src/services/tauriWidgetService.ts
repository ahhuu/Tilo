/**
 * Tauri 原生多挂件独立窗口与桌面级系统服务
 * 支持：独立挂件生命周期、多挂件一键智能贴边对齐排列、Windows 原生开机自启动管理
 */
import { WebviewWindow, getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { LogicalPosition, LogicalSize, PhysicalSize } from '@tauri-apps/api/dpi';
import * as autostart from '@tauri-apps/plugin-autostart';
import type { WidgetGridId } from '@/components/widget/widgetTypes';

export interface WidgetMeta {
  id: WidgetGridId;
  name: string;
  nameEn?: string;
  desc: string;
  descEn?: string;
  defaultWidth: number;
  defaultHeight: number;
}

export const WIDGET_METAS: Record<WidgetGridId, WidgetMeta> = {
  inbox: {
    id: 'inbox',
    name: '闪念收集',
    nameEn: 'Inbox',
    desc: '碎片想法与灵感随时捕获',
    descEn: 'Capture ideas, links & quick thoughts',
    defaultWidth: 360,
    defaultHeight: 480,
  },
  tasks: {
    id: 'tasks',
    name: '今日待办',
    nameEn: 'Today Tasks',
    desc: '聚焦与待办清单，即时勾选闭环',
    descEn: 'Today focus list & immediate task completion',
    defaultWidth: 360,
    defaultHeight: 480,
  },
  session: {
    id: 'session',
    name: '专注计时',
    nameEn: 'Focus Timer',
    desc: '番茄钟与任务专注时长统计',
    descEn: 'Pomodoro & task session tracking',
    defaultWidth: 320,
    defaultHeight: 400,
  },
  timeline: {
    id: 'timeline',
    name: '今日日程',
    nameEn: 'Timeline',
    desc: '今日计划时间块与进行中状态',
    descEn: 'Planned blocks & active schedule',
    defaultWidth: 360,
    defaultHeight: 460,
  },
  notes: {
    id: 'notes',
    name: '随手便签',
    nameEn: 'Notes',
    desc: '桌面草稿与随手备忘',
    descEn: 'Quick markdown scratchpad & desktop notes',
    defaultWidth: 340,
    defaultHeight: 420,
  },
  goals: {
    id: 'goals',
    name: '目标看板',
    nameEn: 'Goals Board',
    desc: '核心目标进度与里程碑 D-Day 倒计时',
    descEn: 'OKR progress & milestone D-Day countdown',
    defaultWidth: 340,
    defaultHeight: 440,
  },
};

const STORAGE_KEY_AUTO_LAUNCH_WIDGETS = 'tilo_auto_launch_widgets_on_startup';
const STORAGE_KEY_WIDGETS_LAYOUT = 'tilo_desktop_widgets_layout_v2';

export interface DesktopWidgetLayout {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  isOpen?: boolean;
  isPinned?: boolean;
  isLocked?: boolean;
}

export class TauriWidgetService {
  /**
   * 判断当前是否运行在 Tauri 桌面原生环境中
   */
  public isTauri(): boolean {
    return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  }

  /**
   * 获取指定挂件上次保存的排布位置与尺寸（自动清洗小于 120px 的折叠态异常脏高度）
   */
  public getWidgetLayout(gridId: WidgetGridId): DesktopWidgetLayout | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_WIDGETS_LAYOUT);
      if (raw) {
        const parsed = JSON.parse(raw);
        const item = parsed[gridId];
        if (item) {
          const meta = WIDGET_METAS[gridId];
          // 彻底清洗被折叠污染的高度，杜绝回不去默认尺寸
          if (typeof item.height === 'number' && item.height < 120) {
            item.height = meta?.defaultHeight || 440;
          }
          if (typeof item.width === 'number' && item.width < 180) {
            item.width = meta?.defaultWidth || 340;
          }
          return item;
        }
      }
    } catch {
      // ignore
    }
    return null;
  }

  /**
   * 持久化保存指定挂件的最新排布坐标或状态（阻止保存折叠态的超小高度）
   */
  public saveWidgetLayout(gridId: WidgetGridId, partial: DesktopWidgetLayout): void {
    try {
      // 如果尝试保存的高度是折叠态的超矮高度（如 38px），坚决不持久化污染
      const sanitizedPartial = { ...partial };
      if (typeof sanitizedPartial.height === 'number' && sanitizedPartial.height < 120) {
        delete sanitizedPartial.height;
      }
      if (typeof sanitizedPartial.width === 'number' && sanitizedPartial.width < 180) {
        delete sanitizedPartial.width;
      }

      const raw = localStorage.getItem(STORAGE_KEY_WIDGETS_LAYOUT);
      const data = raw ? JSON.parse(raw) : {};
      data[gridId] = {
        ...(data[gridId] || {}),
        ...sanitizedPartial,
      };
      localStorage.setItem(STORAGE_KEY_WIDGETS_LAYOUT, JSON.stringify(data));
    } catch {
      // ignore
    }
  }

  /**
   * 重置指定挂件为官方标准默认窗口尺寸
   */
  public async resetWidgetSize(gridId: WidgetGridId): Promise<{ width: number; height: number }> {
    const meta = WIDGET_METAS[gridId] || WIDGET_METAS.tasks;
    const targetWidth = meta.defaultWidth;
    const targetHeight = meta.defaultHeight;
    this.saveWidgetLayout(gridId, { width: targetWidth, height: targetHeight });

    if (this.isTauri()) {
      try {
        const current = getCurrentWebviewWindow();
        const factor = (await current.scaleFactor()) || 1;
        await current.setSize(new PhysicalSize(Math.round(targetWidth * factor), Math.round(targetHeight * factor)));
      } catch (err) {
        console.warn('Failed to reset widget window size', err);
      }
    }
    return { width: targetWidth, height: targetHeight };
  }

  /**
   * 获取上一个时刻在桌面上处于开启状态的所有挂件 ID
   */
  public getLastActiveWidgetIds(): WidgetGridId[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_WIDGETS_LAYOUT);
      if (raw) {
        const data = JSON.parse(raw);
        return Object.keys(data).filter(
          (k) => data[k]?.isOpen === true
        ) as WidgetGridId[];
      }
    } catch {
      // ignore
    }
    return [];
  }

  /**
   * 打开或聚焦指定的纯粹桌面小组件挂件（准确恢复上次拖拽的坐标与拉伸的宽高）
   */
  public async openWidget(gridId: WidgetGridId): Promise<void> {
    const meta = WIDGET_METAS[gridId] || WIDGET_METAS.tasks;
    const windowLabel = `widget-${gridId}`;
    const savedLayout = this.getWidgetLayout(gridId);

    const targetWidth = savedLayout?.width || meta.defaultWidth;
    const targetHeight = savedLayout?.height || meta.defaultHeight;
    const targetX = savedLayout?.x;
    const targetY = savedLayout?.y;
    const isPinned = savedLayout?.isPinned ?? false;

    // 记录该挂件已开启
    this.saveWidgetLayout(gridId, { isOpen: true });

    if (this.isTauri()) {
      try {
        const existing = await WebviewWindow.getByLabel(windowLabel);
        if (existing) {
          await existing.setAlwaysOnTop(isPinned);
          await existing.show();
          await existing.unminimize();
          await existing.setFocus();
          return;
        }

        // 动态创建纯粹桌面小组件：无边框、纯透明、任务栏彻底隐藏、不干扰 Alt+Tab
        const windowOptions = {
          url: `index.html#/widget/${gridId}`,
          title: `Tilo - ${meta.name}`,
          width: targetWidth,
          height: targetHeight,
          minWidth: 260,
          minHeight: 280,
          resizable: true,
          decorations: false,
          transparent: true,
          shadow: false,
          alwaysOnTop: isPinned,
          visible: true,
          skipTaskbar: true, // 核心！绝不产生任何任务栏图标，作为 Tilo 纯桌面挂件
          dragDropEnabled: false,
          ...(typeof targetX === 'number' && typeof targetY === 'number'
            ? { x: targetX, y: targetY }
            : {}),
        };

        const newWidget = new WebviewWindow(windowLabel, windowOptions);

        await newWidget.once('tauri://created', async () => {
          if (typeof targetX === 'number' && typeof targetY === 'number') {
            await newWidget.setPosition(new LogicalPosition(targetX, targetY));
          }
          await newWidget.setSize(new LogicalSize(targetWidth, targetHeight));
          await newWidget.show();
        });
        return;
      } catch (err) {
        console.warn(`Failed to open Tauri desktop widget ${gridId}`, err);
      }
    }

    // Web 端回退：打开独立微缩弹窗
    this.openWebStandalonePopup(gridId, targetWidth, targetHeight);
  }

  /**
   * 关闭/隐藏指定桌面挂件
   */
  public async closeWidget(gridId?: WidgetGridId): Promise<void> {
    if (gridId) {
      this.saveWidgetLayout(gridId, { isOpen: false });
    }

    if (this.isTauri()) {
      try {
        if (gridId) {
          const win = await WebviewWindow.getByLabel(`widget-${gridId}`);
          if (win) {
            await win.hide();
            return;
          }
        }
        const current = getCurrentWebviewWindow();
        await current.hide();
        return;
      } catch (err) {
        console.warn('Failed to hide widget', err);
      }
    }

    window.close();
  }

  /**
   * 兼容旧版调用的隐藏挂件别名
   */
  public async hideCurrentWidget(): Promise<void> {
    await this.closeWidget();
  }

  /**
   * 兼容旧版调用的打开挂件别名（默认唤起今日待办）
   */
  public async openOrFocusWidgetWindow(): Promise<void> {
    await this.openWidget('tasks');
  }

  /**
   * 检查指定挂件是否已在桌面上显示
   */
  public async isWidgetVisible(gridId: WidgetGridId): Promise<boolean> {
    if (this.isTauri()) {
      try {
        const win = await WebviewWindow.getByLabel(`widget-${gridId}`);
        if (!win) return false;
        return await win.isVisible();
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * 获取当前桌面上所有正在显示的挂件 ID
   */
  public async getVisibleWidgetIds(): Promise<WidgetGridId[]> {
    const allIds: WidgetGridId[] = Object.keys(WIDGET_METAS) as WidgetGridId[];
    const visibleIds: WidgetGridId[] = [];
    for (const id of allIds) {
      if (await this.isWidgetVisible(id)) {
        visibleIds.push(id);
      }
    }
    return visibleIds;
  }

  /**
   * 一键智能对齐排列所有已打开的桌面挂件
   */
  public async alignWidgets(
    mode: 'right' | 'left' | 'horizontal' = 'right',
    gap = 12,
    margin = 24
  ): Promise<void> {
    if (!this.isTauri()) {
      return;
    }

    try {
      const visibleIds = await this.getVisibleWidgetIds();
      if (visibleIds.length === 0) return;

      const screenWidth = window.screen.availWidth || 1920;
      const screenHeight = window.screen.availHeight || 1080;

      if (mode === 'right') {
        let currentY = 60;
        for (const id of visibleIds) {
          const win = await WebviewWindow.getByLabel(`widget-${id}`);
          if (!win) continue;

          const size = await win.outerSize();
          const factor = (await win.scaleFactor()) || 1;
          const logicalWidth = Math.round(size.width / factor);
          const logicalHeight = Math.round(size.height / factor);

          const targetX = screenWidth - logicalWidth - margin;
          await win.setPosition(new LogicalPosition(Math.max(0, targetX), currentY));
          this.saveWidgetLayout(id, { x: Math.max(0, targetX), y: currentY });
          currentY += logicalHeight + gap;

          if (currentY > screenHeight - 100) {
            currentY = 60;
          }
        }
      } else if (mode === 'left') {
        let currentY = 60;
        for (const id of visibleIds) {
          const win = await WebviewWindow.getByLabel(`widget-${id}`);
          if (!win) continue;

          const size = await win.outerSize();
          const factor = (await win.scaleFactor()) || 1;
          const logicalHeight = Math.round(size.height / factor);

          await win.setPosition(new LogicalPosition(margin, currentY));
          this.saveWidgetLayout(id, { x: margin, y: currentY });
          currentY += logicalHeight + gap;

          if (currentY > screenHeight - 100) {
            currentY = 60;
          }
        }
      } else if (mode === 'horizontal') {
        let currentX = margin;
        const targetY = Math.max(40, screenHeight - 520);
        for (const id of visibleIds) {
          const win = await WebviewWindow.getByLabel(`widget-${id}`);
          if (!win) continue;

          const size = await win.outerSize();
          const factor = (await win.scaleFactor()) || 1;
          const logicalWidth = Math.round(size.width / factor);

          await win.setPosition(new LogicalPosition(currentX, targetY));
          this.saveWidgetLayout(id, { x: currentX, y: targetY });
          currentX += logicalWidth + gap;
        }
      }
    } catch (err) {
      console.warn('Failed to align desktop widgets', err);
    }
  }

  /**
   * 一键重置所有桌面挂件位置到屏幕中央
   */
  public async resetWidgetPositions(): Promise<void> {
    if (!this.isTauri()) return;
    try {
      const visibleIds = await this.getVisibleWidgetIds();
      const screenWidth = window.screen.availWidth || 1920;
      const screenHeight = window.screen.availHeight || 1080;

      let startX = Math.round((screenWidth - 700) / 2);
      const startY = Math.round((screenHeight - 500) / 2);

      for (const id of visibleIds) {
        const win = await WebviewWindow.getByLabel(`widget-${id}`);
        if (!win) continue;
        await win.setPosition(new LogicalPosition(startX, startY));
        startX += 30;
      }
    } catch (err) {
      console.warn('Failed to reset widget positions', err);
    }
  }

  /**
   * 一键重置所有挂件为官方标准黄金比例尺寸
   */
  public async resetAllWidgetSizes(): Promise<void> {
    try {
      const allIds: WidgetGridId[] = Object.keys(WIDGET_METAS) as WidgetGridId[];
      for (const id of allIds) {
        const meta = WIDGET_METAS[id];
        this.saveWidgetLayout(id, { width: meta.defaultWidth, height: meta.defaultHeight });
        if (this.isTauri()) {
          const win = await WebviewWindow.getByLabel(`widget-${id}`);
          if (win) {
            const factor = (await win.scaleFactor()) || 1;
            await win.setSize(new PhysicalSize(Math.round(meta.defaultWidth * factor), Math.round(meta.defaultHeight * factor)));
          }
        }
      }
    } catch (err) {
      console.warn('Failed to reset all widget sizes', err);
    }
  }

  /**
   * 一键同时打开默认双挂件（【闪念收集】与【今日待办】）并靠右自动排列对齐
   */
  public async openDualDefaultWidgets(): Promise<void> {
    await this.openWidget('inbox');
    await this.openWidget('tasks');
    // 延迟 150ms 等待窗口就绪后自动靠右对齐
    setTimeout(async () => {
      await this.alignWidgets('right');
    }, 180);
  }

  /**
   * 切换指定挂件的开启/关闭状态
   */
  public async toggleWidget(gridId: WidgetGridId): Promise<void> {
    const isVisible = await this.isWidgetVisible(gridId);
    if (isVisible) {
      await this.closeWidget(gridId);
    } else {
      await this.openWidget(gridId);
    }
  }

  /**
   * 一键收起所有桌面挂件
   */
  public async closeAllWidgets(): Promise<void> {
    const allIds: WidgetGridId[] = ['inbox', 'tasks', 'session', 'timeline', 'notes'];
    for (const id of allIds) {
      await this.closeWidget(id);
    }
  }

  /**
   * 切换当前窗口置顶
   */
  public async setAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
    if (this.isTauri()) {
      try {
        const current = getCurrentWebviewWindow();
        await current.setAlwaysOnTop(alwaysOnTop);
      } catch (err) {
        console.warn('Failed to toggle always on top', err);
      }
    }
  }

  /**
   * 检查 Windows 原生开机自启动是否已开启
   */
  public async isAutoStartEnabled(): Promise<boolean> {
    if (this.isTauri()) {
      try {
        return await autostart.isEnabled();
      } catch (err) {
        console.warn('Failed to check autostart status', err);
      }
    }
    return localStorage.getItem('tilo_autostart_preference') === 'true';
  }

  /**
   * 开启或关闭 Windows 原生开机自启动
   */
  public async setAutoStart(enabled: boolean): Promise<boolean> {
    if (this.isTauri()) {
      try {
        if (enabled) {
          await autostart.enable();
        } else {
          await autostart.disable();
        }
        localStorage.setItem('tilo_autostart_preference', String(enabled));
        return true;
      } catch (err) {
        console.warn('Failed to set autostart', err);
        return false;
      }
    }
    localStorage.setItem('tilo_autostart_preference', String(enabled));
    return true;
  }

  /**
   * 获取关闭主窗口时的行为偏好：'ask'（询问） | 'tray'（最小化到托盘） | 'exit'（退出）
   */
  public getCloseActionPreference(): 'ask' | 'tray' | 'exit' {
    const saved = localStorage.getItem('tilo_close_action_pref');
    if (saved === 'tray' || saved === 'exit') {
      return saved;
    }
    return 'ask';
  }

  /**
   * 保存关闭主窗口时的行为偏好
   */
  public setCloseActionPreference(action: 'ask' | 'tray' | 'exit'): void {
    localStorage.setItem('tilo_close_action_pref', action);
  }

  /**
   * 将主窗口隐藏最小化到托盘（桌面挂件继续保持运行）
   */
  public async minimizeMainWindowToTray(): Promise<void> {
    if (this.isTauri()) {
      try {
        const mainWin = await WebviewWindow.getByLabel('main');
        if (mainWin) {
          await mainWin.hide();
          return;
        }
      } catch (err) {
        console.warn('Failed to hide main window to tray', err);
      }
    }
  }

  /**
   * 彻底退出整个应用进程并销毁所有系统托盘与子窗口
   */
  public async exitApplication(): Promise<void> {
    if (this.isTauri()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('exit_app');
        return;
      } catch (err) {
        console.warn('Failed to exit via Tauri invoke', err);
        try {
          const mainWin = await WebviewWindow.getByLabel('main');
          await mainWin?.destroy();
        } catch {
          // ignore
        }
      }
    }
    window.close();
  }

  /**
   * 是否在开机自启动时自动在桌面上唤出快捷挂件
   */
  public isAutoLaunchWidgetsOnStartup(): boolean {
    return localStorage.getItem(STORAGE_KEY_AUTO_LAUNCH_WIDGETS) === 'true';
  }

  /**
   * 设置是否在开机启动时自动在桌面上唤出快捷挂件
   */
  public setAutoLaunchWidgetsOnStartup(enabled: boolean): void {
    localStorage.setItem(STORAGE_KEY_AUTO_LAUNCH_WIDGETS, String(enabled));
  }

  /**
   * Web 端微缩弹窗回退
   */
  public openWebStandalonePopup(gridId: string, width = 360, height = 480): Window | null {
    const left = window.screen.width - width - 50;
    const top = 80;

    const features = [
      `width=${width}`,
      `height=${height}`,
      `left=${left}`,
      `top=${top}`,
      'menubar=no',
      'toolbar=no',
      'location=no',
      'status=no',
      'resizable=yes',
    ].join(',');

    const popup = window.open(`/#/widget/${gridId}`, `tilo-widget-${gridId}`, features);
    if (popup) {
      popup.focus();
    }
    return popup;
  }
}

export const tauriWidgetService = new TauriWidgetService();
