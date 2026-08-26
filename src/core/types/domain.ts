import { BaseEntity } from './base';

export type PriorityLevel = 'urgent' | 'high' | 'medium' | 'low' | 'none';

export interface WorkspaceSettings {
  timezone: string;
  dayStartMinutes: number; // e.g. 240 for 04:00 AM cutoff
  weekStartDay: 0 | 1; // 0 = Sunday, 1 = Monday
  focusCountLimit: number; // 1 to 5, default 3
  theme: 'light' | 'dark' | 'system';
  density: 'comfortable' | 'compact';
  motionLevel: 'reduced' | 'subtle' | 'balanced' | 'expressive';
  backupReminderDays: 7 | 14 | 30 | 0; // 0 = off
}

export interface Workspace extends BaseEntity {
  name: string;
  settings: WorkspaceSettings;
}

export type GoalProgressMode = 'manual' | 'milestones' | 'taskCompletion' | 'metricTarget';
export type GoalStatus = 'active' | 'completed' | 'paused' | 'archived';

export interface Goal extends BaseEntity {
  title: string;
  description?: string;
  color?: string;
  status: GoalStatus;
  progressMode: GoalProgressMode;
  currentProgress: number; // 0 to 100 or metric value
  targetProgress?: number;
  targetDate?: string;
  isWeeklyFocus?: boolean;
}

export type ProjectStatus = 'active' | 'completed' | 'paused' | 'archived';

export interface Project extends BaseEntity {
  name: string;
  description?: string;
  color: string;
  primaryGoalId?: string;
  relatedGoalIds?: string[];
  status: ProjectStatus;
  statusId?: string; // Links to custom project workflow status
  isPinned?: boolean;
  order: number;
}

export interface Milestone extends BaseEntity {
  projectId: string;
  title: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  targetDate?: string;
  order: number;
}

export type WorkflowSemanticState = 'open' | 'active' | 'waiting' | 'completed' | 'cancelled';

export interface WorkflowStatus extends BaseEntity {
  workflowId: string;
  name: string;
  semantic: WorkflowSemanticState;
  order: number;
  colorToken?: string;
}

export interface Workflow extends BaseEntity {
  scope: 'task' | 'project';
  projectId?: string; // If undefined, applies globally
  name: string;
  isDefault?: boolean;
}

export type TaskProgressMode = 'binary' | 'subtasks' | 'manual';

export interface Task extends BaseEntity {
  projectId?: string;
  parentTaskId?: string; // Subtasks are exactly one level deep
  title: string;
  description?: string;
  statusId: string; // References WorkflowStatus
  priority: PriorityLevel;
  progressMode: TaskProgressMode;
  manualProgress?: number; // 0 to 100
  estimateMinutes?: number;
  dueDate?: string; // YYYY-MM-DD
  scheduledDate?: string; // YYYY-MM-DD
  planningBucket?: 'someday';
  tagIds: string[];
  order?: number;
}

export type PlannedBlockType = 'task' | 'focus' | 'activity';

export interface PlannedBlock extends BaseEntity {
  taskId?: string;
  projectId?: string;
  type: PlannedBlockType;
  title?: string;
  startAt: number; // Epoch timestamp ms
  endAt: number; // Epoch timestamp ms
  recurrenceSeriesId?: string;
  recurrenceOccurrenceKey?: string;
}

export interface RecurrenceSeries extends BaseEntity {
  frequency: 'daily' | 'weekly';
  interval: number;
  weekdays?: number[]; // [0,1,2,3,4,5,6]
  startsOn: string; // YYYY-MM-DD
  endsOn?: string; // YYYY-MM-DD
  sourceTemplateJson: unknown;
}

export type SessionKind = 'active' | 'background';
export type SessionSource = 'timer' | 'manual';

export interface Session extends BaseEntity {
  taskId?: string;
  plannedBlockId?: string;
  projectId?: string;
  title?: string;
  kind: SessionKind;
  source: SessionSource;
  startedAt: number;
  endedAt?: number;
  activeDurationSeconds: number; // Sum of active segments
  elapsedDurationSeconds: number; // Total clock elapsed
}

export interface SessionSegment {
  id: string;
  workspaceId: string;
  sessionId: string;
  type: 'active' | 'paused';
  startAt: number;
  endAt?: number;
}

