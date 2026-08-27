import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { rescheduleTask } from '@/services/taskCommands';
import { timeService } from '@/core/time/timeService';
import { useI18n } from '@/core/i18n';
import { AutoPackModal } from '@/components/timeline/AutoPackModal';
import {
  PanelRightClose,
  Calendar,
  Clock,
  Plus,
  Layers,
  Search,
  GripVertical,
  PieChart,
  Sparkles,
} from 'lucide-react';
import type { Task, Project } from '@/core/types/domain';

interface SidePlanningDrawerProps {
  tasks: Task[];
  projectMap: Map<string, Project>;
  onClose: () => void;
  onInspectTask: (task: Task) => void;
  onPlanTask: (task: Task) => void;
  onOpenAllocationDrawer?: () => void;
}

export const SidePlanningDrawer: React.FC<SidePlanningDrawerProps> = ({
  tasks,
  projectMap,
  onClose,
  onInspectTask,
  onPlanTask,
  onOpenAllocationDrawer,
}) => {
  const { language } = useI18n();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'unscheduled' | 'all'>('unscheduled');
  const [showAutoPackModal, setShowAutoPackModal] = useState(false);

  const todayStr = timeService.getLogicalDate();

  const filteredTasks = tasks.filter((t) => {
    if (t.statusId === 'ws-task-done' || t.deletedAt) return false;
    if (tab === 'unscheduled' && t.scheduledDate) return false;
    if (search.trim()) {
      return t.title.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  const handleScheduleForToday = async (taskId: string) => {
    await rescheduleTask(taskId, todayStr);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('application/json-task-id', taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  return (
    <aside
      aria-label="Planning Drawer"
      className="w-80 shrink-0 border-l border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs flex flex-col h-full z-20 select-none animate-in slide-in-from-right-4 duration-200"
    >
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/70 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {language === 'zh-CN' ? '排期抽屉' : 'Planning Drawer'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowAutoPackModal(true)}
            className="p-1 rounded-md text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 cursor-pointer"
            title={language === 'zh-CN' ? '一键智能排盒' : 'Auto-Pack Day'}
          >
            <Sparkles className="w-4 h-4" />
          </button>
          {onOpenAllocationDrawer && (
            <button
              type="button"
              onClick={onOpenAllocationDrawer}
              className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
              title={language === 'zh-CN' ? '查看时间分配洞察' : 'View Time Allocation'}
            >
              <PieChart className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            title={language === 'zh-CN' ? '关闭抽屉' : 'Close Drawer'}
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Auto-Pack Modal */}
      <AutoPackModal
        isOpen={showAutoPackModal}
        onClose={() => setShowAutoPackModal(false)}
        dateKey={todayStr}
      />

      {/* Tabs: Unscheduled | All Tasks */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2">
        <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => setTab('unscheduled')}
            className={`flex-1 py-1 rounded-md transition-colors cursor-pointer ${
              tab === 'unscheduled'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            {language === 'zh-CN' ? '未排期' : 'Unscheduled'} ({tasks.filter((t) => !t.scheduledDate && t.statusId !== 'ws-task-done').length})
          </button>
          <button
            type="button"
            onClick={() => setTab('all')}
            className={`flex-1 py-1 rounded-md transition-colors cursor-pointer ${
              tab === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            {language === 'zh-CN' ? '全部待办' : 'All Pending'}
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder={language === 'zh-CN' ? '过滤任务或按住卡片拖拽排期...' : 'Filter tasks or drag to plan...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            {language === 'zh-CN' ? '暂无可排期的待办任务' : 'No matching tasks to plan.'}
          </div>
        ) : (
          filteredTasks.map((task) => {
            const project = task.projectId ? projectMap.get(task.projectId) : undefined;

            return (
              <div
                key={task.id}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, task.id)}
                onClick={() => onInspectTask(task)}
                className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-grab active:cursor-grabbing group shadow-2xs space-y-1.5"
                title={language === 'zh-CN' ? '按住可直接拖拽至日历网格排期' : 'Drag onto calendar to plan'}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <GripVertical className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {task.title}
                    </p>
                  </div>
                  <Badge variant={task.priority} size="sm">
                    {task.priority}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {project && (
                      <span className="flex items-center gap-1 truncate">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: project.color }}
                        />
                        <span className="truncate">{project.name}</span>
                      </span>
                    )}
                    {task.estimateMinutes && (
                      <span className="flex items-center gap-0.5 shrink-0">
                        <Clock className="w-3 h-3" />
                        {task.estimateMinutes}m
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!task.scheduledDate && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-1.5 text-[10px] text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleScheduleForToday(task.id);
                        }}
                        title="Schedule for Today"
                      >
                        <Calendar className="w-3 h-3 mr-0.5" />
                        Today
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="primary"
                      className="h-6 px-1.5 text-[10px] gap-0.5 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlanTask(task);
                      }}
                      title="Plan Time Block"
                    >
                      <Plus className="w-3 h-3" />
                      Plan
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
