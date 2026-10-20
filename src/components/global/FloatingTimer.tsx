import React, { useEffect, useState, useRef } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { finishSession, pauseSession, resumeSession } from '@/services/sessionCommands';
import { completeTask } from '@/services/taskCommands';
import { FocusZenModal } from '@/components/sessions/FocusZenModal';
import { ambientAudioService } from '@/core/audio/ambientAudioService';
import { nativeService } from '@/services/nativeService';
import {
  Play,
  Pause,
  CheckCircle2,
  MoreHorizontal,
  Clock,
  Timer,
  Maximize2,
  RotateCcw,
} from 'lucide-react';

export const FloatingTimer: React.FC = () => {
  const { language } = useI18n();
  const {
    runningSession,
    togglePauseSession,
    setRunningSession,
    tickSession,
    toggleTimerDisplayMode,
    setSessionTargetDurationMinutes,
    addToast,
  } = useUIStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showZenModal, setShowZenModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync ambient audio pause/mute with session pause status
  useEffect(() => {
    ambientAudioService.setTimerPaused(Boolean(runningSession?.isPaused));
  }, [runningSession?.isPaused]);

  useEffect(() => {
    if (!runningSession || runningSession.isPaused) return;

    const interval = setInterval(() => {
      tickSession();
    }, 1000);

    return () => clearInterval(interval);
  }, [runningSession, tickSession]);

  // 专注计时后台兜底：切到后台后 WebView 会节流 setInterval 导致计时漂移，
  // 因此在原生端排程一条「计时结束」本地通知（无目标时长则不排程）。
  useEffect(() => {
    if (!runningSession) return;
    const target = runningSession.targetDurationMinutes;
    if (!target) {
      nativeService.cancelFocusNotifications();
      return;
    }
    const remainingMs = Math.max(0, target * 60 - (runningSession.elapsedSeconds || 0)) * 1000;
    nativeService.scheduleFocusEndNotification(
      Date.now() + remainingMs,
      language === 'zh-CN' ? '专注计时结束' : 'Focus session ended',
      runningSession.title
    );
    return () => {
      nativeService.cancelFocusNotifications();
    };
  // 仅依赖会话与目标时长：elapsedSeconds 每秒递增，不应触发重新排程
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runningSession?.sessionId, runningSession?.targetDurationMinutes]);

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

  const targetMinutes = runningSession.targetDurationMinutes;
  const isCountdown = (runningSession.displayMode || (targetMinutes ? 'countdown' : 'stopwatch')) === 'countdown';

  let displayTime = formatTimer(runningSession.elapsedSeconds);
  let isOvertime = false;
  let progressPercent = 0;

  if (targetMinutes) {
    const targetSeconds = targetMinutes * 60;
    progressPercent = Math.min(100, Math.round((runningSession.elapsedSeconds / targetSeconds) * 100));

    if (isCountdown) {
      const remainingSeconds = targetSeconds - runningSession.elapsedSeconds;
      if (remainingSeconds >= 0) {
        displayTime = formatTimer(remainingSeconds);
      } else {
        isOvertime = true;
        displayTime = `+${formatTimer(Math.abs(remainingSeconds))}`;
      }
    }
  }

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
      // 任何结束会话的路径都要确保环境音/白噪音停止，避免“放弃”后仍播放
      ambientAudioService.stop();
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
      ambientAudioService.stop();
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
    ambientAudioService.stop();
    setRunningSession(null);
    setShowMenu(false);
    addToast({
      message: language === 'zh-CN' ? '已放弃本次专注计时' : 'Session discarded',
      type: 'info',
    });
  };

  return (
    <div className="fixed inset-x-3 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 bottom-[calc(env(safe-area-inset-bottom,0px)+4.25rem)] md:bottom-6 z-40 flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 animate-in slide-in-from-bottom-5 duration-200 select-none">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Mode Icon & Interactive Switcher */}
        <button
          type="button"
          onClick={toggleTimerDisplayMode}
          className="relative flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
          title={
            language === 'zh-CN'
              ? `当前模式：${isCountdown ? '倒计时' : '正向计时'} (点击切换)`
              : `Mode: ${isCountdown ? 'Countdown' : 'Stopwatch'} (Click to switch)`
          }
        >
          {isCountdown ? (
            <Timer className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          ) : (
            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          )}
        </button>

        {/* Timer & Task Title */}
        <div className="flex flex-col min-w-0 flex-1 md:min-w-32 md:max-w-56">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTimerDisplayMode}
              className={`font-mono text-sm font-bold tracking-tight cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${
                isOvertime ? 'text-amber-500 font-extrabold' : 'text-slate-900 dark:text-slate-100'
              }`}
              title={language === 'zh-CN' ? '点击切换倒计时 / 正向计时' : 'Click to toggle countdown / stopwatch'}
            >
              {displayTime}
            </button>
            {targetMinutes && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                {isCountdown ? (isOvertime ? '(超时)' : `/${targetMinutes}m`) : `/${targetMinutes}m`}
              </span>
            )}
            <span
              className={`inline-block w-2 h-2 rounded-full transition-colors ${
                runningSession.isPaused
                  ? 'bg-amber-500'
                  : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]'
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
            className="min-h-11 min-w-11 md:min-h-0 md:min-w-0 flex items-center justify-center p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
            className="flex items-center justify-center gap-1.5 min-h-11 md:min-h-0 px-3 md:px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title={language === 'zh-CN' ? '一键完成任务并结束会话' : 'Finish session and mark task done'}
            aria-label={language === 'zh-CN' ? '一键完成任务并结束会话' : 'Finish session and mark task done'}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{language === 'zh-CN' ? '一键完成' : 'Finish session'}</span>
          </button>

          {/* Maximize to Zen Focus Mode */}
          <button
            type="button"
            onClick={() => setShowZenModal(true)}
            className="min-h-11 min-w-11 md:min-h-0 md:min-w-0 flex items-center justify-center p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={language === 'zh-CN' ? '全屏沉浸专注 (番茄钟 & 白噪音)' : 'Full-screen Zen Mode (Pomodoro & Ambient Audio)'}
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* More Actions Menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu((prev) => !prev)}
              className="min-h-11 min-w-11 md:min-h-0 md:min-w-0 flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 bottom-full mb-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1.5 z-50 text-xs animate-in fade-in-50 zoom-in-95 duration-150 space-y-1">
                {/* Target Duration Adjustment */}
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/60 pb-1">
                  {language === 'zh-CN' ? '设定目标时长' : 'Target Duration'}
                </div>
                <div className="px-2 py-1 flex flex-wrap gap-1">
                  {[15, 25, 30, 45, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        setSessionTargetDurationMinutes(mins);
                        setShowMenu(false);
                      }}
                      className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer transition-colors ${
                        targetMinutes === mins
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setSessionTargetDurationMinutes((targetMinutes || 25) + 15);
                      setShowMenu(false);
                    }}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-100 cursor-pointer"
                  >
                    +15m
                  </button>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-700/60 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    toggleTimerDisplayMode();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {language === 'zh-CN'
                      ? `切换为${isCountdown ? '正向计时' : '倒计时'}`
                      : `Switch to ${isCountdown ? 'Stopwatch' : 'Countdown'}`}
                  </span>
                </button>

                <div className="h-px bg-slate-100 dark:bg-slate-700/60 my-1" />

                <button
                  type="button"
                  onClick={handleEndWithoutComplete}
                  className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                >
                  {language === 'zh-CN' ? '仅结束专注（不完成任务）' : 'End session (keep task open)'}
                </button>
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="w-full text-left px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                >
                  {language === 'zh-CN' ? '放弃本次计时' : 'Discard session'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visual Progress Bar on Bottom */}
      {targetMinutes && progressPercent > 0 && (
        <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-b-2xl overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isOvertime ? 'bg-amber-500' : 'bg-indigo-600 dark:bg-indigo-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Full-Screen Zen Focus Modal */}
      <FocusZenModal
        isOpen={showZenModal}
        onClose={() => setShowZenModal(false)}
      />
    </div>
  );
};
