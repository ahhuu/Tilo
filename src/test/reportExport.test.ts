import { describe, it, expect, beforeEach } from 'vitest';
import { TiloDB } from '@/storage/db';
import {
  generateWeeklyReviewMarkdown,
  generateSessionsTimesheetCSV,
  generateTasksAuditCSV,
} from '@/services/reportExportService';
import { seedDemoData } from '@/storage/seed';

describe('Report Export Service (Markdown & CSV)', () => {
  let testDb: TiloDB;

  beforeEach(async () => {
    testDb = new TiloDB(`test-export-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
    await seedDemoData(testDb);
  });

  it('generates a structured Markdown weekly review report', async () => {
    const md = await generateWeeklyReviewMarkdown(undefined, testDb);

    expect(md).toBeDefined();
    expect(md).toContain('# 📅 Tilo 每周执行与深度复盘周报');
    expect(md).toContain('战略目标推进进展');
    expect(md).toContain('本周已完成任务交付');
    expect(md).toContain('深度复盘与反思沉淀');
  });

  it('generates a valid CSV timesheet for sessions', async () => {
    const csv = await generateSessionsTimesheetCSV(testDb);

    expect(csv).toBeDefined();
    expect(csv).toContain('会话ID,日期,开始时间,结束时间,专注时长(分钟),任务名称,归属项目,关联目标,计时类型');
    const lines = csv.split('\n');
    expect(lines.length).toBeGreaterThan(1);
  });

  it('generates a valid CSV tasks register', async () => {
    const csv = await generateTasksAuditCSV(testDb);

    expect(csv).toBeDefined();
    expect(csv).toContain('任务ID,任务名称,状态,优先级,预估时间(分钟),排期执行日期,截止日期,归属项目,创建时间');
    const lines = csv.split('\n');
    expect(lines.length).toBeGreaterThan(1);
  });
});
