import React from 'react';
import { Check, Lock, Maximize2, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { useWidgetStore } from '@/stores/widgetStore';
import { useI18n } from '@/core/i18n';
import {
  DEFAULT_HEADER_BUTTONS_CONFIG,
  type HeaderButtonDisplayMode,
  type WidgetGridId,
  type WidgetWindowStyle,
} from '../widgetTypes';
import { InboxWidgetPanel } from './panels/InboxWidgetPanel';
import { TasksWidgetPanel } from './panels/TasksWidgetPanel';
import { SessionWidgetPanel } from './panels/SessionWidgetPanel';
import { TimelineWidgetPanel } from './panels/TimelineWidgetPanel';
import { NotesWidgetPanel } from './panels/NotesWidgetPanel';

const WINDOW_STYLE_OPTIONS = [
  { id: 'glass', labelZh: '毛玻璃', labelEn: 'Glass' },
  { id: 'stealth', labelZh: '曜石黑', labelEn: 'OLED' },
  { id: 'paper', labelZh: '纸质暖', labelEn: 'Paper' },
  { id: 'floating', labelZh: '无界悬浮', labelEn: 'Floating' },
  { id: 'terminal', labelZh: '终端赛博', labelEn: 'Terminal' },
] as const;

const HEADER_BUTTON_KEYS = [
  { key: 'pin' as const, labelZh: '置顶', labelEn: 'Pin' },
  { key: 'lock' as const, labelZh: '锁位', labelEn: 'Lock' },
  { key: 'settings' as const, labelZh: '配置', labelEn: 'Settings' },
  { key: 'theme' as const, labelZh: '主题', labelEn: 'Theme' },
  { key: 'close' as const, labelZh: '关闭', labelEn: 'Close' },
];

const PER_GRID_PANELS: Partial<Record<WidgetGridId, React.FC>> = {
  inbox: InboxWidgetPanel,
  tasks: TasksWidgetPanel,
  session: SessionWidgetPanel,
  timeline: TimelineWidgetPanel,
  notes: NotesWidgetPanel,
};

interface WidgetSettingsPanelProps {
  gridId: WidgetGridId;
  localizedTitle: string;
  isLocked: boolean;
  onClose: () => void;
  onToggleLock: (e: React.MouseEvent) => void;
  onResetWindowSize: () => void;
}

/** 挂件内嵌配置抽屉：专属偏好 + 全局外观 + 半透明度 + 恢复默认。 */
export const WidgetSettingsPanel: React.FC<WidgetSettingsPanelProps> = ({
  gridId,
  localizedTitle,
  isLocked,
  onClose,
  onToggleLock,
  onResetWindowSize,
}) => {
  const { language } = useI18n();
  const isZh = language === 'zh-CN';
  const { settings, updateAppearance, setOpacity, resetToDefaults } = useWidgetStore();
  const appearance = settings.appearance;
  const headerButtons = appearance?.headerButtons || DEFAULT_HEADER_BUTTONS_CONFIG;

  const GridPanel = PER_GRID_PANELS[gridId];

  return (
    <div className="p-3.5 bg-slate-50/95 dark:bg-slate-850/95 border-b border-slate-200 dark:border-slate-800 text-xs space-y-3.5 shrink-0 max-h-[70vh] overflow-y-auto animate-in slide-in-from-top-2 duration-150">
      <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200 pb-1 border-b border-slate-200/60 dark:border-slate-700/60">
        <span className="flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
          <span>{isZh ? `${localizedTitle} 偏好定制` : `${localizedTitle} Settings`}</span>
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
        >
          <Check className="w-3 h-3" />
          <span>{isZh ? '完成' : 'Done'}</span>
        </button>
      </div>

      {GridPanel && <GridPanel />}

      {/* 通用外观与窗口质感风格 */}
      <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500 dark:text-slate-400">{isZh ? '窗口质感风格：' : 'Window Style:'}</span>
          <div className="flex items-center gap-1">
            {WINDOW_STYLE_OPTIONS.map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => updateAppearance({ windowStyle: style.id as WidgetWindowStyle })}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                  (appearance?.windowStyle || 'glass') === style.id
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                {isZh ? style.labelZh : style.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* 双击折叠与位置锁定快捷开关 */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => updateAppearance({ collapseOnDoubleClick: !appearance?.collapseOnDoubleClick })}
            className={`px-2 py-1 rounded text-[10px] font-medium border flex items-center justify-between transition-colors cursor-pointer ${
              appearance?.collapseOnDoubleClick
                ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
            }`}
          >
            <span>{isZh ? '双击顶栏折叠' : 'Double-click Collapse'}</span>
            <span>{appearance?.collapseOnDoubleClick ? '✓' : ''}</span>
          </button>

          <button
            type="button"
            onClick={onToggleLock}
            className={`px-2 py-1 rounded text-[10px] font-medium border flex items-center justify-between transition-colors cursor-pointer ${
              isLocked
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
            }`}
          >
            <span className="flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              <span>{isZh ? '锁定当前挂件' : 'Lock Layout'}</span>
            </span>
            <span>{isLocked ? '✓' : ''}</span>
          </button>
        </div>

        {/* 顶栏按钮显示策略与精细化独立配置 */}
        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">
              {isZh ? '按钮默认显示模式：' : 'Header Actions Mode:'}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => updateAppearance({ headerActionsMode: 'hover' })}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                  (appearance?.headerActionsMode || 'hover') === 'hover'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {isZh ? '静默沉浸 (悬停显现)' : 'Hover to Reveal'}
              </button>
              <button
                type="button"
                onClick={() => updateAppearance({ headerActionsMode: 'always' })}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                  appearance?.headerActionsMode === 'always'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {isZh ? '一直显示' : 'Always Show'}
              </button>
            </div>
          </div>

          {/* 各按钮独立配置细化行 */}
          <div className="grid grid-cols-5 gap-1 pt-1 text-[10px]">
            {HEADER_BUTTON_KEYS.map((btn) => {
              const cur = headerButtons[btn.key] || appearance?.headerActionsMode || 'hover';
              const nextMode: HeaderButtonDisplayMode =
                cur === 'hover' ? 'always' : cur === 'always' ? 'hidden' : 'hover';
              return (
                <button
                  key={btn.key}
                  type="button"
                  onClick={() => updateAppearance({ headerButtons: { ...headerButtons, [btn.key]: nextMode } })}
                  className={`p-1 rounded border text-center transition-colors cursor-pointer ${
                    cur === 'hidden'
                      ? 'bg-slate-100 dark:bg-slate-850 text-slate-400 border-dashed border-slate-300 dark:border-slate-700'
                      : cur === 'always'
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-semibold'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                  title={
                    isZh
                      ? `点击切换: ${btn.labelZh} (当前: ${cur === 'always' ? '常显' : cur === 'hover' ? '悬停' : '隐藏'})`
                      : `Toggle: ${btn.labelEn} (${cur})`
                  }
                >
                  <div className="font-medium">{isZh ? btn.labelZh : btn.labelEn}</div>
                  <div className="text-[9px] opacity-70">
                    {cur === 'always'
                      ? isZh
                        ? '常显'
                        : 'Always'
                      : cur === 'hover'
                        ? isZh
                          ? '悬停'
                          : 'Hover'
                        : isZh
                          ? '隐藏'
                          : 'Hidden'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] pt-1">
          <span className="text-slate-500 dark:text-slate-400">{isZh ? '全局字体大小：' : 'Font Size:'}</span>
          <div className="flex items-center gap-1">
            {(['small', 'normal', 'large'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => updateAppearance({ fontSizeLevel: lvl })}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                  (appearance?.fontSizeLevel || 'normal') === lvl
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {lvl === 'small'
                  ? isZh
                    ? '小号'
                    : 'Small'
                  : lvl === 'normal'
                    ? isZh
                      ? '标准'
                      : 'Standard'
                    : isZh
                      ? '大号'
                      : 'Large'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500 dark:text-slate-400">{isZh ? '操作按钮尺寸：' : 'Button Size:'}</span>
          <div className="flex items-center gap-1">
            {(['compact', 'standard', 'generous'] as const).map((btn) => (
              <button
                key={btn}
                type="button"
                onClick={() => updateAppearance({ buttonSize: btn })}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                  (appearance?.buttonSize || 'standard') === btn
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {btn === 'compact'
                  ? isZh
                    ? '紧凑'
                    : 'Compact'
                  : btn === 'standard'
                    ? isZh
                      ? '适中'
                      : 'Standard'
                    : isZh
                      ? '宽大'
                      : 'Generous'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 通用外观半透明度调节 */}
      <div className="space-y-1 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span>{isZh ? '卡片半透明度：' : 'Opacity:'}</span>
          <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
            {settings.opacityPercent}%
          </span>
        </div>
        <input
          type="range"
          min={40}
          max={100}
          value={settings.opacityPercent}
          onChange={(e) => setOpacity(Number(e.target.value))}
          className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
        />
      </div>

      {/* 恢复与重置按钮行 */}
      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
        <button
          type="button"
          onClick={onResetWindowSize}
          className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium"
          title={isZh ? '将挂件窗口恢复到最初标准黄金比例大小' : 'Reset widget window to default size'}
        >
          <Maximize2 className="w-3 h-3" />
          <span>{isZh ? '恢复标准窗口尺寸' : 'Reset Window Size'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            resetToDefaults();
            onResetWindowSize();
          }}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>{isZh ? '恢复出厂设置' : 'Reset to Defaults'}</span>
        </button>
      </div>
    </div>
  );
};
