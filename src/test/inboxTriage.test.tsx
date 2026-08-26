import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TiloDB, ensureDefaultWorkspace } from '@/storage/db';
import { captureInboxItem } from '@/services/inboxCommands';
import { ConvertToTaskModal } from '@/components/inbox/ConvertToTaskModal';
import { ConvertToNoteModal } from '@/components/inbox/ConvertToNoteModal';
import { InboxBatchBar } from '@/components/inbox/InboxBatchBar';
import type { PriorityLevel } from '@/core/types/domain';

describe('Inbox Triage and Conversion Components', () => {
  let testDb: TiloDB;

  beforeEach(async () => {
    testDb = new TiloDB(`test-inbox-ui-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`);
    await ensureDefaultWorkspace(testDb);
  });

  afterEach(async () => {
    await testDb.delete();
  });

  it('renders ConvertToTaskModal and submits formatted task data', async () => {
    const item = await captureInboxItem({ rawText: 'Draft release notes' }, testDb);

    let submittedData: {
      title: string;
      projectId?: string;
      scheduledDate?: string;
      priority?: PriorityLevel;
      estimateMinutes?: number;
    } | null = null;

    render(
      <ConvertToTaskModal
        item={item}
        projects={[]}
        onConvert={async (data) => {
          submittedData = data;
        }}
        onClose={() => {}}
      />
    );

    expect(screen.getByRole('heading', { name: /转化为待办任务|Convert to Task/ })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Draft release notes')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /确认转化为任务|Convert to Task/ });
    fireEvent.click(submitBtn);

    expect(submittedData).not.toBeNull();
    expect(submittedData!.title).toBe('Draft release notes');
  });

  it('renders ConvertToNoteModal and submits note data with markdown', async () => {
    const item = await captureInboxItem({ rawText: 'https://dexie.org' }, testDb);

    let submittedNote: {
      title: string;
      bodyMarkdown: string;
      projectId?: string;
      goalId?: string;
    } | null = null;

    render(
      <ConvertToNoteModal
        item={item}
        projects={[]}
        goals={[]}
        onConvert={async (data) => {
          submittedNote = data;
        }}
        onClose={() => {}}
      />
    );

    expect(screen.getByRole('heading', { name: /转化为笔记|Convert to Note/ })).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /确认转化为笔记|Convert to Note/ });
    fireEvent.click(submitBtn);

    expect(submittedNote).not.toBeNull();
    expect(submittedNote!.title).toBe('https://dexie.org');
  });

  it('renders InboxBatchBar and executes batch actions', () => {
    let archived = false;

    render(
      <InboxBatchBar
        selectedCount={3}
        onBatchArchive={async () => {
          archived = true;
        }}
        onBatchSomeday={async () => {}}
        onBatchDelete={async () => {}}
        onClearSelection={() => {}}
      />
    );

    expect(screen.getByText('3 items selected')).toBeInTheDocument();

    const archiveBtn = screen.getByRole('button', { name: /Archive/ });
    fireEvent.click(archiveBtn);
    expect(archived).toBe(true);
  });
});
