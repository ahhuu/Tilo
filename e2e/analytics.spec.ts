import { test, expect } from '@playwright/test';

test.describe('Tilo Phase 8 Analytics Module E2E', () => {
  test('renders Analytics dashboard, switches period tabs, and verifies metrics and charts', async ({
    page,
  }) => {
    await page.goto('/analytics');

    // Verify Analytics page header
    await expect(page.getByRole('heading', { level: 2, name: /统计分析/ })).toBeVisible();

    // Verify Metric Cards exist
    await expect(page.getByText('活跃专注时长')).toBeVisible();
    await expect(page.getByText('排期总时长')).toBeVisible();
    await expect(page.getByText('时间达成率')).toBeVisible();
    await expect(page.getByText('任务完成率')).toBeVisible();

    // Verify Daily Rhythm chart title
    await expect(page.getByText(/每日计划 vs 实际专注|Daily Execution Rhythm/)).toBeVisible();

    // Switch period to This Month
    const thisMonthBtn = page.getByRole('button', { name: '本月', exact: true });
    await thisMonthBtn.click();

    // Switch period to Last Week
    const lastWeekBtn = page.getByRole('button', { name: '上周', exact: true });
    await lastWeekBtn.click();
    await expect(lastWeekBtn).toBeVisible();
  });
});
