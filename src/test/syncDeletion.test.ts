import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TiloDB, DEFAULT_WORKSPACE_ID } from '@/storage/db';
import lanSyncService from '@/services/lanSyncService';
import {
  purgeTombstones,
  restoreSoftDeletedRow,
  softDeleteRow,
  TOMBSTONE_RETENTION_MS,
} from '@/services/tombstoneService';
import { deletePlannedBlock } from '@/services/planCommands';
import { deleteSession } from '@/services/sessionCommands';
import { deleteTemplate } from '@/services/templateCommands';
import type { Task, PlannedBlock, Session, SessionSegment, Template } from '@/core/types/domain';

/**
 * 局域网同步的「删除」语义回归测试。
 *
 * 这里模拟两台设备各自的 Dexie 库：A 删了东西，把载荷推给 B，
 * 断言 B 上那条记录真的没了；再把 B 的载荷推回 A，断言 A 没有把它复活。
 */

const T0 = 1_700_000_000_000;

const makeTask = (id: string, overrides: Partial<Task> = {}): Task => ({
  id,
  workspaceId: DEFAULT_WORKSPACE_ID,
  title: `Task ${id}`,
  statusId: 'ws-task-todo',
  priority: 'medium',
  progressMode: 'binary',
  tagIds: [],
  createdAt: T0,
  updatedAt: T0,
  deletedAt: null,
  ...overrides,
});

const makeBlock = (id: string): PlannedBlock => ({
  id,
  workspaceId: DEFAULT_WORKSPACE_ID,
  type: 'task',
  title: `Block ${id}`,
  startAt: T0,
  endAt: T0 + 30 * 60 * 1000,
  createdAt: T0,
  updatedAt: T0,
  deletedAt: null,
});

const makeSession = (id: string): Session => ({
  id,
  workspaceId: DEFAULT_WORKSPACE_ID,
  title: `Session ${id}`,
  kind: 'active',
  source: 'timer',
  startedAt: T0,
  endedAt: T0 + 25 * 60 * 1000,
  activeDurationSeconds: 1500,
  elapsedDurationSeconds: 1500,
  createdAt: T0,
  updatedAt: T0,
  deletedAt: null,
});

