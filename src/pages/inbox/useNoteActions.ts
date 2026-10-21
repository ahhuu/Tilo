import { useState } from 'react';
import { db } from '@/storage/db';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { softDeleteRow } from '@/services/tombstoneService';
import type { Note } from '@/core/types/domain';

const NEW_NOTE_ID_PREFIX = 'new-note-';

/** 笔记的新建 / 编辑 / 软删除。editingNote 同时承担「编辑已有」与「新建草稿」两种形态。 */
export const useNoteActions = () => {
  const { addToast } = useUIStore();
  const { language } = useI18n();
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const handleDeleteNote = async (noteId: string) => {
    // softDeleteRow 会同时推进 updatedAt，否则删除同步不出去（对端会把它推回来）
    await softDeleteRow(db.notes, noteId);
    addToast({
      message: language === 'zh-CN' ? '笔记已删除' : 'Note deleted',
      type: 'info',
    });
  };

  const handleSaveNote = async (updated: {
    title: string;
    bodyMarkdown: string;
    projectId?: string;
    goalId?: string;
  }) => {
    if (!editingNote) return;
    if (editingNote.id.startsWith(NEW_NOTE_ID_PREFIX)) {
      const now = Date.now();
      await db.notes.put({
        id: `note-${now}-${Math.random().toString(36).substr(2, 9)}`,
        workspaceId: 'ws-default',
        title: updated.title,
        bodyMarkdown: updated.bodyMarkdown,
        projectId: updated.projectId,
        goalId: updated.goalId,
        tagIds: [],
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });
      addToast({
        message: language === 'zh-CN' ? '笔记已创建' : 'Note created',
        type: 'success',
      });
    } else {
      await db.notes.update(editingNote.id, {
        title: updated.title,
        bodyMarkdown: updated.bodyMarkdown,
        projectId: updated.projectId,
        goalId: updated.goalId,
        updatedAt: Date.now(),
      });
      addToast({
        message: language === 'zh-CN' ? '笔记已保存更新' : 'Note updated',
        type: 'success',
      });
    }
    setEditingNote(null);
  };

  const handleOpenCreateNote = () => {
    const now = Date.now();
    setEditingNote({
      id: `${NEW_NOTE_ID_PREFIX}${now}`,
      workspaceId: 'ws-default',
      title: '',
      bodyMarkdown: '',
      tagIds: [],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  };

  return { editingNote, setEditingNote, handleDeleteNote, handleSaveNote, handleOpenCreateNote };
};
