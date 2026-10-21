import React from 'react';
import { Edit2, FileText, Target, Trash2 } from 'lucide-react';
import { useI18n } from '@/core/i18n';
import type { Goal, Note, Project } from '@/core/types/domain';

interface NotesListProps {
  notes: Note[];
  projectMap: Map<string, Project>;
  goalMap: Map<string, Goal>;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
}

/** 笔记与资料 tab 的卡片列表。 */
export const NotesList: React.FC<NotesListProps> = ({ notes, projectMap, goalMap, onEdit, onDelete }) => {
  const { language } = useI18n();

  if (notes.length === 0) {
    return (
      <div className="py-16 text-center text-xs text-slate-400 space-y-3">
        <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
        <p>
          {language === 'zh-CN'
            ? '暂无资料笔记。点击上方「新建笔记」或在收件箱中分流保存。'
            : 'No notes yet. Click "New Note" or convert from inbox to store reference docs.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notes.map((note) => {
        const project = note.projectId ? projectMap.get(note.projectId) : undefined;
        const goal = note.goalId ? goalMap.get(note.goalId) : undefined;

        return (
          <div
            key={note.id}
            onClick={() => onEdit(note)}
            className="p-3.5 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-2xs space-y-2 group cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors truncate">
                  {note.title}
                </h4>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(note.createdAt).toLocaleDateString(language === 'zh-CN' ? 'zh-CN' : 'en-US')}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(note);
                  }}
                  className="p-1 rounded text-slate-300 hover:text-indigo-600 transition-colors cursor-pointer"
                  title={language === 'zh-CN' ? '编辑笔记 (Markdown)' : 'Edit note (Markdown)'}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(note.id);
                  }}
                  className="p-1 rounded text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                  title={language === 'zh-CN' ? '删除笔记' : 'Delete note'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {note.bodyMarkdown && (
              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 whitespace-pre-wrap leading-relaxed">
                {note.bodyMarkdown}
              </p>
            )}

            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {project && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: project.color || '#6366f1' }}
                  />
                  <span>{project.name}</span>
                </span>
              )}

              {goal && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium">
                  <Target className="w-3 h-3" />
                  <span>{goal.title}</span>
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
