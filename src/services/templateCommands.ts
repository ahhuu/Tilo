import { db, DEFAULT_WORKSPACE_ID, type TiloDB } from '@/storage/db';
import type { Template, Task, PriorityLevel, TaskProgressMode } from '@/core/types/domain';

export interface TaskTemplatePayload {
  title: string;
  description?: string;
  priority: PriorityLevel;
  estimateMinutes?: number;
  progressMode: TaskProgressMode;
  subtaskTitles?: string[];
  tagNames?: string[];
}

export interface ReviewReflectionTemplatePayload {
  type: 'daily' | 'weekly';
  promptQuestions: string[];
  selectedMetrics?: string[];
}

export const DEFAULT_TASK_TEMPLATES: Array<{ id: string; name: string; payload: TaskTemplatePayload }> = [
  {
    id: 'tmpl-task-std-feature',
    name: 'Standard Feature Development',
    payload: {
      title: 'Develop feature: ',
      description: 'Implement core functionality and unit tests.',
      priority: 'high',
      estimateMinutes: 90,
      progressMode: 'subtasks',
      subtaskTitles: ['Requirements alignment', 'Core implementation', 'Unit tests & typecheck', 'Manual validation'],
      tagNames: ['dev', 'feature'],
    },
  },
  {
    id: 'tmpl-task-bug-fix',
    name: 'Quick Bug Fix & Investigation',
    payload: {
      title: 'Fix issue: ',
      description: 'Isolate root cause, write regression test, apply patch.',
      priority: 'urgent',
      estimateMinutes: 45,
      progressMode: 'binary',
      subtaskTitles: ['Reproduce & trace', 'Fix patch', 'Verify E2E'],
      tagNames: ['bug', 'fix'],
    },
  },
  {
    id: 'tmpl-task-weekly-prep',
    name: 'Weekly Planning & Prep',
    payload: {
      title: 'Weekly Sprint & Goal Alignment',
      description: 'Review last week metrics, choose top 3 focuses, block calendar time.',
      priority: 'medium',
      estimateMinutes: 30,
      progressMode: 'subtasks',
      subtaskTitles: ['Review inbox & triage', 'Select top weekly focuses', 'Schedule primary blocks in calendar'],
      tagNames: ['planning', 'weekly'],
    },
  },
];

export const DEFAULT_REFLECTION_TEMPLATES: Array<{ id: string; name: string; payload: ReviewReflectionTemplatePayload }> = [
  {
    id: 'tmpl-refl-daily-close',
    name: 'Standard Daily Close Reflection',
    payload: {
      type: 'daily',
      promptQuestions: [
        'What was the primary high-leverage accomplishment today?',
        'Where did friction or unexpected interruption happen?',
        'What is the clear priority for tomorrow morning?',
      ],
    },
  },
  {
    id: 'tmpl-refl-weekly-review',
    name: 'Standard Weekly Review Story',
    payload: {
      type: 'weekly',
      promptQuestions: [
        'How did actual execution align with the planned weekly focus goals?',
        'What were the primary drivers of planning accuracy or variance?',
        'What adjustments will be made for next week’s capacity and commitments?',
      ],
      selectedMetrics: ['timeAccuracy', 'plannedVsActual', 'completionRate'],
    },
  },
];

/**
 * Ensures default templates are created in the database and cleans up any duplicate templates.
 */
