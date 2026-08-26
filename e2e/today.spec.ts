import { test, expect } from '@playwright/test';

test.describe('Tilo Phase 4 Today View E2E', () => {
  test('switches between Split, List, and Timeline views and interacts with Focus & Next Up', async ({
    page,
  }) => {
    await page.goto('/');

    // Verify Today Page header
    await expect(page.getByRole('heading', { name: '今日', exact: true })).toBeVisible();

    // Verify Split view (default)
    const listBtn = page.getByRole('button', { name: '清单视图', exact: true });
    const timelineBtn = page.getByRole('button', { name: '时间轴视图', exact: true });
    const splitBtn = page.getByRole('button', { name: '分栏对照', exact: true });

    await expect(splitBtn).toBeVisible();

    // Switch to List view
    await listBtn.click();
    await expect(page.getByText(/全部 \(Plan\+Actual\)|Plan\+Actual/)).toBeHidden();

    // Switch to Timeline view
    await timelineBtn.click();
    await expect(page.getByText(/全部 \(Plan\+Actual\)|Plan\+Actual/)).toBeVisible();

    // Switch back to Split view
    await splitBtn.click();
    await expect(page.getByText(/全部 \(Plan\+Actual\)|Plan\+Actual/)).toBeVisible();

    // Verify Next Up card is visible
    await expect(page.getByText(/下一项建议|Next Up/)).toBeVisible();

    // Verify Daily Focus section
    await expect(page.getByText(/今日聚焦|Daily Focus/)).toBeVisible();
  });
});
