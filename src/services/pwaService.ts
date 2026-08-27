/**
 * Service for Progressive Web App (PWA) registration, install prompts, and standalone detection.
 */

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

class PWAService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private listeners: Set<(canInstall: boolean) => void> = new Set();
  private isInitialized = false;

  public init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // Listen for beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.notifyListeners(true);
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.notifyListeners(false);
    });

    // Register Service Worker in browser environment
    this.registerServiceWorker();
  }

  public registerServiceWorker(): void {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    window.addEventListener('load', () => {
      // In production or development, register the root sw.js
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content available
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    });
  }

  public isStandalone(): boolean {
    if (typeof window === 'undefined') return false;
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = Boolean((window.navigator as unknown as { standalone?: boolean }).standalone);
    return isStandaloneMode || isIOSStandalone;
  }

  public isInstallable(): boolean {
    return Boolean(this.deferredPrompt) && !this.isStandalone();
  }

  public async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      this.notifyListeners(false);
      return choiceResult.outcome === 'accepted';
    } catch {
      return false;
    }
  }

  public subscribe(callback: (canInstall: boolean) => void): () => void {
    this.listeners.add(callback);
    callback(this.isInstallable());
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(canInstall: boolean): void {
    this.listeners.forEach((callback) => callback(canInstall));
  }
}

export const pwaService = new PWAService();
