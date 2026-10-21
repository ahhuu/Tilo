import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('Tilo Application Bootstrap & Routing', () => {
  it('renders application navigation and default Today view', () => {
    render(<App />);
    expect(screen.getAllByText('今日')[0]).toBeInTheDocument();
    expect(screen.getAllByText('收集箱')[0]).toBeInTheDocument();
    expect(screen.getAllByText('日历')[0]).toBeInTheDocument();
    // The sidebar now exposes separate "项目" (Projects) and "目标" (Goals) items
    // instead of the legacy combined "目标与项目" entry.
    expect(screen.getAllByText('项目')[0]).toBeInTheDocument();
    expect(screen.getAllByText('目标')[0]).toBeInTheDocument();
  });
});
