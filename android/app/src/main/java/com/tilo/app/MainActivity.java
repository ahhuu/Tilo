package com.tilo.app;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;

import android.webkit.WebView;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    private SyncServer syncServer;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        syncServer = new SyncServer();
        // 尽早注入 JS 桥，避免页面已加载后才挂载导致 window.__tiloSyncServer 缺失
        attachSyncServerToWebView();
    }

    private void attachSyncServerToWebView() {
        Bridge bridge = getBridge();
        if (bridge != null) {
            WebView webView = bridge.getWebView();
            if (webView != null) {
                syncServer.attachWebView(webView);
            }
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        attachSyncServerToWebView();
        syncServer.start();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (syncServer != null) syncServer.stop();
    }
}
