import React, { useCallback, useRef, useState } from 'react';
import { db } from '@/storage/db';
import { snapTimestamp } from '@/core/timeline/timelineEngine';
import { nativeService } from '@/services/nativeService';
import type { PlannedBlock, Task } from '@/core/types/domain';

export interface ResizeDragState {
  blockId: string;
  edge: 'top' | 'bottom' | 'move';
  initialStartAt: number;
  initialEndAt: number;
  currentStartAt: number;
  currentEndAt: number;
}

interface UseTimelineGesturesArgs {
  gridRef: React.RefObject<HTMLDivElement | null>;
  startOfDayMs: number;
  startHour: number;
  totalRangeMs: number;
  taskMap: Map<string, Task>;
  onUpdatePlannedBlock?: (
    blockId: string,
    updates: Partial<Omit<PlannedBlock, 'id' | 'workspaceId' | 'createdAt'>>
  ) => Promise<PlannedBlock>;
  onCreatePlannedBlock?: (data: {
    title: string;
    type: PlannedBlock['type'];
    startAt: number;
    endAt: number;
    taskId?: string;
    projectId?: string;
  }) => Promise<PlannedBlock>;
  onInspectBlock?: (block: PlannedBlock) => void;
  setCreateDraftRange: (range: { startAt: number; endAt: number } | null) => void;
}

const LONG_PRESS_MS = 250;
const MIN_BLOCK_MS = 900000; // 15m
const DEFAULT_DURATION_MS = 1800000; // 30m

/**
 * 时间轴网格上的指针交互：
 * 空网格框选创建、触屏长按创建、时间块上下边拖拽改期，以及未排期任务拖入。
 */
