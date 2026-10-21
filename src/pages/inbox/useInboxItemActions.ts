import React, { useCallback, useState } from 'react';
import { db } from '@/storage/db';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { triageInboxItem, convertInboxToTask, convertInboxToNote } from '@/services/inboxCommands';
import { restoreSoftDeletedRow, softDeleteRow } from '@/services/tombstoneService';
import type { InboxItem, PriorityLevel } from '@/core/types/domain';

interface UseInboxItemActionsArgs {
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}

/**
 * 单条分流、删除、转任务/转笔记，以及批量操作。
 * 三个转写弹窗的开关状态也放在这里，页面只负责渲染。
 */
export const useInboxItemActions = ({ selectedIds, setSelectedIds }: UseInboxItemActionsArgs) => {
  const { addToast } = useUIStore();
  const { language } = useI18n();

  const [taskModalItem, setTaskModalItem] = useState<InboxItem | null>(null);
  const [noteModalItem, setNoteModalItem] = useState<InboxItem | null>(null);

  const handleTriage = useCallback(
    async (id: string, newState: 'someday' | 'archived') => {
      await triageInboxItem(id, newState);
      addToast({
        message:
          language === 'zh-CN'
            ? `已移至 ${newState === 'someday' ? 'Someday 待办池' : '已归档'}`
            : `Moved to ${newState}`,
        type: 'info',
        undoAction: async () => {
          await triageInboxItem(id, 'unsorted');
        },
      });
    },
    [addToast, language]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await softDeleteRow(db.inboxItems, id);
      addToast({
        message: language === 'zh-CN' ? '条目已移入废纸篓' : 'Item deleted',
        type: 'info',
        undoAction: async () => {
          await restoreSoftDeletedRow(db.inboxItems, id);
        },
      });
    },
    [addToast, language]
  );

  const handlePerformConvertToTask = async (params: {
    title: string;
    projectId?: string;
    scheduledDate?: string;
    priority?: PriorityLevel;
    estimateMinutes?: number;
  }) => {
    if (!taskModalItem) return;
    const { task } = await convertInboxToTask(
      taskModalItem.id,
      params.title,
      params.projectId,
      params.scheduledDate
    );
    if (params.priority || params.estimateMinutes) {
      await db.tasks.update(task.id, {
        priority: params.priority,
        estimateMinutes: params.estimateMinutes,
      });
    }
    addToast({ message: `Converted to task: "${params.title}"`, type: 'success' });
    setTaskModalItem(null);
  };

  const handlePerformConvertToNote = async (params: {
    title: string;
    bodyMarkdown: string;
    projectId?: string;
    goalId?: string;
  }) => {
    if (!noteModalItem) return;
    await convertInboxToNote(
      noteModalItem.id,
      params.title,
      params.bodyMarkdown,
      params.projectId,
      params.goalId
    );
    addToast({ message: `Converted to note: "${params.title}"`, type: 'success' });
    setNoteModalItem(null);
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBatchArchive = async () => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await triageInboxItem(id, 'archived');
    }
    addToast({ message: `Archived ${ids.length} items`, type: 'info' });
    setSelectedIds(new Set());
  };

  const handleBatchSomeday = async () => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await triageInboxItem(id, 'someday');
    }
    addToast({ message: `Moved ${ids.length} items to Someday`, type: 'info' });
    setSelectedIds(new Set());
  };

  const handleBatchDelete = async () => {
    const ids = Array.from(selectedIds);
    const now = Date.now();
    for (const id of ids) {
      await softDeleteRow(db.inboxItems, id, now);
    }
    addToast({ message: `Deleted ${ids.length} items`, type: 'info' });
    setSelectedIds(new Set());
  };

  return {
    taskModalItem,
    setTaskModalItem,
    noteModalItem,
    setNoteModalItem,
    handleTriage,
    handleDelete,
    handlePerformConvertToTask,
    handlePerformConvertToNote,
    handleToggleSelect,
    clearSelection,
    handleBatchArchive,
    handleBatchSomeday,
    handleBatchDelete,
  };
};
