import { describe, it, expect, beforeEach } from 'vitest';
import { TiloDB } from '@/storage/db';
import {
  ensureWorkflowsInitialized,
  createWorkflow,
  addWorkflowStatus,
  updateWorkflowStatus,
  deleteWorkflowStatus,
  resetWorkflowToDefault,
  createCustomFieldDefinition,
  deleteCustomFieldDefinition,
  DEFAULT_TASK_WORKFLOW_ID,
  DEFAULT_PROJECT_WORKFLOW_ID,
} from '@/services/workflowCommands';

describe('Workflow Commands & Validation', () => {
  let testDb: TiloDB;

  beforeEach(async () => {
    testDb = new TiloDB(`test_tilo_wf_${Date.now()}_${Math.random()}`);
    await testDb.open();
    await ensureWorkflowsInitialized(testDb);
  });

  it('initializes default task and project workflows with semantic statuses', async () => {
    const taskWf = await testDb.workflows.get(DEFAULT_TASK_WORKFLOW_ID);
    expect(taskWf).toBeDefined();
    expect(taskWf?.scope).toBe('task');

    const projWf = await testDb.workflows.get(DEFAULT_PROJECT_WORKFLOW_ID);
    expect(projWf).toBeDefined();
    expect(projWf?.scope).toBe('project');

    const taskStatuses = await testDb.workflowStatuses
      .where('workflowId')
      .equals(DEFAULT_TASK_WORKFLOW_ID)
      .toArray();

    expect(taskStatuses.length).toBe(4);
    expect(taskStatuses.some((s) => s.semantic === 'completed')).toBe(true);
    expect(taskStatuses.some((s) => s.semantic === 'open')).toBe(true);
  });

  it('creates custom workflow and statuses', async () => {
    const wf = await createWorkflow(
      {
        scope: 'task',
        name: 'Sprint Workflow',
        initialStatuses: [
          { name: 'Backlog', semantic: 'open', colorToken: '#94a3b8' },
          { name: 'Doing', semantic: 'active', colorToken: '#6366f1' },
          { name: 'Shipped', semantic: 'completed', colorToken: '#10b981' },
        ],
      },
      testDb
    );

    expect(wf.id).toBeDefined();
    const statuses = await testDb.workflowStatuses
      .where('workflowId')
      .equals(wf.id)
      .toArray();
    expect(statuses.length).toBe(3);
  });

  it('enforces semantic integrity when modifying statuses', async () => {
    const wf = await createWorkflow(
      {
        scope: 'task',
        name: 'Strict Workflow',
        initialStatuses: [
          { name: 'Open', semantic: 'open' },
          { name: 'Done', semantic: 'completed' },
        ],
      },
      testDb
    );

    const statuses = await testDb.workflowStatuses
      .where('workflowId')
      .equals(wf.id)
      .toArray();

    const doneStatus = statuses.find((s) => s.semantic === 'completed')!;

    // Attempting to delete the only completed status should fail validation
    await expect(deleteWorkflowStatus(doneStatus.id, testDb)).rejects.toThrow(
      /Workflow must retain at least one/
    );

    // Attempting to change semantic of done to active (leaving 0 completed statuses) should fail
    await expect(
      updateWorkflowStatus(doneStatus.id, { semantic: 'active' }, testDb)
    ).rejects.toThrow(/Workflow must retain at least one/);
  });

  it('adds status to workflow and resets workflow to default', async () => {
    const newStatus = await addWorkflowStatus(
      DEFAULT_TASK_WORKFLOW_ID,
      {
        name: 'Peer Review',
        semantic: 'active',
        colorToken: '#8b5cf6',
      },
      testDb
    );

    expect(newStatus.id).toBeDefined();
    const countBefore = await testDb.workflowStatuses
      .where('workflowId')
      .equals(DEFAULT_TASK_WORKFLOW_ID)
      .count();
    expect(countBefore).toBe(5);

    await resetWorkflowToDefault('task', testDb);
    const countAfter = await testDb.workflowStatuses
      .where('workflowId')
      .equals(DEFAULT_TASK_WORKFLOW_ID)
      .count();
    expect(countAfter).toBe(4);
  });

  it('manages custom field definitions', async () => {
    const field = await createCustomFieldDefinition(
      {
        name: 'Estimated Cost',
        entityType: 'project',
        type: 'number',
      },
      testDb
    );

    expect(field.id).toBeDefined();
    const found = await testDb.customFieldDefinitions.get(field.id);
    expect(found?.name).toBe('Estimated Cost');

    await deleteCustomFieldDefinition(field.id, testDb);
    const afterDelete = await testDb.customFieldDefinitions.get(field.id);
    expect(afterDelete).toBeUndefined();
  });
});
