#[tauri::command]
fn exit_app(app: tauri::AppHandle) {
  app.exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![exit_app])
    .setup(|app| {
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

      use tauri::Manager;

      // 如果是开机自启动启动，主窗口默认静默最小化到托盘，桌面仅呈现小挂件
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
