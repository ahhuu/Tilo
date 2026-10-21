import React from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/core/i18n';
import { syncManager } from '@/services/syncManager';
import {
  AlertCircle,
  ArrowRightLeft,
  CheckCircle2,
  Laptop,
  QrCode,
  RefreshCw,
  Smartphone,
  X,
} from 'lucide-react';
import { useLanSyncSession } from './useLanSyncSession';
import { DesktopPairingPanel } from './lansync/DesktopPairingPanel';
import { MobileScanPanel } from './lansync/MobileScanPanel';
import { SyncPeersSection } from './lansync/SyncPeersSection';

interface LanSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LanSyncModal: React.FC<LanSyncModalProps> = ({ isOpen, onClose }) => {
  const { language } = useI18n();
  const session = useLanSyncSession(isOpen);
  const { isMobile, syncing, setSyncing, hostIp, executeSync, syncResult, errorMessage, stopScanner } = session;

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      ariaLabel={language === 'zh-CN' ? '局域网与二维码同步' : 'LAN & QR Code Sync'}
      maxWidthClass="sm:max-w-lg"
      bodyClassName="p-5"
      header={
        <div className="w-full -mx-5 -mb-3 px-5 pb-3 border-b border-slate-100 dark:border-slate-800 sm:-mx-5 sm:-mb-3 sm:px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {language === 'zh-CN' ? '局域网与二维码同步 (方案 A)' : 'LAN & QR Code Sync'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === 'zh-CN' ? '手机扫码即可秒级增量合并两端数据，无需云端' : 'Scan QR code to merge data directly'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label={language === 'zh-CN' ? '关闭' : 'Close'}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" size="sm" onClick={handleClose} className="cursor-pointer">
            {language === 'zh-CN' ? '关闭' : 'Close'}
          </Button>

          {isMobile && !session.isScanning && (
            <Button
              variant="primary"
              size="sm"
              disabled={syncing}
              onClick={() => executeSync(hostIp)}
              className="cursor-pointer gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>
                {syncing
                  ? language === 'zh-CN'
                    ? '正在合并...'
                    : 'Syncing...'
                  : language === 'zh-CN'
                    ? '手动同步'
                    : 'Sync'}
              </span>
            </Button>
          )}

          {!isMobile && (
            <Button
              variant="primary"
              size="sm"
              disabled={syncing}
              onClick={() => {
                setSyncing(true);
                syncManager.syncAll().finally(() => setSyncing(false));
              }}
              className="cursor-pointer gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>
                {syncing
                  ? language === 'zh-CN'
                    ? '正在同步...'
                    : 'Syncing...'
                  : language === 'zh-CN'
                    ? '立即同步所有设备'
                    : 'Sync All Devices'}
              </span>
            </Button>
          )}
        </div>
      }
    >
      {/* Device Sync Status Badge */}
      <div className="mx-5 mt-4 p-3 rounded-xl border border-indigo-100 dark:border-indigo-950/60 bg-indigo-50/40 dark:bg-indigo-950/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Laptop className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {language === 'zh-CN' ? '电脑桌面端' : 'Desktop'}
          </span>
        </div>

        <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {language === 'zh-CN' ? '手机 APP 端' : 'Mobile APP'}
          </span>
          <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
      </div>

      {/* Body Content */}
      <div className="space-y-4">
        {!isMobile ? <DesktopPairingPanel session={session} /> : <MobileScanPanel session={session} />}

        {/* ===== 双端互通：自动同步 + 对端管理（电脑/手机通用） ===== */}
        <SyncPeersSection session={session} />

        {/* 错误提示 */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* 同步成功卡片 */}
        {syncResult && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-200 text-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="leading-relaxed">
              {language === 'zh-CN'
                ? `两端同步已完成！更新了 ${syncResult.updated} 条记录，新增了 ${syncResult.added} 条记录。`
                : `Sync completed! Updated ${syncResult.updated}, Added ${syncResult.added}.`}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default LanSyncModal;
