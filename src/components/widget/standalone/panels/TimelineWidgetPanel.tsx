import React from 'react';
import { useWidgetStore } from '@/stores/widgetStore';
import { PanelRow, Pill, TogglePill } from './PanelBits';

/** 今日日程挂件的专属深度配置。 */
export const TimelineWidgetPanel: React.FC = () => {
  const { settings, updateGridSettings } = useWidgetStore();
  const conf = settings.gridSettings.timeline;

  return (
    <div className="space-y-2.5">
      <PanelRow label="显示时间跨度：">
        {(['upcoming', 'allDay'] as const).map((scope) => (
          <Pill
            key={scope}
            active={conf.scope === scope}
            onClick={() => updateGridSettings('timeline', { scope })}
          >
            {scope === 'upcoming' ? '仅接下来' : '全天'}
          </Pill>
        ))}
      </PanelRow>

      <PanelRow label="进行中日程脉冲动态高亮：">
        <TogglePill
          on={conf.showNextUpPulse}
          label={conf.showNextUpPulse ? '开启' : '关闭'}
          onClick={() => updateGridSettings('timeline', { showNextUpPulse: !conf.showNextUpPulse })}
        />
      </PanelRow>
    </div>
  );
};
