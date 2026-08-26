import { test, expect } from '@playwright/test';

test.describe('Tilo Phase 6 Inbox & Capture E2E', () => {
  test('navigates to Inbox, captures an item, opens ConvertToTask modal, and tests batch bar', async ({
    page,
  }) => {
    await page.goto('/inbox');

    // Verify Inbox header
    await expect(page.locator('h2', { hasText: '收集箱' })).toBeVisible();

    // Verify Unsorted tab is active
    await expect(page.getByRole('button', { name: /待整理/ })).toBeVisible();

    // Verify item list has seeded items
    const linkItem = page.getByText(/https:\/\/dexie.org/);
    await expect(linkItem).toBeVisible();

    // Hover over item and click "Task" convert button
    const firstRow = page.locator('div.group').filter({ hasText: 'https://dexie.org' }).first();
    await firstRow.hover();

    const taskConvertBtn = firstRow.getByRole('button', { name: /Task|任务/, exact: true });
    await taskConvertBtn.click();

    // Convert to Task modal should be visible
    const modalHeading = page.getByRole('heading', { name: /转化为待办任务|转为任务|Convert to Task/ });
    await expect(modalHeading).toBeVisible();
    await page.getByRole('button', { name: /取消|Cancel/ }).click();

    // Test Multi-select checkbox
    const checkbox = firstRow.getByRole('checkbox');
    await checkbox.click();

    // Batch bar should appear at bottom
    await expect(page.getByText(/1 item selected|已选中 1 项/)).toBeVisible();
    const batchBar = page.getByText(/1 item selected|已选中 1 项/).locator('..');
    await expect(batchBar.getByRole('button', { name: /Archive|归档/, exact: true })).toBeVisible();
  });
});
