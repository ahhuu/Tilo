import React, { useState } from 'react';
import { Minimize2, Power, Check, HelpCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useI18n } from '@/core/i18n';
import { tauriWidgetService } from '@/services/tauriWidgetService';

interface WindowCloseConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WindowCloseConfirmModal: React.FC<WindowCloseConfirmModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { language } = useI18n();
  const [action, setAction] = useState<'tray' | 'exit'>('tray');
  const [remember, setRemember] = useState(true);

  const handleConfirm = async () => {
    if (remember) {
      tauriWidgetService.setCloseActionPreference(action);
    }

    if (action === 'tray') {
      onClose();
      await tauriWidgetService.minimizeMainWindowToTray();
    } else {
      await tauriWidgetService.exitApplication();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={language === 'zh-CN' ? '关闭 Tilo 主窗口' : 'Close Tilo Window'}
      title={
        <span className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          {language === 'zh-CN' ? '关闭 Tilo 主窗口' : 'Close Tilo Window'}
        </span>
      }
      description={language === 'zh-CN' ? '请选择关闭主窗口时的运行行为：' : 'Choose what happens when you close the main window:'}
      bodyClassName="px-5 pb-3"
      footer={
        <div className="flex items-center justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors font-medium cursor-pointer"
          >
            {language === 'zh-CN' ? '取消' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            {language === 'zh-CN' ? '确定' : 'Confirm'}
          </button>
        </div>
      }
    >
      <div className="space-y-3 text-xs">
          {/* 选项 1: 最小化到托盘 */}
          <div
            onClick={() => setAction('tray')}
            className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
              action === 'tray'
                ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-600 shadow-2xs'
                : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:bg-slate-50'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                action === 'tray'
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            >
              {action === 'tray' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Minimize2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>{language === 'zh-CN' ? '最小化到系统托盘 (推荐)' : 'Minimize to System Tray (Recommended)'}</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed text-[11px]">
                {language === 'zh-CN'
                  ? '保持应用在后台静默运行，桌面快捷格子与专注计时不受影响，点击右下角托盘图标可随时唤回。'
                  : 'Keep app running silently in tray. Desktop widgets and focus sessions will remain active.'}
              </p>
            </div>
          </div>

          {/* 选项 2: 直接退出 */}
          <div
            onClick={() => setAction('exit')}
            className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
              action === 'exit'
                ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-600 shadow-2xs'
                : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:bg-slate-50'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                action === 'exit'
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            >
              {action === 'exit' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Power className="w-3.5 h-3.5 text-slate-500" />
                <span>{language === 'zh-CN' ? '直接彻底退出应用程序' : 'Quit Tilo Completely'}</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed text-[11px]">
                {language === 'zh-CN'
                  ? '关闭主应用与所有桌面快捷格子，完全释放系统资源。'
                  : 'Close the main application and all desktop widgets, freeing system resources.'}
              </p>
            </div>
          </div>

          {/* 记住我的选择 */}
          <div className="pt-2 flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              id="remember-close-pref"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
            />
            <label htmlFor="remember-close-pref" className="cursor-pointer text-[11px]">
              {language === 'zh-CN' ? '记住我的选择，以后不再询问 (可随时在设置中更改)' : 'Remember my choice (can change anytime in Settings)'}
            </label>
          </div>
        </div>

    </Modal>
  );
};
