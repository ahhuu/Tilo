import { create } from 'zustand';
import {
  type WidgetGridId,
  type DesktopWidgetSettings,
  type WidgetGridCustomSettings,
  type InAppGridTransform,
  type WidgetAppearanceSettings,
  DEFAULT_WIDGET_SETTINGS,
  DEFAULT_APPEARANCE_SETTINGS,
} from '@/components/widget/widgetTypes';

const STORAGE_KEY_WIDGET = 'tilo_desktop_widget_settings_v2';

function loadPersistedSettings(): DesktopWidgetSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WIDGET);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_WIDGET_SETTINGS,
        ...parsed,
        appearance: {
          ...DEFAULT_APPEARANCE_SETTINGS,
          ...(parsed.appearance || {}),
        },
        gridSettings: {
          ...DEFAULT_WIDGET_SETTINGS.gridSettings,
          ...(parsed.gridSettings || {}),
        },
      };
    }
  } catch (err) {
    console.warn('Failed to load widget settings from localStorage', err);
  }
  return DEFAULT_WIDGET_SETTINGS;
}

function persistSettings(settings: DesktopWidgetSettings) {
  try {
    localStorage.setItem(STORAGE_KEY_WIDGET, JSON.stringify(settings));
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      import('@tauri-apps/api/event').then(({ emit }) => {
        emit('tilo:widget-settings-updated', settings).catch(() => {});
      }).catch(() => {});
    }
  } catch (err) {
    console.warn('Failed to save widget settings to localStorage', err);
  }
}

interface WidgetState {
  settings: DesktopWidgetSettings;
  isSettingsModalOpen: boolean;

  openSettingsModal: () => void;
  closeSettingsModal: () => void;

  openWorkspace: () => void;
  closeWorkspace: () => void;
  toggleWorkspace: () => void;

  activateGrid: (id: WidgetGridId) => void;
  deactivateGrid: (id: WidgetGridId) => void;
  toggleActiveGrid: (id: WidgetGridId) => void;

  updateGridTransform: (id: WidgetGridId, updates: Partial<InAppGridTransform>) => void;
  bringToFront: (id: WidgetGridId) => void;
  alignActiveGrids: (direction: 'left' | 'right' | 'horizontal') => void;
  resetGridPositions: () => void;

  toggleGrid: (id: WidgetGridId) => void;
  reorderGrids: (grids: WidgetGridId[]) => void;
  moveGrid: (id: WidgetGridId, direction: 'up' | 'down') => void;

  updateGridSettings: <K extends WidgetGridId>(
    id: K,
    updates: Partial<WidgetGridCustomSettings[K]>
  ) => void;

  updateAppearance: (updates: Partial<WidgetAppearanceSettings>) => void;

  setOpacity: (percent: number) => void;
  setLayoutMode: (mode: 'auto' | 'columns-2' | 'columns-1') => void;
  setAlwaysOnTop: (alwaysOnTop: boolean) => void;
  resetToDefaults: () => void;
}

