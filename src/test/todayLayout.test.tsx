import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TodayLayoutCustomizer } from '@/components/today/TodayLayoutCustomizer';
import {
  DEFAULT_TODAY_LAYOUT_CONFIG,
  type TodayLayoutConfig,
} from '@/components/today/todayLayoutTypes';

describe('TodayLayoutCustomizer Component', () => {
  it('renders widget toggles, focus limits, and calls onChange and onReset', () => {
    const handleChange = vi.fn();
    const handleReset = vi.fn();
    const handleClose = vi.fn();

    const config: TodayLayoutConfig = { ...DEFAULT_TODAY_LAYOUT_CONFIG };

    render(
      <TodayLayoutCustomizer
        isOpen={true}
        onClose={handleClose}
        config={config}
        onChange={handleChange}
        onReset={handleReset}
      />
    );

    expect(screen.getByRole('dialog', { name: /Customize Today Layout/i })).toBeInTheDocument();

    // Click Reset to Default button
    const resetButton = screen.getByText(/重置为默认布局|Reset to Default/i);
    fireEvent.click(resetButton);
    expect(handleReset).toHaveBeenCalledTimes(1);

    // Toggle a widget
    const weeklyFocusToggle = screen.getByText(/本周核心战略目标|Weekly Focus/i);
    fireEvent.click(weeklyFocusToggle);
    expect(handleChange).toHaveBeenCalled();

    // Change focus limit
    const focus5Button = screen.getByText('5');
    fireEvent.click(focus5Button);
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        focusCountLimit: 5,
      })
    );
  });
});