describe('LAN sync — 删除的传播', () => {
  let deviceA: TiloDB;
  let deviceB: TiloDB;

  beforeEach(() => {
    deviceA = new TiloDB(`sync-a-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    deviceB = new TiloDB(`sync-b-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  });

  afterEach(async () => {
    await deviceA.delete();
    await deviceB.delete();
  });

  /** A 的整机载荷推给 B */
  const pushAToB = async () => {
    const payload = await lanSyncService.exportFullPayload('Device A', deviceA);
    return lanSyncService.mergeRemotePayload(payload, deviceB);
  };

  /** B 的整机载荷推给 A（模拟对端回推，最容易出现「删除被复活」的方向） */
  const pushBToA = async () => {
    const payload = await lanSyncService.exportFullPayload('Device B', deviceB);
    return lanSyncService.mergeRemotePayload(payload, deviceA);
  };

  it('软删除（任务）会传播到对端，且对端回推不会复活', async () => {
    await deviceA.tasks.put(makeTask('t1'));
    // 对端手里的副本在删除之前被编辑过（updatedAt 比删除前更新）：
    // 删除必须推进 updatedAt 才能压过它，否则这次编辑会让删除失效
    await deviceB.tasks.put(makeTask('t1', { updatedAt: T0 + 500, title: 'Edited on B' }));

    await softDeleteRow(deviceA.tasks, 't1', T0 + 1000);

    await pushAToB();
    expect((await deviceB.tasks.get('t1'))?.deletedAt).toBe(T0 + 1000);
    expect((await deviceB.tasks.get('t1'))?.title).toBe('Task t1');

    await pushBToA();
    expect((await deviceA.tasks.get('t1'))?.deletedAt).toBe(T0 + 1000);
  });

  it('历史数据（删除时漏推进 updatedAt）也能传播：时间戳打平时删除方胜出', async () => {
    await deviceA.tasks.put(makeTask('t-old'));
    await deviceB.tasks.put(makeTask('t-old'));

    // 模拟旧版本代码的坏数据：只写 deletedAt，updatedAt 仍是 T0
    await deviceA.tasks.update('t-old', { deletedAt: T0 });

    await pushAToB();
    expect((await deviceB.tasks.get('t-old'))?.deletedAt).toBe(T0);

    await pushBToA();
    expect((await deviceA.tasks.get('t-old'))?.deletedAt).toBe(T0);
  });

  it('硬删除（时间块）靠墓碑传播，且不会被对端推回来', async () => {
    await deviceA.plannedBlocks.put(makeBlock('b1'));
    await deviceB.plannedBlocks.put(makeBlock('b1'));

    await deletePlannedBlock('b1', deviceA);
    expect(await deviceA.plannedBlocks.get('b1')).toBeUndefined();

    const summary = await pushAToB();
    expect(summary.deletedCount).toBe(1);
    expect(await deviceB.plannedBlocks.get('b1')).toBeUndefined();
    // 墓碑也要落到 B 上，否则 B 会一直以为 A 少了一条数据
    expect(await deviceB.syncTombstones.get('plannedBlocks:b1')).toBeDefined();

    await pushBToA();
    expect(await deviceA.plannedBlocks.get('b1')).toBeUndefined();
  });

  it('硬删除（专注会话）会连分段一起墓碑化', async () => {
    const segment: SessionSegment = {
      id: 'seg1',
      workspaceId: DEFAULT_WORKSPACE_ID,
      sessionId: 's1',
      type: 'active',
      startAt: T0,
      endAt: T0 + 60_000,
    };
    await deviceA.sessions.put(makeSession('s1'));
    await deviceA.sessionSegments.put(segment);
    await deviceB.sessions.put(makeSession('s1'));
    await deviceB.sessionSegments.put(segment);

    await deleteSession('s1', deviceA);
    await pushAToB();

    expect(await deviceB.sessions.get('s1')).toBeUndefined();
    expect(await deviceB.sessionSegments.get('seg1')).toBeUndefined();

    await pushBToA();
    expect(await deviceA.sessions.get('s1')).toBeUndefined();
    expect(await deviceA.sessionSegments.get('seg1')).toBeUndefined();
  });

  it('样式模板删除也走墓碑', async () => {
    const template: Template = {
      id: 'tpl1',
      workspaceId: DEFAULT_WORKSPACE_ID,
      kind: 'task',
      name: 'Deep work',
      payloadJson: { title: 'Deep work' },
      createdAt: T0,
      updatedAt: T0,
      deletedAt: null,
    } as Template;

    await deviceA.templates.put(template);
    await deviceB.templates.put(template);

    await deleteTemplate('tpl1', deviceA);
    await pushAToB();
    expect(await deviceB.templates.get('tpl1')).toBeUndefined();
  });

  it('对端还没收到删除消息时把旧副本推过来，不会被写回本地', async () => {
    await deviceA.plannedBlocks.put(makeBlock('b4'));
    await deviceB.plannedBlocks.put(makeBlock('b4'));

    // A 删了它，但 B 完全不知道（中间没同步过）
    await deletePlannedBlock('b4', deviceA);

    // B 推上来的载荷里还有这条旧副本，且没有墓碑
    const summary = await pushBToA();
    expect(summary.addedCount).toBe(0);
    expect(await deviceA.plannedBlocks.get('b4')).toBeUndefined();
  });

  it('删除之后对端又显式重建/修改的记录会被保留（墓碑不吞掉更新的写入）', async () => {
    await deviceA.plannedBlocks.put(makeBlock('b2'));
    await deviceB.plannedBlocks.put(makeBlock('b2'));

    await deletePlannedBlock('b2', deviceA); // 墓碑时间 = 现在

    // 对端在这之后重建了同 id 的记录
    const rebuiltAt = Date.now() + 5_000;
    await deviceB.plannedBlocks.put({ ...makeBlock('b2'), title: 'Rebuilt', updatedAt: rebuiltAt });

    await pushBToA();
    expect((await deviceA.plannedBlocks.get('b2'))?.title).toBe('Rebuilt');
  });

  it('载荷里带墓碑（否则对端无从得知删除）', async () => {
    await deviceA.tasks.put(makeTask('t2'));
    await deviceA.plannedBlocks.put(makeBlock('b3'));
    await deletePlannedBlock('b3', deviceA);

    const payload = await lanSyncService.exportFullPayload('Device A', deviceA);
    expect(payload.tombstones?.some((item) => item.key === 'plannedBlocks:b3')).toBe(true);
  });

  it('分段没有 updatedAt 时靠 endAt 判断新旧（专注时长能同步过去）', async () => {
    const started = { id: 'seg2', workspaceId: DEFAULT_WORKSPACE_ID, sessionId: 's2', type: 'active' as const, startAt: T0 };
    await deviceA.sessionSegments.put({ ...started, endAt: T0 + 600_000 });
    await deviceB.sessionSegments.put(started);

    await pushAToB();
    expect((await deviceB.sessionSegments.get('seg2'))?.endAt).toBe(T0 + 600_000);
  });

  it('过期墓碑会被清理', async () => {
    await deviceA.syncTombstones.put({
      key: 'tasks:stale',
      table: 'tasks',
      entityId: 'stale',
      deletedAt: Date.now() - TOMBSTONE_RETENTION_MS - 1000,
    });
    await deviceA.syncTombstones.put({
      key: 'tasks:fresh',
      table: 'tasks',
      entityId: 'fresh',
      deletedAt: Date.now(),
    });

    const removed = await purgeTombstones(deviceA);
    expect(removed).toBe(1);
    expect(await deviceA.syncTombstones.get('tasks:fresh')).toBeDefined();
  });

  it('从废纸篓恢复也会传播（撤销删除不会被对端再删回去）', async () => {
    await deviceA.tasks.put(makeTask('t-restore'));
    await deviceB.tasks.put(makeTask('t-restore'));

    await softDeleteRow(deviceA.tasks, 't-restore', T0 + 1000);
    await pushAToB();
    expect((await deviceB.tasks.get('t-restore'))?.deletedAt).toBe(T0 + 1000);

    // 用户在撤销窗口期内恢复
    await restoreSoftDeletedRow(deviceA.tasks, 't-restore', T0 + 2000);
    await pushAToB();
    expect((await deviceB.tasks.get('t-restore'))?.deletedAt).toBeNull();

    // 对端回推也不会把恢复又盖回删除
    await pushBToA();
    expect((await deviceA.tasks.get('t-restore'))?.deletedAt).toBeNull();
  });

  it('两边都是删除且时间戳相同时不会互相刷写', async () => {
    await deviceA.tasks.put(makeTask('t-both', { deletedAt: T0 + 500 }));
    await deviceB.tasks.put(makeTask('t-both', { deletedAt: T0 + 500 }));

    const summary = await pushAToB();
    expect(summary.updatedCount).toBe(0);
    expect(summary.addedCount).toBe(0);
  });

  it('未删除的数据照常双向同步（避免修删除时把正常合并弄坏）', async () => {
    await deviceA.tasks.put(makeTask('t3', { updatedAt: T0 + 2000, title: 'From A' }));
    await pushAToB();
    expect((await deviceB.tasks.get('t3'))?.title).toBe('From A');

    await deviceB.tasks.put(makeTask('t3', { updatedAt: T0 + 3000, title: 'From B' }));
    await pushBToA();
    expect((await deviceA.tasks.get('t3'))?.title).toBe('From B');
  });
});
