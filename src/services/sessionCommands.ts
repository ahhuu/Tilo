import { db, DEFAULT_WORKSPACE_ID, type TiloDB } from '@/storage/db';
import type { Session, SessionSegment, SessionKind, SessionSource, ActivityEvent } from '@/core/types/domain';

export interface StartSessionInput {
  taskId?: string;
  plannedBlockId?: string;
  projectId?: string;
  title?: string;
  kind?: SessionKind;
  source?: SessionSource;
  workspaceId?: string;
}

/**
 * Starts a new session with an initial active segment.
 */
export async function startSession(
  input: StartSessionInput,
  database: TiloDB = db
): Promise<Session> {
  const workspaceId = input.workspaceId || DEFAULT_WORKSPACE_ID;
  const now = Date.now();
  const sessionId = `sess-${now}-${Math.random().toString(36).substr(2, 9)}`;
  const segmentId = `seg-${now}-${Math.random().toString(36).substr(2, 9)}`;

  const session: Session = {
    id: sessionId,
    workspaceId,
    taskId: input.taskId,
    plannedBlockId: input.plannedBlockId,
    projectId: input.projectId,
    title: input.title || 'Focus session',
    kind: input.kind || 'active',
    source: input.source || 'timer',
    startedAt: now,
    activeDurationSeconds: 0,
    elapsedDurationSeconds: 0,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  const initialSegment: SessionSegment = {
    id: segmentId,
    workspaceId,
    sessionId,
    type: 'active',
    startAt: now,
  };

  const event: ActivityEvent = {
    id: `ev-${now}-${Math.random().toString(36).substr(2, 9)}`,
    workspaceId,
    entityType: 'session',
    entityId: sessionId,
    eventType: 'SESSION_STARTED',
    occurredAt: now,
    actor: 'user',
    payloadJson: { title: session.title, taskId: session.taskId, kind: session.kind },
  };

  await database.transaction(
    'rw',
    [database.sessions, database.sessionSegments, database.activityEvents],
    async () => {
      await database.sessions.put(session);
      await database.sessionSegments.put(initialSegment);
      await database.activityEvents.put(event);
    }
  );

  return session;
}

/**
 * Pauses a running session by closing the open active segment and opening a paused segment.
 */
export async function pauseSession(
  sessionId: string,
  database: TiloDB = db
): Promise<void> {
  const now = Date.now();
  const session = await database.sessions.get(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);

  await database.transaction(
    'rw',
    [database.sessions, database.sessionSegments, database.activityEvents],
    async () => {
      // Find open active segment
      const openActive = await database.sessionSegments
        .where('[workspaceId+sessionId]')
        .equals([session.workspaceId, sessionId])
        .and((s) => s.type === 'active' && !s.endAt)
        .first();

      if (openActive) {
        await database.sessionSegments.update(openActive.id, { endAt: now });
      }

      // Create new paused segment
      const pausedSegment: SessionSegment = {
        id: `seg-${now}-${Math.random().toString(36).substr(2, 9)}`,
        workspaceId: session.workspaceId,
        sessionId,
        type: 'paused',
        startAt: now,
      };
      await database.sessionSegments.put(pausedSegment);

      // Recalculate active duration
      const activeDurationSeconds = await calculateActiveDuration(session.workspaceId, sessionId, database);
      await database.sessions.update(sessionId, {
        activeDurationSeconds,
        updatedAt: now,
      });

      const event: ActivityEvent = {
        id: `ev-${now}-${Math.random().toString(36).substr(2, 9)}`,
        workspaceId: session.workspaceId,
        entityType: 'session',
        entityId: sessionId,
        eventType: 'SESSION_PAUSED',
        occurredAt: now,
        actor: 'user',
        payloadJson: { activeDurationSeconds },
      };
      await database.activityEvents.put(event);
    }
  );
}

/**
 * Resumes a paused session by closing the open paused segment and opening an active segment.
 */
export async function resumeSession(
  sessionId: string,
  database: TiloDB = db
): Promise<void> {
  const now = Date.now();
  const session = await database.sessions.get(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);

  await database.transaction(
    'rw',
    [database.sessions, database.sessionSegments, database.activityEvents],
    async () => {
      // Find open paused segment
      const openPaused = await database.sessionSegments
        .where('[workspaceId+sessionId]')
        .equals([session.workspaceId, sessionId])
        .and((s) => s.type === 'paused' && !s.endAt)
        .first();

      if (openPaused) {
        await database.sessionSegments.update(openPaused.id, { endAt: now });
      }

      // Create new active segment
      const activeSegment: SessionSegment = {
        id: `seg-${now}-${Math.random().toString(36).substr(2, 9)}`,
        workspaceId: session.workspaceId,
        sessionId,
        type: 'active',
        startAt: now,
      };
      await database.sessionSegments.put(activeSegment);

      await database.sessions.update(sessionId, { updatedAt: now });

      const event: ActivityEvent = {
        id: `ev-${now}-${Math.random().toString(36).substr(2, 9)}`,
        workspaceId: session.workspaceId,
        entityType: 'session',
        entityId: sessionId,
        eventType: 'SESSION_RESUMED',
        occurredAt: now,
        actor: 'user',
        payloadJson: { sessionId },
      };
      await database.activityEvents.put(event);
    }
  );
}

/**
 * Finishes a session, closes open segments, and calculates exact active & elapsed durations.
 */
export async function finishSession(
  sessionId: string,
  database: TiloDB = db
): Promise<Session> {
  const now = Date.now();
  const session = await database.sessions.get(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);

  let updatedSession: Session | undefined;

  await database.transaction(
    'rw',
    [database.sessions, database.sessionSegments, database.activityEvents],
    async () => {
      // Close any open segment
      const openSegment = await database.sessionSegments
        .where('[workspaceId+sessionId]')
        .equals([session.workspaceId, sessionId])
        .and((s) => !s.endAt)
        .first();

      if (openSegment) {
        await database.sessionSegments.update(openSegment.id, { endAt: now });
      }

      const activeDurationSeconds = await calculateActiveDuration(session.workspaceId, sessionId, database);
      const elapsedDurationSeconds = Math.max(0, Math.floor((now - session.startedAt) / 1000));

      updatedSession = {
        ...session,
        endedAt: now,
        activeDurationSeconds,
        elapsedDurationSeconds,
        updatedAt: now,
      };

      await database.sessions.put(updatedSession);

      const event: ActivityEvent = {
        id: `ev-${now}-${Math.random().toString(36).substr(2, 9)}`,
        workspaceId: session.workspaceId,
        entityType: 'session',
        entityId: sessionId,
        eventType: 'SESSION_FINISHED',
        occurredAt: now,
        actor: 'user',
        payloadJson: { activeDurationSeconds, elapsedDurationSeconds },
      };
      await database.activityEvents.put(event);
    }
  );

  return updatedSession!;
}

/**
 * Helper to sum all closed and open active segments for a session.
 */
async function calculateActiveDuration(
  workspaceId: string,
  sessionId: string,
  database: TiloDB
): Promise<number> {
  const segments = await database.sessionSegments
    .where('[workspaceId+sessionId]')
    .equals([workspaceId, sessionId])
    .toArray();

  let totalMs = 0;
  const now = Date.now();

  for (const seg of segments) {
    if (seg.type === 'active') {
      const end = seg.endAt || now;
      totalMs += Math.max(0, end - seg.startAt);
    }
  }

  return Math.floor(totalMs / 1000);
}

/**
 * Updates an existing Session (e.g. adjust start/end time, title, notes, or linked task/project).
 */
export async function updateSession(
  sessionId: string,
  updates: Partial<Omit<Session, 'id' | 'workspaceId' | 'createdAt'>>,
  database: TiloDB = db
): Promise<Session> {
  const session = await database.sessions.get(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);

  const now = Date.now();
  const updated: Session = {
    ...session,
    ...updates,
    updatedAt: now,
  };

  const event: ActivityEvent = {
    id: `ev-${now}-${Math.random().toString(36).substr(2, 9)}`,
    workspaceId: session.workspaceId,
    entityType: 'session',
    entityId: sessionId,
    eventType: 'SESSION_ADJUSTED',
    occurredAt: now,
    actor: 'user',
    payloadJson: { changes: updates },
  };

  await database.transaction('rw', [database.sessions, database.activityEvents], async () => {
    await database.sessions.put(updated);
    await database.activityEvents.put(event);
  });

  return updated;
}

/**
 * Deletes a session and its associated segments.
 */
export async function deleteSession(
  sessionId: string,
  database: TiloDB = db
): Promise<void> {
  const session = await database.sessions.get(sessionId);
  if (!session) return;

  await database.transaction('rw', [database.sessions, database.sessionSegments], async () => {
    await database.sessionSegments
      .where('[workspaceId+sessionId]')
      .equals([session.workspaceId, sessionId])
      .delete();
    await database.sessions.delete(sessionId);
  });
}
