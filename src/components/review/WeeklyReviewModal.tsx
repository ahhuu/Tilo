import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/storage/db';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { timeService } from '@/core/time/timeService';
import { useI18n } from '@/core/i18n';
import {
  getOrCreateReviewDraft,
  completeReview,
  generateWeeklyStory,
  handleSomedayAction,
  setNextWeekFocusGoals,
  skipReview,
} from '@/services/reviewCommands';
import {
  CalendarRange,
  X,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Target,
  Clock,
  Archive,
  CalendarPlus,
  Bookmark,
  Activity,
  SkipForward,
  MessageSquareQuote,
} from 'lucide-react';
import type { Session, Goal, Project, InboxItem } from '@/core/types/domain';
import type { ReviewReflectionTemplatePayload } from '@/services/templateCommands';
import { confirmDialog } from '@/services/dialogService';

interface WeeklyReviewModalProps {
  sessions: Session[];
  goals: Goal[];
  projects: Project[];
  inboxItems: InboxItem[];
  onCompleted: () => void;
  onClose: () => void;
}

export const WeeklyReviewModal: React.FC<WeeklyReviewModalProps> = ({
  sessions,
  goals,
  projects,
  inboxItems,
  onCompleted,
  onClose,
}) => {
  const { language } = useI18n();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const weekKey = timeService.getWeekKey();

  const reflectionTemplates = useLiveQuery(
    () => db.templates.filter((t) => t.kind === 'reviewReflection').toArray(),
    []
  ) || [];

  const weeklyTemplates = reflectionTemplates.filter(
    (t) => (t.payloadJson as ReviewReflectionTemplatePayload)?.type === 'weekly'
  );

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [promptAnswers, setPromptAnswers] = useState<Record<string, string>>({});

  const activeWeeklyTemplate =
    weeklyTemplates.find((t) => t.id === selectedTemplateId) || weeklyTemplates[0];

  const activeWeeklyQuestions =
    (activeWeeklyTemplate?.payloadJson as ReviewReflectionTemplatePayload)?.promptQuestions || [];

  const [storyText, setStoryText] = useState('');
  const [weeklyReflection, setWeeklyReflection] = useState('');
  const [selectedFocusGoalIds, setSelectedFocusGoalIds] = useState<string[]>(() =>
    goals.filter((g) => g.isWeeklyFocus).map((g) => g.id)
  );
  const [selectedWeeklyMetrics, setSelectedWeeklyMetrics] = useState<string[]>([
    'deepWorkHours',
    'focusSessionsCount',
    'tasksCompleted',
  ]);
  const [targetDeepWorkHours, setTargetDeepWorkHours] = useState('15');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [somedayDecisions, setSomedayDecisions] = useState<Record<string, 'keep' | 'thisWeek' | 'archive'>>({});

  // Generate initial story on mount
  useEffect(() => {
    generateWeeklyStory(weekKey).then((s) => {
      setStoryText(s);
    });
  }, [weekKey]);

  // Statistics for this week
  const weekSessions = sessions.filter(
    (s) => !s.deletedAt && s.kind === 'active' && timeService.getWeekKey(s.startedAt) === weekKey
  );
  const totalActiveSeconds = weekSessions.reduce((acc, s) => acc + s.activeDurationSeconds, 0);

  const somedayInbox = inboxItems.filter((i) => !i.deletedAt && i.state === 'someday');

  const handleSomedayButtonClick = async (itemId: string, action: 'keep' | 'thisWeek' | 'archive') => {
    setSomedayDecisions((prev) => ({ ...prev, [itemId]: action }));
    await handleSomedayAction(itemId, action);
  };

  const handleToggleFocusGoal = (goalId: string) => {
    setSelectedFocusGoalIds((prev) =>
      prev.includes(goalId) ? prev.filter((id) => id !== goalId) : [...prev, goalId]
    );
  };

  const handleToggleWeeklyMetric = (metricId: string) => {
    setSelectedWeeklyMetrics((prev) =>
      prev.includes(metricId) ? prev.filter((id) => id !== metricId) : [...prev, metricId]
    );
  };

  const handleSkipReview = async () => {
    const confirmed = await confirmDialog({
      title: language === 'zh-CN' ? '跳过本周复盘' : 'Skip weekly review',
      message: language === 'zh-CN'
        ? '数据分析仍将保留，但不会生成本周反思快照。'
        : 'Analytics will remain intact, but no reflection snapshot will be saved.',
      destructive: true,
      confirmLabel: language === 'zh-CN' ? '跳过' : 'Skip',
    });
    if (!confirmed) return;

    const now = Date.now();
    await skipReview({
      type: 'weekly',
      periodKey: weekKey,
      periodStart: now - 7 * 86400000,
      periodEnd: now,
    });
    onClose();
  };

  const handleFinishWeeklyReview = async () => {
    setIsSubmitting(true);
    try {
      // 1. Carry over next week's focus goals
      await setNextWeekFocusGoals(selectedFocusGoalIds);

      // 2. Complete review revision snapshot
      const now = Date.now();
      const draft = await getOrCreateReviewDraft({
        type: 'weekly',
        periodKey: weekKey,
        periodStart: now - 7 * 86400000,
        periodEnd: now,
      });

      await completeReview({
        reviewId: draft.id,
        snapshotJson: {
          weekKey,
          totalActiveSeconds,
          sessionsCount: weekSessions.length,
          activeGoalsCount: goals.filter((g) => g.status === 'active').length,
          activeProjectsCount: projects.filter((p) => p.status === 'active').length,
          selectedFocusGoalIds,
          selectedWeeklyMetrics,
          targetDeepWorkHours,
        },
        reflectionJson: {
          weeklyReflection,
          somedayDecisions,
          promptAnswers,
          templateId: activeWeeklyTemplate?.id,
          templateName: activeWeeklyTemplate?.name,
        },
        storyText: storyText.trim(),
      });

      onCompleted();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      ariaLabel={language === 'zh-CN' ? '每周复盘' : 'Weekly Review'}
      maxWidthClass="sm:max-w-xl"
      scrollable={false}
      bodyClassName="p-0"
      header={
        <div className="w-full -mx-5 -mb-3 px-5 pb-3 border-b border-slate-100 dark:border-slate-800 sm:-mx-5 sm:-mb-3 sm:px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {language === 'zh-CN' ? '每周复盘' : 'Weekly Review'} — {weekKey}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {language === 'zh-CN' ? `步骤 ${step} / 6` : `Step ${step} of 6`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleSkipReview}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                title={language === 'zh-CN' ? '跳过本周复盘' : 'Skip Weekly Review'}
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>{language === 'zh-CN' ? '跳过复盘' : 'Skip'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label={language === 'zh-CN' ? '关闭' : 'Close'}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      }
    >

        <div className="p-6 space-y-5 overflow-y-auto overscroll-contain max-h-[78vh] pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] sm:pb-6">
        {/* Step 1: Outcomes & Metrics */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                {language === 'zh-CN' ? '第 1 步: 检视成果与关键指标' : 'Step 1: Review Outcomes & Metrics'}
              </h4>
              <p className="text-xs text-slate-400">
                {language === 'zh-CN' ? '回顾本周累计专注时长与完成的工作流。' : "Acknowledge this week's dedicated focus time and completed tasks."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                  {language === 'zh-CN' ? '本周累计专注' : 'Total Active Focus'}
                </span>
                <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
                  {timeService.formatDuration(totalActiveSeconds)}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                  {language === 'zh-CN' ? '专注会话次数' : 'Focus Sessions'}
                </span>
                <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
                  {weekSessions.length}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="primary" onClick={() => setStep(2)} className="cursor-pointer">
                <span>{language === 'zh-CN' ? '下一步: 收集箱与待办池' : 'Next: Inbox & Someday'}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Inbox & Someday Triage (with Someday Resurfacing) */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                {language === 'zh-CN' ? '第 2 步: 清理收集箱与 Someday 待办池' : 'Step 2: Inbox & Someday Triage'}
              </h4>
              <p className="text-xs text-slate-400">
                {language === 'zh-CN'
                  ? '重新审视暂缓待办项，决定继续保留、移至本周排期或直接归档。'
                  : 'Resurface stale Someday items and decide to Keep, Schedule, or Archive.'}
              </p>
            </div>

            {/* Someday Resurfacing Item Cards */}
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {somedayInbox.length === 0 ? (
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400">
                  {language === 'zh-CN' ? '暂无 Someday 待办项需重新审视。' : 'No Someday items need review.'}
                </div>
              ) : (
                somedayInbox.slice(0, 3).map((item) => {
                  const decision = somedayDecisions[item.id];
                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/80 space-y-2 text-xs"
                    >
                      <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {item.rawText}
                      </p>
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => handleSomedayButtonClick(item.id, 'keep')}
                          className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                            decision === 'keep'
                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300'
                              : 'text-slate-500 hover:text-slate-900 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <Bookmark className="w-3 h-3 inline mr-1" />
                          {language === 'zh-CN' ? '保留在 Someday' : 'Keep'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSomedayButtonClick(item.id, 'thisWeek')}
                          className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                            decision === 'thisWeek'
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 border-indigo-200 dark:border-indigo-900/60'
                          }`}
                        >
                          <CalendarPlus className="w-3 h-3 inline mr-1" />
                          {language === 'zh-CN' ? '移至本周执行' : 'This Week'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSomedayButtonClick(item.id, 'archive')}
                          className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                            decision === 'archive'
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'text-slate-400 hover:text-rose-600 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <Archive className="w-3 h-3 inline mr-1" />
                          {language === 'zh-CN' ? '归档' : 'Archive'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-between pt-2">
              <Button size="sm" variant="ghost" onClick={() => setStep(1)} className="cursor-pointer">
                {language === 'zh-CN' ? '返回上一步' : 'Back'}
              </Button>
              <Button size="sm" variant="primary" onClick={() => setStep(3)} className="cursor-pointer">
                <span>{language === 'zh-CN' ? '下一步: 目标与项目' : 'Next: Goals & Projects'}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Goals & Projects */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                {language === 'zh-CN' ? '第 3 步: 目标与项目进展' : 'Step 3: Goals & Projects Review'}
              </h4>
              <p className="text-xs text-slate-400">
                {language === 'zh-CN' ? '检查进行中目标与各项目里程碑的推进情况。' : 'Check active goals and project milestones progression.'}
              </p>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {goals
                .filter((g) => g.status === 'active')
                .map((g) => (
                  <div
                    key={g.id}
                    className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Target className="w-3.5 h-3.5" style={{ color: g.color }} />
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {g.title}
                      </span>
                    </div>
                    <Badge variant={g.isWeeklyFocus ? 'indigo' : 'secondary'} size="sm">
                      {g.isWeeklyFocus
                        ? (language === 'zh-CN' ? '本周聚焦' : 'Weekly Focus')
                        : (language === 'zh-CN' ? '进行中' : 'Active')}
                    </Badge>
                  </div>
                ))}
            </div>

            <div className="flex justify-between pt-2">
              <Button size="sm" variant="ghost" onClick={() => setStep(2)} className="cursor-pointer">
                {language === 'zh-CN' ? '返回上一步' : 'Back'}
              </Button>
              <Button size="sm" variant="primary" onClick={() => setStep(4)} className="cursor-pointer">
                <span>{language === 'zh-CN' ? '下一步: 下周规划' : 'Next: Plan Next Week'}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Plan Next Week (Goal Focus Carry-over & Weekly Metrics) */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                {language === 'zh-CN' ? '第 4 步: 规划下周重心与关键指标' : 'Step 4: Plan Next Week & Metrics'}
              </h4>
              <p className="text-xs text-slate-400">
                {language === 'zh-CN'
                  ? '设定下周的核心聚焦战略目标 (Goal Focus) 及本周度指标。'
                  : 'Select weekly focus goals and choose target metrics for next week.'}
              </p>
            </div>

            {/* Carry-over Weekly Focus Goals Selector */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {language === 'zh-CN' ? '选择下周战略聚焦目标 (最多3个)' : 'Next Week Focus Goals (Max 3)'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {goals
                  .filter((g) => g.status === 'active')
                  .map((g) => {
                    const isSelected = selectedFocusGoalIds.includes(g.id);
                    return (
                      <div
                        key={g.id}
                        onClick={() => handleToggleFocusGoal(g.id)}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-100 font-semibold'
                            : 'bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                          <span className="truncate">{g.title}</span>
                        </div>
                        <CheckCircle2
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Weekly Target Metrics */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {language === 'zh-CN' ? '选定下周关键度量指标' : 'Weekly Target Metrics'}
              </span>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleWeeklyMetric('deepWorkHours')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      selectedWeeklyMetrics.includes('deepWorkHours')
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 font-semibold'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{language === 'zh-CN' ? '深度专注工时' : 'Deep Work Hours'}</span>
                  </button>
                  {selectedWeeklyMetrics.includes('deepWorkHours') && (
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <input
                        type="number"
                        value={targetDeepWorkHours}
                        onChange={(e) => setTargetDeepWorkHours(e.target.value)}
                        className="w-12 h-7 px-1.5 text-center text-xs bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-slate-100"
                      />
                      <span>h</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleWeeklyMetric('focusSessionsCount')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    selectedWeeklyMetrics.includes('focusSessionsCount')
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 font-semibold'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>{language === 'zh-CN' ? '专注会话频次' : 'Focus Sessions'} (&ge;12)</span>
                </button>
              </div>
            </div>

            {/* Reflection Questions from Template */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {/* Prominent Template Switcher Banner */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center gap-2 min-w-0">
                  <MessageSquareQuote className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                      {language === 'zh-CN' ? '周复盘反思模板 (设置中可自定义增删)' : 'Weekly Reflection Template (Customizable in Settings)'}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {activeWeeklyTemplate?.name || (language === 'zh-CN' ? '标准周复盘模板' : 'Standard Weekly Review')}
                    </span>
                  </div>
                </div>

                {weeklyTemplates.length > 1 && (
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <span className="text-[11px] text-slate-400">{language === 'zh-CN' ? '切换:' : 'Switch:'}</span>
                    <select
                      value={activeWeeklyTemplate?.id || ''}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="px-2 py-1 text-xs font-semibold bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 rounded-lg border border-slate-200 dark:border-slate-600 focus:outline-none cursor-pointer"
                    >
                      {weeklyTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {activeWeeklyQuestions.length > 0 ? (
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                  {activeWeeklyQuestions.map((q, idx) => (
                    <div key={idx} className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span>{q}</span>
                      </label>
                      <textarea
                        rows={2}
                        placeholder={language === 'zh-CN' ? '记录您的反思与复盘...' : 'Record your thoughts...'}
                        value={promptAnswers[q] || ''}
                        onChange={(e) =>
                          setPromptAnswers({ ...promptAnswers, [q]: e.target.value })
                        }
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden resize-none"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  <textarea
                    rows={3}
                    placeholder={language === 'zh-CN' ? '下周计划交付的最重要的 3 个里程碑是什么？' : 'What are the top 3 milestones to ship next week?'}
                    value={weeklyReflection}
                    onChange={(e) => setWeeklyReflection(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden resize-none"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-between pt-2">
              <Button size="sm" variant="ghost" onClick={() => setStep(3)} className="cursor-pointer">
                {language === 'zh-CN' ? '返回上一步' : 'Back'}
              </Button>
              <Button size="sm" variant="primary" onClick={() => setStep(5)} className="cursor-pointer">
                <span>{language === 'zh-CN' ? '下一步: 每周执行故事' : 'Next: Weekly Story'}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Rule-based Weekly Story */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                {language === 'zh-CN' ? '第 5 步: 规则驱动的每周故事' : 'Step 5: Rule-based Weekly Story'}
              </h4>
              <p className="text-xs text-slate-400">
                {language === 'zh-CN' ? '基于客观事实生成的叙事摘要，可在保存前随时编辑完善。' : 'Generated factual narrative summary. Feel free to edit before saving.'}
              </p>
            </div>

            <div className="space-y-1">
              <textarea
                rows={4}
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs font-mono text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden resize-none"
              />
            </div>

            <div className="flex justify-between pt-2">
              <Button size="sm" variant="ghost" onClick={() => setStep(4)} className="cursor-pointer">
                {language === 'zh-CN' ? '返回上一步' : 'Back'}
              </Button>
              <Button size="sm" variant="primary" onClick={() => setStep(6)} className="cursor-pointer">
                <span>{language === 'zh-CN' ? '下一步: 封存审计快照' : 'Next: Finalize Snapshot'}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 6: Complete & Snapshot */}
        {step === 6 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                {language === 'zh-CN' ? '第 6 步: 完成并封存不可变快照' : 'Step 6: Complete & Save Snapshot'}
              </h4>
              <p className="text-xs text-slate-400">
                {language === 'zh-CN' ? '将在本地 Dexie 数据库中创建不可变审计版本。' : 'An immutable historical snapshot revision will be created in your local database.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>{language === 'zh-CN' ? `准备封存 ${weekKey} 周度复盘` : `Ready to seal Week ${weekKey}`}</span>
              </div>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                {language === 'zh-CN'
                  ? '此历史快照将被永久固化，未来任何任务变更均不会对其产生篡改影响。'
                  : 'This revision will be permanently saved and will not be altered by future task changes.'}
              </p>
            </div>

            <div className="flex justify-between pt-2">
              <Button size="sm" variant="ghost" onClick={() => setStep(5)} className="cursor-pointer">
                {language === 'zh-CN' ? '返回上一步' : 'Back'}
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleFinishWeeklyReview}
                disabled={isSubmitting}
                className="gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{language === 'zh-CN' ? '封存并保存审计版本' : 'Save Review Revision'}</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
