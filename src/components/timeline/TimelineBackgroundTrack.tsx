import React from 'react';
import { useI18n } from '@/core/i18n';
import { timeService } from '@/core/time/timeService';
import type { TimelineEventLayoutItem } from '@/core/timeline/types';
import type { Session } from '@/core/types/domain';

/** 右侧「后台活动」轨道：仅在存在后台会话时显示。 */
export const TimelineBackgroundTrack: React.FC<{
  items: TimelineEventLayoutItem[];
  onInspectSession?: (session: Session) => void;
}> = ({ items, onInspectSession }) => {
  const { language } = useI18n();

  if (items.length === 0) return null;

  return (
    <div className="w-24 shrink-0 border-l border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 relative overflow-hidden select-none">
      <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 border-b border-slate-100 dark:border-slate-800 text-center uppercase tracking-wider">
        {language === 'zh-CN' ? '后台活动' : 'Background'}
      </div>

      {items.map((bgItem) => {
        const bgSession = bgItem.originalEntity as Session;
        return (
          <div
            key={bgItem.id}
            onClick={() => onInspectSession?.(bgSession)}
            className="absolute left-1 right-1 rounded-lg bg-slate-200/90 dark:bg-slate-700/80 p-1 text-[10px] text-slate-700 dark:text-slate-200 truncate cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors shadow-2xs"
            style={{
              top: `${bgItem.topPercent}%`,
              height: `${bgItem.heightPercent}%`,
            }}
            title={`${bgItem.title} (${timeService.formatDuration(bgItem.durationSeconds)})`}
          >
            <span className="font-semibold block truncate">{bgItem.title}</span>
            <span className="font-mono text-[9px] text-slate-500 dark:text-slate-400">
              {timeService.formatDuration(bgItem.durationSeconds)}
            </span>
          </div>
        );
      })}
    </div>
  );
};
