import { db, DEFAULT_WORKSPACE_ID, type TiloDB } from '@/storage/db';
import type { Project, Milestone, ActivityEvent } from '@/core/types/domain';

export interface CreateProjectInput {
  name: string;
  description?: string;
  color: string;
  primaryGoalId?: string;
  relatedGoalIds?: string[];
  isPinned?: boolean;
  workspaceId?: string;
}

export async function createProject(
  input: CreateProjectInput,
  database: TiloDB = db
): Promise<Project> {
  const workspaceId = input.workspaceId || DEFAULT_WORKSPACE_ID;
  const now = Date.now();
  const projectId = `proj-${now}-${Math.random().toString(36).substr(2, 9)}`;

  const existingCount = await database.projects.where('workspaceId').equals(workspaceId).count();

  const project: Project = {
    id: projectId,
    workspaceId,
    name: input.name.trim(),
    description: input.description,
    color: input.color,
    primaryGoalId: input.primaryGoalId,
    relatedGoalIds: input.relatedGoalIds || [],
    status: 'active',
    isPinned: input.isPinned ?? false,
    order: existingCount,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  const event: ActivityEvent = {
    id: `ev-${now}-${Math.random().toString(36).substr(2, 9)}`,
    workspaceId,
    entityType: 'project',
    entityId: projectId,
    eventType: 'PROJECT_CREATED',
    occurredAt: now,
    actor: 'user',
    payloadJson: { name: project.name, color: project.color },
  };

  await database.transaction('rw', [database.projects, database.activityEvents], async () => {
    await database.projects.put(project);
    await database.activityEvents.put(event);
  });

  return project;
}

export async function updateProject(
  projectId: string,
  updates: Partial<Omit<Project, 'id' | 'workspaceId' | 'createdAt'>>,
  database: TiloDB = db
): Promise<Project> {
  const now = Date.now();
  const project = await database.projects.get(projectId);
  if (!project) throw new Error(`Project ${projectId} not found`);

  const updated: Project = { ...project, ...updates, updatedAt: now };

  const event: ActivityEvent = {
    id: `ev-${now}-${Math.random().toString(36).substr(2, 9)}`,
    workspaceId: project.workspaceId,
    entityType: 'project',
    entityId: projectId,
    eventType: 'PROJECT_UPDATED',
    occurredAt: now,
    actor: 'user',
    payloadJson: { updates },
  };

  await database.transaction('rw', [database.projects, database.activityEvents], async () => {
    await database.projects.put(updated);
    await database.activityEvents.put(event);
  });

  return updated;
}

export async function createMilestone(
  projectId: string,
  title: string,
  targetDate?: string,
  database: TiloDB = db
): Promise<Milestone> {
  const project = await database.projects.get(projectId);
  if (!project) throw new Error(`Project ${projectId} not found`);

  const now = Date.now();
  const milestoneId = `ms-${now}-${Math.random().toString(36).substr(2, 9)}`;
  const order = await database.milestones.where('[workspaceId+projectId]').equals([project.workspaceId, projectId]).count();

  const milestone: Milestone = {
    id: milestoneId,
    workspaceId: project.workspaceId,
    projectId,
    title: title.trim(),
    status: 'planned',
    targetDate,
    order,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  await database.milestones.put(milestone);
  return milestone;
}

/**
 * Soft deletes a Project and logs activity event.
 */
export async function deleteProject(
  projectId: string,
  database: TiloDB = db
): Promise<void> {
  const now = Date.now();
  const project = await database.projects.get(projectId);
  if (!project) return;

  const event: ActivityEvent = {
    id: `ev-${now}-${Math.random().toString(36).substr(2, 9)}`,
    workspaceId: project.workspaceId,
    entityType: 'project',
    entityId: projectId,
    eventType: 'PROJECT_DELETED',
    occurredAt: now,
    actor: 'user',
    payloadJson: { name: project.name },
  };

  await database.transaction('rw', [database.projects, database.activityEvents], async () => {
    await database.projects.update(projectId, { deletedAt: now, updatedAt: now });
    await database.activityEvents.put(event);
  });
}

