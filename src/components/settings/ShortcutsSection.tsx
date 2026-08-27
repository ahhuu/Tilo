import React from 'react';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/core/i18n';
import { Command, Sparkles, Inbox } from 'lucide-react';

export const ShortcutsSection: React.FC = () => {
  const { language } = useI18n();

  const shortcutGroups = [
    {
      title: language === 'zh-CN' ? '全局极速录入与创建 (双通道心流)' : 'Global Capture & Task Creation',
      icon: Sparkles,
      items: [
        {
          keys: ['C'],
          desc: language === 'zh-CN' ? '新建任务 HUD (支持自然语言 !high、#项目、30m、明天14:00)' : 'Quick Task HUD (NLP syntax: !high, #project, 30m, 14:00)',
          tag: language === 'zh-CN' ? '任务通道' : 'Task Channel',
        },
        {
          keys: ['Shift', 'Space'],
          desc: language === 'zh-CN' ? '闪念快速收集弹窗 (零阻力快速倾倒至收集箱待分流)' : 'Instant Raw Inbox Capture (Dump raw thoughts to Inbox)',
          tag: language === 'zh-CN' ? '闪念通道' : 'Inbox Channel',
        },
        {
          keys: ['Ctrl', 'V'],
          desc: language === 'zh-CN' ? '全局智能识别剪贴板文本并载入任务速记' : 'Smart paste text from clipboard into Quick Task HUD',
        },
        {
          keys: ['Ctrl', 'K'],
          desc: language === 'zh-CN' ? '打开快捷命令搜索面板' : 'Open Command Palette',
        },
        {
          keys: ['Ctrl', 'Z'],
          desc: language === 'zh-CN' ? '全局撤销最近一次操作' : 'Global Undo Last Action',
        },
        {
          keys: ['['],
          desc: language === 'zh-CN' ? '展开/收起左侧导航栏' : 'Toggle Sidebar Collapse',
        },
      ],
    },
    {
      title: language === 'zh-CN' ? '收集箱待整理分流 (Inbox Triage)' : 'Inbox Triage & Processing',
      icon: Inbox,
      items: [
        {
          keys: ['P'],
          desc: language === 'zh-CN' ? '开启沉浸式连续分流模式' : 'Start Continuous Triage Mode',
        },
        {
          keys: ['J', '/', '↓'],
          desc: language === 'zh-CN' ? '选择下一项' : 'Select Next Item',
        },
        {
          keys: ['K', '/', '↑'],
          desc: language === 'zh-CN' ? '选择上一项' : 'Select Previous Item',
        },
        {
          keys: ['T'],
          desc: language === 'zh-CN' ? '转化为结构化任务待办' : 'Convert Item to Task',
        },
        {
          keys: ['N'],
          desc: language === 'zh-CN' ? '沉淀为工作区 Markdown 笔记' : 'Convert Item to Note',
        },
        {
          keys: ['S'],
          desc: language === 'zh-CN' ? '移入 Someday 稍后待办池' : 'Move Item to Someday',
        },
        {
          keys: ['E'],
          desc: language === 'zh-CN' ? '归档当前事项' : 'Archive Item',
        },
        {
          keys: ['Delete'],
          desc: language === 'zh-CN' ? '删除事项至废纸篓' : 'Delete Item to Trash',
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-5 space-y-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Command className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {language === 'zh-CN' ? '键盘快捷键速查' : 'Keyboard Shortcuts Cheat Sheet'}
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {language === 'zh-CN' ? '键盘优先 • 极速流转' : 'Keyboard-first workflow'}
          </span>
        </div>

        <div className="space-y-6">
          {shortcutGroups.map((group, gIdx) => {
            const GroupIcon = group.icon;
            return (
              <div key={gIdx} className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 pb-1 border-b border-slate-100 dark:border-slate-800">
                  <GroupIcon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{group.title}</span>
                </div>

                <div className="space-y-1.5">
                  {group.items.map((sc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {sc.tag && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 shrink-0">
                            {sc.tag}
                          </span>
                        )}
                        <span className="text-slate-800 dark:text-slate-200 font-medium truncate">
                          {sc.desc}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-3">
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
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
