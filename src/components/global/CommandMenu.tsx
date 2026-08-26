import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { Kbd } from '@/components/ui/Kbd';
import {
  Search,
  Calendar,
  Inbox,
  CheckCircle,
  Target,
  BarChart3,
  BookOpen,
  Settings,
  Plus,
  Sun,
  Moon,
  Laptop,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const CommandMenu: React.FC = () => {
  const { t } = useI18n();
  const {
    commandMenuOpen,
    closeCommandMenu,
    openInstantCapture,
    theme,
    setTheme,
    density,
    setDensity,
  } = useUIStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const commands = [
    {
      id: 'nav-today',
      title: t('search.goToToday'),
      category: t('search.quickAction'),
      icon: <CheckCircle className="w-4 h-4 text-indigo-500" />,
      action: () => navigate('/today'),
      shortcut: 'G T',
    },
    {
      id: 'nav-inbox',
      title: t('search.goToInbox'),
      category: t('search.quickAction'),
      icon: <Inbox className="w-4 h-4 text-blue-500" />,
      action: () => navigate('/inbox'),
      shortcut: 'G I',
    },
    {
      id: 'nav-calendar',
      title: t('search.goToCalendar'),
      category: t('search.quickAction'),
      icon: <Calendar className="w-4 h-4 text-emerald-500" />,
      action: () => navigate('/calendar'),
      shortcut: 'G C',
    },
    {
      id: 'nav-goals',
      title: t('search.goToGoals'),
      category: t('search.quickAction'),
      icon: <Target className="w-4 h-4 text-amber-500" />,
      action: () => navigate('/goals'),
      shortcut: 'G G',
    },
    {
      id: 'nav-analytics',
      title: t('search.goToAnalytics'),
      category: t('search.quickAction'),
      icon: <BarChart3 className="w-4 h-4 text-purple-500" />,
      action: () => navigate('/analytics'),
      shortcut: 'G A',
    },
    {
      id: 'nav-review',
      title: t('search.goToReview'),
      category: t('search.quickAction'),
      icon: <BookOpen className="w-4 h-4 text-rose-500" />,
      action: () => navigate('/review'),
      shortcut: 'G R',
    },
    {
      id: 'nav-settings',
      title: t('search.goToSettings'),
      category: t('search.quickAction'),
      icon: <Settings className="w-4 h-4 text-slate-500" />,
      action: () => navigate('/settings'),
      shortcut: 'G S',
    },
    {
      id: 'act-capture',
      title: 'Instant Capture thought or task',
      category: 'Actions',
      icon: <Plus className="w-4 h-4 text-indigo-600" />,
      action: () => openInstantCapture(),
      shortcut: 'Ctrl+Shift+Space',
    },
    {
      id: 'act-theme-toggle',
      title: `Switch Theme (Current: ${theme})`,
      category: 'Preferences',
      icon: theme === 'dark' ? <Moon className="w-4 h-4" /> : theme === 'light' ? <Sun className="w-4 h-4" /> : <Laptop className="w-4 h-4" />,
      action: () => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'),
    },
    {
      id: 'act-density-toggle',
      title: `Switch Density (Current: ${density})`,
      category: 'Preferences',
      icon: density === 'comfortable' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />,
      action: () => setDensity(density === 'comfortable' ? 'compact' : 'comfortable'),
    },
  ];

  const filteredCommands = query.trim()
    ? commands.filter(
        (c) =>
          c.title.toLowerCase().includes(query.toLowerCase()) ||
          c.category.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  useEffect(() => {
    if (commandMenuOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandMenuOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredCommands[selectedIndex];
      if (selected) {
        closeCommandMenu();
        selected.action();
      }
    } else if (e.key === 'Escape') {
      closeCommandMenu();
    }
  };

  if (!commandMenuOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={closeCommandMenu}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-98 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search input bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden"
          />
          <Kbd>ESC</Kbd>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-transparent">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching commands found.
            </div>
          ) : (
            filteredCommands.map((command, idx) => (
              <div
                key={command.id}
                onClick={() => {
                  closeCommandMenu();
                  command.action();
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer select-none',
                  idx === selectedIndex
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-medium'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="shrink-0">{command.icon}</div>
                  <span className="truncate">{command.title}</span>
                </div>
                {command.shortcut && <Kbd>{command.shortcut}</Kbd>}
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Navigation: <Kbd>↑</Kbd> <Kbd>↓</Kbd></span>
            <span>Select: <Kbd>↵</Kbd></span>
          </div>
          <span>Tilo Command Palette</span>
        </div>
      </div>
    </div>
  );
};
