import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/storage/db';
import { useI18n } from '@/core/i18n';
import { useUIStore } from '@/stores/uiStore';
import { timeService } from '@/core/time/timeService';
import { parseQuickCaptureInput, type QuickCaptureParsedResult } from '@/services/nlpQuickCaptureParser';
import { createTask } from '@/services/taskCommands';
import { createPlannedBlock } from '@/services/planCommands';
import { Badge } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import {
  Sparkles,
  CornerDownLeft,
  Calendar,
  Clock,
  Folder,
  HelpCircle,
} from 'lucide-react';

interface QuickCaptureHUDProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickCaptureHUD: React.FC<QuickCaptureHUDProps> = ({ isOpen, onClose }) => {
  const { language } = useI18n();
  const { addToast, quickTaskInitialValue } = useUIStore();
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<QuickCaptureParsedResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const projectsData = useLiveQuery(
    () => db.projects.filter((p) => !p.deletedAt).toArray(),
    []
  );
  const projects = useMemo(() => projectsData || [], [projectsData]);

  useEffect(() => {
    if (isOpen) {
      const initial = quickTaskInitialValue || '';
      setInput(initial);
      // 输入框为非受控（IME 友好），初始化时需同步写回 DOM
      if (inputRef.current) inputRef.current.value = initial;
      if (initial.trim()) {
        setParsed(parseQuickCaptureInput(initial, projects));
      } else {
        setParsed(null);
      }
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          if (initial) {
            inputRef.current.select();
          }
        }
      }, 50);
    }
  }, [isOpen, quickTaskInitialValue, projects]);

  useEffect(() => {
    if (input.trim()) {
      setParsed(parseQuickCaptureInput(input, projects));
    } else {
      setParsed(null);
    }
  }, [input, projects]);

  if (!isOpen) return null;

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!input.trim()) return;

      const p = parsed || parseQuickCaptureInput(input, projects);
      if (!p.title) return;

      try {
        const task = await createTask({
          title: p.title,
          projectId: p.projectId,
          priority: p.priority,
          estimateMinutes: p.estimateMinutes,
          dueDate: p.scheduledDate,
          scheduledDate: p.scheduledDate,
        });

        // If specific time was parsed (e.g. 14:00), also create PlannedBlock on timeline
        if (p.scheduledDate && p.scheduledTime) {
          const [h, m] = p.scheduledTime.split(':').map(Number);
          const dayStart = timeService.getStartOfLogicalDay(p.scheduledDate);
          const startAt = dayStart + (h * 60 + m) * 60 * 1000;
          const durationMs = (p.estimateMinutes || 30) * 60 * 1000;

          await createPlannedBlock({
            taskId: task.id,
            projectId: p.projectId,
            type: 'task',
            title: task.title,
            startAt,
            endAt: startAt + durationMs,
          });
        }

        addToast({
          message: language === 'zh-CN'
            ? `已快速创建待办: 「${task.title}」`
            : `Created task: "${task.title}"`,
          type: 'success',
        });
        onClose();
      } catch {
        addToast({
          message: language === 'zh-CN' ? '创建失败' : 'Failed to create task',
          type: 'error',
        });
      }
    }
  };

  const appendHint = (hint: string) => {
    // 以 DOM 实际值为准（组字期间 state 可能落后一拍），并同步写回 DOM
    const current = inputRef.current?.value ?? input;
    const next = `${current.trim()} ${hint}`.trim() + ' ';
    if (inputRef.current) inputRef.current.value = next;
    setInput(next);
    inputRef.current?.focus();
  };

  return (
    <BottomSheet
      isOpen={true}
      onClose={onClose}
      ariaLabel={language === 'zh-CN' ? '极速速记' : 'Quick capture'}
      maxWidthClass="sm:max-w-xl"
      scrollable={false}
    >
      <div className="pb-3">
        {/* Input Bar */}
        <div className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <input
            ref={inputRef}
            type="text"
            defaultValue={input}
            onChange={(e) => setInput(e.target.value)}
            onCompositionEnd={(e) => setInput(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              language === 'zh-CN'
                ? '极速速记：输入任务，例如「重构音频 明天 14:00 45m #项目 !high」...'
                : 'Quick capture: "Refactor audio tomorrow 14:00 45m #project !high"...'
            }
            className="flex-1 text-sm bg-transparent border-0 focus:outline-hidden text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg shrink-0">
            <span>Enter</span>
            <CornerDownLeft className="w-3 h-3" />
          </div>
        </div>

        {/* Live Parsed Preview Chips */}
        {parsed && (parsed.tokens.length > 0 || parsed.title) && (
          <div className="p-4 px-5 bg-indigo-50/30 dark:bg-indigo-950/20 border-b border-indigo-100/50 dark:border-indigo-900/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {language === 'zh-CN' ? '智能解析预览' : 'Live Parsed Preview'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {language === 'zh-CN' ? '按 Enter 立即创建' : 'Press Enter to create'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-semibold text-slate-900 dark:text-slate-100 mr-1">
                {parsed.title}
              </span>

              {parsed.projectName && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[11px]">
                  <Folder className="w-3 h-3" />
                  <span>{parsed.projectName}</span>
                </span>
              )}

              {parsed.scheduledDate && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-[11px]">
                  <Calendar className="w-3 h-3" />
                  <span>{parsed.scheduledDate}</span>
                </span>
              )}

              {parsed.scheduledTime && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px]">
                  <Clock className="w-3 h-3" />
                  <span>{parsed.scheduledTime}</span>
                </span>
              )}

              {parsed.estimateMinutes && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[11px]">
                  <Clock className="w-3 h-3" />
                  <span>{parsed.estimateMinutes}m</span>
                </span>
              )}

              {parsed.priority !== 'medium' && (
                <Badge size="sm" variant={parsed.priority === 'urgent' ? 'urgent' : 'high'}>
                  {parsed.priority.toUpperCase()}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Syntax Hints & Cheatsheet */}
        <div className="p-4 px-5 bg-slate-50/60 dark:bg-slate-800/30 text-xs space-y-2.5">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{language === 'zh-CN' ? '自然语言语法提示 (点击可快速追加)' : 'Syntax Cheat-sheet (Click to append):'}</span>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => appendHint('明天 14:00')}
              className="px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              📅 <span className="font-mono">明天 14:00</span> ({language === 'zh-CN' ? '日期与时刻' : 'Date & Time'})
            </button>
            <button
              type="button"
              onClick={() => appendHint('45m')}
              className="px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              ⏱️ <span className="font-mono">30m / 1h</span> ({language === 'zh-CN' ? '预估工时' : 'Estimate'})
            </button>
            <button
              type="button"
              onClick={() => appendHint('!high')}
              className="px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              ⚡ <span className="font-mono">!high / !urgent</span> ({language === 'zh-CN' ? '优先级' : 'Priority'})
            </button>
            <button
              type="button"
              onClick={() => appendHint('#项目名')}
              className="px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              🎯 <span className="font-mono">#项目名 / p:项目名</span> ({language === 'zh-CN' ? '归属项目' : 'Project'})
            </button>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};
