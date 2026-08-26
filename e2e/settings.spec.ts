import { test, expect } from '@playwright/test';

test.describe('Tilo Phase 10 Settings & Polish E2E', () => {
  test('navigates through Settings sections, toggles appearance and motion, and views shortcuts', async ({
    page,
  }) => {
    await page.goto('/settings');

    // Verify Settings header
    await expect(page.locator('h2', { hasText: '系统设置与工作区' })).toBeVisible();

    // 1. Appearance Section
    await expect(page.getByText('界面语言', { exact: true })).toBeVisible();
    await expect(page.getByText('界面主题')).toBeVisible();
    await page.getByRole('button', { name: '深色', exact: true }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    // 2. Motion Section
    await page.getByRole('button', { name: '动效令牌', exact: true }).click();
    await expect(page.getByText(/Motion & Animations|动效与动画令牌/)).toBeVisible();
    await page.getByRole('button', { name: /Subtle|微动效/ }).click();

    // 3. Time & Day Section
    await page.getByRole('button', { name: '时间与跨日分割', exact: true }).click();
    await expect(page.getByText(/Logical Day & Time Cutoffs|自然日与跨日时间分割点/)).toBeVisible();

    // 4. Workflow & Fields Section
    await page.getByRole('button', { name: '工作流与字段', exact: true }).click();
    await expect(page.getByRole('button', { name: /任务工作流 \(Task Workflow\)/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /项目工作流 \(Project Workflow\)/ })).toBeVisible();

    // 5. Templates & Prompts Section
    await page.getByRole('button', { name: '模板与提示', exact: true }).click();
    await expect(page.getByRole('button', { name: /任务模板 \(Task Templates\)/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /复盘反思模板 \(Review Reflections\)/ })).toBeVisible();

    // 6. Data & Backup Section
    await page.getByRole('button', { name: '数据备份与还原', exact: true }).click();
    await expect(page.getByText(/Local Data Backup & Portability|本地数据备份与迁移/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Download Backup|下载备份文件/ })).toBeVisible();

    // 7. Shortcuts Section
    await page.getByRole('button', { name: '快捷键速查', exact: true }).click();
    await expect(page.getByText(/Keyboard Shortcuts|键盘快捷键速查/)).toBeVisible();
    await expect(page.getByText(/Open Command Palette|打开快捷命令面板/)).toBeVisible();
  });
});
