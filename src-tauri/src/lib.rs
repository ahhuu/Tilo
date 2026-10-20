use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::sync::{Arc, Mutex};
use tauri::{Emitter, Manager};

struct SyncServerState {
  desktop_payload: Mutex<Option<String>>,
}

#[tauri::command]
fn exit_app(app: tauri::AppHandle) {
  app.exit(0);
}

#[cfg(windows)]
use std::os::windows::process::CommandExt;

fn is_virtual_or_bogus_ip(ip: &str) -> bool {
  ip == "0.0.0.0"
    || ip == "127.0.0.1"
    || ip.starts_with("169.254.") // APIPA 未配置
    || ip.starts_with("28.")     // 常见 Clash Meta TUN 虚拟网卡
    || ip.starts_with("198.18.") // 常见代理保留虚假网段
    || ip.starts_with("100.64.") // CGNAT/Tailscale
}

fn score_ip(ip: &str) -> i32 {
  if is_virtual_or_bogus_ip(ip) {
    return -100;
  }
  if ip.starts_with("192.168.") {
    return 100; // 最常见的家用与办公 Wi-Fi 局域网
  }
  if ip.starts_with("10.") {
    return 80;  // 常见企业局域网
  }
  if ip.starts_with("172.") {
    // 检查是否为 172.16 - 172.31
    if let Some(second) = ip.split('.').nth(1) {
      if let Ok(n) = second.parse::<u8>() {
        if (16..=31).contains(&n) {
          return 60;
        }
      }
    }
  }
  10
}

fn collect_system_ips() -> Vec<String> {
  let mut found_ips = Vec::new();

  #[cfg(windows)]
  {
    const CREATE_NO_WINDOW: u32 = 0x08000000;
    if let Ok(output) = std::process::Command::new("ipconfig")
      .creation_flags(CREATE_NO_WINDOW)
      .output()
    {
      let text = String::from_utf8_lossy(&output.stdout);
      for line in text.lines() {
        if line.contains("IPv4") {
          if let Some(idx) = line.rfind(':') {
            let candidate = line[idx + 1..].trim().to_string();
            if !candidate.is_empty() && !found_ips.contains(&candidate) {
              found_ips.push(candidate);
            }
          }
        }
      }
    }
  }

  // 辅助探测：通过直连常见内网网关探测真实出口
  let probes = ["192.168.0.1:80", "192.168.1.1:80", "192.168.31.1:80", "10.0.0.1:80", "223.5.5.5:80"];
  for probe in probes {
    if let Ok(socket) = std::net::UdpSocket::bind("0.0.0.0:0") {
      if socket.connect(probe).is_ok() {
        if let Ok(addr) = socket.local_addr() {
          let ip = addr.ip().to_string();
          if !found_ips.contains(&ip) {
            found_ips.push(ip);
          }
        }
      }
    }
  }

  // 按真实局域网优先级排序
  found_ips.sort_by(|a, b| score_ip(b).cmp(&score_ip(a)));
  found_ips
}

#[tauri::command]
fn get_local_ip() -> Option<String> {
  let ips = collect_system_ips();
  for ip in ips {
    if score_ip(&ip) > 0 {
      return Some(ip);
    }
  }
  None
}

#[tauri::command]
fn get_all_local_ips() -> Vec<String> {
  let ips = collect_system_ips();
  ips.into_iter().filter(|ip| score_ip(ip) > 0).collect()
}

#[tauri::command]
fn update_desktop_sync_payload(
  state: tauri::State<'_, Arc<SyncServerState>>,
  payload: String,
) {
  if let Ok(mut lock) = state.desktop_payload.lock() {
    *lock = Some(payload);
  }
}

