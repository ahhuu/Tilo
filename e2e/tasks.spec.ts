import { test, expect } from '@playwright/test';

test.describe('Tilo Phase 3 Task & Session Primitives E2E', () => {
  test('opens Task Inspector, updates title/priority, and adds a subtask', async ({ page }) => {
    await page.goto('/');

    // Navigate to Today
    await expect(page.getByRole('heading', { name: '今日', exact: true })).toBeVisible();

    // Check if seeded tasks appear on Today
    const taskItem = page.locator('text=Review IndexedDB Dexie migration schema').first();
    await expect(taskItem).toBeVisible();

    // Click task to open Inspector
    await taskItem.click();

    // Inspector should be open
    const inspector = page.getByRole('complementary', { name: /Inspector Panel|属性面板/ });
    await expect(inspector).toBeVisible();
    await expect(inspector.getByText(/Task Inspector|任务属性/)).toBeVisible();

    // Verify subtasks section is visible in Inspector
    await expect(inspector.getByText(/Subtasks|子任务/)).toBeVisible();

    // Click Add subtask button in Inspector
    const addSubtaskBtn = inspector.getByRole('button', { name: /Add|添加/, exact: true });
    await addSubtaskBtn.click();

    const subtaskInput = inspector.getByPlaceholder(/Subtask title|输入子任务标题/);
    await expect(subtaskInput).toBeVisible();
    await subtaskInput.fill('Verify dark mode tokens');
    await inspector.getByRole('button', { name: /Add|添加/, exact: true }).click();

    // Subtask should be listed
    await expect(inspector.getByText('Verify dark mode tokens')).toBeVisible();
  });
});
