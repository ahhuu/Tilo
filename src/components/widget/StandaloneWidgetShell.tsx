import React from 'react';
import { useWidgetStore } from '@/stores/widgetStore';
import { useI18n } from '@/core/i18n';
import type { WidgetGridId } from './widgetTypes';
import {
  getLocalizedWidgetTitle,
  getWidgetAppearanceTokens,
  resolveWidgetAppearance,
} from './standalone/widgetAppearanceStyles';
import { useWidgetWindowChrome } from './standalone/useWidgetWindowChrome';
import { WidgetHeader } from './standalone/WidgetHeader';
import { WidgetSettingsPanel } from './standalone/WidgetSettingsPanel';

interface StandaloneWidgetShellProps {
  gridId: WidgetGridId;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

export const StandaloneWidgetShell: React.FC<StandaloneWidgetShellProps> = ({
  gridId,
  title,
  icon: IconComponent,
  children,
}) => {
  const { language } = useI18n();
  const { settings } = useWidgetStore();

  const appearance = resolveWidgetAppearance(settings.appearance);
  const { zoomLevel, fontFamilyStyle, fontFamilyClass, buttonSizeClass, borderRadiusClass, windowStyle } =
    getWidgetAppearanceTokens(appearance);
  // 中文语言下纯净化标题（去除括号英文字符）
  const localizedTitle = getLocalizedWidgetTitle(gridId, language === 'zh-CN', title);

  const chrome = useWidgetWindowChrome({ gridId, appearance });

  return (
    <div
      className={`w-screen h-screen m-0 p-0 bg-transparent overflow-hidden flex flex-col select-none ${fontFamilyClass} ${buttonSizeClass} relative`}
      style={{
        zoom: zoomLevel,
        fontFamily: fontFamilyStyle,
      }}
    >
      {/* 核心挂件卡片：无缝贴合视口，根据设置采用对称圆角与 5 款窗口质感风格 */}
      <div
        className={`w-full h-full ${borderRadiusClass} ${windowStyle.card} flex flex-col overflow-hidden transition-all duration-200 relative`}
        style={{ opacity: settings.opacityPercent / 100 }}
      >
        {/* 智能对齐导引微光边线 (仅在对齐时显示，静止后自动消失) */}
        {chrome.alignment.alignLeft && (
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-indigo-500 shadow-[0_0_10px_#6366f1] z-50 pointer-events-none" />
        )}
        {chrome.alignment.alignRight && (
          <div className="absolute top-0 bottom-0 right-0 w-1 bg-indigo-500 shadow-[0_0_10px_#6366f1] z-50 pointer-events-none" />
        )}
        {chrome.alignment.alignTop && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500 shadow-[0_0_10px_#6366f1] z-50 pointer-events-none" />
        )}
        {(chrome.alignment.alignBottom || chrome.alignment.snapVertical) && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 shadow-[0_0_10px_#6366f1] z-50 pointer-events-none" />
        )}

        {/* 顶栏：集成 data-tauri-drag-region、双击折叠与悬停显隐支持 */}
        <WidgetHeader
          gridId={gridId}
          localizedTitle={localizedTitle}
          IconComponent={IconComponent}
          windowStyle={windowStyle}
          appearance={appearance}
          chrome={chrome}
        />

        {/* 深度自定义抽屉面板（点击顶栏自定义滑出） */}
        {chrome.showSettings && (
          <WidgetSettingsPanel
            gridId={gridId}
            localizedTitle={localizedTitle}
            isLocked={chrome.isLocked}
            onClose={() => chrome.setShowSettings(false)}
            onToggleLock={chrome.handleToggleLock}
            onResetWindowSize={chrome.handleResetWindowSize}
          />
        )}

        {/* 内容自适应区域：折叠时隐藏；拉伸高度时自动平滑重现 */}
        <main className={`flex-1 min-h-0 flex flex-col overflow-hidden ${chrome.isCollapsed ? 'hidden' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
};
