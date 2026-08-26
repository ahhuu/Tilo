import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useI18n } from '@/core/i18n';
import { useUIStore } from '@/stores/uiStore';

describe('i18n Language System', () => {
  it('defaults to zh-CN and translates keys correctly', () => {
    const { result } = renderHook(() => useI18n());

    expect(result.current.language).toBe('zh-CN');
    expect(result.current.t('nav.today')).toBe('今日');
    expect(result.current.t('nav.inbox')).toBe('收集箱');
    expect(result.current.t('settings.language')).toBe('界面语言');
  });

  it('switches to en-US and returns English strings', () => {
    const { result } = renderHook(() => useI18n());

    act(() => {
      result.current.setLanguage('en-US');
    });

    expect(useUIStore.getState().language).toBe('en-US');
    expect(result.current.t('nav.today')).toBe('Today');
    expect(result.current.t('nav.inbox')).toBe('Inbox');
    expect(result.current.t('settings.language')).toBe('Language');

    // Switch back to zh-CN
    act(() => {
      result.current.setLanguage('zh-CN');
    });
    expect(result.current.language).toBe('zh-CN');
  });
});
