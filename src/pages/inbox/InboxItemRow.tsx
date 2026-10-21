import React from 'react';
import { ArrowRight, BookOpen, ExternalLink, Lightbulb, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/core/i18n';
import type { InboxItem } from '@/core/types/domain';
import type { InboxTab } from './useInboxData';

interface InboxItemRowProps {
  item: InboxItem;
  index: number;
  isSelected: boolean;
  isFocused: boolean;
  tab: InboxTab;
  onFocus: (index: number) => void;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenTaskModal: (item: InboxItem) => void;
  onOpenNoteModal: (item: InboxItem) => void;
  onTriage: (id: string, state: 'someday' | 'archived') => void;
}

/** 单条收件箱条目：选择框 + 类型标记 + 正文 + 分流动作。 */
export const InboxItemRow: React.FC<InboxItemRowProps> = ({
  item,
  index,
  isSelected,
  isFocused,
  tab,
  onFocus,
  onToggleSelect,
  onDelete,
  onOpenTaskModal,
  onOpenNoteModal,
  onTriage,
}) => {
  const { language } = useI18n();

  return (
    <div
      onClick={() => onFocus(index)}
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-3.5 rounded-xl border transition-all group shadow-2xs gap-2.5 sm:gap-3 ${
        isFocused
          ? 'border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/10 bg-white dark:bg-slate-800'
          : 'border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:border-slate-300'
      }`}
    >
      {/* Title and metadata row */}
      <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
        {/* Multi-select checkbox.
            视觉尺寸保持 20px（h-5 w-5），但用 label 的 padding + 负 margin
            把点击热区扩展到约 44px，既满足移动端触控，又不放大原生勾选框本身。 */}
        <label className="mt-0.5 sm:mt-0 shrink-0 flex items-center justify-center p-3 -m-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(item.id)}
            className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
        </label>

        {/* URL icon or point */}
        {item.kind === 'link' ? (
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5 sm:mt-0 p-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0 cursor-pointer"
            title={item.url}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : item.kind === 'idea' ? (
          <span
            className="mt-0.5 sm:mt-0 p-1 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0"
            title={language === 'zh-CN' ? '想法备忘' : 'Idea'}
          >
            <Lightbulb className="w-3.5 h-3.5" />
          </span>
        ) : (
          <div className="mt-1.5 sm:mt-0 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
        )}

        {/* Raw Text & domain */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start sm:items-center gap-1.5 flex-wrap sm:flex-nowrap">
            <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 break-words leading-snug">
              {item.rawText}
            </p>
            {item.kind === 'idea' && (
              <Badge
                variant="outline"
                size="sm"
                className="text-[10px] px-1 py-0 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 shrink-0"
              >
                {language === 'zh-CN' ? '想法' : 'Idea'}
              </Badge>
            )}
          </div>
          {item.urlDomain && (
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono block mt-0.5">{item.urlDomain}</span>
          )}
        </div>

        {/* Mobile top-right delete button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="sm:hidden p-1 text-slate-300 hover:text-red-500 cursor-pointer shrink-0 ml-auto"
          title={language === 'zh-CN' ? '删除条目' : 'Delete item'}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Triage Actions: Full row on mobile, right-aligned on desktop */}
      <div className="flex items-center gap-1 sm:gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity justify-end shrink-0 pt-1.5 sm:pt-0 border-t border-slate-100 dark:border-slate-800/80 sm:border-t-0">
        {tab === 'unsorted' && (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onOpenTaskModal(item);
              }}
              className="h-6 sm:h-7 text-[11px] sm:text-xs px-2 gap-1 font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 sm:bg-transparent dark:bg-indigo-950/30 sm:dark:bg-transparent hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer whitespace-nowrap"
            >
              <span>{language === 'zh-CN' ? '转任务' : 'Task'}</span>
              <ArrowRight className="w-3 h-3" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onOpenNoteModal(item);
              }}
              className="h-6 sm:h-7 text-[11px] sm:text-xs px-2 gap-1 font-medium text-slate-600 dark:text-slate-300 bg-slate-100/50 sm:bg-transparent dark:bg-slate-800/40 sm:dark:bg-transparent cursor-pointer whitespace-nowrap"
            >
              <BookOpen className="w-3 h-3" />
              <span>{language === 'zh-CN' ? '转笔记' : 'Note'}</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onTriage(item.id, 'someday');
              }}
              className="h-6 sm:h-7 text-[11px] sm:text-xs px-1.5 sm:px-2 text-slate-500 cursor-pointer whitespace-nowrap"
            >
              {language === 'zh-CN' ? '稍后' : 'Someday'}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onTriage(item.id, 'archived');
              }}
              className="h-6 sm:h-7 text-[11px] sm:text-xs px-1.5 sm:px-2 text-slate-400 hover:text-slate-600 cursor-pointer whitespace-nowrap"
            >
              {language === 'zh-CN' ? '归档' : 'Archive'}
            </Button>
          </>
        )}

        {tab === 'someday' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onOpenTaskModal(item);
            }}
            className="h-6 sm:h-7 text-[11px] sm:text-xs gap-1 text-indigo-600 cursor-pointer whitespace-nowrap"
          >
            <span>{language === 'zh-CN' ? '转为执行任务' : 'Convert to Task'}</span>
            <ArrowRight className="w-3 h-3" />
          </Button>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="hidden sm:inline-flex p-1 rounded text-slate-300 hover:text-red-500 cursor-pointer"
          title={language === 'zh-CN' ? '删除条目' : 'Delete item'}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
