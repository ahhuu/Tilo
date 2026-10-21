import { db, DEFAULT_WORKSPACE_ID, type TiloDB } from '@/storage/db';
import type { Template, Task, PriorityLevel, TaskProgressMode } from '@/core/types/domain';
import { hardDeleteWithTombstone } from '@/services/tombstoneService';

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
    name: '标准功能开发',
    payload: {
      title: '开发功能: ',
      description: '实现核心功能、编写单元测试并完成类型检查与验证。',
      priority: 'high',
      estimateMinutes: 90,
      progressMode: 'subtasks',
      subtaskTitles: ['需求与接口对齐', '核心功能实现', '单元测试与类型检查', '端到端手动验证'],
      tagNames: ['开发', '功能'],
    },
  },
  {
    id: 'tmpl-task-bug-fix',
    name: 'Bug 调查与修复',
    payload: {
      title: '修复问题: ',
      description: '复现并定位根本原因，编写回归测试，应用修复补丁。',
      priority: 'urgent',
      estimateMinutes: 45,
      progressMode: 'binary',
      subtaskTitles: ['问题复现与链路追踪', '修复补丁实现', '端到端回归验证'],
      tagNames: ['缺陷', '修复'],
    },
  },
  {
    id: 'tmpl-task-weekly-prep',
    name: '周度规划与目标对齐',
    payload: {
      title: '周度冲刺与目标对齐',
      description: '回顾上周指标，选定 Top 3 核心焦点，在日历中排定深度专注块。',
      priority: 'medium',
      estimateMinutes: 30,
      progressMode: 'subtasks',
      subtaskTitles: ['整理并分类收件箱', '选定本周核心焦点目标', '在日程表中规划核心时间块'],
      tagNames: ['规划', '周度'],
    },
  },
];

export const DEFAULT_REFLECTION_TEMPLATES: Array<{ id: string; name: string; payload: ReviewReflectionTemplatePayload }> = [
  {
    id: 'tmpl-refl-daily-close',
    name: '标准每日复盘反思',
    payload: {
      type: 'daily',
      promptQuestions: [
        '今天最核心的高杠杆产出是什么？',
        '在哪里遇到了阻碍、卡点或意外打扰？',
        '明天早晨最明确的第一优先级是什么？',
      ],
    },
  },
  {
    id: 'tmpl-refl-weekly-review',
    name: '标准每周复盘叙事',
    payload: {
      type: 'weekly',
      promptQuestions: [
        '本周实际执行与周度焦点目标的契合度如何？',
        '计划准确率或产生偏差的主要驱动因素是什么？',
        '下周的时间容量与承诺需要做出哪些调整？',
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
      // Check if one with same name or old English name exists
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
 *
 * 模板不进废纸篓，走硬删除 + 墓碑，避免对端把旧模板同步回来。
 */
export async function deleteTemplate(templateId: string, database: TiloDB = db): Promise<void> {
  await database.transaction('rw', [database.templates, database.syncTombstones], async () => {
    await hardDeleteWithTombstone(database.templates, 'templates', [templateId], database);
  });
}

/**
 * Resets templates to standard system defaults.
 */
export async function resetTemplatesToDefault(database: TiloDB = db): Promise<void> {
  await database.transaction('rw', [database.templates, database.syncTombstones], async () => {
    await database.templates.clear();
    // 重置后要按默认 id 重建模板：清掉模板墓碑，否则「重建」会被当成已删除记录挡回去
    await database.syncTombstones.where('table').equals('templates').delete();
    await ensureTemplatesInitialized(database);
  });
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
