import { db, type TiloDB } from '@/storage/db';

export interface RoadmapMilestoneItem {
  id: string;
  name: string;
  targetDate?: string; // YYYY-MM-DD
  status: 'planned' | 'active' | 'completed' | 'cancelled';
}

export interface RoadmapProjectItem {
  id: string;
  name: string;
  color?: string;
  status: string;
  totalTasks: number;
  completedTasks: number;
  progressPercentage: number;
  milestones: RoadmapMilestoneItem[];
}

export interface RoadmapGoalItem {
  id: string;
  title: string;
  targetDate?: string;
  color?: string;
  status: string;
  progressPercentage: number;
  projects: RoadmapProjectItem[];
}

export interface RoadmapDataResult {
  goals: RoadmapGoalItem[];
  standaloneProjects: RoadmapProjectItem[];
  earliestDate: string;
  latestDate: string;
}

/**
 * Aggregates all goals, projects, milestones and task completions for Gantt roadmap rendering.
 */
export async function getRoadmapData(database: TiloDB = db): Promise<RoadmapDataResult> {
  const [goals, projects, milestones, tasks] = await Promise.all([
    database.goals.filter((g) => !g.deletedAt).toArray(),
    database.projects.filter((p) => !p.deletedAt).toArray(),
    database.milestones.filter((m) => !m.deletedAt).toArray(),
    database.tasks.filter((t) => !t.deletedAt).toArray(),
  ]);

  // Map tasks to projects
  const projectTasksMap = new Map<string, { total: number; done: number }>();
  for (const t of tasks) {
    if (!t.projectId) continue;
    const existing = projectTasksMap.get(t.projectId) || { total: 0, done: 0 };
    existing.total++;
    if (t.statusId === 'done' || t.statusId === 'ws-task-done') {
      existing.done++;
    }
    projectTasksMap.set(t.projectId, existing);
  }

  // Map milestones to projects
  const projectMilestonesMap = new Map<string, RoadmapMilestoneItem[]>();
  for (const m of milestones) {
    const list = projectMilestonesMap.get(m.projectId) || [];
    list.push({
      id: m.id,
      name: m.title,
      targetDate: m.targetDate,
      status: m.status,
    });
    projectMilestonesMap.set(m.projectId, list);
  }

  let earliest = '2099-12-31';
  let latest = '1970-01-01';

  const updateDateBounds = (d?: string) => {
    if (!d) return;
    if (d < earliest) earliest = d;
    if (d > latest) latest = d;
  };

  const projectItemsMap = new Map<string, RoadmapProjectItem>();

  for (const p of projects) {
    const taskStats = projectTasksMap.get(p.id) || { total: 0, done: 0 };
    const pMilestones = projectMilestonesMap.get(p.id) || [];
    const progress = taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0;

    pMilestones.forEach((m) => updateDateBounds(m.targetDate));

    projectItemsMap.set(p.id, {
      id: p.id,
      name: p.name,
      color: p.color,
      status: p.status,
      totalTasks: taskStats.total,
      completedTasks: taskStats.done,
      progressPercentage: progress,
      milestones: pMilestones,
    });
  }

  // Map projects to goals
  const goalItems: RoadmapGoalItem[] = [];
  const assignedProjectIds = new Set<string>();

  for (const g of goals) {
    updateDateBounds(g.targetDate);
    const gProjects: RoadmapProjectItem[] = [];

    for (const p of projects) {
      if (p.primaryGoalId === g.id || (p.relatedGoalIds && p.relatedGoalIds.includes(g.id))) {
        const item = projectItemsMap.get(p.id);
        if (item) {
          gProjects.push(item);
          assignedProjectIds.add(p.id);
        }
      }
    }

    const totalGoalProgress =
      gProjects.length > 0
        ? Math.round(gProjects.reduce((acc, curr) => acc + curr.progressPercentage, 0) / gProjects.length)
        : 0;

    goalItems.push({
      id: g.id,
      title: g.title,
      targetDate: g.targetDate,
      color: g.color,
      status: g.status,
      progressPercentage: totalGoalProgress,
      projects: gProjects,
    });
  }

  // Standalone projects (without a Goal)
  const standaloneProjects: RoadmapProjectItem[] = [];
  for (const p of projects) {
    if (!assignedProjectIds.has(p.id)) {
      const item = projectItemsMap.get(p.id);
      if (item) standaloneProjects.push(item);
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  if (earliest === '2099-12-31') earliest = todayStr;
  if (latest === '1970-01-01') latest = todayStr;

  return {
    goals: goalItems,
    standaloneProjects,
    earliestDate: earliest,
    latestDate: latest,
  };
}
