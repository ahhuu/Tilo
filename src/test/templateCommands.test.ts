import { describe, it, expect, beforeEach } from 'vitest';
import { TiloDB } from '@/storage/db';
import {
  ensureTemplatesInitialized,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  resetTemplatesToDefault,
} from '@/services/templateCommands';

describe('Template Commands & Persistence', () => {
  let testDb: TiloDB;

  beforeEach(async () => {
    testDb = new TiloDB(`test_tilo_tmpl_${Date.now()}_${Math.random()}`);
    await testDb.open();
    await ensureTemplatesInitialized(testDb);
  });

  it('initializes default task and review reflection templates', async () => {
    const templates = await testDb.templates.toArray();
    expect(templates.length).toBeGreaterThan(0);

    const taskTemplates = templates.filter((t) => t.kind === 'task');
    const reflectionTemplates = templates.filter((t) => t.kind === 'reviewReflection');

    expect(taskTemplates.length).toBeGreaterThan(0);
    expect(reflectionTemplates.length).toBeGreaterThan(0);
  });

  it('creates, updates, and deletes custom templates', async () => {
    const tmpl = await createTemplate(
      {
        kind: 'task',
        name: 'Backend API Endpoint',
        payload: {
          title: 'Build API: ',
          priority: 'high',
          estimateMinutes: 60,
          progressMode: 'subtasks',
          subtaskTitles: ['Schema design', 'Route handler', 'Unit tests'],
        },
      },
      testDb
    );

    expect(tmpl.id).toBeDefined();
    const loaded = await testDb.templates.get(tmpl.id);
    expect(loaded?.name).toBe('Backend API Endpoint');

    await updateTemplate(tmpl.id, { name: 'REST API Endpoint' }, testDb);
    const updated = await testDb.templates.get(tmpl.id);
    expect(updated?.name).toBe('REST API Endpoint');

    await deleteTemplate(tmpl.id, testDb);
    const deleted = await testDb.templates.get(tmpl.id);
    expect(deleted).toBeUndefined();
  });

  it('resets templates to defaults', async () => {
    await resetTemplatesToDefault(testDb);
    const count = await testDb.templates.count();
    expect(count).toBeGreaterThan(0);
  });
});
