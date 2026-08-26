import React from 'react';
import { TimelineView } from '@/components/timeline/TimelineView';
import {
  createPlannedBlock,
  updatePlannedBlock,
  deletePlannedBlock,
} from '@/services/planCommands';
import { useUIStore } from '@/stores/uiStore';
import type { PlannedBlock, Session, Task, Project } from '@/core/types/domain';
import type { TimelineFilter, DailyCapacityConfig } from '@/core/timeline/types';

interface DayViewProps {
  dateStr: string; // YYYY-MM-DD
  plannedBlocks: PlannedBlock[];
  sessions: Session[];
  tasks: Task[];
  projects?: Project[];
  filter?: TimelineFilter;
  onFilterChange?: (filter: TimelineFilter) => void;
  capacityConfig?: DailyCapacityConfig;
  onUpdateCapacityOverride?: (dateStr: string, minutes: number) => void;
  onInspectTask?: (task: Task) => void;
  onInspectBlock?: (block: PlannedBlock) => void;
  onInspectSession?: (session: Session) => void;
  onDeleteBlock?: (blockId: string) => void;
}

export const DayView: React.FC<DayViewProps> = ({
  dateStr,
  plannedBlocks,
  sessions,
  tasks,
  projects = [],
  filter,
  onFilterChange,
  capacityConfig,
  onUpdateCapacityOverride,
  onInspectTask,
  onInspectBlock,
  onInspectSession,
  onDeleteBlock,
}) => {
  const { addToast } = useUIStore();

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      <TimelineView
        dateStr={dateStr}
        tasks={tasks}
        projects={projects}
        plannedBlocks={plannedBlocks}
        sessions={sessions}
        filter={filter}
        onFilterChange={onFilterChange}
        capacityConfig={capacityConfig}
        onUpdateCapacityOverride={onUpdateCapacityOverride}
        onInspectTask={onInspectTask}
        onInspectBlock={onInspectBlock}
        onInspectSession={onInspectSession}
        onCreatePlannedBlock={async (data) => {
          const block = await createPlannedBlock(data);
          addToast({ message: '已创建排期时间块 (Created planned block)', type: 'success' });
          return block;
        }}
        onUpdatePlannedBlock={async (blockId, updates) => {
          const updated = await updatePlannedBlock(blockId, updates);
          addToast({ message: '已调整时间块 (Time block updated)', type: 'info' });
          return updated;
        }}
        onDeletePlannedBlock={async (blockId) => {
          if (onDeleteBlock) {
            onDeleteBlock(blockId);
          } else {
            await deletePlannedBlock(blockId);
          }
          addToast({ message: '已删除时间块 (Time block deleted)', type: 'info' });
        }}
      />
    </div>
  );
};
