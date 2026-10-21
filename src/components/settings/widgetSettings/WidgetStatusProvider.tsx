import React, { useCallback, useEffect, useState } from 'react';
import { tauriWidgetService } from '@/services/tauriWidgetService';
import type { WidgetGridId } from '@/components/widget/widgetTypes';
import { WidgetStatusContext } from './widgetStatusContext';

/**
 * 桌面挂件运行状态的单一来源。
 * 挂载时读取一次系统状态，供「开机策略 / 对齐 / 挂件列表」三个区域共享，
 * 避免每个区域各自 invoke 一次 IPC。
 */
export const WidgetStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAutoStart, setIsAutoStart] = useState(false);
  const [isAutoLaunchWidgets, setIsAutoLaunchWidgets] = useState(false);
  const [activeWidgetIds, setActiveWidgetIds] = useState<Set<WidgetGridId>>(new Set());

  const refreshStatus = useCallback(async () => {
    const auto = await tauriWidgetService.isAutoStartEnabled();
    setIsAutoStart(auto);
    setIsAutoLaunchWidgets(tauriWidgetService.isAutoLaunchWidgetsOnStartup());

    const activeList = await tauriWidgetService.getVisibleWidgetIds();
    setActiveWidgetIds(new Set(activeList));
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  return (
    <WidgetStatusContext.Provider
      value={{
        isAutoStart,
        setIsAutoStart,
        isAutoLaunchWidgets,
        setIsAutoLaunchWidgets,
        activeWidgetIds,
        refreshStatus,
      }}
    >
      {children}
    </WidgetStatusContext.Provider>
  );
};
