import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/storage/db';
import {
  Inbox,
  Plus,
  ClipboardPaste,
  Pin,
  Lightbulb,
  Archive,
  ExternalLink,
  Search,
  LayoutGrid,
  Layers,
  RotateCcw,
  Trash2,
  Copy,
  FileText,
} from 'lucide-react';
import { useI18n } from '@/core/i18n';
import { useInboxItems } from '@/storage/hooks/useLiveQuery';
import {
  captureInboxItem,
  convertInboxToTodayTask,
  markInboxAsIdea,
  triageInboxItem,
} from '@/services/inboxCommands';
import { useWidgetStore } from '@/stores/widgetStore';
import { useUIStore } from '@/stores/uiStore';
import { timeService } from '@/core/time/timeService';
import { softDeleteRow } from '@/services/tombstoneService';
import type { InboxItem, Note } from '@/core/types/domain';

const STORAGE_KEY_INBOX_TAB_STYLE = 'tilo_widget_inbox_tab_style';

type UnifiedItem =
  | { type: 'inbox'; item: InboxItem; time: number }
  | { type: 'note'; item: Note; time: number };

export const InboxGrid: React.FC = () => {
  const { language } = useI18n();
  const isZh = language === 'zh-CN';
  const { settings, updateGridSettings } = useWidgetStore();
  const { addToast } = useUIStore();
  const gridSetting = settings.gridSettings.inbox;

  // 标签展示样式：默认纯图标 (icon)，可切换为纯文字 (text) 或图文并存 (both)
  const [tabStyle, setTabStyle] = useState<'text' | 'icon' | 'both'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INBOX_TAB_STYLE);
      if (saved === 'text' || saved === 'icon' || saved === 'both') return saved;
    } catch {
      // ignore storage access error
    }
    return gridSetting.tabStyle || 'icon';
  });

  const toggleTabStyle = () => {
    const next: 'text' | 'icon' | 'both' =
      tabStyle === 'text' ? 'icon' : tabStyle === 'icon' ? 'both' : 'text';
    setTabStyle(next);
    try {
      localStorage.setItem(STORAGE_KEY_INBOX_TAB_STYLE, next);
    } catch {
      // ignore storage access error
    }
    updateGridSettings('inbox', { tabStyle: next });
  };

  const [inputText, setInputText] = useState('');
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const captureInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCaptureOpen) {
      captureInputRef.current?.focus();
    }
  }, [isCaptureOpen]);

  const [activeTab, setActiveTab] = useState<'unsorted' | 'idea' | 'archived' | 'all'>(
    gridSetting.defaultTab || 'unsorted'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const allItems = useInboxItems();
  const allNotesData = useLiveQuery(
    () => db.notes.filter((n) => !n.deletedAt).reverse().sortBy('createdAt'),
    []
  );
  const allNotes = useMemo(() => allNotesData || [], [allNotesData]);

  const handleTabChange = (tab: 'unsorted' | 'idea' | 'archived' | 'all') => {
    setActiveTab(tab);
    updateGridSettings('inbox', { defaultTab: tab });
  };

  // 1. 未整理条目 (待整理)
  const unsortedItems = useMemo(() => {
    return (allItems || []).filter((i) => !i.deletedAt && i.state === 'unsorted');
  }, [allItems]);

  // 2. 灵感条目 (包含待办池条目与工作资料/笔记总和)
  const ideaInboxItems = useMemo(() => {
    return (allItems || []).filter(
      (i) =>
        !i.deletedAt &&
        i.state !== 'converted' &&
        i.state !== 'archived' &&
        (i.kind === 'idea' || i.state === 'someday')
    );
  }, [allItems]);

  // 3. 已归档条目
  const archivedItems = useMemo(() => {
    return (allItems || []).filter((i) => !i.deletedAt && i.state === 'archived');
  }, [allItems]);

  // 数量统计
  const unsortedCount = unsortedItems.length;
  const ideaCount = ideaInboxItems.length + allNotes.length;
  const archivedCount = archivedItems.length;
  const allCount = unsortedCount + ideaCount + archivedCount;

  // 联合条目列表
  const displayedItems = useMemo<UnifiedItem[]>(() => {
    let list: UnifiedItem[] = [];

    if (activeTab === 'unsorted') {
      list = unsortedItems.map((item) => ({
        type: 'inbox',
        item,
        time: item.capturedAt || item.createdAt,
      }));
    } else if (activeTab === 'idea') {
      const fromInbox: UnifiedItem[] = ideaInboxItems.map((item) => ({
        type: 'inbox',
        item,
        time: item.capturedAt || item.createdAt,
      }));
      const fromNotes: UnifiedItem[] = allNotes.map((item) => ({
        type: 'note',
        item,
        time: item.createdAt,
      }));
      list = [...fromInbox, ...fromNotes];
    } else if (activeTab === 'archived') {
      list = archivedItems.map((item) => ({
        type: 'inbox',
        item,
        time: item.capturedAt || item.createdAt,
      }));
    } else {
      // all: 全部总和
      const fromUnsorted: UnifiedItem[] = unsortedItems.map((item) => ({
        type: 'inbox',
        item,
        time: item.capturedAt || item.createdAt,
      }));
      const fromIdeas: UnifiedItem[] = ideaInboxItems.map((item) => ({
        type: 'inbox',
        item,
        time: item.capturedAt || item.createdAt,
      }));
      const fromNotes: UnifiedItem[] = allNotes.map((item) => ({
        type: 'note',
        item,
        time: item.createdAt,
      }));
      const fromArchived: UnifiedItem[] = archivedItems.map((item) => ({
        type: 'inbox',
        item,
        time: item.capturedAt || item.createdAt,
      }));
      list = [...fromUnsorted, ...fromIdeas, ...fromNotes, ...fromArchived];
    }

    // 按时间倒序排序
    list.sort((a, b) => b.time - a.time);

    // 关键词搜索过滤
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((x) => {
        if (x.type === 'inbox') {
          return x.item.rawText.toLowerCase().includes(q);
        } else {
          return (
            x.item.title.toLowerCase().includes(q) ||
            (x.item.bodyMarkdown && x.item.bodyMarkdown.toLowerCase().includes(q))
          );
        }
      });
    }

    return list;
  }, [activeTab, unsortedItems, ideaInboxItems, archivedItems, allNotes, searchQuery]);

  const handleCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    try {
      await captureInboxItem({ rawText: text });
      setInputText('');
      captureInputRef.current?.focus();
      addToast({ message: isZh ? '已捕获到收集箱' : 'Captured to Inbox', type: 'success' });
    } catch {
      addToast({ message: isZh ? '捕获失败' : 'Capture failed', type: 'error' });
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        addToast({ message: isZh ? '剪贴板为空' : 'Clipboard is empty', type: 'warning' });
        return;
      }
      await captureInboxItem({ rawText: text.trim() });
      addToast({ message: isZh ? '已将剪贴板内容存入收集箱' : 'Saved clipboard content to Inbox', type: 'success' });
    } catch {
      addToast({ message: isZh ? '读取剪贴板失败' : 'Failed to read clipboard', type: 'error' });
    }
  };

  const handlePromoteToToday = async (id: string) => {
    try {
      await convertInboxToTodayTask(id);
      addToast({ message: isZh ? '已转入今日任务聚焦' : 'Promoted to Today focus task', type: 'success' });
    } catch {
      addToast({ message: isZh ? '转存失败' : 'Failed to promote', type: 'error' });
    }
  };

  const handleMarkAsIdea = async (id: string) => {
    try {
      await markInboxAsIdea(id);
      addToast({ message: isZh ? '已归入灵感 (待办池)' : 'Marked as Idea', type: 'info' });
    } catch {
      addToast({ message: isZh ? '标记失败' : 'Failed to mark as idea', type: 'error' });
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await triageInboxItem(id, 'archived');
      addToast({ message: isZh ? '已移入已归档' : 'Archived', type: 'info' });
    } catch {
      addToast({ message: isZh ? '归档失败' : 'Failed to archive', type: 'error' });
    }
  };

  const handleUnarchive = async (id: string) => {
    try {
      await triageInboxItem(id, 'unsorted');
      addToast({ message: isZh ? '已恢复至未整理' : 'Restored to Unsorted', type: 'info' });
    } catch {
      addToast({ message: isZh ? '操作失败' : 'Failed to restore', type: 'error' });
    }
  };

  const handleDeleteInbox = async (id: string) => {
    try {
      await softDeleteRow(db.inboxItems, id);
      addToast({ message: isZh ? '条目已删除' : 'Item deleted', type: 'info' });
    } catch {
      addToast({ message: isZh ? '删除失败' : 'Failed to delete', type: 'error' });
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await softDeleteRow(db.notes, id);
      addToast({ message: isZh ? '笔记已删除' : 'Note deleted', type: 'info' });
    } catch {
      addToast({ message: isZh ? '删除失败' : 'Failed to delete', type: 'error' });
    }
  };

  const handleCopyNoteContent = async (note: Note) => {
    try {
      const textToCopy = `${note.title}\n\n${note.bodyMarkdown || ''}`.trim();
      await navigator.clipboard.writeText(textToCopy);
      addToast({ message: isZh ? '笔记内容已复制' : 'Copied note content', type: 'success' });
    } catch {
      addToast({ message: isZh ? '复制失败' : 'Copy failed', type: 'error' });
    }
  };

  const tabs = [
    { id: 'unsorted' as const, labelZh: '未整理', labelEn: 'Unsorted', count: unsortedCount, icon: Inbox },
    { id: 'idea' as const, labelZh: '灵感', labelEn: 'Ideas', count: ideaCount, icon: Lightbulb },
    { id: 'archived' as const, labelZh: '已归档', labelEn: 'Archived', count: archivedCount, icon: Archive },
    { id: 'all' as const, labelZh: '全部', labelEn: 'All', count: allCount, icon: Layers },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-transparent overflow-hidden select-none">
      {/* 头部标题与控制栏 */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-200/40 dark:border-slate-800/40 bg-slate-50/40 dark:bg-slate-800/20">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {isZh ? '收集箱' : 'Inbox'}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
            {displayedItems.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* 闪念速记快速展开按钮 (位于切换标签样式按钮左侧) */}
          <button
            type="button"
            onClick={() => setIsCaptureOpen(!isCaptureOpen)}
            className={`p-1 rounded-md transition-all cursor-pointer ${
              isCaptureOpen
                ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold ring-1 ring-indigo-500/40'
                : 'text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/40 dark:hover:bg-slate-800/60'
            }`}
            title={isZh ? (isCaptureOpen ? '收起速记输入框 (Esc)' : '快速记录闪念想法') : (isCaptureOpen ? 'Close Capture (Esc)' : 'Quick Capture Idea')}
          >
            <Plus className={`w-3.5 h-3.5 transition-transform duration-200 ${isCaptureOpen ? 'rotate-45 text-slate-500' : ''}`} />
          </button>

          {/* 纯小图标切换按钮（与今日待办挂件一致） */}
          <button
            type="button"
            onClick={toggleTabStyle}
            className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/40 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            title={
              isZh
                ? `切换标签样式 (当前: ${tabStyle === 'text' ? '纯文字' : tabStyle === 'icon' ? '纯图标' : '图文'})`
                : `Toggle tab style (Current: ${tabStyle === 'text' ? 'Text' : tabStyle === 'icon' ? 'Icon' : 'Both'})`
            }
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            title={isZh ? '搜索随记与笔记' : 'Search items & notes'}
          >
            <Search className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handlePasteClipboard}
            className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
            title={isZh ? '快捷粘贴剪贴板内容' : 'Paste from clipboard'}
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 搜索框 */}
      {showSearch && (
        <div className="px-3 pt-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isZh ? '筛选闪念与笔记关键词...' : 'Search ideas & notes...'}
            className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
          />
        </div>
      )}

      {/* 分类 Tabs：未整理 | 灵感 (待办池+笔记) | 已归档 | 全部 */}
      <div className="flex items-center gap-1 px-3 pt-2 pb-1 text-xs shrink-0 overflow-x-auto no-scrollbar">
        {tabs.map((item) => {
          const Icon = item.icon;
          const label = isZh ? item.labelZh : item.labelEn;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTabChange(item.id)}
              title={`${label} (${item.labelEn})`}
              className={`px-2 py-1 rounded-lg font-medium flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-indigo-100/80 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 shadow-2xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/40 dark:hover:bg-slate-800/40'
              }`}
            >
              {tabStyle !== 'text' && <Icon className="w-3.5 h-3.5 shrink-0" />}
              {tabStyle !== 'icon' && <span>{label}</span>}
              {typeof item.count === 'number' && (
                <span className="opacity-70 text-[10px] ml-0.5 font-mono">{item.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 快捷捕获输入框（按需展开，平时零占用列表空间） */}
      {isCaptureOpen && (
        <form onSubmit={handleCapture} className="px-3 py-1.5 shrink-0 bg-indigo-50/30 dark:bg-indigo-950/20 border-b border-slate-200/40 dark:border-slate-800/40 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="relative flex items-center">
            <input
              ref={captureInputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsCaptureOpen(false);
                }
              }}
              placeholder={isZh ? '记录闪念想法 (Enter 保存，Esc 收起)...' : 'Quick capture idea (Enter to save, Esc)...'}
              className="w-full text-xs pl-2.5 pr-8 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-500/50 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-xs"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="absolute right-1.5 p-1 rounded-md text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors cursor-pointer"
              title={isZh ? '存入收集箱 (Enter)' : 'Capture to Inbox (Enter)'}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}

      {/* 列表内容 */}
      <div className="flex-1 overflow-y-auto px-3 py-1.5 space-y-2 min-h-0">
        {displayedItems.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center text-center text-slate-400 text-xs">
            <Inbox className="w-6 h-6 mb-1.5 opacity-40 text-slate-300 dark:text-slate-600" />
            <span>{isZh ? '暂无此分类的条目' : 'No items in this category'}</span>
            <span className="text-[10px] text-slate-400 mt-0.5">
              {isZh ? '随时输入回车快速捕获' : 'Type above & press Enter to capture'}
            </span>
          </div>
        ) : (
          displayedItems.map((unified) => {
            if (unified.type === 'note') {
              const note = unified.item;
              return (
                <div
                  key={note.id}
                  className={`group relative transition-all ${
                    gridSetting.displayDensity === 'compact'
                      ? 'p-1.5 rounded-lg bg-white/70 dark:bg-slate-850/60 border border-slate-200/40 dark:border-slate-800/60 shadow-2xs'
                      : 'p-2.5 rounded-xl bg-amber-50/20 dark:bg-amber-950/10 hover:bg-white dark:hover:bg-slate-800 border border-amber-200/40 dark:border-amber-900/30 shadow-2xs hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 text-[9px] font-semibold">
                      <FileText className="w-2.5 h-2.5" />
                      <span>{isZh ? '笔记' : 'Note'}</span>
                    </span>
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                      {note.title}
                    </span>
                  </div>

                  {note.bodyMarkdown && (
                    <p className={`text-xs text-slate-600 dark:text-slate-300 break-words ${
                      gridSetting.displayDensity === 'compact' ? 'truncate' : 'line-clamp-2 text-[11px] leading-relaxed'
                    }`}>
                      {note.bodyMarkdown}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-slate-800/40 text-[10px] text-slate-400">
                    <span>{timeService.formatTime(note.createdAt)}</span>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleCopyNoteContent(note)}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        title={isZh ? '复制笔记正文' : 'Copy note text'}
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title={isZh ? '删除笔记' : 'Delete note'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            const item = unified.item;
            const isArchived = item.state === 'archived';

            return (
              <div
                key={item.id}
                className={`group relative transition-all ${
                  gridSetting.displayDensity === 'compact'
                    ? 'p-1.5 rounded-lg bg-white/70 dark:bg-slate-850/60 border border-slate-200/40 dark:border-slate-800/60 shadow-2xs'
                    : 'p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800/70 shadow-2xs hover:shadow-xs'
                }`}
              >
                <p className={`text-xs text-slate-700 dark:text-slate-200 break-words ${
                  gridSetting.displayDensity === 'compact' ? 'truncate' : 'leading-relaxed whitespace-pre-wrap'
                }`}>
                  {item.rawText}
                </p>

                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 mt-1 text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <ExternalLink className="w-2.5 h-2.5" />
                    <span>{item.urlDomain || item.url}</span>
                  </a>
                )}

                <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-slate-800/40 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span>{timeService.formatTime(item.capturedAt)}</span>
                    {item.kind === 'idea' && (
                      <span className="text-[9px] px-1 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                        {isZh ? '灵感' : 'Idea'}
                      </span>
                    )}
                    {isArchived && (
                      <span className="text-[9px] px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {isZh ? '已归档' : 'Archived'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isArchived ? (
                      /* 已归档项专属操作：恢复未整理 / 删除 */
                      <>
                        <button
                          type="button"
                          onClick={() => handleUnarchive(item.id)}
                          className="p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                          title={isZh ? '恢复至未整理' : 'Restore to Unsorted'}
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteInbox(item.id)}
                          className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                          title={isZh ? '彻底删除' : 'Delete item'}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      /* 未整理 / 灵感 / 全部常规操作 */
                      <>
                        <button
                          type="button"
                          onClick={() => handlePromoteToToday(item.id)}
                          className="p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                          title={isZh ? '提入今日任务并聚焦' : 'Promote to Today Focus'}
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMarkAsIdea(item.id)}
                          className="p-1 rounded hover:bg-amber-50 dark:hover:bg-amber-950/60 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                          title={isZh ? '标记为灵感 (待办池)' : 'Mark as Idea'}
                        >
                          <Lightbulb className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleArchive(item.id)}
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          title={isZh ? '归档' : 'Archive'}
                        >
                          <Archive className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteInbox(item.id)}
                          className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                          title={isZh ? '删除' : 'Delete'}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
