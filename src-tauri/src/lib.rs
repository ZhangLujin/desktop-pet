use tauri::Manager;
use tauri::window::Color;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            let _ = window.set_background_color(Some(Color(0, 0, 0, 0)));

            // 监听窗口事件，防止被隐藏
            let w = window.clone();
            window.on_window_event(move |event| {
                // "显示桌面" 会触发最小化，立即恢复
                if let tauri::WindowEvent::Focused(false) = event {
                    let w2 = w.clone();
                    std::thread::spawn(move || {
                        std::thread::sleep(std::time::Duration::from_millis(300));
                        if let Ok(true) = w2.is_minimized() {
                            let _ = w2.unminimize();
                            let _ = w2.show();
                        }
                    });
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
