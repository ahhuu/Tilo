import React from 'react';
import { NavLink } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { TiloLogo } from '@/components/ui/TiloLogo';
import { Tooltip, TooltipProvider } from '@/components/ui/Tooltip';
import { useProjects, useInboxItems } from '@/storage/hooks/useLiveQuery';
import {
  CheckCircle2,
  Inbox,
  Calendar,
  Target,
  BarChart3,
  BookOpen,
  Settings,
  PanelLeftClose,
  Pin,
  FolderDot,
  ListTodo,
  FolderKanban,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { t, language } = useI18n();
  const projects = useProjects();
  const unsortedItems = useInboxItems('unsorted');

  const unsortedCount = unsortedItems?.length ?? 0;
  const pinnedProjects = projects?.filter((p) => p.isPinned) || [];

  const mainNav = [
    { to: '/today', label: t('nav.today'), icon: CheckCircle2 },
    { to: '/calendar', label: t('nav.calendar'), icon: Calendar },
    {
      to: '/inbox',
      label: t('nav.inbox'),
      icon: Inbox,
      badge: unsortedCount > 0 ? unsortedCount : null,
    },
    { to: '/tasks', label: t('nav.tasks'), icon: ListTodo },
    { to: '/projects', label: t('nav.projects'), icon: FolderKanban },
    { to: '/goals', label: t('nav.goals'), icon: Target },
  ];

  const insightsNav = [
    { to: '/analytics', label: t('nav.analytics'), icon: BarChart3 },
    { to: '/review', label: t('nav.review'), icon: BookOpen },
  ];

  const renderNavItem = (
    to: string,
    label: string,
    Icon: React.ComponentType<{ className?: string }>,
    badge?: React.ReactNode
  ) => {
    const linkContent = (
      <NavLink
        to={to}
        className={({ isActive }) =>
          cn(
            'flex items-center rounded-lg text-sm font-medium transition-colors select-none group',
            sidebarCollapsed ? 'justify-center p-2' : 'gap-2.5 px-2.5 py-1.5',
            isActive
              ? 'bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
          )
        }
      >
        <Icon className="w-4 h-4 shrink-0" />
        {!sidebarCollapsed && (
          <span className="truncate flex-1 text-left">{label}</span>
        )}
        {!sidebarCollapsed && badge && (
          <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full shrink-0">
            {badge}
          </span>
        )}
        {sidebarCollapsed && badge && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-600 rounded-full" />
        )}
      </NavLink>
    );

    if (sidebarCollapsed) {
      return (
        <Tooltip key={to} side="right" content={label}>
          <div className="relative flex justify-center">{linkContent}</div>
        </Tooltip>
      );
    }

    return <div key={to}>{linkContent}</div>;
  };

  const displayPinnedProjects = pinnedProjects.slice(0, 10);

  return (
    <TooltipProvider>
      <aside
        aria-label="Sidebar Navigation"
        className={cn(
          'hidden md:flex flex-col border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 h-full select-none transition-all duration-200 z-30 shrink-0',
          sidebarCollapsed ? 'w-14' : 'w-56'
        )}
      >
        {/* Sidebar Header */}
        <div className="border-b border-slate-100 dark:border-slate-800/80 h-13 flex items-center">
          {sidebarCollapsed ? (
            <Tooltip side="right" content={language === 'zh-CN' ? '展开侧边栏 ( [ )' : 'Expand sidebar ( [ )'}>
              <button
                type="button"
                onClick={toggleSidebar}
                className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
              >
                <TiloLogo size={24} className="group-hover:scale-105 transition-transform shrink-0" />
              </button>
            </Tooltip>
          ) : (
            <div className="flex items-center justify-between p-3 w-full">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <TiloLogo size={24} className="shrink-0" />
                <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-slate-100 truncate">
                  Tilo
                </span>
              </div>
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={language === 'zh-CN' ? '收起侧边栏 ( [ )' : 'Collapse sidebar ( [ )'}
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {/* Main sections */}
          <nav className="space-y-0.5" aria-label="Main Navigation">
            {mainNav.map((item) =>
              renderNavItem(item.to, item.label, item.icon, item.badge)
            )}
          </nav>

          {/* Pinned Projects Section (Max 10 with internal scroll) */}
          {displayPinnedProjects.length > 0 && (
            <div>
              {!sidebarCollapsed ? (
                <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <span>{language === 'zh-CN' ? '固定项目' : 'PINNED'}</span>
                  <Pin className="w-3 h-3 text-slate-400" />
                </div>
              ) : (
                <div className="w-full h-px bg-slate-200 dark:bg-slate-800 my-2" />
              )}
              <div className={cn(
                'space-y-0.5 mt-0.5',
                !sidebarCollapsed && 'max-h-48 overflow-y-auto overflow-x-hidden pr-0.5 scrollbar-thin'
              )}>
                {displayPinnedProjects.map((p) => {
                  const projectLink = (
                    <NavLink
                      key={p.id}
                      to={`/projects/${p.id}`}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center rounded-lg text-sm transition-colors select-none',
                          sidebarCollapsed ? 'justify-center p-2' : 'gap-2.5 px-2.5 py-1.5',
                          isActive
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                        )
                      }
                    >
                      <FolderDot
                        className="w-3.5 h-3.5 shrink-0"
                        style={{ color: p.color }}
                      />
                      {!sidebarCollapsed && (
                        <span className="truncate text-xs">{p.name}</span>
                      )}
                    </NavLink>
                  );

                  return sidebarCollapsed ? (
                    <Tooltip key={p.id} side="right" content={p.name}>
                      <div className="flex justify-center">{projectLink}</div>
                    </Tooltip>
                  ) : (
                    projectLink
                  );
                })}
              </div>
            </div>
          )}

          {/* Insights Section */}
          <div>
            {!sidebarCollapsed ? (
              <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <span>{language === 'zh-CN' ? '分析与复盘' : 'INSIGHTS'}</span>
              </div>
            ) : (
              <div className="w-full h-px bg-slate-200 dark:bg-slate-800 my-2" />
            )}
            <nav className="space-y-0.5 mt-0.5" aria-label="Insights Navigation">
              {insightsNav.map((item) =>
                renderNavItem(item.to, item.label, item.icon)
              )}
            </nav>
          </div>
        </div>

        {/* Footer with Settings */}
        <div className="p-2 border-t border-slate-100 dark:border-slate-800/80">
          {renderNavItem('/settings', t('nav.settings'), Settings)}
        </div>
      </aside>
    </TooltipProvider>
  );
};
