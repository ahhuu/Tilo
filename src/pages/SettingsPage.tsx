import React, { useState } from 'react';
import { useI18n } from '@/core/i18n';
import { AppearanceSection } from '@/components/settings/AppearanceSection';
import { MotionSection } from '@/components/settings/MotionSection';
import { TodaySettingsSection } from '@/components/settings/TodaySettingsSection';
import { CalendarSettingsSection } from '@/components/settings/CalendarSettingsSection';
import { WorkflowSection } from '@/components/settings/WorkflowSection';
import { TemplatesSection } from '@/components/settings/TemplatesSection';
import { TimeSection } from '@/components/settings/TimeSection';
import { DataBackupSection } from '@/components/settings/DataBackupSection';
import { ShortcutsSection } from '@/components/settings/ShortcutsSection';
import {
  Settings as SettingsIcon,
  Palette,
  Play,
  Sun,
  Calendar,
  GitFork,
  FileText,
  Clock,
  Database,
  Command,
} from 'lucide-react';

type SettingsTab =
  | 'appearance'
  | 'motion'
  | 'today'
  | 'calendar'
  | 'workflow'
  | 'templates'
  | 'time'
  | 'data'
  | 'shortcuts';

export const SettingsPage: React.FC = () => {
  const { t, language } = useI18n();
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');

  const tabs: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'appearance', label: t('settings.appearance'), icon: Palette },
    { id: 'motion', label: t('settings.motion'), icon: Play },
    { id: 'today', label: language === 'zh-CN' ? '今日工作台' : 'Today Layout', icon: Sun },
    { id: 'calendar', label: language === 'zh-CN' ? '日历与排期' : 'Calendar & Planning', icon: Calendar },
    { id: 'workflow', label: language === 'zh-CN' ? '工作流与字段' : 'Workflow & Fields', icon: GitFork },
    { id: 'templates', label: language === 'zh-CN' ? '模板与提示' : 'Templates & Prompts', icon: FileText },
    { id: 'time', label: t('settings.time'), icon: Clock },
    { id: 'data', label: t('settings.data'), icon: Database },
    { id: 'shortcuts', label: t('settings.shortcuts'), icon: Command },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center">
          <SettingsIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t('settings.title')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'zh-CN'
              ? '配置本地优先偏好、工作流状态、任务模板、时间轴排期与数据备份。'
              : 'Configure local-first preferences, workflows, templates, and backups.'}
          </p>
        </div>
      </div>

      {/* Main Layout: Tabs + Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Navigation Tabs */}
        <div className="md:col-span-3 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Section Content Area */}
        <div className="md:col-span-9">
          {activeTab === 'appearance' && <AppearanceSection />}
          {activeTab === 'motion' && <MotionSection />}
          {activeTab === 'today' && <TodaySettingsSection />}
          {activeTab === 'calendar' && <CalendarSettingsSection />}
          {activeTab === 'workflow' && <WorkflowSection />}
          {activeTab === 'templates' && <TemplatesSection />}
          {activeTab === 'time' && <TimeSection />}
          {activeTab === 'data' && <DataBackupSection />}
          {activeTab === 'shortcuts' && <ShortcutsSection />}
        </div>
      </div>
    </div>
  );
};
