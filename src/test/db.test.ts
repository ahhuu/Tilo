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

  /**
   * 统计页在 v1.6 把 plannedBlocks / activityEvents 从 toArray() 改成按时间索引
   * 范围查询（computeAnalytics 只消费「周期内」的数据，所以口径不变）。
   *
   * 这类改动 tsc 完全看不出来：索引写错或字段名拼错，只会在运行时抛
   * SchemaError。这条测试同时守住「索引存在」和「区间语义与原来一致」。
   */
  it('supports the period range queries used by the analytics page', async () => {
    await ensureDefaultWorkspace(testDb);

    const periodStart = Date.UTC(2026, 0, 5);
    const periodEnd = Date.UTC(2026, 0, 12);

    const block = (id: string, startAt: number) => ({
      id,
      workspaceId: DEFAULT_WORKSPACE_ID,
      taskId: `t-${id}`,
      type: 'task' as const,
      startAt,
      endAt: startAt + 30 * 60 * 1000,
      createdAt: startAt,
      updatedAt: startAt,
    });

    await testDb.plannedBlocks.bulkPut([
      block('before', periodStart - 1000),
      block('at-start', periodStart), // 左闭：应命中
      block('inside', periodStart + 86_400_000),
      block('at-end', periodEnd), // 右开：不应命中
      block('after', periodEnd + 1000),
    ]);

    const inPeriodBlocks = await testDb.plannedBlocks
      .where('startAt')
      .between(periodStart, periodEnd, true, false)
      .toArray();

    expect(inPeriodBlocks.map((b) => b.id).sort()).toEqual(['at-start', 'inside']);

    // 与 computeAnalytics 里的过滤条件逐条对齐，确保范围查询没有偷换口径
    const manuallyFiltered = (await testDb.plannedBlocks.toArray()).filter(
      (b) => !b.deletedAt && b.startAt >= periodStart && b.startAt < periodEnd
    );
    expect(inPeriodBlocks.map((b) => b.id).sort()).toEqual(
      manuallyFiltered.map((b) => b.id).sort()
    );

    const event = (id: string, occurredAt: number) => ({
      id,
      workspaceId: DEFAULT_WORKSPACE_ID,
      entityType: 'task',
      entityId: 't-1',
      eventType: 'TASK_RESCHEDULED' as const,
      occurredAt,
      actor: 'user' as const,
      payloadJson: {},
    });

    await testDb.activityEvents.bulkPut([
      event('ev-before', periodStart - 1),
      event('ev-inside', periodStart + 5000),
      event('ev-after', periodEnd),
    ]);

    const inPeriodEvents = await testDb.activityEvents
      .where('occurredAt')
      .between(periodStart, periodEnd, true, false)
      .toArray();

    expect(inPeriodEvents.map((e) => e.id)).toEqual(['ev-inside']);
  });
});
