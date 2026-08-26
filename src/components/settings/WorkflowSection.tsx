import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/storage/db';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import {
  ensureWorkflowsInitialized,
  addWorkflowStatus,
  updateWorkflowStatus,
  deleteWorkflowStatus,
  resetWorkflowToDefault,
  createCustomFieldDefinition,
  deleteCustomFieldDefinition,
  DEFAULT_TASK_WORKFLOW_ID,
  DEFAULT_PROJECT_WORKFLOW_ID,
} from '@/services/workflowCommands';
import type { WorkflowSemanticState, CustomFieldType } from '@/core/types/domain';
import {
  Plus,
  Trash2,
  RotateCcw,
  Tag,
} from 'lucide-react';

const RESCHEDULE_REASONS_KEY = 'tilo_reschedule_reasons';
const DEFAULT_RESCHEDULE_REASONS = [
  '优先级变动 (Priorities shifted)',
  '低估工作量 (Underestimated effort)',
  '外部阻塞 (External blocker / dependency)',
  '紧急打断 (Urgent interruption)',
  '精力不足 (Low energy / fatigue)',
  '范围变更 (Scope changed)',
];

export const WorkflowSection: React.FC = () => {
  const { language } = useI18n();
  const { addToast } = useUIStore();
  const [activeSubTab, setActiveSubTab] = useState<'taskWf' | 'projWf' | 'customFields' | 'rescheduleReasons'>('taskWf');

  useEffect(() => {
    ensureWorkflowsInitialized();
  }, []);

  // Live queries
  const taskStatuses = useLiveQuery(
    () => db.workflowStatuses.where('workflowId').equals(DEFAULT_TASK_WORKFLOW_ID).sortBy('order'),
    []
  ) || [];

  const projStatuses = useLiveQuery(
    () => db.workflowStatuses.where('workflowId').equals(DEFAULT_PROJECT_WORKFLOW_ID).sortBy('order'),
    []
  ) || [];

  const customFields = useLiveQuery(() => db.customFieldDefinitions.toArray(), []) || [];

  // Reschedule reasons from localStorage
  const [rescheduleReasons, setRescheduleReasons] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RESCHEDULE_REASONS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_RESCHEDULE_REASONS;
  });

  const [newReasonText, setNewReasonText] = useState('');

  // Status creation modal/input state
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusSemantic, setNewStatusSemantic] = useState<WorkflowSemanticState>('active');
  const [newStatusColor, setNewStatusColor] = useState('#6366f1');

  // Custom field creation state
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldEntity, setNewFieldEntity] = useState<'task' | 'project'>('task');
  const [newFieldType, setNewFieldType] = useState<CustomFieldType>('text');

  const handleAddStatus = async (workflowId: string) => {
    if (!newStatusName.trim()) return;
    try {
      await addWorkflowStatus(workflowId, {
        name: newStatusName.trim(),
        semantic: newStatusSemantic,
        colorToken: newStatusColor,
      });
      setNewStatusName('');
      addToast({
        message: language === 'zh-CN' ? '已添加工作流状态' : 'Workflow status added',
        type: 'success',
      });
    } catch (err: unknown) {
      addToast({
        message: err instanceof Error ? err.message : 'Error adding status',
        type: 'error',
      });
    }
  };

  const handleUpdateSemantic = async (statusId: string, semantic: WorkflowSemanticState) => {
    try {
      await updateWorkflowStatus(statusId, { semantic });
      addToast({
        message: language === 'zh-CN' ? '已更新状态语义映射' : 'Semantic state updated',
        type: 'info',
      });
    } catch (err: unknown) {
      addToast({
        message: err instanceof Error ? err.message : 'Error updating semantic',
        type: 'error',
      });
    }
  };

  const handleDeleteStatus = async (statusId: string) => {
    try {
      await deleteWorkflowStatus(statusId);
      addToast({
        message: language === 'zh-CN' ? '已删除状态' : 'Status deleted',
        type: 'info',
      });
    } catch (err: unknown) {
      addToast({
        message: err instanceof Error ? err.message : 'Cannot delete status',
        type: 'error',
      });
    }
  };

  const handleResetWorkflow = async (scope: 'task' | 'project') => {
    await resetWorkflowToDefault(scope);
    addToast({
      message: language === 'zh-CN' ? '已重置工作流状态为默认' : 'Workflow reset to default',
      type: 'info',
    });
  };

  const handleCreateCustomField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim()) return;

    await createCustomFieldDefinition({
      name: newFieldName.trim(),
      entityType: newFieldEntity,
      type: newFieldType,
    });
    setNewFieldName('');
    addToast({
      message: language === 'zh-CN' ? '已创建自定义字段' : 'Custom field created',
      type: 'success',
    });
  };

  const handleDeleteCustomField = async (fieldId: string) => {
    await deleteCustomFieldDefinition(fieldId);
    addToast({
      message: language === 'zh-CN' ? '已删除自定义字段' : 'Custom field deleted',
      type: 'info',
    });
  };

  const handleAddRescheduleReason = () => {
    if (!newReasonText.trim()) return;
    const next = [...rescheduleReasons, newReasonText.trim()];
    setRescheduleReasons(next);
    localStorage.setItem(RESCHEDULE_REASONS_KEY, JSON.stringify(next));
    setNewReasonText('');
    addToast({
      message: language === 'zh-CN' ? '已添加重排原因' : 'Reschedule reason added',
      type: 'success',
    });
  };

  const handleDeleteRescheduleReason = (idx: number) => {
    const next = rescheduleReasons.filter((_, i) => i !== idx);
    setRescheduleReasons(next);
    localStorage.setItem(RESCHEDULE_REASONS_KEY, JSON.stringify(next));
    addToast({
      message: language === 'zh-CN' ? '已移除重排原因' : 'Reschedule reason removed',
      type: 'info',
    });
  };

  const handleResetRescheduleReasons = () => {
    setRescheduleReasons(DEFAULT_RESCHEDULE_REASONS);
    localStorage.setItem(RESCHEDULE_REASONS_KEY, JSON.stringify(DEFAULT_RESCHEDULE_REASONS));
    addToast({
      message: language === 'zh-CN' ? '已重置重排原因为默认' : 'Reschedule reasons reset to default',
      type: 'info',
    });
  };

  const semanticLabels: Record<WorkflowSemanticState, { label: string; desc: string }> = {
    open: { label: language === 'zh-CN' ? '待办 (Open)' : 'Open', desc: language === 'zh-CN' ? '未开始或待处理' : 'Unstarted' },
    active: { label: language === 'zh-CN' ? '进行中 (Active)' : 'Active', desc: language === 'zh-CN' ? '正在执行' : 'In progress' },
    waiting: { label: language === 'zh-CN' ? '阻塞/等待 (Waiting)' : 'Waiting', desc: language === 'zh-CN' ? '等待外部输入或前置依赖' : 'Blocked / on hold' },
    completed: { label: language === 'zh-CN' ? '已完成 (Completed)' : 'Completed', desc: language === 'zh-CN' ? '任务完成，计入统计' : 'Finished & counted in analytics' },
    cancelled: { label: language === 'zh-CN' ? '已取消 (Cancelled)' : 'Cancelled', desc: language === 'zh-CN' ? '放弃或取消' : 'Dismissed / cancelled' },
  };

  const projectSemanticLabels: Record<Exclude<WorkflowSemanticState, 'open'>, { label: string; desc: string }> = {
    active: {
      label: language === 'zh-CN' ? '进行中 (Active)' : 'Active',
      desc: language === 'zh-CN' ? '项目处于进行中规范生命周期' : 'Project in active progress',
    },
    waiting: {
      label: language === 'zh-CN' ? '已暂停 / 阻塞 (Paused)' : 'Paused / On Hold',
      desc: language === 'zh-CN' ? '项目处于已暂停规范生命周期' : 'Project paused or blocked',
    },
    completed: {
      label: language === 'zh-CN' ? '已完成 (Completed)' : 'Completed',
      desc: language === 'zh-CN' ? '项目目标达成并已结项' : 'Project finished successfully',
    },
    cancelled: {
      label: language === 'zh-CN' ? '已归档 / 取消 (Archived)' : 'Archived / Cancelled',
      desc: language === 'zh-CN' ? '项目已归档或终止' : 'Project archived or cancelled',
    },
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        {(
          [
            { id: 'taskWf', label: language === 'zh-CN' ? '任务工作流 (Task Workflow)' : 'Task Workflow' },
            { id: 'projWf', label: language === 'zh-CN' ? '项目工作流 (Project Workflow)' : 'Project Workflow' },
            { id: 'customFields', label: language === 'zh-CN' ? '自定义字段 (Custom Fields)' : 'Custom Fields' },
            { id: 'rescheduleReasons', label: language === 'zh-CN' ? '重排原因配置 (Reschedule Reasons)' : 'Reschedule Reasons' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveSubTab(item.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeSubTab === item.id
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 1. Task Workflow Tab */}
      {activeSubTab === 'taskWf' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {language === 'zh-CN' ? '任务工作流状态配置' : 'Task Workflow Status Configuration'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'zh-CN'
                  ? '系统固定状态语义机制：必须保留至少一个未完成状态与一个已完成状态，确保统计与日历分析的一致性。'
                  : 'Fixed semantic system: At least one open/active and one completed state must exist.'}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleResetWorkflow('task')}
              className="h-7 text-xs gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{language === 'zh-CN' ? '重置为默认' : 'Reset to Default'}</span>
            </Button>
          </div>

          {/* Statuses List */}
          <div className="space-y-2">
            {taskStatuses.map((st) => (
              <Card key={st.id} className="p-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: st.colorToken || '#6366f1' }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {st.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {semanticLabels[st.semantic]?.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Semantic Selector */}
                  <select
                    value={st.semantic}
                    onChange={(e) => handleUpdateSemantic(st.id, e.target.value as WorkflowSemanticState)}
                    className="h-7 px-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium"
                  >
                    <option value="open">{semanticLabels.open.label}</option>
                    <option value="active">{semanticLabels.active.label}</option>
                    <option value="waiting">{semanticLabels.waiting.label}</option>
                    <option value="completed">{semanticLabels.completed.label}</option>
                    <option value="cancelled">{semanticLabels.cancelled.label}</option>
                  </select>

                  <Badge
                    variant={st.semantic === 'completed' ? 'low' : st.semantic === 'active' ? 'indigo' : 'default'}
                    size="sm"
                  >
                    {st.semantic.toUpperCase()}
                  </Badge>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteStatus(st.id)}
                    className="h-7 w-7 text-slate-400 hover:text-rose-600 cursor-pointer"
                    title={language === 'zh-CN' ? '删除状态' : 'Delete status'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Add New Status Card */}
          <Card className="p-4 border-dashed border-indigo-200 dark:border-indigo-900 bg-indigo-50/20 dark:bg-indigo-950/20 space-y-3">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {language === 'zh-CN' ? '添加新任务状态' : 'Add New Task Status'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <input
                type="text"
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                placeholder={language === 'zh-CN' ? '状态名称 (如：代码复审中)' : 'Status name (e.g. In Review)'}
                className="sm:col-span-6 h-8 px-3 text-xs bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
              <select
                value={newStatusSemantic}
                onChange={(e) => setNewStatusSemantic(e.target.value as WorkflowSemanticState)}
                className="sm:col-span-4 h-8 px-2 text-xs bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="open">{semanticLabels.open.label}</option>
                <option value="active">{semanticLabels.active.label}</option>
                <option value="waiting">{semanticLabels.waiting.label}</option>
                <option value="completed">{semanticLabels.completed.label}</option>
                <option value="cancelled">{semanticLabels.cancelled.label}</option>
              </select>
              <input
                type="color"
                value={newStatusColor}
                onChange={(e) => setNewStatusColor(e.target.value)}
                className="sm:col-span-1 h-8 w-full p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer bg-white dark:bg-slate-800"
                title="Status Color"
              />
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleAddStatus(DEFAULT_TASK_WORKFLOW_ID)}
                className="sm:col-span-1 h-8 text-xs cursor-pointer justify-center"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 2. Project Workflow Tab */}
      {activeSubTab === 'projWf' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {language === 'zh-CN' ? '项目工作流状态配置' : 'Project Workflow Status Configuration'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'zh-CN'
                  ? '定义项目的生命周期状态：Planned (计划中)、Active (进行中)、On Hold (搁置中)、Completed (已完成)、Cancelled (已取消)。'
                  : 'Define lifecycle states for Projects across the system.'}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleResetWorkflow('project')}
              className="h-7 text-xs gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{language === 'zh-CN' ? '重置为默认' : 'Reset to Default'}</span>
            </Button>
          </div>

          {/* Project Statuses List */}
          <div className="space-y-2">
            {projStatuses.map((st) => (
              <Card key={st.id} className="p-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: st.colorToken || '#6366f1' }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {st.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {projectSemanticLabels[st.semantic === 'open' ? 'active' : st.semantic]?.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <select
                    value={st.semantic === 'open' ? 'active' : st.semantic}
                    onChange={(e) => handleUpdateSemantic(st.id, e.target.value as WorkflowSemanticState)}
                    className="h-7 px-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium cursor-pointer"
                  >
                    <option value="active">{projectSemanticLabels.active.label}</option>
                    <option value="waiting">{projectSemanticLabels.waiting.label}</option>
                    <option value="completed">{projectSemanticLabels.completed.label}</option>
                    <option value="cancelled">{projectSemanticLabels.cancelled.label}</option>
                  </select>

                  <Badge
                    variant={st.semantic === 'completed' ? 'low' : st.semantic === 'waiting' ? 'urgent' : st.semantic === 'cancelled' ? 'default' : 'indigo'}
                    size="sm"
                  >
                    {st.semantic === 'open' ? 'ACTIVE' : st.semantic.toUpperCase()}
                  </Badge>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteStatus(st.id)}
                    className="h-7 w-7 text-slate-400 hover:text-rose-600 cursor-pointer"
                    title={language === 'zh-CN' ? '删除状态' : 'Delete status'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Add New Project Status Card */}
          <Card className="p-4 border-dashed border-indigo-200 dark:border-indigo-900 bg-indigo-50/20 dark:bg-indigo-950/20 space-y-3">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {language === 'zh-CN' ? '添加新项目状态' : 'Add New Project Status'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <input
                type="text"
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                placeholder={language === 'zh-CN' ? '状态名称 (如：试运行)' : 'Status name (e.g. Pilot Run)'}
                className="sm:col-span-6 h-8 px-3 text-xs bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
              <select
                value={newStatusSemantic === 'open' ? 'active' : newStatusSemantic}
                onChange={(e) => setNewStatusSemantic(e.target.value as WorkflowSemanticState)}
                className="sm:col-span-4 h-8 px-2 text-xs bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 cursor-pointer"
              >
                <option value="active">{projectSemanticLabels.active.label}</option>
                <option value="waiting">{projectSemanticLabels.waiting.label}</option>
                <option value="completed">{projectSemanticLabels.completed.label}</option>
                <option value="cancelled">{projectSemanticLabels.cancelled.label}</option>
              </select>
              <input
                type="color"
                value={newStatusColor}
                onChange={(e) => setNewStatusColor(e.target.value)}
                className="sm:col-span-1 h-8 w-full p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer bg-white dark:bg-slate-800"
                title="Status Color"
              />
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleAddStatus(DEFAULT_PROJECT_WORKFLOW_ID)}
                className="sm:col-span-1 h-8 text-xs cursor-pointer justify-center"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 3. Custom Fields Tab */}
      {activeSubTab === 'customFields' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {language === 'zh-CN' ? '自定义字段管理' : 'Custom Field Definitions'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'zh-CN'
                ? '为任务 (Tasks) 或项目 (Projects) 添加文本、数值、日期或选择型字段。'
                : 'Define custom metadata attributes for Tasks, Projects, or Goals.'}
            </p>
          </div>

          <div className="space-y-2">
            {customFields.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                {language === 'zh-CN' ? '暂未定义自定义字段。' : 'No custom fields defined yet.'}
              </div>
            ) : (
              customFields.map((cf) => (
                <Card key={cf.id} className="p-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Tag className="w-4 h-4 text-indigo-500" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {cf.name}
                      </p>
                      <p className="text-[11px] text-slate-400 capitalize">
                        {cf.entityType} • {cf.type}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteCustomField(cf.id)}
                    className="h-7 w-7 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </Card>
              ))
            )}
          </div>

          {/* Add Field Form */}
          <form onSubmit={handleCreateCustomField} className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {language === 'zh-CN' ? '新建自定义字段' : 'Add New Custom Field'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <input
                type="text"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                placeholder={language === 'zh-CN' ? '字段名称 (如：客户名称)' : 'Field name (e.g. Client Name)'}
                className="sm:col-span-5 h-8 px-3 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
              <select
                value={newFieldEntity}
                onChange={(e) => setNewFieldEntity(e.target.value as 'task' | 'project')}
                className="sm:col-span-3 h-8 px-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="task">{language === 'zh-CN' ? '应用于任务 (Task)' : 'Task'}</option>
                <option value="project">{language === 'zh-CN' ? '应用于项目 (Project)' : 'Project'}</option>
              </select>
              <select
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value as CustomFieldType)}
                className="sm:col-span-3 h-8 px-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="text">{language === 'zh-CN' ? '文本 (Text)' : 'Text'}</option>
                <option value="number">{language === 'zh-CN' ? '数值 (Number)' : 'Number'}</option>
                <option value="date">{language === 'zh-CN' ? '日期 (Date)' : 'Date'}</option>
                <option value="checkbox">{language === 'zh-CN' ? '复选框 (Checkbox)' : 'Checkbox'}</option>
              </select>
              <Button size="sm" variant="primary" type="submit" className="sm:col-span-1 h-8 text-xs cursor-pointer justify-center">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Reschedule Reasons Tab */}
      {activeSubTab === 'rescheduleReasons' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {language === 'zh-CN' ? '任务重排期原因选项' : 'Rescheduling Reason Options'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'zh-CN'
                  ? '在拖拽或调整排期时提供客观、非说教的重排原因，以便在周复盘与分析中统计归因。'
                  : 'Factual reasons recorded during rescheduling for review and analytics.'}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetRescheduleReasons}
              className="h-7 text-xs gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{language === 'zh-CN' ? '重置为默认' : 'Reset to Default'}</span>
            </Button>
          </div>

          <div className="space-y-2">
            {rescheduleReasons.map((reason, idx) => (
              <Card key={reason} className="p-3 flex items-center justify-between gap-4">
                <span className="text-xs text-slate-800 dark:text-slate-200">{reason}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDeleteRescheduleReason(idx)}
                  className="h-7 w-7 text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </Card>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newReasonText}
              onChange={(e) => setNewReasonText(e.target.value)}
              placeholder={language === 'zh-CN' ? '输入自定义重排原因...' : 'Enter new reason...'}
              className="flex-1 h-8 px-3 text-xs bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            />
            <Button size="sm" variant="primary" onClick={handleAddRescheduleReason} className="h-8 text-xs gap-1 cursor-pointer">
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'zh-CN' ? '添加原因' : 'Add Reason'}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
