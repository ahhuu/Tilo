import React from 'react';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/core/i18n';
import { Command } from 'lucide-react';

export const ShortcutsSection: React.FC = () => {
  const { language } = useI18n();

  const shortcuts = [
    {
      group: language === 'zh-CN' ? '全局导航' : 'Global Navigation',
      keys: ['Ctrl', 'K'],
      desc: language === 'zh-CN' ? '打开快捷命令面板' : 'Open Command Palette',
    },
    {
      group: language === 'zh-CN' ? '全局导航' : 'Global Navigation',
      keys: ['Ctrl', 'Shift', 'Space'],
      desc: language === 'zh-CN' ? '打开闪念快速收集弹窗' : 'Open Instant Capture Modal',
    },
    {
      group: language === 'zh-CN' ? '全局导航' : 'Global Navigation',
      keys: ['['],
      desc: language === 'zh-CN' ? '展开/收起左侧导航栏' : 'Toggle Sidebar Collapse',
    },
    {
      group: language === 'zh-CN' ? '收集箱分流' : 'Inbox Triage',
      keys: ['J', '/', '↓'],
      desc: language === 'zh-CN' ? '选择下一项' : 'Select Next Item',
    },
    {
      group: language === 'zh-CN' ? '收集箱分流' : 'Inbox Triage',
      keys: ['K', '/', '↑'],
      desc: language === 'zh-CN' ? '选择上一项' : 'Select Previous Item',
    },
    {
      group: language === 'zh-CN' ? '收集箱分流' : 'Inbox Triage',
      keys: ['T'],
      desc: language === 'zh-CN' ? '转化此项为任务待办' : 'Convert Item to Task',
    },
    {
      group: language === 'zh-CN' ? '收集箱分流' : 'Inbox Triage',
      keys: ['N'],
      desc: language === 'zh-CN' ? '转化此项为工作区笔记' : 'Convert Item to Note',
    },
    {
      group: language === 'zh-CN' ? '收集箱分流' : 'Inbox Triage',
      keys: ['S'],
      desc: language === 'zh-CN' ? '移入 Someday 待办池' : 'Move Item to Someday',
    },
    {
      group: language === 'zh-CN' ? '收集箱分流' : 'Inbox Triage',
      keys: ['E'],
      desc: language === 'zh-CN' ? '归档此项' : 'Archive Item',
    },
    {
      group: language === 'zh-CN' ? '收集箱分流' : 'Inbox Triage',
      keys: ['Delete'],
      desc: language === 'zh-CN' ? '移入废纸篓' : 'Delete Item to Trash',
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-5 space-y-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2">
          <Command className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {language === 'zh-CN' ? '键盘快捷键速查' : 'Keyboard Shortcuts'}
          </h3>
        </div>

        <div className="space-y-2">
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-xs"
            >
              <div className="space-x-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {sc.group}
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  {sc.desc}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {sc.keys.map((k, i) => (
                  <kbd
                    key={i}
                    className="px-2 py-1 text-[11px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300 shadow-2xs"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
