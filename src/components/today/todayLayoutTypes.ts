export interface TodayLayoutConfig {
  showWeeklyFocus: boolean;
  showFocusTasks: boolean;
  showNextUp: boolean;
  showTimeline: boolean;
  showUnscheduled: boolean;
  showContextLine: boolean;
  focusCountLimit: number; // 1-5
  splitRatio: '50/50' | '60/40' | '40/60';
}

export const DEFAULT_TODAY_LAYOUT_CONFIG: TodayLayoutConfig = {
  showWeeklyFocus: true,
  showFocusTasks: true,
  showNextUp: true,
  showTimeline: true,
  showUnscheduled: true,
  showContextLine: true,
  focusCountLimit: 3,
  splitRatio: '50/50',
};
