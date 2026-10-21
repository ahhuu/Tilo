import React from 'react';
import { useWidgetStore } from '@/stores/widgetStore';
import { PanelRow, Pill } from './PanelBits';

/** 闪念收集挂件的专属深度配置。 */
export const InboxWidgetPanel: React.FC = () => {
  const { settings, updateGridSettings } = useWidgetStore();
  const conf = settings.gridSettings.inbox;

  return (
    <div className="space-y-2.5">
      <PanelRow label="默认初始标签：">
        {(['unsorted', 'idea', 'all'] as const).map((tab) => (
          <Pill key={tab} active={conf.defaultTab === tab} onClick={() => updateGridSettings('inbox', { defaultTab: tab })}>
            {tab === 'unsorted' ? '未整理' : tab === 'idea' ? '灵感' : '全部'}
          </Pill>
        ))}
      </PanelRow>

      <PanelRow label="一键推入目标：">
        <Pill
          active={conf.quickActionTarget === 'todayFocus'}
          onClick={() => updateGridSettings('inbox', { quickActionTarget: 'todayFocus' })}
        >
          今日聚焦
        </Pill>
        <Pill
          active={conf.quickActionTarget === 'inbox'}
          onClick={() => updateGridSettings('inbox', { quickActionTarget: 'inbox' })}
        >
          普通待办
        </Pill>
      </PanelRow>

      <PanelRow label="列表布局密度：">
        <Pill
          active={conf.displayDensity === 'comfortable'}
          onClick={() => updateGridSettings('inbox', { displayDensity: 'comfortable' })}
        >
          舒适卡片
        </Pill>
        <Pill
          active={conf.displayDensity === 'compact'}
          onClick={() => updateGridSettings('inbox', { displayDensity: 'compact' })}
        >
          紧凑单行
        </Pill>
      </PanelRow>
    </div>
  );
};
