import { describe, it, expect } from 'vitest';
import { parseQuickCaptureInput } from '@/services/nlpQuickCaptureParser';
import type { Project } from '@/core/types/domain';

describe('Natural Language Quick Capture Parser', () => {
  const mockProjects: Project[] = [
    {
      id: 'proj-1',
      workspaceId: 'default',
      primaryGoalId: 'goal-1',
      name: '核心架构',
      color: '#4f46e5',
      status: 'active',
      order: 1,
      createdAt: 1000,
      updatedAt: 1000,
      deletedAt: null,
    },
  ];

  it('parses full natural language input with priority, estimate, project and date', () => {
    const input = '重构音频模块 明天 14:00 45m p:核心架构 !high';
    const result = parseQuickCaptureInput(input, mockProjects);

    expect(result.title).toBe('重构音频模块');
    expect(result.priority).toBe('high');
    expect(result.estimateMinutes).toBe(45);
    expect(result.projectId).toBe('proj-1');
    expect(result.projectName).toBe('核心架构');
    expect(result.scheduledTime).toBe('14:00');
    expect(result.tokens.length).toBe(5);
  });

  it('parses Chinese natural language date and time', () => {
    const input = '准备季度复盘报告 下午3点 1.5h !urgent';
    const result = parseQuickCaptureInput(input, mockProjects);

    expect(result.title).toBe('准备季度复盘报告');
    expect(result.priority).toBe('urgent');
    expect(result.estimateMinutes).toBe(90);
    expect(result.scheduledTime).toBe('15:00');
  });

  it('gracefully handles simple task input without any modifiers', () => {
    const input = '买一杯冰美式咖啡';
    const result = parseQuickCaptureInput(input, mockProjects);

    expect(result.title).toBe('买一杯冰美式咖啡');
    expect(result.priority).toBe('medium');
    expect(result.estimateMinutes).toBeUndefined();
    expect(result.tokens.length).toBe(0);
  });
});
