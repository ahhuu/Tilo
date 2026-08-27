import type { PlannedBlock, PlannedBlockType, Session, SessionKind } from '@/core/types/domain';

export type TimelineFilter = 'all' | 'plan' | 'actual';

export interface TimelineEventLayoutItem {
  id: string;
  itemType: 'plan' | 'session';
  blockType?: PlannedBlockType;
  sessionKind?: SessionKind;
  title: string;
  startAt: number;
  endAt: number;
  durationSeconds: number;
  topPercent: number;
  heightPercent: number;
  leftOffsetPercent: number;
  widthPercent: number;
  isOverlapping: boolean;
  overlapGroupSize?: number;
  overlapIndex?: number;
  projectId?: string;
  taskId?: string;
  coalescedCount?: number;
  coalescedSessions?: Session[];
  originalEntity: PlannedBlock | Session;
}

export interface DailyCapacityConfig {
  weekdayMinutes: number; // e.g. 480 (8h)
  weekendMinutes: number; // e.g. 240 (4h)
  overrides: Record<string, number>; // dateStr -> minutes
}

export interface AllocationItem {
  id: string;
  name: string;
  color: string;
  durationSeconds: number;
  percentage: number;
}

export interface PlanActualComparison {
  planTitle: string;
  planStartAt: number;
  planEndAt: number;
  planDurationSeconds: number;
  actualDurationSeconds: number;
  diffSeconds: number; // actual - plan (positive = overrun, negative = under)
  sessionCount: number;
}
