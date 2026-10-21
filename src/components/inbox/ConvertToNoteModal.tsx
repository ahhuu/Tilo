import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useI18n } from '@/core/i18n';
import { BookOpen } from 'lucide-react';
import type { InboxItem, Project, Goal } from '@/core/types/domain';

interface ConvertToNoteModalProps {
  item: InboxItem;
  projects: Project[];
  goals: Goal[];
  onConvert: (params: {
    title: string;
    bodyMarkdown: string;
    projectId?: string;
    goalId?: string;
  }) => Promise<void>;
  onClose: () => void;
}

export const ConvertToNoteModal: React.FC<ConvertToNoteModalProps> = ({
  item,
  projects,
  goals,
  onConvert,
  onClose,
}) => {
  const { language } = useI18n();
  const [title, setTitle] = useState(item.rawText.slice(0, 60));
  const [bodyMarkdown, setBodyMarkdown] = useState(
    item.kind === 'link' && item.url
      ? `[${item.urlDomain || (language === 'zh-CN' ? '网页链接' : 'Link')}](${item.url})\n\n${item.rawText}`
      : item.rawText
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string>('none');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onConvert({
        title: title.trim(),
        bodyMarkdown,
        projectId: selectedProjectId !== 'none' ? selectedProjectId : undefined,
        goalId: selectedGoalId !== 'none' ? selectedGoalId : undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      ariaLabel={language === 'zh-CN' ? '转化为笔记' : 'Convert to Note'}
      title={
        <span className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          {language === 'zh-CN' ? '转化为笔记' : 'Convert to Note'}
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {language === 'zh-CN' ? '笔记标题' : 'Note Title'}
            </label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {language === 'zh-CN' ? '笔记内容 (Markdown 格式)' : 'Note Content (Markdown)'}
            </label>
            <textarea
              rows={5}
              value={bodyMarkdown}
              onChange={(e) => setBodyMarkdown(e.target.value)}
              placeholder={language === 'zh-CN' ? '编写或编辑笔记 Markdown 正文...' : 'Write or edit note markdown body...'}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden resize-y"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {language === 'zh-CN' ? '关联项目' : 'Link to Project'}{' '}
                <span className="text-slate-400 font-normal">
                  {language === 'zh-CN' ? '(可选)' : '(Optional)'}
                </span>
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full h-8 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 border-0 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="none">{language === 'zh-CN' ? '无' : 'None'}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {language === 'zh-CN' ? '关联目标' : 'Link to Goal'}{' '}
                <span className="text-slate-400 font-normal">
                  {language === 'zh-CN' ? '(可选)' : '(Optional)'}
                </span>
              </label>
              <select
                value={selectedGoalId}
                onChange={(e) => setSelectedGoalId(e.target.value)}
                className="w-full h-8 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 border-0 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="none">{language === 'zh-CN' ? '无' : 'None'}</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button size="sm" variant="ghost" type="button" onClick={onClose} className="cursor-pointer">
              {language === 'zh-CN' ? '取消' : 'Cancel'}
            </Button>
            <Button size="sm" variant="primary" type="submit" disabled={isSubmitting || !title.trim()} className="cursor-pointer">
              {language === 'zh-CN' ? '确认转化为笔记' : 'Convert to Note'}
            </Button>
          </div>
        </form>
    </Modal>
  );
};