fn handle_sync_http_client(
  stream: &mut TcpStream,
  app_handle: &tauri::AppHandle,
  state: &Arc<SyncServerState>,
) {
  let mut buffer = Vec::new();
  let mut temp = [0u8; 4096];
  let mut header_end = None;
  let mut content_length = 0;

  let _ = stream.set_read_timeout(Some(std::time::Duration::from_secs(10)));
  let _ = stream.set_write_timeout(Some(std::time::Duration::from_secs(10)));

  while header_end.is_none() {
    match stream.read(&mut temp) {
      Ok(0) => break,
      Ok(n) => {
        buffer.extend_from_slice(&temp[..n]);
        if let Some(pos) = buffer.windows(4).position(|w| w == b"\r\n\r\n") {
          header_end = Some(pos + 4);
          let header_str = String::from_utf8_lossy(&buffer[..pos]);
          for line in header_str.lines() {
            if line.to_ascii_lowercase().starts_with("content-length:") {
              if let Some(val) = line.split(':').nth(1) {
                content_length = val.trim().parse::<usize>().unwrap_or(0);
              }
            }
          }
          break;
        }
      }
      Err(_) => break,
    }
  }

  let header_end_idx = match header_end {
    Some(idx) => idx,
    None => return,
  };

  let header_str = String::from_utf8_lossy(&buffer[..header_end_idx]).to_string();

  // 处理 CORS 跨域 OPTIONS 预检请求
  if header_str.starts_with("OPTIONS") {
    let response = "HTTP/1.1 204 No Content\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: GET, POST, OPTIONS\r\nAccess-Control-Allow-Headers: *\r\nAccess-Control-Max-Age: 86400\r\nConnection: close\r\n\r\n";
    let _ = stream.write_all(response.as_bytes());
    let _ = stream.flush();
    return;
  }

  // 完整读取请求体
  while buffer.len() < header_end_idx + content_length {
    match stream.read(&mut temp) {
      Ok(0) => break,
      Ok(n) => buffer.extend_from_slice(&temp[..n]),
      Err(_) => break,
    }
  }

  let body = if buffer.len() >= header_end_idx + content_length {
    String::from_utf8_lossy(&buffer[header_end_idx..header_end_idx + content_length]).to_string()
  } else {
    String::new()
  };

  // 处理 POST /api/sync/merge
  if header_str.contains("/api/sync/merge") {
    if !body.is_empty() {
      let _ = app_handle.emit("lan-sync-received", body);
    }

    // 记录对方（通常是手机端）的源 IP，供前端记住为已知对端，实现电脑主动/自动回连
    let peer_ip = stream
      .peer_addr()
      .map(|addr| addr.ip().to_string())
      .unwrap_or_default();
    if !peer_ip.is_empty() {
      let _ = app_handle.emit("lan-sync-peer", peer_ip);
    }

    let desktop_payload = {
      let lock = state.desktop_payload.lock().unwrap();
      lock.clone().unwrap_or_else(|| "{}".to_string())
    };

    let response = format!(
      "HTTP/1.1 200 OK\r\nContent-Type: application/json; charset=utf-8\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: GET, POST, OPTIONS\r\nAccess-Control-Allow-Headers: *\r\nConnection: close\r\nContent-Length: {}\r\n\r\n{}",
      desktop_payload.len(),
      desktop_payload
    );
    let _ = stream.write_all(response.as_bytes());
    let _ = stream.flush();
  } else {
    // 默认探测
    let resp = "{\"status\":\"ok\",\"service\":\"Tilo LAN Sync\"}";
    let response = format!(
      "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\nConnection: close\r\nContent-Length: {}\r\n\r\n{}",
      resp.len(),
      resp
    );
    let _ = stream.write_all(response.as_bytes());
    let _ = stream.flush();
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let sync_state = Arc::new(SyncServerState {
    desktop_payload: Mutex::new(None),
  });

  tauri::Builder::default()
    .manage(sync_state.clone())
    .invoke_handler(tauri::generate_handler![
      exit_app,
      get_local_ip,
      get_all_local_ips,
      update_desktop_sync_payload
    ])
    .setup(move |app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      app.handle().plugin(tauri_plugin_autostart::init(
        tauri_plugin_autostart::MacosLauncher::LaunchAgent,
        Some(vec!["--autostart"]),
      ))?;

      // 启动局域网微型 HTTP 同步服务器 (端口 27123)
      let app_handle_for_server = app.handle().clone();
      let state_for_server = sync_state.clone();
      std::thread::spawn(move || {
        let listener = match TcpListener::bind("0.0.0.0:27123") {
          Ok(l) => l,
          Err(e) => {
            log::warn!("Failed to bind sync server on port 27123: {}", e);
            return;
          }
        };

        for stream in listener.incoming() {
          if let Ok(mut stream) = stream {
            let app_h = app_handle_for_server.clone();
            let state_s = state_for_server.clone();
            std::thread::spawn(move || {
              handle_sync_http_client(&mut stream, &app_h, &state_s);
            });
          }
        }
      });

      // 如果是开机自启动，主窗口默认静默最小化到托盘
      let is_autostart = std::env::args().any(|arg| arg == "--autostart");
      if is_autostart {
        if let Some(w) = app.get_webview_window("main") {
          let _ = w.hide();
        }
      }

      app.handle().plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
        if let Some(w) = app.get_webview_window("main") {
          let _ = w.show();
          let _ = w.unminimize();
          let _ = w.set_focus();
        }
      }))?;

      if let Some(icon) = app.default_window_icon() {
        let show_i = tauri::menu::MenuItem::with_id(app, "show", "显示 Tilo 主窗口", true, None::<&str>)?;
        let devtools_i = tauri::menu::MenuItem::with_id(app, "devtools", "打开开发者工具 (调试)", true, None::<&str>)?;
        let quit_i = tauri::menu::MenuItem::with_id(app, "quit", "退出 Tilo", true, None::<&str>)?;
        let menu = tauri::menu::Menu::with_items(app, &[&show_i, &devtools_i, &quit_i])?;

        let _tray = tauri::tray::TrayIconBuilder::new()
          .icon(icon.clone())
          .menu(&menu)
          .tooltip("Tilo - 任务与专注管理")
          .show_menu_on_left_click(false)
          .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
              if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
              }
            }
            "devtools" => {
              if let Some(window) = app.get_webview_window("main") {
                window.open_devtools();
              }
            }
            "quit" => {
              app.exit(0);
            }
            _ => {}
          })
          .on_tray_icon_event(|tray, event| {
            match event {
              tauri::tray::TrayIconEvent::Click {
                button: tauri::tray::MouseButton::Left,
                ..
              }
              | tauri::tray::TrayIconEvent::DoubleClick {
                button: tauri::tray::MouseButton::Left,
                ..
              } => {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                  let _ = window.show();
                  let _ = window.unminimize();
                  let _ = window.set_focus();
                }
              }
              _ => {}
            }
          })
          .build(app)?;
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
