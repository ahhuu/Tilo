import type { Task, Project, PlannedBlock } from '@/core/types/domain';

export interface NextUpCandidate {
  task: Task;
  project?: Project;
  score: number;
  reason?: string;
}

/**
 * Computes ranked Next Up candidates based on due date, scheduled date, planned blocks, and priority.
 */
export function computeNextUpCandidates(
  allTasks: Task[],
  dailyFocusTaskIds: Set<string>,
  projectMap: Map<string, Project>,
  logicalDate: string,
  plannedBlocks: PlannedBlock[] = [],
  limit: number = 4
): NextUpCandidate[] {
  const uncompletedCandidates = allTasks.filter(
    (t) =>
      !t.deletedAt &&
      !t.parentTaskId &&
      t.statusId !== 'ws-task-done' &&
      !dailyFocusTaskIds.has(t.id)
  );

  const plannedTaskIdsToday = new Set(
    plannedBlocks
      .filter((b) => {
        const blockDate = new Date(b.startAt).toISOString().split('T')[0];
        return blockDate === logicalDate;
      })
      .map((b) => b.taskId)
      .filter(Boolean)
  );

  const scored: NextUpCandidate[] = uncompletedCandidates.map((task) => {
    let score = 0;
    let reason = '';

    // 1. Due Date scoring
    if (task.dueDate) {
      if (task.dueDate < logicalDate) {
        score += 120;
        reason = 'Overdue';
      } else if (task.dueDate === logicalDate) {
        score += 100;
        reason = 'Due today';
      } else {
        const daysDiff =
          (new Date(task.dueDate).getTime() - new Date(logicalDate).getTime()) / (1000 * 3600 * 24);
        if (daysDiff <= 3 && daysDiff > 0) {
          score += 50;
          reason = `Due in ${Math.ceil(daysDiff)}d`;
        }
      }
    }

    // 2. Scheduled Date scoring
    if (task.scheduledDate === logicalDate) {
      score += 90;
      if (!reason) reason = 'Scheduled today';
    }

    // 3. Planned block for today
    if (plannedTaskIdsToday.has(task.id)) {
      score += 30;
      if (!reason) reason = 'Planned today';
    }

    // 4. Priority weighting
    switch (task.priority) {
      case 'urgent':
        score += 40;
        break;
      case 'high':
        score += 30;
        break;
      case 'medium':
        score += 20;
        break;
      case 'low':
        score += 10;
        break;
      default:
        break;
    }

    return {
      task,
      project: task.projectId ? projectMap.get(task.projectId) : undefined,
      score,
      reason,
    };
  });

  // Sort descending by score, tiebreaker by creation time (most recent first)
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.task.createdAt - a.task.createdAt;
  });

  return scored.slice(0, limit);
}
