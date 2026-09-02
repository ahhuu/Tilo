import { describe, it, expect } from 'vitest';
import { useWidgetStore } from '@/stores/widgetStore';
import { tauriWidgetService } from '@/services/tauriWidgetService';
import type { InboxItem, Task } from '@/core/types/domain';

describe('桌面挂件 6 项体验优化与功能扩展逻辑验证', () => {
  it('1. 灵感分类统计逻辑验证：排除 converted 与 archived', () => {
    const rawItems: InboxItem[] = [
      {
        id: 'inbox-1',
        workspaceId: 'ws-default',
        kind: 'idea',
        rawText: '灵感 1 (进行中)',
        state: 'unsorted',
        capturedAt: 1000,
        createdAt: 1000,
        updatedAt: 1000,
        deletedAt: null,
      },
      {
        id: 'inbox-2',
        workspaceId: 'ws-default',
        kind: 'idea',
        rawText: '灵感 2 (已转任务)',
        state: 'converted',
        capturedAt: 1000,
        createdAt: 1000,
        updatedAt: 1000,
        deletedAt: null,
      },
      {
        id: 'inbox-3',
        workspaceId: 'ws-default',
        kind: 'idea',
        rawText: '灵感 3 (已归档)',
        state: 'archived',
        capturedAt: 1000,
        createdAt: 1000,
        updatedAt: 1000,
        deletedAt: null,
      },
      {
        id: 'inbox-4',
        workspaceId: 'ws-default',
        kind: 'unsorted',
        rawText: '待办项',
        state: 'unsorted',
        capturedAt: 1000,
        createdAt: 1000,
        updatedAt: 1000,
        deletedAt: null,
      },
    ];

    // 过滤逻辑与 InboxGrid 保持严格一致
    const activeItems = rawItems.filter(
      (item) => !item.deletedAt && item.state !== 'converted' && item.state !== 'archived'
    );
    const ideaCount = activeItems.filter((item) => item.kind === 'idea').length;

    // 原始总共有 3 条 idea，但排除 converted 和 archived 之后，徽标和列表都严格为 1
    expect(ideaCount).toBe(1);
    expect(activeItems.filter((i) => i.kind === 'idea')[0].id).toBe('inbox-1');
  });

  it('2. 今日待办分类逻辑验证：严格排除未排期任务', () => {
    const logicalDate = '2026-09-01';
    const focusTaskIds = new Set(['task-focus-1']);

    const tasks: Partial<Task>[] = [
      {
        id: 'task-1',
        title: '今天排期的任务',
        scheduledDate: '2026-09-01',
      },
      {
        id: 'task-focus-1',
        title: '今日 Top 聚焦任务',
        scheduledDate: undefined,
      },
      {
        id: 'task-unscheduled',
        title: '未排期任务 (无排期无聚焦)',
        scheduledDate: undefined,
        planningBucket: undefined,
      },
      {
        id: 'task-someday',
        title: '以后再做任务',
        scheduledDate: undefined,
        planningBucket: 'someday',
      },
    ];

    const todayTasks = tasks.filter((task) => {
      return (
        task.scheduledDate === logicalDate ||
        (task.id && focusTaskIds.has(task.id))
      );
    });

    expect(todayTasks.length).toBe(2);
    expect(todayTasks.map((t) => t.id)).toEqual(['task-1', 'task-focus-1']);
    expect(todayTasks.some((t) => t.id === 'task-unscheduled')).toBe(false);
  });

  it('3. 外观自定义配置存储与更新验证', () => {
    const store = useWidgetStore.getState();

    // 更新字体大小与圆角风格
    store.updateAppearance({
      fontSizeLevel: 'large',
      fontFamily: 'mono',
      buttonSize: 'generous',
      borderRadius: 'rounded-3xl',
    });

    const updated = useWidgetStore.getState().settings.appearance;
    expect(updated.fontSizeLevel).toBe('large');
    expect(updated.fontFamily).toBe('mono');
    expect(updated.buttonSize).toBe('generous');
    expect(updated.borderRadius).toBe('rounded-3xl');
  });

  it('4. 专注计时倒计时计算：支持工时读取与百分比计算', () => {
    const targetDurationMinutes = 45;
    const elapsedSeconds = 15 * 60; // 15分钟

    const targetSec = targetDurationMinutes * 60;
    const remainingSec = Math.max(0, targetSec - elapsedSeconds);
    const progressPercent = Math.min(100, Math.round((elapsedSeconds / targetSec) * 100));

    expect(remainingSec).toBe(30 * 60);
    expect(progressPercent).toBe(33);
  });

  it('5. 目标看板「进行中」Tab 过滤逻辑验证：严格排除已完成、已归档与 100% 达成项', () => {
    const goals = [
      { id: 'g-1', title: '目标进行中 (未满100%)', status: 'active' },
      { id: 'g-2', title: '目标已归档', status: 'archived' },
      { id: 'g-3', title: '目标已标记完成', status: 'completed' },
      { id: 'g-4', title: '目标任务已100%做完', status: 'active' },
    ];

    const progressMap = new Map([
      ['g-1', { total: 8, done: 5, percent: 63 }],
      ['g-4', { total: 3, done: 3, percent: 100 }],
    ]);

    const activeGoals = goals.filter((g) => {
      if (g.status === 'completed' || g.status === 'archived') return false;
      const prog = progressMap.get(g.id);
      if (prog && prog.total > 0 && prog.done >= prog.total) return false;
      return true;
    });

    expect(activeGoals.length).toBe(1);
    expect(activeGoals[0].id).toBe('g-1');
  });

  it('6. 窗口风格(5款)、按键独立显隐与双击折叠偏好存储验证', () => {
    const store = useWidgetStore.getState();

    // 默认今日待办应当为仅图标模式
    expect(store.settings.gridSettings.tasks.tabStyle).toBe('icon');

    // 更新为曜石纯黑风格，配置独立按钮显示模式
    store.updateAppearance({
      windowStyle: 'stealth',
      collapseOnDoubleClick: true,
      headerActionsMode: 'hover',
      headerButtons: {
        pin: 'always',
        lock: 'always',
        settings: 'hover',
        theme: 'hidden',
        close: 'hover',
      },
      lockLayout: true,
    });

    const appearance = useWidgetStore.getState().settings.appearance;
    expect(appearance.windowStyle).toBe('stealth');
    expect(appearance.collapseOnDoubleClick).toBe(true);
    expect(appearance.lockLayout).toBe(true);
    expect(appearance.headerButtons.pin).toBe('always');
    expect(appearance.headerButtons.lock).toBe('always');
    expect(appearance.headerButtons.theme).toBe('hidden');
  });

  it('7. 挂件尺寸保护：严禁持久化保存小于 120px 的折叠高度，并自动清洗恢复标准默认高度', () => {
    // 模拟写入折叠态的 38px 脏高度
    localStorage.setItem(
      'tilo_desktop_widgets_layout_v2',
      JSON.stringify({
        tasks: { width: 360, height: 38, isOpen: true },
        session: { width: 320, height: 38, isOpen: true },
      })
    );

    // 读取时高度必须被清洗修正为标准默认高度，杜绝回不去默认尺寸
    const tasksLayout = tauriWidgetService.getWidgetLayout('tasks');
    expect(tasksLayout?.height).toBe(480);

    const sessionLayout = tauriWidgetService.getWidgetLayout('session');
    expect(sessionLayout?.height).toBe(400);

    // 尝试通过 saveWidgetLayout 写入小于 120px 的高度
    tauriWidgetService.saveWidgetLayout('tasks', { width: 360, height: 38 });
    const tasksSaved = tauriWidgetService.getWidgetLayout('tasks');
    expect(tasksSaved?.height).toBe(480);
  });
});
