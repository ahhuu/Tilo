import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  bodyClassName,
  className,
  children,
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);

  // 打开时锁定背景滚动，关闭时恢复
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // 焦点管理：打开时把焦点移入弹窗并陷阱 Tab，关闭后归还焦点
  useEffect(() => {
    if (!isOpen) return;
    const dialog = cardRef.current;
    if (!dialog) return;

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
      if (e.key === 'Escape') {
        if (!dismissable) return;
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const items = getFocusable();
        if (items.length === 0) {
          e.preventDefault();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    dialog.addEventListener('keydown', onKeyDown);
    return () => {
      dialog.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isOpen, dismissable, onClose]);

  if (!isOpen) return null;

  const content = (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex items-end sm:items-center justify-center',
        'bg-[var(--modal-overlay)] backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150',
        dismissable && 'cursor-default'
      )}
      onClick={dismissable ? onClose : undefined}
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
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>
                )}
                {description && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
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
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
};

export default Modal;