export async function ensureTemplatesInitialized(database: TiloDB = db): Promise<void> {
  const allTemplates = await database.templates.toArray();

  // Deduplicate by name and kind if duplicate entries exist
  const seenKeys = new Set<string>();
  const toDeleteIds: string[] = [];
  for (const t of allTemplates) {
    const key = `${t.kind}:${t.name.trim().toLowerCase()}`;
    if (seenKeys.has(key)) {
      toDeleteIds.push(t.id);
    } else {
      seenKeys.add(key);
    }
  }

  if (toDeleteIds.length > 0) {
    await database.templates.bulkDelete(toDeleteIds);
  }

  const now = Date.now();
  for (const t of DEFAULT_TASK_TEMPLATES) {
    const existing = await database.templates.get(t.id);
    if (!existing) {
      // Check if one with same name exists
      const byName = allTemplates.find((x) => x.kind === 'task' && x.name === t.name);
      if (!byName) {
        await database.templates.put({
          id: t.id,
          workspaceId: DEFAULT_WORKSPACE_ID,
          kind: 'task',
          name: t.name,
          payloadJson: t.payload,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        });
      }
    }
  }

  for (const r of DEFAULT_REFLECTION_TEMPLATES) {
    const existing = await database.templates.get(r.id);
    if (!existing) {
      const byName = allTemplates.find((x) => x.kind === 'reviewReflection' && x.name === r.name);
      if (!byName) {
        await database.templates.put({
          id: r.id,
          workspaceId: DEFAULT_WORKSPACE_ID,
          kind: 'reviewReflection',
          name: r.name,
          payloadJson: r.payload,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        });
      }
    }
  }
}

/**
 * Creates a template.
 */
export async function createTemplate(
  input: {
    kind: 'task' | 'reviewReflection';
    name: string;
    payload: TaskTemplatePayload | ReviewReflectionTemplatePayload;
    workspaceId?: string;
  },
  database: TiloDB = db
): Promise<Template> {
  const workspaceId = input.workspaceId || DEFAULT_WORKSPACE_ID;
  const now = Date.now();
  const templateId = `tmpl-${input.kind}-${now}-${Math.random().toString(36).substr(2, 6)}`;

  const template: Template = {
    id: templateId,
    workspaceId,
    kind: input.kind,
    name: input.name.trim(),
    payloadJson: input.payload,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  await database.templates.put(template);
  return template;
}

/**
 * Updates a template.
 */
export async function updateTemplate(
  templateId: string,
  updates: Partial<{
    name: string;
    payload: TaskTemplatePayload | ReviewReflectionTemplatePayload;
  }>,
  database: TiloDB = db
): Promise<Template> {
  const existing = await database.templates.get(templateId);
  if (!existing) {
    throw new Error(`Template ${templateId} not found`);
  }

  const updated: Template = {
    ...existing,
    name: updates.name !== undefined ? updates.name.trim() : existing.name,
    payloadJson: updates.payload !== undefined ? updates.payload : existing.payloadJson,
    updatedAt: Date.now(),
  };

  await database.templates.put(updated);
  return updated;
}

/**
 * Deletes a template.
 */
export async function deleteTemplate(templateId: string, database: TiloDB = db): Promise<void> {
  await database.templates.delete(templateId);
}

/**
 * Resets templates to standard system defaults.
 */
export async function resetTemplatesToDefault(database: TiloDB = db): Promise<void> {
  await database.templates.clear();
  await ensureTemplatesInitialized(database);
}

/**
 * Instantiates a Task and its subtasks from a task template.
 */
export async function instantiateTaskFromTemplate(
  template: Template,
  overrides?: {
    projectId?: string;
    scheduledDate?: string;
    dueDate?: string;
  },
  database: TiloDB = db
): Promise<Task> {
  const { createTask } = await import('@/services/taskCommands');
  const payload = template.payloadJson as TaskTemplatePayload;
  const task = await createTask(
    {
      title: payload.title || template.name,
      description: payload.description,
      priority: payload.priority || 'medium',
      estimateMinutes: payload.estimateMinutes,
      progressMode: payload.progressMode || (payload.subtaskTitles && payload.subtaskTitles.length > 0 ? 'subtasks' : 'binary'),
      tagIds: payload.tagNames,
      projectId: overrides?.projectId,
      scheduledDate: overrides?.scheduledDate,
      dueDate: overrides?.dueDate,
    },
    database
  );

  if (payload.subtaskTitles && payload.subtaskTitles.length > 0) {
    for (let i = 0; i < payload.subtaskTitles.length; i++) {
      const subTitle = payload.subtaskTitles[i];
      if (subTitle && subTitle.trim()) {
        await createTask(
          {
            title: subTitle.trim(),
            parentTaskId: task.id,
            projectId: overrides?.projectId,
          },
          database
        );
      }
    }
  }

  return task;
}
