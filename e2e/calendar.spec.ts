import { test, expect } from '@playwright/test';

test.describe('Tilo Phase 5 Calendar Module E2E', () => {
  test('switches calendar views (Day, Week, Agenda), toggles 5/7 days, and opens planning drawer', async ({
    page,
  }) => {
    await page.goto('/calendar');

    // View mode buttons
    const dayBtn = page.getByRole('button', { name: '日', exact: true });
    const weekBtn = page.getByRole('button', { name: '周', exact: true });
    const agendaBtn = page.getByRole('button', { name: '议程', exact: true });

    await expect(weekBtn).toBeVisible();

    // Switch to Day view
    await dayBtn.click();
    await expect(page.getByText('09:00', { exact: true }).first()).toBeVisible();

    // Switch to Agenda view
    await agendaBtn.click();
    await expect(agendaBtn).toBeVisible();

    // Switch back to Week view
    await weekBtn.click();
    const fiveDaysBtn = page.getByRole('button', { name: '5 天', exact: true });
    const sevenDaysBtn = page.getByRole('button', { name: '7 天', exact: true });

    await expect(sevenDaysBtn).toBeVisible();
    await fiveDaysBtn.click();

    // Toggle Planning drawer
    const planningBtn = page.getByRole('button', { name: '排期抽屉', exact: true });
    await expect(planningBtn).toBeVisible();

    // Open Plan Block modal
    const planBlockBtn = page.getByRole('button', { name: '新建时间块', exact: true });
    await planBlockBtn.click();

    await expect(page.getByRole('heading', { name: /时间块|Plan Time Block/ })).toBeVisible();
    await page.getByRole('button', { name: /取消|Cancel/ }).click();
  });
});
