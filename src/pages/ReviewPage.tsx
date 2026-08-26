import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/storage/db';
import { timeService } from '@/core/time/timeService';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { DailyCloseModal } from '@/components/review/DailyCloseModal';
import { WeeklyReviewModal } from '@/components/review/WeeklyReviewModal';
import { RevisionHistoryModal } from '@/components/review/RevisionHistoryModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import {
  Compass,
  CheckCircle,
  CalendarRange,
  History,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import type { ReviewRevision, Review } from '@/core/types/domain';
import type { ReviewReflectionTemplatePayload } from '@/services/templateCommands';

export const ReviewPage: React.FC = () => {
  const { t, language } = useI18n();
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  const [inspectingRevision, setInspectingRevision] = useState<{
    revision: ReviewRevision;
    review?: Review;
  } | null>(null);

  const { addToast } = useUIStore();

  const todayStr = timeService.getLogicalDate();
  const weekKey = timeService.getWeekKey();

  // Live queries
  const allReviews = useLiveQuery(() => db.reviews.toArray(), []) || [];
  const allRevisions = useLiveQuery(
    () => db.reviewRevisions.orderBy('createdAt').reverse().toArray(),
    []
  ) || [];
  const tasks = useLiveQuery(() => db.tasks.toArray(), []) || [];
  const sessions = useLiveQuery(() => db.sessions.toArray(), []) || [];
  const goals = useLiveQuery(() => db.goals.toArray(), []) || [];
  const projects = useLiveQuery(() => db.projects.toArray(), []) || [];
  const inboxItems = useLiveQuery(() => db.inboxItems.toArray(), []) || [];

  const reviewMap = new Map(allReviews.map((r) => [r.id, r]));

  // Today Daily Close status
  const dailyReview = allReviews.find((r) => r.type === 'daily' && r.periodKey === todayStr);
  const isDailyCompleted = dailyReview?.status === 'completed';

  // Weekly Review status
  const weeklyReview = allReviews.find((r) => r.type === 'weekly' && r.periodKey === weekKey);
  const isWeeklyCompleted = weeklyReview?.status === 'completed';

  // Active templates info
  const templates = useLiveQuery(() => db.templates.toArray(), []) || [];
  const dailyTemplates = templates.filter(
    (t) => t.kind === 'reviewReflection' && (t.payloadJson as ReviewReflectionTemplatePayload)?.type === 'daily'
  );
  const weeklyTemplates = templates.filter(
    (t) => t.kind === 'reviewReflection' && (t.payloadJson as ReviewReflectionTemplatePayload)?.type === 'weekly'
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center">
          <Compass className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t('review.title')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'zh-CN'
              ? '反思执行节奏，清理结转未竟待办，并封存不可变复盘历史快照。'
              : 'Reflect on execution, resolve leftover commitments, and seal immutable snapshots.'}
          </p>
        </div>
      </div>

      {/* Review Actions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Daily Close Card */}
        <Card className="p-5 space-y-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t('review.dailyClose')}
              </h3>
            </div>
            <Badge variant={isDailyCompleted ? 'low' : 'indigo'} size="sm">
              {isDailyCompleted ? (language === 'zh-CN' ? '已完成' : 'Completed') : (language === 'zh-CN' ? '待复盘' : 'Ready')}
            </Badge>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {language === 'zh-CN'
              ? `处理今日剩余待办、记录今日成果与阻碍，并完成 ${timeService.formatDateHeader(todayStr)} 的日终结案。`
              : `Resolve today's remaining tasks, note wins and friction points, and close out ${timeService.formatDateHeader(todayStr)}.`}
          </p>

          <div className="text-[11px] text-slate-400 dark:text-slate-500 bg-slate-50/60 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span>{language === 'zh-CN' ? '引导提问模板:' : 'Guided Prompts Template:'}</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
              {dailyTemplates[0]?.name || (language === 'zh-CN' ? '默认日终反思模板' : 'Default Daily Close')}
            </span>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 font-mono">
              {isDailyCompleted ? (language === 'zh-CN' ? `已封存版本 Rev #${dailyReview.currentRevision}` : `Sealed Rev #${dailyReview.currentRevision}`) : (language === 'zh-CN' ? '今日尚未结案' : 'Not closed yet')}
            </span>
            <Button
              size="sm"
              variant={isDailyCompleted ? 'outline' : 'primary'}
              onClick={() => setShowDailyModal(true)}
              className="h-7 text-xs gap-1"
            >
              <span>{isDailyCompleted ? t('review.reopenDailyClose') : t('review.startDailyClose')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>

        {/* Weekly Review Card */}
        <Card className="p-5 space-y-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarRange className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t('review.weeklyReview')}
              </h3>
            </div>
            <Badge
              variant={
                isWeeklyCompleted ? 'low' : weeklyReview?.status === 'skipped' ? 'outline' : 'indigo'
              }
              size="sm"
            >
              {isWeeklyCompleted
                ? (language === 'zh-CN' ? '已完成' : 'Completed')
                : weeklyReview?.status === 'skipped'
                ? (language === 'zh-CN' ? '已跳过' : 'Skipped')
                : (language === 'zh-CN' ? '待复盘' : 'Ready')}
            </Badge>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {language === 'zh-CN'
              ? `对第 ${weekKey} 周进行 6 步深度反思：整理收集箱与 Someday、推进战略目标、生成专属每周故事。`
              : `A 6-step reflection on week ${weekKey}: triage inbox & someday, progress strategic goals, and generate your weekly story.`}
          </p>

          <div className="text-[11px] text-slate-400 dark:text-slate-500 bg-slate-50/60 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span>{language === 'zh-CN' ? '引导提问模板:' : 'Guided Prompts Template:'}</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
              {weeklyTemplates[0]?.name || (language === 'zh-CN' ? '默认每周复盘模板' : 'Default Weekly Review')}
            </span>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 font-mono">
              {isWeeklyCompleted
                ? (language === 'zh-CN' ? `已封存版本 Rev #${weeklyReview.currentRevision}` : `Sealed Rev #${weeklyReview.currentRevision}`)
                : weeklyReview?.status === 'skipped'
                ? (language === 'zh-CN' ? '本周复盘已跳过' : 'Review was skipped')
                : (language === 'zh-CN' ? '本周尚未复盘' : 'Pending review')}
            </span>
            <Button
              size="sm"
              variant={isWeeklyCompleted ? 'outline' : 'primary'}
              onClick={() => setShowWeeklyModal(true)}
              className="h-7 text-xs gap-1 cursor-pointer"
            >
              <span>
                {isWeeklyCompleted
                  ? t('review.reopenWeeklyReview')
                  : weeklyReview?.status === 'skipped'
                  ? (language === 'zh-CN' ? '重新开始复盘' : 'Start Review')
                  : t('review.startWeeklyReview')}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Immutable Revision History */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {t('review.history')}
          </h3>
        </div>

        {allRevisions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
            <p className="font-medium text-slate-600 dark:text-slate-300">
              {language === 'zh-CN' ? '暂无封存历史版本' : 'No review revisions sealed yet'}
            </p>
            <p>
              {language === 'zh-CN' ? '完成每日或每周复盘后，系统将自动生成不可篡改的审计快照。' : 'Complete a Daily Close or Weekly Review to create immutable JSON snapshots.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {allRevisions.map((rev) => {
              const review = reviewMap.get(rev.reviewId);
              const isDaily = review?.type === 'daily';

              return (
                <div
                  key={rev.id}
                  onClick={() => setInspectingRevision({ revision: rev, review })}
                  className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isDaily
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                          : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                      }`}
                    >
                      {isDaily ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <CalendarRange className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {isDaily ? (language === 'zh-CN' ? '每日复盘' : 'Daily Close') : (language === 'zh-CN' ? '每周复盘' : 'Weekly Review')}: {review?.periodKey}
                        </span>
                        <Badge variant="outline" size="sm">
                          Rev #{rev.revision}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {language === 'zh-CN' ? '封存于' : 'Sealed'}{' '}
                        {new Date(rev.createdAt).toLocaleDateString(language === 'zh-CN' ? 'zh-CN' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                      <span>{language === 'zh-CN' ? '查看快照' : 'View snapshot'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Daily Close Modal */}
      {showDailyModal && (
        <DailyCloseModal
          tasks={tasks}
          sessions={sessions}
          onCompleted={() => {
            setShowDailyModal(false);
            addToast({
              message: language === 'zh-CN' ? '今日复盘已完成并封存快照！' : 'Daily Close completed and sealed!',
              type: 'success',
            });
          }}
          onClose={() => setShowDailyModal(false)}
        />
      )}

      {/* Weekly Review Modal */}
      {showWeeklyModal && (
        <WeeklyReviewModal
          sessions={sessions}
          goals={goals}
          projects={projects}
          inboxItems={inboxItems}
          onCompleted={() => {
            setShowWeeklyModal(false);
            addToast({
              message: language === 'zh-CN' ? '本周复盘已完成并封存快照！' : 'Weekly Review completed and sealed!',
              type: 'success',
            });
          }}
          onClose={() => setShowWeeklyModal(false)}
        />
      )}

      {/* Revision History Inspector Modal */}
      {inspectingRevision && (
        <RevisionHistoryModal
          revision={inspectingRevision.revision}
          review={inspectingRevision.review}
          onClose={() => setInspectingRevision(null)}
        />
      )}
    </div>
  );
};
