import { lanSyncService } from '@/services/lanSyncService';
import { nativeService } from '@/services/nativeService';
import { purgeTombstones } from '@/services/tombstoneService';
import { useUIStore } from '@/stores/uiStore';

const KNOWN_PEERS_KEY = 'tilo_known_sync_peers';
const AUTO_KEY = 'tilo_sync_auto_enabled';
const PORT = lanSyncService.DEFAULT_PORT;
const PROBE_TIMEOUT_MS = 2500;
const AUTO_INTERVAL_MS = 15000;

export type PeerStatus = 'online' | 'offline' | 'unknown';

function toHostKey(input: string): string {
  let s = input.trim();
  s = s.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  return s.split(':')[0];
}

function toUrl(input: string): string {
  let s = input.trim();
  if (!s.startsWith('http://') && !s.startsWith('https://')) s = `http://${s}`;
  if (!s.includes(':', 7)) s = `${s}:${PORT}`;
  return s.replace(/\/$/, '');
}

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/**
 * 双端局域网自动同步管理器：
 * - 维护已知对端（手机/电脑）IP 列表
 * - 定期探测对端是否可达，可达则自动双向合并
 * - 接收对端推送的合并数据并并入本地
 * - 自动刷新本机缓存载荷，保证对端拉取时拿到最新数据
 */
