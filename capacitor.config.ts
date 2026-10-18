import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tilo.app',
  appName: 'Tilo',
  webDir: 'dist',
  backgroundColor: '#090D16',
  server: {
    androidScheme: 'https',
  },
  android: {
    // 局域网同步需要从 https://localhost 源向 http://<PC-IP>:27123 发起 fetch，
    // 必须允许混合内容，否则 Android WebView 会直接拦截（Failed to fetch）
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
