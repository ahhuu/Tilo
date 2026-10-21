import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 弹窗嵌套深度。
 *
 * 弹窗可以嵌套（向导里再开确认框、任务详情里再开改期框）。把 Esc / Tab
 * 监听到 document 后必须只有「最内层」响应，否则一次 Esc 会关掉两层。
 *
 * 不能用 DOM 顺序判断：React 的 commit 顺序是子先父后，同时渲染的嵌套弹窗
 * 内层反而先插入 body，取「最后一个」会判反。深度来自 React 树，天然准确。
 */
const ModalDepthContext = React.createContext(0);
const openModalDepths: number[] = [];

export interface ModalProps {
  /** 是否可见。默认 true —— 这些弹窗多数为"父级条件挂载"式渲染，挂载即显示 */
  isOpen?: boolean;
  onClose: () => void;
  /** 无障碍必填：弹窗的语义名称 */
  ariaLabel: string;
  /** 简单标题（渲染为默认头栏）。与 header 互斥，二选一 */
  title?: React.ReactNode;
  /** 标题下方的补充说明 */
  description?: React.ReactNode;
  /** 自定义头栏（含图标/布局/自带关闭按钮）。传入后用它替代默认标题头栏 */
  header?: React.ReactNode;
  /** 底部固定操作栏（自动带安全区内边距） */
  footer?: React.ReactNode;
  /** 主体是否可滚动，默认 true */
  scrollable?: boolean;
  /** 桌面端最大宽度，默认 sm:max-w-lg */
  maxWidthClass?: string;
  /** 点击遮罩 / 按 Esc 是否关闭，默认 true。关键流程（如退出确认）可置 false 由按钮控制 */
  dismissable?: boolean;
  /**
   * `dismissable={false}` 时系统级返回键需要一个明确动作。
   * 默认什么都不做（返回键被吞掉但不会退出 App，避免意外丢进度）；
   * 传 `onClose` 则返回键等同于「显式退出」，与点右上角关闭一致。
   */
  onBack?: () => void;
  /** 主体滚动区自定义类名（为空则不施加默认内边距，由内部内容自带） */
  bodyClassName?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * 全站唯一弹窗壳（对话框 / 底部抽屉统一收口处）。
 *
 * 此前各业务弹窗各自手写遮罩：背景色 bg-slate-900/40·/50·/60 不一、
 * z-index 从 z-40 到 z-[9999] 混乱、是否锁背景滚动 / 是否支持 Esc / 是否
 * 陷阱焦点各不相同。统一到这里后：
 * - 移动端自底向上抽屉、桌面端居中卡片（同一套响应式逻辑）
 * - 遮罩层级 (z-[9999]) 与背景色 (--modal-overlay token) 全站一致
 * - 打开时锁定背景滚动、Esc 关闭、焦点陷阱 + 关闭后焦点归还、aria-modal 语义
 * - 顶部 / 底部安全区适配、max-h + 主体独立滚动 + overscroll-contain
 *
 * 注意：容器上**不要**加 `select-none`（user-select: none）。
 * Android WebView 下祖先节点的 user-select: none 会破坏中文输入法的
 * composition（表现为"输入不显示、要删一个字符才生效"），
 * 因此本组件及其内部输入框一律保持可选中。
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen = true,
  onClose,
  ariaLabel,
  title,
  description,
  header,
  footer,
  scrollable = true,
  maxWidthClass = 'sm:max-w-lg',
  dismissable = true,
  onBack,
  bodyClassName,
  className,
  children,
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  // 本弹窗在嵌套中的层级：父级传递的深度 + 1
  const depth = React.useContext(ModalDepthContext) + 1;

