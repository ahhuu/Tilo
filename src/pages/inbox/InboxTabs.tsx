import React from 'react';
import { Inbox as InboxIcon, Archive, Clock, FileText, Info, Lightbulb, Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/core/i18n';
import type { InboxTab, SomedayFilter } from './useInboxData';

const tabItemClass = (active: boolean) =>
  `flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
    active
      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
  }`;

const NOTE_SEARCH_CLASS =
  'text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500';

/** Tab 切换、Someday 子过滤、笔记搜索与新建笔记入口。 */
export const InboxTabs: React.FC<{
  tab: InboxTab;
  onTabChange: (tab: InboxTab) => void;
  somedayFilter: SomedayFilter;
  onSomedayFilterChange: (filter: SomedayFilter) => void;
  noteSearch: string;
  onNoteSearchChange: (value: string) => void;
  onOpenCreateNote: () => void;
  unsortedCount: number;
  notesCount: number;
}> = ({
  tab,
  onTabChange,
  somedayFilter,
  onSomedayFilterChange,
  noteSearch,
  onNoteSearchChange,
  onOpenCreateNote,
  unsortedCount,
  notesCount,
}) => {
  const { t, language } = useI18n();

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none flex-nowrap shrink-0 max-w-full py-0.5 -mx-1 px-1">
          <button type="button" onClick={() => onTabChange('unsorted')} className={tabItemClass(tab === 'unsorted')}>
            <InboxIcon className="w-3.5 h-3.5 shrink-0" />
            <span>{t('inbox.unsorted')}</span>
            {unsortedCount > 0 && (
              <Badge variant="indigo" size="sm">
                {unsortedCount}
              </Badge>
            )}
          </button>

          <div className="flex items-center gap-1 shrink-0">
            <button type="button" onClick={() => onTabChange('someday')} className={tabItemClass(tab === 'someday')}>
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

          <button type="button" onClick={() => onTabChange('notes')} className={tabItemClass(tab === 'notes')}>
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{language === 'zh-CN' ? '笔记与资料' : 'Notes & Docs'}</span>
            <span className="sm:hidden">{language === 'zh-CN' ? '笔记资料' : 'Notes'}</span>
            {notesCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                {notesCount}
              </span>
            )}
          </button>

          <button type="button" onClick={() => onTabChange('archived')} className={tabItemClass(tab === 'archived')}>
            <Archive className="w-3.5 h-3.5 shrink-0" />
            <span>{t('inbox.archived')}</span>
          </button>
        </div>

        {/* Someday Filter Pills */}
        {tab === 'someday' && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg text-xs shrink-0">
            <button
              type="button"
              onClick={() => onSomedayFilterChange('all')}
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
              onClick={() => onSomedayFilterChange('ideas')}
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
                onChange={(e) => onNoteSearchChange(e.target.value)}
                className={`h-7 pl-8 pr-3 ${NOTE_SEARCH_CLASS}`}
              />
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={onOpenCreateNote}
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
            onChange={(e) => onNoteSearchChange(e.target.value)}
            className={`w-full h-8 pl-8 pr-3 ${NOTE_SEARCH_CLASS}`}
          />
        </div>
      )}
    </div>
  );
};
