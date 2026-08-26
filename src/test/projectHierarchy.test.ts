import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TiloDB, ensureDefaultWorkspace } from '@/storage/db';
import { createGoal } from '@/services/goalCommands';
import { createProject, createMilestone } from '@/services/projectCommands';

describe('Project Hierarchy and Milestone Engine', () => {
  let testDb: TiloDB;

  beforeEach(async () => {
    testDb = new TiloDB(`test-projhier-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`);
    await ensureDefaultWorkspace(testDb);
  });

  afterEach(async () => {
    await testDb.delete();
  });

  it('supports one primary goal and multiple related goals on projects', async () => {
    const primaryGoal = await createGoal({ title: 'Primary Goal' }, testDb);
    const relatedGoal = await createGoal({ title: 'Related Goal' }, testDb);

    const project = await createProject(
      {
        name: 'Core Architecture',
        color: '#4f46e5',
        primaryGoalId: primaryGoal.id,
        relatedGoalIds: [relatedGoal.id],
      },
      testDb
    );

    expect(project.primaryGoalId).toBe(primaryGoal.id);
    expect(project.relatedGoalIds).toContain(relatedGoal.id);
  });

  it('supports standalone projects without any goal attached', async () => {
    const standalone = await createProject(
      {
        name: 'Internal Maintenance',
        color: '#64748b',
      },
      testDb
    );

    expect(standalone.primaryGoalId).toBeUndefined();
    expect(standalone.relatedGoalIds?.length).toBe(0);
  });

  it('manages milestone lifecycle and ordering within project', async () => {
    const project = await createProject({ name: 'Launch App', color: '#10b981' }, testDb);

    const m1 = await createMilestone(project.id, 'Alpha Release', '2026-08-30', testDb);
    const m2 = await createMilestone(project.id, 'Beta Release', '2026-09-15', testDb);

    expect(m1.order).toBe(0);
    expect(m2.order).toBe(1);
    expect(m1.status).toBe('planned');

    // Transition milestone status
    await testDb.milestones.update(m1.id, { status: 'active' });
    const active = await testDb.milestones.get(m1.id);
    expect(active?.status).toBe('active');
  });
});
