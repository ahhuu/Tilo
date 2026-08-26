import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TiloDB, ensureDefaultWorkspace } from '@/storage/db';
import { createTask } from '@/services/taskCommands';
import { DailyFocusSection } from '@/components/today/DailyFocusSection';
import { FocusFullModal } from '@/components/today/FocusFullModal';
import { NextUpCard } from '@/components/today/NextUpCard';
import type { Task } from '@/core/types/domain';

describe('Today Focus & Next Up Components', () => {
  let testDb: TiloDB;

  beforeEach(async () => {
    testDb = new TiloDB(`test-focus-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`);
    await ensureDefaultWorkspace(testDb);
  });

  afterEach(async () => {
    await testDb.delete();
  });

  it('renders ranked daily focus tasks with #1, #2, #3 badges', async () => {
    const task1 = await createTask({ title: 'Focus Item 1', priority: 'urgent' }, testDb);
    const task2 = await createTask({ title: 'Focus Item 2', priority: 'high' }, testDb);

    const focusTasks: Task[] = [task1, task2];
    const projectMap = new Map();

    render(
      <DailyFocusSection
        focusTasks={focusTasks}
        projectMap={projectMap}
        onReorder={async () => {}}
        onInspect={() => {}}
        onToggleComplete={() => {}}
        onStartSession={() => {}}
        onRemoveFromFocus={() => {}}
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Focus Item 1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Focus Item 2')).toBeInTheDocument();
  });

  it('triggers FocusFullModal replace flow when focus limit is reached', async () => {
    const task1 = await createTask({ title: 'Focus 1' }, testDb);
    const task2 = await createTask({ title: 'Focus 2' }, testDb);
    const task3 = await createTask({ title: 'Focus 3' }, testDb);
    const incomingTask = await createTask({ title: 'Incoming Priority Task' }, testDb);

    let replacedId: string | null = null;

    render(
      <FocusFullModal
        currentFocusTasks={[task1, task2, task3]}
        newTaskToPromote={incomingTask}
        onReplace={async (id) => {
          replacedId = id;
        }}
        onClose={() => {}}
      />
    );

    expect(screen.getByText(/已达到今日聚焦上限|Daily Focus Limit Reached/)).toBeInTheDocument();
    expect(screen.getByText('Incoming Priority Task')).toBeInTheDocument();

    const replaceButtons = screen.getAllByText(/替换并移出|Replace →/);
    expect(replaceButtons.length).toBe(3);

    fireEvent.click(replaceButtons[0]);
    expect(replacedId).toBe(task1.id);
  });

  it('renders single prominent Next Up card with 1-click start session', async () => {
    const task = await createTask({ title: 'Urgent Launch Item', priority: 'urgent' }, testDb);
    let sessionStarted = false;

    render(
      <NextUpCard
        task={task}
        onStartSession={() => {
          sessionStarted = true;
        }}
        onInspect={() => {}}
        onComplete={() => {}}
      />
    );

    expect(screen.getByText(/下一项建议|Next Up/)).toBeInTheDocument();
    expect(screen.getByText('Urgent Launch Item')).toBeInTheDocument();

    const startBtn = screen.getByRole('button', { name: /开始专注|Start Session/ });
    fireEvent.click(startBtn);
    expect(sessionStarted).toBe(true);
  });
});
