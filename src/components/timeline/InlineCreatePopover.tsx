import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/storage/db';
import { useI18n } from '@/core/i18n';
import { Button } from '@/components/ui/Button';
import { timeService } from '@/core/time/timeService';
import { instantiateTaskFromTemplate } from '@/services/templateCommands';
import { Plus, Target, Sparkles, Clock, X, Search, Check, FileText } from 'lucide-react';
import type { Task, Project, PlannedBlockType } from '@/core/types/domain';

interface InlineCreatePopoverProps {
  startAt: number;
  endAt: number;
  tasks: Task[];
  projects: Project[];
  onClose: () => void;
  onCreateBlock: (data: {
    title: string;
    type: PlannedBlockType;
    startAt: number;
    endAt: number;
    taskId?: string;
    projectId?: string;
  }) => void;
}

export const InlineCreatePopover: React.FC<InlineCreatePopoverProps> = ({
  startAt,
  endAt,
  tasks,
  projects,
  onClose,
  onCreateBlock,
}) => {
  const { language } = useI18n();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<PlannedBlockType>('task');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('none');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('none');
  const [searchQuery, setSearchQuery] = useState('');

  const [focusPreset, setFocusPreset] = useState<string>('deep_work');
  const [activityPreset, setActivityPreset] = useState<string>('meeting');

  const FOCUS_PRESETS = [
    { id: 'deep_work', label: language === 'zh-CN' ? '🧠 深度工作 (Deep Work)' : '🧠 Deep Work', defaultTitle: language === 'zh-CN' ? '深度工作 (Deep Work)' : 'Deep Work Focus' },
    { id: 'dev', label: language === 'zh-CN' ? '🛠️ 核心开发与编码 (Core Dev)' : '🛠️ Core Dev', defaultTitle: language === 'zh-CN' ? '核心开发与编码' : 'Core Development' },
    { id: 'study', label: language === 'zh-CN' ? '📖 深度研读与学习 (Deep Study)' : '📖 Study & Research', defaultTitle: language === 'zh-CN' ? '深度研读与学习' : 'Study & Research' },
    { id: 'design', label: language === 'zh-CN' ? '📝 方案设计与构思 (System Design)' : '📝 Design', defaultTitle: language === 'zh-CN' ? '方案设计与构思' : 'System Design' },
    { id: 'review', label: language === 'zh-CN' ? '📊 战略规划与复盘 (Strategy & Review)' : '📊 Review', defaultTitle: language === 'zh-CN' ? '战略规划与复盘' : 'Strategy & Review' },
    { id: 'custom', label: language === 'zh-CN' ? '✍️ 自定义专注主题...' : '✍️ Custom Theme...', defaultTitle: '' },
  ];

  const ACTIVITY_PRESETS = [
    { id: 'meeting', label: language === 'zh-CN' ? '💬 会议与团队沟通 (Meeting)' : '💬 Meeting', defaultTitle: language === 'zh-CN' ? '会议与沟通' : 'Meeting & Discussion' },
    { id: 'routine', label: language === 'zh-CN' ? '📋 例行事务与收件箱整理 (Routine)' : '📋 Routine', defaultTitle: language === 'zh-CN' ? '例行事务处理' : 'Routine & Admin' },
    { id: 'break', label: language === 'zh-CN' ? '☕ 休息与健康用餐 (Break / Meal)' : '☕ Break', defaultTitle: language === 'zh-CN' ? '休息与用餐' : 'Break & Meal' },
    { id: 'exercise', label: language === 'zh-CN' ? '🏃 运动健身 (Exercise)' : '🏃 Workout', defaultTitle: language === 'zh-CN' ? '运动健身' : 'Workout & Sports' },
    { id: 'custom', label: language === 'zh-CN' ? '✨ 自定义日程活动...' : '✨ Custom Activity...', defaultTitle: '' },
  ];

  const taskTemplates = useLiveQuery(
    () => db.templates.filter((t) => t.kind === 'task').toArray(),
    []
  ) || [];

  const durationMinutes = Math.max(15, Math.round((endAt - startAt) / 60000));
  const timeRangeLabel = `${timeService.formatTime(startAt)} – ${timeService.formatTime(endAt)} (${durationMinutes}m)`;

  const availableTasks = tasks.filter(
    (t) => t.statusId !== 'ws-task-done' && !t.deletedAt && (!searchQuery.trim() || t.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalTitle = title.trim();

    if (!finalTitle) {
      if (type === 'focus') {
        const found = FOCUS_PRESETS.find((p) => p.id === focusPreset);
        finalTitle = found?.defaultTitle || (language === 'zh-CN' ? '深度工作' : 'Deep Work');
      } else if (type === 'activity') {
        const found = ACTIVITY_PRESETS.find((p) => p.id === activityPreset);
        finalTitle = found?.defaultTitle || (language === 'zh-CN' ? '例行活动' : 'Planned Activity');
      } else if (selectedTaskId !== 'none') {
        finalTitle = tasks.find((t) => t.id === selectedTaskId)?.title || (language === 'zh-CN' ? '计划任务' : 'Planned Task');
      } else {
        finalTitle = language === 'zh-CN' ? '未命名任务' : 'Untitled Task';
      }
    }

    onCreateBlock({
      title: finalTitle,
      type,
      startAt,
      endAt,
      taskId: selectedTaskId !== 'none' ? selectedTaskId : undefined,
      projectId: selectedProjectId !== 'none' ? selectedProjectId : undefined,
    });
    onClose();
  };

  const handleSelectTask = (task: Task) => {
    setSelectedTaskId(task.id);
    if (!title.trim()) {
      setTitle(task.title);
    }
    if (task.projectId) {
      setSelectedProjectId(task.projectId);
    }
  };

  const handleTypeChange = (newType: PlannedBlockType) => {
    setType(newType);
    if (newType === 'focus') {
      const preset = FOCUS_PRESETS.find((p) => p.id === focusPreset);
      setTitle(preset?.defaultTitle || '');
    } else if (newType === 'activity') {
      const preset = ACTIVITY_PRESETS.find((p) => p.id === activityPreset);
      setTitle(preset?.defaultTitle || '');
    } else {
      if (selectedTaskId !== 'none') {
        const t = tasks.find((item) => item.id === selectedTaskId);
        setTitle(t?.title || '');
      } else {
        setTitle('');
      }
    }
  };

  const handleFocusPresetChange = (presetId: string) => {
    setFocusPreset(presetId);
    const found = FOCUS_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setTitle(found.defaultTitle);
    }
  };

  const handleActivityPresetChange = (presetId: string) => {
    setActivityPreset(presetId);
    const found = ACTIVITY_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setTitle(found.defaultTitle);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Create Planned Block"
      className="absolute z-40 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 animate-in fade-in zoom-in-95 duration-150 select-none text-left"
      style={{
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono">
            {timeRangeLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5 mt-3">
        {/* Type Selector: Task | Focus Block | Activity */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-[11px] font-medium">
          <button
            type="button"
            onClick={() => handleTypeChange('task')}
            className={`py-1 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 ${
              type === 'task'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Check className="w-3 h-3" />
            <span>{language === 'zh-CN' ? '任务' : 'Task'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('focus')}
            className={`py-1 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 ${
              type === 'focus'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Target className="w-3 h-3" />
            <span>{language === 'zh-CN' ? '专注块' : 'Focus'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('activity')}
            className={`py-1 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 ${
              type === 'activity'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 font-semibold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>{language === 'zh-CN' ? '活动' : 'Activity'}</span>
          </button>
        </div>

        {/* Dynamic Type Explanation Hint */}
        <div className="text-[11px] leading-relaxed p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400">
          {type === 'task' ? (
            <p>
              {language === 'zh-CN'
                ? '✓ 任务：具体的待办执行，支持关联或新建待办任务，具有明确的完成交付状态。'
                : '✓ Task: Concrete actionable to-do item with completion tracking.'}
            </p>
          ) : type === 'focus' ? (
            <p>
              {language === 'zh-CN'
                ? '◎ 专注块：预留高认知负荷的黄金时段，保护深度工作，可承载多个相关任务进行时间盒管控。'
                : '◎ Focus Block: Protected deep work time box reserved for high-cognition output.'}
            </p>
          ) : (
            <p>
              {language === 'zh-CN'
                ? '✨ 活动：会议、沟通、例行安排等非任务日程，不设待办打勾，真实计入全天容量消耗。'
                : '✨ Activity: Meetings, events, or routines that consume daily schedule capacity.'}
            </p>
          )}
        </div>

        {/* Focus Mode Dropdown Preset Selector */}
        {type === 'focus' && (
          <div className="space-y-1.5">
            <label className="block text-[11px] text-slate-400 font-medium">
              {language === 'zh-CN' ? '专注模式与主题' : 'Focus Mode / Theme'}
            </label>
            <select
              value={focusPreset}
              onChange={(e) => handleFocusPresetChange(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium cursor-pointer"
            >
              {FOCUS_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Activity Preset Selector */}
        {type === 'activity' && (
          <div className="space-y-1.5">
            <label className="block text-[11px] text-slate-400 font-medium">
              {language === 'zh-CN' ? '活动类型与预设' : 'Activity Type'}
            </label>
            <select
              value={activityPreset}
              onChange={(e) => handleActivityPresetChange(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 font-medium cursor-pointer"
            >
              {ACTIVITY_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Title Input / Custom Theme Input */}
        <div className="space-y-1">
          <label className="block text-[11px] text-slate-400 font-medium">
            {type === 'focus'
              ? (language === 'zh-CN' ? '自定义专注名称' : 'Focus Block Title')
              : type === 'activity'
              ? (language === 'zh-CN' ? '活动名称' : 'Activity Title')
              : (language === 'zh-CN' ? '任务名称' : 'Task Title')}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              type === 'focus'
                ? (language === 'zh-CN' ? '深度工作 (可自定义补充)...' : 'Focus title...')
                : type === 'activity'
                ? (language === 'zh-CN' ? '输入活动名称...' : 'Activity title...')
                : (language === 'zh-CN' ? '输入新任务名称，或从下方选择已有待办...' : 'Enter task title or select task below...')
            }
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            autoFocus
          />
        </div>

        {/* Link Existing Task or Create From Template (if type === 'task') */}
        {type === 'task' && (
          <div className="space-y-2">
            {/* Task Template Quick Chips */}
            {taskTemplates.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  {language === 'zh-CN' ? '标准模板快捷套用' : 'Templates'}
                </span>
                <div className="flex flex-wrap gap-1">
                  {taskTemplates.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={async () => {
                        const logicalDate = timeService.getLogicalDate(startAt);
                        const newTask = await instantiateTaskFromTemplate(tmpl, {
                          scheduledDate: logicalDate,
                          projectId: selectedProjectId !== 'none' ? selectedProjectId : undefined,
                        });
                        setSelectedTaskId(newTask.id);
                        setTitle(newTask.title);
                      }}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-900/60 hover:bg-indigo-100 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-2.5 h-2.5" />
                      <span>{tmpl.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-1">
              <span>{language === 'zh-CN' ? '关联已有待办' : 'Link Pending Task'}</span>
              {selectedTaskId !== 'none' && (
                <button
                  type="button"
                  onClick={() => setSelectedTaskId('none')}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {language === 'zh-CN' ? '清除关联' : 'Clear'}
                </button>
              )}
            </div>

            {/* Quick search input */}
            <div className="relative">
              <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2 pointer-events-none" />
              <input
                type="text"
                placeholder={language === 'zh-CN' ? '过滤待办...' : 'Filter tasks...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-7 pl-6 pr-2 text-[11px] bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="max-h-24 overflow-y-auto space-y-1 border border-slate-100 dark:border-slate-800 rounded-xl p-1 bg-slate-50/50 dark:bg-slate-800/40">
              {availableTasks.slice(0, 5).map((task) => {
                const isSelected = selectedTaskId === task.id;
                return (
                  <div
                    key={task.id}
                    onClick={() => handleSelectTask(task)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="truncate">{task.title}</span>
                    {task.estimateMinutes && (
                      <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                        {task.estimateMinutes}m
                      </span>
                    )}
                  </div>
                );
              })}
              {availableTasks.length === 0 && (
                <p className="text-[11px] text-slate-400 py-2 text-center">
                  {language === 'zh-CN' ? '无匹配的待办任务' : 'No matching tasks'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Project Selector (Optional) */}
        {projects.length > 0 && (
          <div>
            <label className="block text-[11px] text-slate-400 font-medium mb-1">
              {language === 'zh-CN' ? '归属项目' : 'Project'}
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="none">{language === 'zh-CN' ? '无归属项目' : 'None'}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button size="sm" variant="ghost" type="button" onClick={onClose}>
            {language === 'zh-CN' ? '取消' : 'Cancel'}
          </Button>
          <Button size="sm" variant="primary" type="submit">
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>{language === 'zh-CN' ? '创建时间块' : 'Create Block'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};
