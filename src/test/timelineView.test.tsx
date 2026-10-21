import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TimelineView } from '@/components/timeline/TimelineView';
import { timeService } from '@/core/time/timeService';
import type { PlannedBlock, Session } from '@/core/types/domain';

const DATE = '2026-08-21';
const dayStart = timeService.getStartOfLogicalDay(DATE);
const at = (hour: number, minute = 0) => dayStart + hour * 3600000 + minute * 60000;

const makeBlock = (id: string, title: string, startAt: number, endAt: number): PlannedBlock => ({
  id,
  workspaceId: 'ws-default',
  type: 'task',
  title,
  startAt,
  endAt,
  createdAt: dayStart,
  updatedAt: dayStart,
  deletedAt: null,
});

type UpdateBlockFn = (
  id: string,
  updates: Partial<Omit<PlannedBlock, 'id' | 'workspaceId' | 'createdAt'>>
) => Promise<PlannedBlock>;

/**
 * TimelineView 拆分（header / block / 背景轨道 / 手势 hook）后的契约测试：
 * 两种卡片高度分支、过滤、方向键改期、删除、空态引导都必须保持一致。
 */
describe('TimelineView 拆分后行为', () => {
  const shortBlock = makeBlock('b-short', '短路冲刺', at(9), at(9, 20)); // 20m → 单行分支
  const longBlock = makeBlock('b-long', '深度工作', at(11), at(12, 30)); // 90m → 两行分支

  const renderView = (overrides: Partial<React.ComponentProps<typeof TimelineView>> = {}) =>
    render(
      <TimelineView
        dateStr={DATE}
        tasks={[]}
        projects={[]}
        plannedBlocks={[shortBlock, longBlock]}
        sessions={[]}
        {...overrides}
      />
    );

  it('渲染两种高度分支的时间块与计划/实际合计', () => {
    renderView();
    expect(screen.getByText('短路冲刺')).toBeTruthy();
    expect(screen.getByText('深度工作')).toBeTruthy();
    expect(screen.getByText(/计划:/)).toBeTruthy();
  });

  it('计划块可通过键盘聚焦并以 Tab 语义暴露角色', () => {
    renderView();
    const blocks = screen.getAllByRole('button', { name: /冲刺|深度工作/ });
    expect(blocks.length).toBe(2);
    blocks.forEach((b) => expect(b.getAttribute('tabindex')).toBe('0'));
  });

  it('方向键下移 15 分钟并保留时长', async () => {
    const onUpdatePlannedBlock = vi.fn<UpdateBlockFn>();
    onUpdatePlannedBlock.mockResolvedValue(shortBlock);
    renderView({ onUpdatePlannedBlock });

    fireEvent.keyDown(screen.getByRole('button', { name: /短路冲刺/ }), { key: 'ArrowDown' });

    await waitFor(() => expect(onUpdatePlannedBlock).toHaveBeenCalledTimes(1));
    const [id, updates] = onUpdatePlannedBlock.mock.calls[0];
    expect(id).toBe('b-short');
    expect(updates.startAt).toBe(at(9, 15));
    expect(updates.endAt).toBe(at(9, 35));
  });

  it('Shift + 方向键上移 1 小时', async () => {
    const onUpdatePlannedBlock = vi.fn<UpdateBlockFn>();
    onUpdatePlannedBlock.mockResolvedValue(longBlock);
    renderView({ onUpdatePlannedBlock });

    fireEvent.keyDown(screen.getByRole('button', { name: /深度工作/ }), { key: 'ArrowUp', shiftKey: true });

    await waitFor(() => expect(onUpdatePlannedBlock).toHaveBeenCalledTimes(1));
    expect(onUpdatePlannedBlock.mock.calls[0][1].startAt).toBe(at(10));
  });

  it('Delete 键删除计划块', async () => {
    const onDeletePlannedBlock = vi.fn(async () => undefined);
    renderView({ onDeletePlannedBlock });

    fireEvent.keyDown(screen.getByRole('button', { name: /短路冲刺/ }), { key: 'Delete' });
    await waitFor(() => expect(onDeletePlannedBlock).toHaveBeenCalledWith('b-short'));
  });

  it('切到「仅实际」后计划块从画布上消失，切回「全部」恢复', () => {
    renderView();
    fireEvent.click(screen.getByRole('button', { name: '仅实际 (Actual)' }));
    expect(screen.queryByText('深度工作')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /全部/ }));
    expect(screen.getByText('深度工作')).toBeTruthy();
  });

  it('无条目时展示空画布引导，有后台会话时渲染后台轨道', () => {
    const { rerender } = render(
      <TimelineView dateStr={DATE} tasks={[]} projects={[]} plannedBlocks={[]} sessions={[]} />
    );
    expect(screen.getByText(/拖拽待办至此/)).toBeTruthy();

    const bgSession: Session = {
      id: 's-bg',
      workspaceId: 'ws-default',
      title: '后台听书',
      kind: 'background',
      source: 'timer',
      startedAt: at(10),
      endedAt: at(11),
      activeDurationSeconds: 3600,
      elapsedDurationSeconds: 3600,
      createdAt: dayStart,
      updatedAt: dayStart,
      deletedAt: null,
    };

    rerender(
      <TimelineView dateStr={DATE} tasks={[]} projects={[]} plannedBlocks={[]} sessions={[bgSession]} />
    );
    expect(screen.getByText('后台活动')).toBeTruthy();
  });
});
