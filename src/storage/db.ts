import Dexie, { type Table } from 'dexie';
import type { SyncTombstone } from '@/core/types/sync';
import type {
  Workspace,
  Goal,
  Project,
  Milestone,
  Workflow,
  WorkflowStatus,
  Task,
  PlannedBlock,
  RecurrenceSeries,
  Session,
  SessionSegment,
  DailyFocus,
  WeeklyFocus,
  InboxItem,
  Note,
  Tag,
  CustomFieldDefinition,
  CustomFieldValue,
  MetricDefinition,
  MetricEntry,
  ActivityEvent,
  Review,
  ReviewRevision,
  Template,
} from '@/core/types/domain';

export const DEFAULT_WORKSPACE_ID = 'ws-default';

export class TiloDB extends Dexie {
  workspaces!: Table<Workspace, string>;
  goals!: Table<Goal, string>;
  projects!: Table<Project, string>;
  milestones!: Table<Milestone, string>;
  workflows!: Table<Workflow, string>;
  workflowStatuses!: Table<WorkflowStatus, string>;
  tasks!: Table<Task, string>;
  plannedBlocks!: Table<PlannedBlock, string>;
  recurrenceSeries!: Table<RecurrenceSeries, string>;
  sessions!: Table<Session, string>;
  sessionSegments!: Table<SessionSegment, string>;
  dailyFocus!: Table<DailyFocus, string>;
  weeklyFocus!: Table<WeeklyFocus, string>;
  inboxItems!: Table<InboxItem, string>;
  notes!: Table<Note, string>;
  tags!: Table<Tag, string>;
  customFieldDefinitions!: Table<CustomFieldDefinition, string>;
  customFieldValues!: Table<CustomFieldValue, string>;
  metricDefinitions!: Table<MetricDefinition, string>;
  metricEntries!: Table<MetricEntry, string>;
  activityEvents!: Table<ActivityEvent, string>;
  reviews!: Table<Review, string>;
  reviewRevisions!: Table<ReviewRevision, string>;
  templates!: Table<Template, string>;
  /** 删除墓碑：让「删除」这一事实也能参与同步（见 core/types/sync.ts） */
  syncTombstones!: Table<SyncTombstone, string>;

  constructor(dbName: string = 'tilo_db') {
    super(dbName);

    // Schema Version 1
    this.version(1).stores({
      workspaces: 'id, name, createdAt',
      goals: 'id, workspaceId, status, isWeeklyFocus, [workspaceId+deletedAt], [workspaceId+status]',
      projects: 'id, workspaceId, status, primaryGoalId, isPinned, order, [workspaceId+deletedAt], [workspaceId+status]',
      milestones: 'id, workspaceId, projectId, status, order, [workspaceId+projectId]',
      workflows: 'id, workspaceId, scope, projectId, isDefault, [workspaceId+scope]',
      workflowStatuses: 'id, workspaceId, workflowId, semantic, order, [workspaceId+workflowId]',
      tasks: 'id, workspaceId, projectId, parentTaskId, statusId, priority, progressMode, dueDate, scheduledDate, planningBucket, [workspaceId+deletedAt], [workspaceId+scheduledDate], [workspaceId+projectId], [workspaceId+parentTaskId]',
      plannedBlocks: 'id, workspaceId, taskId, projectId, type, startAt, endAt, recurrenceSeriesId, [workspaceId+startAt], [workspaceId+taskId]',
      recurrenceSeries: 'id, workspaceId, frequency, startsOn, [workspaceId+startsOn]',
      sessions: 'id, workspaceId, taskId, plannedBlockId, projectId, kind, source, startedAt, endedAt, [workspaceId+startedAt], [workspaceId+taskId]',
      sessionSegments: 'id, workspaceId, sessionId, type, startAt, [workspaceId+sessionId]',
      dailyFocus: 'id, workspaceId, logicalDate, taskId, rank, [workspaceId+logicalDate], [workspaceId+taskId]',
      weeklyFocus: 'id, workspaceId, weekKey, goalId, rank, [workspaceId+weekKey], [workspaceId+goalId]',
      inboxItems: 'id, workspaceId, state, kind, capturedAt, [workspaceId+state], [workspaceId+deletedAt]',
      notes: 'id, workspaceId, goalId, projectId, taskId, [workspaceId+deletedAt]',
      tags: 'id, workspaceId, name, [workspaceId+name]',
      customFieldDefinitions: 'id, workspaceId, scope, entityType, [workspaceId+entityType]',
      customFieldValues: 'id, workspaceId, fieldId, entityId, [workspaceId+entityId]',
      metricDefinitions: 'id, workspaceId, ownerType, ownerId, [workspaceId+ownerType]',
      metricEntries: 'id, workspaceId, metricId, periodKey, [workspaceId+metricId]',
      activityEvents: 'id, workspaceId, entityType, entityId, eventType, occurredAt, [workspaceId+occurredAt], [workspaceId+entityId]',
      reviews: 'id, workspaceId, type, periodKey, status, [workspaceId+periodKey]',
      reviewRevisions: 'id, workspaceId, reviewId, revision, createdAt, [workspaceId+reviewId]',
      templates: 'id, workspaceId, kind, [workspaceId+kind]',
    });

    // Schema Version 2 — 新增删除墓碑表（硬删除的记录靠它在设备间传播「已删除」）
    // 只声明新增的表，其余表结构由 version(1) 继承。
    this.version(2).stores({
      syncTombstones: 'key, table, deletedAt',
    });
  }
}

