import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/storage/db';
import {
  Copy,
  Trash2,
  Check,
  Eye,
  Edit3,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  CheckSquare,
  Quote,
  Code,
  Link,
  Table,
  Columns,
  BookmarkPlus,
  Download,
  LayoutGrid,
} from 'lucide-react';
import { useI18n } from '@/core/i18n';
import { useUIStore } from '@/stores/uiStore';
import { useWidgetStore } from '@/stores/widgetStore';

const STORAGE_KEY_SCRATCHPAD = 'tilo_widget_scratchpad_markdown_v2';
const STORAGE_KEY_NOTES_DISPLAY_MODE = 'tilo_widget_notes_header_display_mode';

export const NotesGrid: React.FC = () => {
  const { language } = useI18n();
  const isZh = language === 'zh-CN';
  const { addToast } = useUIStore();
  const { settings } = useWidgetStore();
  const noteSetting = settings.gridSettings.notes;

  const [headerDisplayMode, setHeaderDisplayMode] = useState<'icon' | 'text' | 'both'>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_NOTES_DISPLAY_MODE);
    if (saved === 'icon' || saved === 'text' || saved === 'both') return saved;
    return 'icon';
  });

  const toggleDisplayMode = () => {
    const nextMode: 'icon' | 'text' | 'both' =
      headerDisplayMode === 'icon' ? 'both' : headerDisplayMode === 'both' ? 'text' : 'icon';
    setHeaderDisplayMode(nextMode);
    localStorage.setItem(STORAGE_KEY_NOTES_DISPLAY_MODE, nextMode);
    addToast({
      message: isZh
        ? `便签排版已切换为: ${nextMode === 'icon' ? '纯图标模式' : nextMode === 'text' ? '纯文字模式' : '图文并存模式'}`
        : `Notes header: ${nextMode === 'icon' ? 'Icon Only' : nextMode === 'text' ? 'Text Only' : 'Text & Icon'}`,
      type: 'info',
    });
  };

  const [content, setContent] = useState(() => {
    return (
      localStorage.getItem(STORAGE_KEY_SCRATCHPAD) ||
      (isZh
        ? `# 随手便签 📝\n- [ ] 欢迎使用支持 Markdown 的桌面便签\n- [ ] 支持任务清单直接打勾\n\n> 随时记录灵感或代码片段\n\n| 事项 | 状态 |\n|---|---|\n| 架构梳理 | 进行中 |\n| 需求排期 | 已完成 |\n\n\`\`\`ts\n// 代码块也支持高亮\nconst greeting = "Hello Tilo!";\n\`\`\``
        : `# Quick Notes 📝\n- [ ] Markdown-ready desktop scratchpad\n- [ ] Interactive task checkboxes\n\n> Quick ideas, drafts & snippets\n\n| Item | Status |\n|---|---|\n| Architecture | Active |\n| Milestone | Done |\n\n\`\`\`ts\n// Syntax highlighting supported\nconst greeting = "Hello Tilo!";\n\`\`\``)
    );
  });

  const [mode, setMode] = useState<'edit' | 'split' | 'preview'>(noteSetting.defaultMode || 'edit');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SCRATCHPAD, content);
  }, [content]);

  // 一键复制
  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      addToast({ message: isZh ? '已复制 Markdown 内容' : 'Copied Markdown to clipboard', type: 'success' });
    } catch {
      addToast({ message: isZh ? '复制失败' : 'Failed to copy', type: 'error' });
    }
  };

  // 清空便签
  const handleClear = () => {
    if (!content) return;
    setContent('');
    addToast({ message: isZh ? '便签已清空' : 'Scratchpad cleared', type: 'info' });
  };

  // 导出为 .md 文件
  const handleExport = () => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tilo-note-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({ message: isZh ? '已导出 Markdown 文件' : 'Markdown file exported', type: 'success' });
  };

  // 一键转存入正式知识笔记库
  const handleSaveToNoteLibrary = async () => {
    if (!content.trim()) return;
    const lines = content.trim().split('\n');
    const defaultTitle = isZh ? '随手便签整理' : 'Quick Scratchpad Note';
    const firstLine = lines[0].replace(/^#+\s*/, '').trim() || defaultTitle;
    const now = Date.now();
    const noteId = `note-${now}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      await db.notes.put({
        id: noteId,
        workspaceId: 'ws-default',
        title: firstLine,
        bodyMarkdown: content,
        tagIds: [],
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });
      addToast({
        message: isZh ? `已沉淀入笔记库: 「${firstLine}」` : `Saved to Notes Library: "${firstLine}"`,
        type: 'success',
      });
    } catch {
      addToast({ message: isZh ? '转存笔记失败' : 'Failed to save note', type: 'error' });
    }
  };

  // 快捷格式化插入
  const insertSyntax = (prefix: string, suffix = '', defaultText = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || defaultText || '文字';
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 10);
  };

  // 在预览模式下直接点击复选框打勾
  const handleToggleCheckbox = (lineIndex: number, currentChecked: boolean) => {
    const lines = content.split('\n');
    const targetLine = lines[lineIndex];
    if (!targetLine) return;

    if (currentChecked) {
      lines[lineIndex] = targetLine.replace(/- \[[xX]\] /, '- [ ] ');
    } else {
      lines[lineIndex] = targetLine.replace(/- \[ \] /, '- [x] ');
    }

    setContent(lines.join('\n'));
  };

  // 主题纸张背景与字号样式
  const paperThemeClass = {
    classic: 'bg-transparent text-slate-800 dark:text-slate-200',
    yellow: 'bg-amber-50/70 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100',
    mint: 'bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100',
    dark: 'bg-slate-950/80 text-slate-100',
  }[noteSetting.paperTheme || 'classic'];

  const fontClass =
    noteSetting.fontFamily === 'mono' ? 'font-mono' : 'font-sans';

  const fontSizeClass = {
    sm: 'text-xs',
    base: 'text-sm',
    lg: 'text-base',
  }[noteSetting.fontSize || 'sm'];

  // Markdown 渲染器
  const renderMarkdown = (text: string) => {
    if (!text.trim()) {
      return (
        <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-xs italic">
          <span>暂无内容，点击上方「写作 ✎」开始书写</span>
        </div>
      );
    }

    const lines = text.split('\n');
    let inCodeBlock = false;
    let codeBlockBuffer: string[] = [];

    const elements: React.ReactNode[] = [];

    lines.forEach((line, idx) => {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre
              key={`code-${idx}`}
              className="p-2.5 my-2 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto border border-slate-800 shadow-2xs leading-relaxed"
            >
              <code>{codeBlockBuffer.join('\n')}</code>
            </pre>
          );
          codeBlockBuffer = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockBuffer.push(line);
        return;
      }

      // 表格行渲染
      if (line.startsWith('|') && line.endsWith('|')) {
        const cells = line
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim());
        const isHeaderDivider = cells.every((c) => /^:?-+:?$/.test(c));
        if (!isHeaderDivider) {
          elements.push(
            <div
              key={idx}
              className="grid grid-cols-2 gap-2 py-1 px-2 text-xs border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/30 rounded"
            >
              {cells.map((cell, cIdx) => (
                <div key={cIdx} className="font-medium text-slate-700 dark:text-slate-300 truncate">
                  {cell}
                </div>
              ))}
            </div>
          );
        }
        return;
      }

      // 标题
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={idx} className="text-base font-bold text-slate-900 dark:text-white mt-2 mb-1 border-b border-slate-200/60 dark:border-slate-800 pb-1">
            {line.slice(2)}
          </h1>
        );
        return;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={idx} className="text-sm font-bold text-slate-900 dark:text-white mt-1.5 mb-1">
            {line.slice(3)}
          </h2>
        );
        return;
      }
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={idx} className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 mb-0.5">
            {line.slice(4)}
          </h3>
        );
        return;
      }

      // 任务复选框
      if (line.startsWith('- [ ] ')) {
        elements.push(
          <div
            key={idx}
            onClick={() => handleToggleCheckbox(idx, false)}
            className="flex items-center gap-2 py-0.5 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40 px-1 rounded transition-colors group"
          >
            <input
              type="checkbox"
              checked={false}
              onChange={() => handleToggleCheckbox(idx, false)}
              className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer shrink-0"
            />
            <span className="text-xs text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {line.slice(6)}
            </span>
          </div>
        );
        return;
      }
      if (line.startsWith('- [x] ') || line.startsWith('- [X] ')) {
        elements.push(
          <div
            key={idx}
            onClick={() => handleToggleCheckbox(idx, true)}
            className="flex items-center gap-2 py-0.5 cursor-pointer opacity-60 hover:opacity-100 transition-opacity px-1"
          >
            <input
              type="checkbox"
              checked={true}
              onChange={() => handleToggleCheckbox(idx, true)}
              className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer shrink-0"
            />
            <span className="text-xs text-slate-400 line-through">
              {line.slice(6)}
            </span>
          </div>
        );
        return;
      }

      // 引用
      if (line.startsWith('> ')) {
        elements.push(
          <blockquote
            key={idx}
            className="border-l-2 border-indigo-500 pl-2.5 py-0.5 my-1.5 italic text-slate-600 dark:text-slate-400 text-xs bg-slate-50/50 dark:bg-slate-800/40 rounded-r-lg"
          >
            {line.slice(2)}
          </blockquote>
        );
        return;
      }

      // 无序列表
      if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <li key={idx} className="ml-4 list-disc text-xs text-slate-700 dark:text-slate-300 py-0.5">
            {line.slice(2)}
          </li>
        );
        return;
      }

      // 分割线
      if (line.trim() === '---' || line.trim() === '***') {
        elements.push(<hr key={idx} className="my-2 border-slate-200 dark:border-slate-800" />);
        return;
      }

      // 空行
      if (!line.trim()) {
        elements.push(<div key={idx} className="h-1.5" />);
        return;
      }

      // 普通段落
      elements.push(
        <p key={idx} className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 break-words">
          {line}
        </p>
      );
    });

    return elements;
  };

  return (
    <div className={`flex flex-col h-full w-full overflow-hidden select-none transition-colors ${paperThemeClass}`}>
      {/* 头部控制栏：模式切换与快捷操作 */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-200/40 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
        {/* 编辑 / 分栏 / 预览 切换 Tab */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex items-center gap-0.5 bg-slate-200/50 dark:bg-slate-800/60 p-0.5 rounded-lg shrink-0">
            {[
              { id: 'edit' as const, labelZh: '写作', labelEn: 'Edit', icon: Edit3 },
              { id: 'split' as const, labelZh: '分栏', labelEn: 'Split', icon: Columns },
              { id: 'preview' as const, labelZh: '预览', labelEn: 'Preview', icon: Eye },
            ].map((item) => {
              const Icon = item.icon;
              const label = isZh ? item.labelZh : item.labelEn;
              const isActive = mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id)}
                  title={`${label} (${item.labelEn})`}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {headerDisplayMode !== 'text' && <Icon className="w-3.5 h-3.5 shrink-0" />}
                  {headerDisplayMode !== 'icon' && <span className="whitespace-nowrap">{label}</span>}
                </button>
              );
            })}
          </div>

          {/* 切换展示偏好：纯小图标切换按钮 */}
          <button
            type="button"
            onClick={toggleDisplayMode}
            className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/40 dark:hover:bg-slate-800/60 transition-colors cursor-pointer shrink-0"
            title={isZh ? `切换排版模式 (当前: ${headerDisplayMode === 'icon' ? '纯图标' : headerDisplayMode === 'text' ? '纯文字' : '图文'})` : `Toggle display mode (Current: ${headerDisplayMode})`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 右侧操作按钮组：紧凑单行纯图标，杜绝换行 */}
        <div className="flex items-center gap-0.5 shrink-0">
          {/* 一键存为正式笔记知识库 */}
          <button
            type="button"
            onClick={handleSaveToNoteLibrary}
            disabled={!content.trim()}
            className="flex items-center gap-1 p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 disabled:opacity-30 transition-colors cursor-pointer shrink-0"
            title={isZh ? '一键存入正式知识笔记库' : 'Save to Notes Library'}
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            {headerDisplayMode === 'both' && (
              <span className="text-[10px] font-medium hidden sm:inline whitespace-nowrap">
                {isZh ? '存入' : 'Save'}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            disabled={!content}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/40 disabled:opacity-30 transition-colors cursor-pointer shrink-0"
            title={isZh ? '一键复制 Markdown' : 'Copy Markdown'}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={!content}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/40 disabled:opacity-30 transition-colors cursor-pointer shrink-0"
            title={isZh ? '导出为 .md 文件' : 'Export as .md'}
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={!content}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-30 transition-colors cursor-pointer shrink-0"
            title={isZh ? '清空便签' : 'Clear Scratchpad'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Markdown 语法快捷工具栏（写作或分栏模式下提供一键排版） */}
      {(mode === 'edit' || mode === 'split') && (
        <div className="flex items-center gap-0.5 px-3 py-1 bg-slate-100/60 dark:bg-slate-850/60 border-b border-slate-200/30 dark:border-slate-800/30 shrink-0 overflow-x-auto text-slate-500">
          <button
            type="button"
            onClick={() => insertSyntax('**', '**')}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="粗体 (**文字**)"
          >
            <Bold className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => insertSyntax('*', '*')}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="斜体 (*文字*)"
          >
            <Italic className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => insertSyntax('# ')}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="大标题 (H1)"
          >
            <Heading1 className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => insertSyntax('## ')}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="中标题 (H2)"
          >
            <Heading2 className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => insertSyntax('- ')}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="无序列表 (- 事项)"
          >
            <List className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => insertSyntax('- [ ] ')}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-indigo-600 cursor-pointer"
            title="待办清单 (- [ ] 事项)"
          >
            <CheckSquare className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => insertSyntax('> ')}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="引用块 (> 引用)"
          >
            <Quote className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => insertSyntax('| 事项 | 状态 |\n|---|---|\n| ', ' | 完成 |\n')}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="插入表格"
          >
            <Table className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => insertSyntax('[链接名称](', ')', 'https://')}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="超链接"
          >
            <Link className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => insertSyntax('```ts\n', '\n```')}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="代码块 (```代码```)"
          >
            <Code className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 主体交互区域 */}
      <div className="flex-1 min-h-0 p-3 overflow-y-auto">
        {mode === 'edit' ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="支持完整的 Markdown 语法排版... (随时自动保存)"
            className={`w-full h-full resize-none bg-transparent outline-none leading-relaxed ${fontClass} ${fontSizeClass} placeholder-slate-400`}
          />
        ) : mode === 'split' ? (
          <div className="grid grid-cols-2 gap-3 h-full">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="左侧编辑 Markdown..."
              className={`w-full h-full resize-none bg-transparent outline-none leading-relaxed border-r border-slate-200/50 dark:border-slate-800/50 pr-2 ${fontClass} ${fontSizeClass} placeholder-slate-400`}
            />
            <div className={`w-full h-full overflow-y-auto space-y-1.5 pl-1 ${fontClass} ${fontSizeClass}`}>
              {renderMarkdown(content)}
            </div>
          </div>
        ) : (
          <div className={`w-full min-h-full space-y-1.5 ${fontClass} ${fontSizeClass}`}>
            {renderMarkdown(content)}
          </div>
        )}
      </div>

      {/* 底部信息栏 */}
      <div className="px-3 py-1.5 border-t border-slate-200/40 dark:border-slate-800/40 bg-slate-50/40 dark:bg-slate-800/20 flex items-center justify-between text-[10px] text-slate-400 shrink-0">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>实时自动保存</span>
        </span>
        <div className="flex items-center gap-2">
          <span>{content.split('\n').length} 行</span>
          <span>{content.length} 字符</span>
        </div>
      </div>
    </div>
  );
};
