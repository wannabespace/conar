use base64::{Engine as _, engine::general_purpose};

#[tauri::command]
fn prepare_secret(secret: &str) -> String {
    let local_secret = std::env::var("TAURI_LOCAL_SECRET")
        .expect("TAURI_LOCAL_SECRET environment variable not set");

    let combined = format!("{}{}", local_secret, secret);
    let mut key = vec![0u8; 32];

    let bytes = combined.as_bytes();
    let copy_len = std::cmp::min(bytes.len(), 32);
    key[..copy_len].copy_from_slice(&bytes[..copy_len]);

    general_purpose::STANDARD.encode(key)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    if cfg!(dev) {
        dotenv::from_filename(".env.development.local").unwrap().load();
    } else {
        let prod_env = include_str!("../../.env.production.local");
        let result = dotenv::from_read(prod_env.as_bytes()).unwrap();
        result.load();
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![prepare_secret])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
