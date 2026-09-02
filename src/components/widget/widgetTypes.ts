export type WidgetGridId =
  | 'inbox'       // 闪念收集箱
  | 'tasks'       // 今日待办与聚焦
  | 'session'     // 专注计时器
  | 'timeline'    // 日程与时间块
  | 'notes'       // 随手便签
  | 'goals';      // 核心目标与里程碑看板

export interface InboxGridSettings {
  defaultTab: 'unsorted' | 'idea' | 'archived' | 'all';
  quickActionTarget: 'todayFocus' | 'inbox';
  displayDensity: 'comfortable' | 'compact';
  enterBehavior: 'submit' | 'newline';
  tabStyle?: 'text' | 'icon' | 'both'; // 标签展示样式：纯文字 / 纯图标 / 图文并存
}

export interface TasksGridSettings {
  defaultFilter: 'focus' | 'today' | 'all';
  showCompleted: boolean;
  sortBy: 'priority' | 'time' | 'manual';
  showProjectBadge: boolean;
  showPriorityDots: boolean;
  defaultPriority: 'none' | 'urgent' | 'high' | 'medium';
  tabStyle?: 'text' | 'icon' | 'both'; // 标签展示样式：纯文字 / 纯图标 / 图文并存
}

export interface SessionGridSettings {
  defaultDurationMinutes: number;
  autoLinkFocusTask: boolean;
  autoCompleteTaskOnFinish: boolean;
  ambientSound: 'none' | 'rain' | 'whitenoise' | 'birds' | 'fireplace';
  isCapsuleMode?: boolean; // 极窄灵动胶囊模式
}

export interface TimelineGridSettings {
  scope: 'upcoming' | 'allDay' | 'afternoon';
  timeScale: 'compact' | 'standard' | 'relaxed';
  showNextUpPulse: boolean;
  showGhostTimebox: boolean;
}

export interface NotesGridSettings {
  fontSize: 'sm' | 'base' | 'lg';
  fontFamily: 'sans' | 'mono';
  paperTheme: 'classic' | 'yellow' | 'mint' | 'dark';
  defaultMode: 'edit' | 'split' | 'preview';
}

export interface GoalsGridSettings {
  showDDay: boolean;
  showCompletedGoals: boolean;
  maxDisplayCount: number;
}

export type WidgetWindowStyle = 'glass' | 'stealth' | 'paper' | 'floating' | 'terminal';

export type HeaderButtonDisplayMode = 'always' | 'hover' | 'hidden';

export interface WidgetHeaderButtonsConfig {
  pin: HeaderButtonDisplayMode; // 始终置顶 (Always on Top，浮在所有软件前面)
  lock: HeaderButtonDisplayMode; // 锁定位置 (Lock Layout，禁止拖动防误触)
  settings: HeaderButtonDisplayMode;
  theme: HeaderButtonDisplayMode;
  close: HeaderButtonDisplayMode;
}

export interface WidgetAppearanceSettings {
  fontSizeLevel: 'small' | 'normal' | 'large'; // 84% | 100% | 122%
  fontFamily: 'system' | 'sans' | 'mono' | 'serif';
  buttonSize: 'compact' | 'standard' | 'generous';
  borderRadius: 'rounded-xl' | 'rounded-2xl' | 'rounded-3xl';
  windowStyle: WidgetWindowStyle; // 5 款窗口质感风格
  collapseOnDoubleClick: boolean; // 双击顶栏折叠/展开
  headerActionsMode: 'hover' | 'always'; // 顶栏按钮默认行为：静默沉浸 (悬停淡入) 或一直显示
  headerButtons: WidgetHeaderButtonsConfig; // 5 个独立按钮细粒度定制
  lockLayout: boolean; // 锁定位置与尺寸防误触
}

export interface WidgetGridCustomSettings {
  inbox: InboxGridSettings;
  tasks: TasksGridSettings;
  session: SessionGridSettings;
  timeline: TimelineGridSettings;
  notes: NotesGridSettings;
  goals: GoalsGridSettings;
}

export interface InAppGridTransform {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

export interface DesktopWidgetSettings {
  enabledGrids: WidgetGridId[];
  activeGrids: WidgetGridId[];
  isWorkspaceOpen: boolean;
  gridSettings: WidgetGridCustomSettings;
  gridTransforms: Record<WidgetGridId, InAppGridTransform>;
  appearance: WidgetAppearanceSettings;
  opacityPercent: number;
  layoutMode: 'auto' | 'columns-2' | 'columns-1';
  alwaysOnTop: boolean;
}

export const DEFAULT_HEADER_BUTTONS_CONFIG: WidgetHeaderButtonsConfig = {
  pin: 'hover',
  lock: 'hover',
  settings: 'hover',
  theme: 'hover',
  close: 'hover',
};

export const DEFAULT_APPEARANCE_SETTINGS: WidgetAppearanceSettings = {
  fontSizeLevel: 'normal',
  fontFamily: 'system',
  buttonSize: 'standard',
  borderRadius: 'rounded-2xl',
  windowStyle: 'glass',
  collapseOnDoubleClick: true,
  headerActionsMode: 'hover',
  headerButtons: DEFAULT_HEADER_BUTTONS_CONFIG,
  lockLayout: false,
};

export const DEFAULT_GRID_TRANSFORMS: Record<WidgetGridId, InAppGridTransform> = {
  inbox: { x: 70, y: 70, width: 320, height: 440, zIndex: 10 },
  tasks: { x: 410, y: 70, width: 340, height: 480, zIndex: 11 },
  session: { x: 770, y: 70, width: 320, height: 420, zIndex: 12 },
  timeline: { x: 70, y: 530, width: 340, height: 440, zIndex: 13 },
  notes: { x: 430, y: 530, width: 360, height: 460, zIndex: 14 },
  goals: { x: 810, y: 530, width: 340, height: 440, zIndex: 15 },
};

export const DEFAULT_WIDGET_SETTINGS: DesktopWidgetSettings = {
  enabledGrids: ['inbox', 'tasks'],
  activeGrids: ['inbox', 'tasks'],
  isWorkspaceOpen: false,
  gridTransforms: DEFAULT_GRID_TRANSFORMS,
  appearance: DEFAULT_APPEARANCE_SETTINGS,
  gridSettings: {
    inbox: {
      defaultTab: 'unsorted',
      quickActionTarget: 'todayFocus',
      displayDensity: 'comfortable',
      enterBehavior: 'submit',
      tabStyle: 'icon',
    },
    tasks: {
      defaultFilter: 'today',
      showCompleted: true,
      sortBy: 'priority',
      showProjectBadge: true,
      showPriorityDots: true,
      defaultPriority: 'none',
      tabStyle: 'icon',
    },
    session: {
      defaultDurationMinutes: 25,
      autoLinkFocusTask: true,
      autoCompleteTaskOnFinish: false,
      ambientSound: 'none',
      isCapsuleMode: false,
    },
    timeline: {
      scope: 'upcoming',
      timeScale: 'standard',
      showNextUpPulse: true,
      showGhostTimebox: true,
    },
    notes: {
      fontSize: 'sm',
      fontFamily: 'sans',
      paperTheme: 'classic',
      defaultMode: 'edit',
    },
    goals: {
      showDDay: true,
      showCompletedGoals: false,
      maxDisplayCount: 5,
    },
  },
  opacityPercent: 95,
  layoutMode: 'auto',
  alwaysOnTop: false,
};
