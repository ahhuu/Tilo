import React, { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import {
  Inbox,
  ListTodo,
  Timer,
  CalendarClock,
  StickyNote,
  Target,
} from 'lucide-react';
import { StandaloneWidgetShell } from '@/components/widget/StandaloneWidgetShell';
import { InboxGrid } from '@/components/widget/grids/InboxGrid';
import { TasksGrid } from '@/components/widget/grids/TasksGrid';
import { SessionGrid } from '@/components/widget/grids/SessionGrid';
import { TimelineGrid } from '@/components/widget/grids/TimelineGrid';
import { NotesGrid } from '@/components/widget/grids/NotesGrid';
import { GoalsGrid } from '@/components/widget/grids/GoalsGrid';
import { useI18n } from '@/core/i18n';
import { useUIStore } from '@/stores/uiStore';
import type { WidgetGridId } from '@/components/widget/widgetTypes';

interface GridMetaInfo {
  id: WidgetGridId;
  titleZh: string;
  titleEn: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ReactNode;
}

const WIDGET_REGISTRY: Record<string, GridMetaInfo> = {
  inbox: {
    id: 'inbox',
    titleZh: '闪念收集',
    titleEn: 'Inbox',
    icon: Inbox,
    component: <InboxGrid />,
  },
  tasks: {
    id: 'tasks',
    titleZh: '今日待办',
    titleEn: 'Tasks',
    icon: ListTodo,
    component: <TasksGrid />,
  },
  session: {
    id: 'session',
    titleZh: '专注计时',
    titleEn: 'Focus Timer',
    icon: Timer,
    component: <SessionGrid />,
  },
  timeline: {
    id: 'timeline',
    titleZh: '今日日程',
    titleEn: 'Timeline',
    icon: CalendarClock,
    component: <TimelineGrid />,
  },
  notes: {
    id: 'notes',
    titleZh: '随手便签',
    titleEn: 'Notes',
    icon: StickyNote,
    component: <NotesGrid />,
  },
  goals: {
    id: 'goals',
    titleZh: '目标看板',
    titleEn: 'Goals Board',
    icon: Target,
    component: <GoalsGrid />,
  },
};

export const SingleWidgetPage: React.FC = () => {
  const { gridId } = useParams<{ gridId: string }>();
  const { theme } = useUIStore();
  const { language } = useI18n();
  const isZh = language === 'zh-CN';

  useEffect(() => {
    document.body.classList.remove('bg-surface-app');
    document.body.style.setProperty('background-color', 'transparent', 'important');
    document.documentElement.style.setProperty('background-color', 'transparent', 'important');
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.style.setProperty('background-color', 'transparent', 'important');
    }

    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  const target = gridId ? WIDGET_REGISTRY[gridId] : null;

  if (!target) {
    return <Navigate to="/widget/tasks" replace />;
  }

  const title = isZh ? target.titleZh : target.titleEn;

  return (
    <StandaloneWidgetShell
      gridId={target.id}
      title={title}
      icon={target.icon}
    >
      {target.component}
    </StandaloneWidgetShell>
  );
};

export default SingleWidgetPage;
