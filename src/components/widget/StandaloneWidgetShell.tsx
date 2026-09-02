import React, { useState, useEffect, useRef } from 'react';
import { emit, listen } from '@tauri-apps/api/event';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { PhysicalSize } from '@tauri-apps/api/dpi';
import {
  Pin,
  X,
  Sun,
  Moon,
  SlidersHorizontal,
  RotateCcw,
  Check,
  Volume2,
  Magnet,
  Lock,
  Unlock,
  ChevronDown,
  Maximize2,
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useWidgetStore } from '@/stores/widgetStore';
import { useI18n } from '@/core/i18n';
import { tauriWidgetService, WIDGET_METAS } from '@/services/tauriWidgetService';
import { ambientAudioService, type AmbientSoundType } from '@/core/audio/ambientAudioService';
import {
  DEFAULT_HEADER_BUTTONS_CONFIG,
  type WidgetGridId,
  type WidgetWindowStyle,
  type HeaderButtonDisplayMode,
  type WidgetHeaderButtonsConfig,
} from './widgetTypes';

interface StandaloneWidgetShellProps {
  gridId: WidgetGridId;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

export const StandaloneWidgetShell: React.FC<StandaloneWidgetShellProps> = ({
  gridId,
  title,
  icon: IconComponent,
  children,
}) => {
  const { language } = useI18n();
  const isZh = language === 'zh-CN';
  const { theme, setTheme, addToast } = useUIStore();
  const { settings, updateGridSettings, updateAppearance, setOpacity, resetToDefaults } = useWidgetStore();

  const appearance = settings.appearance || {
    fontSizeLevel: 'normal',
    fontFamily: 'system',
    buttonSize: 'standard',
    borderRadius: 'rounded-2xl',
    windowStyle: 'glass',
    collapseOnDoubleClick: true,
    headerActionsMode: 'hover',
    headerButtons: DEFAULT_HEADER_BUTTONS_CONFIG,
    lockLayout: false,
  };

  const zoomLevel = {
    small: 0.84,
    normal: 1.0,
    large: 1.22,
  }[appearance.fontSizeLevel || 'normal'];

  const fontFamilyStyle = {
    system: 'inherit',
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Cascadia Code", Consolas, monospace',
    serif: 'Georgia, "Times New Roman", STSong, SimSun, serif',
  }[appearance.fontFamily || 'system'];

  const fontFamilyClass = {
    system: 'font-sans',
    sans: 'font-sans [&_*]:font-sans',
    mono: 'font-mono [&_*]:font-mono',
    serif: 'font-serif [&_*]:font-serif',
  }[appearance.fontFamily || 'system'];

  const buttonSizeClass = {
    compact: '[&_button]:scale-90 [&_button]:origin-center',
    standard: '',
    generous: '[&_button]:scale-115 [&_button]:origin-center',
  }[appearance.buttonSize || 'standard'];

  const borderRadiusClass = {
    'rounded-xl': 'rounded-lg',
    'rounded-2xl': 'rounded-2xl',
    'rounded-3xl': 'rounded-[28px]',
  }[appearance.borderRadius || 'rounded-2xl'] || 'rounded-2xl';

  // 5 款窗口质感风格映射
  const windowTheme: WidgetWindowStyle = appearance.windowStyle || 'glass';
  const windowStyleMap: Record<WidgetWindowStyle, {
    card: string;
    header: string;
    iconBox: string;
    title: string;
  }> = {
    glass: {
      card: 'border border-slate-200/50 dark:border-slate-800/70 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl shadow-lg',
      header: 'border-b border-slate-200/50 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/50',
      iconBox: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-2xs',
      title: 'text-slate-800 dark:text-slate-200',
    },
    stealth: {
      card: 'border border-emerald-500/40 dark:border-emerald-500/30 bg-black/95 text-slate-100 shadow-[0_0_25px_rgba(0,0,0,0.85)]',
      header: 'border-b border-emerald-500/20 bg-zinc-950/90 text-emerald-400',
      iconBox: 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 shadow-2xs',
      title: 'text-emerald-300 font-medium',
    },
    paper: {
      card: 'border border-amber-200/70 dark:border-stone-800 bg-[#fbfaf5] dark:bg-[#1c1b18] shadow-md text-stone-800 dark:text-stone-200',
      header: 'border-b border-amber-200/60 dark:border-stone-800/60 bg-[#f5f2e9] dark:bg-[#252420]',
      iconBox: 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 shadow-2xs',
      title: 'text-stone-800 dark:text-stone-200',
    },
    floating: {
      card: 'border border-indigo-500/30 dark:border-indigo-400/30 bg-white/95 dark:bg-slate-900/95 shadow-2xl',
      header: 'border-b-0 bg-transparent',
      iconBox: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-2xs',
      title: 'text-slate-800 dark:text-slate-200',
    },
    terminal: {
      card: 'border border-green-500/50 bg-[#080d08]/95 font-mono shadow-[0_0_15px_rgba(34,197,94,0.15)] text-green-400',
      header: 'border-b border-green-500/40 bg-[#0f170f]/90 text-green-300 font-mono',
      iconBox: 'bg-green-950/80 border border-green-500/40 text-green-400 shadow-2xs',
      title: 'text-green-400 font-mono font-semibold',
    },
  };
  const currentWindowStyle = windowStyleMap[windowTheme] || windowStyleMap.glass;

  // 中文语言下纯净化标题（去除括号英文字符）
  const localizedTitle = {
    inbox: isZh ? '闪念收集' : 'Inbox',
    tasks: isZh ? '今日待办' : 'Tasks',
    session: isZh ? '专注计时' : 'Focus Timer',
    timeline: isZh ? '今日日程' : 'Timeline',
    notes: isZh ? '随手便签' : 'Notes',
    goals: isZh ? '目标看板' : 'Goals Board',
  }[gridId] || title;

  // 挂件锁定状态：全局锁定优先；若全局未锁，则由本挂件独立的持久化锁定配置决定
  const [selfLocked, setSelfLocked] = useState<boolean>(() => {
    const layout = tauriWidgetService.getWidgetLayout(gridId);
    return layout?.isLocked ?? false;
  });
  const isLocked = (appearance.lockLayout ?? false) || selfLocked;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const prevSizeRef = useRef<{ width: number; height: number } | null>(null);
  const isResizingOrCollapsingRef = useRef(false);
  const isUserDraggingRef = useRef(false);
  const lastMouseDownTimeRef = useRef<number>(0);

  const meta = WIDGET_METAS[gridId] || WIDGET_METAS.tasks;
  const defaultWidth = meta.defaultWidth;
  const defaultHeight = meta.defaultHeight;

  // 双击顶栏折叠/展开逻辑：折叠时宽度缩短为挂件的默认标准宽度，高度 38px
  const handleToggleCollapse = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!appearance.collapseOnDoubleClick) return;

