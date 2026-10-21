import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { useInboxItems } from '@/storage/hooks/useLiveQuery';
import {
  CheckCircle2,
  Inbox,
  Plus,
  Calendar,
  MoreHorizontal,
  Target,
  BarChart3,
  BookOpen,
  Settings,
  X,
  Sparkles,
  ListTodo,
  Wifi,
  FolderKanban,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LanSyncModal } from '@/components/sync/LanSyncModal';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const { openInstantCapture, openQuickTaskHUD } = useUIStore();
  const unsortedItems = useInboxItems('unsorted');
  const unsortedCount = unsortedItems?.length ?? 0;

  // 更多抽屉与快捷创建弹层状态
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);
  const [showQuickSheet, setShowQuickSheet] = useState(false);
  const [showLanSyncModal, setShowLanSyncModal] = useState(false);

  const moreItems = [
    { to: '/tasks', label: t('nav.tasks'), icon: ListTodo, desc: language === 'zh-CN' ? '跨项目筛选、排序与分组' : 'Cross-project filter & sort' },
    { to: '/projects', label: t('nav.projects'), icon: FolderKanban, desc: language === 'zh-CN' ? '浏览全部项目与进度' : 'All projects & progress' },
    { to: '/goals', label: t('nav.goals'), icon: Target, desc: language === 'zh-CN' ? '长期愿景与阶段成果' : 'Long-term Goals & Outcomes' },
    { to: '/analytics', label: t('nav.analytics'), icon: BarChart3, desc: language === 'zh-CN' ? '专注统计与完成度分析' : 'Productivity Analytics' },
    { to: '/review', label: t('nav.review'), icon: BookOpen, desc: language === 'zh-CN' ? '每日与每周深度复盘' : 'Daily & Weekly Reviews' },
    { to: '/settings', label: t('nav.settings'), icon: Settings, desc: language === 'zh-CN' ? '通用偏好、备份与数据' : 'Preferences & Backup' },
  ];

  const isMoreActive = ['/goals', '/analytics', '/review', '/settings', '/projects', '/tasks'].some((path) =>
    location.pathname.startsWith(path)
  );

  return (
    <>
      {/* 底部导航栏实体 - 仅在移动视口 (< md) 呈现 */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 select-none pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_16px_rgba(0,0,0,0.04)]"
      >
        <div className="flex items-center justify-around h-14 px-2">
          {/* 今日 (Today) */}
          <NavLink
            to="/today"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center flex-1 py-1 transition-colors relative',
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              )
            }
          >
            <CheckCircle2 className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-none">{t('nav.today')}</span>
          </NavLink>

          {/* 日历 (Calendar) */}
          <NavLink
            to="/calendar"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center flex-1 py-1 transition-colors relative',
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              )
            }
          >
            <Calendar className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-none">{t('nav.calendar')}</span>
          </NavLink>

          {/* 中央快捷记录悬浮按钮 (FAB) */}
          <div className="flex-1 flex justify-center items-center">
            <button
              type="button"
              onClick={() => setShowQuickSheet(true)}
              aria-label={language === 'zh-CN' ? '快速新建' : 'Quick Create'}
              className="w-11 h-11 -mt-4 rounded-full bg-indigo-600 active:bg-indigo-700 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 cursor-pointer border-2 border-white dark:border-slate-900"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* 收集箱 (Inbox) */}
          <NavLink
            to="/inbox"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center flex-1 py-1 transition-colors relative',
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              )
            }
          >
            <div className="relative">
              <Inbox className="w-5 h-5 mb-0.5" />
              {unsortedCount > 0 && (
                <span className="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900">
                  {unsortedCount > 99 ? '99+' : unsortedCount}
                </span>
              )}
            </div>
            <span className="text-[11px] leading-none">{t('nav.inbox')}</span>
          </NavLink>

          {/* 更多 (More) */}
          <button
            type="button"
            onClick={() => setShowMoreDrawer(true)}
            className={cn(
              'flex flex-col items-center justify-center flex-1 py-1 transition-colors relative cursor-pointer',
              isMoreActive
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            )}
          >
            <MoreHorizontal className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-none">{language === 'zh-CN' ? '更多' : 'More'}</span>
          </button>
        </div>
      </nav>

      {/* 快捷新建选择弹层 (Action Sheet) */}
      {showQuickSheet && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* 背景半透明遮罩 */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setShowQuickSheet(false)}
          />

          {/* 内容面板 */}
          <div className="relative bg-white dark:bg-slate-900 rounded-t-2xl p-5 shadow-2xl border-t border-slate-200 dark:border-slate-800 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] animate-in slide-in-from-bottom duration-200">
            <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4" />

            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 px-1">
              {language === 'zh-CN' ? '快捷记录' : 'Quick Capture'}
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-3">
              {/* 闪念收集 */}
              <button
                type="button"
                onClick={() => {
                  setShowQuickSheet(false);
                  openInstantCapture();
                }}
                className="flex flex-col items-center text-center p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/30 active:bg-indigo-100 dark:active:bg-indigo-900/50 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-2 shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {language === 'zh-CN' ? '闪念收集' : 'Raw Capture'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'zh-CN' ? '迅速捕捉脑海碎片' : 'Dump raw thoughts'}
                </span>
              </button>

              {/* 任务速记 */}
              <button
                type="button"
                onClick={() => {
                  setShowQuickSheet(false);
                  openQuickTaskHUD();
                }}
                className="flex flex-col items-center text-center p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 active:bg-slate-100 dark:active:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center mb-2 shadow-sm">
                  <ListTodo className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {language === 'zh-CN' ? '任务速记' : 'Quick Task'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'zh-CN' ? '智能解析标题与日期' : 'Natural language task'}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowQuickSheet(false)}
              className="w-full py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition-colors cursor-pointer"
            >
              {language === 'zh-CN' ? '取消' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {/* 更多功能底部抽屉 */}
      {showMoreDrawer && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setShowMoreDrawer(false)}
          />

          <div className="relative bg-white dark:bg-slate-900 rounded-t-2xl p-5 shadow-2xl border-t border-slate-200 dark:border-slate-800 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] animate-in slide-in-from-bottom duration-200 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {language === 'zh-CN' ? '更多系统功能' : 'More Features'}
              </h3>
              <button
                type="button"
                onClick={() => setShowMoreDrawer(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.to);
                return (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => {
                      setShowMoreDrawer(false);
                      navigate(item.to);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3.5 p-3 rounded-xl transition-colors text-left cursor-pointer border',
                      isActive
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/30 text-slate-800 dark:text-slate-200 active:bg-slate-100 dark:active:bg-slate-800'
                    )}
                  >
                    <div
                      className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold">{item.label}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* 局域网 WiFi 一键同步专属入口 */}
              <button
                type="button"
                onClick={() => {
                  setShowMoreDrawer(false);
                  setShowLanSyncModal(true);
                }}
                className="w-full flex items-center gap-3.5 p-3 rounded-xl transition-colors text-left cursor-pointer border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 active:bg-indigo-100"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-indigo-600 text-white shadow-xs">
                  <Wifi className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                    {language === 'zh-CN' ? '局域网 WiFi 一键同步' : 'LAN WiFi Direct Sync'}
                  </div>
                  <div className="text-[11px] text-indigo-500/90 dark:text-indigo-400/80 truncate mt-0.5">
                    {language === 'zh-CN' ? '与电脑端秒级点对点双向合并' : 'Fast P2P sync with desktop'}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 局域网同步弹窗 */}
      <LanSyncModal
        isOpen={showLanSyncModal}
        onClose={() => setShowLanSyncModal(false)}
      />
    </>
  );
};

export default MobileBottomNav;
