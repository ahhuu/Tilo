import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/storage/db';
import { Button } from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { timeService } from '@/core/time/timeService';
import { useI18n } from '@/core/i18n';
import {
  getOrCreateReviewDraft,
  completeReview,
  resolveLeftoverTasks,
  type LeftoverTaskResolution,
} from '@/services/reviewCommands';
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  MessageSquareQuote,
} from 'lucide-react';
import type { Task, Session } from '@/core/types/domain';
import type { ReviewReflectionTemplatePayload } from '@/services/templateCommands';

interface DailyCloseModalProps {
  tasks: Task[];
  sessions: Session[];
  onCompleted: () => void;
  onClose: () => void;
}

export const DailyCloseModal: React.FC<DailyCloseModalProps> = ({
  tasks,
  sessions,
  onCompleted,
  onClose,
}) => {
  const { language } = useI18n();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const todayStr = timeService.getLogicalDate();

  const reflectionTemplates = useLiveQuery(
    () => db.templates.filter((t) => t.kind === 'reviewReflection').toArray(),
    []
  ) || [];

  const dailyTemplates = reflectionTemplates.filter(
    (t) => (t.payloadJson as ReviewReflectionTemplatePayload)?.type === 'daily'
  );

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  const activeTemplate =
    dailyTemplates.find((t) => t.id === selectedTemplateId) || dailyTemplates[0];

  const activeQuestions =
    (activeTemplate?.payloadJson as ReviewReflectionTemplatePayload)?.promptQuestions || [];

  // Leftover tasks = scheduled for today but not done
  const todayTasks = tasks.filter((t) => !t.deletedAt && t.scheduledDate === todayStr);
  const leftoverTasks = todayTasks.filter((t) => t.statusId !== 'ws-task-done');
  const completedTodayTasks = todayTasks.filter((t) => t.statusId === 'ws-task-done');

  const [resolutions, setResolutions] = useState<Map<string, LeftoverTaskResolution>>(() => {
    const map = new Map<string, LeftoverTaskResolution>();
    leftoverTasks.forEach((t) => {
      map.set(t.id, { taskId: t.id, action: 'tomorrow' });
    });
    return map;
  });

  // Prompt answers
  const [promptAnswers, setPromptAnswers] = useState<Record<string, string>>({});

  // Reflection notes fallback
  const [winsText, setWinsText] = useState('');
  const [frictionText, setFrictionText] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayStart = timeService.getStartOfLogicalDay(todayStr);
  const todaySessions = sessions.filter(
    (s) => !s.deletedAt && s.kind === 'active' && s.startedAt >= todayStart
  );
  const totalActiveSeconds = todaySessions.reduce((sum, s) => sum + s.activeDurationSeconds, 0);

  const handleResolutionChange = (taskId: string, action: LeftoverTaskResolution['action']) => {
    const next = new Map(resolutions);
    next.set(taskId, { taskId, action });
    setResolutions(next);
  };

  const handleFinishDailyClose = async () => {
    setIsSubmitting(true);
    try {
      // 1. Resolve leftover tasks
      await resolveLeftoverTasks(Array.from(resolutions.values()));

      // 2. Create/get review draft
      const draft = await getOrCreateReviewDraft({
        type: 'daily',
        periodKey: todayStr,
        periodStart: todayStart,
        periodEnd: todayStart + 86400000,
      });

      // 3. Complete review snapshot
      await completeReview({
        reviewId: draft.id,
        snapshotJson: {
          logicalDate: todayStr,
          totalActiveSeconds,
          completedTasksCount: completedTodayTasks.length,
          totalTasksCount: todayTasks.length,
          sessionsCount: todaySessions.length,
        },
        reflectionJson: {
          wins: winsText,
          friction: frictionText,
          notes: generalNotes,
          promptAnswers,
          templateId: activeTemplate?.id,
          templateName: activeTemplate?.name,
        },
        storyText: language === 'zh-CN'
          ? `完成了 ${todayStr} 日终复盘。今日共专注 ${timeService.formatDuration(totalActiveSeconds)}，进行了 ${todaySessions.length} 次专注会话。`
          : `Completed Daily Close for ${todayStr}. Logged ${timeService.formatDuration(
              totalActiveSeconds
            )} of focus across ${todaySessions.length} sessions.`,
      });

      onCompleted();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      ariaLabel={language === 'zh-CN' ? '每日收尾与结案' : 'Daily Close & Reflection'}
      maxWidthClass="sm:max-w-lg"
      bodyClassName="flex-1 overflow-y-auto overscroll-contain px-6 pb-6"
      title={
        <span className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          {language === 'zh-CN' ? '每日收尾与结案' : 'Daily Close & Reflection'}
        </span>
      }
      description={
        (language === 'zh-CN' ? `步骤 ${step} / 3` : `Step ${step} of 3`) + ' — ' + todayStr
      }
    >
      <div className="space-y-5">
        {/* Step 1: Resolve Leftovers */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                {language === 'zh-CN' ? '第 1 步: 今日未完成任务清理' : 'Step 1: Resolve Leftover Tasks'}
              </h4>
              <p className="text-xs text-slate-400">
                {language === 'zh-CN'
                  ? '妥善处置今天未完成的任务，保持工作台整洁，无心理负担。'
                  : 'Decide what to do with remaining tasks so tomorrow starts fresh.'}
              </p>
            </div>

            {leftoverTasks.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {language === 'zh-CN' ? '太棒了！今日所有已排期任务全部达成！' : 'All scheduled tasks completed for today!'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {leftoverTasks.map((task) => {
                  const res = resolutions.get(task.id);
                  return (
                    <div
                      key={task.id}
                      className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-2"
                    >
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                        {task.title}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs">
                        <select
                          value={res?.action || 'tomorrow'}
                          onChange={(e) =>
                            handleResolutionChange(
                              task.id,
                              e.target.value as LeftoverTaskResolution['action']
                            )
                          }
                          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="tomorrow">
                            {language === 'zh-CN' ? '推迟到明天 (Tomorrow)' : 'Roll to Tomorrow'}
                          </option>
                          <option value="someday">
                            {language === 'zh-CN' ? '移入 Someday 待办池' : 'Move to Someday'}
                          </option>
                          <option value="done">
                            {language === 'zh-CN' ? '标记为完成' : 'Mark Done'}
                          </option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="primary" onClick={() => setStep(2)} className="cursor-pointer">
                <span>{language === 'zh-CN' ? '下一步: 今日反思' : 'Next: Reflect'}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Reflection (Dynamic from Templates) */}
        {step === 2 && (
          <div className="space-y-3.5">
            {/* Prominent Template Switcher Banner */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquareQuote className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                    {language === 'zh-CN' ? '反思提问模板 (设置中可自定义增删)' : 'Reflection Template (Customizable in Settings)'}
                  </span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {activeTemplate?.name || (language === 'zh-CN' ? '标准日终复盘模板' : 'Standard Daily Close')}
                  </span>
                </div>
              </div>

              {dailyTemplates.length > 1 && (
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <span className="text-[11px] text-slate-400">{language === 'zh-CN' ? '切换:' : 'Switch:'}</span>
                  <select
                    value={activeTemplate?.id || ''}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="px-2 py-1 text-xs font-semibold bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 rounded-lg border border-slate-200 dark:border-slate-600 focus:outline-none cursor-pointer"
                  >
                    {dailyTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {activeQuestions.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                {activeQuestions.map((q, idx) => (
                  <div key={idx} className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span>{q}</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder={language === 'zh-CN' ? '输入您的思考...' : 'Enter your thoughts...'}
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
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {language === 'zh-CN' ? '今日收获与成果 (Wins)' : 'What went well today? (Wins)'}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={language === 'zh-CN' ? '例如: 高效完成了核心模块研发，无外界打扰' : 'e.g. Shipped the core analytics engine without interruptions'}
                    value={winsText}
                    onChange={(e) => setWinsText(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {language === 'zh-CN' ? '遇到的阻碍或注意力分散点' : 'What caused friction?'}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={language === 'zh-CN' ? '例如: 多任务频繁上下文切换' : 'e.g. Context switching between meetings'}
                    value={frictionText}
                    onChange={(e) => setFrictionText(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden resize-none"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {language === 'zh-CN' ? '其他观察与备注' : 'General Notes'}{' '}
                <span className="text-slate-400 font-normal">
                  {language === 'zh-CN' ? '(可选)' : '(Optional)'}
                </span>
              </label>
              <textarea
                rows={2}
                placeholder={language === 'zh-CN' ? '其他想随手记录的想法...' : 'Any other observations...'}
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden resize-none"
              />
            </div>

            <div className="flex justify-between pt-2">
              <Button size="sm" variant="ghost" onClick={() => setStep(1)} className="cursor-pointer">
                {language === 'zh-CN' ? '返回上一步' : 'Back'}
              </Button>
              <Button size="sm" variant="primary" onClick={() => setStep(3)} className="cursor-pointer">
                <span>{language === 'zh-CN' ? '下一步: 汇总与结案' : 'Next: Summary & Close'}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Summary & Close Day */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                {language === 'zh-CN' ? '今日汇总与封存' : 'Summary & Close Day'}
              </h4>
              <p className="text-xs text-slate-400">
                {language === 'zh-CN' ? '在生成不可变审计快照前确认今日统计数据。' : 'Review your daily stats before finalizing the immutable snapshot.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                  {language === 'zh-CN' ? '活跃专注时长' : 'Active Focus'}
                </span>
                <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                  {timeService.formatDuration(totalActiveSeconds)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                  {language === 'zh-CN' ? '完成任务数' : 'Tasks Completed'}
                </span>
                <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                  {completedTodayTasks.length}/{todayTasks.length}
                </span>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button size="sm" variant="ghost" onClick={() => setStep(2)} className="cursor-pointer">
                {language === 'zh-CN' ? '返回上一步' : 'Back'}
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleFinishDailyClose}
                disabled={isSubmitting}
                className="gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{language === 'zh-CN' ? '完成复盘并结案今日' : 'Finalize & Close Day'}</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
