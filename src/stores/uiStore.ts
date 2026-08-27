import { create } from 'zustand';
import type { Language } from '@/core/i18n/translations';

export type ThemeMode = 'light' | 'dark' | 'system';
export type DensityMode = 'comfortable' | 'compact';
export type MotionLevel = 'reduced' | 'subtle' | 'balanced' | 'expressive';
export type CalendarViewMode = 'day' | 'week' | 'agenda';
export type CalendarDaysCount = 5 | 7;

export interface InspectorTarget {
  type: 'task' | 'project' | 'goal' | 'block' | 'session' | 'custom';
  id: string;
  title?: string;
  data?: Record<string, unknown>;
}

export interface ToastItem {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  undoAction?: () => void;
  durationMs?: number;
}

export interface RunningSessionState {
  sessionId: string;
  taskId?: string;
  title: string;
  startedAt: number;
  elapsedSeconds: number;
  isPaused: boolean;
}

interface UIState {
  // Persisted preferences
  language: Language;
  theme: ThemeMode;
  density: DensityMode;
  motionLevel: MotionLevel;
  sidebarCollapsed: boolean;

  // Calendar preferences
  calendarViewMode: CalendarViewMode;
  calendarDaysCount: CalendarDaysCount;
  calendarPlanningDrawerOpen: boolean;

  // Global surfaces
  commandMenuOpen: boolean;
  instantCaptureOpen: boolean;
  quickTaskHUDOpen: boolean;
  quickTaskInitialValue?: string;
  inspectorOpen: boolean;
  inspectorTarget: InspectorTarget | null;

  // Running session
  runningSession: RunningSessionState | null;

  // Toasts
  toasts: ToastItem[];

  // Unsorted count for inbox badge
  unsortedInboxCount: number;

  // Actions
  setLanguage: (language: Language) => void;
  setTheme: (theme: ThemeMode) => void;
  setDensity: (density: DensityMode) => void;
  setMotionLevel: (motion: MotionLevel) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  setCalendarViewMode: (mode: CalendarViewMode) => void;
  setCalendarDaysCount: (count: CalendarDaysCount) => void;
  toggleCalendarPlanningDrawer: () => void;
  setCalendarPlanningDrawerOpen: (open: boolean) => void;

  openCommandMenu: () => void;
  closeCommandMenu: () => void;
  toggleCommandMenu: () => void;

  openInstantCapture: () => void;
  closeInstantCapture: () => void;
  toggleInstantCapture: () => void;

  openQuickTaskHUD: (initialValue?: string) => void;
  closeQuickTaskHUD: () => void;
  toggleQuickTaskHUD: (initialValue?: string) => void;

  openInspector: (target: InspectorTarget) => void;
  closeInspector: () => void;

  setRunningSession: (session: RunningSessionState | null) => void;
  togglePauseSession: () => void;
  tickSession: () => void;

  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  undoLastToast: () => void;

  setUnsortedInboxCount: (count: number) => void;
}

// LocalStorage keys
const STORAGE_KEY_LANGUAGE = 'tilo_language';
const STORAGE_KEY_THEME = 'tilo_theme';
const STORAGE_KEY_DENSITY = 'tilo_density';
const STORAGE_KEY_MOTION = 'tilo_motion';
const STORAGE_KEY_SIDEBAR = 'tilo_sidebar_collapsed';
const STORAGE_KEY_CALENDAR_VIEW = 'tilo_cal_view_mode';
const STORAGE_KEY_CALENDAR_DAYS = 'tilo_cal_days_count';

// Helpers to load persisted preferences safely
function getInitialLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LANGUAGE);
    if (saved === 'zh-CN' || saved === 'en-US') return saved;
  } catch {
    // fallback
  }
  return 'zh-CN';
}
function getInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  } catch {
    // fallback
  }
  return 'system';
}

