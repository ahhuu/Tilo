import React from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useI18n } from '@/core/i18n';
import { lanSyncService } from '@/services/lanSyncService';
import type { LanSyncSession } from '../useLanSyncSession';

/** 手机端：相机扫码为主，手填 IP 为备选，并拦截代理虚拟网卡地址。 */
export const MobileScanPanel: React.FC<{ session: LanSyncSession }> = ({ session }) => {
  const { language } = useI18n();
  const {
    isScanning,
    stopScanner,
    startScanner,
    hostIp,
    setHostIp,
    setErrorMessage,
    localSuggestedIp,
    executeSync,
  } = session;

  return (
    <div className="space-y-4">
      {/* 摄像头实时取景器容器 */}
      {isScanning ? (
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center animate-in zoom-in-95">
          <div className="w-full flex items-center justify-between pb-2 text-slate-300 text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <Camera className="w-4 h-4 text-indigo-400" />
              {language === 'zh-CN' ? '对准电脑屏幕上的二维码' : 'Point camera at desktop QR code'}
            </span>
            <button
              type="button"
              onClick={stopScanner}
              className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs cursor-pointer"
            >
              {language === 'zh-CN' ? '取消' : 'Cancel'}
            </button>
          </div>

          <div id="tilo-qr-reader" className="w-full overflow-hidden rounded-xl bg-black min-h-[220px]" />

          <p className="text-[11px] text-slate-400 mt-2 text-center">
            {language === 'zh-CN' ? '保持对焦，扫到后将自动触发两端合并' : 'Scanning will trigger sync automatically'}
          </p>
        </div>
      ) : (
        /* 醒目的「扫一扫」主按钮 */
        <div className="p-5 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/20 flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {language === 'zh-CN' ? '扫描电脑端二维码' : 'Scan Desktop QR Code'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'zh-CN' ? '直接调用手机相机，一扫瞬间配对合并' : 'Use camera to pair and sync instantly'}
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={startScanner}
            className="w-full max-w-xs shadow-md cursor-pointer gap-2 py-2.5 font-medium"
          >
            <Camera className="w-4 h-4" />
            <span>{language === 'zh-CN' ? '开启相机扫一扫' : 'Open Camera to Scan'}</span>
          </Button>
        </div>
      )}

      {/* 手动填入电脑 IP 作为备选 */}
      <div className="pt-1">
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            {language === 'zh-CN' ? '或手动输入电脑端 IP 与端口' : 'Or enter Desktop IP & Port'}
          </label>
          {localSuggestedIp && (
            <button
              type="button"
              onClick={() => {
                setHostIp(`${localSuggestedIp}:${lanSyncService.DEFAULT_PORT}`);
                setErrorMessage(null);
              }}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              {language === 'zh-CN' ? `填入推荐 ${localSuggestedIp}` : `Use ${localSuggestedIp}`}
            </button>
          )}
        </div>
        <Input
          type="text"
          placeholder="例如: 192.168.0.103:27123"
          value={hostIp}
          onChange={(e) => {
            setHostIp(e.target.value);
            setErrorMessage(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') executeSync(hostIp);
          }}
          className="text-xs font-mono font-medium text-slate-900 dark:text-slate-100"
        />

        {/* 虚拟网卡代理 IP 拦截友好提醒 */}
        {hostIp.startsWith('28.') && (
          <div className="mt-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
            {language === 'zh-CN'
              ? '⚠️ 提示：28.0.0.1 属于电脑端代理软件 (如 Clash Meta) 的虚拟 TUN 网卡，手机无法在局域网内访问。请查看电脑端 Tilo 弹窗中显示的 Wi-Fi 物理局域网 IP (如 192.168.0.103) 并扫码。'
              : '⚠️ Warning: 28.0.0.1 is a virtual proxy TUN IP and inaccessible via LAN. Please use the real Wi-Fi IP (e.g. 192.168.0.103).'}
          </div>
        )}
      </div>
    </div>
  );
};
