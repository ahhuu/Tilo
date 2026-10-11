import React from 'react';
import { useLocation } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { Button } from '@/components/ui/Button';
import { Kbd } from '@/components/ui/Kbd';
import {
  Search,
  Plus,
  Inbox,
  Download,
  Sun,
  Moon,
  Laptop,
  Languages,
  SlidersHorizontal,
  Minimize2,
  Maximize2,
  LayoutGrid,
} from 'lucide-react';
import { pwaService } from '@/services/pwaService';
import { WidgetLauncherPopover } from '@/components/widget/WidgetLauncherPopover';

export const Header: React.FC = () => {
  const location = useLocation();
  const { t, language, setLanguage } = useI18n();
  const [canInstallPWA, setCanInstallPWA] = React.useState(false);
  const [isWidgetPopoverOpen, setIsWidgetPopoverOpen] = React.useState(false);

  React.useEffect(() => {
    return pwaService.subscribe((installable) => {
      setCanInstallPWA(installable);
    });
  }, []);

  const handleInstallClick = async () => {
    await pwaService.promptInstall();
  };

  const {
    openCommandMenu,
    openInstantCapture,
    openQuickTaskHUD,
    theme,
    setTheme,
    density,
    setDensity,
    inspectorOpen,
    closeInspector,
    openInspector,
  } = useUIStore();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/today') || path === '/') return t('nav.today');
    if (path.startsWith('/inbox')) return t('nav.inbox');
    if (path.startsWith('/calendar')) return t('nav.calendar');
    if (path.startsWith('/goals')) return t('nav.goals');
    if (path.startsWith('/analytics')) return t('nav.analytics');
    if (path.startsWith('/review')) return t('nav.review');
    if (path.startsWith('/settings')) return t('nav.settings');
    if (path.startsWith('/projects')) return t('nav.projects');
    return 'Tilo';
  };

  const handleToggleInspector = () => {
    if (inspectorOpen) {
      closeInspector();
    } else {
      openInspector({ type: 'task', id: 'sample', title: 'Inspector Preview' });
    }
  };

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const toggleDensity = () => {
    setDensity(density === 'comfortable' ? 'compact' : 'comfortable');
  };

  return (
    <header className="h-[calc(3.25rem+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-4 select-none shrink-0 z-20">
      {/* Left Title / Context line */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {getPageTitle()}
        </h1>
      </div>

      {/* Center Search trigger (Desktop) */}
      <div className="hidden md:block flex-1 max-w-sm">
        <button
          type="button"
          onClick={openCommandMenu}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-xs text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shadow-2xs cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            <span>{t('search.placeholder')}</span>
          </div>
          <Kbd>Ctrl K</Kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Mobile Search button (Small screen only) */}
        <button
          type="button"
          onClick={openCommandMenu}
          className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title={t('search.placeholder')}
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Instant Raw Inbox Capture (Desktop only) */}
        <button
          type="button"
          onClick={openInstantCapture}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200/80 dark:border-slate-800 shadow-2xs"
          title={language === 'zh-CN' ? '闪念快速收集 (Shift + Space)' : 'Instant Raw Inbox Capture (Shift + Space)'}
        >
          <Inbox className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>{language === 'zh-CN' ? '闪念收集' : 'Capture'}</span>
        </button>

        {/* Natural Language New Task Button (Desktop only) */}
        <Button
          size="sm"
          variant="primary"
          onClick={() => openQuickTaskHUD()}
          className="hidden md:flex h-8 gap-1.5 text-xs font-medium cursor-pointer"
          title={language === 'zh-CN' ? '任务速记 HUD (按 C 键唤出)' : 'Quick Task Capture (Press C)'}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{language === 'zh-CN' ? '任务速记' : 'Quick Task'}</span>
        </Button>

        {/* PWA Install Desktop App Button */}
        {canInstallPWA && (
          <button
            type="button"
            onClick={handleInstallClick}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer shadow-2xs animate-in fade-in"
            title={language === 'zh-CN' ? '安装 Tilo 为桌面独立客户端应用' : 'Install Tilo as Standalone Desktop App'}
          >
            <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{language === 'zh-CN' ? '安装客户端' : 'Install App'}</span>
          </button>
        )}

        {/* Desktop Native Widget Launcher & Popover Manager (Desktop only) */}
        <div className="hidden md:block relative">
          <button
            type="button"
            onClick={() => setIsWidgetPopoverOpen(!isWidgetPopoverOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border shadow-2xs ${
              isWidgetPopoverOpen
                ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-800'
            }`}
            title={
              language === 'zh-CN'
                ? '管理桌面快捷挂件 (独立小窗、自由拖拽拉伸)'
                : 'Manage Desktop Widgets'
            }
          >
            <LayoutGrid className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{language === 'zh-CN' ? '桌面挂件' : 'Widget'}</span>
          </button>

          <WidgetLauncherPopover
            isOpen={isWidgetPopoverOpen}
            onClose={() => setIsWidgetPopoverOpen(false)}
          />
        </div>

        <div className="hidden sm:block w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Language switcher */}
        <button
          type="button"
          onClick={() => setLanguage(language === 'zh-CN' ? 'en-US' : 'zh-CN')}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200/80 dark:border-slate-800 shadow-2xs"
          title={language === 'zh-CN' ? '当前语言: 简体中文 (点击切换为 English)' : 'Current: English (Click to switch to 简体中文)'}
        >
          <Languages className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>{language === 'zh-CN' ? '中' : 'EN'}</span>
        </button>

        {/* Theme switcher */}
        <button
          type="button"
          onClick={cycleTheme}
          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title={
            language === 'zh-CN'
              ? `当前主题: ${theme === 'dark' ? '深色' : theme === 'light' ? '浅色' : '跟随系统'} (点击切换)`
              : `Current theme: ${theme}. Click to switch.`
          }
        >
          {theme === 'dark' ? (
            <Moon className="w-4 h-4" />
          ) : theme === 'light' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Laptop className="w-4 h-4" />
          )}
        </button>

        {/* Density switcher (Desktop/Tablet only) */}
        <button
          type="button"
          onClick={toggleDensity}
          className="hidden sm:flex p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title={
            language === 'zh-CN'
              ? `当前视图密度: ${density === 'comfortable' ? '舒适' : '紧凑'} (点击切换)`
              : `Current density: ${density}. Click to switch.`
          }
        >
          {density === 'comfortable' ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>

        {/* Inspector panel toggle (Desktop/Tablet only) */}
        <button
          type="button"
          onClick={handleToggleInspector}
          className={`hidden sm:flex p-1.5 rounded-lg transition-colors cursor-pointer ${
            inspectorOpen
              ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title={language === 'zh-CN' ? (inspectorOpen ? '收起属性检视面板' : '展开属性检视面板') : 'Toggle Inspector'}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
