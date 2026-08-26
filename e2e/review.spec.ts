import { test, expect } from '@playwright/test';

test.describe('Tilo Phase 9 Review Module E2E', () => {
  test('navigates to Review Hub, completes Daily Close wizard, and views sealed revision snapshot', async ({
    page,
  }) => {
    await page.goto('/review');

    // Verify Review Hub header
    await expect(page.locator('h2', { hasText: '复盘中心' })).toBeVisible();

    // Verify Daily Close and Weekly Review cards exist
    await expect(page.getByRole('heading', { name: /Daily Close|每日复盘/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Weekly Review|每周复盘/ })).toBeVisible();

    // Start Daily Close
    const dailyCloseBtn = page.getByRole('button', { name: /Daily Close|今日复盘/ }).first();
    await dailyCloseBtn.click();

    // Step 1: Leftovers
    await expect(page.getByRole('heading', { name: /Resolve Leftover Tasks|未竟待办/ })).toBeVisible();
    await page.getByRole('button', { name: /Next|下一步/ }).click();

    // Step 2: Reflect
    await expect(page.getByRole('heading', { name: /Daily Reflection|每日反思/ })).toBeVisible();
    await page.getByPlaceholder(/Shipped|高效/i).fill('Everything went smoothly.');
    await page.getByRole('button', { name: /Next|下一步/ }).click();

    // Step 3: Finalize
    await expect(page.getByRole('heading', { name: /Summary & Close Day|今日汇总与封存/ })).toBeVisible();
    await page.getByRole('button', { name: /Finalize & Close Day|完成复盘并结案今日/ }).click();

    // Toast notification and completed badge
    await expect(page.getByText(/Daily Close completed|今日复盘已完成/)).toBeVisible();

    // Verify revision item in list
    const revisionItem = page.locator('div.group').first();
    await expect(revisionItem).toBeVisible();

    // Click revision item to open Inspector
    await revisionItem.click();
    await expect(page.getByText(/Immutable Snapshot Payload|不可变快照/)).toBeVisible();
    await page.locator('button').filter({ hasText: /^Close$|^关闭$/ }).first().click();
  });
});