export const useWidgetStore = create<WidgetState>((set) => ({
  settings: loadPersistedSettings(),
  isSettingsModalOpen: false,

  openSettingsModal: () => set({ isSettingsModalOpen: true }),
  closeSettingsModal: () => set({ isSettingsModalOpen: false }),

  openWorkspace: () => {
    set((state) => {
      const updated = { ...state.settings, isWorkspaceOpen: true };
      persistSettings(updated);
      return { settings: updated };
    });
  },

  closeWorkspace: () => {
    set((state) => {
      const updated = { ...state.settings, isWorkspaceOpen: false };
      persistSettings(updated);
      return { settings: updated };
    });
  },

  toggleWorkspace: () => {
    set((state) => {
      const updated = {
        ...state.settings,
        isWorkspaceOpen: !state.settings.isWorkspaceOpen,
      };
      persistSettings(updated);
      return { settings: updated };
    });
  },

  activateGrid: (id: WidgetGridId) => {
    set((state) => {
      const active = state.settings.activeGrids.includes(id)
        ? state.settings.activeGrids
        : [...state.settings.activeGrids, id];
      const maxZ = Math.max(...Object.values(state.settings.gridTransforms).map((t) => t.zIndex), 10);
      const currentTransform = state.settings.gridTransforms[id] || {
        x: 100,
        y: 100,
        width: 340,
        height: 460,
        zIndex: maxZ + 1,
      };
      const updated: DesktopWidgetSettings = {
        ...state.settings,
        isWorkspaceOpen: true,
        activeGrids: active,
        gridTransforms: {
          ...state.settings.gridTransforms,
          [id]: {
            ...currentTransform,
            zIndex: maxZ + 1,
          },
        },
      };
      persistSettings(updated);
      return { settings: updated };
    });
  },

  deactivateGrid: (id: WidgetGridId) => {
    set((state) => {
      const active = state.settings.activeGrids.filter((g) => g !== id);
      const updated: DesktopWidgetSettings = {
        ...state.settings,
        activeGrids: active,
      };
      persistSettings(updated);
      return { settings: updated };
    });
  },

  toggleActiveGrid: (id: WidgetGridId) => {
    set((state) => {
      const isActive = state.settings.activeGrids.includes(id);
      if (isActive) {
        const active = state.settings.activeGrids.filter((g) => g !== id);
        const updated: DesktopWidgetSettings = { ...state.settings, activeGrids: active };
        persistSettings(updated);
        return { settings: updated };
      } else {
        const active = [...state.settings.activeGrids, id];
        const maxZ = Math.max(...Object.values(state.settings.gridTransforms).map((t) => t.zIndex), 10);
        const currentTransform = state.settings.gridTransforms[id] || {
          x: 120,
          y: 120,
          width: 340,
          height: 460,
          zIndex: maxZ + 1,
        };
        const updated: DesktopWidgetSettings = {
          ...state.settings,
          isWorkspaceOpen: true,
          activeGrids: active,
          gridTransforms: {
            ...state.settings.gridTransforms,
            [id]: {
              ...currentTransform,
              zIndex: maxZ + 1,
            },
          },
        };
        persistSettings(updated);
        return { settings: updated };
      }
    });
  },

  updateGridTransform: (id: WidgetGridId, updates: Partial<InAppGridTransform>) => {
    set((state) => {
      const current = state.settings.gridTransforms[id] || {
        x: 100,
        y: 100,
        width: 340,
        height: 460,
        zIndex: 10,
      };
      const updated: DesktopWidgetSettings = {
        ...state.settings,
        gridTransforms: {
          ...state.settings.gridTransforms,
          [id]: {
            ...current,
            ...updates,
          },
        },
      };
      persistSettings(updated);
      return { settings: updated };
    });
  },

  bringToFront: (id: WidgetGridId) => {
    set((state) => {
      const maxZ = Math.max(...Object.values(state.settings.gridTransforms).map((t) => t.zIndex), 10);
      const current = state.settings.gridTransforms[id];
      if (!current) return state;
      const updated: DesktopWidgetSettings = {
        ...state.settings,
        gridTransforms: {
          ...state.settings.gridTransforms,
          [id]: {
            ...current,
            zIndex: maxZ + 1,
          },
        },
      };
      persistSettings(updated);
      return { settings: updated };
    });
  },

  alignActiveGrids: (direction: 'left' | 'right' | 'horizontal') => {
    set((state) => {
      const activeIds = state.settings.activeGrids;
      if (activeIds.length === 0) return state;

      const newTransforms = { ...state.settings.gridTransforms };

      if (direction === 'right') {
        const windowW = typeof window !== 'undefined' ? window.innerWidth : 1280;
        let startY = 80;
        for (const id of activeIds) {
          const current = newTransforms[id] || { x: 100, y: 100, width: 340, height: 460, zIndex: 10 };
          newTransforms[id] = {
            ...current,
            x: Math.max(50, windowW - current.width - 24),
            y: startY,
          };
          startY += current.height + 12;
        }
      } else if (direction === 'left') {
        let startY = 80;
        for (const id of activeIds) {
          const current = newTransforms[id] || { x: 100, y: 100, width: 340, height: 460, zIndex: 10 };
          newTransforms[id] = {
            ...current,
            x: 80,
            y: startY,
          };
          startY += current.height + 12;
        }
      } else {
        // horizontal 并排对齐
        let startX = 80;
        for (const id of activeIds) {
          const current = newTransforms[id] || { x: 100, y: 100, width: 340, height: 460, zIndex: 10 };
          newTransforms[id] = {
            ...current,
            x: startX,
            y: 90,
          };
          startX += current.width + 16;
        }
      }

      const updated: DesktopWidgetSettings = {
        ...state.settings,
        gridTransforms: newTransforms,
      };
      persistSettings(updated);
      return { settings: updated };
    });
  },

  resetGridPositions: () => {
    set((state) => {
      const updated: DesktopWidgetSettings = {
        ...state.settings,
        gridTransforms: {
          inbox: { x: 70, y: 70, width: 320, height: 440, zIndex: 10 },
          tasks: { x: 410, y: 70, width: 340, height: 480, zIndex: 11 },
          session: { x: 770, y: 70, width: 320, height: 420, zIndex: 12 },
          timeline: { x: 70, y: 530, width: 340, height: 440, zIndex: 13 },
          notes: { x: 430, y: 530, width: 360, height: 460, zIndex: 14 },
          goals: { x: 810, y: 530, width: 340, height: 440, zIndex: 15 },
        },
      };
      persistSettings(updated);
      return { settings: updated };
    });
  },

  toggleGrid: (id: WidgetGridId) => {
    set((state) => {
      const isEnabled = state.settings.enabledGrids.includes(id);
      let newEnabled: WidgetGridId[];
      if (isEnabled) {
        if (state.settings.enabledGrids.length <= 1) return state;
        newEnabled = state.settings.enabledGrids.filter((g) => g !== id);
      } else {
        newEnabled = [...state.settings.enabledGrids, id];
      }
      const updated: DesktopWidgetSettings = {
        ...state.settings,
        enabledGrids: newEnabled,
      };
      persistSettings(updated);
      return { settings: updated };
    });
  },

  reorderGrids: (grids: WidgetGridId[]) => {
    set((state) => {
      const updated: DesktopWidgetSettings = {
        ...state.settings,
        enabledGrids: grids,
      };
      persistSettings(updated);
      return { settings: updated };
    });
  },

  moveGrid: (id: WidgetGridId, direction: 'up' | 'down') => {
    set((state) => {
      const grids = [...state.settings.enabledGrids];
      const index = grids.indexOf(id);
      if (index === -1) return state;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= grids.length) return state;

      const temp = grids[index];
      grids[index] = grids[targetIndex];
      grids[targetIndex] = temp;

      const updated: DesktopWidgetSettings = {
        ...state.settings,
        enabledGrids: grids,
      };
      persistSettings(updated);
      return { settings: updated };
    });
  },

  updateGridSettings: (id, updates) => {
    set((state) => {
      const currentGridSettings = state.settings.gridSettings[id];
      const updated: DesktopWidgetSettings = {
        ...state.settings,
        gridSettings: {
          ...state.settings.gridSettings,
          [id]: {
            ...currentGridSettings,
            ...updates,
          },
        },
      };
      persistSettings(updated);
      return { settings: updated };
    });
  },

  updateAppearance: (updates) => {
    set((state) => {
      const updated: DesktopWidgetSettings = {
        ...state.settings,
        appearance: {
          ...state.settings.appearance,
          ...updates,
        },
      };
      persistSettings(updated);
      return { settings: updated };
    });
  },

  setOpacity: (percent: number) => {
    set((state) => {
      const updated: DesktopWidgetSettings = {
        ...state.settings,
        opacityPercent: Math.max(40, Math.min(100, percent)),
      };
      persistSettings(updated);
      return { settings: updated };
    });
  },

  setLayoutMode: (mode) => {
    set((state) => {
      const updated: DesktopWidgetSettings = {
        ...state.settings,
        layoutMode: mode,
      };
      persistSettings(updated);
      return { settings: updated };
    });
  },

  setAlwaysOnTop: (alwaysOnTop: boolean) => {
    set((state) => {
      const updated: DesktopWidgetSettings = {
        ...state.settings,
        alwaysOnTop,
      };
      persistSettings(updated);
      return { settings: updated };
    });
  },

  resetToDefaults: () => {
    set(() => {
      persistSettings(DEFAULT_WIDGET_SETTINGS);
      return { settings: DEFAULT_WIDGET_SETTINGS };
    });
  },
}));