function getInitialDensity(): DensityMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_DENSITY);
    if (saved === 'comfortable' || saved === 'compact') return saved;
  } catch {
    // fallback
  }
  return 'comfortable';
}

function getInitialMotion(): MotionLevel {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MOTION);
    if (saved === 'reduced' || saved === 'subtle' || saved === 'balanced' || saved === 'expressive') {
      return saved;
    }
  } catch {
    // fallback
  }
  return 'balanced';
}

function getInitialSidebar(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SIDEBAR);
    if (saved !== null) return JSON.parse(saved);
  } catch {
    // fallback
  }
  return false;
}

function getInitialCalendarView(): CalendarViewMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CALENDAR_VIEW);
    if (saved === 'day' || saved === 'week' || saved === 'agenda') return saved;
  } catch {
    // fallback
  }
  return 'week';
}

function getInitialCalendarDays(): CalendarDaysCount {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CALENDAR_DAYS);
    if (saved === '5' || saved === '7') return Number(saved) as CalendarDaysCount;
  } catch {
    // fallback
  }
  return 7;
}

/**
 * Apply theme to document root
 */
export function applyThemeToDOM(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const hasMatchMedia = typeof window !== 'undefined' && typeof window.matchMedia === 'function';
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && hasMatchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
}

/**
 * Apply density to document root
 */
export function applyDensityToDOM(density: DensityMode) {
  document.documentElement.setAttribute('data-density', density);
}

/**
 * Apply motion level to document root
 */
export function applyMotionToDOM(motion: MotionLevel) {
  document.documentElement.setAttribute('data-motion', motion);
  if (motion !== 'balanced') {
    document.documentElement.setAttribute('data-motion-override', 'true');
  } else {
    document.documentElement.removeAttribute('data-motion-override');
  }
}

