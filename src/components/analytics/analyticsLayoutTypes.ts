export type AnalyticsWidgetId =
  | 'headline'
  | 'planningAccuracy'
  | 'unplannedAndCapacity'
  | 'dailyChart'
  | 'timeAllocation'
  | 'estimateAccuracy'
  | 'rescheduling';

export interface AnalyticsLayoutConfig {
  visibleWidgets: Record<AnalyticsWidgetId, boolean>;
}

export const DEFAULT_ANALYTICS_LAYOUT_CONFIG: AnalyticsLayoutConfig = {
  visibleWidgets: {
    headline: true,
    planningAccuracy: true,
    unplannedAndCapacity: true,
    dailyChart: true,
    timeAllocation: true,
    estimateAccuracy: true,
    rescheduling: true,
  },
};
