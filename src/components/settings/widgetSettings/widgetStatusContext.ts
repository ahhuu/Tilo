import { createContext, useContext } from 'react';
import type React from 'react';
import type { WidgetGridId } from '@/components/widget/widgetTypes';

export interface WidgetStatusValue {
  isAutoStart: boolean;
  setIsAutoStart: React.Dispatch<React.SetStateAction<boolean>>;
  isAutoLaunchWidgets: boolean;
  setIsAutoLaunchWidgets: React.Dispatch<React.SetStateAction<boolean>>;
  activeWidgetIds: Set<WidgetGridId>;
  refreshStatus: () => Promise<void>;
}

export const WidgetStatusContext = createContext<WidgetStatusValue | null>(null);

export const useWidgetStatus = (): WidgetStatusValue => {
  const ctx = useContext(WidgetStatusContext);
  if (!ctx) {
    throw new Error('useWidgetStatus must be used inside <WidgetStatusProvider>');
  }
  return ctx;
};
