import React from 'react';
import { Eye, MousePointerClick, Lock } from 'lucide-react';
import { useI18n } from '@/core/i18n';
import { useWidgetStore } from '@/stores/widgetStore';
import { WidgetToggle } from './WidgetSettingsControls';

type HeaderButtonMode = 'hover' | 'always' | 'hidden';

const HEADER_ACTION_BUTTONS = [
  { key: 'pin' as const, labelZh: '置顶按钮', labelEn: 'Pin' },
  { key: 'lock' as const, labelZh: '锁定位置', labelEn: 'Lock' },
  { key: 'settings' as const, labelZh: '配置抽屉', labelEn: 'Settings' },
  { key: 'theme' as const, labelZh: '深浅模式', labelEn: 'Theme' },
  { key: 'close' as const, labelZh: '关闭挂件', labelEn: 'Close' },
];

/** 顶栏按钮显隐策略、双击折叠、全局锁定、默认置顶。 */
export const WidgetBehaviorControls: React.FC = () => {
  const { language } = useI18n();
  const { settings, updateAppearance, setAlwaysOnTop } = useWidgetStore();

  const collapseOnDoubleClick = settings.appearance?.collapseOnDoubleClick ?? true;
  const lockLayout = settings.appearance?.lockLayout ?? false;

  return (
    <>
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
            {(
              [
                { id: 'hover' as const, label: language === 'zh-CN' ? '静默沉浸 (悬停淡入)' : 'Hover to Reveal' },
                { id: 'always' as const, label: language === 'zh-CN' ? '一直显示' : 'Always Show' },
              ]
            ).map((opt) => {
              const isActive = (settings.appearance?.headerActionsMode || 'hover') === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateAppearance({ headerActionsMode: opt.id })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 各按钮独立配置 */}
        <div className="grid grid-cols-5 gap-2 pt-1">
          {HEADER_ACTION_BUTTONS.map((btn) => {
            const cur: HeaderButtonMode =
              settings.appearance?.headerButtons?.[btn.key] ||
              settings.appearance?.headerActionsMode ||
              'hover';
            const nextMode: HeaderButtonMode = cur === 'hover' ? 'always' : cur === 'always' ? 'hidden' : 'hover';
            return (
              <button
                key={btn.key}
                type="button"
                onClick={() => {
                  const updated = {
                    ...(settings.appearance?.headerButtons || {
                      pin: 'hover',
                      lock: 'hover',
                      settings: 'hover',
                      theme: 'hover',
                      close: 'hover',
                    }),
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

          <WidgetToggle
            checked={collapseOnDoubleClick}
            onToggle={() =>
              updateAppearance({
                collapseOnDoubleClick: !collapseOnDoubleClick,
              })
            }
          />
        </div>

        {/* 锁定挂件位置与尺寸 */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800/60">
          <div>
            <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {language === 'zh-CN' ? '锁定所有桌面挂件位置与尺寸 (防误触)' : 'Lock All Widgets (Prevent Dragging)'}
              </span>
            </div>
            <div className="text-slate-400 text-[11px] mt-0.5">
              {language === 'zh-CN'
                ? '一键全局锁定所有桌面挂件，防止误触拖拽；关闭后各挂件可由自身顶栏单独锁定'
                : 'Globally lock all desktop widgets; when off, widgets can be locked individually'}
            </div>
          </div>

          <WidgetToggle
            checked={lockLayout}
            accentClass="bg-amber-500"
            onToggle={() =>
              updateAppearance({
                lockLayout: !lockLayout,
              })
            }
          />
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

        <WidgetToggle checked={settings.alwaysOnTop} onToggle={() => setAlwaysOnTop(!settings.alwaysOnTop)} />
      </div>
    </>
  );
};
