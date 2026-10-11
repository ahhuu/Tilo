import React, { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/storage/db';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import {
  triageInboxItem,
  convertInboxToTask,
  convertInboxToNote,
} from '@/services/inboxCommands';
import { ConvertToTaskModal } from '@/components/inbox/ConvertToTaskModal';
import { ConvertToNoteModal } from '@/components/inbox/ConvertToNoteModal';
import { EditNoteModal } from '@/components/inbox/EditNoteModal';
import { ContinuousProcessingModal } from '@/components/inbox/ContinuousProcessingModal';
import { InboxBatchBar } from '@/components/inbox/InboxBatchBar';
import {
  Plus,
  Inbox as InboxIcon,
  Archive,
  Clock,
  ExternalLink,
  ArrowRight,
  BookOpen,
  Trash2,
  Sparkles,
  Info,
  Lightbulb,
  FileText,
  Search,
  Target,
  Edit2,
} from 'lucide-react';
import type { InboxItem, PriorityLevel, Note } from '@/core/types/domain';

export const InboxPage: React.FC = () => {
  const { t, language } = useI18n();
  const [tab, setTab] = useState<'unsorted' | 'someday' | 'notes' | 'archived'>('unsorted');
  const [somedayFilter, setSomedayFilter] = useState<'all' | 'ideas'>('all');
  const [noteSearch, setNoteSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  const [taskModalItem, setTaskModalItem] = useState<InboxItem | null>(null);
  const [noteModalItem, setNoteModalItem] = useState<InboxItem | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isContinuousOpen, setIsContinuousOpen] = useState(false);

  const { openInstantCapture, addToast } = useUIStore();

  const itemsQuery = useLiveQuery(
    () => {
      if (tab === 'notes') return [];
      return db.inboxItems
        .where('[workspaceId+state]')
        .equals(['ws-default', tab])
        .filter((i) => {
          if (i.deletedAt) return false;
          if (tab === 'someday' && somedayFilter === 'ideas') {
            return i.kind === 'idea';
          }
          return true;
        })
        .reverse()
        .sortBy('capturedAt');
    },
    [tab, somedayFilter]
  );
  const items = React.useMemo(() => itemsQuery || [], [itemsQuery]);

  const rawNotes = useLiveQuery(
    () =>
      db.notes
        .filter((n) => !n.deletedAt)
        .reverse()
        .sortBy('createdAt'),
    []
  );
  const allNotes = React.useMemo(() => rawNotes || [], [rawNotes]);

  const filteredNotes = React.useMemo(() => {
    if (!noteSearch.trim()) return allNotes;
    const q = noteSearch.toLowerCase();
    return allNotes.filter(
      (n) => n.title.toLowerCase().includes(q) || n.bodyMarkdown?.toLowerCase().includes(q)
    );
  }, [allNotes, noteSearch]);

  const rawUnsorted = useLiveQuery(
    () =>
      db.inboxItems
        .where('[workspaceId+state]')
        .equals(['ws-default', 'unsorted'])
        .filter((i) => !i.deletedAt)
        .toArray(),
    []
  );
  const unsortedItems = React.useMemo(() => rawUnsorted || [], [rawUnsorted]);

  const rawProjects = useLiveQuery(() => db.projects.toArray(), []);
  const projects = React.useMemo(() => rawProjects || [], [rawProjects]);

  const rawGoals = useLiveQuery(() => db.goals.toArray(), []);
  const goals = React.useMemo(() => rawGoals || [], [rawGoals]);

  const projectMap = React.useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const goalMap = React.useMemo(() => new Map(goals.map((g) => [g.id, g])), [goals]);

  const unsortedCount = unsortedItems.length;

  const handleDeleteNote = async (noteId: string) => {
    await db.notes.update(noteId, { deletedAt: Date.now() });
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
    if (editingNote.id.startsWith('new-note-')) {
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
      id: `new-note-${now}`,
      workspaceId: 'ws-default',
      title: '',
      bodyMarkdown: '',
      tagIds: [],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  };

  // Single Item Triage Actions
  const handleTriage = useCallback(
    async (id: string, newState: 'someday' | 'archived') => {
      await triageInboxItem(id, newState);
      addToast({
        message: language === 'zh-CN' ? `已移至 ${newState === 'someday' ? 'Someday 待办池' : '已归档'}` : `Moved to ${newState}`,
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
      await db.inboxItems.update(id, { deletedAt: Date.now() });
      addToast({
        message: language === 'zh-CN' ? '条目已移入废纸篓' : 'Item deleted',
        type: 'info',
        undoAction: async () => {
          await db.inboxItems.update(id, { deletedAt: null });
        },
      });
    },
    [addToast, language]
  );

  // Conversion Handlers
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

  // Batch Operations
  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

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
      await db.inboxItems.update(id, { deletedAt: now });
    }
    addToast({ message: `Deleted ${ids.length} items`, type: 'info' });
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
  }, [items, focusedIndex, tab, handleTriage, handleDelete]);

  return (
    <div className="p-3.5 sm:p-6 max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {t('inbox.title')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">
            {language === 'zh-CN'
              ? '全局想法快速收集与分流中心 • 快捷键：P 连续整理，J/K 上下选择，T 转任务，N 转笔记，S 移入 Someday，E 归档'
              : 'Universal capture and thought processing hub • Keyboard: P process mode, J/K navigate, T task, N note, S someday, E archive'}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 sm:hidden truncate">
            {language === 'zh-CN' ? '全局想法快速收集与分流中心' : 'Capture & triage center'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {unsortedCount > 0 && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsContinuousOpen(true)}
              className="border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/60 cursor-pointer whitespace-nowrap shrink-0 px-2 sm:px-3 h-8 text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 sm:mr-1.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="hidden sm:inline">{language === 'zh-CN' ? '连续整理 (P)' : 'Process Inbox (P)'}</span>
              <span className="sm:hidden">{language === 'zh-CN' ? '整理' : 'Process'}</span>
              <span className="ml-1 sm:ml-1.5 px-1.5 py-0.2 rounded-full bg-indigo-200/70 dark:bg-indigo-900/70 text-[10px] font-semibold">
                {unsortedCount}
              </span>
            </Button>
          )}

          <Button
            size="sm"
            variant="primary"
            onClick={openInstantCapture}
            className="cursor-pointer whitespace-nowrap shrink-0 px-2.5 sm:px-3 h-8 text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1 shrink-0" />
            <span>{language === 'zh-CN' ? '新建条目' : 'Add Item'}</span>
          </Button>
        </div>
      </div>

      {/* Tabs: Unsorted | Someday | Notes | Archived - Scrollable on mobile to never clip */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none flex-nowrap shrink-0 max-w-full py-0.5 -mx-1 px-1">
            <button
              type="button"
              onClick={() => {
                setTab('unsorted');
                setSelectedIds(new Set());
              }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                tab === 'unsorted'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <InboxIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{t('inbox.unsorted')}</span>
              {unsortedCount > 0 && (
                <Badge variant="indigo" size="sm">
                  {unsortedCount}
                </Badge>
              )}
            </button>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setTab('someday');
                  setSelectedIds(new Set());
                }}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  tab === 'someday'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{t('inbox.someday')}</span>
                <span className="sm:hidden">{language === 'zh-CN' ? '稍后处理' : 'Someday'}</span>
              </button>
              <span
                title={
                  language === 'zh-CN'
                    ? '稍后/将来清单：存放暂时不排入日程或近期冲刺，但未来可能启动的灵感与延期待办'
                    : 'Someday / Maybe list for future ideas and delayed backlog'
                }
                className="text-slate-400 hover:text-slate-600 cursor-help hidden sm:inline"
              >
                <Info className="w-3.5 h-3.5" />
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setTab('notes');
                setSelectedIds(new Set());
              }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                tab === 'notes'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{language === 'zh-CN' ? '笔记与资料' : 'Notes & Docs'}</span>
              <span className="sm:hidden">{language === 'zh-CN' ? '笔记资料' : 'Notes'}</span>
              {allNotes.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                  {allNotes.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setTab('archived');
                setSelectedIds(new Set());
              }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                tab === 'archived'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Archive className="w-3.5 h-3.5 shrink-0" />
              <span>{t('inbox.archived')}</span>
            </button>
          </div>

          {/* Someday Filter Pills */}
          {tab === 'someday' && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg text-xs shrink-0">
              <button
                type="button"
                onClick={() => setSomedayFilter('all')}
                className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  somedayFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-300'
                }`}
              >
                {language === 'zh-CN' ? '全部' : 'All'}
              </button>
              <button
                type="button"
                onClick={() => setSomedayFilter('ideas')}
                className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                  somedayFilter === 'ideas'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-300'
                }`}
              >
                <Lightbulb className="w-3 h-3 text-amber-500" />
                <span className="hidden sm:inline">{language === 'zh-CN' ? '仅想法灵感' : 'Ideas'}</span>
                <span className="sm:hidden">{language === 'zh-CN' ? '想法' : 'Ideas'}</span>
              </button>
            </div>
          )}

          {/* Notes Search input and New Note button */}
          {tab === 'notes' && (
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative hidden sm:block">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={language === 'zh-CN' ? '搜索笔记内容...' : 'Search notes...'}
                  value={noteSearch}
                  onChange={(e) => setNoteSearch(e.target.value)}
                  className="h-7 pl-8 pr-3 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleOpenCreateNote}
                className="h-7 text-xs gap-1 cursor-pointer font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100/60 whitespace-nowrap"
              >
                <Plus className="w-3 h-3" />
                <span>{language === 'zh-CN' ? '新建笔记' : 'New Note'}</span>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Search input for Notes */}
        {tab === 'notes' && (
          <div className="mt-2 sm:hidden relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
            <input
              type="text"
              placeholder={language === 'zh-CN' ? '搜索笔记内容...' : 'Search notes...'}
              value={noteSearch}
              onChange={(e) => setNoteSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>

      {/* Content Area */}
      {tab === 'notes' ? (
        /* Notes Tab Content */
        <div className="space-y-3">
          {filteredNotes.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 space-y-3">
              <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p>
                {language === 'zh-CN'
                  ? '暂无资料笔记。点击上方「新建笔记」或在收件箱中分流保存。'
                  : 'No notes yet. Click "New Note" or convert from inbox to store reference docs.'}
              </p>
            </div>
          ) : (
            filteredNotes.map((note) => {
              const project = note.projectId ? projectMap.get(note.projectId) : undefined;
              const goal = note.goalId ? goalMap.get(note.goalId) : undefined;

              return (
                <div
                  key={note.id}
                  onClick={() => setEditingNote(note)}
                  className="p-3.5 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-2xs space-y-2 group cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors truncate">
                        {note.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(note.createdAt).toLocaleDateString(language === 'zh-CN' ? 'zh-CN' : 'en-US')}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingNote(note);
                        }}
                        className="p-1 rounded text-slate-300 hover:text-indigo-600 transition-colors cursor-pointer"
                        title={language === 'zh-CN' ? '编辑笔记 (Markdown)' : 'Edit note (Markdown)'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        className="p-1 rounded text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                        title={language === 'zh-CN' ? '删除笔记' : 'Delete note'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {note.bodyMarkdown && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 whitespace-pre-wrap leading-relaxed">
                      {note.bodyMarkdown}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {project && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: project.color || '#6366f1' }}
                        />
                        <span>{project.name}</span>
                      </span>
                    )}

                    {goal && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium">
                        <Target className="w-3 h-3" />
                        <span>{goal.title}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Inbox Items List (Unsorted, Someday, Archived) */
        <div className="space-y-2.5">
          {items.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 space-y-3">
              <InboxIcon className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p>
                {language === 'zh-CN'
                  ? `当前「${tab === 'unsorted' ? '待整理' : tab === 'someday' ? 'Someday 待办池' : '已归档'}」暂无条目。按 Ctrl+Shift+Space 即可随时快速收集。`
                  : `Nothing to process in ${tab}. Use Ctrl+Shift+Space to capture thoughts.`}
              </p>
            </div>
          ) : (
            items.map((item, index) => {
              const isSelected = selectedIds.has(item.id);
              const isFocused = index === focusedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => setFocusedIndex(index)}
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-3.5 rounded-xl border transition-all group shadow-2xs gap-2.5 sm:gap-3 ${
                    isFocused
                      ? 'border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/10 bg-white dark:bg-slate-800'
                      : 'border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:border-slate-300'
                  }`}
                >
                  {/* Title and metadata row */}
                  <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                    {/* Multi-select checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(item.id)}
                      className="mt-0.5 sm:mt-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                    />

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
                      <span className="mt-0.5 sm:mt-0 p-1 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0" title={language === 'zh-CN' ? '想法备忘' : 'Idea'}>
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
                          <Badge variant="outline" size="sm" className="text-[10px] px-1 py-0 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 shrink-0">
                            {language === 'zh-CN' ? '想法' : 'Idea'}
                          </Badge>
                        )}
                      </div>
                      {item.urlDomain && (
                        <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono block mt-0.5">
                          {item.urlDomain}
                        </span>
                      )}
                    </div>

                    {/* Mobile top-right delete button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
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
                            setTaskModalItem(item);
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
                            setNoteModalItem(item);
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
                            handleTriage(item.id, 'someday');
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
                            handleTriage(item.id, 'archived');
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
                          setTaskModalItem(item);
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
                        handleDelete(item.id);
                      }}
                      className="hidden sm:inline-flex p-1 rounded text-slate-300 hover:text-red-500 cursor-pointer"
                      title={language === 'zh-CN' ? '删除条目' : 'Delete item'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Batch Processing Floating Toolbar */}
      <InboxBatchBar
        selectedCount={selectedIds.size}
        onBatchArchive={handleBatchArchive}
        onBatchSomeday={handleBatchSomeday}
        onBatchDelete={handleBatchDelete}
        onClearSelection={() => setSelectedIds(new Set())}
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
