import { z } from 'zod';
import { db, DEFAULT_WORKSPACE_ID, type TiloDB } from '@/storage/db';
import type { Workspace } from '@/core/types/domain';

// Zod Backup validation schema
export const workspaceBackupSchema = z.object({
  version: z.number(),
  product: z.literal('Tilo'),
  exportedAt: z.string(),
  workspace: z.object({
    id: z.string(),
    workspaceId: z.string(),
    name: z.string(),
    createdAt: z.number(),
    updatedAt: z.number(),
    settings: z.record(z.string(), z.unknown()),
  }),
  goals: z.array(z.record(z.string(), z.unknown())).default([]),
  projects: z.array(z.record(z.string(), z.unknown())).default([]),
  milestones: z.array(z.record(z.string(), z.unknown())).default([]),
  workflows: z.array(z.record(z.string(), z.unknown())).default([]),
  workflowStatuses: z.array(z.record(z.string(), z.unknown())).default([]),
  tasks: z.array(z.record(z.string(), z.unknown())).default([]),
  plannedBlocks: z.array(z.record(z.string(), z.unknown())).default([]),
  recurrenceSeries: z.array(z.record(z.string(), z.unknown())).default([]),
  sessions: z.array(z.record(z.string(), z.unknown())).default([]),
  sessionSegments: z.array(z.record(z.string(), z.unknown())).default([]),
  dailyFocus: z.array(z.record(z.string(), z.unknown())).default([]),
  weeklyFocus: z.array(z.record(z.string(), z.unknown())).default([]),
  inboxItems: z.array(z.record(z.string(), z.unknown())).default([]),
  notes: z.array(z.record(z.string(), z.unknown())).default([]),
  tags: z.array(z.record(z.string(), z.unknown())).default([]),
  customFieldDefinitions: z.array(z.record(z.string(), z.unknown())).default([]),
  customFieldValues: z.array(z.record(z.string(), z.unknown())).default([]),
  metricDefinitions: z.array(z.record(z.string(), z.unknown())).default([]),
  metricEntries: z.array(z.record(z.string(), z.unknown())).default([]),
  activityEvents: z.array(z.record(z.string(), z.unknown())).default([]),
  reviews: z.array(z.record(z.string(), z.unknown())).default([]),
  reviewRevisions: z.array(z.record(z.string(), z.unknown())).default([]),
  templates: z.array(z.record(z.string(), z.unknown())).default([]),
});

export type WorkspaceBackupData = z.infer<typeof workspaceBackupSchema>;

/**
 * Exports entire workspace data as a verified JSON structure.
 */
export async function exportWorkspaceJSON(
  workspaceId: string = DEFAULT_WORKSPACE_ID,
  database: TiloDB = db
): Promise<WorkspaceBackupData> {
  const workspace = await database.workspaces.get(workspaceId);
  if (!workspace) throw new Error(`Workspace ${workspaceId} not found`);

  const [
    goals,
    projects,
    milestones,
    workflows,
    workflowStatuses,
    tasks,
    plannedBlocks,
    recurrenceSeries,
    sessions,
    sessionSegments,
    dailyFocus,
    weeklyFocus,
    inboxItems,
    notes,
    tags,
    customFieldDefinitions,
    customFieldValues,
    metricDefinitions,
    metricEntries,
    activityEvents,
    reviews,
    reviewRevisions,
    templates,
  ] = await Promise.all([
    database.goals.where('workspaceId').equals(workspaceId).toArray(),
    database.projects.where('workspaceId').equals(workspaceId).toArray(),
    database.milestones.where('workspaceId').equals(workspaceId).toArray(),
    database.workflows.where('workspaceId').equals(workspaceId).toArray(),
    database.workflowStatuses.where('workspaceId').equals(workspaceId).toArray(),
    database.tasks.where('workspaceId').equals(workspaceId).toArray(),
    database.plannedBlocks.where('workspaceId').equals(workspaceId).toArray(),
    database.recurrenceSeries.where('workspaceId').equals(workspaceId).toArray(),
    database.sessions.where('workspaceId').equals(workspaceId).toArray(),
    database.sessionSegments.where('workspaceId').equals(workspaceId).toArray(),
    database.dailyFocus.where('workspaceId').equals(workspaceId).toArray(),
    database.weeklyFocus.where('workspaceId').equals(workspaceId).toArray(),
    database.inboxItems.where('workspaceId').equals(workspaceId).toArray(),
    database.notes.where('workspaceId').equals(workspaceId).toArray(),
    database.tags.where('workspaceId').equals(workspaceId).toArray(),
    database.customFieldDefinitions.where('workspaceId').equals(workspaceId).toArray(),
    database.customFieldValues.where('workspaceId').equals(workspaceId).toArray(),
    database.metricDefinitions.where('workspaceId').equals(workspaceId).toArray(),
    database.metricEntries.where('workspaceId').equals(workspaceId).toArray(),
    database.activityEvents.where('workspaceId').equals(workspaceId).toArray(),
    database.reviews.where('workspaceId').equals(workspaceId).toArray(),
    database.reviewRevisions.where('workspaceId').equals(workspaceId).toArray(),
    database.templates.where('workspaceId').equals(workspaceId).toArray(),
  ]);

  const backupData: WorkspaceBackupData = {
    version: 1,
    product: 'Tilo',
    exportedAt: new Date().toISOString(),
    workspace: workspace as unknown as WorkspaceBackupData['workspace'],
    goals: goals as unknown as Record<string, unknown>[],
    projects: projects as unknown as Record<string, unknown>[],
    milestones: milestones as unknown as Record<string, unknown>[],
    workflows: workflows as unknown as Record<string, unknown>[],
    workflowStatuses: workflowStatuses as unknown as Record<string, unknown>[],
    tasks: tasks as unknown as Record<string, unknown>[],
    plannedBlocks: plannedBlocks as unknown as Record<string, unknown>[],
    recurrenceSeries: recurrenceSeries as unknown as Record<string, unknown>[],
    sessions: sessions as unknown as Record<string, unknown>[],
    sessionSegments: sessionSegments as unknown as Record<string, unknown>[],
    dailyFocus: dailyFocus as unknown as Record<string, unknown>[],
    weeklyFocus: weeklyFocus as unknown as Record<string, unknown>[],
    inboxItems: inboxItems as unknown as Record<string, unknown>[],
    notes: notes as unknown as Record<string, unknown>[],
    tags: tags as unknown as Record<string, unknown>[],
    customFieldDefinitions: customFieldDefinitions as unknown as Record<string, unknown>[],
    customFieldValues: customFieldValues as unknown as Record<string, unknown>[],
    metricDefinitions: metricDefinitions as unknown as Record<string, unknown>[],
    metricEntries: metricEntries as unknown as Record<string, unknown>[],
    activityEvents: activityEvents as unknown as Record<string, unknown>[],
    reviews: reviews as unknown as Record<string, unknown>[],
    reviewRevisions: reviewRevisions as unknown as Record<string, unknown>[],
    templates: templates as unknown as Record<string, unknown>[],
  };

  return backupData;
}

