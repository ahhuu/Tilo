import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Square,
  Flame,
  Minimize2,
  Maximize2,
  Clock,
} from 'lucide-react';
import { useI18n } from '@/core/i18n';
import { useUIStore } from '@/stores/uiStore';
import { useWidgetStore } from '@/stores/widgetStore';
import { useTasks, useSessions } from '@/storage/hooks/useLiveQuery';
import { startSession, pauseSession, resumeSession, finishSession } from '@/services/sessionCommands';
import { timeService } from '@/core/time/timeService';

export const SessionGrid: React.FC = () => {
  const { language } = useI18n();
  const isZh = language === 'zh-CN';
  const { runningSession, setRunningSession, tickSession, addToast } = useUIStore();
  const { settings, updateGridSettings } = useWidgetStore();
  const gridSetting = settings.gridSettings.session;

  const [selectedDuration, setSelectedDuration] = useState<number>(
    gridSetting.defaultDurationMinutes
  );
  const [sessionTitle, setSessionTitle] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [isCapsule, setIsCapsule] = useState<boolean>(gridSetting.isCapsuleMode || false);

  const logicalDate = timeService.getLogicalDate();
  const startOfDayMs = timeService.getStartOfLogicalDay(logicalDate);
  const endOfDayMs = timeService.getEndOfLogicalDay(logicalDate);

  const tasks = useTasks();
  const todaySessions = useSessions(startOfDayMs, endOfDayMs);

  const todayTotalSeconds = (todaySessions || []).reduce((acc, sess) => {
    return acc + (sess.activeDurationSeconds || 0);
  }, 0);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!runningSession || runningSession.isPaused) return;

    const timer = setInterval(() => {
      tickSession();
    }, 1000);

    return () => clearInterval(timer);
  }, [runningSession, tickSession]);

  const handleStart = async () => {
    const task = tasks?.find((t) => t.id === selectedTaskId);
    const defaultTitle = isZh ? '专注冲刺' : 'Focus Sprint';
    const title = sessionTitle.trim() || task?.title || defaultTitle;

    try {
      const sess = await startSession({
        taskId: selectedTaskId || undefined,
        title,
        kind: 'active',
        source: 'timer',
      });

      setRunningSession({
        sessionId: sess.id,
        taskId: selectedTaskId || undefined,
        title,
        startedAt: sess.startedAt,
        elapsedSeconds: 0,
        isPaused: false,
        targetDurationMinutes: selectedDuration > 0 ? selectedDuration : undefined,
        displayMode: selectedDuration > 0 ? 'countdown' : 'stopwatch',
      });

      addToast({ message: isZh ? `开始专注: ${title}` : `Focus started: ${title}`, type: 'success' });
    } catch {
      addToast({ message: isZh ? '启动专注失败' : 'Failed to start session', type: 'error' });
    }
  };

  const handlePause = async () => {
    if (!runningSession) return;
    try {
      if (runningSession.isPaused) {
        await resumeSession(runningSession.sessionId);
        setRunningSession({ ...runningSession, isPaused: false });
      } else {
        await pauseSession(runningSession.sessionId);
        setRunningSession({ ...runningSession, isPaused: true });
      }
    } catch {
      addToast({ message: '操作会话失败', type: 'error' });
    }
  };

  const handleStop = async () => {
    if (!runningSession) return;
    try {
      await finishSession(runningSession.sessionId);
      setRunningSession(null);
      addToast({ message: '专注结束！已归档为实际执行记录', type: 'success' });
    } catch {
      addToast({ message: '结束专注失败', type: 'error' });
    }
  };

  const toggleCapsuleMode = async () => {
    const nextMode = !isCapsule;
    setIsCapsule(nextMode);
    updateGridSettings('session', { isCapsuleMode: nextMode });

    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const { LogicalSize } = await import('@tauri-apps/api/dpi');
        const win = getCurrentWindow();
        if (nextMode) {
          await win.setSize(new LogicalSize(280, 56));
        } else {
          await win.setSize(new LogicalSize(320, 420));
        }
      } catch (err) {
        console.warn('Failed to resize window for capsule mode', err);
      }
    }
  };

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    if (!taskId) return;
    const task = tasks?.find((t) => t.id === taskId);
    if (task) {
      if (task.estimateMinutes && task.estimateMinutes > 0) {
        setSelectedDuration(task.estimateMinutes);
      }
      setSessionTitle(task.title);
    }
  };

  const selectedTask = tasks?.find((t) => t.id === selectedTaskId);

  let displayTime = '00:00';
  let progressPercent = 0;
  if (runningSession) {
    if (runningSession.targetDurationMinutes && runningSession.targetDurationMinutes > 0) {
      const targetSec = runningSession.targetDurationMinutes * 60;
      const remainingSec = Math.max(0, targetSec - runningSession.elapsedSeconds);
      displayTime = formatSeconds(remainingSec);
      progressPercent = Math.min(100, Math.round((runningSession.elapsedSeconds / targetSec) * 100));
    } else {
      displayTime = formatSeconds(runningSession.elapsedSeconds);
    }
  }

  // 极窄灵动胶囊态视图
  if (isCapsule) {
    return (
      <div className="flex items-center justify-between px-3 py-1.5 w-full h-full bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md rounded-2xl border border-slate-700/60 text-white shadow-xl select-none">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={runningSession ? handlePause : handleStart}
            className="p-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white cursor-pointer shrink-0 transition-colors shadow-2xs"
            title={runningSession ? (runningSession.isPaused ? (isZh ? '继续' : 'Resume') : (isZh ? '暂停' : 'Pause')) : (isZh ? '开始' : 'Start')}
          >
            {runningSession && !runningSession.isPaused ? (
              <Pause className="w-3 h-3 fill-current" />
            ) : (
              <Play className="w-3 h-3 fill-current" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-semibold text-slate-100 truncate block max-w-[120px]">
              {runningSession?.title || sessionTitle || (isZh ? '专注冲刺' : 'Focus Sprint')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-xs font-bold text-amber-400">
            {displayTime}
          </span>
          {runningSession && (
            <button
              type="button"
              onClick={handleStop}
              className="p-1 rounded text-slate-400 hover:text-rose-400 cursor-pointer transition-colors"
              title={isZh ? '完成并结束' : 'Finish Session'}
            >
              <Square className="w-3 h-3 fill-current" />
            </button>
          )}
          <button
            type="button"
            onClick={toggleCapsuleMode}
            className="p-1 rounded text-slate-400 hover:text-white cursor-pointer transition-colors"
            title={isZh ? '展开为大卡片' : 'Expand to Card'}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-transparent overflow-hidden select-none">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-200/40 dark:border-slate-800/40 bg-slate-50/40 dark:bg-slate-800/20">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {isZh ? '专注计时' : 'Focus Timer'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* 今日累计 */}
          <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
            <Flame className="w-3 h-3" />
            <span>{isZh ? `今日 ${Math.round(todayTotalSeconds / 60)} 分钟` : `Today ${Math.round(todayTotalSeconds / 60)}m`}</span>
          </div>

          {/* 切换灵动胶囊模式 */}
          <button
            type="button"
            onClick={toggleCapsuleMode}
            className="p-1 rounded-md text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
            title={isZh ? '切换为极窄灵动胶囊条' : 'Switch to Mini Capsule'}
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 主体交互区域 */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {runningSession ? (
          <div className="w-full flex flex-col items-center text-center space-y-3">
            <div className="w-full">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                {runningSession.isPaused ? (isZh ? '已暂停' : 'Paused') : (isZh ? '专注进行中' : 'Focusing')}
              </span>
              <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5 max-w-[200px] mx-auto">
                {runningSession.title}
              </h4>
            </div>

            <div className="text-4xl font-mono font-bold tracking-tight text-slate-900 dark:text-white">
              {displayTime}
            </div>

            {runningSession.targetDurationMinutes && (
              <div className="w-full max-w-[180px] h-1.5 bg-slate-200/60 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handlePause}
                className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer"
                title={runningSession.isPaused ? (isZh ? '继续' : 'Resume') : (isZh ? '暂停' : 'Pause')}
              >
                {runningSession.isPaused ? (
                  <Play className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-current" />
                ) : (
                  <Pause className="w-4 h-4 fill-current" />
                )}
              </button>

              <button
                type="button"
                onClick={handleStop}
                className="p-2.5 rounded-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors shadow-2xs cursor-pointer"
                title={isZh ? '完成并结束专注' : 'Finish session'}
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col space-y-3">
            <div className="flex items-center justify-center gap-1.5">
              {[15, 25, 45, 0].map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => {
                    setSelectedDuration(dur);
                    updateGridSettings('session', { defaultDurationMinutes: dur });
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    selectedDuration === dur
                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 shadow-2xs font-semibold'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/40 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {dur === 0 ? (isZh ? '自由计时' : 'Stopwatch') : `${dur}m`}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <select
                value={selectedTaskId}
                onChange={(e) => handleSelectTask(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="">{isZh ? '🎯 自由专注 (不绑定任务)' : '🎯 Free Focus (No Task)'}</option>
                {(tasks || [])
                  .filter((t) => !t.deletedAt && t.statusId !== 'ws-task-done')
                  .slice(0, 10)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} {t.estimateMinutes ? `(${t.estimateMinutes}m)` : ''}
                    </option>
                  ))}
              </select>

              {selectedTask && selectedTask.estimateMinutes && selectedTask.estimateMinutes > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-lg border border-amber-200/60 dark:border-amber-800/60">
                  <Clock className="w-3 h-3 text-amber-500" />
                  <span>{isZh ? `已自动同步任务预估工时: ${selectedTask.estimateMinutes} 分钟` : `Synced estimate: ${selectedTask.estimateMinutes}m`}</span>
                </div>
              )}

              {!selectedTaskId && (
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder={isZh ? '专注目标 (例如：完成需求方案)' : 'Focus objective (e.g., Design UI)'}
                  className="w-full text-xs px-2.5 py-1.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-amber-500"
                />
              )}
            </div>

            <button
              type="button"
              onClick={handleStart}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isZh ? '开始专注' : 'Start Focus'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 底部统计 */}
      <div className="px-3.5 py-2 border-t border-slate-200/50 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-[10px] text-slate-400">
        <span>{isZh ? '今日专注轮次' : 'Sessions Today'}</span>
        <span className="font-semibold text-slate-600 dark:text-slate-300 font-mono">
          {isZh ? `${(todaySessions || []).length} 轮` : `${(todaySessions || []).length}`}
        </span>
      </div>
    </div>
  );
};
