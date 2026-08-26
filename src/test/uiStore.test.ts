import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '@/stores/uiStore';

describe('uiStore & Theme/Density/Motion Engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('updates and persists theme preferences', () => {
    const { setTheme } = useUIStore.getState();
    setTheme('dark');
    expect(useUIStore.getState().theme).toBe('dark');
    expect(localStorage.getItem('tilo_theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    setTheme('light');
    expect(useUIStore.getState().theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('updates and applies density modes to DOM', () => {
    const { setDensity } = useUIStore.getState();
    setDensity('compact');
    expect(useUIStore.getState().density).toBe('compact');
    expect(document.documentElement.getAttribute('data-density')).toBe('compact');

    setDensity('comfortable');
    expect(useUIStore.getState().density).toBe('comfortable');
    expect(document.documentElement.getAttribute('data-density')).toBe('comfortable');
  });

  it('updates motion levels and handles override attribute', () => {
    const { setMotionLevel } = useUIStore.getState();
    setMotionLevel('reduced');
    expect(useUIStore.getState().motionLevel).toBe('reduced');
    expect(document.documentElement.getAttribute('data-motion')).toBe('reduced');
    expect(document.documentElement.getAttribute('data-motion-override')).toBe('true');

    setMotionLevel('balanced');
    expect(document.documentElement.getAttribute('data-motion')).toBe('balanced');
    expect(document.documentElement.getAttribute('data-motion-override')).toBeNull();
  });

  it('toggles sidebar and persists state', () => {
    const { toggleSidebar } = useUIStore.getState();
    const initial = useUIStore.getState().sidebarCollapsed;
    toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(!initial);
  });

  it('manages toast notifications and undo callbacks', () => {
    let undone = false;
    const { addToast, undoLastToast } = useUIStore.getState();

    const id = addToast({
      message: 'Test message',
      type: 'info',
      undoAction: () => {
        undone = true;
      },
    });

    expect(useUIStore.getState().toasts.some((t) => t.id === id)).toBe(true);

    undoLastToast();
    expect(undone).toBe(true);
    expect(useUIStore.getState().toasts.some((t) => t.id === id)).toBe(false);
  });
});
