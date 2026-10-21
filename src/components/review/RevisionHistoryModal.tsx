import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useI18n } from '@/core/i18n';
import Modal from '@/components/ui/Modal';
import { timeService } from '@/core/time/timeService';
import {
  History,
  X,
  Sparkles,
  Clock,
  CheckCircle2,
  ListChecks,
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  Check,
  Target,
  FolderKanban,
  HelpCircle,
  AlertTriangle,
  Lightbulb,
  FileText,
} from 'lucide-react';
import type { ReviewRevision, Review } from '@/core/types/domain';

interface RevisionHistoryModalProps {
  revision: ReviewRevision;
  review?: Review;
  onClose: () => void;
}

interface SnapshotData {
  logicalDate?: string;
  weekKey?: string;
  totalActiveSeconds?: number;
  completedTasksCount?: number;
  totalTasksCount?: number;
  sessionsCount?: number;
  activeGoalsCount?: number;
  activeProjectsCount?: number;
  selectedFocusGoalIds?: string[];
  selectedMetrics?: string[];
  [key: string]: unknown;
}

interface ReflectionData {
  wins?: string;
  friction?: string;
  notes?: string;
  answers?: Record<string, string>;
  promptAnswers?: Record<string, string>;
  templateName?: string;
  templateId?: string;
  selectedMetrics?: string[];
  [key: string]: unknown;
}

