import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import Modal from '@/components/ui/Modal';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { lanSyncService } from '@/services/lanSyncService';
import { nativeService } from '@/services/nativeService';
import { syncManager } from '@/services/syncManager';
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Smartphone,
  Laptop,
  ArrowRightLeft,
  Copy,
  Check,
  Camera,
  QrCode,
} from 'lucide-react';

interface LanSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY_LAST_HOST_IP = 'tilo_last_lan_sync_ip';
const STORAGE_KEY_DESKTOP_CUSTOM_IP = 'tilo_desktop_lan_ip';

function isBogusIp(ip: string): boolean {
  return (
    !ip ||
    ip === '127.0.0.1' ||
    ip === '0.0.0.0' ||
    ip.startsWith('28.') ||
    ip.startsWith('198.18.') ||
    ip.startsWith('169.254.')
  );
}

export const LanSyncModal: React.FC<LanSyncModalProps> = ({ isOpen, onClose }) => {
  const { language } = useI18n();
  const { addToast } = useUIStore();
  const isMobile = nativeService.isNative() || (typeof window !== 'undefined' && window.innerWidth < 768);

  const [hostIp, setHostIp] = useState(() => {
    const cached = localStorage.getItem(STORAGE_KEY_LAST_HOST_IP);
    if (cached && !isBogusIp(cached.split(':')[0])) {
      return cached;
    }
    return '';
  });
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ updated: number; added: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 双端自动同步状态（订阅 SyncManager 实时刷新）
  const [autoOn, setAutoOn] = useState(syncManager.isAuto());
  const [peerInput, setPeerInput] = useState('');
  const [, forceRender] = useState(0);
  const [phoneQrUrl, setPhoneQrUrl] = useState('');
  const peers = syncManager.getPeers();
  const toggleAuto = () => {
    const next = !autoOn;
    syncManager.setAuto(next);
    setAutoOn(next);
  };

  useEffect(() => {
    const unsub = syncManager.subscribe(() => forceRender((n) => n + 1));
    if (isOpen) syncManager.refreshOwnPayload();
    return unsub;
  }, [isOpen]);

  // 电脑端真实局域网物理 IP
  const [localSuggestedIp, setLocalSuggestedIp] = useState<string>(() => {
    const cached = localStorage.getItem(STORAGE_KEY_DESKTOP_CUSTOM_IP);
    if (cached && !isBogusIp(cached)) {
      return cached;
    }
    return '192.168.0.103';
  });

  // 电脑端检测到的所有可用物理网卡候选列表
  const [availableIps, setAvailableIps] = useState<string[]>([]);

  // 电脑端配对二维码 DataURL
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // 手机端是否处于相机扫码模式
  const [isScanning, setIsScanning] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // 手机端生成「本机同步地址」二维码，供电脑扫码主动连接
  useEffect(() => {
    if (isMobile && isOpen && localSuggestedIp && !isBogusIp(localSuggestedIp)) {
      const url = `http://${localSuggestedIp}:${lanSyncService.DEFAULT_PORT}`;
      QRCode.toDataURL(url, {
        width: 200,
        margin: 1,
        color: { dark: '#1e1b4b', light: '#ffffff' },
      })
        .then(setPhoneQrUrl)
        .catch(() => {});
    }
  }, [isMobile, isOpen, localSuggestedIp]);

  useEffect(() => {
    if (isOpen) {
      setSyncResult(null);
      setErrorMessage(null);

      // 电脑端准备局域网数据与探测真实 IP
      if (!isMobile && typeof window !== 'undefined') {
        // 缓存本地 Dexie 完整数据至 Rust 服务端
        lanSyncService.exportFullPayload('Desktop Tilo').then((payload) => {
          if ('__TAURI_INTERNALS__' in window) {
            import('@tauri-apps/api/core').then(({ invoke }) => {
              invoke('update_desktop_sync_payload', { payload: JSON.stringify(payload) }).catch(() => {});
            });
          }
        });

        // 注意：对端推送的合并统一由 syncManager 全局处理（单例、有清理），
        // 此处不再重复注册监听，否则每打开一次弹窗就会多叠一个监听器导致提示刷屏。

        // 获取电脑端物理网卡真实 IP
        if ('__TAURI_INTERNALS__' in window) {
          import('@tauri-apps/api/core')
            .then(({ invoke }) => {
              invoke<string[]>('get_all_local_ips')
                .then((ips) => {
                  if (ips && ips.length > 0) {
                    setAvailableIps(ips);
                  }
                })
                .catch(() => {});

              invoke<string | null>('get_local_ip')
                .then((ip) => {
                  if (ip && !isBogusIp(ip)) {
                    setLocalSuggestedIp(ip);
                    localStorage.setItem(STORAGE_KEY_DESKTOP_CUSTOM_IP, ip);
                  }
                })
                .catch(() => {});
            })
            .catch(() => {});
        } else {
          try {
            const pc = new RTCPeerConnection({ iceServers: [] });
            pc.createDataChannel('');
            pc.createOffer().then((offer) => pc.setLocalDescription(offer)).catch(() => {});
            pc.onicecandidate = (ice) => {
              if (!ice || !ice.candidate || !ice.candidate.candidate) return;
              const match = ice.candidate.candidate.match(/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)/);
              if (match && match[0] && !isBogusIp(match[0])) {
                setLocalSuggestedIp(match[0]);
                localStorage.setItem(STORAGE_KEY_DESKTOP_CUSTOM_IP, match[0]);
                pc.close();
              }
            };
          } catch {
            // fallback
          }
        }
      }
    } else {
      // 弹窗关闭时停止扫码相机
      stopScanner();
    }
  }, [isOpen, isMobile, addToast, language]);

  // 根据当前 IP 生成清晰的配对二维码（内容是极简标准的配对地址）
  useEffect(() => {
    if (isOpen) {
      const syncUrl = `http://${localSuggestedIp}:${lanSyncService.DEFAULT_PORT}`;
      QRCode.toDataURL(syncUrl, {
        width: 220,
        margin: 1,
        color: {
          dark: '#1e1b4b',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch(() => {});
    }
  }, [isOpen, localSuggestedIp]);

  // 停止相机扫描
  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch {
        // ignore
      }
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
  };

  // 启动手机摄像头扫码
  const startScanner = async () => {
    setErrorMessage(null);
    setSyncResult(null);
    setIsScanning(true);

    // 延时让 DOM 容器渲染
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode('tilo-qr-reader');
        html5QrCodeRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
          },
          (decodedText) => {
            // 扫码成功！
            handleScanSuccess(decodedText);
          },
          () => {
            // 扫描中每帧忽略
          }
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMessage(
          language === 'zh-CN'
            ? `无法打开相机 (${msg})。请在系统设置中允许 Tilo 访问相机权限，或直接输入下方 IP 地址。`
            : `Camera access error: ${msg}`
        );
        setIsScanning(false);
      }
    }, 100);
  };

  // 扫码成功后自动清洗 IP 并触发同步
  const handleScanSuccess = async (scannedText: string) => {
    await stopScanner();

    // 智能解析扫描结果（支持 http://192.168.0.105:27123 或 192.168.0.105:27123 等）
    let cleanIp = scannedText.trim();
    if (cleanIp.startsWith('http://') || cleanIp.startsWith('https://')) {
      cleanIp = cleanIp.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    } else if (cleanIp.startsWith('tilo://')) {
      const match = cleanIp.match(/ip=([^&]+)/);
      if (match && match[1]) cleanIp = match[1];
    }

    setHostIp(cleanIp);
    addToast({
      message: language === 'zh-CN' ? `已扫描识别电脑端地址: ${cleanIp}` : `Scanned IP: ${cleanIp}`,
      type: 'info',
    });

    // 自动发起同步！零多余步骤
    executeSync(cleanIp);
  };

  // 执行同步核心逻辑
  const executeSync = async (targetIp: string) => {
    let trimmed = targetIp.trim();
    if (!trimmed) {
      trimmed = '192.168.0.105:27123';
      setHostIp(trimmed);
    }

    setSyncing(true);
    setErrorMessage(null);
    setSyncResult(null);

    try {
      localStorage.setItem(STORAGE_KEY_LAST_HOST_IP, trimmed);
      const res = await lanSyncService.syncWithHost(trimmed, isMobile ? 'Android Mobile' : 'Client Device');
      // 关键：把本次同步过的对端登记进自动同步列表，
      // 否则手机端对端列表为空，自动同步只会单向（电脑→手机）
      syncManager.rememberPeer(trimmed);
      setSyncResult({ updated: res.updatedCount, added: res.addedCount });
      addToast({
        message: language === 'zh-CN'
          ? `局域网同步完成！已增量合并数据 (更新: ${res.updatedCount}项, 新增: ${res.addedCount}项)`
          : `LAN Sync succeeded! (Updated: ${res.updatedCount}, Added: ${res.addedCount})`,
        type: 'success',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(
        language === 'zh-CN'
          ? `连接电脑端失败 (${msg})。请确保：1. 电脑端已启动并打开 Tilo；2. 手机与电脑已连在同一 WiFi 下；3. Windows 防火墙已允许 Tilo（首次启动时选择"允许访问"，或勾选"专用网络"）；4. 路由器未开启 AP 隔离。`
          : `Sync failed: ${msg}. Make sure both devices are on the same Wi-Fi, desktop Tilo is running, and the Windows Firewall allows Tilo on private networks.`
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleCopyIp = () => {
    navigator.clipboard.writeText(`${localSuggestedIp}:${lanSyncService.DEFAULT_PORT}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast({
      message: language === 'zh-CN' ? '连接地址已复制到剪贴板' : 'Address copied',
      type: 'info',
    });
  };

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
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="cursor-pointer"
          >
            {language === 'zh-CN' ? '关闭' : 'Close'}
          </Button>

          {isMobile && !isScanning && (
            <Button
              variant="primary"
              size="sm"
              disabled={syncing}
              onClick={() => executeSync(hostIp)}
              className="cursor-pointer gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? (language === 'zh-CN' ? '正在合并...' : 'Syncing...') : (language === 'zh-CN' ? '手动同步' : 'Sync')}</span>
            </Button>
          )}

          {!isMobile && (
            <Button
              variant="primary"
              size="sm"
              disabled={syncing}
              onClick={() => {
                setSyncing(true);
                syncManager
                  .syncAll()
                  .finally(() => setSyncing(false));
              }}
              className="cursor-pointer gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? (language === 'zh-CN' ? '正在同步...' : 'Syncing...') : (language === 'zh-CN' ? '立即同步所有设备' : 'Sync All Devices')}</span>
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
          {/* 电脑端界面：清晰展示配对二维码与局域网 IP */}
          {!isMobile ? (
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
                      onClick={() => {
                        setLocalSuggestedIp(ip);
                        localStorage.setItem(STORAGE_KEY_DESKTOP_CUSTOM_IP, ip);
                      }}
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
                <span className="text-xs text-slate-500 shrink-0">
                  {language === 'zh-CN' ? '局域网地址:' : 'LAN IP:'}
                </span>
                <input
                  type="text"
                  value={`${localSuggestedIp}:${lanSyncService.DEFAULT_PORT}`}
                  onChange={(e) => {
                    const val = e.target.value.split(':')[0].trim();
                    setLocalSuggestedIp(val);
                    localStorage.setItem(STORAGE_KEY_DESKTOP_CUSTOM_IP, val);
                  }}
                  className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 select-all"
                />
                <Button size="sm" variant="secondary" onClick={handleCopyIp} className="cursor-pointer gap-1">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? (language === 'zh-CN' ? '已复制' : 'Copied') : (language === 'zh-CN' ? '复制' : 'Copy')}</span>
                </Button>
              </div>
            </div>
          ) : (
            /* 手机端界面：主打【扫一扫电脑二维码】，备选手工输入 */
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
          )}

          {/* ===== 双端互通：自动同步 + 对端管理（电脑/手机通用） ===== */}
          <div className="space-y-3 pt-1">
            {/* 自动同步开关 */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 px-3 py-2.5">
              <div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {language === 'zh-CN' ? '自动同步' : 'Auto Sync'}
                  <span className={autoOn ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                    {' '}
                    {autoOn ? (language === 'zh-CN' ? '（开启）' : '(on)') : (language === 'zh-CN' ? '（关闭）' : '(off)')}
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
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
                  autoOn ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                aria-pressed={autoOn}
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
                  {language === 'zh-CN' ? '本机同步地址（电脑可扫码主动连接手机）' : 'This device address (desktop can scan to connect)'}
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
                      st === 'online'
                        ? 'bg-emerald-500'
                        : st === 'offline'
                        ? 'bg-rose-500'
                        : 'bg-slate-400';
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
