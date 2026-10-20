import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/storage/db';
import { useI18n } from '@/core/i18n';
import { timeService } from '@/core/time/timeService';
import { useUIStore } from '@/stores/uiStore';
import { updateSession, deleteSession } from '@/services/sessionCommands';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Clock,
  Trash2,
  CheckSquare,
  ChevronDown,
} from 'lucide-react';
import type { Task } from '@/core/types/domain';
import { confirmDialog } from '@/services/dialogService';

interface SessionInspectorProps {
  sessionId: string;
  onInspectTask?: (task: Task) => void;
}

export const SessionInspector: React.FC<SessionInspectorProps> = ({
  sessionId,
  onInspectTask,
}) => {
  const { language } = useI18n();
  const { addToast, closeInspector, openInspector } = useUIStore();

  const session = useLiveQuery(() => db.sessions.get(sessionId), [sessionId]);
  const linkedTask = useLiveQuery(
    () => (session?.taskId ? db.tasks.get(session.taskId) : undefined),
    [session?.taskId]
  );
  const linkedProject = useLiveQuery(
    () => (session?.projectId ? db.projects.get(session.projectId) : undefined),
    [session?.projectId]
  );
  const allProjects = useLiveQuery(
    () => db.projects.where('workspaceId').equals(session?.workspaceId || 'default-workspace').filter((p) => !p.deletedAt).toArray(),
    [session?.workspaceId]
  ) || [];

  const [title, setTitle] = useState('');
  const [startTimeStr, setStartTimeStr] = useState('');
  const [endTimeStr, setEndTimeStr] = useState('');

  useEffect(() => {
    if (session) {
      setTitle(session.title || 'Focus session');
      setStartTimeStr(timeService.formatTime(session.startedAt));
      setEndTimeStr(session.endedAt ? timeService.formatTime(session.endedAt) : '--:--');
    }
  }, [session]);

  if (!session) {
    return (
      <div className="p-4 text-center text-xs text-slate-400">
        {language === 'zh-CN' ? '未找到专注会话记录。' : 'Session not found.'}
      </div>
    );
  }

  const handleTitleBlur = async () => {
    if (title.trim() && title.trim() !== session.title) {
      await updateSession(session.id, { title: title.trim() });
      addToast({
        message: language === 'zh-CN' ? '会话标题已更新' : 'Session title updated',
        type: 'info',
      });
    }
  };

  const handleProjectChange = async (projectIdVal: string) => {
    await updateSession(session.id, {
      projectId: projectIdVal !== 'none' ? projectIdVal : undefined,
    });
    addToast({
      message: language === 'zh-CN' ? '关联项目已更新' : 'Linked project updated',
      type: 'info',
    });
  };

  const handleDelete = async () => {
    const ok = await confirmDialog({
      title: language === 'zh-CN' ? '删除专注记录' : 'Delete session',
      message: language === 'zh-CN'
        ? `确定要删除此实际专注记录 "${session.title}" 吗？此操作不可撤销。`
        : `Delete this focus session "${session.title}"? This cannot be undone.`,
      destructive: true,
      confirmLabel: language === 'zh-CN' ? '删除' : 'Delete',
    });
    if (!ok) return;

    await deleteSession(session.id);
    addToast({
      message: language === 'zh-CN' ? '专注记录已删除' : 'Session deleted',
      type: 'info',
    });
    closeInspector();
  };

  const durationSeconds =
    session.activeDurationSeconds ||
    session.elapsedDurationSeconds ||
    (session.endedAt ? Math.floor((session.endedAt - session.startedAt) / 1000) : 0);

  return (
    <div className="p-4 space-y-4 text-xs select-none">
      {/* Header Badges & Type */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Badge variant="low" size="sm" className="bg-emerald-600 text-white border-0 px-2 py-0.5 text-xs font-semibold">
            {language === 'zh-CN' ? '实际完成 (Actual)' : 'Actual Session'}
          </Badge>
          <Badge variant="outline" size="sm" className="text-[10px] text-slate-500 uppercase">
            {session.kind === 'background' ? 'Background' : 'Active Focus'}
          </Badge>
        </div>

        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
          {timeService.formatDuration(durationSeconds)}
        </span>
      </div>

      {/* Title Input */}
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {language === 'zh-CN' ? '会话主题' : 'Session Title'}
        </label>
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          className="w-full text-sm font-semibold text-slate-900 dark:text-slate-100"
        />
      </div>

      {/* Time Range Stats Box */}
      <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-medium">
            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{language === 'zh-CN' ? '记录时间' : 'Recorded Time'}</span>
          </div>
          <span className="font-mono text-emerald-700 dark:text-emerald-300 font-semibold">
            {startTimeStr} – {endTimeStr}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-100/60 dark:border-emerald-900/30 text-[11px]">
          <div>
            <span className="text-slate-400">{language === 'zh-CN' ? '有效专注:' : 'Active Focus:'}</span>{' '}
            <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
              {timeService.formatDuration(session.activeDurationSeconds || durationSeconds)}
            </span>
          </div>
          <div>
            <span className="text-slate-400">{language === 'zh-CN' ? '总跨度:' : 'Total Elapsed:'}</span>{' '}
            <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
              {timeService.formatDuration(session.elapsedDurationSeconds || durationSeconds)}
            </span>
          </div>
        </div>
      </div>

      {/* Linked Entities */}
      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        {/* Linked Task */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {language === 'zh-CN' ? '关联任务' : 'Linked Task'}
          </span>
          {linkedTask ? (
            <div
              onClick={() => {
                if (onInspectTask) onInspectTask(linkedTask);
                else openInspector({ type: 'task', id: linkedTask.id, title: linkedTask.title });
              }}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <CheckSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {linkedTask.title}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0">
                {language === 'zh-CN' ? '查看详情 →' : 'View →'}
              </span>
            </div>
          ) : (
            <div className="p-2 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
              {language === 'zh-CN' ? '未关联具体任务 (独立专注记录)' : 'Standalone session (No linked task)'}
            </div>
          )}
        </div>

        {/* Linked Project */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {language === 'zh-CN' ? '关联项目' : 'Linked Project'}
            </span>
            {linkedProject && (
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: linkedProject.color || '#6366f1' }} />
                <span>{linkedProject.name}</span>
              </span>
            )}
          </div>
          <div className="relative">
            <select
              value={session.projectId || 'none'}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full h-8 px-2 pr-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 border-0 focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
            >
              <option value="none">{language === 'zh-CN' ? '无归属项目 (独立)' : 'No Project'}</option>
              {allProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Delete Action */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
        <Button
          size="sm"
          variant="danger"
          onClick={handleDelete}
          className="h-7 text-xs gap-1.5 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{language === 'zh-CN' ? '删除实际会话' : 'Delete Session'}</span>
        </Button>
      </div>
    </div>
  );
};
