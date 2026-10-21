import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { timeService } from '@/core/time/timeService';
import type { AnalyticsSummary } from '@/services/analyticsService';

interface InsightItem {
  text: string;
  tone: 'good' | 'warn' | 'neutral';
  link?: { to: string; label: string };
}

interface InsightSummaryProps {
  analytics: AnalyticsSummary;
  language: string;
  /** 周期标签，如「本周 / 上周 / 本月 / 上月」，用于结论开头 */
  scopeLabel: string;
}

const TONE_DOT: Record<InsightItem['tone'], string> = {
  good: 'bg-emerald-500',
  warn: 'bg-amber-500',
  neutral: 'bg-slate-400 dark:bg-slate-500',
};

const TONE_LINK: Record<InsightItem['tone'], string> = {
  good: 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300',
  warn: 'text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300',
  neutral: 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300',
};

/**
 * 纯规则生成的「一句话结论」，不使用任何 AI。
 * 按固定优先级产出若干条洞察，取前三条，并附带可执行的回链（今日 / 复盘）。
 */
export const InsightSummary: React.FC<InsightSummaryProps> = ({
  analytics,
  language,
  scopeLabel,
}) => {
  const isZh = language === 'zh-CN';
  const focusH = analytics.activeFocusSeconds / 3600;
  const items: InsightItem[] = [];

  // 1. 专注体量（始终作为第一条，给整体定调）
  if (focusH < 2) {
    items.push({
      tone: 'neutral',
      text: isZh
        ? `${scopeLabel}只记录了约 ${focusH.toFixed(1)} 小时专注，样本还太少，结论仅供参考。`
        : `You only logged about ${focusH.toFixed(1)}h of focus in ${scopeLabel} — too little for a stable read.`,
      link: { to: '/today', label: isZh ? '去今日记录专注' : 'Log focus in Today' },
    });
  } else {
    items.push({
      tone: 'good',
      text: isZh
        ? `${scopeLabel}共投入 ${timeService.formatDuration(analytics.activeFocusSeconds)} 专注时间。`
        : `You put in ${timeService.formatDuration(analytics.activeFocusSeconds)} of focus time in ${scopeLabel}.`,
    });
  }

  // 2. 计划 vs 实际时长吻合度
  const ta = analytics.timeAccuracyPercentage;
  if (ta >= 85) {
    items.push({
      tone: 'good',
      text: isZh
        ? `计划与实际时长的吻合度高达 ${ta}%，你对自己节奏的预估很稳。`
        : `Plan-vs-actual duration match is high at ${ta}% — your estimates are reliable.`,
    });
  } else if (ta > 0 && ta < 60) {
    items.push({
      tone: 'warn',
      text: isZh
        ? `计划与实际的时长偏差较大（仅 ${ta}% 吻合），试着把任务拆细、估得更准。`
        : `Plan-vs-actual drift is large (only ${ta}% match) — try smaller, better-estimated tasks.`,
      link: { to: '/review', label: isZh ? '去复盘回看' : 'Review the gap' },
    });
  }

  // 3. 计划外工作占比
  const up = analytics.unplannedWork.unplannedPercentage;
  if (up >= 40 && analytics.activeFocusSeconds > 0) {
    items.push({
      tone: 'warn',
      text: isZh
        ? `有 ${up}% 的专注是计划外的，临场插入偏多——下次可预留缓冲时间。`
        : `${up}% of your focus was unplanned — consider leaving buffer for ad-hoc work.`,
      link: { to: '/today', label: isZh ? '去今日规划' : 'Plan in Today' },
    });
  }

  // 4. 启动延迟
  const delay = analytics.startDelay.averageDelayMinutes;
  if (analytics.startDelay.linkedSessionsCount > 0 && delay >= 30) {
    items.push({
      tone: 'warn',
      text: isZh
        ? `计划任务平均晚开工 ${delay} 分钟，启动阻力可能偏高。`
        : `Scheduled tasks start ${delay} min late on average — launch friction may be high.`,
    });
  }

  // 5. 任务完成率
  if (analytics.totalTasksCount > 0 && analytics.taskCompletionRate < 50) {
    items.push({
      tone: 'warn',
      text: isZh
        ? `周期内排了 ${analytics.totalTasksCount} 个任务，只完成 ${analytics.completedTasksCount} 个，未完成的都落在哪天了？`
        : `Of ${analytics.totalTasksCount} scheduled tasks, only ${analytics.completedTasksCount} were done — where did the rest slip?`,
      link: { to: '/today', label: isZh ? '去今日补齐' : 'Catch up in Today' },
    });
  }

  // 6. 排期超容量
  if (analytics.capacity.daysPlannedAboveCapacityCount > 0) {
    items.push({
      tone: 'warn',
      text: isZh
        ? `有 ${analytics.capacity.daysPlannedAboveCapacityCount} 天排期超过每日容量，注意别透支。`
        : `${analytics.capacity.daysPlannedAboveCapacityCount} day(s) were scheduled over daily capacity — watch for burnout.`,
    });
  }

  const top = items.slice(0, 3);

  if (top.length === 0) return null;

  return (
    <section className="rounded-2xl border border-indigo-200/70 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {isZh ? `${scopeLabel}一句话结论` : `${scopeLabel} in one line`}
        </h3>
      </div>

      <ul className="space-y-2.5">
        {top.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span
              className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${TONE_DOT[item.tone]}`}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1 text-[13px] leading-relaxed text-slate-700 dark:text-slate-200">
              <span>{item.text}</span>
              {item.link && (
                <Link
                  to={item.link.to}
                  className={`inline-flex items-center gap-0.5 ml-1.5 font-medium ${TONE_LINK[item.tone]} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded`}
                >
                  {item.link.label}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default InsightSummary;
