package com.tilo.app;

import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.Enumeration;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

/**
 * 轻量局域网同步 HTTP 服务（镜像桌面端 Rust 服务）。
 * 监听 0.0.0.0:27123，提供：
 *   - POST /api/sync/merge : 接收对方载荷并转发给 WebView 合并，返回本机缓存载荷（实现双向合并）
 *   - 其他路径 / OPTIONS    : 健康检查，返回 {"status":"ok",...}
 * 通过 addJavascriptInterface 暴露 window.__tiloSyncServer 供 JS 更新缓存载荷与查询本机 IP。
 */
public class SyncServer {
    private static final int PORT = 27123;
    private static final String TAG = "TiloSyncServer";

    private final AtomicBoolean running = new AtomicBoolean(false);
    // 初始给一个结构合法的空载荷，避免对端在 JS 尚未写入缓存时拿到 "{}" 导致解析失败
    private static final String EMPTY_PAYLOAD =
            "{\"device\":\"Android Mobile\",\"timestamp\":0,\"data\":{}}";
    private final AtomicReference<String> cachedPayload = new AtomicReference<>(EMPTY_PAYLOAD);
    /** 待 WebView 取走的一次性载荷（避免把超大 JSON 直接拼进 evaluateJavascript 脚本） */
    private final AtomicReference<String> pendingPayload = new AtomicReference<>();
    private final AtomicReference<WebView> webViewRef = new AtomicReference<>();
    private final AtomicBoolean attached = new AtomicBoolean(false);
    private ServerSocket serverSocket;
    private Thread serverThread;

    /** 暴露给 JS 的桥接对象：window.__tiloSyncServer */
    public class SyncBridge {
        @JavascriptInterface
        public void setPayload(String json) {
            if (json != null) cachedPayload.set(json);
        }

        @JavascriptInterface
        public String getLocalIp() {
            return getLocalIpAddress();
        }

        @JavascriptInterface
        public boolean isRunning() {
            return running.get();
        }

        /** 取走待合并载荷（JSON 字符串），取一次即清空 */
        @JavascriptInterface
        public String consumePendingPayload() {
            return pendingPayload.getAndSet(null);
        }
    }


    public void attachWebView(WebView webView) {
        webViewRef.set(webView);
        if (attached.compareAndSet(false, true)) {
            webView.addJavascriptInterface(new SyncBridge(), "__tiloSyncServer");
        }
    }

    public void setPayload(String json) {
        if (json != null) cachedPayload.set(json);
    }

    public synchronized void start() {
        if (running.get()) return;
        running.set(true);
        serverThread = new Thread(() -> {
            try {
                serverSocket = new ServerSocket(PORT);
            } catch (IOException e) {
                Log.w(TAG, "Failed to bind sync server on port " + PORT + ": " + e.getMessage());
                running.set(false);
                return;
            }
            Log.i(TAG, "Sync server started on port " + PORT);
            while (running.get()) {
                try {
                    Socket socket = serverSocket.accept();
                    new Thread(() -> handleClient(socket)).start();
                } catch (IOException e) {
                    if (running.get()) Log.w(TAG, "Accept error: " + e.getMessage());
                    break;
                }
            }
        }, "TiloSyncServer");
        serverThread.start();
    }

    public synchronized void stop() {
        running.set(false);
        try {
            if (serverSocket != null) serverSocket.close();
        } catch (IOException ignored) {
        }
    }

