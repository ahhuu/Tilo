import React from 'react';
import { useUIStore, type ThemeMode, type DensityMode } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { Card } from '@/components/ui/Card';
import { Sun, Moon, Laptop, Maximize2, Minimize2, Languages } from 'lucide-react';

export const AppearanceSection: React.FC = () => {
  const { theme, setTheme, density, setDensity } = useUIStore();
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="space-y-6">
      {/* Language Section */}
      <Card className="p-5 space-y-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Languages className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{t('settings.language')}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            选择 Tilo 的用户界面语言（默认简体中文）。
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { id: 'zh-CN', label: '简体中文', desc: 'Simplified Chinese (默认)' },
              { id: 'en-US', label: 'English (US)', desc: 'English interface' },
            ] as const
          ).map((item) => {
            const isSelected = language === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setLanguage(item.id)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-semibold ${
                      isSelected
                        ? 'text-indigo-700 dark:text-indigo-300'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">{item.desc}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Theme Section */}
      <Card className="p-5 space-y-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {language === 'zh-CN' ? '界面主题' : 'Interface Theme'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'zh-CN'
              ? '选择您喜欢的颜色主题，或自动与您的操作系统保持同步。'
              : 'Select your preferred color theme or synchronize automatically with your operating system.'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {(
            [
              { id: 'light', label: language === 'zh-CN' ? '浅色' : 'Light', icon: Sun },
              { id: 'dark', label: language === 'zh-CN' ? '深色' : 'Dark', icon: Moon },
              { id: 'system', label: language === 'zh-CN' ? '跟随系统' : 'System', icon: Laptop },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const isSelected = theme === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTheme(item.id as ThemeMode)}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4 mb-1.5" />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Density Section */}
      <Card className="p-5 space-y-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {language === 'zh-CN' ? '排版紧凑度' : 'Layout Density'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'zh-CN'
              ? '控制列表、网格与区块的间距与信息密度。'
              : 'Control spacing, row height, and information density across grids and lists.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(
            [
              {
                id: 'comfortable',
                label: language === 'zh-CN' ? '舒适' : 'Comfortable',
                desc: language === 'zh-CN' ? '标准间距与呼吸感' : 'Standard spacing & room to breathe',
                icon: Maximize2,
              },
              {
                id: 'compact',
                label: language === 'zh-CN' ? '紧凑' : 'Compact',
                desc: language === 'zh-CN' ? '更高信息密度与紧凑行高' : 'High information density & tighter rows',
                icon: Minimize2,
              },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const isSelected = density === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setDensity(item.id as DensityMode)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon
                    className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}
                  />
                  <span
                    className={`text-xs font-semibold ${
                      isSelected
                        ? 'text-indigo-700 dark:text-indigo-300'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">{item.desc}</p>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
