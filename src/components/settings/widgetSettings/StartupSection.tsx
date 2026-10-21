import React from 'react';
import { Power } from 'lucide-react';
import { useI18n } from '@/core/i18n';
import { useUIStore } from '@/stores/uiStore';
import { tauriWidgetService } from '@/services/tauriWidgetService';
import { useWidgetStatus } from './widgetStatusContext';
import { SettingsCard, SettingsCardTitle, WidgetToggle } from './WidgetSettingsControls';

/** 开机自启动、桌面挂件自动唤起、关闭主窗口行为。 */
export const StartupSection: React.FC = () => {
  const { language } = useI18n();
  const { addToast } = useUIStore();
  const { isAutoStart, setIsAutoStart, isAutoLaunchWidgets, setIsAutoLaunchWidgets } =
    useWidgetStatus();

  const handleToggleAutoStart = async () => {
    const nextState = !isAutoStart;
    const success = await tauriWidgetService.setAutoStart(nextState);
    if (success) {
      setIsAutoStart(nextState);
      addToast({
        message: nextState
          ? (language === 'zh-CN' ? '已开启 Windows 开机自启动' : 'Launch at startup enabled')
          : (language === 'zh-CN' ? '已关闭开机自启动' : 'Launch at startup disabled'),
        type: 'success',
      });
    } else {
      addToast({
        message: language === 'zh-CN' ? '设置开机自启失败，请在桌面客户端中运行' : 'Failed to configure autostart',
        type: 'warning',
      });
    }
  };

  const handleToggleAutoLaunchWidgets = () => {
    const nextVal = !isAutoLaunchWidgets;
    setIsAutoLaunchWidgets(nextVal);
    tauriWidgetService.setAutoLaunchWidgetsOnStartup(nextVal);
    addToast({
      message: nextVal
        ? (language === 'zh-CN' ? '已开启开机自动唤起快捷挂件' : 'Auto launch widgets on startup enabled')
        : (language === 'zh-CN' ? '已关闭开机自动唤起挂件' : 'Auto launch widgets disabled'),
      type: 'info',
    });
  };

  return (
    <SettingsCard>
      <SettingsCardTitle
        icon={<Power className="w-4 h-4 text-emerald-600" />}
        title={language === 'zh-CN' ? '开机自启动与运行策略' : 'Startup & Background Behavior'}
      />

      <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
        {/* Windows 开机自启 */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="font-medium text-slate-800 dark:text-slate-200">
              {language === 'zh-CN' ? 'Windows 开机自动启动 Tilo' : 'Launch Tilo at Windows Startup'}
            </div>
            <div className="text-slate-400 text-[11px] mt-0.5">
              {language === 'zh-CN'
                ? '开机进入系统后自动启动 Tilo，常驻后台提供毫秒级就绪体验'
                : 'Start Tilo in the background when logging into Windows'}
            </div>
          </div>

          <WidgetToggle checked={isAutoStart} onToggle={handleToggleAutoStart} />
        </div>

        {/* 开机自动唤起快捷挂件 */}
        <div className="flex items-center justify-between pt-3">
          <div>
            <div className="font-medium text-slate-800 dark:text-slate-200">
              {language === 'zh-CN' ? '开机时自动在桌面上显示挂件' : 'Auto Display Widgets on Desktop'}
            </div>
            <div className="text-slate-400 text-[11px] mt-0.5">
              {language === 'zh-CN'
                ? '开机自启后，自动在桌面上打开并整齐贴放常用挂件（如今日待办与闪念收集）'
                : 'Automatically show your favorite widgets docked on desktop upon boot'}
            </div>
          </div>

          <WidgetToggle checked={isAutoLaunchWidgets} onToggle={handleToggleAutoLaunchWidgets} />
        </div>

        {/* 关闭主窗口时的行为 */}
        <div className="flex items-center justify-between pt-3">
          <div>
            <div className="font-medium text-slate-800 dark:text-slate-200">
              {language === 'zh-CN' ? '关闭主窗口时的行为' : 'When Closing Main Window'}
            </div>
            <div className="text-slate-400 text-[11px] mt-0.5">
              {language === 'zh-CN'
                ? '选择点击主界面右上角 × 关闭按钮时的处理动作'
                : 'Choose behavior when clicking the close button on main window'}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {[
              { id: 'ask', label: language === 'zh-CN' ? '每次询问' : 'Ask Every Time' },
              { id: 'tray', label: language === 'zh-CN' ? '最小化到托盘' : 'To Tray' },
              { id: 'exit', label: language === 'zh-CN' ? '彻底退出' : 'Exit' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  tauriWidgetService.setCloseActionPreference(opt.id as 'ask' | 'tray' | 'exit');
                  addToast({
                    message:
                      language === 'zh-CN' ? `已更新关闭行为为：${opt.label}` : 'Close action preference updated',
                    type: 'success',
                  });
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                  tauriWidgetService.getCloseActionPreference() === opt.id
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </SettingsCard>
  );
};
