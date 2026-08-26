import { db, DEFAULT_WORKSPACE_ID, type TiloDB } from '@/storage/db';
import type {
  Workflow,
  WorkflowStatus,
  WorkflowSemanticState,
  ActivityEvent,
  CustomFieldDefinition,
  CustomFieldType,
} from '@/core/types/domain';

export const DEFAULT_TASK_WORKFLOW_ID = 'wf-task-default';
export const DEFAULT_PROJECT_WORKFLOW_ID = 'wf-proj-default';

export const STANDARD_DEFAULT_TASK_STATUSES: Array<{
  id: string;
  name: string;
  semantic: WorkflowSemanticState;
  colorToken: string;
  order: number;
}> = [
  { id: 'ws-task-todo', name: 'To Do', semantic: 'open', colorToken: '#94a3b8', order: 0 },
  { id: 'ws-task-inprogress', name: 'In Progress', semantic: 'active', colorToken: '#6366f1', order: 1 },
  { id: 'ws-task-waiting', name: 'Waiting', semantic: 'waiting', colorToken: '#f59e0b', order: 2 },
  { id: 'ws-task-done', name: 'Done', semantic: 'completed', colorToken: '#10b981', order: 3 },
];

export const STANDARD_DEFAULT_PROJECT_STATUSES: Array<{
  id: string;
  name: string;
  semantic: WorkflowSemanticState;
  colorToken: string;
  order: number;
}> = [
  { id: 'ws-proj-active', name: 'Active (进行中)', semantic: 'active', colorToken: '#6366f1', order: 0 },
  { id: 'ws-proj-onhold', name: 'On Hold (已暂停)', semantic: 'waiting', colorToken: '#f59e0b', order: 1 },
  { id: 'ws-proj-completed', name: 'Completed (已完成)', semantic: 'completed', colorToken: '#10b981', order: 2 },
  { id: 'ws-proj-cancelled', name: 'Cancelled (已归档)', semantic: 'cancelled', colorToken: '#ef4444', order: 3 },
];

/**
 * Ensures the default project workflow and task workflow exist in database.
 */
