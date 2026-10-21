import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/storage/db';
import type { InboxItem } from '@/core/types/domain';

export type InboxTab = 'unsorted' | 'someday' | 'notes' | 'archived';
export type SomedayFilter = 'all' | 'ideas';

/** 当前 tab 下的收件箱条目（notes tab 不走 items 查询）。 */
export const useInboxItems = (tab: InboxTab, somedayFilter: SomedayFilter): InboxItem[] => {
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
  return React.useMemo(() => itemsQuery || [], [itemsQuery]);
};

/** 未整理条目：用于 tab 角标、连续整理弹窗与「整理」按钮。 */
export const useUnsortedInboxItems = (): InboxItem[] => {
  const rawUnsorted = useLiveQuery(
    () =>
      db.inboxItems
        .where('[workspaceId+state]')
        .equals(['ws-default', 'unsorted'])
        .filter((i) => !i.deletedAt)
        .toArray(),
    []
  );
  return React.useMemo(() => rawUnsorted || [], [rawUnsorted]);
};

/** 笔记列表 + 关键词过滤。 */
export const useInboxNotes = (noteSearch: string) => {
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

  return { allNotes, filteredNotes };
};

/** 项目 / 目标参照表，供笔记卡片与转任务弹窗展示归属。 */
export const useInboxReferenceData = () => {
  const rawProjects = useLiveQuery(() => db.projects.toArray(), []);
  const projects = React.useMemo(() => rawProjects || [], [rawProjects]);

  const rawGoals = useLiveQuery(() => db.goals.toArray(), []);
  const goals = React.useMemo(() => rawGoals || [], [rawGoals]);

  const projectMap = React.useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const goalMap = React.useMemo(() => new Map(goals.map((g) => [g.id, g])), [goals]);

  return { projects, goals, projectMap, goalMap };
};
