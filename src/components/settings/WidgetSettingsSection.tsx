import React from 'react';
import { LayoutGrid } from 'lucide-react';
import { useI18n } from '@/core/i18n';
import { WidgetStatusProvider } from './widgetSettings/WidgetStatusProvider';
import { StartupSection } from './widgetSettings/StartupSection';
import { AlignmentSection } from './widgetSettings/AlignmentSection';
import { AppearanceSection } from './widgetSettings/AppearanceSection';
import { WidgetStatusSection } from './widgetSettings/WidgetStatusSection';

export const WidgetSettingsSection: React.FC = () => {
  const { language } = useI18n();

  return (
    <div className="space-y-6">
      {/* 标题说明 */}
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>{language === 'zh-CN' ? '桌面快捷格子与原生组件管理' : 'Desktop Widgets & Native Integration'}</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {language === 'zh-CN'
            ? '管理 Windows 桌面半透明独立挂件、开机自启动策略、贴边对齐排列与全局外观偏好。'
            : 'Configure Windows desktop native widgets, startup behavior, alignment docking, and global styles.'}
        </p>
      </div>

      <WidgetStatusProvider>
        <StartupSection />
        <AlignmentSection />
        <AppearanceSection />
        <WidgetStatusSection />
      </WidgetStatusProvider>
    </div>
  );
};
