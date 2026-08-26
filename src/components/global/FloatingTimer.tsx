import React, { useEffect, useState, useRef } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { finishSession, pauseSession, resumeSession } from '@/services/sessionCommands';
import { completeTask } from '@/services/taskCommands';
import { Play, Pause, CheckCircle2, MoreHorizontal, Clock } from 'lucide-react';

export const FloatingTimer: React.FC = () => {
  const { language } = useI18n();
  const { runningSession, togglePauseSession, setRunningSession, tickSession, addToast } = useUIStore();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!runningSession || runningSession.isPaused) return;

    const interval = setInterval(() => {
      tickSession();
    }, 1000);

    return () => clearInterval(interval);
  }, [runningSession, tickSession]);

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  if (!runningSession) return null;

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTogglePause = async () => {
    togglePauseSession();
    try {
      if (runningSession.isPaused) {
        await resumeSession(runningSession.sessionId);
      } else {
        await pauseSession(runningSession.sessionId);
      }
    } catch {
      // ignore
    }
  };

  /**
   * One-click Finish Session: commits session to DB, marks task as Done, and clears timer.
   */
  const handleFinishAndComplete = async () => {
    try {
      await finishSession(runningSession.sessionId);
      if (runningSession.taskId) {
        await completeTask(runningSession.taskId);
      }
      addToast({
        message: language === 'zh-CN'
          ? `专注已完成！已专注 ${formatTimer(runningSession.elapsedSeconds)}，任务已自动标记为完成。`
          : `Session finished! Focused ${formatTimer(runningSession.elapsedSeconds)}, task marked as done.`,
        type: 'success',
      });
    } catch {
      addToast({
        message: language === 'zh-CN' ? '专注会话已结束' : 'Session ended',
        type: 'info',
      });
    } finally {
      setRunningSession(null);
      setShowMenu(false);
    }
  };

  /**
   * End session only without completing the task.
   */
  const handleEndWithoutComplete = async () => {
    try {
      await finishSession(runningSession.sessionId);
      addToast({
        message: language === 'zh-CN'
          ? `会话记录已保存：共专注 ${formatTimer(runningSession.elapsedSeconds)}`
          : `Session saved: focused ${formatTimer(runningSession.elapsedSeconds)}`,
        type: 'info',
      });
    } catch {
      // ignore
    } finally {
      setRunningSession(null);
      setShowMenu(false);
    }
  };

  /**
   * Discard timer.
   */
  const handleDiscard = () => {
    setRunningSession(null);
    setShowMenu(false);
    addToast({
      message: language === 'zh-CN' ? '已放弃本次专注计时' : 'Session discarded',
      type: 'info',
    });
  };

  return (
    <div className="fixed bottom-5 right-6 z-40 flex items-center gap-3 px-4 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-900 dark:text-slate-100 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 animate-in slide-in-from-bottom-5 duration-200 select-none">
      {/* Circular animated pulse or ring */}
      <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 shrink-0">
        <Clock className={`w-4 h-4 text-indigo-600 dark:text-indigo-400 ${!runningSession.isPaused ? 'animate-pulse' : ''}`} />
      </div>

      {/* Timer & Task Title */}
      <div className="flex flex-col min-w-32 max-w-56">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {formatTimer(runningSession.elapsedSeconds)}
          </span>
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${
              runningSession.isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-ping'
            }`}
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
          <span className="truncate font-medium text-slate-700 dark:text-slate-300">
            {runningSession.title}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
        {/* Pause / Resume Button */}
        <button
          type="button"
          onClick={handleTogglePause}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title={runningSession.isPaused ? (language === 'zh-CN' ? '继续专注' : 'Resume') : (language === 'zh-CN' ? '暂停' : 'Pause')}
        >
          {runningSession.isPaused ? (
            <Play className="w-4 h-4 fill-current" />
          ) : (
            <Pause className="w-4 h-4 fill-current" />
          )}
        </button>

        {/* Primary "Finish session" One-Click Complete Button */}
        <button
          type="button"
          onClick={handleFinishAndComplete}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          title={language === 'zh-CN' ? '一键完成任务并结束会话' : 'Finish session and mark task done'}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{language === 'zh-CN' ? '一键完成' : 'Finish session'}</span>
        </button>

        {/* More Actions Menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowMenu((prev) => !prev)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50 text-xs animate-in fade-in-50 zoom-in-95 duration-150">
              <button
                type="button"
                onClick={handleEndWithoutComplete}
                className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
              >
                {language === 'zh-CN' ? '仅结束专注（不完成任务）' : 'End session (keep task open)'}
              </button>
              <button
                type="button"
                onClick={handleDiscard}
                className="w-full text-left px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
              >
                {language === 'zh-CN' ? '放弃本次计时' : 'Discard session'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