export interface DailyFocus {
  id: string;
  workspaceId: string;
  logicalDate: string; // YYYY-MM-DD
  taskId: string;
  rank: number; // 1 to 5
}

export interface WeeklyFocus {
  id: string;
  workspaceId: string;
  weekKey: string; // YYYY-Www (e.g. 2026-W34)
  goalId: string;
  rank: number;
}

export type InboxItemKind = 'unsorted' | 'idea' | 'link';
export type InboxItemState = 'unsorted' | 'someday' | 'archived' | 'converted';

export interface InboxItem extends BaseEntity {
  rawText: string;
  capturedAt: number;
  kind: InboxItemKind;
  state: InboxItemState;
  url?: string;
  urlTitle?: string;
  urlDomain?: string;
  convertedEntityType?: 'task' | 'note' | 'project';
  convertedEntityId?: string;
}

export interface Note extends BaseEntity {
  title: string;
  bodyMarkdown: string;
  goalId?: string;
  projectId?: string;
  taskId?: string;
  tagIds: string[];
}

export interface Tag extends BaseEntity {
  name: string;
  color?: string;
}

export type CustomFieldType =
  | 'status'
  | 'priority'
  | 'tag'
  | 'date'
  | 'number'
  | 'singleSelect'
  | 'multiSelect'
  | 'text'
  | 'checkbox';

export interface CustomFieldDefinition extends BaseEntity {
  scope: 'global' | 'project';
  projectId?: string;
  entityType: 'task' | 'project';
  name: string;
  type: CustomFieldType;
  configJson: unknown;
  order: number;
}

export interface CustomFieldValue extends BaseEntity {
  fieldId: string;
  entityId: string;
  valueJson: unknown;
}

export interface MetricDefinition extends BaseEntity {
  ownerType: 'workspace' | 'goal';
  ownerId?: string;
  name: string;
  unit: 'count' | 'minutes' | 'hours' | 'percent' | 'custom';
  targetValue: number;
  period: 'day' | 'week' | 'month';
  source: 'sessionCount' | 'actualMinutes' | 'completedTasks' | 'manual';
  filterJson: unknown;
}

export interface MetricEntry extends BaseEntity {
  metricId: string;
  periodKey: string; // e.g. 2026-08-21 or 2026-W34
  value: number;
  loggedAt: number;
}

export type ActivityEventType =
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_STATUS_CHANGED'
  | 'TASK_COMPLETED'
  | 'TASK_REOPENED'
  | 'TASK_RESCHEDULED'
  | 'TASK_ARCHIVED'
  | 'TASK_TRASHED'
  | 'TASK_RESTORED'
  | 'PLAN_CREATED'
  | 'PLAN_MOVED'
  | 'PLAN_RESIZED'
  | 'PLAN_DELETED'
  | 'SESSION_STARTED'
  | 'SESSION_PAUSED'
  | 'SESSION_RESUMED'
  | 'SESSION_FINISHED'
  | 'SESSION_ADJUSTED'
  | 'GOAL_CREATED'
  | 'GOAL_UPDATED'
  | 'GOAL_DELETED'
  | 'GOAL_FOCUS_SET'
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_DELETED'
  | 'INBOX_CAPTURED'
  | 'INBOX_TRIAGED'
  | 'WORKFLOW_CREATED'
  | 'WORKFLOW_UPDATED'
  | 'DAILY_CLOSE_COMPLETED'
  | 'WEEKLY_REVIEW_COMPLETED';

export interface ActivityEvent {
  id: string;
  workspaceId: string;
  entityType: string;
  entityId: string;
  eventType: ActivityEventType;
  occurredAt: number;
  actor: 'user' | 'system';
  payloadJson: unknown;
}

export type ReviewType = 'daily' | 'weekly';
export type ReviewStatus = 'draft' | 'completed' | 'reopened' | 'skipped';

export interface Review extends BaseEntity {
  type: ReviewType;
  periodKey: string; // e.g. 2026-08-21 or 2026-W34
  periodStart: number;
  periodEnd: number;
  status: ReviewStatus;
  currentRevision: number;
}

export interface ReviewRevision {
  id: string;
  workspaceId: string;
  reviewId: string;
  revision: number;
  createdAt: number;
  snapshotJson: unknown;
  reflectionJson: unknown;
  storyText?: string;
}

export interface Template extends BaseEntity {
  kind: 'task' | 'reviewReflection';
  name: string;
  payloadJson: unknown;
}
