import React from 'react';
import { Inbox as InboxIcon } from 'lucide-react';
import { useI18n } from '@/core/i18n';
import type { InboxItem } from '@/core/types/domain';
import { InboxItemRow } from './InboxItemRow';
import type { InboxTab } from './useInboxData';

interface InboxItemsListProps {
  items: InboxItem[];
  tab: InboxTab;
  selectedIds: Set<string>;
  focusedIndex: number;
  onFocus: (index: number) => void;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenTaskModal: (item: InboxItem) => void;
  onOpenNoteModal: (item: InboxItem) => void;
  onTriage: (id: string, state: 'someday' | 'archived') => void;
}

/** 待整理 / Someday / 已归档三个 tab 共用的条目列表。 */
export const InboxItemsList: React.FC<InboxItemsListProps> = ({
  items,
  tab,
  selectedIds,
  focusedIndex,
  onFocus,
  onToggleSelect,
  onDelete,
  onOpenTaskModal,
  onOpenNoteModal,
  onTriage,
}) => {
  const { language } = useI18n();

  if (items.length === 0) {
    return (
      <div className="py-16 text-center text-xs text-slate-400 space-y-3">
        <InboxIcon className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
        <p>
          {language === 'zh-CN'
            ? `当前「${
                tab === 'unsorted' ? '待整理' : tab === 'someday' ? 'Someday 待办池' : '已归档'
              }」暂无条目。按 Ctrl+Shift+Space 即可随时快速收集。`
            : `Nothing to process in ${tab}. Use Ctrl+Shift+Space to capture thoughts.`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((item, index) => (
        <InboxItemRow
          key={item.id}
          item={item}
          index={index}
          isSelected={selectedIds.has(item.id)}
          isFocused={index === focusedIndex}
          tab={tab}
          onFocus={onFocus}
          onToggleSelect={onToggleSelect}
          onDelete={onDelete}
          onOpenTaskModal={onOpenTaskModal}
          onOpenNoteModal={onOpenNoteModal}
          onTriage={onTriage}
        />
      ))}
    </div>
  );
};
