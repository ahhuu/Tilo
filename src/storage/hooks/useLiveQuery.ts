import { useLiveQuery } from 'dexie-react-hooks';
import { db, DEFAULT_WORKSPACE_ID } from '../db';
import type { Task, Project, Goal, InboxItem, PlannedBlock, DailyFocus, WeeklyFocus, Session } from '@/core/types/domain';

export function useTasks(workspaceId: string = DEFAULT_WORKSPACE_ID): Task[] | undefined {
  return useLiveQuery(
    () =>
      db.tasks
        .where('workspaceId')
        .equals(workspaceId)
        .filter((t) => !t.deletedAt)
        .toArray(),
    [workspaceId]
  );
}

export function useScheduledTasks(
  scheduledDate: string,
  workspaceId: string = DEFAULT_WORKSPACE_ID
): Task[] | undefined {
  return useLiveQuery(
    () =>
      db.tasks
        .where('[workspaceId+scheduledDate]')
        .equals([workspaceId, scheduledDate])
        .filter((t) => !t.deletedAt)
        .toArray(),
    [workspaceId, scheduledDate]
  );
}

export function useProjects(workspaceId: string = DEFAULT_WORKSPACE_ID): Project[] | undefined {
  return useLiveQuery(
    () =>
      db.projects
        .where('workspaceId')
        .equals(workspaceId)
        .filter((p) => !p.deletedAt)
        .sortBy('order'),
    [workspaceId]
  );
}

export function useGoals(workspaceId: string = DEFAULT_WORKSPACE_ID): Goal[] | undefined {
  return useLiveQuery(
    () =>
      db.goals
        .where('workspaceId')
        .equals(workspaceId)
        .filter((g) => !g.deletedAt)
        .toArray(),
    [workspaceId]
  );
}

export function useInboxItems(
  state?: 'unsorted' | 'someday' | 'archived',
  workspaceId: string = DEFAULT_WORKSPACE_ID
): InboxItem[] | undefined {
  return useLiveQuery(() => {
    let collection = db.inboxItems.where('workspaceId').equals(workspaceId);
    if (state) {
      collection = db.inboxItems.where('[workspaceId+state]').equals([workspaceId, state]);
    }
    return collection.filter((i) => !i.deletedAt).reverse().sortBy('capturedAt');
  }, [workspaceId, state]);
}

export function usePlannedBlocks(
  startAt: number,
  endAt: number,
  workspaceId: string = DEFAULT_WORKSPACE_ID
): PlannedBlock[] | undefined {
  return useLiveQuery(
    () =>
      db.plannedBlocks
        .where('[workspaceId+startAt]')
        .between([workspaceId, startAt], [workspaceId, endAt], true, true)
        .filter((b) => !b.deletedAt)
        .toArray(),
    [workspaceId, startAt, endAt]
  );
}

export function useDailyFocus(
  logicalDate: string,
  workspaceId: string = DEFAULT_WORKSPACE_ID
): DailyFocus[] | undefined {
  return useLiveQuery(
    () =>
      db.dailyFocus
        .where('[workspaceId+logicalDate]')
        .equals([workspaceId, logicalDate])
        .sortBy('rank'),
    [workspaceId, logicalDate]
  );
}

export function useWeeklyFocus(
  weekKey: string,
  workspaceId: string = DEFAULT_WORKSPACE_ID
): WeeklyFocus[] | undefined {
  return useLiveQuery(
    () =>
      db.weeklyFocus
        .where('[workspaceId+weekKey]')
        .equals([workspaceId, weekKey])
        .sortBy('rank'),
    [workspaceId, weekKey]
  );
}

export function useSessions(
  startAt: number,
  endAt: number,
  workspaceId: string = DEFAULT_WORKSPACE_ID
): Session[] | undefined {
  return useLiveQuery(
    () =>
      db.sessions
        .where('[workspaceId+startedAt]')
        .between([workspaceId, startAt], [workspaceId, endAt], true, true)
        .filter((s) => !s.deletedAt)
        .toArray(),
    [workspaceId, startAt, endAt]
  );
}

