import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** 无障碍必填：弹窗的语义名称 */
  ariaLabel: string;
  /** 标题区文案（可选）。不传则只渲染右上角关闭按钮 */
  title?: React.ReactNode;
  /** 标题下方的补充说明 */
  description?: React.ReactNode;
  /** 底部固定操作栏（会自动带上安全区内边距） */
  footer?: React.ReactNode;
  /** 主体是否可滚动，默认 true */
  scrollable?: boolean;
  /** 桌面端最大宽度，默认 sm:max-w-lg */
  maxWidthClass?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * 移动端底部抽屉 / 桌面端居中弹窗 的统一基础组件。
 *
 * 全站此前有 19 个弹窗各自手写移动端适配，出现了 3 套不一致写法：
 * 有的忘了 max-h（小屏按钮点不到）、有的忘了底部安全区（被手势条压住）、
 * 有的没做滚动锁定。统一收口到这里，避免每个新弹窗重复踩坑。
 *
 * 已内置：
 * - 移动端自底向上（items-end + rounded-t-2xl + 拖拽把手），桌面端居中卡片
 * - max-h-[88vh] + 主体独立滚动 + overscroll-contain（避免橡皮筋）
 * - 底部 / 顶部安全区适配
 * - 打开时锁定背景滚动、Esc 关闭、aria-modal 语义
 *
 * 注意：容器上**不要**加 `select-none`（user-select: none）。
 * Android WebView 下祖先节点的 user-select: none 会破坏中文输入法的
 * composition（表现为"输入不显示、要删一个字符才生效"），
 * 因此本组件及其内部输入框一律保持可选中。
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  ariaLabel,
  title,
  description,
  footer,
  scrollable = true,
  maxWidthClass = 'sm:max-w-lg',
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

  // Esc 关闭（桌面端）
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'w-full bg-white dark:bg-slate-900',
          'rounded-t-2xl sm:rounded-2xl border-t sm:border',
          'border-slate-200 dark:border-slate-800 shadow-2xl',
          'flex flex-col max-h-[88vh] sm:max-h-[90vh]',
          'animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 text-left',
          maxWidthClass,
          className
        )}
      >
        {/* 移动端拖拽把手 */}
        <div className="sm:hidden w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2 shrink-0" />

        {(title || description) && (
          <div className="flex items-start justify-between gap-3 px-5 pt-2 pb-3 sm:pt-5 shrink-0">
            <div className="min-w-0">
              {title && (
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>
              )}
              {description && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 -mr-2 -mt-1 flex items-center justify-center p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div
          className={cn(
            'px-5 pb-2 min-h-0',
            scrollable ? 'flex-1 overflow-y-auto overscroll-contain' : ''
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

export default BottomSheet;
