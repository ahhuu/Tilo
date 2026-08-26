import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/storage/db';
import { updateProject, deleteProject } from '@/services/projectCommands';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Pin,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import type { ProjectStatus } from '@/core/types/domain';

const PRESET_COLORS = [
  '#4f46e5', // Indigo
  '#0284c7', // Sky
  '#0d9488', // Teal
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ea580c', // Orange
  '#e11d48', // Rose
  '#8b5cf6', // Violet
];

interface ProjectInspectorProps {
  projectId: string;
}

export const ProjectInspector: React.FC<ProjectInspectorProps> = ({ projectId }) => {
  const { language } = useI18n();
  const { closeInspector, addToast } = useUIStore();

  const project = useLiveQuery(() => db.projects.get(projectId), [projectId]);
  const allGoals = useLiveQuery(() => db.goals.filter((g) => !g.deletedAt).toArray(), []) || [];
  const projStatuses = useLiveQuery(
    () => db.workflowStatuses.where('workflowId').equals('wf-proj-default').sortBy('order'),
    []
  ) || [];
  const taskCount = useLiveQuery(
    () => db.tasks.where('projectId').equals(projectId).filter((t) => !t.deletedAt).count(),
    [projectId]
  ) ?? 0;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#4f46e5');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [primaryGoalId, setPrimaryGoalId] = useState<string>('none');
  const [isPinned, setIsPinned] = useState<boolean>(false);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
      setColor(project.color || '#4f46e5');
      setStatus(project.status);
      setPrimaryGoalId(project.primaryGoalId || 'none');
      setIsPinned(!!project.isPinned);
    }
  }, [project]);

  if (!project) {
    return (
      <div className="p-4 text-center text-xs text-slate-400">
        {language === 'zh-CN' ? '未找到项目。' : 'Project not found.'}
      </div>
    );
  }

  const handleNameBlur = async () => {
    if (name.trim() && name.trim() !== project.name) {
      await updateProject(project.id, { name: name.trim() });
      addToast({
        message: language === 'zh-CN' ? '项目名称已更新' : 'Project name updated',
        type: 'info',
      });
    }
  };

  const handleDescriptionBlur = async () => {
    if (description !== (project.description || '')) {
      await updateProject(project.id, { description: description.trim() || undefined });
      addToast({
        message: language === 'zh-CN' ? '项目描述已更新' : 'Project description updated',
        type: 'info',
      });
    }
  };

  const handleColorChange = async (newColor: string) => {
    setColor(newColor);
    await updateProject(project.id, { color: newColor });
  };

  const handleWorkflowStatusChange = async (newStatusId: string) => {
    const st = projStatuses.find((s) => s.id === newStatusId);
    const domainStatus: ProjectStatus =
      st?.semantic === 'completed'
        ? 'completed'
        : st?.semantic === 'cancelled'
        ? 'archived'
        : st?.semantic === 'waiting'
        ? 'paused'
        : 'active';

    setStatus(domainStatus);
    await updateProject(project.id, {
      statusId: newStatusId,
      status: domainStatus,
    });
    const label = st?.name || newStatusId;
    addToast({
      message: language === 'zh-CN' ? `项目阶段已更新为: ${label}` : `Project stage updated: ${label}`,
      type: 'info',
    });
  };

  const handleStatusChange = async (newStatus: ProjectStatus) => {
    const defaultStatusIdMap: Record<ProjectStatus, string> = {
      active: 'ws-proj-active',
      completed: 'ws-proj-completed',
      paused: 'ws-proj-paused',
      archived: 'ws-proj-cancelled',
    };
    setStatus(newStatus);
    await updateProject(project.id, {
      status: newStatus,
      statusId: defaultStatusIdMap[newStatus] || 'ws-proj-active',
    });
    addToast({
      message: language === 'zh-CN' ? `项目状态已更新为: ${newStatus}` : `Status updated to ${newStatus}`,
      type: 'info',
    });
  };

  const handleGoalChange = async (goalIdVal: string) => {
    setPrimaryGoalId(goalIdVal);
    await updateProject(project.id, {
      primaryGoalId: goalIdVal !== 'none' ? goalIdVal : undefined,
    });
    addToast({
      message: language === 'zh-CN' ? '项目归属目标已更新' : 'Primary goal updated',
      type: 'info',
    });
  };

  const handleTogglePinned = async () => {
    const nextVal = !isPinned;
    setIsPinned(nextVal);
    await updateProject(project.id, { isPinned: nextVal });
    addToast({
      message: nextVal
        ? (language === 'zh-CN' ? '已固定至侧边栏' : 'Pinned to sidebar')
        : (language === 'zh-CN' ? '已从侧边栏取消固定' : 'Unpinned from sidebar'),
      type: 'info',
    });
  };

  const handleDelete = async () => {
    if (!window.confirm(language === 'zh-CN' ? `确定要删除项目 "${project.name}" 吗？` : `Delete project "${project.name}"?`)) {
      return;
    }
    await deleteProject(project.id);
    addToast({
      message: language === 'zh-CN' ? '项目已删除' : 'Project deleted',
      type: 'info',
    });
    closeInspector();
  };

  return (
    <div className="space-y-4 text-xs select-none">
      {/* Name */}
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {language === 'zh-CN' ? '项目名称' : 'Project Name'}
        </label>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleNameBlur}
          className="w-full text-sm font-semibold text-slate-900 dark:text-slate-100"
        />
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {language === 'zh-CN' ? '项目描述与范围' : 'Description'}
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleDescriptionBlur}
          placeholder={language === 'zh-CN' ? '输入项目目标与执行范围...' : 'Project purpose and scope...'}
          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden resize-none"
        />
      </div>

      {/* Color Selection */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {language === 'zh-CN' ? '项目标识色' : 'Project Color'}
        </label>
        <div className="flex items-center gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => handleColorChange(c)}
              className={`w-5 h-5 rounded-full transition-transform ${
                color === c ? 'scale-125 ring-2 ring-offset-2 ring-indigo-500' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Properties */}
      <div className="grid grid-cols-1 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        {/* Workflow Stage / Status */}
        <div className="grid grid-cols-3 items-center">
          <span className="text-slate-500">{language === 'zh-CN' ? '项目阶段/状态' : 'Stage / Status'}</span>
          <div className="col-span-2 relative">
            {projStatuses.length > 0 ? (
              <select
                value={project.statusId || ''}
                onChange={(e) => handleWorkflowStatusChange(e.target.value)}
                className="w-full h-7 px-2 pr-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-0 text-xs appearance-none cursor-pointer focus:ring-1 focus:ring-indigo-500 font-medium"
              >
                {projStatuses.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.semantic})
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
                className="w-full h-7 px-2 pr-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-0 text-xs appearance-none cursor-pointer focus:ring-1 focus:ring-indigo-500 capitalize"
              >
                <option value="active">{language === 'zh-CN' ? '进行中 (Active)' : 'Active'}</option>
                <option value="completed">{language === 'zh-CN' ? '已完成 (Completed)' : 'Completed'}</option>
                <option value="paused">{language === 'zh-CN' ? '已暂停 (Paused)' : 'Paused'}</option>
                <option value="archived">{language === 'zh-CN' ? '已归档 (Archived)' : 'Archived'}</option>
              </select>
            )}
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
          </div>
        </div>

        {/* Primary Goal */}
        <div className="grid grid-cols-3 items-center">
          <span className="text-slate-500">{language === 'zh-CN' ? '归属主目标' : 'Primary Goal'}</span>
          <div className="col-span-2 relative">
            <select
              value={primaryGoalId}
              onChange={(e) => handleGoalChange(e.target.value)}
              className="w-full h-7 px-2 pr-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-0 text-xs appearance-none cursor-pointer focus:ring-1 focus:ring-indigo-500"
            >
              <option value="none">{language === 'zh-CN' ? '独立项目 (无主目标)' : 'Standalone (No Goal)'}</option>
              {allGoals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
          </div>
        </div>

        {/* Related Goals */}
        {allGoals.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <label className="text-slate-500 font-medium flex items-center justify-between">
              <span>{language === 'zh-CN' ? '次要 / 关联目标' : 'Related Goals'}</span>
              <span className="text-slate-400 font-normal">
                {project.relatedGoalIds?.length || 0} {language === 'zh-CN' ? '个已关联' : 'linked'}
              </span>
            </label>
            <div className="space-y-1 max-h-28 overflow-y-auto p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
              {allGoals
                .filter((g) => g.id !== primaryGoalId)
                .map((g) => {
                  const isChecked = (project.relatedGoalIds || []).includes(g.id);
                  return (
                    <label
                      key={g.id}
                      className="flex items-center gap-2 py-1 px-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={async () => {
                          const current = project.relatedGoalIds || [];
                          const updated = isChecked
                            ? current.filter((id) => id !== g.id)
                            : [...current, g.id];
                          await updateProject(project.id, { relatedGoalIds: updated });
                          addToast({
                            message: isChecked
                              ? (language === 'zh-CN' ? '已取消关联目标' : 'Removed related goal')
                              : (language === 'zh-CN' ? '已关联次要目标' : 'Added related goal'),
                            type: 'info',
                          });
                        }}
                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: g.color || '#6366f1' }} />
                      <span className="text-slate-800 dark:text-slate-200 truncate">{g.title}</span>
                    </label>
                  );
                })}
            </div>
          </div>
        )}

        {/* Pin in sidebar toggle */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Pin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {language === 'zh-CN' ? '固定在侧边栏导航' : 'Pin to Sidebar'}
            </span>
          </div>
          <input
            type="checkbox"
            checked={isPinned}
            onChange={handleTogglePinned}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
        </div>

        {/* Task Count Info */}
        <div className="flex items-center justify-between px-2.5 py-2 text-slate-500">
          <span>{language === 'zh-CN' ? '包含任务总数' : 'Total Tasks'}</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{taskCount}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
        <Button
          size="sm"
          variant="danger"
          onClick={handleDelete}
          className="h-7 text-xs gap-1.5 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{language === 'zh-CN' ? '删除项目' : 'Delete Project'}</span>
        </Button>
      </div>
    </div>
  );
};
