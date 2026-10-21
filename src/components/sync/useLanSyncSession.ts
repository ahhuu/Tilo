import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { lanSyncService } from '@/services/lanSyncService';
import { nativeService } from '@/services/nativeService';
import { syncManager } from '@/services/syncManager';

const STORAGE_KEY_LAST_HOST_IP = 'tilo_last_lan_sync_ip';
const STORAGE_KEY_DESKTOP_CUSTOM_IP = 'tilo_desktop_lan_ip';

/** 过滤回环 / 代理虚拟网卡等不可达地址。 */
export function isBogusIp(ip: string): boolean {
  return (
    !ip ||
    ip === '127.0.0.1' ||
    ip === '0.0.0.0' ||
    ip.startsWith('28.') ||
    ip.startsWith('198.18.') ||
    ip.startsWith('169.254.')
  );
}

/**
 * 局域网同步弹窗的全部状态与副作用：
 * 地址探测、二维码生成、相机扫码、执行同步、自动同步开关与对端登记。
 */
export const useLanSyncSession = (isOpen: boolean) => {
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

  const toggleAuto = () => {
    const next = !autoOn;
    syncManager.setAuto(next);
    setAutoOn(next);
  };

  // 停止相机扫描
  const stopScanner = useCallback(async () => {
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
  }, []);

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
        message:
          language === 'zh-CN'
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

  const handleCopyIp = () => {
    navigator.clipboard.writeText(`${localSuggestedIp}:${lanSyncService.DEFAULT_PORT}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast({
      message: language === 'zh-CN' ? '连接地址已复制到剪贴板' : 'Address copied',
      type: 'info',
    });
  };

  useEffect(() => {
    const unsub = syncManager.subscribe(() => forceRender((n) => n + 1));
    if (isOpen) syncManager.refreshOwnPayload();
    return unsub;
  }, [isOpen]);

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
              const match = ice.candidate.candidate.match(
                /(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)/
              );
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
  }, [isOpen, isMobile, addToast, language, stopScanner]);

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

  /** 手动改写电脑端 IP 并持久化 */
  const setDesktopIp = (ip: string) => {
    setLocalSuggestedIp(ip);
    localStorage.setItem(STORAGE_KEY_DESKTOP_CUSTOM_IP, ip);
  };

  return {
    isMobile,
    hostIp,
    setHostIp,
    syncing,
    setSyncing,
    syncResult,
    errorMessage,
    setErrorMessage,
    copied,
    autoOn,
    toggleAuto,
    peerInput,
    setPeerInput,
    phoneQrUrl,
    peers,
    localSuggestedIp,
    setDesktopIp,
    availableIps,
    qrCodeDataUrl,
    isScanning,
    stopScanner,
    startScanner,
    executeSync,
    handleCopyIp,
  };
};

export type LanSyncSession = ReturnType<typeof useLanSyncSession>;
