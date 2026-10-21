import React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useI18n } from '@/core/i18n';
import { lanSyncService } from '@/services/lanSyncService';
import { syncManager } from '@/services/syncManager';
import { isBogusIp, type LanSyncSession } from '../useLanSyncSession';

/** 双端互通：自动同步开关、电脑主动连手机、手机地址二维码、已配对设备列表。 */
export const SyncPeersSection: React.FC<{ session: LanSyncSession }> = ({ session }) => {
  const { language } = useI18n();
  const { autoOn, toggleAuto, peerInput, setPeerInput, syncing, isMobile, phoneQrUrl, peers, localSuggestedIp } =
    session;

  return (
    <div className="space-y-3 pt-1">
      {/* 自动同步开关 */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 px-3 py-2.5">
        <div>
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {language === 'zh-CN' ? '自动同步' : 'Auto Sync'}
            <span className={autoOn ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
              {' '}
              {autoOn
                ? language === 'zh-CN'
                  ? '（开启）'
                  : '(on)'
                : language === 'zh-CN'
                  ? '（关闭）'
                  : '(off)'}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {language === 'zh-CN'
              ? '检测到对端设备后自动双向合并，无需手动操作'
              : 'Automatically merge with peer devices when detected on LAN'}
          </div>
        </div>
        <button
          type="button"
          onClick={toggleAuto}
          role="switch"
          aria-checked={autoOn}
          aria-label={language === 'zh-CN' ? '自动同步' : 'Auto Sync'}
          className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
            autoOn ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              autoOn ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* 电脑端：输入手机地址主动连接 */}
      {!isMobile && (
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {language === 'zh-CN' ? '手机端地址（对方 IP，电脑主动连接）' : 'Mobile address (peer IP, desktop initiates)'}
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="例如: 192.168.0.105:27123"
              value={peerInput}
              onChange={(e) => setPeerInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && peerInput.trim()) syncManager.addPeer(peerInput);
              }}
              className="text-xs font-mono font-medium text-slate-900 dark:text-slate-100"
            />
            <Button
              size="sm"
              variant="primary"
              disabled={syncing}
              onClick={() => {
                if (peerInput.trim()) syncManager.addPeer(peerInput);
              }}
              className="cursor-pointer shrink-0"
            >
              {language === 'zh-CN' ? '连接并同步' : 'Connect'}
            </Button>
          </div>
        </div>
      )}

      {/* 手机端：展示本机地址二维码，供电脑扫码主动连接 */}
      {isMobile && localSuggestedIp && !isBogusIp(localSuggestedIp) && (
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex flex-col items-center text-center">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 block">
            {language === 'zh-CN'
              ? '本机同步地址（电脑可扫码主动连接手机）'
              : 'This device address (desktop can scan to connect)'}
          </span>
          {phoneQrUrl ? (
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
              <img src={phoneQrUrl} alt="Device QR" className="w-36 h-36 mx-auto" />
            </div>
          ) : (
            <div className="w-36 h-36 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-xs text-slate-400">
              {language === 'zh-CN' ? '生成中...' : 'Generating...'}
            </div>
          )}
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-2">
            {localSuggestedIp}:{lanSyncService.DEFAULT_PORT}
          </p>
        </div>
      )}

      {/* 已知对端设备列表 */}
      {peers.length > 0 && (
        <div>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            {language === 'zh-CN' ? '已配对设备' : 'Paired devices'}
          </div>
          <div className="space-y-1.5">
            {peers.map((ip) => {
              const st = syncManager.getStatus(ip);
              const dot =
                st === 'online' ? 'bg-emerald-500' : st === 'offline' ? 'bg-rose-500' : 'bg-slate-400';
              return (
                <div
                  key={ip}
                  className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                    <span className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate">{ip}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={syncing}
                      onClick={() => syncManager.syncPeer(ip)}
                      className="cursor-pointer px-2"
                    >
                      {language === 'zh-CN' ? '同步' : 'Sync'}
                    </Button>
                    <button
                      type="button"
                      onClick={() => syncManager.removePeer(ip)}
                      className="text-slate-400 hover:text-rose-500 cursor-pointer px-1 text-xs"
                    >
                      {language === 'zh-CN' ? '移除' : 'Remove'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