// Global Singleton database instance
export const db = new TiloDB();

/**
 * Ensures the default workspace and core default workflows exist in Dexie.
 */
export async function ensureDefaultWorkspace(database: TiloDB = db): Promise<Workspace> {
  const existing = await database.workspaces.get(DEFAULT_WORKSPACE_ID);
  if (existing) {
    return existing;
  }

  const now = Date.now();
  const defaultWorkspace: Workspace = {
    id: DEFAULT_WORKSPACE_ID,
    workspaceId: DEFAULT_WORKSPACE_ID,
    name: 'Personal workspace',
    createdAt: now,
    updatedAt: now,
    settings: {
      timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
      dayStartMinutes: 0,
      weekStartDay: 1, // Monday
      focusCountLimit: 3,
      theme: 'system',
      density: 'comfortable',
      motionLevel: 'balanced',
      backupReminderDays: 7,
    },
  };

  // Create default Task workflow: Todo -> In Progress -> Done
  const defaultTaskWorkflow: Workflow = {
    id: 'wf-task-default',
    workspaceId: DEFAULT_WORKSPACE_ID,
    scope: 'task',
    name: 'Standard Task Workflow',
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  };

  const defaultTaskStatuses: WorkflowStatus[] = [
    {
      id: 'ws-task-todo',
      workspaceId: DEFAULT_WORKSPACE_ID,
      workflowId: 'wf-task-default',
      name: 'To Do',
      semantic: 'open',
      order: 0,
      colorToken: '#94a3b8',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'ws-task-inprogress',
      workspaceId: DEFAULT_WORKSPACE_ID,
      workflowId: 'wf-task-default',
      name: 'In Progress',
      semantic: 'active',
      order: 1,
      colorToken: '#6366f1',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'ws-task-waiting',
      workspaceId: DEFAULT_WORKSPACE_ID,
      workflowId: 'wf-task-default',
      name: 'Waiting',
      semantic: 'waiting',
      order: 2,
      colorToken: '#f59e0b',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'ws-task-done',
      workspaceId: DEFAULT_WORKSPACE_ID,
      workflowId: 'wf-task-default',
      name: 'Done',
      semantic: 'completed',
      order: 3,
      colorToken: '#10b981',
      createdAt: now,
      updatedAt: now,
    },
  ];

  await database.transaction('rw', [database.workspaces, database.workflows, database.workflowStatuses], async () => {
    await database.workspaces.put(defaultWorkspace);
    await database.workflows.put(defaultTaskWorkflow);
    for (const status of defaultTaskStatuses) {
      await database.workflowStatuses.put(status);
    }
  });

  return defaultWorkspace;
}
