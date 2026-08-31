import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { ambientAudioService, type AmbientSoundType } from '@/core/audio/ambientAudioService';
import { finishSession, pauseSession, resumeSession } from '@/services/sessionCommands';
import { completeTask } from '@/services/taskCommands';
import { Button } from '@/components/ui/Button';
import { AmbientBackgroundVisualizer } from './AmbientBackgroundVisualizer';
import {
  Play,
  Pause,
  CheckCircle2,
  Minimize2,
  Volume2,
  VolumeX,
  Sparkles,
  Timer,
  Clock,
  CloudRain,
  Waves,
  Wind,
  Sliders,
  Coffee,
  Brain,
} from 'lucide-react';

interface FocusZenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type FocusTimerMode = 'stopwatch' | 'countdown';

export const FocusZenModal: React.FC<FocusZenModalProps> = ({ isOpen, onClose }) => {
  const { language } = useI18n();
  const {
    runningSession,
    togglePauseSession,
    setRunningSession,
    setSessionTargetDurationMinutes,
    addToast,
  } = useUIStore();

  const targetMinutes = runningSession?.targetDurationMinutes || 25;
  const initialMode: FocusTimerMode = runningSession?.displayMode === 'stopwatch' ? 'stopwatch' : 'countdown';
  const [timerMode, setTimerMode] = useState<FocusTimerMode>(initialMode);
  const [currentSound, setCurrentSound] = useState<AmbientSoundType>('none');
  const [volume, setVolume] = useState<number>(50);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Sync state with ambientAudioService
  useEffect(() => {
    setCurrentSound(ambientAudioService.getCurrentSound());
    setVolume(Math.round(ambientAudioService.getVolume() * 100));
    setIsMuted(ambientAudioService.getIsMuted());
  }, [isOpen]);

  // Derive Countdown & Cycle status dynamically based on targetMinutes
  const FOCUS_SECONDS = targetMinutes * 60;
  const BREAK_SECONDS = 5 * 60;
  const CYCLE_SECONDS = FOCUS_SECONDS + BREAK_SECONDS;

  const elapsed = runningSession?.elapsedSeconds || 0;
  const cycleOffset = elapsed % CYCLE_SECONDS;
  const isBreak = cycleOffset >= FOCUS_SECONDS;
  const countdownSecondsLeft = isBreak
    ? CYCLE_SECONDS - cycleOffset
    : FOCUS_SECONDS - cycleOffset;

  const prevIsBreakRef = React.useRef<boolean>(isBreak);

  // Trigger audio chime & toast on phase transitions
  useEffect(() => {
    if (!isOpen || !runningSession || runningSession.isPaused) return;

    if (prevIsBreakRef.current !== isBreak) {
      prevIsBreakRef.current = isBreak;
      ambientAudioService.playZenChime();
      if (isBreak) {
        addToast({
          message: language === 'zh-CN' ? '专注时段已完成！进入 5 分钟轻度休息' : 'Focus session finished! Take a 5m break',
          type: 'success',
        });
      } else {
        addToast({
          message: language === 'zh-CN' ? '休息结束，准备开启下一个深度工作时段' : 'Break over! Ready for next deep focus',
          type: 'info',
        });
      }
    }
  }, [isOpen, runningSession, isBreak, language, addToast]);

  if (!isOpen || !runningSession || typeof document === 'undefined') return null;

  const formatSeconds = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSoundChange = (type: AmbientSoundType) => {
    setCurrentSound(type);
    ambientAudioService.playSound(type);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    ambientAudioService.setVolume(newVol / 100);
  };

  const handleToggleMute = () => {
    const muted = ambientAudioService.toggleMute();
    setIsMuted(muted);
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

  const handleFinishAndComplete = async () => {
    try {
      await finishSession(runningSession.sessionId);
      if (runningSession.taskId) {
        await completeTask(runningSession.taskId);
      }
      ambientAudioService.stop();
      ambientAudioService.playZenChime();
      addToast({
        message: language === 'zh-CN' ? '专注已圆满结束，任务已自动标记为完成！' : 'Session finished! Task marked as completed.',
        type: 'success',
      });
    } finally {
      setRunningSession(null);
      onClose();
    }
  };

  const handleEndWithoutComplete = async () => {
    try {
      await finishSession(runningSession.sessionId);
      ambientAudioService.stop();
      addToast({
        message: language === 'zh-CN' ? '专注记录已归档保存' : 'Session archived and saved',
        type: 'info',
      });
    } finally {
      setRunningSession(null);
      onClose();
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-9999 w-screen h-screen flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl text-slate-100 p-6 select-none animate-in fade-in duration-200">
      {/* Procedural GPU-Accelerated Dynamic Ambient Background */}
      <AmbientBackgroundVisualizer
        soundType={currentSound}
        isPaused={runningSession.isPaused}
      />

      <div className="relative w-full max-w-2xl flex flex-col items-center justify-between min-h-[560px] p-8 space-y-8">
        {/* Top Bar */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
              {language === 'zh-CN' ? '极客沉浸专注模式' : 'Zen Focus Workspace'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Switcher: Countdown vs Stopwatch */}
            <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setTimerMode('countdown')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  timerMode === 'countdown'
                    ? 'bg-indigo-600 text-white font-medium shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                <span>
                  {language === 'zh-CN'
                    ? targetMinutes === 25 ? '番茄钟 (25m)' : `倒计时 (${targetMinutes}m)`
                    : `Countdown (${targetMinutes}m)`}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTimerMode('stopwatch')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  timerMode === 'stopwatch'
                    ? 'bg-indigo-600 text-white font-medium shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{language === 'zh-CN' ? '正向计时' : 'Stopwatch'}</span>
              </button>
            </div>

            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800/80 cursor-pointer"
              title={language === 'zh-CN' ? '最小化为悬浮窗' : 'Minimize to floating widget'}
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Center: Status, Duration Chips, & Time Display */}
        <div className="flex flex-col items-center justify-center space-y-5 text-center">
          {/* Status Label */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-950/70 border border-indigo-800/70 text-indigo-300 text-xs font-semibold">
            <span
              className={`w-2 h-2 rounded-full transition-colors ${
                runningSession.isPaused
                  ? 'bg-amber-400'
                  : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
              }`}
            />
            <div className="flex items-center gap-1.5">
              {runningSession.isPaused ? (
                <span>{language === 'zh-CN' ? '专注已暂停' : 'Paused'}</span>
              ) : isBreak ? (
                <>
                  <Coffee className="w-3.5 h-3.5 text-amber-300" />
                  <span>{language === 'zh-CN' ? '休息时段' : 'Rest Break'}</span>
                </>
              ) : (
                <>
                  <Brain className="w-3.5 h-3.5 text-indigo-300" />
                  <span>
                    {language === 'zh-CN'
                      ? `深度专注中 (${targetMinutes}m 目标)`
                      : `Deep Focus (${targetMinutes}m Target)`}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Quick Target Duration Chips */}
          <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-800/60 text-xs">
            <span className="text-[11px] text-slate-400 px-1.5">
              {language === 'zh-CN' ? '设定目标' : 'Target'}:
            </span>
            {[15, 25, 30, 45, 60, 90].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setSessionTargetDurationMinutes(mins)}
                className={`px-2 py-1 rounded-lg text-xs cursor-pointer transition-colors ${
                  targetMinutes === mins
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {mins}m
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSessionTargetDurationMinutes(targetMinutes + 15)}
              className="px-2 py-1 rounded-lg text-xs bg-indigo-950/60 text-indigo-300 hover:bg-indigo-900/80 font-medium cursor-pointer"
            >
              +15m
            </button>
          </div>

          {/* Task Title */}
          <h2 className="text-xl md:text-2xl font-bold text-white max-w-lg truncate tracking-tight">
            {runningSession.title || (language === 'zh-CN' ? '深度工作' : 'Deep Work')}
          </h2>

          {/* Huge Digital Clock */}
          <div className="relative flex flex-col items-center justify-center my-1">
            <div className={`text-6xl md:text-8xl font-mono font-bold tracking-tight text-white ${!runningSession.isPaused ? 'drop-shadow-[0_0_35px_rgba(99,102,241,0.45)]' : 'opacity-70'}`}>
              {timerMode === 'countdown'
                ? formatSeconds(countdownSecondsLeft)
                : formatSeconds(runningSession.elapsedSeconds)}
            </div>
            {timerMode === 'stopwatch' && (
              <div className="text-xs text-slate-400 font-mono mt-1">
                {language === 'zh-CN' ? '目标时长' : 'Target'}: {targetMinutes}m ({Math.min(100, Math.round((runningSession.elapsedSeconds / (targetMinutes * 60)) * 100))}%)
              </div>
            )}
          </div>

          {/* Primary Controls: Pause/Resume + Complete */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleTogglePause}
              className="px-5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all cursor-pointer shadow-md"
            >
              {runningSession.isPaused ? (
                <>
                  <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                  <span>{language === 'zh-CN' ? '继续专注' : 'Resume'}</span>
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>{language === 'zh-CN' ? '暂停计时' : 'Pause'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleFinishAndComplete}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>{language === 'zh-CN' ? '打卡结案并完成任务' : 'Finish & Mark Done'}</span>
            </button>

            <button
              type="button"
              onClick={handleEndWithoutComplete}
              className="px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 text-xs font-medium transition-all cursor-pointer"
            >
              {language === 'zh-CN' ? '仅结束会话' : 'End Session'}
            </button>
          </div>
        </div>

        {/* Bottom Ambient Sound Control Dock */}
        <div className="w-full max-w-xl bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>{language === 'zh-CN' ? '环境白噪音 (Web Audio 原生程序化合成)' : 'Ambient Sound Synthesizer'}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleMute}
                className="p-1 rounded-md text-slate-400 hover:text-white cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-20 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <span className="text-[11px] font-mono text-slate-400 w-8">{volume}%</span>
            </div>
          </div>

          {/* Sound Preset Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'none' as const, label: language === 'zh-CN' ? '静音' : 'Off', icon: VolumeX },
              { id: 'rain' as const, label: language === 'zh-CN' ? '柔和春雨' : 'Spring Rain', icon: CloudRain },
              { id: 'waves' as const, label: language === 'zh-CN' ? '潮汐海浪' : 'Ocean Waves', icon: Waves },
              { id: 'white_noise' as const, label: language === 'zh-CN' ? '纯净白噪' : 'White Noise', icon: Wind },
            ].map((sound) => {
              const Icon = sound.icon;
              const isSelected = currentSound === sound.id;
              return (
                <button
                  key={sound.id}
                  type="button"
                  onClick={() => handleSoundChange(sound.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/80 font-semibold shadow-inner'
                      : 'bg-slate-800/50 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="truncate">{sound.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