export const useTimelineGestures = ({
  gridRef,
  startOfDayMs,
  startHour,
  totalRangeMs,
  taskMap,
  onUpdatePlannedBlock,
  onCreatePlannedBlock,
  onInspectBlock,
  setCreateDraftRange,
}: UseTimelineGesturesArgs) => {
  const [isDragCreating, setIsDragCreating] = useState(false);
  const [dragCreateStartMs, setDragCreateStartMs] = useState<number | null>(null);
  const [dragCreateCurrentMs, setDragCreateCurrentMs] = useState<number | null>(null);
  const [activeResizeBlock, setActiveResizeBlock] = useState<ResizeDragState | null>(null);

  const pointerDownYRef = useRef<number>(0);
  const pointerDownTimeRef = useRef<number>(0);
  // 触屏长按框选：延迟触发与待定态
  const longPressTimerRef = useRef<number | null>(null);
  const pendingCreateRef = useRef<{ startMs: number } | null>(null);

  // Helper to convert Pointer Y to timestamp ms snapped to 15m
  const getTimeFromPointerY = useCallback(
    (clientY: number): number => {
      if (!gridRef.current) return startOfDayMs + startHour * 3600000;
      const rect = gridRef.current.getBoundingClientRect();
      const relativeY = Math.max(0, Math.min(rect.height, clientY - rect.top));
      const percent = relativeY / rect.height;
      const rawMs = startOfDayMs + startHour * 3600000 + percent * totalRangeMs;
      return snapTimestamp(rawMs, 15);
    },
    [gridRef, startOfDayMs, startHour, totalRangeMs]
  );

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleGridPointerDown = (e: React.PointerEvent) => {
    if (e.target !== gridRef.current && !(e.target as HTMLElement).classList.contains('timeline-slot-bg')) {
      return;
    }
    pointerDownYRef.current = e.clientY;
    pointerDownTimeRef.current = Date.now();
    const snappedMs = getTimeFromPointerY(e.clientY);

    // 触屏：先长按 250ms 再进入框选创建，避免与纵向滚动冲突；
    // 期间手指移动超过阈值则取消（视为滚动页面）。
    if (e.pointerType === 'touch') {
      pendingCreateRef.current = { startMs: snappedMs };
      longPressTimerRef.current = window.setTimeout(() => {
        if (pendingCreateRef.current) {
          setIsDragCreating(true);
          setDragCreateStartMs(snappedMs);
          setDragCreateCurrentMs(snappedMs + DEFAULT_DURATION_MS);
          pendingCreateRef.current = null;
        }
      }, LONG_PRESS_MS);
      return;
    }

    // 鼠标 / 触控笔：保持即时框选（桌面体验一致）
    setIsDragCreating(true);
    setDragCreateStartMs(snappedMs);
    setDragCreateCurrentMs(snappedMs + DEFAULT_DURATION_MS);
  };

  const handleGridPointerMove = (e: React.PointerEvent) => {
    // 触屏待定态：移动超阈值即取消长按（放行滚动）
    if (pendingCreateRef.current && !isDragCreating) {
      const dy = Math.abs(e.clientY - pointerDownYRef.current);
      if (dy > 10) {
        clearLongPressTimer();
        pendingCreateRef.current = null;
      }
      return;
    }
    if (isDragCreating && dragCreateStartMs !== null) {
      const snappedMs = getTimeFromPointerY(e.clientY);
      setDragCreateCurrentMs(snappedMs);
    } else if (activeResizeBlock) {
      const currentMs = getTimeFromPointerY(e.clientY);
      if (activeResizeBlock.edge === 'bottom') {
        const newEndAt = Math.max(activeResizeBlock.initialStartAt + MIN_BLOCK_MS, currentMs);
        setActiveResizeBlock((prev) => prev && { ...prev, currentEndAt: newEndAt });
      } else if (activeResizeBlock.edge === 'top') {
        const newStartAt = Math.min(activeResizeBlock.initialEndAt - MIN_BLOCK_MS, currentMs);
        setActiveResizeBlock((prev) => prev && { ...prev, currentStartAt: newStartAt });
      } else if (activeResizeBlock.edge === 'move') {
        const blockDuration = activeResizeBlock.initialEndAt - activeResizeBlock.initialStartAt;
        const newStartAt = currentMs;
        const newEndAt = newStartAt + blockDuration;
        setActiveResizeBlock((prev) => prev && { ...prev, currentStartAt: newStartAt, currentEndAt: newEndAt });
      }
    }
  };

  // 触屏中断（浏览器判定为滚动/被其它手势抢占）时复位所有交互态，避免幽灵选区
  const handleGridPointerCancel = () => {
    clearLongPressTimer();
    pendingCreateRef.current = null;
    setIsDragCreating(false);
    setActiveResizeBlock(null);
    setDragCreateStartMs(null);
    setDragCreateCurrentMs(null);
  };

  const handleGridPointerUp = (e: React.PointerEvent) => {
    // 触屏轻点（长按计时器尚未触发）：视为在该时刻快速创建 30 分钟时间块
    if (pendingCreateRef.current && !isDragCreating) {
      const startMs = pendingCreateRef.current.startMs;
      clearLongPressTimer();
      pendingCreateRef.current = null;
      setCreateDraftRange({ startAt: startMs, endAt: startMs + DEFAULT_DURATION_MS });
      return;
    }
    if (isDragCreating && dragCreateStartMs !== null) {
      const deltaY = Math.abs(e.clientY - pointerDownYRef.current);
      const deltaTime = Date.now() - pointerDownTimeRef.current;
      // 轻触 (Tap) 或极微小的滑动直接判定为在该时间段快速创建 30 分钟时间块
      if (deltaY < 12 || deltaTime < 250) {
        setCreateDraftRange({
          startAt: dragCreateStartMs,
          endAt: dragCreateStartMs + DEFAULT_DURATION_MS,
        });
      } else {
        const currentMs = dragCreateCurrentMs ?? dragCreateStartMs + DEFAULT_DURATION_MS;
        const startAt = Math.min(dragCreateStartMs, currentMs);
        const endAt = Math.max(
          startAt + MIN_BLOCK_MS, // min 15m
          Math.max(dragCreateStartMs, currentMs)
        );
        setCreateDraftRange({ startAt, endAt });
      }
      setIsDragCreating(false);
      setDragCreateStartMs(null);
      setDragCreateCurrentMs(null);
      nativeService.hapticImpact('light');
    } else if (activeResizeBlock) {
      if (onUpdatePlannedBlock) {
        onUpdatePlannedBlock(activeResizeBlock.blockId, {
          startAt: activeResizeBlock.currentStartAt,
          endAt: activeResizeBlock.currentEndAt,
        });
      }
      setActiveResizeBlock(null);
      nativeService.hapticImpact('light');
    }
  };

  // Drop target for dragging unscheduled task directly into timeline
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('application/json-task-id') || e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    let task = taskMap.get(taskId);
    if (!task) {
      task = await db.tasks.get(taskId);
    }
    if (!task) return;

    const snappedStartAt = getTimeFromPointerY(e.clientY);
    const durationMinutes = task.estimateMinutes && task.estimateMinutes > 0 ? task.estimateMinutes : 30;
    const endAt = snappedStartAt + durationMinutes * 60000;

    if (onCreatePlannedBlock) {
      const created = await onCreatePlannedBlock({
        title: task.title,
        type: 'task',
        startAt: snappedStartAt,
        endAt,
        taskId: task.id,
        projectId: task.projectId,
      });
      // If missing estimate, highlight block for immediate adjustment
      if (!task.estimateMinutes) {
        onInspectBlock?.(created);
      }
    }
  };

  /** 时间块上下边把手按下：进入 resizing 态 */
  const handleResizeStart = ({
    blockId,
    edge,
    initialStartAt,
    initialEndAt,
  }: {
    blockId: string;
    edge: 'top' | 'bottom';
    initialStartAt: number;
    initialEndAt: number;
  }) => {
    setActiveResizeBlock({
      blockId,
      edge,
      initialStartAt,
      initialEndAt,
      currentStartAt: initialStartAt,
      currentEndAt: initialEndAt,
    });
  };

  return {
    isDragCreating,
    dragCreateStartMs,
    dragCreateCurrentMs,
    activeResizeBlock,
    getTimeFromPointerY,
    handleGridPointerDown,
    handleGridPointerMove,
    handleGridPointerCancel,
    handleGridPointerUp,
    handleDragOver,
    handleDrop,
    handleResizeStart,
  };
};