export async function ensureWorkflowsInitialized(database: TiloDB = db): Promise<void> {
  const now = Date.now();

  // Check Task default workflow
  const taskWf = await database.workflows.get(DEFAULT_TASK_WORKFLOW_ID);
  if (!taskWf) {
    const defaultTaskWf: Workflow = {
      id: DEFAULT_TASK_WORKFLOW_ID,
      workspaceId: DEFAULT_WORKSPACE_ID,
      scope: 'task',
      name: 'Standard Task Workflow',
      isDefault: true,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    await database.workflows.put(defaultTaskWf);
    for (const status of STANDARD_DEFAULT_TASK_STATUSES) {
      await database.workflowStatuses.put({
        ...status,
        workspaceId: DEFAULT_WORKSPACE_ID,
        workflowId: DEFAULT_TASK_WORKFLOW_ID,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });
    }
  }

  // Check Project default workflow
  const projWf = await database.workflows.get(DEFAULT_PROJECT_WORKFLOW_ID);
  if (!projWf) {
    const defaultProjWf: Workflow = {
      id: DEFAULT_PROJECT_WORKFLOW_ID,
      workspaceId: DEFAULT_WORKSPACE_ID,
      scope: 'project',
      name: 'Standard Project Workflow',
      isDefault: true,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    await database.workflows.put(defaultProjWf);
    for (const status of STANDARD_DEFAULT_PROJECT_STATUSES) {
      await database.workflowStatuses.put({
        ...status,
        workspaceId: DEFAULT_WORKSPACE_ID,
        workflowId: DEFAULT_PROJECT_WORKFLOW_ID,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });
    }
  } else {
    // Migration check: If any project status has 'open' semantic, migrate it to 'active'
    const openProjStatuses = await database.workflowStatuses
      .where('workflowId')
      .equals(DEFAULT_PROJECT_WORKFLOW_ID)
      .filter((s) => s.semantic === 'open')
      .toArray();

    for (const s of openProjStatuses) {
      await database.workflowStatuses.update(s.id, {
        semantic: 'active',
        updatedAt: now,
      });
    }
  }
}

/**
 * Creates a new custom workflow with initial statuses.
 */
export async function createWorkflow(
  input: {
    scope: 'task' | 'project';
    projectId?: string;
    name: string;
    isDefault?: boolean;
    initialStatuses?: Array<{ name: string; semantic: WorkflowSemanticState; colorToken?: string }>;
    workspaceId?: string;
  },
  database: TiloDB = db
): Promise<Workflow> {
  const workspaceId = input.workspaceId || DEFAULT_WORKSPACE_ID;
  const now = Date.now();
  const workflowId = `wf-${input.scope}-${now}-${Math.random().toString(36).substr(2, 6)}`;

  const workflow: Workflow = {
    id: workflowId,
    workspaceId,
    scope: input.scope,
    projectId: input.projectId,
    name: input.name.trim(),
    isDefault: input.isDefault ?? false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  const statusesToCreate: WorkflowStatus[] = [];
  const rawStatuses =
    input.initialStatuses && input.initialStatuses.length > 0
      ? input.initialStatuses
      : input.scope === 'task'
        ? STANDARD_DEFAULT_TASK_STATUSES
        : STANDARD_DEFAULT_PROJECT_STATUSES;

  rawStatuses.forEach((s, idx) => {
    statusesToCreate.push({
      id: `ws-${workflowId}-${idx}`,
      workspaceId,
      workflowId,
      name: s.name,
      semantic: s.semantic,
      order: idx,
      colorToken: s.colorToken || '#6366f1',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  });

  await database.transaction('rw', [database.workflows, database.workflowStatuses, database.activityEvents], async () => {
    await database.workflows.put(workflow);
    for (const st of statusesToCreate) {
      await database.workflowStatuses.put(st);
    }

    const event: ActivityEvent = {
      id: `ev-${now}-${Math.random().toString(36).substr(2, 9)}`,
      workspaceId,
      entityType: 'project',
      entityId: workflowId,
      eventType: 'WORKFLOW_CREATED',
      occurredAt: now,
      actor: 'user',
      payloadJson: { name: workflow.name, scope: workflow.scope },
    };
    await database.activityEvents.put(event);
  });

  return workflow;
}

/**
 * Adds a new status to a workflow.
 */
export async function addWorkflowStatus(
  workflowId: string,
  input: {
    name: string;
    semantic: WorkflowSemanticState;
    colorToken?: string;
    order?: number;
    workspaceId?: string;
  },
  database: TiloDB = db
): Promise<WorkflowStatus> {
  const workspaceId = input.workspaceId || DEFAULT_WORKSPACE_ID;
  const now = Date.now();
  const existingStatuses = await database.workflowStatuses
    .where('workflowId')
    .equals(workflowId)
    .toArray();

  const order = input.order ?? existingStatuses.length;
  const statusId = `ws-${now}-${Math.random().toString(36).substr(2, 6)}`;

  const status: WorkflowStatus = {
    id: statusId,
    workspaceId,
    workflowId,
    name: input.name.trim(),
    semantic: input.semantic,
    order,
    colorToken: input.colorToken || '#6366f1',
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  await database.workflowStatuses.put(status);
  return status;
}

/**
 * Updates an existing workflow status.
 */
export async function updateWorkflowStatus(
  statusId: string,
  updates: Partial<{
    name: string;
    semantic: WorkflowSemanticState;
    colorToken: string;
    order: number;
  }>,
  database: TiloDB = db
): Promise<WorkflowStatus> {
  const existing = await database.workflowStatuses.get(statusId);
  if (!existing) {
    throw new Error(`Workflow status ${statusId} not found`);
  }

  const updated: WorkflowStatus = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };

  // If semantic changed, validate workflow rules
  if (updates.semantic) {
    const allStatuses = await database.workflowStatuses
      .where('workflowId')
      .equals(existing.workflowId)
      .toArray();

    const candidateStatuses = allStatuses.map((s) => (s.id === statusId ? updated : s));
    const hasCompleted = candidateStatuses.some((s) => s.semantic === 'completed');
    const hasNonCompleted = candidateStatuses.some((s) => s.semantic !== 'completed');

    if (!hasCompleted || !hasNonCompleted) {
      throw new Error('Workflow must retain at least one non-completed and at least one completed semantic state');
    }
  }

  await database.workflowStatuses.put(updated);
  return updated;
}

/**
 * Deletes a workflow status, validating minimum semantics.
 */
export async function deleteWorkflowStatus(statusId: string, database: TiloDB = db): Promise<void> {
  const existing = await database.workflowStatuses.get(statusId);
  if (!existing) return;

  const allStatuses = await database.workflowStatuses
    .where('workflowId')
    .equals(existing.workflowId)
    .toArray();

  const remaining = allStatuses.filter((s) => s.id !== statusId);
  if (remaining.length === 0) {
    throw new Error('Cannot delete all statuses in a workflow');
  }

  const hasCompleted = remaining.some((s) => s.semantic === 'completed');
  const hasNonCompleted = remaining.some((s) => s.semantic !== 'completed');

  if (!hasCompleted || !hasNonCompleted) {
    throw new Error('Workflow must retain at least one non-completed and at least one completed semantic state');
  }

  await database.workflowStatuses.delete(statusId);
}

/**
 * Reorders workflow statuses.
 */
export async function reorderWorkflowStatuses(
  _workflowId: string,
  orderedStatusIds: string[],
  database: TiloDB = db
): Promise<void> {
  await database.transaction('rw', [database.workflowStatuses], async () => {
    for (let i = 0; i < orderedStatusIds.length; i++) {
      const statusId = orderedStatusIds[i];
      await database.workflowStatuses.update(statusId, { order: i, updatedAt: Date.now() });
    }
  });
}

/**
 * Resets a workflow to system defaults.
 */
export async function resetWorkflowToDefault(
  scope: 'task' | 'project',
  database: TiloDB = db
): Promise<void> {
  const defaultWfId = scope === 'task' ? DEFAULT_TASK_WORKFLOW_ID : DEFAULT_PROJECT_WORKFLOW_ID;
  const standardStatuses = scope === 'task' ? STANDARD_DEFAULT_TASK_STATUSES : STANDARD_DEFAULT_PROJECT_STATUSES;
  const now = Date.now();

  await database.transaction('rw', [database.workflows, database.workflowStatuses], async () => {
    // Delete custom statuses for this workflow
    const existing = await database.workflowStatuses.where('workflowId').equals(defaultWfId).toArray();
    for (const s of existing) {
      await database.workflowStatuses.delete(s.id);
    }

    // Recreate standard defaults
    for (const st of standardStatuses) {
      await database.workflowStatuses.put({
        ...st,
        workspaceId: DEFAULT_WORKSPACE_ID,
        workflowId: defaultWfId,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });
    }
  });
}

/**
 * Custom field definition commands
 */
export async function createCustomFieldDefinition(
  input: {
    name: string;
    entityType: 'task' | 'project';
    type: CustomFieldType;
    options?: string[];
    scope?: 'global' | 'project';
    projectId?: string;
    workspaceId?: string;
  },
  database: TiloDB = db
): Promise<CustomFieldDefinition> {
  const workspaceId = input.workspaceId || DEFAULT_WORKSPACE_ID;
  const now = Date.now();
  const fieldId = `cfd-${now}-${Math.random().toString(36).substr(2, 6)}`;
  const count = await database.customFieldDefinitions.count();

  const field: CustomFieldDefinition = {
    id: fieldId,
    workspaceId,
    name: input.name.trim(),
    entityType: input.entityType,
    type: input.type,
    configJson: input.options ? { options: input.options } : {},
    order: count,
    scope: input.scope || 'global',
    projectId: input.projectId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  await database.customFieldDefinitions.put(field);
  return field;
}

export async function deleteCustomFieldDefinition(
  fieldId: string,
  database: TiloDB = db
): Promise<void> {
  await database.customFieldDefinitions.delete(fieldId);
}