class SyncManager {
  private knownPeers = new Set<string>();
  private peerStatus = new Map<string, PeerStatus>();
  private autoEnabled = true;
  private lastSyncAt: number | null = null;
  private intervalId: number | null = null;
  private inFlight = new Set<string>();
  private listeners = new Set<() => void>();
  private initialized = false;
  /** 上次「有实际变更」提示的时间，用于节流，避免自动同步刷屏 */
  private lastChangeToastAt = 0;
  private static readonly CHANGE_TOAST_INTERVAL_MS = 10000;

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const p = localStorage.getItem(KNOWN_PEERS_KEY);
      if (p) {
        const arr = JSON.parse(p);
        if (Array.isArray(arr)) arr.forEach((ip: string) => this.knownPeers.add(toHostKey(ip)));
      }
      const a = localStorage.getItem(AUTO_KEY);
      this.autoEnabled = a === null ? true : a === '1';
    } catch {
      /* ignore */
    }
  }

  private saveState() {
    try {
      localStorage.setItem(KNOWN_PEERS_KEY, JSON.stringify([...this.knownPeers]));
      localStorage.setItem(AUTO_KEY, this.autoEnabled ? '1' : '0');
    } catch {
      /* ignore */
    }
  }

  // ---- 订阅（供 UI 实时刷新状态）----
  subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  // ---- 对外只读状态 ----
  getPeers(): string[] {
    return [...this.knownPeers];
  }
  getStatus(ip: string): PeerStatus {
    return this.peerStatus.get(toHostKey(ip)) ?? 'unknown';
  }
  isAuto(): boolean {
    return this.autoEnabled;
  }
  getLastSyncAt(): number | null {
    return this.lastSyncAt;
  }

  setAuto(value: boolean) {
    this.autoEnabled = value;
    this.saveState();
    this.notify();
    if (value) this.autoTick();
  }

  /**
   * 只登记对端、不立即发起同步。
   * 用于「手动 / 扫码同步成功后」把对方记入自动同步列表，
   * 否则手机端永远不知道电脑 IP，自动同步就只会单向（电脑→手机）。
   */
  rememberPeer(input: string | { ip?: string }) {
    const raw = typeof input === 'string' ? input : input?.ip;
    if (!raw) return;
    const key = toHostKey(raw);
    if (!key || key === '127.0.0.1' || key.startsWith('28.') || key.startsWith('169.254.')) return;
    if (this.knownPeers.has(key)) return; // 已登记则不做无谓的写盘/通知
    this.knownPeers.add(key);
    this.saveState();
    this.notify();
  }

  addPeer(input: string | { ip?: string }) {
    // 兼容 Rust 端可能直接传字符串或传 { ip } 对象两种载荷
    const raw = typeof input === 'string' ? input : input?.ip;
    if (!raw) return;
    const key = toHostKey(raw);
    if (!key) return;
    const isNewPeer = !this.knownPeers.has(key);
    this.rememberPeer(key);
    // 只在「首次发现对端」时立即拉一次，避免对端每次推送都反向再推一遍造成双倍往返
    if (isNewPeer) this.syncPeer(key);
  }

  removePeer(input: string) {
    const key = toHostKey(input);
    this.knownPeers.delete(key);
    this.peerStatus.delete(key);
    this.saveState();
    this.notify();
  }

  // ---- 本机载荷刷新（供对端拉取时返回最新数据）----
  async refreshOwnPayload() {
    try {
      const name = nativeService.isNative() ? 'Android Mobile' : 'Desktop Tilo';
      const payload = await lanSyncService.exportFullPayload(name);
      const json = JSON.stringify(payload);
      if (isTauri()) {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('update_desktop_sync_payload', { payload: json }).catch(() => {});
      } else if (nativeService.isNative()) {
        const srv = (window as unknown as { __tiloSyncServer?: { setPayload?: (j: string) => void } })
          .__tiloSyncServer;
        if (srv && srv.setPayload) {
          srv.setPayload(json);
        } else {
          console.warn('Sync bridge unavailable: window.__tiloSyncServer 未注入，手机端缓存载荷无法更新');
        }
      }
    } catch {
      /* ignore */
    }
  }

  /**
   * 只有确实合并出变更时才提示，且 10 秒内最多一次。
   * 自动同步每 15 秒一轮，若对端无新数据（0/0/0）则完全静默。
   */
  private announceSyncChanges(res: { updatedCount: number; addedCount: number; deletedCount: number }) {
    const changed = (res?.updatedCount ?? 0) + (res?.addedCount ?? 0) + (res?.deletedCount ?? 0);
    if (changed <= 0) return;
    const now = Date.now();
    if (now - this.lastChangeToastAt <= SyncManager.CHANGE_TOAST_INTERVAL_MS) return;
    this.lastChangeToastAt = now;
    const parts = [`更新 ${res.updatedCount} 项`, `新增 ${res.addedCount} 项`];
    if ((res?.deletedCount ?? 0) > 0) parts.push(`删除 ${res.deletedCount} 项`);
    useUIStore.getState().addToast({
      message: `已与对端同步（${parts.join('，')}）`,
      type: 'success',
    });
  }

  // ---- 接收对端推送的合并数据 ----
  async handleIncomingRemote(payload: unknown) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await lanSyncService.mergeRemotePayload(payload as any);
      this.lastSyncAt = Date.now();
      this.announceSyncChanges(res);
      this.refreshOwnPayload();
      this.notify();
    } catch (err) {
      console.warn('SyncManager merge error:', err);
    }
  }

  // ---- 探测对端是否可达 ----
  async probe(input: string): Promise<boolean> {
    const url = toUrl(input);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    try {
      const res = await fetch(url, { method: 'OPTIONS', signal: controller.signal });
      return res.ok || res.status === 204;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  // ---- 与单个对端同步（双向合并）----
  async syncPeer(input: string): Promise<boolean> {
    const key = toHostKey(input);
    const url = toUrl(input);
    if (this.inFlight.has(url)) return false;
    this.inFlight.add(url);
    try {
      const summary = await lanSyncService.syncWithHost(
        url,
        nativeService.isNative() ? 'Android Mobile' : 'Desktop Tilo'
      );
      this.announceSyncChanges(summary);
      this.knownPeers.add(key);
      this.peerStatus.set(key, 'online');
      this.lastSyncAt = Date.now();
      this.saveState();
      this.notify();
      return true;
    } catch {
      this.peerStatus.set(key, 'offline');
      this.notify();
      return false;
    } finally {
      this.inFlight.delete(url);
    }
  }

  async syncAll() {
    for (const peer of this.knownPeers) {
      // 先探测再合并，避免无谓超时
      const online = await this.probe(peer);
      this.peerStatus.set(peer, online ? 'online' : 'offline');
      this.notify();
      if (online) this.syncPeer(peer).catch(() => {});
    }
  }

  private autoTick() {
    if (!this.autoEnabled) return;
    this.refreshOwnPayload();
    for (const peer of this.knownPeers) {
      this.syncPeerIfOnline(peer);
    }
  }

  private async syncPeerIfOnline(peer: string) {
    const online = await this.probe(peer);
    this.peerStatus.set(peer, online ? 'online' : 'offline');
    this.notify();
    if (online) this.syncPeer(peer).catch(() => {});
  }

  startAuto() {
    if (this.intervalId !== null) return;
    this.intervalId = window.setInterval(() => this.autoTick(), AUTO_INTERVAL_MS);
    // 立即执行一次
    this.autoTick();
  }

  stopAuto() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // ---- 初始化：注册接收处理 + 桌面事件 + 启动自动同步 ----
  async init() {
    if (this.initialized) return;
    this.initialized = true;

    // 清理过期墓碑（超过保留期的删除记录不再承担「防复活」职责），
    // 否则同步载荷会随时间无限增长。
    purgeTombstones().catch(() => {});

    // 手机端：原生服务转发合并请求到此全局函数
    if (nativeService.isNative() && !isTauri()) {
      (window as unknown as { __tiloSyncOnReceive?: (p: unknown) => void }).__tiloSyncOnReceive = (
        payload: unknown
      ) => {
        this.handleIncomingRemote(payload);
      };

      // 原生服务把「本次请求的来源 IP」回传过来：电脑主动推送时自动记住电脑为对端
      (window as unknown as { __tiloSyncOnPeer?: (ip: unknown) => void }).__tiloSyncOnPeer = (
        ip: unknown
      ) => {
        if (typeof ip === 'string') this.rememberPeer(ip);
      };

      // 迁移：把上次手动/扫码同步过的电脑 IP 直接登记为自动同步对端，
      // 否则手机端自动同步列表为空，只会出现「电脑→手机」单向同步。
      try {
        const lastHost = localStorage.getItem('tilo_last_lan_sync_ip');
        if (lastHost) this.rememberPeer(lastHost);
      } catch {
        /* ignore */
      }
    }

    // 桌面端：监听 Rust 服务转发的合并事件 + 对端 IP 发现事件
    if (isTauri()) {
      const [{ listen }, { invoke }] = await Promise.all([
        import('@tauri-apps/api/event'),
        import('@tauri-apps/api/core'),
      ]);

      // 初次导出本机载荷，保证服务随时可返回最新数据
      lanSyncService
        .exportFullPayload('Desktop Tilo')
        .then((payload) => invoke('update_desktop_sync_payload', { payload: JSON.stringify(payload) }).catch(() => {}))
        .catch(() => {});

      listen<string>('lan-sync-received', async (event) => {
        try {
          this.handleIncomingRemote(JSON.parse(event.payload));
        } catch (err) {
          console.warn('SyncManager merge error:', err);
        }
      });

      listen<string>('lan-sync-peer', async (event) => {
        if (event.payload) this.addPeer(event.payload);
      });
    }

    // 仅在具备同步能力的平台（电脑 Tauri / 手机 Capacitor）启动自动同步循环
    if (nativeService.isNative() || isTauri()) {
      this.startAuto();
    }
  }
}

export const syncManager = new SyncManager();
export default syncManager;
