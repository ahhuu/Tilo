import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '@/core/i18n';
import { timeService } from '@/core/time/timeService';
import { useUIStore } from '@/stores/uiStore';
import {
  generateAutoPackProposals,
  applyAutoPackProposals,
  undoAutoPack,
  type AutoPackProposal,
  type AutoPackOptions,
} from '@/services/autoPackService';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Sparkles,
  Clock,
  Check,
  X,
  Calendar,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Zap,
  Coffee,
  Filter,
} from 'lucide-react';

interface AutoPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateKey?: string;
}

const STORAGE_KEY_AUTOPACK_PREFS = 'tilo_autopack_preferences';

interface AutoPackCustomPrefs {
  workdayStartHour: number;
  workdayEndHour: number;
  bufferMinutes: number;
  defaultEstimateMinutes: number;
  priorityFilter: 'all' | 'highAndUrgent' | 'withEstimatesOnly';
  startFromCurrentTime: boolean;
  includeSomedayTasks: boolean;
}

const DEFAULT_PREFS: AutoPackCustomPrefs = {
  workdayStartHour: 9,
  workdayEndHour: 19,
  bufferMinutes: 5,
  defaultEstimateMinutes: 30,
  priorityFilter: 'all',
  startFromCurrentTime: true,
  includeSomedayTasks: false,
};