/**
 * Validates and imports a workspace JSON backup safely via Dexie transaction.
 */
export async function importWorkspaceJSON(
  jsonTextOrObj: string | unknown,
  database: TiloDB = db
): Promise<{ success: boolean; workspace: Workspace }> {
  const parsedJson = typeof jsonTextOrObj === 'string' ? JSON.parse(jsonTextOrObj) : jsonTextOrObj;
  const validated = workspaceBackupSchema.parse(parsedJson);

  const workspace = validated.workspace as unknown as Workspace;

  await database.transaction(
    'rw',
    [
      database.workspaces,
      database.goals,
      database.projects,
      database.milestones,
      database.workflows,
      database.workflowStatuses,
      database.tasks,
      database.plannedBlocks,
      database.recurrenceSeries,
      database.sessions,
      database.sessionSegments,
      database.dailyFocus,
      database.weeklyFocus,
      database.inboxItems,
      database.notes,
      database.tags,
      database.customFieldDefinitions,
      database.customFieldValues,
      database.metricDefinitions,
      database.metricEntries,
      database.activityEvents,
      database.reviews,
      database.reviewRevisions,
      database.templates,
      database.syncTombstones,
    ],
    async () => {
      await Promise.all([
        // 恢复备份 = 以备份内容为准：清掉本地墓碑，否则旧删除记录会把刚恢复的数据再删一遍
        database.syncTombstones.clear(),
        database.workspaces.put(workspace),
        database.goals.bulkPut(validated.goals as never),
        database.projects.bulkPut(validated.projects as never),
        database.milestones.bulkPut(validated.milestones as never),
        database.workflows.bulkPut(validated.workflows as never),
        database.workflowStatuses.bulkPut(validated.workflowStatuses as never),
        database.tasks.bulkPut(validated.tasks as never),
        database.plannedBlocks.bulkPut(validated.plannedBlocks as never),
        database.recurrenceSeries.bulkPut(validated.recurrenceSeries as never),
        database.sessions.bulkPut(validated.sessions as never),
        database.sessionSegments.bulkPut(validated.sessionSegments as never),
        database.dailyFocus.bulkPut(validated.dailyFocus as never),
        database.weeklyFocus.bulkPut(validated.weeklyFocus as never),
        database.inboxItems.bulkPut(validated.inboxItems as never),
        database.notes.bulkPut(validated.notes as never),
        database.tags.bulkPut(validated.tags as never),
        database.customFieldDefinitions.bulkPut(validated.customFieldDefinitions as never),
        database.customFieldValues.bulkPut(validated.customFieldValues as never),
        database.metricDefinitions.bulkPut(validated.metricDefinitions as never),
        database.metricEntries.bulkPut(validated.metricEntries as never),
        database.activityEvents.bulkPut(validated.activityEvents as never),
        database.reviews.bulkPut(validated.reviews as never),
        database.reviewRevisions.bulkPut(validated.reviewRevisions as never),
        database.templates.bulkPut(validated.templates as never),
      ]);
    }
  );

  return { success: true, workspace };
}

export async function exportWorkspaceBackupJson(
  workspaceId: string = DEFAULT_WORKSPACE_ID,
  database: TiloDB = db
): Promise<string> {
  const data = await exportWorkspaceJSON(workspaceId, database);
  return JSON.stringify(data, null, 2);
}

export async function importWorkspaceBackupJson(
  jsonText: string,
  database: TiloDB = db
): Promise<{ success: boolean; error?: string }> {
  try {
    await importWorkspaceJSON(jsonText, database);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

