import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TiloDB, ensureDefaultWorkspace } from '@/storage/db';
import {
  captureInboxItem,
  triageInboxItem,
  convertInboxToTask,
  convertInboxToNote,
  detectUrl,
} from '@/services/inboxCommands';

describe('Inbox Domain Commands', () => {
  let testDb: TiloDB;

  beforeEach(async () => {
    testDb = new TiloDB(`test-inbox-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`);
    await ensureDefaultWorkspace(testDb);
  });

  afterEach(async () => {
    await testDb.delete();
  });

  it('detects valid URLs accurately', () => {
    expect(detectUrl('https://dexie.org').isUrl).toBe(true);
    expect(detectUrl('https://dexie.org/docs').domain).toBe('dexie.org');
    expect(detectUrl('random thought about code').isUrl).toBe(false);
  });

  it('captures raw thoughts and links with kind classification', async () => {
    const raw = await captureInboxItem({ rawText: 'Remember to test Dexie' }, testDb);
    expect(raw.kind).toBe('unsorted');
    expect(raw.state).toBe('unsorted');

    const link = await captureInboxItem({ rawText: 'https://github.com/dexie/Dexie.js' }, testDb);
    expect(link.kind).toBe('link');
    expect(link.urlDomain).toBe('github.com');
  });

  it('triages items between unsorted, someday, and archived', async () => {
    const item = await captureInboxItem({ rawText: 'Someday idea' }, testDb);
    const someday = await triageInboxItem(item.id, 'someday', testDb);
    expect(someday.state).toBe('someday');

    const archived = await triageInboxItem(item.id, 'archived', testDb);
    expect(archived.state).toBe('archived');
  });

  it('converts an inbox item into a formal task', async () => {
    const item = await captureInboxItem({ rawText: 'Convert this to a task' }, testDb);
    const result = await convertInboxToTask(item.id, 'Formatted Task Title', undefined, '2026-08-21', testDb);

    expect(result.item.state).toBe('converted');
    expect(result.item.convertedEntityType).toBe('task');
    expect(result.item.convertedEntityId).toBe(result.task.id);
    expect(result.task.title).toBe('Formatted Task Title');
    expect(result.task.scheduledDate).toBe('2026-08-21');
  });

  it('converts an inbox item into a note', async () => {
    const item = await captureInboxItem({ rawText: 'Quick research note' }, testDb);
    const result = await convertInboxToNote(item.id, 'Research Note', '# Key Findings', undefined, undefined, testDb);

    expect(result.item.state).toBe('converted');
    expect(result.item.convertedEntityType).toBe('note');
    expect(result.note.title).toBe('Research Note');
    expect(result.note.bodyMarkdown).toBe('# Key Findings');
  });
});
