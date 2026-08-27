import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pwaService } from '@/services/pwaService';
import { useUIStore } from '@/stores/uiStore';

describe('PWA Service & Smart Clipboard Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('detects standalone mode and installability properly', () => {
    expect(typeof pwaService.isStandalone()).toBe('boolean');
    expect(pwaService.isInstallable()).toBe(false); // No prompt event fired yet
  });

  it('handles subscription callbacks when installability changes', () => {
    const callback = vi.fn();
    const unsubscribe = pwaService.subscribe(callback);

    expect(callback).toHaveBeenCalledWith(false);

    unsubscribe();
  });

  it('supports opening quick task HUD with pre-filled clipboard initial value', () => {
    const { openQuickTaskHUD, closeQuickTaskHUD } = useUIStore.getState();

    openQuickTaskHUD('测试剪贴板任务 #研发 !high 45m');
    expect(useUIStore.getState().quickTaskHUDOpen).toBe(true);
    expect(useUIStore.getState().quickTaskInitialValue).toBe('测试剪贴板任务 #研发 !high 45m');

    closeQuickTaskHUD();
    expect(useUIStore.getState().quickTaskHUDOpen).toBe(false);
    expect(useUIStore.getState().quickTaskInitialValue).toBeUndefined();
  });
});
