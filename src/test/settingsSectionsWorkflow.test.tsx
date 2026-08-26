import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TiloDB, ensureDefaultWorkspace } from '@/storage/db';
import { WorkflowSection } from '@/components/settings/WorkflowSection';
import { TemplatesSection } from '@/components/settings/TemplatesSection';
import { TodaySettingsSection } from '@/components/settings/TodaySettingsSection';
import { CalendarSettingsSection } from '@/components/settings/CalendarSettingsSection';
import { ensureWorkflowsInitialized } from '@/services/workflowCommands';
import { ensureTemplatesInitialized } from '@/services/templateCommands';

describe('Settings Workflow & Templates Sections', () => {
  let testDb: TiloDB;

  beforeEach(async () => {
    testDb = new TiloDB(`test_settings_wf_${Date.now()}_${Math.random()}`);
    await ensureDefaultWorkspace(testDb);
    await ensureWorkflowsInitialized(testDb);
    await ensureTemplatesInitialized(testDb);
  });

  afterEach(async () => {
    await testDb.delete();
  });

  it('renders WorkflowSection with task and project workflow subtabs', async () => {
    render(<WorkflowSection />);

    expect(screen.getByRole('button', { name: /任务工作流|Task Workflow/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /项目工作流|Project Workflow/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /自定义字段|Custom Fields/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /重排原因配置|Reschedule Reasons/ })).toBeInTheDocument();
  });

  it('renders TemplatesSection with task and reflection tabs', async () => {
    render(<TemplatesSection />);

    expect(screen.getByRole('button', { name: /任务模板 \(Task Templates\)|Task Templates/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /复盘反思模板 \(Review Reflections\)|Review Reflections/ })).toBeInTheDocument();
  });

  it('renders TodaySettingsSection and allows changing focus limit', () => {
    render(<TodaySettingsSection />);

    expect(screen.getByText(/每日聚焦 \(Daily Focus\) 数量上限|Daily Focus Limit/)).toBeInTheDocument();
    const btn5 = screen.getByText('5');
    fireEvent.click(btn5);
    expect(btn5).toHaveClass('bg-indigo-600');
  });

  it('renders CalendarSettingsSection and allows switching default view mode', () => {
    render(<CalendarSettingsSection />);

    expect(screen.getByText(/默认打开视图|Default View/)).toBeInTheDocument();
    const dayBtn = screen.getByRole('button', { name: /日 \(Day\)/ });
    fireEvent.click(dayBtn);
    expect(dayBtn).toBeInTheDocument();
  });
});