export const AutoPackModal: React.FC<AutoPackModalProps> = ({ isOpen, onClose, dateKey }) => {
  const { language } = useI18n();
  const { addToast } = useUIStore();

  const [loading, setLoading] = useState(false);
  const [proposals, setProposals] = useState<AutoPackProposal[]>([]);
  const [unassignedCount, setUnassignedCount] = useState(0);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Load customizable preferences
  const [prefs, setPrefs] = useState<AutoPackCustomPrefs>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTOPACK_PREFS);
      if (saved) return { ...DEFAULT_PREFS, ...JSON.parse(saved) };
    } catch {
      // fallback
    }
    return DEFAULT_PREFS;
  });

  const targetDateKey = dateKey || timeService.getLogicalDate(Date.now());

  const handleCalculate = useCallback(async (customPrefs = prefs) => {
    setLoading(true);
    try {
      const options: AutoPackOptions = {
        dateKey: targetDateKey,
        workdayStartHour: customPrefs.workdayStartHour,
        workdayEndHour: customPrefs.workdayEndHour,
        bufferMinutes: customPrefs.bufferMinutes,
        defaultEstimateMinutes: customPrefs.defaultEstimateMinutes,
        priorityFilter: customPrefs.priorityFilter,
        startFromCurrentTimeIfToday: customPrefs.startFromCurrentTime,
        includeSomedayTasks: customPrefs.includeSomedayTasks,
      };

      const result = await generateAutoPackProposals(options);
      setProposals(result.proposals);
      setUnassignedCount(result.unassignedTasksCount);
      setHasCalculated(true);
    } catch {
      addToast({
        message: language === 'zh-CN' ? '生成智能排期方案失败' : 'Failed to generate auto-pack plan',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [targetDateKey, prefs, language, addToast]);

  useEffect(() => {
    if (isOpen) {
      handleCalculate();
    } else {
      setHasCalculated(false);
      setProposals([]);
    }
  }, [isOpen, handleCalculate]);

  const updatePref = <K extends keyof AutoPackCustomPrefs>(key: K, value: AutoPackCustomPrefs[K]) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(STORAGE_KEY_AUTOPACK_PREFS, JSON.stringify(next));
      } catch {
        // ignore
      }
      handleCalculate(next);
      return next;
    });
  };

  const resetPrefs = () => {
    setPrefs(DEFAULT_PREFS);
    try {
      localStorage.setItem(STORAGE_KEY_AUTOPACK_PREFS, JSON.stringify(DEFAULT_PREFS));
    } catch {
      // ignore
    }
    handleCalculate(DEFAULT_PREFS);
  };

  if (!isOpen) return null;

  const handleApply = async () => {
    if (proposals.length === 0) return;
    setLoading(true);
    try {
      const created = await applyAutoPackProposals(proposals);
      const createdIds = created.map((b) => b.id);

      addToast({
        message: language === 'zh-CN'
          ? `已成功将 ${created.length} 个任务智能排入今日时间盒！`
          : `Successfully auto-packed ${created.length} tasks!`,
        type: 'success',
        undoAction: async () => {
          await undoAutoPack(createdIds);
          addToast({
            message: language === 'zh-CN' ? '已撤销本次智能排期' : 'Auto-pack undone',
            type: 'info',
          });
        },
      });
      onClose();
    } catch {
      addToast({
        message: language === 'zh-CN' ? '应用排期失败' : 'Failed to apply auto-pack',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const totalPackedMinutes = proposals.reduce((acc, p) => acc + p.estimateMinutes, 0);

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border-t sm:border border-slate-200/90 dark:border-slate-800 w-full max-w-xl overflow-hidden flex flex-col max-h-[86vh] sm:max-h-[90vh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2 shrink-0" />
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {language === 'zh-CN' ? '智能排盒与空隙填充' : 'Smart Auto-Pack Day'}
                </h3>
                <Badge variant="indigo" size="sm">
                  {targetDateKey}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'zh-CN'
                  ? '自动发现今日时间线空闲缝隙，按优先级与预估时长智能填充任务'
                  : 'Fills free timeline gaps intelligently based on priority & duration'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConfig((prev) => !prev)}
              className={`h-8 px-2.5 text-xs gap-1.5 cursor-pointer ${
                showConfig ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400' : ''
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{language === 'zh-CN' ? '排盒规则' : 'Rules'}</span>
              {showConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </Button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Customizable Rules Drawer */}
        {showConfig && (
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 space-y-3.5 text-xs animate-in slide-in-from-top-2 duration-150 overflow-y-auto max-h-56">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {language === 'zh-CN' ? '排盒规则与个性化偏好' : 'Auto-Pack Preferences'}
              </span>
              <button
                type="button"
                onClick={resetPrefs}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{language === 'zh-CN' ? '恢复默认' : 'Reset defaults'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Work Hours Range */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-500" />
                  <span>{language === 'zh-CN' ? '工作时段范围' : 'Workday Hours'}</span>
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={prefs.workdayStartHour}
                    onChange={(e) => updatePref('workdayStartHour', Number(e.target.value))}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs"
                  >
                    <option value={8}>08:00</option>
                    <option value={9}>09:00</option>
                    <option value={10}>10:00</option>
                  </select>
                  <span className="text-slate-400">~</span>
                  <select
                    value={prefs.workdayEndHour}
                    onChange={(e) => updatePref('workdayEndHour', Number(e.target.value))}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs"
                  >
                    <option value={17}>17:00</option>
                    <option value={18}>18:00</option>
                    <option value={19}>19:00</option>
                    <option value={20}>20:00</option>
                    <option value={21}>21:00</option>
                    <option value={22}>22:00</option>
                  </select>
                </div>
              </div>

              {/* Buffer Minutes */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <Coffee className="w-3 h-3 text-amber-500" />
                  <span>{language === 'zh-CN' ? '盒间缓冲间隙' : 'Buffer Gap Between Blocks'}</span>
                </label>
                <div className="flex items-center gap-1.5">
                  {[0, 5, 10, 15].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => updatePref('bufferMinutes', m)}
                      className={`flex-1 py-1 rounded-md text-[11px] font-mono font-medium border cursor-pointer transition-colors ${
                        prefs.bufferMinutes === m
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Estimate */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <Zap className="w-3 h-3 text-purple-500" />
                  <span>{language === 'zh-CN' ? '无预估默认时长' : 'Default Duration'}</span>
                </label>
                <div className="flex items-center gap-1.5">
                  {[15, 25, 30, 45, 60].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => updatePref('defaultEstimateMinutes', m)}
                      className={`flex-1 py-1 rounded-md text-[11px] font-mono font-medium border cursor-pointer transition-colors ${
                        prefs.defaultEstimateMinutes === m
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Filter */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <Filter className="w-3 h-3 text-sky-500" />
                  <span>{language === 'zh-CN' ? '候选任务优先级' : 'Task Priority Scope'}</span>
                </label>
                <div className="flex items-center gap-1.5">
                  {[
                    { key: 'all', label: language === 'zh-CN' ? '全部待办' : 'All' },
                    { key: 'highAndUrgent', label: language === 'zh-CN' ? '仅高优/紧急' : 'High/Urgent' },
                    { key: 'withEstimatesOnly', label: language === 'zh-CN' ? '仅有工时预估' : 'Estimated' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => updatePref('priorityFilter', item.key as AutoPackCustomPrefs['priorityFilter'])}
                      className={`flex-1 py-1 px-1.5 rounded-md text-[11px] font-medium border cursor-pointer transition-colors truncate ${
                        prefs.priorityFilter === item.key
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px]">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={prefs.startFromCurrentTime}
                  onChange={(e) => updatePref('startFromCurrentTime', e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>{language === 'zh-CN' ? '仅从当前时刻之后排起' : 'Start after current time'}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={prefs.includeSomedayTasks}
                  onChange={(e) => updatePref('includeSomedayTasks', e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>{language === 'zh-CN' ? '包含稍后整理 (Someday) 任务' : 'Include Someday tasks'}</span>
              </label>
            </div>
          </div>
        )}

        {/* Body: Proposals List */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <Sparkles className="w-6 h-6 mx-auto animate-spin text-indigo-500" />
              <p>{language === 'zh-CN' ? '正在智能计算全天最佳排盒方案...' : 'Calculating optimal auto-pack schedule...'}</p>
            </div>
          ) : hasCalculated && proposals.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <Calendar className="w-7 h-7 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                {language === 'zh-CN' ? '今日暂无需要自动排入的空闲任务或时间段' : 'No tasks to pack into free gaps'}
              </p>
              <p>
                {language === 'zh-CN'
                  ? '您的今日日程可能已排满，或者当前筛选条件下所有任务均已安排。'
                  : 'Your day might be fully packed or all tasks are already scheduled.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-1">
                <span>
                  {language === 'zh-CN'
                    ? `已智能生成 ${proposals.length} 个任务排期方案 (共 ${totalPackedMinutes} 分钟):`
                    : `Generated ${proposals.length} auto-pack proposals (${totalPackedMinutes} mins):`}
                </span>
                {unassignedCount > 0 && (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400">
                    {language === 'zh-CN' ? `${unassignedCount} 个任务因时间不足未排入` : `${unassignedCount} tasks couldn't fit`}
                  </span>
                )}
              </div>

              {proposals.map((item, idx) => {
                const startTimeStr = new Date(item.startAt).toTimeString().slice(0, 5);
                const endTimeStr = new Date(item.endAt).toTimeString().slice(0, 5);

                return (
                  <div
                    key={`${item.taskId}-${idx}`}
                    className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-5 h-5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <span className="font-medium text-slate-800 dark:text-slate-200 block truncate">
                          {item.taskTitle}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                          <Badge size="sm" variant={item.priority === 'urgent' ? 'urgent' : item.priority === 'high' ? 'high' : 'secondary'}>
                            {item.priority}
                          </Badge>
                          <span>•</span>
                          <span>{item.estimateMinutes}m</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg shrink-0">
                      <Clock className="w-3 h-3" />
                      <span>{startTimeStr} - {endTimeStr}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-5 pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] sm:pb-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between shrink-0">
          <Button variant="ghost" size="sm" onClick={onClose} className="cursor-pointer">
            {language === 'zh-CN' ? '取消' : 'Cancel'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            disabled={loading || proposals.length === 0}
            onClick={handleApply}
            className="gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{language === 'zh-CN' ? `确认并应用排期 (${proposals.length})` : `Apply Schedule (${proposals.length})`}</span>
          </Button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
