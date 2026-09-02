import React, { useState, useEffect } from 'react';
import {
  LayoutGrid,
  Power,
  Sparkles,
  AlignRight,
  AlignLeft,
  AlignCenter,
  Sliders,
  RotateCcw,
  Lock,
  Eye,
  MousePointerClick,
  Maximize2,
} from 'lucide-react';
import { useI18n } from '@/core/i18n';
import { useUIStore } from '@/stores/uiStore';
import { useWidgetStore } from '@/stores/widgetStore';
import { tauriWidgetService, WIDGET_METAS } from '@/services/tauriWidgetService';
import type { WidgetGridId } from '@/components/widget/widgetTypes';

export const WidgetSettingsSection: React.FC = () => {
  const { language } = useI18n();
  const { addToast } = useUIStore();
  const { settings, updateAppearance, setOpacity, setAlwaysOnTop, resetToDefaults } = useWidgetStore();

  const [isAutoStart, setIsAutoStart] = useState(false);
  const [isAutoLaunchWidgets, setIsAutoLaunchWidgets] = useState(false);
  const [activeWidgetIds, setActiveWidgetIds] = useState<Set<WidgetGridId>>(new Set());

  const handleResetAppearanceDefaults = () => {
    resetToDefaults();
    addToast({
      message: language === 'zh-CN' ? '已恢复挂件全局外观与通用偏好至出厂默认' : 'Reset widget appearance to defaults',
      type: 'success',
    });
  };

  // 刷新状态
  const refreshStatus = async () => {
    const auto = await tauriWidgetService.isAutoStartEnabled();
    setIsAutoStart(auto);
    setIsAutoLaunchWidgets(tauriWidgetService.isAutoLaunchWidgetsOnStartup());

    const activeList = await tauriWidgetService.getVisibleWidgetIds();
    setActiveWidgetIds(new Set(activeList));
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const handleToggleAutoStart = async () => {
    const nextState = !isAutoStart;
    const success = await tauriWidgetService.setAutoStart(nextState);
    if (success) {
      setIsAutoStart(nextState);
      addToast({
        message: nextState
          ? (language === 'zh-CN' ? '已开启 Windows 开机自启动' : 'Launch at startup enabled')
          : (language === 'zh-CN' ? '已关闭开机自启动' : 'Launch at startup disabled'),
        type: 'success',
      });
    } else {
      addToast({
        message: language === 'zh-CN' ? '设置开机自启失败，请在桌面客户端中运行' : 'Failed to configure autostart',
        type: 'warning',
      });
    }
  };

  const handleToggleAutoLaunchWidgets = () => {
    const nextVal = !isAutoLaunchWidgets;
    setIsAutoLaunchWidgets(nextVal);
    tauriWidgetService.setAutoLaunchWidgetsOnStartup(nextVal);
    addToast({
      message: nextVal
        ? (language === 'zh-CN' ? '已开启开机自动唤起快捷挂件' : 'Auto launch widgets on startup enabled')
        : (language === 'zh-CN' ? '已关闭开机自动唤起挂件' : 'Auto launch widgets disabled'),
      type: 'info',
    });
  };

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

  const handleToggleWidget = async (id: WidgetGridId) => {
    await tauriWidgetService.toggleWidget(id);
    await refreshStatus();
  };

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

      {/* 1. 开机自启动与唤醒策略 */}
      <section className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
          <Power className="w-4 h-4 text-emerald-600" />
          <span>{language === 'zh-CN' ? '开机自启动与运行策略' : 'Startup & Background Behavior'}</span>
        </div>

        <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {/* Windows 开机自启 */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="font-medium text-slate-800 dark:text-slate-200">
                {language === 'zh-CN' ? 'Windows 开机自动启动 Tilo' : 'Launch Tilo at Windows Startup'}
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                {language === 'zh-CN'
                  ? '开机进入系统后自动启动 Tilo，常驻后台提供毫秒级就绪体验'
                  : 'Start Tilo in the background when logging into Windows'}
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleAutoStart}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isAutoStart ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  isAutoStart ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 开机自动唤起快捷挂件 */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <div className="font-medium text-slate-800 dark:text-slate-200">
                {language === 'zh-CN' ? '开机时自动在桌面上显示挂件' : 'Auto Display Widgets on Desktop'}
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                {language === 'zh-CN'
                  ? '开机自启后，自动在桌面上打开并整齐贴放常用挂件（如今日待办与闪念收集）'
                  : 'Automatically show your favorite widgets docked on desktop upon boot'}
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleAutoLaunchWidgets}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isAutoLaunchWidgets ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  isAutoLaunchWidgets ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 关闭主窗口时的行为 */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <div className="font-medium text-slate-800 dark:text-slate-200">
                {language === 'zh-CN' ? '关闭主窗口时的行为' : 'When Closing Main Window'}
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                {language === 'zh-CN'
                  ? '选择点击主界面右上角 × 关闭按钮时的处理动作'
                  : 'Choose behavior when clicking the close button on main window'}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {[
                { id: 'ask', label: language === 'zh-CN' ? '每次询问' : 'Ask Every Time' },
                { id: 'tray', label: language === 'zh-CN' ? '最小化到托盘' : 'To Tray' },
                { id: 'exit', label: language === 'zh-CN' ? '彻底退出' : 'Exit' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    tauriWidgetService.setCloseActionPreference(
                      opt.id as 'ask' | 'tray' | 'exit'
                    );
                    addToast({
                      message: language === 'zh-CN' ? `已更新关闭行为为：${opt.label}` : 'Close action preference updated',
                      type: 'success',
                    });
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                    tauriWidgetService.getCloseActionPreference() === opt.id
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. 桌面多挂件智能对齐与归位中心 */}
      <section className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
          <AlignRight className="w-4 h-4 text-indigo-600" />
          <span>{language === 'zh-CN' ? '多挂件一键对齐与重置' : 'Desktop Alignment & Docking'}</span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          {language === 'zh-CN'
            ? '当你在桌面上打开了多个挂件时，可以一键将它们整齐贴靠在屏幕一侧，保持桌面清爽有序。'
            : 'Dock open widgets neatly to screen edges or center them if misplaced.'}
        </p>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => handleAlign('right')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
          >
            <AlignRight className="w-4 h-4 text-indigo-600" />
            <span>{language === 'zh-CN' ? '靠桌面右侧整齐排列' : 'Dock to Right Edge'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleAlign('left')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
          >
            <AlignLeft className="w-4 h-4 text-indigo-600" />
            <span>{language === 'zh-CN' ? '靠桌面左侧整齐排列' : 'Dock to Left Edge'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetPositions}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
            title="当插拔多显示器导致窗口找不到时，一键召回到当前主屏幕中央"
          >
            <AlignCenter className="w-4 h-4 text-slate-500" />
            <span>{language === 'zh-CN' ? '屏幕中央叠层归位' : 'Reset to Center'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetSizes}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
            title="当挂件被随意拉伸变形或折叠错乱后，一键将所有桌面挂件还原为标准黄金比例大小"
          >
            <Maximize2 className="w-4 h-4 text-indigo-500" />
            <span>{language === 'zh-CN' ? '恢复所有标准默认尺寸' : 'Reset All Sizes'}</span>
          </button>
        </div>
      </section>

      {/* 3. 全局外观与半透明度控制 */}
      <section className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
            <Sliders className="w-4 h-4 text-amber-500" />
            <span>{language === 'zh-CN' ? '挂件全局外观与通用偏好' : 'Global Widget Appearance'}</span>
          </div>
          <button
            type="button"
            onClick={handleResetAppearanceDefaults}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-slate-700/80 transition-colors cursor-pointer"
            title={language === 'zh-CN' ? '将透明度、字号、字体风格、按钮规格与圆角恢复为初始默认值' : 'Reset opacity, font size, font family, button size and corners to default'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'zh-CN' ? '恢复默认' : 'Reset to Defaults'}</span>
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* 窗口质感风格切换 */}
          <div className="space-y-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="font-medium text-slate-800 dark:text-slate-200">
                {language === 'zh-CN' ? '挂件窗口质感风格' : 'Widget Window Theme Style'}
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                {language === 'zh-CN'
                  ? '切换所有桌面挂件的质感外观（支持现代毛玻璃、曜石黑、纸质暖、无界悬浮与复古终端）'
                  : 'Select visual skin for all desktop widgets (Glass, Stealth OLED, Paper, Floating, Terminal)'}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              {[
                { id: 'glass' as const, labelZh: '现代毛玻璃', labelEn: 'Glass', descZh: '高斯透射柔光' },
                { id: 'stealth' as const, labelZh: '曜石纯黑', labelEn: 'Stealth OLED', descZh: '深邃高对比' },
                { id: 'paper' as const, labelZh: '极简纸质', labelEn: 'Paper Warm', descZh: '暖调哑光触感' },
                { id: 'floating' as const, labelZh: '一体化悬浮', labelEn: 'Seamless', descZh: '取消顶栏底线' },
                { id: 'terminal' as const, labelZh: '复古终端', labelEn: 'Terminal', descZh: '黑客绿等宽' },
              ].map((style) => {
                const isActive = (settings.appearance?.windowStyle || 'glass') === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => updateAppearance({ windowStyle: style.id })}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/60 border-indigo-500/80 dark:border-indigo-500 shadow-2xs font-semibold ring-1 ring-indigo-500/30'
                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className={`text-xs ${isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                      {language === 'zh-CN' ? style.labelZh : style.labelEn}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {style.descZh}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 半透明度滑块 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-medium">
              <span>{language === 'zh-CN' ? '挂件默认毛玻璃半透明度：' : 'Default Acrylic Opacity:'}</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                {settings.opacityPercent}%
              </span>
            </div>
            <input
              type="range"
              min={40}
              max={100}
              value={settings.opacityPercent}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>{language === 'zh-CN' ? '40% (高度透视壁纸)' : '40% (High transparency)'}</span>
              <span>{language === 'zh-CN' ? '100% (完全不透明)' : '100% (Fully opaque)'}</span>
            </div>
          </div>

          {/* 字体大小 */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <div className="font-medium text-slate-800 dark:text-slate-200">
                {language === 'zh-CN' ? '挂件字体大小' : 'Widget Font Size'}
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                {language === 'zh-CN' ? '调节所有桌面挂件的文字字号大小' : 'Adjust font size across all widgets'}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {(['small', 'normal', 'large'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => updateAppearance({ fontSizeLevel: lvl })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    (settings.appearance?.fontSizeLevel || 'normal') === lvl
                      ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {lvl === 'small'
                    ? (language === 'zh-CN' ? '小号 (84%)' : 'Small (84%)')
                    : lvl === 'normal'
                    ? (language === 'zh-CN' ? '标准 (100%)' : 'Standard (100%)')
                    : (language === 'zh-CN' ? '大号 (122%)' : 'Large (122%)')}
                </button>
              ))}
            </div>
          </div>

          {/* 字体族风格 */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <div className="font-medium text-slate-800 dark:text-slate-200">
                {language === 'zh-CN' ? '挂件字体风格' : 'Font Family'}
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                {language === 'zh-CN' ? '设置挂件全局采用的字体家族' : 'Set typography style across all widgets'}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {[
                { id: 'system' as const, label: language === 'zh-CN' ? '系统' : 'System' },
                { id: 'sans' as const, label: language === 'zh-CN' ? '无衬线' : 'Sans' },
                { id: 'mono' as const, label: language === 'zh-CN' ? '等宽代码' : 'Mono' },
                { id: 'serif' as const, label: language === 'zh-CN' ? '衬线' : 'Serif' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => updateAppearance({ fontFamily: f.id })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    (settings.appearance?.fontFamily || 'system') === f.id
                      ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* 按钮规格 */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <div className="font-medium text-slate-800 dark:text-slate-200">
                {language === 'zh-CN' ? '操作按钮尺寸' : 'Button Size'}
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                {language === 'zh-CN' ? '统一放大或微缩挂件内的按钮控件' : 'Scale interactive buttons inside widgets'}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {(['compact', 'standard', 'generous'] as const).map((btn) => (
                <button
                  key={btn}
                  type="button"
                  onClick={() => updateAppearance({ buttonSize: btn })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    (settings.appearance?.buttonSize || 'standard') === btn
                      ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {btn === 'compact'
                    ? (language === 'zh-CN' ? '紧凑小巧' : 'Compact')
                    : btn === 'standard'
                    ? (language === 'zh-CN' ? '标准尺寸' : 'Standard')
                    : (language === 'zh-CN' ? '宽大易点' : 'Generous')}
                </button>
              ))}
            </div>
          </div>

          {/* 顶栏控制按钮显示偏好与独立配置 */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{language === 'zh-CN' ? '顶栏控制按钮显示策略' : 'Header Actions Visibility'}</span>
                </div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  {language === 'zh-CN'
                    ? '默认静默沉浸（鼠标移入平滑淡入）或一直正常显示；支持每个按钮独立定制'
                    : 'Choose reveal on hover or always show; customize buttons individually'}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => updateAppearance({ headerActionsMode: 'hover' })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    (settings.appearance?.headerActionsMode || 'hover') === 'hover'
                      ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {language === 'zh-CN' ? '静默沉浸 (悬停淡入)' : 'Hover to Reveal'}
                </button>
                <button
                  type="button"
                  onClick={() => updateAppearance({ headerActionsMode: 'always' })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    settings.appearance?.headerActionsMode === 'always'
                      ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {language === 'zh-CN' ? '一直显示' : 'Always Show'}
                </button>
              </div>
            </div>

            {/* 各按钮独立配置 */}
            <div className="grid grid-cols-5 gap-2 pt-1">
              {[
                { key: 'pin' as const, labelZh: '置顶按钮', labelEn: 'Pin' },
                { key: 'lock' as const, labelZh: '锁定位置', labelEn: 'Lock' },
                { key: 'settings' as const, labelZh: '配置抽屉', labelEn: 'Settings' },
                { key: 'theme' as const, labelZh: '深浅模式', labelEn: 'Theme' },
                { key: 'close' as const, labelZh: '关闭挂件', labelEn: 'Close' },
              ].map((btn) => {
                const cur =
                  settings.appearance?.headerButtons?.[btn.key] ||
                  settings.appearance?.headerActionsMode ||
                  'hover';
                const nextMode: 'hover' | 'always' | 'hidden' =
                  cur === 'hover' ? 'always' : cur === 'always' ? 'hidden' : 'hover';
                return (
                  <button
                    key={btn.key}
                    type="button"
                    onClick={() => {
                      const updated = {
                        ...(settings.appearance?.headerButtons || { pin: 'hover', lock: 'hover', settings: 'hover', theme: 'hover', close: 'hover' }),
                        [btn.key]: nextMode,
                      };
                      updateAppearance({ headerButtons: updated });
                    }}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      cur === 'hidden'
                        ? 'bg-slate-100 dark:bg-slate-850 text-slate-400 border-dashed border-slate-300 dark:border-slate-700'
                        : cur === 'always'
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-400 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 font-semibold shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                    title={language === 'zh-CN' ? `点击切换 ${btn.labelZh} 显隐状态` : `Toggle ${btn.labelEn}`}
                  >
                    <div className="font-medium text-xs">{language === 'zh-CN' ? btn.labelZh : btn.labelEn}</div>
                    <div className="text-[10px] mt-0.5 opacity-75">
                      {cur === 'always'
                        ? (language === 'zh-CN' ? '常显' : 'Always')
                        : cur === 'hover'
                        ? (language === 'zh-CN' ? '悬停' : 'Hover')
                        : (language === 'zh-CN' ? '隐藏' : 'Hidden')}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 便捷操作偏好：双击折叠与位置锁定 */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            {/* 双击顶栏折叠 */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <MousePointerClick className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{language === 'zh-CN' ? '双击挂件顶栏折叠 / 展开' : 'Double-click Header to Collapse'}</span>
                </div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  {language === 'zh-CN'
                    ? '双击标题栏空白处瞬间收起为极窄顶栏，桌面视野零遮挡，再次双击展开'
                    : 'Double click header bar to collapse widget into a thin bar for maximum screen space'}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  updateAppearance({
                    collapseOnDoubleClick: !(settings.appearance?.collapseOnDoubleClick ?? true),
                  })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  (settings.appearance?.collapseOnDoubleClick ?? true)
                    ? 'bg-indigo-600'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    (settings.appearance?.collapseOnDoubleClick ?? true) ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 锁定挂件位置与尺寸 */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800/60">
              <div>
                <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span>{language === 'zh-CN' ? '锁定所有桌面挂件位置与尺寸 (防误触)' : 'Lock All Widgets (Prevent Dragging)'}</span>
                </div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  {language === 'zh-CN'
                    ? '一键全局锁定所有桌面挂件，防止误触拖拽；关闭后各挂件可由自身顶栏单独锁定'
                    : 'Globally lock all desktop widgets; when off, widgets can be locked individually'}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  updateAppearance({
                    lockLayout: !(settings.appearance?.lockLayout ?? false),
                  })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.appearance?.lockLayout ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    settings.appearance?.lockLayout ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 默认新建置顶 */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <div className="font-medium text-slate-800 dark:text-slate-200">
                {language === 'zh-CN' ? '默认始终置顶 (Always on Top)' : 'Default Always on Top'}
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                {language === 'zh-CN'
                  ? '新打开的挂件默认保持在所有软件窗口之上，方便随时对照与打勾'
                  : 'Keep widgets floating above other application windows by default'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setAlwaysOnTop(!settings.alwaysOnTop)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.alwaysOnTop ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  settings.alwaysOnTop ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* 4. 6款核心挂件运行状态卡片 */}
      <section className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex items-center justify-between text-sm font-semibold text-slate-800 dark:text-slate-200">
          <span>{language === 'zh-CN' ? '各挂件桌面运行状态' : 'Active Widget Status'}</span>
          <button
            type="button"
            onClick={() => tauriWidgetService.openDualDefaultWidgets()}
            className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'zh-CN' ? '一键打开收集与待办' : 'Launch Inbox & Tasks'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
          {(Object.keys(WIDGET_METAS) as WidgetGridId[]).map((id) => {
            const meta = WIDGET_METAS[id];
            const isVisible = activeWidgetIds.has(id);
            const title = language === 'zh-CN' ? meta.name : (meta.nameEn || meta.name);
            const description = language === 'zh-CN' ? meta.desc : (meta.descEn || meta.desc);

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
                  {isVisible ? (language === 'zh-CN' ? '已在桌面' : 'Active') : (language === 'zh-CN' ? '打开' : 'Open')}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
