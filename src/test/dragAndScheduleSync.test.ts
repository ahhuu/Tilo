import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/storage/db';
import { createTask } from '@/services/taskCommands';
import { createPlannedBlock, updatePlannedBlock } from '@/services/planCommands';

describe('Drag Scheduling & Task Attributes Sync', () => {
  beforeEach(async () => {
    await db.tasks.clear();
    await db.plannedBlocks.clear();
    await db.activityEvents.clear();
  });

  it('automatically syncs scheduledDate, estimateMinutes, and dueDate to original task when planned block is created', async () => {
    // 1. 创建未排期任务（无 scheduledDate，无 dueDate，预估工时 0）
    const task = await createTask({
      title: '未排期测试任务',
      statusId: 'ws-task-todo',
      priority: 'high',
    });
    expect(task.scheduledDate).toBeUndefined();
    expect(task.dueDate).toBeUndefined();

    // 2. 模拟拖入时间轴排期：2026-08-31 14:00 至 15:30 (90分钟)
    const startAt = new Date('2026-08-31T14:00:00').getTime();
    const endAt = new Date('2026-08-31T15:30:00').getTime();

    const block = await createPlannedBlock({
      title: task.title,
      type: 'task',
      startAt,
      endAt,
      taskId: task.id,
    });

    expect(block.taskId).toBe(task.id);

    // 3. 验证原任务属性已被精准同步
    const updatedTask = await db.tasks.get(task.id);
    expect(updatedTask).toBeDefined();
    expect(updatedTask?.scheduledDate).toBe('2026-08-31');
    expect(updatedTask?.dueDate).toBe('2026-08-31');
    expect(updatedTask?.estimateMinutes).toBe(90);

    // 4. 调整时间块时长至 2 小时 (120 分钟)，并改期至 2026-09-01
    const newStartAt = new Date('2026-09-01T09:00:00').getTime();
    const newEndAt = new Date('2026-09-01T11:00:00').getTime();

    await updatePlannedBlock(block.id, {
      startAt: newStartAt,
      endAt: newEndAt,
    });

    const reUpdatedTask = await db.tasks.get(task.id);
    expect(reUpdatedTask?.scheduledDate).toBe('2026-09-01');
    expect(reUpdatedTask?.estimateMinutes).toBe(120);
  });
});