  // 打开时锁定背景滚动，关闭时恢复
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // 焦点管理：打开时把焦点移入弹窗、陷阱 Tab、并把逃逸到弹窗外的焦点拉回；
  // 关闭后归还焦点。监听挂在 document 上，因为焦点一旦落在 body（例如某个
  // 被移除的按钮、或用户点击了非聚焦区域），挂在卡片上的 keydown 就收不到了。
  useEffect(() => {
    if (!isOpen) return;
    const dialog = cardRef.current;
    if (!dialog) return;

    // 只有最内层弹窗响应键盘。深度来自 React 树（见 ModalDepthContext），
    // 而不是 DOM 顺序——后者在嵌套时会被 React 的子先父后提交顺序判反。
    openModalDepths.push(depth);
    const isTopmost = () => depth === Math.max(...openModalDepths);

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusable = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

    // 初始聚焦：优先弹窗内首个可聚焦元素，否则聚焦弹窗本身
    const focusables = getFocusable();
    if (focusables.length > 0) {
      focusables[0].focus();
    } else {
      dialog.focus();
    }

    const onKeyDown = (e: KeyboardEvent) => {
      // 只有栈顶弹窗响应，避免嵌套时一次 Esc 关掉两层
      if (!isTopmost()) return;

      if (e.key === 'Escape') {
        if (!dismissable) return;
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const items = getFocusable();
      if (items.length === 0) {
        e.preventDefault();
        dialog.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;

      // 焦点已不在弹窗内（落到 body / 页面元素）：拉回弹窗，而不是继续外溢
      if (!active || !dialog.contains(active)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
        return;
      }

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    // 兜底：焦点被移出弹窗（切窗口、元素被卸载、脚本 focus）时拉回。
    // 若焦点落进「另一个 dialog」（嵌套弹窗），交给那个弹窗自己管。
    const onFocusIn = (e: FocusEvent) => {
      if (!isTopmost()) return;
      const target = e.target as HTMLElement | null;
      if (!target || dialog.contains(target)) return;
      if (target.closest?.('[role="dialog"]')) return;
      const items = getFocusable();
      (items[0] ?? dialog).focus();
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('focusin', onFocusIn);
      const depthIndex = openModalDepths.lastIndexOf(depth);
      if (depthIndex >= 0) openModalDepths.splice(depthIndex, 1);
      previouslyFocused?.focus?.();
    };
  }, [isOpen, dismissable, onClose, depth]);

  if (!isOpen) return null;

  const content = (
    <ModalDepthContext.Provider value={depth}>
      <div
        className={cn(
          'fixed inset-0 z-[9999] flex items-end sm:items-center justify-center',
          'bg-[var(--modal-overlay)] backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150',
          dismissable && 'cursor-default'
        )}
        onClick={(e) => {
          // 只响应遮罩本身（卡片内部已 stopPropagation），避免子元素点击误关
          if (e.target !== e.currentTarget) return;
          if (dismissable) {
            onClose();
          } else {
            // 不可点遮罩关闭时，Android 硬件返回键仍需要一个明确动作：
            // nativeService 会向遮罩派发合成 click，这里转交给 onBack。
            onBack?.();
          }
        }}
      >
        <div
          ref={cardRef}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'w-full bg-white dark:bg-slate-900',
            'rounded-t-2xl sm:rounded-2xl border-t sm:border',
            'border-slate-200 dark:border-slate-800 shadow-2xl',
            'flex flex-col max-h-[88vh] sm:max-h-[90vh] outline-none',
            'animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 text-left',
            maxWidthClass,
            className
          )}
        >
          {/* 移动端拖拽把手 */}
          <div className="sm:hidden w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2 shrink-0" />

          {(header || title || description) && (
            <div className="flex items-start justify-between gap-3 px-5 pt-2 pb-3 sm:pt-5 shrink-0">
              {header ? (
                header
              ) : (
                <div className="min-w-0">
                  {title && (
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {title}
                    </h3>
                  )}
                  {description && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {description}
                    </p>
                  )}
                </div>
              )}
              {!header && (title || description) && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 -mr-2 -mt-1 flex items-center justify-center p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          <div
            className={cn(
              'min-h-0',
              scrollable ? 'flex-1 overflow-y-auto overscroll-contain' : '',
              bodyClassName ?? 'px-5 pb-3'
            )}
          >
            {children}
          </div>

          {footer ? (
            <div className="shrink-0 px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] sm:pb-3">
              {footer}
            </div>
          ) : (
            // 无 footer 时也要给主体留出安全区，否则底部内容会被手势条压住
            <div className="shrink-0 h-[env(safe-area-inset-bottom,0px)] sm:h-0" />
          )}
        </div>
      </div>
    </ModalDepthContext.Provider>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
};

export default Modal;
