import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useI18n } from '@/core/i18n';
import {
  FileText,
  X,
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
  Eye,
  Edit3,
  Columns,
  Sparkles,
} from 'lucide-react';
import type { Note, Project, Goal } from '@/core/types/domain';

interface EditNoteModalProps {
  note: Note;
  projects: Project[];
  goals: Goal[];
  onSave: (updatedNote: {
    title: string;
    bodyMarkdown: string;
    projectId?: string;
    goalId?: string;
  }) => Promise<void>;
  onClose: () => void;
}

export const EditNoteModal: React.FC<EditNoteModalProps> = ({
  note,
  projects,
  goals,
  onSave,
  onClose,
}) => {
  const { language } = useI18n();
  const [title, setTitle] = useState(note.title);
  const [bodyMarkdown, setBodyMarkdown] = useState(note.bodyMarkdown || '');
  const [projectId, setProjectId] = useState<string>(note.projectId || 'none');
  const [goalId, setGoalId] = useState<string>(note.goalId || 'none');
  const [viewTab, setViewTab] = useState<'edit' | 'split' | 'preview'>('split');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const insertSnippet = (prefix: string, suffix: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;
    const selected = current.slice(start, end) || defaultText;

    const updated = current.slice(0, start) + prefix + selected + suffix + current.slice(end);
    setBodyMarkdown(updated);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selected.length
      );
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        bodyMarkdown,
        projectId: projectId !== 'none' ? projectId : undefined,
        goalId: goalId !== 'none' ? goalId : undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMarkdownPreview = (text: string) => {
    if (!text.trim()) {
      return (
        <div className="text-xs text-slate-400 italic py-8 text-center">
          {language === 'zh-CN' ? '暂无内容预览' : 'No markdown content to preview'}
        </div>
      );
    }

    const lines = text.split('\n');
    return (
      <div className="space-y-2 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
        {lines.map((line, idx) => {
          if (line.startsWith('# ')) {
            return <h1 key={idx} className="text-base font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-1 mt-2">{line.slice(2)}</h1>;
          }
          if (line.startsWith('## ')) {
            return <h2 key={idx} className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-2">{line.slice(3)}</h2>;
          }
          if (line.startsWith('### ')) {
            return <h3 key={idx} className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1.5">{line.slice(4)}</h3>;
          }
          if (line.startsWith('> ')) {
            return <blockquote key={idx} className="border-l-2 border-indigo-500 pl-2 italic text-slate-600 dark:text-slate-400">{line.slice(2)}</blockquote>;
          }
          if (line.startsWith('- [ ] ')) {
            return (
              <div key={idx} className="flex items-center gap-1.5">
                <input type="checkbox" disabled className="rounded border-slate-300 w-3.5 h-3.5" />
                <span>{line.slice(6)}</span>
              </div>
            );
          }
          if (line.startsWith('- [x] ') || line.startsWith('- [X] ')) {
            return (
              <div key={idx} className="flex items-center gap-1.5 text-slate-400 line-through">
                <input type="checkbox" checked disabled className="rounded border-slate-300 w-3.5 h-3.5" />
                <span>{line.slice(6)}</span>
              </div>
            );
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <li key={idx} className="ml-3 list-disc">
                {line.slice(2)}
              </li>
            );
          }
          if (line.trim() === '') {
            return <div key={idx} className="h-1.5" />;
          }
          return <p key={idx}>{line}</p>;
        })}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-98 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {language === 'zh-CN' ? '编辑资料与笔记 (Markdown)' : 'Edit Note & Docs (Markdown)'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {language === 'zh-CN' ? '支持 Markdown 语法排版与实时双向预览 • 按 Ctrl+Enter 快捷保存' : 'Supports rich markdown formatting • Press Ctrl+Enter to save'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Note Title */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {language === 'zh-CN' ? '笔记标题' : 'Note Title'}
            </label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={language === 'zh-CN' ? '输入笔记标题...' : 'Enter note title...'}
              required
              autoFocus
              className="text-sm font-semibold"
            />
          </div>

          {/* Project & Goal Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">
                {language === 'zh-CN' ? '关联所属项目' : 'Associated Project'}
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="none">{language === 'zh-CN' ? '无关联项目 (独立笔记)' : 'None (Standalone)'}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">
                {language === 'zh-CN' ? '关联战略目标' : 'Associated Goal'}
              </label>
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="none">{language === 'zh-CN' ? '无关联目标' : 'None'}</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Markdown Toolbar & View Switcher */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-slate-100 dark:border-slate-800">
              {/* Toolbar Actions */}
              <div className="flex items-center gap-0.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => insertSnippet('**', '**', '加粗文本')}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                  title="Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('*', '*', '斜体文本')}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('# ', '', '主标题')}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                  title="Heading 1"
                >
                  <Heading1 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('## ', '', '副标题')}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                  title="Heading 2"
                >
                  <Heading2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('- ', '', '列表项')}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                  title="List"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('- [ ] ', '', '待办事项')}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                  title="Task List"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('> ', '', '引用内容')}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                  title="Quote"
                >
                  <Quote className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('```\n', '\n```', '代码片段')}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                  title="Code Block"
                >
                  <Code className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('[链接名称](', ')', 'https://')}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                  title="Link"
                >
                  <Link className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('| 列1 | 列2 |\n|---|---|\n| 内容1 | 内容2 |\n', '', '')}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                  title="Table"
                >
                  <Table className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* View mode toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setViewTab('edit')}
                  className={`px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors ${
                    viewTab === 'edit'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{language === 'zh-CN' ? '编辑' : 'Edit'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewTab('split')}
                  className={`px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors ${
                    viewTab === 'split'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  <Columns className="w-3 h-3" />
                  <span>{language === 'zh-CN' ? '分栏' : 'Split'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewTab('preview')}
                  className={`px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors ${
                    viewTab === 'preview'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>{language === 'zh-CN' ? '预览' : 'Preview'}</span>
                </button>
              </div>
            </div>

            {/* Editor & Preview Workspace */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[260px]">
              {(viewTab === 'edit' || viewTab === 'split') && (
                <div className={`${viewTab === 'edit' ? 'col-span-2' : 'col-span-1'} flex flex-col`}>
                  <textarea
                    ref={textareaRef}
                    value={bodyMarkdown}
                    onChange={(e) => setBodyMarkdown(e.target.value)}
                    placeholder={language === 'zh-CN' ? '在此撰写 Markdown 笔记内容，支持标题、清单、引用、代码块与表格...' : 'Write note markdown content here...'}
                    className="w-full h-72 p-3 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
                  />
                </div>
              )}

              {(viewTab === 'preview' || viewTab === 'split') && (
                <div className={`${viewTab === 'preview' ? 'col-span-2' : 'col-span-1'} h-72 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 overflow-y-auto`}>
                  {renderMarkdownPreview(bodyMarkdown)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-800/40">
          <span className="text-[11px] text-slate-400 font-mono">
            {bodyMarkdown.length} {language === 'zh-CN' ? '字符' : 'chars'}
          </span>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              type="button"
              className="h-8 text-xs cursor-pointer"
              onClick={onClose}
            >
              {language === 'zh-CN' ? '取消' : 'Cancel'}
            </Button>
            <Button
              size="sm"
              variant="primary"
              type="button"
              className="h-8 text-xs cursor-pointer"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              <span>{language === 'zh-CN' ? '保存笔记 (Ctrl+Enter)' : 'Save Note (Ctrl+Enter)'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
