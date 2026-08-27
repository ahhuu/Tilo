import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/core/i18n';
import { getFocusHeatmapData, type FocusHeatmapResult } from '@/services/chronotypeAnalyticsService';
import { Flame, Calendar, Trophy, Award } from 'lucide-react';

export const FocusHeatmapCard: React.FC = () => {
  const { language } = useI18n();
  const [data, setData] = useState<FocusHeatmapResult | null>(null);
  const [hoveredDay, setHoveredDay] = useState<{ dateKey: string; totalMinutes: number; sessionCount: number } | null>(null);

  useEffect(() => {
    getFocusHeatmapData(364).then(setData);
  }, []);

  if (!data) return null;

  // Split 364 days into 52 weeks (7 days each)
  const weeks: typeof data.days[] = [];
  for (let i = 0; i < data.days.length; i += 7) {
    weeks.push(data.days.slice(i, i + 7));
  }

  const getLevelClass = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-indigo-200 dark:bg-indigo-950/90 border border-indigo-300/60 dark:border-indigo-800/50';
      case 2:
        return 'bg-indigo-400 dark:bg-indigo-800 border border-indigo-500/60 dark:border-indigo-700/60';
      case 3:
        return 'bg-indigo-600 dark:bg-indigo-600 text-white';
      case 4:
        return 'bg-indigo-800 dark:bg-indigo-400 text-white';
      default:
        return 'bg-slate-100 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-800/60';
    }
  };

  const totalHours = Math.round((data.totalMinutes / 60) * 10) / 10;

  return (
    <Card className="p-5 space-y-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {language === 'zh-CN' ? '年度专注热力矩阵 (365 Days Heatmap)' : 'Annual Focus Activity Heatmap'}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'zh-CN'
              ? '记录过去一整年每一天的专注沉淀与习惯连续性'
              : 'Daily focus consistency and discipline matrix over the past year'}
          </p>
        </div>

        {/* Highlight Stats */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>{language === 'zh-CN' ? '当前连续:' : 'Streak:'}</span>
            <span className="font-semibold font-mono text-slate-900 dark:text-slate-100">{data.currentStreak} {language === 'zh-CN' ? '天' : 'd'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <Award className="w-3.5 h-3.5 text-indigo-500" />
            <span>{language === 'zh-CN' ? '最长连续:' : 'Longest:'}</span>
            <span className="font-semibold font-mono text-slate-900 dark:text-slate-100">{data.longestStreak} {language === 'zh-CN' ? '天' : 'd'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
            <span>{language === 'zh-CN' ? '总专注:' : 'Total:'}</span>
            <span className="font-semibold font-mono text-slate-900 dark:text-slate-100">{totalHours}h</span>
          </div>
        </div>
      </div>

      {/* Heatmap Matrix Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[680px]">
          <div className="grid grid-flow-col grid-rows-7 gap-1">
            {weeks.flatMap((week, wIdx) =>
              week.map((day, dIdx) => (
                <div
                  key={`${wIdx}-${dIdx}-${day.dateKey}`}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`w-2.5 h-2.5 rounded-2xs transition-all cursor-pointer hover:scale-125 ${getLevelClass(day.level)}`}
                  title={`${day.dateKey}: ${day.totalMinutes}m (${day.sessionCount} sessions)`}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Legend & Hover Details */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
        <div>
          {hoveredDay ? (
            <span className="text-slate-700 dark:text-slate-200 font-mono">
              <strong className="text-indigo-600 dark:text-indigo-400">{hoveredDay.dateKey}</strong>:{' '}
              {hoveredDay.totalMinutes} {language === 'zh-CN' ? '分钟' : 'mins'} · {hoveredDay.sessionCount} {language === 'zh-CN' ? '次专注' : 'sessions'}
            </span>
          ) : (
            <span>{language === 'zh-CN' ? `过去一年共累计专注 ${data.activeDaysCount} 天` : `Active on ${data.activeDaysCount} days in past year`}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 select-none">
          <span>{language === 'zh-CN' ? '少' : 'Less'}</span>
          <div className="w-2.5 h-2.5 rounded-2xs bg-slate-100 dark:bg-slate-800/60 border border-slate-200/50" />
          <div className="w-2.5 h-2.5 rounded-2xs bg-indigo-200 dark:bg-indigo-950/90" />
          <div className="w-2.5 h-2.5 rounded-2xs bg-indigo-400 dark:bg-indigo-800" />
          <div className="w-2.5 h-2.5 rounded-2xs bg-indigo-600 dark:bg-indigo-600" />
          <div className="w-2.5 h-2.5 rounded-2xs bg-indigo-800 dark:bg-indigo-400" />
          <span>{language === 'zh-CN' ? '多' : 'More'}</span>
        </div>
      </div>
    </Card>
  );
};