    isUserDraggingRef.current = false;
    isResizingOrCollapsingRef.current = true;
    setAlignment({
      alignLeft: false,
      alignRight: false,
      alignTop: false,
      alignBottom: false,
      snapVertical: false,
      label: null,
    });

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
      setAlignment({
        alignLeft: false,
        alignRight: false,
        alignTop: false,
        alignBottom: false,
        snapVertical: false,
        label: null,
      });
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

  // 顶栏控制按钮显隐样式计算（支持全局悬停/常显 + 每个按钮独立配置）
  const headerActionsMode = appearance.headerActionsMode || 'hover';
  const headerButtons: WidgetHeaderButtonsConfig = appearance.headerButtons || DEFAULT_HEADER_BUTTONS_CONFIG;

  const getBtnVisibilityClass = (btnKey: keyof WidgetHeaderButtonsConfig) => {
    const mode: HeaderButtonDisplayMode = headerButtons[btnKey] || headerActionsMode;
    if (mode === 'hidden') return 'hidden';
    if (mode === 'always') return 'opacity-100 transition-opacity';
    // 默认悬停模式 (hover)
    return 'opacity-0 group-hover/header:opacity-100 focus-within:opacity-100 transition-opacity duration-200';
  };

  const [isPinned, setIsPinned] = useState<boolean>(() => {
    const layout = tauriWidgetService.getWidgetLayout(gridId);
    return layout?.isPinned ?? settings.alwaysOnTop ?? false;
  });
  const [showSettings, setShowSettings] = useState(false);

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
        ? (isZh ? '已开启始终置顶 (浮在其他所有软件前面)' : 'Always on top enabled')
        : (isZh ? '已取消始终置顶' : 'Always on top disabled'),
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
        ? (isZh ? '当前挂件位置已锁定，禁止拖拽' : 'Current widget layout locked')
        : (isZh ? '当前挂件已解锁，可自由拖拽' : 'Current widget layout unlocked'),
      type: nextLock ? 'warning' : 'info',
    });
  };

  const handleClose = async () => {
    await tauriWidgetService.closeWidget(gridId);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleAmbientSoundChange = (sound: 'none' | 'rain' | 'whitenoise' | 'birds' | 'fireplace') => {
    updateGridSettings('session', { ambientSound: sound });
    if (sound === 'none') {
      ambientAudioService.stop();
    } else {
      const typeMap: Record<string, AmbientSoundType> = {
        rain: 'rain',
        whitenoise: 'white_noise',
        birds: 'waves',
        fireplace: 'white_noise',
      };
      const soundType = typeMap[sound] || 'rain';
      ambientAudioService.playSound(soundType);
    }
  };

  // 拖动对齐与导引线状态
  const [alignment, setAlignment] = useState<{
    alignLeft: boolean;
    alignRight: boolean;
    alignTop: boolean;
    alignBottom: boolean;
    snapVertical: boolean;
    label: string | null;
  }>({
    alignLeft: false,
    alignRight: false,
    alignTop: false,
    alignBottom: false,
    snapVertical: false,
    label: null,
  });

  const otherPositionsRef = useRef<Record<string, { x: number; y: number; width: number; height: number }>>({});
  const fadeoutTimerRef = useRef<number | null>(null);

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
        setAlignment({
          alignLeft: false,
          alignRight: false,
          alignTop: false,
          alignBottom: false,
          snapVertical: false,
          label: null,
        });
      }, 1200);
    };

    window.addEventListener('mouseup', handleMouseRelease);
    window.addEventListener('pointerup', handleMouseRelease);
    window.addEventListener('blur', handleMouseRelease);

    // 注册 Tauri 原生系统窗口移动事件监听 (彻底突破 Win32 模态拖拽消息泵限制)
    const win = getCurrentWebviewWindow();
    let unlistenMoved: (() => void) | undefined;

    win.onMoved(async (event) => {
      try {
        const [size, factor] = await Promise.all([
          win.outerSize(),
          win.scaleFactor(),
        ]);
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
          if (Math.abs((logicalX + logicalW) - (other.x + other.width)) <= 16) {
            hasAlignRight = true;
          }
          // 顶部水平对齐
          if (Math.abs(logicalY - other.y) <= 16) {
            hasAlignTop = true;
          }
          // 底部水平对齐
          if (Math.abs((logicalY + logicalH) - (other.y + other.height)) <= 16) {
            hasAlignBottom = true;
          }
          // 上下紧贴吸附
          if (
            Math.abs(logicalY - (other.y + other.height)) <= 18 ||
            Math.abs((logicalY + logicalH) - other.y) <= 18
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
          setAlignment({
            alignLeft: false,
            alignRight: false,
            alignTop: false,
            alignBottom: false,
            snapVertical: false,
            label: null,
          });
        }, 1200);
      } catch {
        // ignore move error
      }
    }).then((un) => {
      unlistenMoved = un;
    });

    // 监听窗口调整大小并持久化保存最新尺寸（过滤折叠态的脏尺寸；拉大时自动退出折叠态，彻底消除空白 Bug）
    let unlistenResized: (() => void) | undefined;
    win.onResized(async (event) => {
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
    }).then((un) => {
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

  return (
    <div
      className={`w-screen h-screen m-0 p-0 bg-transparent overflow-hidden flex flex-col select-none ${fontFamilyClass} ${buttonSizeClass} relative`}
      style={{
        zoom: zoomLevel,
        fontFamily: fontFamilyStyle,
      }}
    >
      {/* 核心挂件卡片：无缝贴合视口，根据设置采用对称圆角与 5 款窗口质感风格 */}
      <div
        className={`w-full h-full ${borderRadiusClass} ${currentWindowStyle.card} flex flex-col overflow-hidden transition-all duration-200 relative`}
        style={{ opacity: settings.opacityPercent / 100 }}
      >
        {/* 智能对齐导引微光边线 (仅在对齐时显示，静止后自动消失) */}
        {alignment.alignLeft && (
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-indigo-500 shadow-[0_0_10px_#6366f1] z-50 pointer-events-none" />
        )}
        {alignment.alignRight && (
          <div className="absolute top-0 bottom-0 right-0 w-1 bg-indigo-500 shadow-[0_0_10px_#6366f1] z-50 pointer-events-none" />
        )}
        {alignment.alignTop && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500 shadow-[0_0_10px_#6366f1] z-50 pointer-events-none" />
        )}
        {(alignment.alignBottom || alignment.snapVertical) && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 shadow-[0_0_10px_#6366f1] z-50 pointer-events-none" />
        )}

        {/* 顶栏：集成 data-tauri-drag-region、双击折叠与悬停显隐支持 */}
        <header
          data-tauri-drag-region={!isLocked ? true : undefined}
          onMouseDown={handleMouseDownHeader}
          onDoubleClick={handleToggleCollapse}
          className={`flex items-center justify-between px-3.5 py-2 ${currentWindowStyle.header} shrink-0 relative select-none group/header ${
            isLocked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
          }`}
          title={
            appearance.collapseOnDoubleClick
              ? (isZh ? '双击可折叠/展开挂件' : 'Double-click to collapse/expand')
              : undefined
          }
        >
          {/* 标题栏 */}
          <div data-tauri-drag-region={!isLocked ? true : undefined} className="flex items-center gap-2 pointer-events-none min-w-0">
            <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${currentWindowStyle.iconBox}`}>
              <IconComponent className="w-3.5 h-3.5" />
            </div>
            <span className={`text-xs font-semibold tracking-wide truncate ${currentWindowStyle.title}`}>
              {localizedTitle}
            </span>
            {isCollapsed && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleCollapse();
                }}
                className="text-[10px] text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-0.5 pointer-events-auto cursor-pointer px-1.5 py-0.5 rounded bg-indigo-50/80 dark:bg-indigo-950/60 transition-colors"
                title={isZh ? '点击展开挂件' : 'Click to expand'}
              >
                <ChevronDown className="w-3 h-3 animate-pulse" />
                <span>{isZh ? '已折叠' : 'Collapsed'}</span>
              </button>
            )}
          </div>

          {/* 实时对齐状态精简徽标 (拖动对齐时优雅显示，静止后自动淡出，绝对不撑大或变形) */}
          {alignment.label && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-600/90 text-white text-[10px] font-medium shadow-xs shrink-0 whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-150">
              <Magnet className="w-2.5 h-2.5" />
              <span>{alignment.label}</span>
            </div>
          )}

          {/* 右侧操作按钮群：支持全局悬停/常显以及单个按钮独立配置 */}
          <div className="flex items-center gap-1 cursor-default shrink-0">
            {/* 始终置顶按钮 (浮在所有软件前面) */}
            <button
              type="button"
              onClick={handleTogglePin}
              className={`p-1 rounded-md transition-colors cursor-pointer ${getBtnVisibilityClass('pin')} ${
                isPinned
                  ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-slate-800/60'
              }`}
              title={isPinned ? (isZh ? '取消始终置顶 (目前浮在其他软件前)' : 'Disable always on top') : (isZh ? '始终置顶 (浮在其他所有软件前)' : 'Enable always on top')}
            >
              <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
            </button>

            {/* 锁定位置与尺寸按钮 (禁止拖动防误触) */}
            <button
              type="button"
              onClick={handleToggleLock}
              className={`p-1 rounded-md transition-colors cursor-pointer ${getBtnVisibilityClass('lock')} ${
                isLocked
                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 font-semibold ring-1 ring-amber-500/40'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-slate-800/60'
              }`}
              title={isLocked ? (isZh ? '位置已锁定 (点击解锁拖动)' : 'Layout locked (Click to unlock)') : (isZh ? '锁定挂件位置 (禁止拖动防误触)' : 'Lock widget layout')}
            >
              {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>

            {/* 专属自定义配置按钮 */}
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1 rounded-md transition-colors cursor-pointer ${getBtnVisibilityClass('settings')} ${
                showSettings
                  ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-slate-800/60'
              }`}
              title={isZh ? '自定义此格子偏好与外观' : 'Customize preferences & appearance'}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>

            {/* 主题切换 */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-slate-800/60 transition-colors cursor-pointer ${getBtnVisibilityClass('theme')}`}
              title={isZh ? '切换深色/浅色模式' : 'Toggle dark/light mode'}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* 收起挂件 */}
            <button
              type="button"
              onClick={handleClose}
              className={`p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer ml-0.5 ${getBtnVisibilityClass('close')}`}
              title={isZh ? '收起此挂件' : 'Close widget'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* 深度自定义抽屉面板（点击顶栏自定义滑出） */}
        {showSettings && (
          <div className="p-3.5 bg-slate-50/95 dark:bg-slate-850/95 border-b border-slate-200 dark:border-slate-800 text-xs space-y-3.5 shrink-0 max-h-[70vh] overflow-y-auto animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200 pb-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isZh ? `${localizedTitle} 偏好定制` : `${localizedTitle} Settings`}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
              >
                <Check className="w-3 h-3" />
                <span>{isZh ? '完成' : 'Done'}</span>
              </button>
            </div>

            {/* 1. 闪念收集专属深度配置 */}
            {gridId === 'inbox' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">默认初始标签：</span>
                  <div className="flex items-center gap-1">
                    {(['unsorted', 'idea', 'all'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => updateGridSettings('inbox', { defaultTab: tab })}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          settings.gridSettings.inbox.defaultTab === tab
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {tab === 'unsorted' ? '未整理' : tab === 'idea' ? '灵感' : '全部'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">一键推入目标：</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateGridSettings('inbox', { quickActionTarget: 'todayFocus' })}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        settings.gridSettings.inbox.quickActionTarget === 'todayFocus'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      今日聚焦
                    </button>
                    <button
                      type="button"
                      onClick={() => updateGridSettings('inbox', { quickActionTarget: 'inbox' })}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        settings.gridSettings.inbox.quickActionTarget === 'inbox'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      普通待办
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">列表布局密度：</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateGridSettings('inbox', { displayDensity: 'comfortable' })}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        settings.gridSettings.inbox.displayDensity === 'comfortable'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      舒适卡片
                    </button>
                    <button
                      type="button"
                      onClick={() => updateGridSettings('inbox', { displayDensity: 'compact' })}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        settings.gridSettings.inbox.displayDensity === 'compact'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      紧凑单行
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. 今日待办专属深度配置 */}
            {gridId === 'tasks' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">默认展示视图：</span>
                  <div className="flex items-center gap-1">
                    {(['focus', 'today', 'all'] as const).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => updateGridSettings('tasks', { defaultFilter: filter })}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          settings.gridSettings.tasks.defaultFilter === filter
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {filter === 'focus' ? '聚焦' : filter === 'today' ? '今日' : '全部'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">排序偏好：</span>
                  <div className="flex items-center gap-1">
                    {(['priority', 'time'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => updateGridSettings('tasks', { sortBy: s })}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          settings.gridSettings.tasks.sortBy === s
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {s === 'priority' ? (isZh ? '优先级优先' : 'Priority') : (isZh ? '创建时间' : 'Created Time')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">{isZh ? '展示已完成任务：' : 'Show Completed:'}</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateGridSettings('tasks', {
                        showCompleted: !settings.gridSettings.tasks.showCompleted,
                      })
                    }
                    className={`px-2.5 py-0.5 rounded text-[11px] font-medium ${
                      settings.gridSettings.tasks.showCompleted
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {settings.gridSettings.tasks.showCompleted ? '开启' : '关闭'}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">显示优先级色彩指示：</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateGridSettings('tasks', {
                        showPriorityDots: !settings.gridSettings.tasks.showPriorityDots,
                      })
                    }
                    className={`px-2.5 py-0.5 rounded text-[11px] font-medium ${
                      settings.gridSettings.tasks.showPriorityDots
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {settings.gridSettings.tasks.showPriorityDots ? '开启' : '关闭'}
                  </button>
                </div>
              </div>
            )}

            {/* 3. 专注计时专属深度配置 */}
            {gridId === 'session' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">默认专注时长：</span>
                  <select
                    value={settings.gridSettings.session.defaultDurationMinutes}
                    onChange={(e) =>
                      updateGridSettings('session', {
                        defaultDurationMinutes: Number(e.target.value),
                      })
                    }
                    className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none text-xs"
                  >
                    <option value={15}>15 分钟 (快速冲刺)</option>
                    <option value={25}>25 分钟 (经典番茄)</option>
                    <option value={45}>45 分钟 (深度心流)</option>
                    <option value={60}>60 分钟 (长时专注)</option>
                    <option value={0}>自由计时 (正向秒表)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-indigo-600" />
                    <span>伴随背景白噪音：</span>
                  </span>
                  <select
                    value={settings.gridSettings.session.ambientSound}
                    onChange={(e) =>
                      handleAmbientSoundChange(
                        e.target.value as 'none' | 'rain' | 'whitenoise' | 'birds' | 'fireplace'
                      )
                    }
                    className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none text-xs"
                  >
                    <option value="none">无 (静音)</option>
                    <option value="rain">自然雨声</option>
                    <option value="whitenoise">白噪音</option>
                    <option value="birds">森林鸟鸣</option>
                    <option value="fireplace">壁炉炭火</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">专注结束自动勾选完成任务：</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateGridSettings('session', {
                        autoCompleteTaskOnFinish: !settings.gridSettings.session.autoCompleteTaskOnFinish,
                      })
                    }
                    className={`px-2.5 py-0.5 rounded text-[11px] font-medium ${
                      settings.gridSettings.session.autoCompleteTaskOnFinish
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {settings.gridSettings.session.autoCompleteTaskOnFinish ? '开启' : '关闭'}
                  </button>
                </div>
              </div>
            )}

            {/* 4. 今日日程专属深度配置 */}
            {gridId === 'timeline' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">显示时间跨度：</span>
                  <div className="flex items-center gap-1">
                    {(['upcoming', 'allDay'] as const).map((scope) => (
                      <button
                        key={scope}
                        type="button"
                        onClick={() => updateGridSettings('timeline', { scope })}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          settings.gridSettings.timeline.scope === scope
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {scope === 'upcoming' ? '仅接下来' : '全天'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">进行中日程脉冲动态高亮：</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateGridSettings('timeline', {
                        showNextUpPulse: !settings.gridSettings.timeline.showNextUpPulse,
                      })
                    }
                    className={`px-2.5 py-0.5 rounded text-[11px] font-medium ${
                      settings.gridSettings.timeline.showNextUpPulse
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {settings.gridSettings.timeline.showNextUpPulse ? '开启' : '关闭'}
                  </button>
                </div>
              </div>
            )}

            {/* 5. 随手便签专属深度配置 */}
            {gridId === 'notes' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">便笺纸张主题：</span>
                  <div className="flex items-center gap-1">
                    {[
                      { id: 'classic', label: '经典' },
                      { id: 'yellow', label: '暖黄' },
                      { id: 'mint', label: '薄荷' },
                      { id: 'dark', label: '暗黑' },
                    ].map((th) => (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() =>
                          updateGridSettings('notes', {
                            paperTheme: th.id as 'classic' | 'yellow' | 'mint' | 'dark',
                          })
                        }
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          settings.gridSettings.notes.paperTheme === th.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {th.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">排版字体族：</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateGridSettings('notes', { fontFamily: 'sans' })}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium font-sans ${
                        settings.gridSettings.notes.fontFamily === 'sans'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      现代无衬线
                    </button>
                    <button
                      type="button"
                      onClick={() => updateGridSettings('notes', { fontFamily: 'mono' })}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium font-mono ${
                        settings.gridSettings.notes.fontFamily === 'mono'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      等宽代码
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">便签字号大小：</span>
                  <div className="flex items-center gap-1">
                    {(['sm', 'base', 'lg'] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => updateGridSettings('notes', { fontSize: sz })}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          settings.gridSettings.notes.fontSize === sz
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {sz === 'sm' ? '小号' : sz === 'base' ? '中号' : '大号'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 通用外观与窗口质感风格 */}
            <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">
                  {isZh ? '窗口质感风格：' : 'Window Style:'}
                </span>
                <div className="flex items-center gap-1">
                  {[
                    { id: 'glass', labelZh: '毛玻璃', labelEn: 'Glass' },
                    { id: 'stealth', labelZh: '曜石黑', labelEn: 'OLED' },
                    { id: 'paper', labelZh: '纸质暖', labelEn: 'Paper' },
                    { id: 'floating', labelZh: '无界悬浮', labelEn: 'Floating' },
                    { id: 'terminal', labelZh: '终端赛博', labelEn: 'Terminal' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => updateAppearance({ windowStyle: style.id as WidgetWindowStyle })}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                        (settings.appearance?.windowStyle || 'glass') === style.id
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      {isZh ? style.labelZh : style.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* 双击折叠与位置锁定快捷开关 */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => updateAppearance({ collapseOnDoubleClick: !appearance.collapseOnDoubleClick })}
                  className={`px-2 py-1 rounded text-[10px] font-medium border flex items-center justify-between transition-colors cursor-pointer ${
                    appearance.collapseOnDoubleClick
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  <span>{isZh ? '双击顶栏折叠' : 'Double-click Collapse'}</span>
                  <span>{appearance.collapseOnDoubleClick ? '✓' : ''}</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleLock}
                  className={`px-2 py-1 rounded text-[10px] font-medium border flex items-center justify-between transition-colors cursor-pointer ${
                    isLocked
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>{isZh ? '锁定当前挂件' : 'Lock Layout'}</span>
                  </span>
                  <span>{isLocked ? '✓' : ''}</span>
                </button>
              </div>

              {/* 顶栏按钮显示策略与精细化独立配置 */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">
                    {isZh ? '按钮默认显示模式：' : 'Header Actions Mode:'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateAppearance({ headerActionsMode: 'hover' })}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                        (appearance.headerActionsMode || 'hover') === 'hover'
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {isZh ? '静默沉浸 (悬停显现)' : 'Hover to Reveal'}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateAppearance({ headerActionsMode: 'always' })}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                        appearance.headerActionsMode === 'always'
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {isZh ? '一直显示' : 'Always Show'}
                    </button>
                  </div>
                </div>

                {/* 各按钮独立配置细化行 */}
                <div className="grid grid-cols-5 gap-1 pt-1 text-[10px]">
                  {[
                    { key: 'pin' as const, labelZh: '置顶', labelEn: 'Pin' },
                    { key: 'lock' as const, labelZh: '锁位', labelEn: 'Lock' },
                    { key: 'settings' as const, labelZh: '配置', labelEn: 'Settings' },
                    { key: 'theme' as const, labelZh: '主题', labelEn: 'Theme' },
                    { key: 'close' as const, labelZh: '关闭', labelEn: 'Close' },
                  ].map((btn) => {
                    const cur = headerButtons[btn.key] || appearance.headerActionsMode || 'hover';
                    const nextMode: HeaderButtonDisplayMode =
                      cur === 'hover' ? 'always' : cur === 'always' ? 'hidden' : 'hover';
                    return (
                      <button
                        key={btn.key}
                        type="button"
                        onClick={() => {
                          const updated = { ...headerButtons, [btn.key]: nextMode };
                          updateAppearance({ headerButtons: updated });
                        }}
                        className={`p-1 rounded border text-center transition-colors cursor-pointer ${
                          cur === 'hidden'
                            ? 'bg-slate-100 dark:bg-slate-850 text-slate-400 border-dashed border-slate-300 dark:border-slate-700'
                            : cur === 'always'
                            ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-semibold'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                        title={isZh ? `点击切换: ${btn.labelZh} (当前: ${cur === 'always' ? '常显' : cur === 'hover' ? '悬停' : '隐藏'})` : `Toggle: ${btn.labelEn} (${cur})`}
                      >
                        <div className="font-medium">{isZh ? btn.labelZh : btn.labelEn}</div>
                        <div className="text-[9px] opacity-70">
                          {cur === 'always' ? (isZh ? '常显' : 'Always') : cur === 'hover' ? (isZh ? '悬停' : 'Hover') : (isZh ? '隐藏' : 'Hidden')}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-500 dark:text-slate-400">
                  {isZh ? '全局字体大小：' : 'Font Size:'}
                </span>
                <div className="flex items-center gap-1">
                  {(['small', 'normal', 'large'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => updateAppearance({ fontSizeLevel: lvl })}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                        (settings.appearance?.fontSizeLevel || 'normal') === lvl
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {lvl === 'small' ? (isZh ? '小号' : 'Small') : lvl === 'normal' ? (isZh ? '标准' : 'Standard') : (isZh ? '大号' : 'Large')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">
                  {isZh ? '操作按钮尺寸：' : 'Button Size:'}
                </span>
                <div className="flex items-center gap-1">
                  {(['compact', 'standard', 'generous'] as const).map((btn) => (
                    <button
                      key={btn}
                      type="button"
                      onClick={() => updateAppearance({ buttonSize: btn })}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                        (settings.appearance?.buttonSize || 'standard') === btn
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {btn === 'compact' ? (isZh ? '紧凑' : 'Compact') : btn === 'standard' ? (isZh ? '适中' : 'Standard') : (isZh ? '宽大' : 'Generous')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 通用外观半透明度调节 */}
            <div className="space-y-1 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>{isZh ? '卡片半透明度：' : 'Opacity:'}</span>
                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                  {settings.opacityPercent}%
                </span>
              </div>
              <input
                type="range"
                min={40}
                max={100}
                value={settings.opacityPercent}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* 恢复与重置按钮行 */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
              <button
                type="button"
                onClick={handleResetWindowSize}
                className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium"
                title={isZh ? '将挂件窗口恢复到最初标准黄金比例大小' : 'Reset widget window to default size'}
              >
                <Maximize2 className="w-3 h-3" />
                <span>{isZh ? '恢复标准窗口尺寸' : 'Reset Window Size'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  resetToDefaults();
                  handleResetWindowSize();
                }}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isZh ? '恢复出厂设置' : 'Reset to Defaults'}</span>
              </button>
            </div>
          </div>
        )}

        {/* 内容自适应区域：折叠时隐藏；拉伸高度时自动平滑重现 */}
        <main
          className={`flex-1 min-h-0 flex flex-col overflow-hidden ${
            isCollapsed ? 'hidden' : ''
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
