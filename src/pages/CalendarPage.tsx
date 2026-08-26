import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/storage/db';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { timeService } from '@/core/time/timeService';
import {
  createPlannedBlock,
  deletePlannedBlock,
} from '@/services/planCommands';
import { calculateAllocationBreakdown } from '@/core/timeline/timelineEngine';
import { DayView } from '@/components/calendar/DayView';
import { WeekView } from '@/components/calendar/WeekView';
import { AgendaView } from '@/components/calendar/AgendaView';
import { SidePlanningDrawer } from '@/components/calendar/SidePlanningDrawer';
import { AllocationDrawer } from '@/components/timeline/AllocationDrawer';
import { CreatePlannedBlockModal } from '@/components/calendar/CreatePlannedBlockModal';
import { Button } from '@/components/ui/Button';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Layers,
  Plus,
  PieChart,
} from 'lucide-react';
import { addDays, subDays, format } from 'date-fns';
import type { Task, PlannedBlock, Session } from '@/core/types/domain';
import type { TimelineFilter, DailyCapacityConfig } from '@/core/timeline/types';

export const CalendarPage: React.FC = () => {
  const { t, language } = useI18n();
  const {
    calendarViewMode,
    setCalendarViewMode,
    calendarDaysCount,
    setCalendarDaysCount,
    calendarPlanningDrawerOpen,
    toggleCalendarPlanningDrawer,
    openInspector,
    addToast,
  } = useUIStore();

  const [currentDateMs, setCurrentDateMs] = useState<number>(() => Date.now());
  const [modalSlot, setModalSlot] = useState<{ dateStr: string; hour: number } | null>(null);
  const [filter, setFilter] = useState<TimelineFilter>('all');
  const [allocationDrawerOpen, setAllocationDrawerOpen] = useState(false);

  // Capacity overrides
  const [capacityConfig, setCapacityConfig] = useState<DailyCapacityConfig>({
    weekdayMinutes: 480, // 8h
    weekendMinutes: 240, // 4h
    overrides: {},
  });

  const logicalDate = timeService.getLogicalDate(currentDateMs);

  // Live queries
  const allTasks = useLiveQuery(() => db.tasks.toArray(), []) || [];
  const allProjects = useLiveQuery(() => db.projects.toArray(), []) || [];
  const allGoals = useLiveQuery(() => db.goals.toArray(), []) || [];
  const plannedBlocks = useLiveQuery(() => db.plannedBlocks.toArray(), []) || [];
  const sessions = useLiveQuery(() => db.sessions.toArray(), []) || [];

  const projectMap = new Map(allProjects.map((p) => [p.id, p]));

  // Calculate allocation breakdown
  const { projectAllocations, goalAllocations } = calculateAllocationBreakdown(
    plannedBlocks,
    sessions,
    allProjects,
    allGoals
  );

  // Navigation handlers
  const handlePrev = () => {
    if (calendarViewMode === 'day') {
      setCurrentDateMs((prev) => subDays(new Date(prev), 1).getTime());
    } else {
      setCurrentDateMs((prev) => subDays(new Date(prev), 7).getTime());
    }
  };

  const handleNext = () => {
    if (calendarViewMode === 'day') {
      setCurrentDateMs((prev) => addDays(new Date(prev), 1).getTime());
    } else {
      setCurrentDateMs((prev) => addDays(new Date(prev), 7).getTime());
    }
  };

  const handleToday = () => {
    setCurrentDateMs(Date.now());
  };

  const handleCreateBlock = async (params: {
    title: string;
    startAt: number;
    endAt: number;
    taskId?: string;
    projectId?: string;
  }) => {
    await createPlannedBlock({
      type: 'task',
      title: params.title,
      startAt: params.startAt,
      endAt: params.endAt,
      taskId: params.taskId,
      projectId: params.projectId,
    });
    addToast({
      message: language === 'zh-CN' ? `已创建排期时间块 "${params.title}"` : `Planned block "${params.title}" created`,
      type: 'success',
    });
  };

  const handleDeleteBlock = async (blockId: string) => {
    await deletePlannedBlock(blockId);
    addToast({
      message: language === 'zh-CN' ? '已删除排期时间块' : 'Planned block deleted',
      type: 'info',
    });
  };

  const handleInspectTask = (task: Task) => {
    openInspector({
      type: 'task',
      id: task.id,
      title: task.title,
    });
  };

  const handleInspectBlock = (block: PlannedBlock) => {
    openInspector({
      type: 'block',
      id: block.id,
      title: block.title || 'Planned Block',
      data: { block },
    });
  };

  const handleInspectSession = (session: Session) => {
    openInspector({
      type: 'session',
      id: session.id,
      title: session.title || 'Session',
      data: { session },
    });
  };

  const handlePlanTaskFromDrawer = () => {
    setModalSlot({ dateStr: logicalDate, hour: 10 });
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Calendar Main Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 overflow-y-auto">
        {/* Calendar Header Controls */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs z-10 select-none">
          {/* Navigation & Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title={language === 'zh-CN' ? '上一页' : 'Previous'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleToday}
                className="h-6 px-2 text-xs font-semibold cursor-pointer"
              >
                {t('today.title')}
              </Button>
              <button
                type="button"
                onClick={handleNext}
                className="p-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title={language === 'zh-CN' ? '下一页' : 'Next'}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>
                {calendarViewMode === 'day'
                  ? timeService.formatDateHeader(logicalDate, language)
                  : language === 'zh-CN'
                    ? format(new Date(currentDateMs), 'yyyy年MM月')
                    : format(new Date(currentDateMs), 'MMMM yyyy')}
              </span>
            </h2>
          </div>

          {/* View Mode & Planning Drawer Switcher */}
          <div className="flex items-center gap-2">
            {/* 5 / 7 Days Toggle for Week View */}
            {calendarViewMode === 'week' && (
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setCalendarDaysCount(5)}
                  className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                    calendarDaysCount === 5
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  {language === 'zh-CN' ? '5 天' : '5 Days'}
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarDaysCount(7)}
                  className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                    calendarDaysCount === 7
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  {language === 'zh-CN' ? '7 天' : '7 Days'}
                </button>
              </div>
            )}

            {/* View Mode (Day / Week / Agenda) */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 text-xs font-medium">
              {(
                [
                  { id: 'day', label: t('calendar.day') },
                  { id: 'week', label: t('calendar.week') },
                  { id: 'agenda', label: t('calendar.agenda') },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setCalendarViewMode(mode.id)}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    calendarViewMode === mode.id
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Time Allocation Drawer Toggle */}
            <Button
              size="sm"
              variant={allocationDrawerOpen ? 'secondary' : 'outline'}
              onClick={() => setAllocationDrawerOpen((prev) => !prev)}
              className="h-7 text-xs gap-1 cursor-pointer"
              title={language === 'zh-CN' ? '时间分配与目标进展洞察' : 'Time Allocation Insights'}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>{language === 'zh-CN' ? '时间分配' : 'Allocation'}</span>
            </Button>

            {/* Planning Drawer Toggle */}
            <Button
              size="sm"
              variant={calendarPlanningDrawerOpen ? 'secondary' : 'outline'}
              onClick={toggleCalendarPlanningDrawer}
              className="h-7 text-xs gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{language === 'zh-CN' ? '排期抽屉' : 'Planning'}</span>
            </Button>

            {/* New Block Button */}
            <Button
              size="sm"
              variant="primary"
              onClick={() => setModalSlot({ dateStr: logicalDate, hour: 9 })}
              className="h-7 text-xs gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'zh-CN' ? '新建时间块' : 'Plan Block'}</span>
            </Button>
          </div>
        </div>

        {/* Selected View Rendering */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {calendarViewMode === 'day' && (
            <DayView
              dateStr={logicalDate}
              plannedBlocks={plannedBlocks}
              sessions={sessions}
              tasks={allTasks}
              projects={allProjects}
              filter={filter}
              onFilterChange={setFilter}
              capacityConfig={capacityConfig}
              onUpdateCapacityOverride={(d, mins) =>
                setCapacityConfig((prev) => ({
                  ...prev,
                  overrides: { ...prev.overrides, [d]: mins },
                }))
              }
              onInspectTask={handleInspectTask}
              onInspectBlock={handleInspectBlock}
              onInspectSession={handleInspectSession}
              onDeleteBlock={handleDeleteBlock}
            />
          )}

          {calendarViewMode === 'week' && (
            <WeekView
              currentDateMs={currentDateMs}
              daysCount={calendarDaysCount}
              plannedBlocks={plannedBlocks}
              sessions={sessions}
              tasks={allTasks}
              onSlotClick={(dateStr, hour) => setModalSlot({ dateStr, hour })}
              onInspectTask={handleInspectTask}
              onDeleteBlock={handleDeleteBlock}
            />
          )}

          {calendarViewMode === 'agenda' && (
            <AgendaView
              plannedBlocks={plannedBlocks}
              sessions={sessions}
              tasks={allTasks}
              onInspectTask={handleInspectTask}
              onDeleteBlock={handleDeleteBlock}
            />
          )}
        </div>
      </div>

      {/* Side Planning Drawer */}
      {calendarPlanningDrawerOpen && (
        <SidePlanningDrawer
          tasks={allTasks}
          projectMap={projectMap}
          onClose={toggleCalendarPlanningDrawer}
          onInspectTask={handleInspectTask}
          onPlanTask={handlePlanTaskFromDrawer}
          onOpenAllocationDrawer={() => setAllocationDrawerOpen(true)}
        />
      )}

      {/* Allocation Drawer */}
      <AllocationDrawer
        isOpen={allocationDrawerOpen}
        onClose={() => setAllocationDrawerOpen(false)}
        projectAllocations={projectAllocations}
        goalAllocations={goalAllocations}
      />

      {/* Create / Edit Planned Block Modal */}
      {modalSlot && (
        <CreatePlannedBlockModal
          initialDate={modalSlot.dateStr}
          initialStartHour={modalSlot.hour}
          tasks={allTasks.filter((t) => !t.deletedAt && t.statusId !== 'ws-task-done')}
          projects={allProjects.filter((p) => !p.deletedAt)}
          onSave={handleCreateBlock}
          onClose={() => setModalSlot(null)}
        />
      )}
    </div>
  );
};
