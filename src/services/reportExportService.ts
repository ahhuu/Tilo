import { db, type TiloDB } from '@/storage/db';
import { timeService } from '@/core/time/timeService';
import { nativeService } from '@/services/nativeService';
import type { Review, ReviewRevision, Task } from '@/core/types/domain';

/**
 * Trigger browser file download for text/csv/markdown content.
 * 原生端（Android/iOS）WebView 下载目录对用户不可见，改为走系统分享面板。
 */
export function downloadFile(filename: string, content: string, mimeType: string): void {
  if (typeof window === 'undefined') return;

  if (nativeService.isNative()) {
    nativeService.shareText(filename, content);
    return;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates a structured Markdown Weekly Review Report
 */
export async function generateWeeklyReviewMarkdown(
  reviewId?: string,
  database: TiloDB = db
): Promise<string> {
  const currentWeekKey = timeService.getWeekKey();
  let review: Review | undefined;

  if (reviewId) {
    review = await database.reviews.get(reviewId);
  } else {
    review = await database.reviews
      .where('type')
      .equals('weekly')
      .filter((r) => r.periodKey === currentWeekKey)
      .first();
  }

  const weekKey = review ? review.periodKey : currentWeekKey;

  // Query latest revision if available
  let latestRevision: ReviewRevision | undefined;
  if (review && review.currentRevision > 0) {
    latestRevision = await database.reviewRevisions
      .where('reviewId')
      .equals(review.id)
      .reverse()
      .sortBy('revisionNumber')
      .then((revs) => revs[0]);
  }

  const projects = await database.projects.toArray();
  const goals = await database.goals.toArray();
  const allTasks = await database.tasks.toArray();
  const allSessions = await database.sessions.toArray();

  const projectMap = new Map(projects.map((p) => [p.id, p]));

  // Completed tasks in this period
  const completedTasks = allTasks.filter((t) => t.statusId === 'ws-task-done' && !t.deletedAt);

  // Group completed tasks by project
  const tasksByProject: Record<string, Task[]> = {};
  completedTasks.forEach((t) => {
    const pName = t.projectId ? projectMap.get(t.projectId)?.name || '未归属项目' : '个人事务';
    if (!tasksByProject[pName]) tasksByProject[pName] = [];
    tasksByProject[pName].push(t);
  });

  // Calculate total focus minutes
  const totalSeconds = allSessions.reduce((sum, s) => sum + (s.activeDurationSeconds || s.elapsedDurationSeconds || 0), 0);
  const totalMinutes = Math.round(totalSeconds / 60);
  const totalHours = (totalMinutes / 60).toFixed(1);

  // Build Markdown Document
  let md = `# 📅 Tilo 每周执行与深度复盘周报 (Week ${weekKey})\n\n`;
  md += `> **生成时间**：${timeService.formatDateHeader(timeService.getLogicalDate())}  \n`;
  md += `> **总专注工时**：**${totalHours} 小时** (${totalMinutes} 分钟) | **累计打卡**：${allSessions.length} 次会话  \n`;
  md += `> **完成交付待办**：**${completedTasks.length} 项任务**  \n\n`;
  md += `---\n\n`;

  // 1. Strategic Goals Section
  md += `## 🎯 战略目标推进进展 (Goals & OKR)\n\n`;
  if (goals.length > 0) {
    goals.forEach((g) => {
      const progress = `${g.currentProgress || 0}${g.targetProgress ? ` / ${g.targetProgress}` : '%'}`;
      md += `- **${g.title}**：进度 \`${progress}\` [${g.status === 'active' ? '进行中' : g.status === 'completed' ? '已达成' : g.status}]\n`;
    });
  } else {
    md += `*暂未设定目标*\n`;
  }
  md += `\n---\n\n`;

  // 2. Completed Tasks by Project
  md += `## ✅ 本周已完成任务交付 (Completed Tasks by Project)\n\n`;
  const projectNames = Object.keys(tasksByProject);
  if (projectNames.length > 0) {
    projectNames.forEach((pName) => {
      md += `### 📁 ${pName}\n`;
      tasksByProject[pName].forEach((t) => {
        const est = t.estimateMinutes ? ` *(预估 ${t.estimateMinutes}m)*` : '';
        md += `- [x] ${t.title}${est}\n`;
      });
      md += `\n`;
    });
  } else {
    md += `*暂无完成任务记录*\n\n`;
  }
  md += `---\n\n`;

  // 3. Reflection Prompts QA
  md += `## 💭 深度复盘与反思沉淀 (Reflection & Learnings)\n\n`;
  if (latestRevision && latestRevision.reflectionJson) {
    const rawAnswers = (latestRevision.reflectionJson as { promptAnswers?: Record<string, string> })?.promptAnswers;
    if (rawAnswers && Object.keys(rawAnswers).length > 0) {
      Object.entries(rawAnswers).forEach(([q, a], idx) => {
        md += `#### **Q${idx + 1}: ${q}**\n\n`;
        md += `${a ? a : '*未填写*'}\n\n`;
      });
    } else {
      md += `*本周未记录问答反思*\n\n`;
    }
  } else {
    md += `*本周期尚未完成复盘封存*\n\n`;
  }

  md += `---\n\n`;
  md += `*由 Tilo 本地优先生产力系统自动生成导出* 🚀\n`;

  return md;
}

/**
 * Exports Sessions as CSV Timesheet
 */
export async function generateSessionsTimesheetCSV(database: TiloDB = db): Promise<string> {
  const sessions = await database.sessions.orderBy('startedAt').reverse().toArray();
  const tasks = await database.tasks.toArray();
  const projects = await database.projects.toArray();
  const goals = await database.goals.toArray();

  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const goalMap = new Map(goals.map((g) => [g.id, g]));

  const headers = [
    '会话ID',
    '日期',
    '开始时间',
    '结束时间',
    '专注时长(分钟)',
    '任务名称',
    '归属项目',
    '关联目标',
    '计时类型',
  ];

  const rows = sessions.map((s) => {
    const dateStr = timeService.getLogicalDate(s.startedAt);
    const startTimeStr = timeService.formatTime(s.startedAt);
    const endTimeStr = s.endedAt ? timeService.formatTime(s.endedAt) : '-';
    const task = s.taskId ? taskMap.get(s.taskId) : undefined;
    const project = (s.projectId ? projectMap.get(s.projectId) : undefined) || (task?.projectId ? projectMap.get(task.projectId) : undefined);
    const goal = project?.primaryGoalId ? goalMap.get(project.primaryGoalId) : undefined;

    const durationMin = Math.round((s.activeDurationSeconds || s.elapsedDurationSeconds || 0) / 60);
    const taskTitle = task?.title || s.title || '未命名会话';
    const projectName = project?.name || '无归属项目';
    const goalTitle = goal?.title || '无关联目标';
    const kind = s.kind === 'active' ? '主动专注' : '后台打卡';

    return [
      `"${s.id}"`,
      `"${dateStr}"`,
      `"${startTimeStr}"`,
      `"${endTimeStr}"`,
      durationMin,
      `"${taskTitle.replace(/"/g, '""')}"`,
      `"${projectName.replace(/"/g, '""')}"`,
      `"${goalTitle.replace(/"/g, '""')}"`,
      `"${kind}"`,
    ].join(',');
  });

  return '\uFEFF' + [headers.join(','), ...rows].join('\n');
}

/**
 * Exports all Tasks as Audit CSV Register
 */
export async function generateTasksAuditCSV(database: TiloDB = db): Promise<string> {
  const tasks = await database.tasks.filter((t) => !t.deletedAt).toArray();
  const projects = await database.projects.toArray();
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const headers = [
    '任务ID',
    '任务名称',
    '状态',
    '优先级',
    '预估时间(分钟)',
    '排期执行日期',
    '截止日期',
    '归属项目',
    '创建时间',
  ];

  const rows = tasks.map((t) => {
    const projectName = t.projectId ? projectMap.get(t.projectId)?.name || '未归属' : '无';
    const status = t.statusId === 'ws-task-done' ? '已完成' : t.statusId === 'ws-task-in-progress' ? '进行中' : '待办';
    const priority = t.priority === 'urgent' ? '紧急' : t.priority === 'high' ? '高' : t.priority === 'medium' ? '中' : '低';
    const createdAtStr = timeService.formatDateHeader(timeService.getLogicalDate(t.createdAt));

    return [
      `"${t.id}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${status}"`,
      `"${priority}"`,
      t.estimateMinutes || 0,
      `"${t.scheduledDate || '-'}"`,
      `"${t.dueDate || '-'}"`,
      `"${projectName.replace(/"/g, '""')}"`,
      `"${createdAtStr}"`,
    ].join(',');
  });

  return '\uFEFF' + [headers.join(','), ...rows].join('\n');
}
