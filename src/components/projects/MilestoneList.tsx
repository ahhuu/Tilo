import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/storage/db';
import { createMilestone } from '@/services/projectCommands';
import { softDeleteRow } from '@/services/tombstoneService';
import { useI18n } from '@/core/i18n';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Flag, Plus, CheckCircle2, CircleDot, Circle, Trash2, Calendar, Edit2, Check, X } from 'lucide-react';
import type { Milestone } from '@/core/types/domain';

type MilestoneStatus = Milestone['status'];

interface MilestoneListProps {
  projectId: string;
}

export const MilestoneList: React.FC<MilestoneListProps> = ({ projectId }) => {
  const { language } = useI18n();
  const { addToast } = useUIStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTargetDate, setEditTargetDate] = useState('');

  const milestones =
    useLiveQuery(
      () =>
        db.milestones
          .where('projectId')
          .equals(projectId)
          .filter((m) => !m.deletedAt)
          .sortBy('order'),
      [projectId]
    ) || [];

  const completedCount = milestones.filter((m) => m.status === 'completed').length;
  const totalCount = milestones.length;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await createMilestone(projectId, newTitle.trim(), targetDate || undefined);
    setNewTitle('');
    setTargetDate('');
    setIsAdding(false);
    addToast({
      message: language === 'zh-CN' ? '已添加里程碑' : 'Milestone added',
      type: 'success',
    });
  };

  const handleToggleComplete = async (milestone: Milestone) => {
    const nextStatus: MilestoneStatus = milestone.status === 'completed' ? 'active' : 'completed';
    await db.milestones.update(milestone.id, { status: nextStatus, updatedAt: Date.now() });
    addToast({
      message:
        nextStatus === 'completed'
          ? (language === 'zh-CN' ? `里程碑已达成: "${milestone.title}"` : `Milestone completed: "${milestone.title}"`)
          : (language === 'zh-CN' ? `已恢复为进行中: "${milestone.title}"` : `Milestone active: "${milestone.title}"`),
      type: nextStatus === 'completed' ? 'success' : 'info',
    });
  };

  const handleStartEdit = (ms: Milestone) => {
    setEditingId(ms.id);
    setEditTitle(ms.title);
    setEditTargetDate(ms.targetDate || '');
  };

  const handleSaveEdit = async (milestoneId: string) => {
    if (!editTitle.trim()) return;
    await db.milestones.update(milestoneId, {
      title: editTitle.trim(),
      targetDate: editTargetDate || undefined,
      updatedAt: Date.now(),
    });
    setEditingId(null);
    addToast({
      message: language === 'zh-CN' ? '里程碑已更新' : 'Milestone updated',
      type: 'info',
    });
  };

  const handleDelete = async (milestoneId: string) => {
    await softDeleteRow(db.milestones, milestoneId);
    addToast({
      message: language === 'zh-CN' ? '里程碑已删除' : 'Milestone deleted',
      type: 'info',
    });
  };

  const getStatusIcon = (status: MilestoneStatus) => {
    if (status === 'completed') {
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    }
    if (status === 'active') {
      return <CircleDot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    }
    return <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600" />;
  };

  const getStatusLabel = (status: MilestoneStatus) => {
    if (language !== 'zh-CN') return status;
    switch (status) {
      case 'completed':
        return '已达成';
      case 'active':
        return '推进中';
      case 'planned':
      default:
        return '已规划';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            {language === 'zh-CN' ? `里程碑 (${completedCount}/${totalCount})` : `Milestones (${completedCount}/${totalCount})`}
          </span>
        </div>

        {!isAdding && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-1.5 text-xs text-indigo-600 dark:text-indigo-400 cursor-pointer"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            {language === 'zh-CN' ? '添加里程碑' : 'Add Milestone'}
          </Button>
        )}
      </div>

      {/* Progress Line */}
      {totalCount > 0 && (
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      )}

      {/* Milestone List */}
      <div className="space-y-1.5">
        {milestones.map((ms) => {
          const isEditing = editingId === ms.id;

          if (isEditing) {
            return (
              <div
                key={ms.id}
                className="p-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2 text-xs"
              >
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full h-8 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="date"
                    value={editTargetDate}
                    onChange={(e) => setEditTargetDate(e.target.value)}
                    className="h-7 px-2 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                  />
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      className="h-7 text-xs cursor-pointer"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="w-3 h-3 mr-1" />
                      {language === 'zh-CN' ? '取消' : 'Cancel'}
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      type="button"
                      className="h-7 text-xs cursor-pointer"
                      onClick={() => handleSaveEdit(ms.id)}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      {language === 'zh-CN' ? '保存' : 'Save'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={ms.id}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-slate-300 transition-colors group shadow-2xs text-xs"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => handleToggleComplete(ms)}
                  className="shrink-0 transition-transform active:scale-95 cursor-pointer"
                  title={
                    ms.status === 'completed'
                      ? (language === 'zh-CN' ? '点击恢复为进行中' : 'Click to reopen')
                      : (language === 'zh-CN' ? '点击标记为已达成' : 'Click to complete')
                  }
                >
                  {getStatusIcon(ms.status)}
                </button>

                <div className="min-w-0 flex-1">
                  <span
                    onClick={() => handleStartEdit(ms)}
                    className={`font-semibold truncate block cursor-pointer hover:text-indigo-600 transition-colors ${
                      ms.status === 'completed'
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                    title={language === 'zh-CN' ? '点击可编辑里程碑' : 'Click to edit'}
                  >
                    {ms.title}
                  </span>
                  {ms.targetDate && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {language === 'zh-CN' ? `目标: ${ms.targetDate}` : `Target: ${ms.targetDate}`}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleComplete(ms)}
                  className="cursor-pointer"
                  title={language === 'zh-CN' ? '点击切换达成状态' : 'Toggle status'}
                >
                  <Badge
                    variant={
                      ms.status === 'completed' ? 'low' : ms.status === 'active' ? 'indigo' : 'default'
                    }
                    size="sm"
                    className="capitalize cursor-pointer"
                  >
                    {getStatusLabel(ms.status)}
                  </Badge>
                </button>

                <button
                  type="button"
                  onClick={() => handleStartEdit(ms)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 transition-opacity cursor-pointer"
                  title={language === 'zh-CN' ? '编辑里程碑' : 'Edit milestone'}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(ms.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity cursor-pointer"
                  title={language === 'zh-CN' ? '删除里程碑' : 'Delete milestone'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Milestone Form */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="p-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2.5"
        >
          <input
            type="text"
            placeholder={language === 'zh-CN' ? '输入里程碑标题...' : 'Milestone title...'}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full h-8 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            autoFocus
            required
          />
          <div className="flex items-center justify-between gap-2">
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="h-7 px-2 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
            />
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                type="button"
                className="h-7 text-xs cursor-pointer"
                onClick={() => {
                  setIsAdding(false);
                  setNewTitle('');
                }}
              >
                {language === 'zh-CN' ? '取消' : 'Cancel'}
              </Button>
              <Button size="sm" variant="primary" type="submit" className="h-7 text-xs cursor-pointer">
                {language === 'zh-CN' ? '添加' : 'Add'}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