export const useUIStore = create<UIState>((set, get) => {
  const initialLanguage = getInitialLanguage();
  const initialTheme = getInitialTheme();
  const initialDensity = getInitialDensity();
  const initialMotion = getInitialMotion();
  const initialSidebar = getInitialSidebar();
  const initialCalView = getInitialCalendarView();
  const initialCalDays = getInitialCalendarDays();

  // Initialize DOM attributes
  if (typeof document !== 'undefined') {
    applyThemeToDOM(initialTheme);
    applyDensityToDOM(initialDensity);
    applyMotionToDOM(initialMotion);

    // Listen to system theme changes dynamically
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      try {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', () => {
          const currentTheme = get().theme;
          if (currentTheme === 'system') {
            applyThemeToDOM('system');
          }
        });
      } catch {
        // ignore in environments without addEventListener on matchMedia
      }
    }
  }

  return {
    language: initialLanguage,
    theme: initialTheme,
    density: initialDensity,
    motionLevel: initialMotion,
    sidebarCollapsed: initialSidebar,

    calendarViewMode: initialCalView,
    calendarDaysCount: initialCalDays,
    calendarPlanningDrawerOpen: true,

    commandMenuOpen: false,
    instantCaptureOpen: false,
    quickTaskHUDOpen: false,
    inspectorOpen: false,
    inspectorTarget: null,

    runningSession: null,
    toasts: [],
    unsortedInboxCount: 0,

    setLanguage: (language) => {
      try {
        localStorage.setItem(STORAGE_KEY_LANGUAGE, language);
      } catch {
        // ignore
      }
      set({ language });
    },

    setTheme: (theme) => {
      try {
        localStorage.setItem(STORAGE_KEY_THEME, theme);
      } catch {
        // ignore
      }
      applyThemeToDOM(theme);
      set({ theme });
    },

    setDensity: (density) => {
      try {
        localStorage.setItem(STORAGE_KEY_DENSITY, density);
      } catch {
        // ignore
      }
      applyDensityToDOM(density);
      set({ density });
    },

    setMotionLevel: (motionLevel) => {
      try {
        localStorage.setItem(STORAGE_KEY_MOTION, motionLevel);
      } catch {
        // ignore
      }
      applyMotionToDOM(motionLevel);
      set({ motionLevel });
    },

    toggleSidebar: () => {
      const next = !get().sidebarCollapsed;
      try {
        localStorage.setItem(STORAGE_KEY_SIDEBAR, JSON.stringify(next));
      } catch {
        // ignore
      }
      set({ sidebarCollapsed: next });
    },

    setSidebarCollapsed: (collapsed) => {
      try {
        localStorage.setItem(STORAGE_KEY_SIDEBAR, JSON.stringify(collapsed));
      } catch {
        // ignore
      }
      set({ sidebarCollapsed: collapsed });
    },

    setCalendarViewMode: (calendarViewMode) => {
      try {
        localStorage.setItem(STORAGE_KEY_CALENDAR_VIEW, calendarViewMode);
      } catch {
        // ignore
      }
      set({ calendarViewMode });
    },

    setCalendarDaysCount: (calendarDaysCount) => {
      try {
        localStorage.setItem(STORAGE_KEY_CALENDAR_DAYS, String(calendarDaysCount));
      } catch {
        // ignore
      }
      set({ calendarDaysCount });
    },

    toggleCalendarPlanningDrawer: () => {
      set((state) => ({ calendarPlanningDrawerOpen: !state.calendarPlanningDrawerOpen }));
    },

    setCalendarPlanningDrawerOpen: (calendarPlanningDrawerOpen) => {
      set({ calendarPlanningDrawerOpen });
    },

    openCommandMenu: () => set({ commandMenuOpen: true }),
    closeCommandMenu: () => set({ commandMenuOpen: false }),
    toggleCommandMenu: () => set((state) => ({ commandMenuOpen: !state.commandMenuOpen })),

    openInstantCapture: () => set({ instantCaptureOpen: true }),
    closeInstantCapture: () => set({ instantCaptureOpen: false }),
    toggleInstantCapture: () => set((state) => ({ instantCaptureOpen: !state.instantCaptureOpen })),

    openQuickTaskHUD: (initialValue) => set({ quickTaskHUDOpen: true, quickTaskInitialValue: initialValue }),
    closeQuickTaskHUD: () => set({ quickTaskHUDOpen: false, quickTaskInitialValue: undefined }),
    toggleQuickTaskHUD: (initialValue) =>
      set((state) => ({
        quickTaskHUDOpen: !state.quickTaskHUDOpen,
        quickTaskInitialValue: !state.quickTaskHUDOpen ? initialValue : undefined,
      })),

    openInspector: (target) => set({ inspectorOpen: true, inspectorTarget: target }),
    closeInspector: () => set({ inspectorOpen: false, inspectorTarget: null }),

    setRunningSession: (session) => set({ runningSession: session }),
    togglePauseSession: () => {
      const current = get().runningSession;
      if (!current) return;
      set({
        runningSession: {
          ...current,
          isPaused: !current.isPaused,
        },
      });
    },
    tickSession: () => {
      const current = get().runningSession;
      if (!current || current.isPaused) return;
      set({
        runningSession: {
          ...current,
          elapsedSeconds: current.elapsedSeconds + 1,
        },
      });
    },

    addToast: (toast) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: ToastItem = { ...toast, id };
      set((state) => ({ toasts: [...state.toasts, newToast] }));

      // Auto dismiss after duration
      const duration = toast.durationMs ?? 4000;
      setTimeout(() => {
        get().removeToast(id);
      }, duration);

      return id;
    },

    removeToast: (id) => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    },

    undoLastToast: () => {
      const toasts = get().toasts;
      const lastToastWithUndo = [...toasts].reverse().find((t) => !!t.undoAction);
      if (lastToastWithUndo?.undoAction) {
        lastToastWithUndo.undoAction();
        get().removeToast(lastToastWithUndo.id);
      }
    },

    setUnsortedInboxCount: (count) => set({ unsortedInboxCount: count }),
  };
});
