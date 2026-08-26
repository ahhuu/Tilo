import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/storage/db';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import {
  ensureTemplatesInitialized,
  createTemplate,
  deleteTemplate,
  resetTemplatesToDefault,
  type TaskTemplatePayload,
  type ReviewReflectionTemplatePayload,
} from '@/services/templateCommands';
import {
  Plus,
  Trash2,
  RotateCcw,
  FileText,
  MessageSquareQuote,
  Clock,
} from 'lucide-react';

export const TemplatesSection: React.FC = () => {
  const { language } = useI18n();
  const { addToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<'task' | 'reflection'>('task');

  useEffect(() => {
    ensureTemplatesInitialized();
  }, []);

  const templates = useLiveQuery(() => db.templates.toArray(), []) || [];
  const taskTemplates = templates.filter((t) => t.kind === 'task');
  const reflectionTemplates = templates.filter((t) => t.kind === 'reviewReflection');

  // New task template form state
  const [newTaskTemplateName, setNewTaskTemplateName] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskMinutes, setNewTaskMinutes] = useState(60);
  const [newSubtasks, setNewSubtasks] = useState('');

  // New reflection template form state
  const [newReflectionName, setNewReflectionName] = useState('');
  const [newReflectionType, setNewReflectionType] = useState<'daily' | 'weekly'>('daily');
  const [newReflectionPrompts, setNewReflectionPrompts] = useState('');

  const handleCreateTaskTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTemplateName.trim()) return;

    const subtaskTitles = newSubtasks
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    await createTemplate({
      kind: 'task',
      name: newTaskTemplateName.trim(),
      payload: {
        title: newTaskTitle.trim() || newTaskTemplateName.trim(),
        description: newTaskDesc.trim(),
        priority: 'high',
        estimateMinutes: newTaskMinutes,
        progressMode: subtaskTitles.length > 0 ? 'subtasks' : 'binary',
        subtaskTitles,
      },
    });

    setNewTaskTemplateName('');
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewSubtasks('');
    addToast({
      message: language === 'zh-CN' ? '已创建任务模板' : 'Task template created',
      type: 'success',
    });
  };

  const handleCreateReflectionTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReflectionName.trim()) return;

    const promptQuestions = newReflectionPrompts
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    await createTemplate({
      kind: 'reviewReflection',
      name: newReflectionName.trim(),
      payload: {
        type: newReflectionType,
        promptQuestions,
      },
    });

    setNewReflectionName('');
    setNewReflectionPrompts('');
    addToast({
      message: language === 'zh-CN' ? '已创建复盘提示模板' : 'Reflection template created',
      type: 'success',
    });
  };

  const handleDeleteTemplate = async (templateId: string) => {
    await deleteTemplate(templateId);
    addToast({
      message: language === 'zh-CN' ? '已删除模板' : 'Template deleted',
      type: 'info',
    });
  };

  const handleResetTemplates = async () => {
    await resetTemplatesToDefault();
    addToast({
      message: language === 'zh-CN' ? '已重置模板为默认配置' : 'Templates reset to default',
      type: 'info',
    });
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('task')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'task'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            {language === 'zh-CN' ? '任务模板 (Task Templates)' : 'Task Templates'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reflection')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'reflection'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            {language === 'zh-CN' ? '复盘反思模板 (Review Reflections)' : 'Review Reflections'}
          </button>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleResetTemplates}
          className="h-7 text-xs gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{language === 'zh-CN' ? '重置为默认' : 'Reset to Default'}</span>
        </Button>
      </div>

      {/* Task Templates Tab */}
      {activeTab === 'task' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {language === 'zh-CN' ? '标准任务模板' : 'Standard Task Templates'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'zh-CN'
                ? '用于快速创建带有预估时间、子任务分解和优先级的结构化任务。'
                : 'Create repeatable task patterns with subtasks and estimate minutes.'}
            </p>
          </div>

          <div className="space-y-2.5">
            {taskTemplates.map((t) => {
              const payload = t.payloadJson as TaskTemplatePayload;
              return (
                <Card key={t.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {t.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {payload.estimateMinutes && (
                        <Badge variant="indigo" size="sm" className="gap-1">
                          <Clock className="w-3 h-3" />
                          {payload.estimateMinutes}m
                        </Badge>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteTemplate(t.id)}
                        className="h-7 w-7 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {payload.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {payload.description}
                    </p>
                  )}

                  {payload.subtaskTitles && payload.subtaskTitles.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                      <p className="text-[11px] font-medium text-slate-400">
                        {language === 'zh-CN' ? `包含 ${payload.subtaskTitles.length} 个标准子任务：` : `Subtasks (${payload.subtaskTitles.length}):`}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {payload.subtaskTitles.map((sub, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-[10px] rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* New Task Template Form */}
          <form onSubmit={handleCreateTaskTemplate} className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {language === 'zh-CN' ? '新建任务模板' : 'Add New Task Template'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={newTaskTemplateName}
                onChange={(e) => setNewTaskTemplateName(e.target.value)}
                placeholder={language === 'zh-CN' ? '模板名称 (如：UI组件开发)' : 'Template name'}
                className="h-8 px-3 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
              <input
                type="number"
                value={newTaskMinutes}
                onChange={(e) => setNewTaskMinutes(Number(e.target.value))}
                placeholder={language === 'zh-CN' ? '预估分钟 (如：60)' : 'Estimate minutes'}
                className="h-8 px-3 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
            <textarea
              value={newSubtasks}
              onChange={(e) => setNewSubtasks(e.target.value)}
              placeholder={language === 'zh-CN' ? '子任务列表 (每行一项)' : 'Subtasks (one per line)'}
              rows={3}
              className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            />
            <Button size="sm" variant="primary" type="submit" className="h-8 text-xs gap-1 cursor-pointer">
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'zh-CN' ? '保存任务模板' : 'Save Task Template'}</span>
            </Button>
          </form>
        </div>
      )}

      {/* Reflection Templates Tab */}
      {activeTab === 'reflection' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {language === 'zh-CN' ? '复盘与反思问题模板' : 'Reflection Question Prompts'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'zh-CN'
                ? '自定义每日日结 (Daily Close) 与每周复盘 (Weekly Review) 时引导反思的核心提问。'
                : 'Configure reflection questions for Daily Close and Weekly Review.'}
            </p>
          </div>

          <div className="space-y-2.5">
            {reflectionTemplates.map((r) => {
              const payload = r.payloadJson as ReviewReflectionTemplatePayload;
              return (
                <Card key={r.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquareQuote className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {r.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={payload.type === 'daily' ? 'indigo' : 'urgent'} size="sm">
                        {payload.type === 'daily' ? (language === 'zh-CN' ? '日结反思' : 'Daily') : (language === 'zh-CN' ? '周复盘' : 'Weekly')}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteTemplate(r.id)}
                        className="h-7 w-7 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1 pl-1">
                    {payload.promptQuestions.map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>

          {/* New Reflection Template Form */}
          <form onSubmit={handleCreateReflectionTemplate} className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {language === 'zh-CN' ? '新建复盘反思模板' : 'Add Reflection Template'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={newReflectionName}
                onChange={(e) => setNewReflectionName(e.target.value)}
                placeholder={language === 'zh-CN' ? '模板名称 (如：极客周报复盘)' : 'Template name'}
                className="h-8 px-3 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
              <select
                value={newReflectionType}
                onChange={(e) => setNewReflectionType(e.target.value as 'daily' | 'weekly')}
                className="h-8 px-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="daily">{language === 'zh-CN' ? '用于每日日结 (Daily Close)' : 'Daily Close'}</option>
                <option value="weekly">{language === 'zh-CN' ? '用于每周复盘 (Weekly Review)' : 'Weekly Review'}</option>
              </select>
            </div>
            <textarea
              value={newReflectionPrompts}
              onChange={(e) => setNewReflectionPrompts(e.target.value)}
              placeholder={language === 'zh-CN' ? '反思提问列表 (每行一条提问)' : 'Prompt questions (one per line)'}
              rows={3}
              className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            />
            <Button size="sm" variant="primary" type="submit" className="h-8 text-xs gap-1 cursor-pointer">
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'zh-CN' ? '保存反思模板' : 'Save Reflection Template'}</span>
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};
