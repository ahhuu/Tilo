import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { exportWorkspaceBackupJson, importWorkspaceBackupJson } from '@/services/exportImportService';
import { seedDemoData } from '@/storage/seed';
import { db, ensureDefaultWorkspace } from '@/storage/db';
import { LanSyncModal } from '@/components/sync/LanSyncModal';
import { DEMO_DATA_SEEDED_KEY } from '@/components/onboarding/FirstRunGuide';
import {
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  Sparkles,
  FileText,
  FileSpreadsheet,
  Table2,
  Wifi,
} from 'lucide-react';
import { format } from 'date-fns';

export const DataBackupSection: React.FC = () => {
  const { language } = useI18n();
  const { addToast } = useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLanSyncModal, setShowLanSyncModal] = useState(false);
  // 是否已载入示例数据：决定是否在维护区展示「清空示例数据」入口
  const [demoSeeded, setDemoSeeded] = useState(
    () => localStorage.getItem(DEMO_DATA_SEEDED_KEY) === 'true'
  );

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const jsonString = await exportWorkspaceBackupJson();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `tilo-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast({
        message: language === 'zh-CN' ? `备份数据已成功导出为 "${filename}"` : `Exported backup as "${filename}"`,
        type: 'success',
      });
    } catch {
      addToast({
        message: language === 'zh-CN' ? '导出工作区备份失败' : 'Failed to export workspace backup',
        type: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const result = await importWorkspaceBackupJson(text);
      if (result.success) {
        addToast({
          message: language === 'zh-CN' ? '工作区数据恢复成功！' : 'Backup restored successfully!',
          type: 'success',
        });
      } else {
        addToast({
          message: language === 'zh-CN' ? `导入失败: ${result.error}` : `Import failed: ${result.error}`,
          type: 'error',
        });
      }
    } catch (err) {
      addToast({
        message: language === 'zh-CN'
          ? `导入失败: ${err instanceof Error ? err.message : '无效的备份文件'}`
          : `Import failed: ${err instanceof Error ? err.message : 'Invalid file'}`,
        type: 'error',
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSeedDemoData = async () => {
    setIsSeeding(true);
    try {
      await seedDemoData(db);
      localStorage.setItem(DEMO_DATA_SEEDED_KEY, 'true');
      setDemoSeeded(true);
      addToast({
        message: language === 'zh-CN' ? '已成功注入演示工作区数据！' : 'Demo workspace data seeded!',
        type: 'success',
      });
    } catch {
      addToast({
        message: language === 'zh-CN' ? '注入演示数据失败' : 'Failed to seed demo data',
        type: 'error',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleResetWorkspace = async () => {
    try {
      await Promise.all([
        db.goals.clear(),
        db.projects.clear(),
        db.milestones.clear(),
        db.tasks.clear(),
        db.sessions.clear(),
        db.plannedBlocks.clear(),
        db.inboxItems.clear(),
        db.notes.clear(),
        db.reviews.clear(),
        db.reviewRevisions.clear(),
        db.activityEvents.clear(),
        db.weeklyFocus.clear(),
      ]);
      await ensureDefaultWorkspace(db);
      localStorage.setItem(DEMO_DATA_SEEDED_KEY, 'false');
      setDemoSeeded(false);
      setShowResetConfirm(false);
      addToast({
        message: language === 'zh-CN' ? '工作区已重置为干净初始状态。' : 'Workspace reset to clean default state.',
        type: 'info',
      });
    } catch {
      addToast({
        message: language === 'zh-CN' ? '重置工作区失败' : 'Failed to reset workspace',
        type: 'error',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* LAN WiFi P2P Direct Sync (方案 A) */}
      <Card className="p-5 space-y-4 border border-indigo-200/90 dark:border-indigo-800/80 bg-linear-to-r from-indigo-50/50 via-white to-white dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 shadow-2xs">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {language === 'zh-CN' ? '局域网 WiFi 一键同步 (方案 A)' : 'LAN WiFi Direct Sync'}
              </h3>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-md">
                Local-First P2P
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'zh-CN'
                ? '手机 App 与电脑端连接在同一 WiFi 下时，一键秒级增量合并两端 Dexie 数据库，无云端中转，隐私绝对安全。'
                : 'Directly sync and merge Dexie database between phone and desktop over same Wi-Fi in seconds.'}
            </p>
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setShowLanSyncModal(true)}
            className="shrink-0 gap-1.5 cursor-pointer shadow-sm"
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>{language === 'zh-CN' ? '局域网同步' : 'LAN Sync'}</span>
          </Button>
        </div>
      </Card>

      <LanSyncModal
        isOpen={showLanSyncModal}
        onClose={() => setShowLanSyncModal(false)}
      />

      {/* Export & Import Backup */}
      <Card className="p-5 space-y-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {language === 'zh-CN' ? '本地数据备份与迁移' : 'Local Data Backup & Portability'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'zh-CN'
              ? 'Tilo 100% 运行于本地浏览器 IndexedDB 中。您可以将整个工作区导出为标准 JSON 文件，或从已有备份中无缝恢复。'
              : 'Tilo is 100% local-first. Export your entire workspace into a portable JSON file, or restore from an existing backup.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Export Button */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {language === 'zh-CN' ? '导出 JSON 完整备份' : 'Export JSON Backup'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {language === 'zh-CN'
                  ? '下载所有任务、专注会话、战略目标、项目及不可变复盘历史。'
                  : 'Download all tasks, sessions, goals, projects, and review revisions.'}
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleExport}
              disabled={isExporting}
              className="w-full text-xs cursor-pointer"
            >
              {isExporting
                ? (language === 'zh-CN' ? '正在打包导出...' : 'Exporting...')
                : (language === 'zh-CN' ? '下载备份文件' : 'Download Backup')}
            </Button>
          </div>

          {/* Import Button */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {language === 'zh-CN' ? '从 JSON 文件还原' : 'Restore from JSON'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {language === 'zh-CN'
                  ? '从本地文件恢复工作区。写入前自动进行模式与事务校验。'
                  : 'Restore workspace from file. Validates schema before writing.'}
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full text-xs cursor-pointer"
            >
              {isImporting
                ? (language === 'zh-CN' ? '正在校验并还原...' : 'Validating & Restoring...')
                : (language === 'zh-CN' ? '上传并恢复' : 'Upload & Restore')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Multi-Dimensional Reports Export */}
      <Card className="p-5 space-y-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {language === 'zh-CN' ? '多维结构化报表导出 (Markdown & CSV)' : 'Multi-Dimensional Report Exports'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'zh-CN'
              ? '将执行沉淀一键转化为结构化 Markdown 周报，或导出标准 CSV 工时台账，方便汇报或导入 Excel 进行二次分析。'
              : 'Export structured Markdown weekly stories, or raw CSV timesheets for external analysis in Excel.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* 1. Markdown Weekly Report */}
          <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-950 bg-indigo-50/30 dark:bg-indigo-950/20 flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                  {language === 'zh-CN' ? 'Markdown 周报导出' : 'Markdown Weekly Story'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {language === 'zh-CN'
                  ? '生成包含目标进展、完成任务归类与反思沉淀的标准 Markdown。'
                  : 'Structured weekly review digest with goals, accomplishments, and learnings.'}
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const { generateWeeklyReviewMarkdown, downloadFile } = await import('@/services/reportExportService');
                const md = await generateWeeklyReviewMarkdown();
                downloadFile(`tilo-weekly-report-${format(new Date(), 'yyyy-MM-dd')}.md`, md, 'text/markdown');
                addToast({
                  message: language === 'zh-CN' ? 'Markdown 周报已成功导出！' : 'Markdown weekly report exported!',
                  type: 'success',
                });
              }}
              className="w-full text-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              <span>{language === 'zh-CN' ? '下载 Markdown 周报' : 'Download .md'}</span>
            </Button>
          </div>

          {/* 2. CSV Sessions Timesheet */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                  {language === 'zh-CN' ? '工时明细 CSV 导出' : 'Sessions Timesheet CSV'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {language === 'zh-CN'
                  ? '按日期、起止时间、耗时、任务与项目归属导出全部专注会话。'
                  : 'Detailed focus session records with timestamps and project tracking.'}
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const { generateSessionsTimesheetCSV, downloadFile } = await import('@/services/reportExportService');
                const csv = await generateSessionsTimesheetCSV();
                downloadFile(`tilo-sessions-timesheet-${format(new Date(), 'yyyy-MM-dd')}.csv`, csv, 'text/csv;charset=utf-8');
                addToast({
                  message: language === 'zh-CN' ? '工时明细 CSV 已成功导出！' : 'Timesheet CSV exported!',
                  type: 'success',
                });
              }}
              className="w-full text-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              <span>{language === 'zh-CN' ? '下载工时 CSV' : 'Download .csv'}</span>
            </Button>
          </div>

          {/* 3. CSV Tasks Audit Register */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Table2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                  {language === 'zh-CN' ? '任务台账明细 CSV' : 'Tasks Register CSV'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {language === 'zh-CN'
                  ? '包含任务状态、优先级、预估 vs 实际耗时、截止日期的完整台账。'
                  : 'Full task inventory with priority, estimates, and variance.'}
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const { generateTasksAuditCSV, downloadFile } = await import('@/services/reportExportService');
                const csv = await generateTasksAuditCSV();
                downloadFile(`tilo-tasks-register-${format(new Date(), 'yyyy-MM-dd')}.csv`, csv, 'text/csv;charset=utf-8');
                addToast({
                  message: language === 'zh-CN' ? '任务台账 CSV 已成功导出！' : 'Tasks register CSV exported!',
                  type: 'success',
                });
              }}
              className="w-full text-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              <span>{language === 'zh-CN' ? '下载任务 CSV' : 'Download .csv'}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Demo Seed & Reset */}
      <Card className="p-5 space-y-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {language === 'zh-CN' ? '工作区维护与重置' : 'Workspace Maintenance'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'zh-CN'
              ? '注入确定性演示数据用于评估体验，或一键彻底清空工作区。'
              : 'Seed deterministic demo data for evaluation, or wipe workspace clean.'}
          </p>
        </div>

        {/* 示例数据提示条：载入示例数据后常驻显示，提供一键清空入口 */}
        {demoSeeded && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 dark:border-amber-900/70 bg-amber-50 dark:bg-amber-950/30 px-3.5 py-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
              <span className="text-[12px] text-amber-800 dark:text-amber-200 leading-snug">
                {language === 'zh-CN'
                  ? '当前为示例数据，体验完可一键清空，换成你自己的规划。'
                  : 'This is sample data. Clear it anytime to start your own.'}
              </span>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowResetConfirm(true)}
              className="text-xs text-amber-700 dark:text-amber-200 border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 shrink-0 gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{language === 'zh-CN' ? '清空示例数据' : 'Clear Sample'}</span>
            </Button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSeedDemoData}
            disabled={isSeeding}
            className="text-xs gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>{language === 'zh-CN' ? '注入演示数据' : 'Seed Demo Workspace'}</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowResetConfirm(true)}
            className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{language === 'zh-CN' ? '清空重置工作区' : 'Reset Workspace'}</span>
          </Button>
        </div>
      </Card>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl border-t sm:border border-red-200 dark:border-red-900 shadow-2xl p-6 space-y-4 max-h-[88vh] overflow-y-auto overscroll-contain pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] sm:pb-6 animate-in zoom-in-98 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold">
                {language === 'zh-CN' ? '确认清空并重置工作区？' : 'Wipe & Reset Workspace?'}
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {language === 'zh-CN'
                ? '此操作将永久删除本地浏览器 IndexedDB 数据库中存储的所有战略目标、项目、待办、专注会话及复盘记录。若未提前导出 JSON 备份，此操作将无法撤回。'
                : 'This action will permanently delete all goals, projects, tasks, sessions, and review records stored in your local browser database. This cannot be undone unless you have exported a JSON backup.'}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button size="sm" variant="ghost" onClick={() => setShowResetConfirm(false)} className="cursor-pointer">
                {language === 'zh-CN' ? '取消' : 'Cancel'}
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleResetWorkspace}
                className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              >
                {language === 'zh-CN' ? '确认重置' : 'Yes, Reset Workspace'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
