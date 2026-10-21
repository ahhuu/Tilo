import React, { useEffect, useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { ConvertToTaskModal } from '@/components/inbox/ConvertToTaskModal';
import { ConvertToNoteModal } from '@/components/inbox/ConvertToNoteModal';
import { EditNoteModal } from '@/components/inbox/EditNoteModal';
import { ContinuousProcessingModal } from '@/components/inbox/ContinuousProcessingModal';
import { InboxBatchBar } from '@/components/inbox/InboxBatchBar';
import { InboxHeader } from './inbox/InboxHeader';
import { InboxTabs } from './inbox/InboxTabs';
import { InboxItemsList } from './inbox/InboxItemsList';
import { NotesList } from './inbox/NotesList';
import {
  useInboxItems,
  useInboxNotes,
  useInboxReferenceData,
  useUnsortedInboxItems,
} from './inbox/useInboxData';
import type { InboxTab, SomedayFilter } from './inbox/useInboxData';
import { useInboxItemActions } from './inbox/useInboxItemActions';
import { useNoteActions } from './inbox/useNoteActions';

export const InboxPage: React.FC = () => {
  const [tab, setTab] = useState<InboxTab>('unsorted');
  const [somedayFilter, setSomedayFilter] = useState<SomedayFilter>('all');
  const [noteSearch, setNoteSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [isContinuousOpen, setIsContinuousOpen] = useState(false);

  const { openInstantCapture } = useUIStore();

  const items = useInboxItems(tab, somedayFilter);
  const unsortedItems = useUnsortedInboxItems();
  const { allNotes, filteredNotes } = useInboxNotes(noteSearch);
  const { projects, goals, projectMap, goalMap } = useInboxReferenceData();

  const {
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
  } = useInboxItemActions({ selectedIds, setSelectedIds });

  const { editingNote, setEditingNote, handleDeleteNote, handleSaveNote, handleOpenCreateNote } =
    useNoteActions();

  const unsortedCount = unsortedItems.length;

  const handleTabChange = (next: InboxTab) => {
    setTab(next);
    setSelectedIds(new Set());
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (items.length === 0) return;

      const currentItem = items[focusedIndex] || items[0];

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, items.length - 1));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        if (currentItem) setTaskModalItem(currentItem);
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        if (currentItem) setNoteModalItem(currentItem);
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (currentItem && tab === 'unsorted') handleTriage(currentItem.id, 'someday');
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        if (currentItem) handleTriage(currentItem.id, 'archived');
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setIsContinuousOpen(true);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (currentItem) handleDelete(currentItem.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, focusedIndex, tab, handleTriage, handleDelete, setTaskModalItem, setNoteModalItem]);

  return (
    <div className="p-3.5 sm:p-6 max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <InboxHeader
        unsortedCount={unsortedCount}
        onOpenContinuous={() => setIsContinuousOpen(true)}
        onOpenCapture={openInstantCapture}
      />

      <InboxTabs
        tab={tab}
        onTabChange={handleTabChange}
        somedayFilter={somedayFilter}
        onSomedayFilterChange={setSomedayFilter}
        noteSearch={noteSearch}
        onNoteSearchChange={setNoteSearch}
        onOpenCreateNote={handleOpenCreateNote}
        unsortedCount={unsortedCount}
        notesCount={allNotes.length}
      />

      {/* Content Area */}
      {tab === 'notes' ? (
        <NotesList
          notes={filteredNotes}
          projectMap={projectMap}
          goalMap={goalMap}
          onEdit={setEditingNote}
          onDelete={handleDeleteNote}
        />
      ) : (
        <InboxItemsList
          items={items}
          tab={tab}
          selectedIds={selectedIds}
          focusedIndex={focusedIndex}
          onFocus={setFocusedIndex}
          onToggleSelect={handleToggleSelect}
          onDelete={handleDelete}
          onOpenTaskModal={setTaskModalItem}
          onOpenNoteModal={setNoteModalItem}
          onTriage={handleTriage}
        />
      )}

      {/* Batch Processing Floating Toolbar */}
      <InboxBatchBar
        selectedCount={selectedIds.size}
        onBatchArchive={handleBatchArchive}
        onBatchSomeday={handleBatchSomeday}
        onBatchDelete={handleBatchDelete}
        onClearSelection={clearSelection}
      />

      {/* Convert to Task Modal */}
      {taskModalItem && (
        <ConvertToTaskModal
          item={taskModalItem}
          projects={projects}
          onConvert={handlePerformConvertToTask}
          onClose={() => setTaskModalItem(null)}
        />
      )}

      {/* Convert to Note Modal */}
      {noteModalItem && (
        <ConvertToNoteModal
          item={noteModalItem}
          projects={projects}
          goals={goals}
          onConvert={handlePerformConvertToNote}
          onClose={() => setNoteModalItem(null)}
        />
      )}

      {/* Edit / Create Note Modal */}
      {editingNote && (
        <EditNoteModal
          note={editingNote}
          projects={projects}
          goals={goals}
          onSave={handleSaveNote}
          onClose={() => setEditingNote(null)}
        />
      )}

      {/* Continuous Processing Modal (Master Plan Section 6.9) */}
      <ContinuousProcessingModal
        items={unsortedItems}
        isOpen={isContinuousOpen}
        onClose={() => setIsContinuousOpen(false)}
      />
    </div>
  );
};
