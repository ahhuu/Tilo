import React from 'react';
import { Sliders, RotateCcw } from 'lucide-react';
import { useI18n } from '@/core/i18n';
import { useUIStore } from '@/stores/uiStore';
import { useWidgetStore } from '@/stores/widgetStore';
import { SettingsCard, SettingsCardTitle, WidgetSegmented } from './WidgetSettingsControls';
import { WidgetBehaviorControls } from './WidgetBehaviorControls';

/** 挂件全局外观：窗口质感、半透明度、字号、字体族、按钮尺寸。 */
const AppearanceControls: React.FC = () => {
  const { language } = useI18n();
  const { settings, updateAppearance, setOpacity } = useWidgetStore();

  return (
    <>
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
            {
              id: 'glass' as const,
              labelZh: '现代毛玻璃',
              labelEn: 'Glass',
              descZh: '高斯透射柔光',
              descEn: 'Frosted translucency',
            },
            {
              id: 'stealth' as const,
              labelZh: '曜石纯黑',
              labelEn: 'Stealth OLED',
              descZh: '深邃高对比',
              descEn: 'Deep high contrast',
            },
            {
              id: 'paper' as const,
              labelZh: '极简纸质',
              labelEn: 'Paper Warm',
              descZh: '暖调哑光触感',
              descEn: 'Warm matte texture',
            },
            {
              id: 'floating' as const,
              labelZh: '一体化悬浮',
              labelEn: 'Seamless',
              descZh: '取消顶栏底线',
              descEn: 'No header divider',
            },
            {
              id: 'terminal' as const,
              labelZh: '复古终端',
              labelEn: 'Terminal',
              descZh: '黑客绿等宽',
              descEn: 'Phosphor mono',
            },
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
                <div
                  className={`text-xs ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {language === 'zh-CN' ? style.labelZh : style.labelEn}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {language === 'zh-CN' ? style.descZh : style.descEn}
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
          aria-label={language === 'zh-CN' ? '挂件默认毛玻璃半透明度' : 'Default acrylic opacity'}
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
        <WidgetSegmented
          value={settings.appearance?.fontSizeLevel || 'normal'}
          onChange={(lvl) => updateAppearance({ fontSizeLevel: lvl })}
          options={[
            { id: 'small' as const, label: language === 'zh-CN' ? '小号 (84%)' : 'Small (84%)' },
            { id: 'normal' as const, label: language === 'zh-CN' ? '标准 (100%)' : 'Standard (100%)' },
            { id: 'large' as const, label: language === 'zh-CN' ? '大号 (122%)' : 'Large (122%)' },
          ]}
        />
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
        <WidgetSegmented
          value={settings.appearance?.fontFamily || 'system'}
          onChange={(family) => updateAppearance({ fontFamily: family })}
          options={[
            { id: 'system' as const, label: language === 'zh-CN' ? '系统' : 'System' },
            { id: 'sans' as const, label: language === 'zh-CN' ? '无衬线' : 'Sans' },
            { id: 'mono' as const, label: language === 'zh-CN' ? '等宽代码' : 'Mono' },
            { id: 'serif' as const, label: language === 'zh-CN' ? '衬线' : 'Serif' },
          ]}
        />
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
        <WidgetSegmented
          value={settings.appearance?.buttonSize || 'standard'}
          onChange={(btn) => updateAppearance({ buttonSize: btn })}
          options={[
            { id: 'compact' as const, label: language === 'zh-CN' ? '紧凑小巧' : 'Compact' },
            { id: 'standard' as const, label: language === 'zh-CN' ? '标准尺寸' : 'Standard' },
            { id: 'generous' as const, label: language === 'zh-CN' ? '宽大易点' : 'Generous' },
          ]}
        />
      </div>
    </>
  );
};

export const AppearanceSection: React.FC = () => {
  const { language } = useI18n();
  const { addToast } = useUIStore();
  const { resetToDefaults } = useWidgetStore();

  const handleResetAppearanceDefaults = () => {
    resetToDefaults();
    addToast({
      message: language === 'zh-CN' ? '已恢复挂件全局外观与通用偏好至出厂默认' : 'Reset widget appearance to defaults',
      type: 'success',
    });
  };

  return (
    <SettingsCard>
      <SettingsCardTitle
        icon={<Sliders className="w-4 h-4 text-amber-500" />}
        title={language === 'zh-CN' ? '挂件全局外观与通用偏好' : 'Global Widget Appearance'}
        action={
          <button
            type="button"
            onClick={handleResetAppearanceDefaults}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-slate-700/80 transition-colors cursor-pointer"
            title={
              language === 'zh-CN'
                ? '将透明度、字号、字体风格、按钮规格与圆角恢复为初始默认值'
                : 'Reset opacity, font size, font family, button size and corners to default'
            }
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'zh-CN' ? '恢复默认' : 'Reset to Defaults'}</span>
          </button>
        }
      />

      <div className="space-y-4 text-xs">
        <AppearanceControls />
        <WidgetBehaviorControls />
      </div>
    </SettingsCard>
  );
};
