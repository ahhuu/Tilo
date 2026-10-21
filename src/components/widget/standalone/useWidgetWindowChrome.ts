import { useEffect, useRef, useState } from 'react';
import { emit, listen } from '@tauri-apps/api/event';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { PhysicalSize } from '@tauri-apps/api/dpi';
import { useUIStore } from '@/stores/uiStore';
import { useWidgetStore } from '@/stores/widgetStore';
import { useI18n } from '@/core/i18n';
import { tauriWidgetService, WIDGET_METAS } from '@/services/tauriWidgetService';
import type { WidgetAppearanceSettings, WidgetGridId } from '../widgetTypes';

export interface WidgetAlignState {
  alignLeft: boolean;
  alignRight: boolean;
  alignTop: boolean;
  alignBottom: boolean;
  snapVertical: boolean;
  label: string | null;
}

const RESET_ALIGNMENT: WidgetAlignState = {
  alignLeft: false,
  alignRight: false,
  alignTop: false,
  alignBottom: false,
  snapVertical: false,
  label: null,
};

/**
 * 独立挂件窗口层面的行为：折叠/展开、置顶、位置锁定、窗口尺寸复位，
 * 以及跨挂件拖动对齐导引线的计算与淡出。
 */
export const useWidgetWindowChrome = ({
  gridId,
  appearance,
}: {
  gridId: WidgetGridId;
  appearance: WidgetAppearanceSettings;
}) => {
  const { language } = useI18n();
  const isZh = language === 'zh-CN';
  const { addToast } = useUIStore();
  const { settings } = useWidgetStore();

  // 挂件锁定状态：全局锁定优先；若全局未锁，则由本挂件独立的持久化锁定配置决定
  const [selfLocked, setSelfLocked] = useState<boolean>(() => {
    const layout = tauriWidgetService.getWidgetLayout(gridId);
    return layout?.isLocked ?? false;
  });
  const isLocked = (appearance.lockLayout ?? false) || selfLocked;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [isPinned, setIsPinned] = useState<boolean>(() => {
    const layout = tauriWidgetService.getWidgetLayout(gridId);
    return layout?.isPinned ?? settings.alwaysOnTop ?? false;
  });

  const prevSizeRef = useRef<{ width: number; height: number } | null>(null);
  const isResizingOrCollapsingRef = useRef(false);
  const isUserDraggingRef = useRef(false);
  const lastMouseDownTimeRef = useRef<number>(0);

  const meta = WIDGET_METAS[gridId] || WIDGET_METAS.tasks;
  const defaultWidth = meta.defaultWidth;
  const defaultHeight = meta.defaultHeight;

  // 拖动对齐与导引线状态
  const [alignment, setAlignment] = useState<WidgetAlignState>(RESET_ALIGNMENT);
  const otherPositionsRef = useRef<Record<string, { x: number; y: number; width: number; height: number }>>({});
  const fadeoutTimerRef = useRef<number | null>(null);

  // 双击顶栏折叠/展开逻辑：折叠时宽度缩短为挂件的默认标准宽度，高度 38px
  const handleToggleCollapse = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!appearance.collapseOnDoubleClick) return;

    isUserDraggingRef.current = false;
    isResizingOrCollapsingRef.current = true;
    setAlignment(RESET_ALIGNMENT);

    const nextCollapsed = !isCollapsed;
    setIsCollapsed(nextCollapsed);
    if (tauriWidgetService.isTauri()) {
      try {
        const win = getCurrentWebviewWindow();
        const factor = (await win.scaleFactor()) || window.devicePixelRatio || 1;
        if (nextCollapsed) {
          // 折叠：记录展开态的实际宽高；宽度缩短为原来默认窗口大小 (defaultWidth)，高度收缩为 38px
          const size = await win.innerSize();
          prevSizeRef.current = {
            width: size.width,
            height: size.height,
          };
          const targetW = Math.round(defaultWidth * factor);
          const targetH = Math.round(38 * factor);
          await win.setSize(new PhysicalSize(targetW, targetH));
        } else {
          // 展开：恢复之前展开时的尺寸；若异常则回退到标准默认尺寸
          const restoreW =
            prevSizeRef.current?.width && prevSizeRef.current.width > Math.round(200 * factor)
              ? prevSizeRef.current.width
              : Math.round(defaultWidth * factor);
          const restoreH =
            prevSizeRef.current?.height && prevSizeRef.current.height > Math.round(120 * factor)
              ? prevSizeRef.current.height
              : Math.round(defaultHeight * factor);
          await win.setSize(new PhysicalSize(restoreW, restoreH));
        }
      } catch (err) {
        console.warn('Failed to resize window for collapse', err);
      }
    }

    setTimeout(() => {
      isResizingOrCollapsingRef.current = false;
      setAlignment(RESET_ALIGNMENT);
    }, 450);
  };

  // 一键重置此挂件为官方标准黄金比例默认窗口大小
  const handleResetWindowSize = async () => {
    setIsCollapsed(false);
    await tauriWidgetService.resetWidgetSize(gridId);
    addToast({
      message: isZh ? '已恢复标准默认窗口大小' : 'Reset to default window size',
      type: 'info',
    });
  };

  // 挂载与全局置顶设置变化时，确保系统级窗口置顶同步生效
  useEffect(() => {
    if (!tauriWidgetService.isTauri()) return;
    const layout = tauriWidgetService.getWidgetLayout(gridId);
    const shouldPin = layout?.isPinned ?? isPinned ?? settings.alwaysOnTop ?? false;
    try {
      const win = getCurrentWebviewWindow();
      win.setAlwaysOnTop(shouldPin).catch(() => {});
    } catch {
      // ignore
    }
  }, [gridId, settings.alwaysOnTop, isPinned]);

  // 置顶切换处理
  const handleTogglePin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextPin = !isPinned;
    setIsPinned(nextPin);
    tauriWidgetService.saveWidgetLayout(gridId, { isPinned: nextPin });

    if (tauriWidgetService.isTauri()) {
      try {
        const win = getCurrentWebviewWindow();
        await win.setAlwaysOnTop(nextPin);
      } catch (err) {
        console.warn('Failed to setAlwaysOnTop via getCurrentWebviewWindow, trying getByLabel', err);
        try {
          const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
          const win = await WebviewWindow.getByLabel(`widget-${gridId}`);
          if (win) {
            await win.setAlwaysOnTop(nextPin);
          }
        } catch (e2) {
          console.warn('Failed to setAlwaysOnTop via getByLabel', e2);
        }
      }
    }

    addToast({
      message: nextPin
        ? isZh
          ? '已开启始终置顶 (浮在其他所有软件前面)'
          : 'Always on top enabled'
        : isZh
          ? '已取消始终置顶'
          : 'Always on top disabled',
      type: 'info',
    });
  };

  // 锁定挂件位置与尺寸切换处理（仅针对当前挂件，彻底禁止拖拽与缩放，防误触）
  const handleToggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 若主应用全局已开启“锁定全部挂件”，提示用户当前处于全局锁定中
    if (appearance.lockLayout) {
      addToast({
        message: isZh
          ? '主应用已开启「锁定全部挂件」，如需解锁请前往主应用设置'
          : 'Global layout lock is active in Settings',
        type: 'info',
      });
      return;
    }

    const nextLock = !selfLocked;
    setSelfLocked(nextLock);
    tauriWidgetService.saveWidgetLayout(gridId, { isLocked: nextLock });
    addToast({
      message: nextLock
        ? isZh
          ? '当前挂件位置已锁定，禁止拖拽'
          : 'Current widget layout locked'
        : isZh
          ? '当前挂件已解锁，可自由拖拽'
          : 'Current widget layout unlocked',
      type: nextLock ? 'warning' : 'info',
    });
  };

  // 跨挂件位置同步与广播监听
  useEffect(() => {
    if (!tauriWidgetService.isTauri()) return;

    let unlistenMove: (() => void) | undefined;

    listen<{ id: string; x: number; y: number; width: number; height: number }>(
      'tilo:widget-drag-move',
      (event) => {
        if (event.payload.id !== gridId) {
          otherPositionsRef.current[event.payload.id] = event.payload;
        }
      }
    ).then((un) => {
      unlistenMove = un;
    });

    const handleMouseRelease = () => {
      isUserDraggingRef.current = false;
      if (fadeoutTimerRef.current) clearTimeout(fadeoutTimerRef.current);
      fadeoutTimerRef.current = window.setTimeout(() => {
        setAlignment(RESET_ALIGNMENT);
      }, 1200);
    };

    window.addEventListener('mouseup', handleMouseRelease);
    window.addEventListener('pointerup', handleMouseRelease);
    window.addEventListener('blur', handleMouseRelease);

    // 注册 Tauri 原生系统窗口移动事件监听 (彻底突破 Win32 模态拖拽消息泵限制)
    const win = getCurrentWebviewWindow();
    let unlistenMoved: (() => void) | undefined;

    win
      .onMoved(async (event) => {
        try {
          const [size, factor] = await Promise.all([win.outerSize(), win.scaleFactor()]);
          const logicalX = Math.round(event.payload.x / factor);
          const logicalY = Math.round(event.payload.y / factor);
          const logicalW = Math.round(size.width / factor);
          const logicalH = Math.round(size.height / factor);

          // 持久化保存此挂件的最新物理位置
          tauriWidgetService.saveWidgetLayout(gridId, { x: logicalX, y: logicalY });

          // 广播自己的最新位置给其它挂件
          await emit('tilo:widget-drag-move', {
            id: gridId,
            x: logicalX,
            y: logicalY,
            width: logicalW,
            height: logicalH,
          });

          // 核心保护：如果处于双击折叠/展开缩放中，或者并非用户按住拖拽移动，绝不计算与显示对齐辅助线
          if (isResizingOrCollapsingRef.current || !isUserDraggingRef.current) {
            return;
          }

          // 检查与其它已打开挂件的对齐关系 (阈值 16px)
          let hasAlignLeft = false;
          let hasAlignRight = false;
          let hasAlignTop = false;
          let hasAlignBottom = false;
          let hasSnapVertical = false;

          for (const [otherId, other] of Object.entries(otherPositionsRef.current)) {
            if (otherId === gridId) continue;

            // 左侧对齐
            if (Math.abs(logicalX - other.x) <= 16) {
              hasAlignLeft = true;
            }
            // 右侧对齐
            if (Math.abs(logicalX + logicalW - (other.x + other.width)) <= 16) {
              hasAlignRight = true;
            }
            // 顶部水平对齐
            if (Math.abs(logicalY - other.y) <= 16) {
              hasAlignTop = true;
            }
            // 底部水平对齐
            if (Math.abs(logicalY + logicalH - (other.y + other.height)) <= 16) {
              hasAlignBottom = true;
            }
            // 上下紧贴吸附
            if (
              Math.abs(logicalY - (other.y + other.height)) <= 18 ||
              Math.abs(logicalY + logicalH - other.y) <= 18
            ) {
              hasSnapVertical = true;
            }
          }

          // 精炼生成唯一、绝不重复的简洁指示文案
          let conciseLabel: string | null = null;
          if (hasAlignTop && hasAlignBottom) {
            conciseLabel = '水平并排对齐';
          } else if (hasAlignLeft && hasAlignRight) {
            conciseLabel = '垂直对齐';
          } else if (hasSnapVertical) {
            conciseLabel = '垂直贴靠吸附';
          } else if (hasAlignTop) {
            conciseLabel = '顶部对齐';
          } else if (hasAlignBottom) {
            conciseLabel = '底部对齐';
          } else if (hasAlignLeft) {
            conciseLabel = '左侧对齐';
          } else if (hasAlignRight) {
            conciseLabel = '右侧对齐';
          }

          setAlignment({
            alignLeft: hasAlignLeft,
            alignRight: hasAlignRight,
            alignTop: hasAlignTop,
            alignBottom: hasAlignBottom,
            snapVertical: hasSnapVertical,
            label: conciseLabel,
          });

          // 移动停止或拖拽结束 1.2s 后平滑淡出
          if (fadeoutTimerRef.current) clearTimeout(fadeoutTimerRef.current);
          fadeoutTimerRef.current = window.setTimeout(() => {
            setAlignment(RESET_ALIGNMENT);
          }, 1200);
        } catch {
          // ignore move error
        }
      })
      .then((un) => {
        unlistenMoved = un;
      });

    // 监听窗口调整大小并持久化保存最新尺寸（过滤折叠态的脏尺寸；拉大时自动退出折叠态，彻底消除空白 Bug）
    let unlistenResized: (() => void) | undefined;
    win
      .onResized(async (event) => {
        try {
          const factor = (await win.scaleFactor()) || 1;
          const logicalW = Math.round(event.payload.width / factor);
          const logicalH = Math.round(event.payload.height / factor);

          // 如果高度低于 100px 或者处于内部折叠过渡中，坚决不持久化污染
          if (isResizingOrCollapsingRef.current || logicalH < 100) {
            return;
          }

          // 核心修复图 2：如果当前处于折叠状态，但用户手动通过边缘拉伸放大了窗口（logicalH >= 100），
          // 自动解除折叠态，确保组件内容立即恢复可见并展示！
          setIsCollapsed((prev) => {
            if (prev && logicalH >= 100) {
              return false;
            }
            return prev;
          });

          tauriWidgetService.saveWidgetLayout(gridId, { width: logicalW, height: logicalH });
        } catch {
          // ignore resize error
        }
      })
      .then((un) => {
        unlistenResized = un;
      });

    return () => {
      if (unlistenMove) unlistenMove();
      if (unlistenMoved) unlistenMoved();
      if (unlistenResized) unlistenResized();
      if (fadeoutTimerRef.current) clearTimeout(fadeoutTimerRef.current);
      window.removeEventListener('mouseup', handleMouseRelease);
      window.removeEventListener('pointerup', handleMouseRelease);
      window.removeEventListener('blur', handleMouseRelease);
    };
  }, [gridId]);

  // 顶栏鼠标按下处理：如果锁定则阻止拖拽；避免按钮触发；双击间隔内拦截 startDragging
  const handleMouseDownHeader = async (e: React.MouseEvent) => {
    if (isLocked) return;
    if ((e.target as HTMLElement).closest('button')) return;
    if (e.button !== 0) return;

    const now = Date.now();
    // 双击检测拦截：如果距离上次 mousedown 小于 320ms，判断为双击意图，绝不触发 startDragging，避免触发位移和对齐
    if (appearance.collapseOnDoubleClick && now - lastMouseDownTimeRef.current < 320) {
      lastMouseDownTimeRef.current = 0;
      isUserDraggingRef.current = false;
      return;
    }
    lastMouseDownTimeRef.current = now;

    if (tauriWidgetService.isTauri()) {
      isUserDraggingRef.current = true;
      const win = getCurrentWebviewWindow();
      await win.startDragging();
    }
  };

  return {
    isZh,
    isLocked,
    isCollapsed,
    showSettings,
    setShowSettings,
    isPinned,
    alignment,
    handleToggleCollapse,
    handleResetWindowSize,
    handleTogglePin,
    handleToggleLock,
    handleMouseDownHeader,
  };
};

export type WidgetWindowChrome = ReturnType<typeof useWidgetWindowChrome>;
