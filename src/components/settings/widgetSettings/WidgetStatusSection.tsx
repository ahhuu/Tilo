import React from 'react';
import { Sparkles } from 'lucide-react';
import { useI18n } from '@/core/i18n';
import { tauriWidgetService, WIDGET_METAS } from '@/services/tauriWidgetService';
import type { WidgetGridId } from '@/components/widget/widgetTypes';
import { useWidgetStatus } from './widgetStatusContext';
import { SettingsCard, SettingsCardTitle } from './WidgetSettingsControls';

/** 6 款核心挂件的桌面运行状态与一键开关。 */
export const WidgetStatusSection: React.FC = () => {
  const { language } = useI18n();
  const { activeWidgetIds, refreshStatus } = useWidgetStatus();

  const handleToggleWidget = async (id: WidgetGridId) => {
    await tauriWidgetService.toggleWidget(id);
    await refreshStatus();
  };

  return (
    <SettingsCard className="space-y-3">
      <SettingsCardTitle
        title={<span>{language === 'zh-CN' ? '各挂件桌面运行状态' : 'Active Widget Status'}</span>}
        action={
          <button
            type="button"
            onClick={() => tauriWidgetService.openDualDefaultWidgets()}
            className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'zh-CN' ? '一键打开收集与待办' : 'Launch Inbox & Tasks'}</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
        {(Object.keys(WIDGET_METAS) as WidgetGridId[]).map((id) => {
          const meta = WIDGET_METAS[id];
          const isVisible = activeWidgetIds.has(id);
          const title = language === 'zh-CN' ? meta.name : meta.nameEn || meta.name;
          const description = language === 'zh-CN' ? meta.desc : meta.descEn || meta.desc;

          return (
            <div
              key={id}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                isVisible
                  ? 'bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 shadow-2xs'
                  : 'bg-slate-50/70 dark:bg-slate-850/60 border-slate-200/60 dark:border-slate-800'
              }`}
            >
              <div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>{title}</span>
                  {isVisible && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{description}</div>
              </div>

              <button
                type="button"
                onClick={() => handleToggleWidget(id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isVisible
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                }`}
              >
                {isVisible
                  ? (language === 'zh-CN' ? '已在桌面' : 'Active')
                  : (language === 'zh-CN' ? '打开' : 'Open')}
              </button>
            </div>
          );
        })}
      </div>
    </SettingsCard>
  );
};
