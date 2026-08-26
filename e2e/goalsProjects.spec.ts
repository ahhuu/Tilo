import { test, expect } from '@playwright/test';

test.describe('Tilo Phase 7 Goals & Projects E2E', () => {
  test('creates a new goal, navigates to project, and manages milestones', async ({ page }) => {
    await page.goto('/goals');

    // Verify Goals page header
    await expect(page.locator('h2', { hasText: '战略目标与项目' })).toBeVisible();

    // Open New Goal modal
    const newGoalBtn = page.getByRole('button', { name: /新建目标|New Goal/ });
    await newGoalBtn.click();

    const titleInput = page.getByPlaceholder(/例如|Ship Product/i);
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Master Advanced Automation');
    await page.getByRole('button', { name: /创建目标|Create Goal/ }).click();

    // Verify newly created goal is in grid
    await expect(page.getByRole('heading', { name: 'Master Advanced Automation' })).toBeVisible();

    // Navigate to seeded project page
    await page.goto('/projects/proj-seed-1');

    // Verify Project title
    await expect(page.getByRole('heading', { name: 'Product Launch' })).toBeVisible();

    // Verify Primary Goal pill is visible
    await expect(page.getByText(/Primary Goal:|核心目标:/)).toBeVisible();

    // Add milestone in project
    const addMilestoneBtn = page.getByRole('button', { name: /Add Milestone|添加里程碑/ });
    await addMilestoneBtn.click();

    await page.getByPlaceholder(/Milestone title|里程碑标题/).fill('Phase 7 Verification Complete');
    await page.locator('form').getByRole('button', { name: /Add|添加/ }).click();

    await expect(page.getByText('Phase 7 Verification Complete')).toBeVisible();
  });
});
