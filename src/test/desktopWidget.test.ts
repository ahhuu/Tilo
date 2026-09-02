import { describe, it, expect, beforeEach } from 'vitest';
import { useWidgetStore } from '@/stores/widgetStore';

describe('Desktop Widget Store & Configuration', () => {
  beforeEach(() => {
    localStorage.clear();
    useWidgetStore.getState().resetToDefaults();
  });

  it('initializes with default enabled grids (inbox and tasks)', () => {
    const { settings } = useWidgetStore.getState();
    expect(settings.enabledGrids).toEqual(['inbox', 'tasks']);
    expect(settings.opacityPercent).toBe(95);
  });

  it('can toggle grid components on and off', () => {
    const store = useWidgetStore.getState();

    store.toggleGrid('session');
    expect(useWidgetStore.getState().settings.enabledGrids).toContain('session');

    store.toggleGrid('session');
    expect(useWidgetStore.getState().settings.enabledGrids).not.toContain('session');
  });

  it('prevents disabling the last remaining grid', () => {
    const store = useWidgetStore.getState();

    store.toggleGrid('inbox');
    expect(useWidgetStore.getState().settings.enabledGrids).toEqual(['tasks']);

    store.toggleGrid('tasks');
    expect(useWidgetStore.getState().settings.enabledGrids).toEqual(['tasks']);
  });

  it('can move grids up and down to change order', () => {
    const store = useWidgetStore.getState();
    store.toggleGrid('notes');

    store.moveGrid('notes', 'up');
    expect(useWidgetStore.getState().settings.enabledGrids).toEqual(['inbox', 'notes', 'tasks']);

    store.moveGrid('inbox', 'down');
    expect(useWidgetStore.getState().settings.enabledGrids).toEqual(['notes', 'inbox', 'tasks']);
  });

  it('updates opacity within valid bounds', () => {
    const store = useWidgetStore.getState();

    store.setOpacity(70);
    expect(useWidgetStore.getState().settings.opacityPercent).toBe(70);

    store.setOpacity(20);
    expect(useWidgetStore.getState().settings.opacityPercent).toBe(40);

    store.setOpacity(120);
    expect(useWidgetStore.getState().settings.opacityPercent).toBe(100);
  });

  it('updates individual grid custom settings and alwaysOnTop', () => {
    const store = useWidgetStore.getState();

    store.updateGridSettings('tasks', { showCompleted: false });
    expect(useWidgetStore.getState().settings.gridSettings.tasks.showCompleted).toBe(false);

    store.setAlwaysOnTop(true);
    expect(useWidgetStore.getState().settings.alwaysOnTop).toBe(true);

    store.updateGridSettings('notes', { fontFamily: 'mono', paperTheme: 'yellow', fontSize: 'base' });
    expect(useWidgetStore.getState().settings.gridSettings.notes.fontFamily).toBe('mono');
    expect(useWidgetStore.getState().settings.gridSettings.notes.paperTheme).toBe('yellow');

    store.updateGridSettings('tasks', { sortBy: 'priority', showPriorityDots: false });
    expect(useWidgetStore.getState().settings.gridSettings.tasks.sortBy).toBe('priority');
    expect(useWidgetStore.getState().settings.gridSettings.tasks.showPriorityDots).toBe(false);

    store.updateGridSettings('session', { ambientSound: 'rain', autoCompleteTaskOnFinish: true });
    expect(useWidgetStore.getState().settings.gridSettings.session.ambientSound).toBe('rain');
    expect(useWidgetStore.getState().settings.gridSettings.session.autoCompleteTaskOnFinish).toBe(true);
  });

  it('contains valid standalone widget metadata for all 6 core grids', async () => {
    const { WIDGET_METAS } = await import('@/services/tauriWidgetService');
    expect(Object.keys(WIDGET_METAS)).toEqual(['inbox', 'tasks', 'session', 'timeline', 'notes', 'goals']);
    expect(WIDGET_METAS.inbox.name).toBe('闪念收集');
    expect(WIDGET_METAS.tasks.name).toBe('今日待办');
    expect(WIDGET_METAS.session.name).toBe('专注计时');
    expect(WIDGET_METAS.timeline.name).toBe('今日日程');
    expect(WIDGET_METAS.notes.name).toBe('随手便签');
    expect(WIDGET_METAS.goals.name).toBe('目标看板');
  });

  it('supports alignment commands and autostart preferences gracefully', async () => {
    const { tauriWidgetService } = await import('@/services/tauriWidgetService');

    // 验证自启动首选项持久化
    expect(await tauriWidgetService.isAutoStartEnabled()).toBe(false);
    await tauriWidgetService.setAutoStart(true);
    expect(await tauriWidgetService.isAutoStartEnabled()).toBe(true);

    // 验证开机自动唤出挂件开关
    expect(tauriWidgetService.isAutoLaunchWidgetsOnStartup()).toBe(false);
    tauriWidgetService.setAutoLaunchWidgetsOnStartup(true);
    expect(tauriWidgetService.isAutoLaunchWidgetsOnStartup()).toBe(true);

    // 验证在非原生或测试环境下 alignWidgets 与 resetPositions 不会抛出异常
    await expect(tauriWidgetService.alignWidgets('right')).resolves.not.toThrow();
    await expect(tauriWidgetService.alignWidgets('left')).resolves.not.toThrow();
    await expect(tauriWidgetService.alignWidgets('horizontal')).resolves.not.toThrow();
    await expect(tauriWidgetService.resetWidgetPositions()).resolves.not.toThrow();

    // 验证主窗口关闭行为偏好设置与托盘调用
    expect(tauriWidgetService.getCloseActionPreference()).toBe('ask');
    tauriWidgetService.setCloseActionPreference('tray');
    expect(tauriWidgetService.getCloseActionPreference()).toBe('tray');
    tauriWidgetService.setCloseActionPreference('exit');
    expect(tauriWidgetService.getCloseActionPreference()).toBe('exit');
    await expect(tauriWidgetService.minimizeMainWindowToTray()).resolves.not.toThrow();

    // 验证桌面挂件排布坐标、宽高与开启状态持久化
    expect(tauriWidgetService.getWidgetLayout('tasks')).toBeNull();
    tauriWidgetService.saveWidgetLayout('tasks', { x: 500, y: 200, width: 380, height: 520, isOpen: true, isPinned: true });
    const tasksLayout = tauriWidgetService.getWidgetLayout('tasks');
    expect(tasksLayout?.x).toBe(500);
    expect(tasksLayout?.y).toBe(200);
    expect(tasksLayout?.width).toBe(380);
    expect(tasksLayout?.height).toBe(520);
    expect(tasksLayout?.isOpen).toBe(true);
    expect(tasksLayout?.isPinned).toBe(true);

    tauriWidgetService.saveWidgetLayout('notes', { isOpen: true });
    expect(tauriWidgetService.getLastActiveWidgetIds()).toEqual(expect.arrayContaining(['tasks', 'notes']));

    tauriWidgetService.saveWidgetLayout('tasks', { isOpen: false });
    expect(tauriWidgetService.getLastActiveWidgetIds()).not.toContain('tasks');
    expect(tauriWidgetService.getLastActiveWidgetIds()).toContain('notes');
  });

  it('handles in-app workspace actions (open, close, transform, align)', () => {
    const store = useWidgetStore.getState();

    // 默认关闭
    expect(store.settings.isWorkspaceOpen).toBe(false);

    // 打开工作区并激活便签
    store.openWorkspace();
    expect(useWidgetStore.getState().settings.isWorkspaceOpen).toBe(true);

    store.activateGrid('notes');
    expect(useWidgetStore.getState().settings.activeGrids).toContain('notes');

    // 调整便签位置与尺寸
    store.updateGridTransform('notes', { x: 200, y: 150, width: 400, height: 500 });
    const notesTransform = useWidgetStore.getState().settings.gridTransforms.notes;
    expect(notesTransform.x).toBe(200);
    expect(notesTransform.y).toBe(150);
    expect(notesTransform.width).toBe(400);

    // 对齐测试
    store.alignActiveGrids('right');
    expect(useWidgetStore.getState().settings.gridTransforms.notes.x).toBeGreaterThan(0);

    // 关闭挂件与关闭工作区
    store.deactivateGrid('notes');
    expect(useWidgetStore.getState().settings.activeGrids).not.toContain('notes');

    store.closeWorkspace();
    expect(useWidgetStore.getState().settings.isWorkspaceOpen).toBe(false);
  });
});
