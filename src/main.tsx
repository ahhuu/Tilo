import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { pwaService } from '@/services/pwaService';

// 强制清除任何由于历史运行遗留在系统 WebView2 缓存中的 Service Worker 与 CacheStorage
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
  if ('caches' in window) {
    caches.keys().then((keys) => {
      for (const key of keys) {
        caches.delete(key);
      }
    });
  }
}

// 仅在非桌面原生环境按需初始化 Web 端 PWA
if (typeof window !== 'undefined' && !('__TAURI_INTERNALS__' in window)) {
  pwaService.init();
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
