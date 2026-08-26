import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TiloDB, ensureDefaultWorkspace } from '@/storage/db';
import { createTask } from '@/services/taskCommands';
import { SidePlanningDrawer } from '@/components/calendar/SidePlanningDrawer';
import type { Task } from '@/core/types/domain';

describe('SidePlanningDrawer Component', () => {
  let testDb: TiloDB;

  beforeEach(async () => {
    testDb = new TiloDB(`test-drawer-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`);
    await ensureDefaultWorkspace(testDb);
  });

  afterEach(async () => {
    await testDb.delete();
  });

  it('renders unscheduled tasks and handles search filter', async () => {
    const task1 = await createTask({ title: 'Unscheduled Alpha' }, testDb);
    const task2 = await createTask({ title: 'Scheduled Beta', scheduledDate: '2026-08-21' }, testDb);

    const tasks: Task[] = [task1, task2];
    const projectMap = new Map();

    render(
      <SidePlanningDrawer
        tasks={tasks}
        projectMap={projectMap}
        onClose={() => {}}
        onInspectTask={() => {}}
        onPlanTask={() => {}}
      />
    );

    // Unscheduled Alpha should be visible by default
    expect(screen.getByText('Unscheduled Alpha')).toBeInTheDocument();
    // Scheduled Beta should be hidden in unscheduled tab
    expect(screen.queryByText('Scheduled Beta')).not.toBeInTheDocument();

    // Switch to All Pending tab
    const allTabBtn = screen.getByRole('button', { name: /全部待办|All Pending/ });
    fireEvent.click(allTabBtn);
    expect(screen.getByText('Scheduled Beta')).toBeInTheDocument();
  });
});
