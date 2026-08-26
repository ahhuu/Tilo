import { test, expect } from '@playwright/test';

test.describe('Tilo Phase 1 Foundation E2E', () => {
  test('renders branding, title, and navigates between primary routes', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Tilo/);

    // Initial page should redirect to Today
    await expect(page.getByRole('heading', { level: 1, name: '今日' })).toBeVisible();

    // Navigate to Inbox
    await page.getByRole('link', { name: '收集箱' }).click();
    await expect(page.getByRole('heading', { level: 1, name: '收集箱' })).toBeVisible();

    // Navigate to Settings
    await page.getByRole('link', { name: '系统设置' }).click();
    await expect(page.getByRole('heading', { level: 1, name: '系统设置' })).toBeVisible();
  });

  test('opens and navigates via Command Menu (Ctrl+K or Search trigger)', async ({ page }) => {
    await page.goto('/');

    // Click search trigger in header
    await page.getByRole('button', { name: /搜索/i }).click();
    const commandInput = page.getByPlaceholder(/搜索任务/);
    await expect(commandInput).toBeVisible();

    // Type 目标 and select command
    await commandInput.fill('目标');
    await page.keyboard.press('Enter');

    // Should navigate to Goals URL
    await page.waitForURL('**/goals');
    await expect(page.getByRole('heading', { level: 1, name: '目标与项目' })).toBeVisible();
  });

  test('toggles sidebar collapse using [ shortcut', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.getByRole('complementary', { name: 'Sidebar Navigation' });
    await expect(sidebar).toHaveClass(/w-56/);

    // Press '['
    await page.keyboard.press('[');
    await expect(sidebar).toHaveClass(/w-14/);

    // Press '[' again to expand
    await page.keyboard.press('[');
    await expect(sidebar).toHaveClass(/w-56/);
  });
});
