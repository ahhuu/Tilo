import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppearanceSection } from '@/components/settings/AppearanceSection';
import { MotionSection } from '@/components/settings/MotionSection';
import { TimeSection } from '@/components/settings/TimeSection';
import { ShortcutsSection } from '@/components/settings/ShortcutsSection';
import { useUIStore } from '@/stores/uiStore';

describe('Settings Components', () => {
  it('renders AppearanceSection and allows theme and density switching', () => {
    render(<AppearanceSection />);

    expect(screen.getByText('界面语言')).toBeInTheDocument();
    expect(screen.getByText('界面主题')).toBeInTheDocument();
    expect(screen.getByText('排版紧凑度')).toBeInTheDocument();

    const darkBtn = screen.getByRole('button', { name: /深色/ });
    fireEvent.click(darkBtn);
    expect(useUIStore.getState().theme).toBe('dark');

    const compactBtn = screen.getByRole('button', { name: /紧凑/ });
    fireEvent.click(compactBtn);
    expect(useUIStore.getState().density).toBe('compact');
  });

  it('renders MotionSection and allows setting motion levels', () => {
    render(<MotionSection />);

    expect(screen.getByText(/动效与动画令牌|Motion & Animations/)).toBeInTheDocument();

    const subtleBtn = screen.getByRole('button', { name: /微动效|Subtle/ });
    fireEvent.click(subtleBtn);
    expect(useUIStore.getState().motionLevel).toBe('subtle');
  });

  it('renders TimeSection and ShortcutsSection correctly', () => {
    render(<TimeSection />);
    expect(screen.getByText(/自然日与跨日时间分割点|Logical Day & Time Cutoffs/)).toBeInTheDocument();

    render(<ShortcutsSection />);
    expect(screen.getByText(/键盘快捷键速查|Keyboard Shortcuts/)).toBeInTheDocument();
    expect(screen.getByText(/打开快捷命令面板|Open Command Palette/)).toBeInTheDocument();
  });
});
