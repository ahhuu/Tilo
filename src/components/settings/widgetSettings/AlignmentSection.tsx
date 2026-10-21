import React from 'react';
import { AlignRight, AlignLeft, AlignCenter, Maximize2 } from 'lucide-react';
import { useI18n } from '@/core/i18n';
import { useUIStore } from '@/stores/uiStore';
import { tauriWidgetService } from '@/services/tauriWidgetService';
import { useWidgetStatus } from './widgetStatusContext';
import { SettingsCard, SettingsCardTitle } from './WidgetSettingsControls';

const ACTION_BUTTON_CLASS =
  'flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer shadow-2xs';

const ACTION_BUTTON_ACCENT_CLASS =
  'flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer shadow-2xs';

/** 多挂件一键贴边、居中归位、恢复默认尺寸。 */
export const AlignmentSection: React.FC = () => {
  const { language } = useI18n();
  const { addToast } = useUIStore();
  const { refreshStatus } = useWidgetStatus();

  const handleAlign = async (mode: 'right' | 'left' | 'horizontal') => {
    await tauriWidgetService.alignWidgets(mode);
    addToast({
      message:
        mode === 'right'
          ? (language === 'zh-CN' ? '已将所有桌面挂件靠右贴边排列' : 'Widgets aligned to right edge')
          : mode === 'left'
          ? (language === 'zh-CN' ? '已将所有桌面挂件靠左贴边排列' : 'Widgets aligned to left edge')
          : (language === 'zh-CN' ? '已将挂件水平并排' : 'Widgets aligned horizontally'),
      type: 'success',
    });
    await refreshStatus();
  };

  const handleResetPositions = async () => {
    await tauriWidgetService.resetWidgetPositions();
    addToast({
      message: language === 'zh-CN' ? '已将所有桌面挂件重置居中' : 'Widgets centered on screen',
      type: 'info',
    });
  };

  const handleResetSizes = async () => {
    await tauriWidgetService.resetAllWidgetSizes();
    addToast({
      message: language === 'zh-CN' ? '已将所有桌面挂件恢复为标准默认尺寸' : 'All widgets reset to default size',
      type: 'success',
    });
  };

  return (
    <SettingsCard>
      <SettingsCardTitle
        icon={<AlignRight className="w-4 h-4 text-indigo-600" />}
        title={language === 'zh-CN' ? '多挂件一键对齐与重置' : 'Desktop Alignment & Docking'}
      />

      <p className="text-xs text-slate-500 dark:text-slate-400">
        {language === 'zh-CN'
          ? '当你在桌面上打开了多个挂件时，可以一键将它们整齐贴靠在屏幕一侧，保持桌面清爽有序。'
          : 'Dock open widgets neatly to screen edges or center them if misplaced.'}
      </p>

      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <button type="button" onClick={() => handleAlign('right')} className={ACTION_BUTTON_ACCENT_CLASS}>
          <AlignRight className="w-4 h-4 text-indigo-600" />
          <span>{language === 'zh-CN' ? '靠桌面右侧整齐排列' : 'Dock to Right Edge'}</span>
        </button>

        <button type="button" onClick={() => handleAlign('left')} className={ACTION_BUTTON_ACCENT_CLASS}>
          <AlignLeft className="w-4 h-4 text-indigo-600" />
          <span>{language === 'zh-CN' ? '靠桌面左侧整齐排列' : 'Dock to Left Edge'}</span>
        </button>

        <button
          type="button"
          onClick={handleResetPositions}
          className={ACTION_BUTTON_CLASS}
          title="当插拔多显示器导致窗口找不到时，一键召回到当前主屏幕中央"
        >
          <AlignCenter className="w-4 h-4 text-slate-500" />
          <span>{language === 'zh-CN' ? '屏幕中央叠层归位' : 'Reset to Center'}</span>
        </button>

        <button
          type="button"
          onClick={handleResetSizes}
          className={ACTION_BUTTON_ACCENT_CLASS}
          title="当挂件被随意拉伸变形或折叠错乱后，一键将所有桌面挂件还原为标准黄金比例大小"
        >
          <Maximize2 className="w-4 h-4 text-indigo-500" />
          <span>{language === 'zh-CN' ? '恢复所有标准默认尺寸' : 'Reset All Sizes'}</span>
        </button>
      </div>
    </SettingsCard>
  );
};