export const RevisionHistoryModal: React.FC<RevisionHistoryModalProps> = ({
  revision,
  review,
  onClose,
}) => {
  const { language } = useI18n();
  const [showRawJson, setShowRawJson] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const isZh = language === 'zh-CN';
  const isDaily = review?.type === 'daily';

  const snapshot = (revision.snapshotJson || {}) as SnapshotData;
  const reflection = (revision.reflectionJson || {}) as ReflectionData;

  const totalActiveSeconds = typeof snapshot.totalActiveSeconds === 'number' ? snapshot.totalActiveSeconds : 0;
  const sessionsCount = typeof snapshot.sessionsCount === 'number' ? snapshot.sessionsCount : 0;
  const completedTasksCount = typeof snapshot.completedTasksCount === 'number' ? snapshot.completedTasksCount : undefined;
  const totalTasksCount = typeof snapshot.totalTasksCount === 'number' ? snapshot.totalTasksCount : undefined;
  const activeGoalsCount = typeof snapshot.activeGoalsCount === 'number' ? snapshot.activeGoalsCount : undefined;
  const activeProjectsCount = typeof snapshot.activeProjectsCount === 'number' ? snapshot.activeProjectsCount : undefined;

  // Answers from prompt templates (either `answers` or `promptAnswers`)
  const qnaAnswers = reflection.answers || reflection.promptAnswers || {};
  const hasQna = Object.keys(qnaAnswers).length > 0;

  // General reflection entries (wins, friction, notes)
  const hasWins = Boolean(reflection.wins && reflection.wins.trim());
  const hasFriction = Boolean(reflection.friction && reflection.friction.trim());
  const hasNotes = Boolean(reflection.notes && reflection.notes.trim());
  const hasGeneralReflection = hasWins || hasFriction || hasNotes;

  const handleCopyJson = () => {
    const dataToCopy = {
      revision: revision.revision,
      createdAt: revision.createdAt,
      storyText: revision.storyText,
      snapshotJson: revision.snapshotJson,
      reflectionJson: revision.reflectionJson,
    };
    navigator.clipboard.writeText(JSON.stringify(dataToCopy, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const formattedDate = new Date(revision.createdAt).toLocaleString(
    isZh ? 'zh-CN' : 'en-US',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }
  );

  return (
    <Modal
      onClose={onClose}
      ariaLabel={isZh ? `历史版本 ${revision.revision}` : `Revision ${revision.revision}`}
      maxWidthClass="sm:max-w-xl"
      bodyClassName="px-6 py-4"
      header={
        <div className="w-full -mx-5 -mb-3 px-5 pb-3 border-b border-slate-100 dark:border-slate-800 sm:-mx-5 sm:-mb-3 sm:px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <History className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {isZh ? '历史版本' : 'Revision'} #{revision.revision}
                  </h3>
                  <Badge variant="secondary" className="text-[11px] font-medium">
                    {isDaily
                      ? isZh ? '每日复盘' : 'Daily Close'
                      : isZh ? '每周复盘' : 'Weekly Review'}
                  </Badge>
                  {review?.periodKey && (
                    <span className="text-xs text-slate-400 font-mono">
                      {review.periodKey}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isZh ? `封存时间: ${formattedDate}` : `Sealed on ${formattedDate}`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={isZh ? '关闭' : 'Close'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      }
      footer={
        <div className="flex justify-end">
          <Button size="sm" variant="secondary" onClick={onClose} className="cursor-pointer">
            {isZh ? '关闭' : 'Close'}
          </Button>
        </div>
      }
    >

        {/* Scrollable Content */}
        <div className="space-y-5">
          {/* Narrative Story */}
          {revision.storyText && (
            <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100/60 dark:border-indigo-900/30 space-y-1">
              <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  {isZh ? '叙事复盘故事' : 'Narrative Story'}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                {revision.storyText}
              </p>
            </div>
          )}

          {/* Section: Metrics Snapshot */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <ListChecks className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                {isDaily
                  ? isZh ? '当日执行快照' : 'Daily Execution Snapshot'
                  : isZh ? '当周执行快照' : 'Weekly Execution Snapshot'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* Focus Duration */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>{isZh ? '专注时长' : 'Focus Duration'}</span>
                </div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1 font-mono">
                  {timeService.formatDuration(totalActiveSeconds)}
                </div>
              </div>

              {/* Focus Sessions */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <Sparkles className="w-3 h-3" />
                  <span>{isZh ? '专注会话' : 'Focus Sessions'}</span>
                </div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {sessionsCount} {isZh ? '次' : 'sessions'}
                </div>
              </div>

              {/* Completed Tasks (if applicable) */}
              {totalTasksCount !== undefined && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>{isZh ? '任务完成' : 'Completed Tasks'}</span>
                  </div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
                    {completedTasksCount ?? 0} / {totalTasksCount} {isZh ? '项' : ''}
                    {totalTasksCount > 0 && (
                      <span className="text-[11px] text-slate-400 font-normal ml-1">
                        ({Math.round(((completedTasksCount ?? 0) / totalTasksCount) * 100)}%)
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Active Goals (for weekly) */}
              {activeGoalsCount !== undefined && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <Target className="w-3 h-3 text-indigo-500" />
                    <span>{isZh ? '活跃目标' : 'Active Goals'}</span>
                  </div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
                    {activeGoalsCount} {isZh ? '个' : 'goals'}
                  </div>
                </div>
              )}

              {/* Active Projects (for weekly) */}
              {activeProjectsCount !== undefined && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <FolderKanban className="w-3 h-3 text-amber-500" />
                    <span>{isZh ? '活跃项目' : 'Active Projects'}</span>
                  </div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
                    {activeProjectsCount} {isZh ? '个' : 'projects'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section: Reflection & Insights */}
          {(hasGeneralReflection || hasQna) && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {isZh ? '反思与记录' : 'Reflection & Notes'}
                  </span>
                </div>
                {reflection.templateName && (
                  <Badge variant="outline" className="text-[10px] text-slate-500">
                    {isZh ? '模板: ' : 'Template: '}{reflection.templateName}
                  </Badge>
                )}
              </div>

              {/* Structured Reflection Blocks */}
              <div className="space-y-2">
                {/* Wins */}
                {hasWins && (
                  <div className="p-3 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isZh ? '今日亮点 / 收获 (Wins)' : 'Highlights & Wins'}</span>
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200 mt-1 leading-relaxed whitespace-pre-wrap">
                      {reflection.wins}
                    </p>
                  </div>
                )}

                {/* Friction */}
                {hasFriction && (
                  <div className="p-3 bg-amber-50/40 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/30">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{isZh ? '遇到的阻碍 / 卡点 (Friction)' : 'Friction & Challenges'}</span>
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200 mt-1 leading-relaxed whitespace-pre-wrap">
                      {reflection.friction}
                    </p>
                  </div>
                )}

                {/* Notes */}
                {hasNotes && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{isZh ? '备忘与计划 (Notes)' : 'General Notes & Takeaways'}</span>
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200 mt-1 leading-relaxed whitespace-pre-wrap">
                      {reflection.notes}
                    </p>
                  </div>
                )}

                {/* Template Questions & Answers */}
                {hasQna && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/80 space-y-3">
                    {Object.entries(qnaAnswers).map(([question, answer], idx) => {
                      if (!answer || !answer.trim()) return null;
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-start gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-indigo-500" />
                            <span>{question}</span>
                          </div>
                          <p className="text-xs text-slate-800 dark:text-slate-200 pl-5 leading-relaxed whitespace-pre-wrap">
                            {answer}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section: Collapsible Raw JSON Data */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowRawJson((prev) => !prev)}
              className="flex items-center justify-between w-full py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <span className="font-medium">
                  {isZh ? '底层不可变快照原始数据 (JSON)' : 'Immutable Snapshot Payload (JSON)'}
                </span>
              </div>
              {showRawJson ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showRawJson && (
              <div className="mt-2 space-y-3 animate-in fade-in-50 duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {isZh ? '此数据永久封存不可篡改' : 'Permanent immutable revision snapshot'}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>{isZh ? '已复制' : 'Copied'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>{isZh ? '复制 JSON' : 'Copy JSON'}</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-56">
                  {JSON.stringify(
                    {
                      revision: revision.revision,
                      createdAt: revision.createdAt,
                      snapshotJson: revision.snapshotJson,
                      reflectionJson: revision.reflectionJson,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
    </Modal>
  );
};
