import { DEFAULT_WORKSPACE_ID, ensureDefaultWorkspace, type TiloDB } from './db';
import type {
  Goal,
  Project,
  Milestone,
  Task,
  PlannedBlock,
  Session,
  SessionSegment,
  InboxItem,
  DailyFocus,
  WeeklyFocus,
} from '@/core/types/domain';
import { timeService } from '@/core/time/timeService';

/**
 * Seeds a deterministic demo workspace with realistic goals, projects, milestones, tasks,
 * planned blocks, sessions, and inbox items.
 */
export async function seedDemoData(
  database: TiloDB,
  workspaceId: string = DEFAULT_WORKSPACE_ID
): Promise<void> {
  // Ensure workspace and default workflows exist
  await ensureDefaultWorkspace(database);

  const logicalDate = timeService.getLogicalDate(); // YYYY-MM-DD
  const weekKey = timeService.getWeekKey(); // e.g. 2026-W34
  const todayStartMs = timeService.getStartOfLogicalDay(logicalDate);

  const goalId1 = 'goal-seed-1';
  const goalId2 = 'goal-seed-2';
  const projectId1 = 'proj-seed-1';
  const projectId2 = 'proj-seed-2';

  const goals: Goal[] = [
    {
      id: goalId1,
      workspaceId,
      title: 'Ship Tilo V1 Local Execution System',
      description: 'Desktop Web First local-first personal execution system with zero backend.',
      color: '#4f46e5',
      status: 'active',
      progressMode: 'milestones',
      currentProgress: 60,
      targetProgress: 100,
      isWeeklyFocus: true,
      createdAt: todayStartMs - 86400000 * 7,
      updatedAt: todayStartMs,
      deletedAt: null,
    },
    {
      id: goalId2,
      workspaceId,
      title: 'Deep Work & Research Discipline',
      description: 'Build regular 4-hour daily deep focus blocks without multitasking.',
      color: '#10b981',
      status: 'active',
      progressMode: 'manual',
      currentProgress: 80,
      targetProgress: 100,
      isWeeklyFocus: true,
      createdAt: todayStartMs - 86400000 * 14,
      updatedAt: todayStartMs,
      deletedAt: null,
    },
  ];

  const projects: Project[] = [
    {
      id: projectId1,
      workspaceId,
      name: 'Product Launch',
      description: 'Core execution and release milestones for Tilo V1.',
      color: '#6366f1',
      primaryGoalId: goalId1,
      relatedGoalIds: [goalId2],
      status: 'active',
      isPinned: true,
      order: 0,
      createdAt: todayStartMs - 86400000 * 7,
      updatedAt: todayStartMs,
      deletedAt: null,
    },
    {
      id: projectId2,
      workspaceId,
      name: 'Design System',
      description: 'Restrained Linear-like UI tokens, Radix primitives, and layout engine.',
      color: '#10b981',
      primaryGoalId: goalId1,
      relatedGoalIds: [],
      status: 'active',
      isPinned: true,
      order: 1,
      createdAt: todayStartMs - 86400000 * 7,
      updatedAt: todayStartMs,
      deletedAt: null,
    },
  ];

  const milestones: Milestone[] = [
    {
      id: 'ms-seed-1',
      workspaceId,
      projectId: projectId1,
      title: 'Phase 0 Bootstrap & Phase 1 Foundation Complete',
      status: 'completed',
      targetDate: logicalDate,
      order: 0,
      createdAt: todayStartMs - 86400000 * 3,
      updatedAt: todayStartMs,
      deletedAt: null,
    },
    {
      id: 'ms-seed-2',
      workspaceId,
      projectId: projectId1,
      title: 'Phase 2 Database & Domain Core Validation',
      status: 'active',
      targetDate: logicalDate,
      order: 1,
      createdAt: todayStartMs - 86400000 * 2,
      updatedAt: todayStartMs,
      deletedAt: null,
    },
  ];

  const taskId1 = 'task-seed-1';
  const taskId2 = 'task-seed-2';
  const taskId3 = 'task-seed-3';

  const tasks: Task[] = [
    {
      id: taskId1,
      workspaceId,
      projectId: projectId2,
      title: 'Finalize design system tokens and baseline primitives',
      description: 'Ensure Indigo accent, density modes, and accessibility focus rings are centralized.',
      statusId: 'ws-task-done',
      priority: 'high',
      progressMode: 'binary',
      estimateMinutes: 60,
      scheduledDate: logicalDate,
      tagIds: [],
      createdAt: todayStartMs,
      updatedAt: todayStartMs,
      deletedAt: null,
    },
    {
      id: taskId2,
      workspaceId,
      projectId: projectId1,
      title: 'Review IndexedDB Dexie migration schema',
      description: 'Validate schema versioning, transaction boundaries, and workspaceId isolation.',
      statusId: 'ws-task-inprogress',
      priority: 'urgent',
      progressMode: 'binary',
      estimateMinutes: 45,
      scheduledDate: logicalDate,
      tagIds: [],
      createdAt: todayStartMs,
      updatedAt: todayStartMs,
      deletedAt: null,
    },
    {
      id: taskId3,
      workspaceId,
      projectId: projectId1,
      title: 'Implement deterministic seedDemoData generator',
      description: 'Prepare demo records for development and Playwright test fixtures.',
      statusId: 'ws-task-todo',
      priority: 'medium',
      progressMode: 'binary',
      estimateMinutes: 30,
      scheduledDate: logicalDate,
      tagIds: [],
      createdAt: todayStartMs,
      updatedAt: todayStartMs,
      deletedAt: null,
    },
  ];

  const plannedBlocks: PlannedBlock[] = [
    {
      id: 'block-seed-1',
      workspaceId,
      taskId: taskId1,
      projectId: projectId2,
      type: 'task',
      title: 'Design system primitives execution',
      startAt: todayStartMs + 9 * 3600000, // 09:00 AM
      endAt: todayStartMs + 10 * 3600000, // 10:00 AM
      createdAt: todayStartMs,
      updatedAt: todayStartMs,
      deletedAt: null,
    },
    {
      id: 'block-seed-2',
      workspaceId,
      taskId: taskId2,
      projectId: projectId1,
      type: 'task',
      title: 'Dexie schema validation & testing',
      startAt: todayStartMs + 14 * 3600000, // 02:00 PM
      endAt: todayStartMs + 15 * 3600000, // 03:00 PM
      createdAt: todayStartMs,
      updatedAt: todayStartMs,
      deletedAt: null,
    },
  ];

  const sessionId1 = 'sess-seed-1';
  const sessions: Session[] = [
    {
      id: sessionId1,
      workspaceId,
      taskId: taskId1,
      plannedBlockId: 'block-seed-1',
      projectId: projectId2,
      title: 'Design system tokens implementation',
      kind: 'active',
      source: 'timer',
      startedAt: todayStartMs + 9 * 3600000,
      endedAt: todayStartMs + 10 * 3600000,
      activeDurationSeconds: 3600,
      elapsedDurationSeconds: 3600,
      createdAt: todayStartMs,
      updatedAt: todayStartMs,
      deletedAt: null,
    },
  ];

  const sessionSegments: SessionSegment[] = [
    {
      id: 'seg-seed-1',
      workspaceId,
      sessionId: sessionId1,
      type: 'active',
      startAt: todayStartMs + 9 * 3600000,
      endAt: todayStartMs + 10 * 3600000,
    },
  ];

  const dailyFocus: DailyFocus[] = [
    {
      id: `df-${logicalDate}-${taskId2}`,
      workspaceId,
      logicalDate,
      taskId: taskId2,
      rank: 1,
    },
    {
      id: `df-${logicalDate}-${taskId3}`,
      workspaceId,
      logicalDate,
      taskId: taskId3,
      rank: 2,
    },
  ];

  const weeklyFocus: WeeklyFocus[] = [
    {
      id: `wf-${weekKey}-${goalId1}`,
      workspaceId,
      weekKey,
      goalId: goalId1,
      rank: 1,
    },
    {
      id: `wf-${weekKey}-${goalId2}`,
      workspaceId,
      weekKey,
      goalId: goalId2,
      rank: 2,
    },
  ];

  const inboxItems: InboxItem[] = [
    {
      id: 'inbox-seed-1',
      workspaceId,
      rawText: 'Explore keyboard navigation hotkeys for timeline snapping',
      capturedAt: todayStartMs - 3600000 * 2,
      kind: 'unsorted',
      state: 'unsorted',
      createdAt: todayStartMs - 3600000 * 2,
      updatedAt: todayStartMs - 3600000 * 2,
      deletedAt: null,
    },
    {
      id: 'inbox-seed-2',
      workspaceId,
      rawText: 'https://dexie.org/docs/Tutorial/React',
      capturedAt: todayStartMs - 3600000 * 5,
      kind: 'link',
      state: 'unsorted',
      url: 'https://dexie.org/docs/Tutorial/React',
      urlDomain: 'dexie.org',
      createdAt: todayStartMs - 3600000 * 5,
      updatedAt: todayStartMs - 3600000 * 5,
      deletedAt: null,
    },
  ];

  await database.transaction(
    'rw',
    [
      database.goals,
      database.projects,
      database.milestones,
      database.tasks,
      database.plannedBlocks,
      database.sessions,
      database.sessionSegments,
      database.dailyFocus,
      database.weeklyFocus,
      database.inboxItems,
    ],
    async () => {
      for (const g of goals) await database.goals.put(g);
      for (const p of projects) await database.projects.put(p);
      for (const m of milestones) await database.milestones.put(m);
      for (const t of tasks) await database.tasks.put(t);
      for (const b of plannedBlocks) await database.plannedBlocks.put(b);
      for (const s of sessions) await database.sessions.put(s);
      for (const seg of sessionSegments) await database.sessionSegments.put(seg);
      for (const df of dailyFocus) await database.dailyFocus.put(df);
      for (const wf of weeklyFocus) await database.weeklyFocus.put(wf);
      for (const item of inboxItems) await database.inboxItems.put(item);
    }
  );
}
