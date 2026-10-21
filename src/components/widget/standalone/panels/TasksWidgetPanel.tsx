import React from 'react';
import { useWidgetStore } from '@/stores/widgetStore';
import { useI18n } from '@/core/i18n';
import { PanelRow, Pill, TogglePill } from './PanelBits';

/** 今日待办挂件的专属深度配置。 */
export const TasksWidgetPanel: React.FC = () => {
  const { language } = useI18n();
  const isZh = language === 'zh-CN';
  const { settings, updateGridSettings } = useWidgetStore();
  const conf = settings.gridSettings.tasks;
  const toggleLabel = (on: boolean) => (on ? '开启' : '关闭');

  return (
    <div className="space-y-2.5">
      <PanelRow label="默认展示视图：">
        {(['focus', 'today', 'all'] as const).map((filter) => (
          <Pill
            key={filter}
            active={conf.defaultFilter === filter}
            onClick={() => updateGridSettings('tasks', { defaultFilter: filter })}
          >
            {filter === 'focus' ? '聚焦' : filter === 'today' ? '今日' : '全部'}
          </Pill>
        ))}
      </PanelRow>

      <PanelRow label="排序偏好：">
        {(['priority', 'time'] as const).map((s) => (
          <Pill key={s} active={conf.sortBy === s} onClick={() => updateGridSettings('tasks', { sortBy: s })}>
            {s === 'priority' ? (isZh ? '优先级优先' : 'Priority') : isZh ? '创建时间' : 'Created Time'}
          </Pill>
        ))}
      </PanelRow>

      <PanelRow label={isZh ? '展示已完成任务：' : 'Show Completed:'}>
        <TogglePill
          on={conf.showCompleted}
          label={toggleLabel(conf.showCompleted)}
          onClick={() => updateGridSettings('tasks', { showCompleted: !conf.showCompleted })}
        />
      </PanelRow>

      <PanelRow label="显示优先级色彩指示：">
        <TogglePill
          on={conf.showPriorityDots}
          label={toggleLabel(conf.showPriorityDots)}
          onClick={() => updateGridSettings('tasks', { showPriorityDots: !conf.showPriorityDots })}
        />
      </PanelRow>
    </div>
  );
};
