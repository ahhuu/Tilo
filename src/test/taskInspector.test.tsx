import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TiloDB, ensureDefaultWorkspace } from '@/storage/db';
import { createTask } from '@/services/taskCommands';
import { TaskInspector } from '@/components/task/TaskInspector';
import { TooltipProvider } from '@/components/ui/Tooltip';

describe('TaskInspector Component', () => {
  let testDb: TiloDB;

  beforeEach(async () => {
    testDb = new TiloDB(`test-inspector-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`);
    await ensureDefaultWorkspace(testDb);
  });

  afterEach(async () => {
    await testDb.delete();
  });

  it('renders task details and updates title on blur', async () => {
    const task = await createTask({ title: 'Original Task Title', priority: 'high' }, testDb);

    render(
      <TooltipProvider>
        <TaskInspector taskId={task.id} database={testDb} />
      </TooltipProvider>
    );

    const titleInput = await screen.findByDisplayValue('Original Task Title');
    expect(titleInput).toBeInTheDocument();

    fireEvent.change(titleInput, { target: { value: 'Updated Task Title' } });
    fireEvent.blur(titleInput);

    await waitFor(async () => {
      const updated = await testDb.tasks.get(task.id);
      expect(updated?.title).toBe('Updated Task Title');
    });
  });
});
