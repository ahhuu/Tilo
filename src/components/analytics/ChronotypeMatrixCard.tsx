import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/core/i18n';
import { getChronotypeMatrixData, type ChronotypeMatrixResult } from '@/services/chronotypeAnalyticsService';
import { SunMedium, Zap, Clock } from 'lucide-react';

export const ChronotypeMatrixCard: React.FC = () => {
  const { language } = useI18n();
  const [data, setData] = useState<ChronotypeMatrixResult | null>(null);

  useEffect(() => {
    getChronotypeMatrixData(30).then(setData);
  }, []);

  if (!data) return null;

  return (
    <Card className="p-5 space-y-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <SunMedium className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {language === 'zh-CN' ? '24小时精力生物钟洞察 (Chronotype Matrix)' : '24-Hour Chronotype & Energy Distribution'}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'zh-CN'
              ? '基于过去 30 天的专注会话时间分布，智能发现您的黄金高效时段'
              : 'Discovers your peak productivity windows based on past 30 days of actual work sessions'}
          </p>
        </div>

        {/* Peak Window Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-300 text-xs font-semibold self-start sm:self-auto">
          <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
          <span>{language === 'zh-CN' ? `黄金专注时段: ${data.peakWindow}` : `Peak Focus: ${data.peakWindow}`}</span>
        </div>
      </div>

      {/* 24-Hour Vertical Bar Chart */}
      <div className="pt-2">
        <div className="flex items-end justify-between gap-1 h-32 px-1">
          {data.hourlyDistribution.map((item) => {
            const isPeak = item.hour === data.peakHour || item.hour === data.peakHour + 1;
            return (
              <div key={item.hour} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                {/* Bar */}
                <div
                  className={`w-full rounded-t-sm transition-all duration-300 ${
                    isPeak
                      ? 'bg-amber-500 dark:bg-amber-400 shadow-xs'
                      : item.totalMinutes > 0
                      ? 'bg-indigo-500 dark:bg-indigo-600'
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                  style={{
                    height: `${Math.max(4, item.percent)}%`,
                  }}
                />

                {/* Tooltip on Hover */}
                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[10px] rounded-lg px-2 py-1 z-20 whitespace-nowrap shadow-lg">
                  <span className="font-mono">{item.hour.toString().padStart(2, '0')}:00</span>
                  <span className="font-semibold">{item.totalMinutes} {language === 'zh-CN' ? '分钟' : 'mins'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Hour Axis Labels */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1.5 border-t border-slate-100 dark:border-slate-800 mt-1">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>23:00</span>
        </div>
      </div>

      {/* Advice Footer */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
        <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
        <span className="leading-relaxed">
          {language === 'zh-CN'
            ? `建议将高认知负荷的任务安排在 ${data.peakWindow} 之间，将事务性沟通与整理安排在精力低谷期。`
            : `Recommended to schedule deep analytical work during ${data.peakWindow}, reserving low-energy hours for admin tasks.`}
        </span>
      </div>
    </Card>
  );
};
