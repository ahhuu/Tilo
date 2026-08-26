import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TiloDB, ensureDefaultWorkspace, DEFAULT_WORKSPACE_ID } from '@/storage/db';

describe('TiloDB IndexedDB Storage Engine', () => {
  let testDb: TiloDB;

  beforeEach(() => {
    testDb = new TiloDB(`test-db-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`);
  });

  afterEach(async () => {
    await testDb.delete();
  });

  it('initializes default workspace and workflows', async () => {
    const ws = await ensureDefaultWorkspace(testDb);
    expect(ws.id).toBe(DEFAULT_WORKSPACE_ID);
    expect(ws.name).toBe('Personal workspace');

    const defaultWorkflow = await testDb.workflows.get('wf-task-default');
    expect(defaultWorkflow).toBeDefined();
    expect(defaultWorkflow?.name).toBe('Standard Task Workflow');

    const statuses = await testDb.workflowStatuses.where('workflowId').equals('wf-task-default').toArray();
    expect(statuses.length).toBe(4);
    expect(statuses.some((s) => s.semantic === 'open')).toBe(true);
    expect(statuses.some((s) => s.semantic === 'completed')).toBe(true);
  });

  it('persists and enforces workspaceId isolation across queries', async () => {
    await ensureDefaultWorkspace(testDb);

    await testDb.tasks.put({
      id: 't-ws1',
      workspaceId: 'ws-1',
      title: 'Task in Workspace 1',
      statusId: 's-1',
      priority: 'high',
      progressMode: 'binary',
      tagIds: [],
      createdAt: 1000,
      updatedAt: 1000,
    });

    await testDb.tasks.put({
      id: 't-ws2',
      workspaceId: 'ws-2',
      title: 'Task in Workspace 2',
      statusId: 's-1',
      priority: 'low',
      progressMode: 'binary',
      tagIds: [],
      createdAt: 2000,
      updatedAt: 2000,
    });

    const ws1Tasks = await testDb.tasks.where('workspaceId').equals('ws-1').toArray();
    expect(ws1Tasks.length).toBe(1);
    expect(ws1Tasks[0].title).toBe('Task in Workspace 1');

    const ws2Tasks = await testDb.tasks.where('workspaceId').equals('ws-2').toArray();
    expect(ws2Tasks.length).toBe(1);
    expect(ws2Tasks[0].title).toBe('Task in Workspace 2');
  });
});