// 跨多窗口（主窗口与桌面挂件独立窗口）实时同步设置
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY_WIDGET && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        useWidgetStore.setState({
          settings: {
            ...DEFAULT_WIDGET_SETTINGS,
            ...parsed,
            appearance: {
              ...DEFAULT_APPEARANCE_SETTINGS,
              ...(parsed.appearance || {}),
            },
            gridSettings: {
              ...DEFAULT_WIDGET_SETTINGS.gridSettings,
              ...(parsed.gridSettings || {}),
            },
          },
        });
      } catch {
        // ignore
      }
    }
  });

  if ('__TAURI_INTERNALS__' in window) {
    import('@tauri-apps/api/event').then(({ listen }) => {
      listen<DesktopWidgetSettings>('tilo:widget-settings-updated', (event) => {
        if (event.payload) {
          useWidgetStore.setState({
            settings: {
              ...DEFAULT_WIDGET_SETTINGS,
              ...event.payload,
              appearance: {
                ...DEFAULT_APPEARANCE_SETTINGS,
                ...(event.payload.appearance || {}),
              },
              gridSettings: {
                ...DEFAULT_WIDGET_SETTINGS.gridSettings,
                ...(event.payload.gridSettings || {}),
              },
            },
          });
        }
      }).catch(() => {});
    }).catch(() => {});
  }
}
