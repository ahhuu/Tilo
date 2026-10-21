import React from 'react';
import { useWidgetStore } from '@/stores/widgetStore';
import { PanelRow, Pill } from './PanelBits';

const PAPER_THEMES = [
  { id: 'classic', label: '经典' },
  { id: 'yellow', label: '暖黄' },
  { id: 'mint', label: '薄荷' },
  { id: 'dark', label: '暗黑' },
] as const;

/** 随手便签挂件的专属深度配置。 */
export const NotesWidgetPanel: React.FC = () => {
  const { settings, updateGridSettings } = useWidgetStore();
  const conf = settings.gridSettings.notes;

  return (
    <div className="space-y-2.5">
      <PanelRow label="便笺纸张主题：">
        {PAPER_THEMES.map((th) => (
          <Pill
            key={th.id}
            active={conf.paperTheme === th.id}
            onClick={() => updateGridSettings('notes', { paperTheme: th.id })}
          >
            {th.label}
          </Pill>
        ))}
      </PanelRow>

      <PanelRow label="排版字体族：">
        <Pill
          active={conf.fontFamily === 'sans'}
          onClick={() => updateGridSettings('notes', { fontFamily: 'sans' })}
          className="font-sans"
        >
          现代无衬线
        </Pill>
        <Pill
          active={conf.fontFamily === 'mono'}
          onClick={() => updateGridSettings('notes', { fontFamily: 'mono' })}
          className="font-mono"
        >
          等宽代码
        </Pill>
      </PanelRow>

      <PanelRow label="便签字号大小：">
        {(['sm', 'base', 'lg'] as const).map((sz) => (
          <Pill key={sz} active={conf.fontSize === sz} onClick={() => updateGridSettings('notes', { fontSize: sz })}>
            {sz === 'sm' ? '小号' : sz === 'base' ? '中号' : '大号'}
          </Pill>
        ))}
      </PanelRow>
    </div>
  );
};
