import React from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/core/i18n';
import { lanSyncService } from '@/services/lanSyncService';
import type { LanSyncSession } from '../useLanSyncSession';

/** 电脑端：配对二维码 + 多网卡切换 + 局域网地址展示/复制。 */
export const DesktopPairingPanel: React.FC<{ session: LanSyncSession }> = ({ session }) => {
  const { language } = useI18n();
  const { qrCodeDataUrl, availableIps, localSuggestedIp, setDesktopIp, handleCopyIp, copied } = session;

  return (
    <div className="space-y-4 text-center">
      <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex flex-col items-center">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 block">
          {language === 'zh-CN' ? '电脑端配对二维码 (手机扫码一键连接)' : 'Desktop Pairing QR Code'}
        </span>

        {qrCodeDataUrl ? (
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
            <img src={qrCodeDataUrl} alt="Pairing QR Code" className="w-44 h-44 mx-auto" />
          </div>
        ) : (
          <div className="w-44 h-44 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-xs text-slate-400">
            {language === 'zh-CN' ? '正在生成二维码...' : 'Generating QR...'}
          </div>
        )}

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 max-w-sm">
          {language === 'zh-CN'
            ? '在手机 Tilo 中点击「📷 扫描电脑端二维码」，对准此二维码即可自动完成两端数据合并！'
            : 'Use mobile Tilo to scan this QR code for instant two-way sync!'}
        </p>
      </div>

      {/* 多网卡切换药丸按钮 */}
      {availableIps.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-400">
            {language === 'zh-CN' ? '可用局域网网卡:' : 'Available LAN IPs:'}
          </span>
          {availableIps.map((ip) => (
            <button
              key={ip}
              type="button"
              onClick={() => setDesktopIp(ip)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors ${
                localSuggestedIp === ip
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {ip} {ip.startsWith('192.168.') ? (language === 'zh-CN' ? '(Wi-Fi推荐)' : '(Wi-Fi)') : ''}
            </button>
          ))}
        </div>
      )}

      {/* 手动 IP 地址展示与修改 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 shrink-0">{language === 'zh-CN' ? '局域网地址:' : 'LAN IP:'}</span>
        <input
          type="text"
          value={`${localSuggestedIp}:${lanSyncService.DEFAULT_PORT}`}
          onChange={(e) => {
            const val = e.target.value.split(':')[0].trim();
            setDesktopIp(val);
          }}
          className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 select-all"
        />
        <Button size="sm" variant="secondary" onClick={handleCopyIp} className="cursor-pointer gap-1">
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>
            {copied
              ? language === 'zh-CN'
                ? '已复制'
                : 'Copied'
              : language === 'zh-CN'
                ? '复制'
                : 'Copy'}
          </span>
        </Button>
      </div>
    </div>
  );
};
