import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TiloDB, ensureDefaultWorkspace } from '@/storage/db';
import { exportWorkspaceJSON, importWorkspaceJSON } from '@/services/exportImportService';
import { createTask } from '@/services/taskCommands';
import { createProject } from '@/services/projectCommands';
import { createGoal } from '@/services/goalCommands';

describe('Export and Import Backup Service', () => {
  let testDb1: TiloDB;
  let testDb2: TiloDB;

  beforeEach(async () => {
    testDb1 = new TiloDB(`test-export-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`);
    testDb2 = new TiloDB(`test-import-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`);
    await ensureDefaultWorkspace(testDb1);
  });

  afterEach(async () => {
    await testDb1.delete();
    await testDb2.delete();
  });

  it('exports valid JSON backup conforming to Zod schema and restores into another DB', async () => {
    const goal = await createGoal({ title: 'Master Local Persistence' }, testDb1);
    const proj = await createProject({ name: 'Architecture Review', color: '#6366f1', primaryGoalId: goal.id }, testDb1);
    const task = await createTask({ title: 'Write export/import tests', projectId: proj.id }, testDb1);

    const backup = await exportWorkspaceJSON('ws-default', testDb1);
    expect(backup.version).toBe(1);
    expect(backup.product).toBe('Tilo');
    expect(backup.workspace.id).toBe('ws-default');
    expect(backup.goals.length).toBe(1);
    expect(backup.projects.length).toBe(1);
    expect(backup.tasks.length).toBe(1);

    // Import into second empty database
    const importResult = await importWorkspaceJSON(backup, testDb2);
    expect(importResult.success).toBe(true);

    const restoredGoal = await testDb2.goals.get(goal.id);
    const restoredProj = await testDb2.projects.get(proj.id);
    const restoredTask = await testDb2.tasks.get(task.id);

    expect(restoredGoal?.title).toBe('Master Local Persistence');
    expect(restoredProj?.name).toBe('Architecture Review');
    expect(restoredTask?.title).toBe('Write export/import tests');
  });

  it('rejects invalid JSON backup missing product signature or version', async () => {
    const invalidBackup = {
      version: 'invalid_number',
      product: 'WrongProduct',
      exportedAt: 'now',
    };

    await expect(importWorkspaceJSON(invalidBackup, testDb2)).rejects.toThrow();
  });
});