    private void handleClient(Socket socket) {
        try {
            socket.setSoTimeout(10000);
            BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream()));
            StringBuilder headerBuilder = new StringBuilder();
            int contentLength = 0;
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isEmpty()) break;
                headerBuilder.append(line).append("\r\n");
                String lower = line.toLowerCase();
                if (lower.startsWith("content-length:")) {
                    try {
                        contentLength = Integer.parseInt(lower.split(":")[1].trim());
                    } catch (NumberFormatException ignored) {
                    }
                }
            }
            String headerStr = headerBuilder.toString();

            String body = "";
            if (contentLength > 0) {
                char[] buf = new char[contentLength];
                int read = 0;
                while (read < contentLength) {
                    int n = reader.read(buf, read, contentLength - read);
                    if (n == -1) break;
                    read += n;
                }
                body = new String(buf, 0, read);
            }

            OutputStream out = socket.getOutputStream();
            if (headerStr.startsWith("OPTIONS")) {
                send(out, 204, "No Content", "text/plain", "", true);
            } else if (headerStr.contains("/api/sync/merge")) {
                // 请求来源 IP：电脑主动推送时，手机据此把电脑记为自动同步对端
                final String clientIp = socket.getInetAddress() != null
                        ? socket.getInetAddress().getHostAddress() : "";
                final String safeIp = clientIp.contains(":") ? "" : clientIp.replace("'", "");
                final String b = body;
                if (!b.isEmpty()) pendingPayload.set(b);

                WebView wv = webViewRef.get();
                if (wv != null) {
                    wv.post(() -> {
                        if (!safeIp.isEmpty()) {
                            wv.evaluateJavascript(
                                    "window.__tiloSyncOnPeer && window.__tiloSyncOnPeer('" + safeIp + "')", null);
                        }
                        if (!b.isEmpty()) {
                            // 脚本保持极短：载荷由 JS 通过桥接同步取走，规避大数据塞进 evaluateJavascript 的长度限制
                            wv.evaluateJavascript(
                                    "if (window.__tiloSyncOnReceive && window.__tiloSyncServer) {" +
                                            "try { window.__tiloSyncOnReceive(JSON.parse(window.__tiloSyncServer.consumePendingPayload())); } catch (e) {}" +
                                            "}", null);
                        }
                    });
                }
                send(out, 200, "OK", "application/json; charset=utf-8", cachedPayload.get(), false);
            } else {
                send(out, 200, "OK", "application/json",
                        "{\"status\":\"ok\",\"service\":\"Tilo LAN Sync\"}", false);
            }
            socket.close();
        } catch (Exception e) {
            Log.w(TAG, "Client handling error: " + e.getMessage());
            try {
                socket.close();
            } catch (IOException ignored) {
            }
        }
    }

    private void send(OutputStream out, int code, String reason, String contentType,
                      String body, boolean noContent) throws IOException {
        StringBuilder sb = new StringBuilder();
        sb.append("HTTP/1.1 ").append(code).append(' ').append(reason).append("\r\n");
        sb.append("Access-Control-Allow-Origin: *\r\n");
        sb.append("Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n");
        sb.append("Access-Control-Allow-Headers: *\r\n");
        sb.append("Connection: close\r\n");
        if (!noContent) {
            sb.append("Content-Type: ").append(contentType).append("\r\n");
            sb.append("Content-Length: ").append(body.getBytes("UTF-8").length).append("\r\n");
        }
        sb.append("\r\n");
        out.write(sb.toString().getBytes("UTF-8"));
        if (!noContent) out.write(body.getBytes("UTF-8"));
        out.flush();
    }

    /** 获取本机 Wi-Fi 物理局域网 IPv4（优先 192.168.* / 10.* / 172.16-31.*） */
    public static String getLocalIpAddress() {
        try {
            Enumeration<NetworkInterface> en = NetworkInterface.getNetworkInterfaces();
            while (en.hasMoreElements()) {
                NetworkInterface intf = en.nextElement();
                if (!intf.isUp() || intf.isLoopback()) continue;
                Enumeration<InetAddress> addrs = intf.getInetAddresses();
                while (addrs.hasMoreElements()) {
                    InetAddress addr = addrs.nextElement();
                    if (addr.isLoopbackAddress() || addr instanceof Inet6Address) continue;
                    String ip = addr.getHostAddress();
                    if (ip != null && !ip.contains(":")
                            && (ip.startsWith("192.168.") || ip.startsWith("10.")
                            || ip.matches("172\\.(1[6-9]|2[0-9]|3[0-1])\\..*"))) {
                        return ip;
                    }
                }
            }
        } catch (Exception ignored) {
        }
        return "";
    }
}
