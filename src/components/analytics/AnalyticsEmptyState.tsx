import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart2, CalendarDays, History, AlertTriangle } from 'lucide-react';

interface AnalyticsEmptyStateProps {
  variant: 'none' | 'insufficient';
  language: string;
}

/**
 * 分析页空状态，两态：
 * - none：彻底没有数据，给出去「今日规划 / 复盘」的行动入口
 * - insufficient：有少量数据但不足以形成稳定结论，温和提示即可（不阻断其余模块）
 */
export const AnalyticsEmptyState: React.FC<AnalyticsEmptyStateProps> = ({
  variant,
  language,
}) => {
  const isZh = language === 'zh-CN';

  if (variant === 'none') {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-10 text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <BarChart2 className="w-7 h-7 text-slate-400 dark:text-slate-500" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {isZh ? '还没有分析数据' : 'No analytics yet'}
          </h3>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            {isZh
              ? 'Tilo 会在你记录专注、规划日程后，自动把「计划」与「实际」的差异算给你看。先去做一件小事，再回来看看。'
              : 'Tilo automatically turns your focus sessions and planned schedule into a plan-vs-actual story. Do one small thing, then come back.'}
          </p>
        </div>
        <div className="flex items-center justify-center gap-2.5 pt-1">
          <Link
            to="/today"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
          >
            <CalendarDays className="w-4 h-4" />
            {isZh ? '去今日规划' : 'Plan in Today'}
          </Link>
          <Link
            to="/review"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <History className="w-4 h-4" />
            {isZh ? '去复盘' : 'Go to Review'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 dark:border-amber-900/70 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
      <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400 mt-0.5 shrink-0" />
      <p className="text-[12px] text-amber-800 dark:text-amber-200 leading-relaxed">
        {isZh
          ? '当前周期的数据还比较少，结论可能不够稳定。多用几天、记录更多专注后，这里会更准。'
          : "There isn't much data in this period yet, so the read may be unstable. It gets sharper as you log more focus."}
      </p>
    </div>
  );
};

export default AnalyticsEmptyState;
