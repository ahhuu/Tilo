import { db, DEFAULT_WORKSPACE_ID, type TiloDB } from '@/storage/db';
import type { InboxItem, InboxItemKind, InboxItemState, Task, Note, ActivityEvent } from '@/core/types/domain';
import { createTask } from './taskCommands';

export interface CaptureInboxInput {
  rawText: string;
  workspaceId?: string;
}

export function detectUrl(text: string): { isUrl: boolean; url?: string; domain?: string } {
  try {
    const trimmed = text.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const parsed = new URL(trimmed);
      return { isUrl: true, url: trimmed, domain: parsed.hostname };
    }
  } catch {
    // not a valid url
  }
  return { isUrl: false };
}

/**
 * Fast capture of a raw thought/item into Inbox.
 */
export async function captureInboxItem(
  input: CaptureInboxInput,
  database: TiloDB = db
): Promise<InboxItem> {
  const workspaceId = input.workspaceId || DEFAULT_WORKSPACE_ID;
  const now = Date.now();
  const itemId = `inbox-${now}-${Math.random().toString(36).substr(2, 9)}`;

  const urlInfo = detectUrl(input.rawText);
  const kind: InboxItemKind = urlInfo.isUrl ? 'link' : 'unsorted';

  const item: InboxItem = {
    id: itemId,
    workspaceId,
    rawText: input.rawText.trim(),
    capturedAt: now,
    kind,
    state: 'unsorted',
    url: urlInfo.url,
    urlDomain: urlInfo.domain,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  const event: ActivityEvent = {
    id: `ev-${now}-${Math.random().toString(36).substr(2, 9)}`,
    workspaceId,
    entityType: 'inbox',
    entityId: itemId,
    eventType: 'INBOX_CAPTURED',
    occurredAt: now,
    actor: 'user',
    payloadJson: { rawText: item.rawText, kind: item.kind },
  };

  await database.transaction('rw', [database.inboxItems, database.activityEvents], async () => {
    await database.inboxItems.put(item);
    await database.activityEvents.put(event);
  });

  return item;
}

/**
 * Changes the state of an Inbox item (e.g. to 'someday' or 'archived').
 */
export async function triageInboxItem(
  itemId: string,
  state: InboxItemState,
  database: TiloDB = db
): Promise<InboxItem> {
  const now = Date.now();
  const item = await database.inboxItems.get(itemId);
  if (!item) throw new Error(`Inbox item ${itemId} not found`);

  const updated: InboxItem = { ...item, state, updatedAt: now };

  const event: ActivityEvent = {
    id: `ev-${now}-${Math.random().toString(36).substr(2, 9)}`,
    workspaceId: item.workspaceId,
    entityType: 'inbox',
    entityId: itemId,
    eventType: 'INBOX_TRIAGED',
    occurredAt: now,
    actor: 'user',
    payloadJson: { fromState: item.state, toState: state },
  };

  await database.transaction('rw', [database.inboxItems, database.activityEvents], async () => {
    await database.inboxItems.put(updated);
    await database.activityEvents.put(event);
  });

  return updated;
}

/**
 * Converts an Inbox item into a formal Task.
 */
export async function convertInboxToTask(
  itemId: string,
  taskTitle?: string,
  projectId?: string,
  scheduledDate?: string,
  database: TiloDB = db
): Promise<{ item: InboxItem; task: Task }> {
  const item = await database.inboxItems.get(itemId);
  if (!item) throw new Error(`Inbox item ${itemId} not found`);

  const task = await createTask(
    {
      title: taskTitle || item.rawText,
      projectId,
      scheduledDate,
      workspaceId: item.workspaceId,
    },
    database
  );

  const now = Date.now();
  const updatedItem: InboxItem = {
    ...item,
    state: 'converted',
    convertedEntityType: 'task',
    convertedEntityId: task.id,
    updatedAt: now,
  };

  await database.inboxItems.put(updatedItem);

  return { item: updatedItem, task };
}

/**
 * Converts an Inbox item into a Note.
 */
export async function convertInboxToNote(
  itemId: string,
  title: string,
  bodyMarkdown: string,
  projectId?: string,
  goalId?: string,
  database: TiloDB = db
): Promise<{ item: InboxItem; note: Note }> {
  const item = await database.inboxItems.get(itemId);
  if (!item) throw new Error(`Inbox item ${itemId} not found`);

  const now = Date.now();
  const noteId = `note-${now}-${Math.random().toString(36).substr(2, 9)}`;

  const note: Note = {
    id: noteId,
    workspaceId: item.workspaceId,
    title: title.trim(),
    bodyMarkdown,
    projectId,
    goalId,
    tagIds: [],
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  const updatedItem: InboxItem = {
    ...item,
    state: 'converted',
    convertedEntityType: 'note',
    convertedEntityId: note.id,
    updatedAt: now,
  };

  await database.transaction('rw', [database.inboxItems, database.notes], async () => {
    await database.notes.put(note);
    await database.inboxItems.put(updatedItem);
  });

  return { item: updatedItem, note };
}

import { timeService } from '@/core/time/timeService';
import { setDailyFocusTasks } from './planCommands';

/**
 * Quick converts an Inbox item to a Task scheduled for Today and adds to Daily Focus.
 */
export async function convertInboxToTodayTask(
  itemId: string,
  database: TiloDB = db
): Promise<{ item: InboxItem; task: Task }> {
  const item = await database.inboxItems.get(itemId);
  if (!item) throw new Error(`Inbox item ${itemId} not found`);

  const logicalDate = timeService.getLogicalDate();
  const res = await convertInboxToTask(itemId, item.rawText, undefined, logicalDate, database);

  // Automatically append to today's Daily Focus for instant top visibility
  try {
    const existingFocus = await database.dailyFocus
      .where('[workspaceId+logicalDate]')
      .equals([item.workspaceId || DEFAULT_WORKSPACE_ID, logicalDate])
      .sortBy('rank');

    if (existingFocus.length < 5) {
      const focusIds = [...existingFocus.map((f) => f.taskId), res.task.id];
      await setDailyFocusTasks(logicalDate, focusIds, item.workspaceId || DEFAULT_WORKSPACE_ID, database);
    }
  } catch {
    // ignore focus append error
  }

  return res;
}

/**
 * Quick converts an Inbox item to a Task scheduled for this week.
 */
export async function convertInboxToThisWeekTask(
  itemId: string,
  database: TiloDB = db
): Promise<{ item: InboxItem; task: Task }> {
  const item = await database.inboxItems.get(itemId);
  if (!item) throw new Error(`Inbox item ${itemId} not found`);

  const logicalDate = timeService.getLogicalDate();
  return convertInboxToTask(itemId, item.rawText, undefined, logicalDate, database);
}

/**
 * Marks an Inbox item's kind as idea and retains it in Someday.
 */
export async function markInboxAsIdea(
  itemId: string,
  database: TiloDB = db
): Promise<InboxItem> {
  const item = await database.inboxItems.get(itemId);
  if (!item) throw new Error(`Inbox item ${itemId} not found`);

  const updated: InboxItem = {
    ...item,
    kind: 'idea',
    state: 'someday',
    updatedAt: Date.now(),
  };

  await database.inboxItems.put(updated);
  return updated;
}
