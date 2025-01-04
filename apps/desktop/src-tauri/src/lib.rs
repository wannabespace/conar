use dotenv::dotenv;
use base64::{Engine as _, engine::general_purpose};
use tauri::command;
mod encryption;

#[command]
fn prepare_secret(secret: &str) -> String {
    dotenv().ok();

    let local_secret = std::env::var("TAURI_LOCAL_SECRET")
        .expect("TAURI_LOCAL_SECRET environment variable not set");
    let combined = format!("{}{}", local_secret, secret);
    let mut key = vec![0u8; 32];

    let bytes = combined.as_bytes();
    let copy_len = std::cmp::min(bytes.len(), 32);
    key[..copy_len].copy_from_slice(&bytes[..copy_len]);

    general_purpose::STANDARD.encode(key)
}

#[command]
fn encrypt_text(text: &str, secret: &str) -> String {
    let key_bytes = general_purpose::STANDARD.decode(secret).expect("Invalid secret");
    let key_array: [u8; 32] = key_bytes.try_into().expect("Invalid key length");
    encryption::encrypt(text, &key_array)
}

#[command]
fn decrypt_text(encrypted_text: &str, secret: &str) -> String {
    let key_bytes = general_purpose::STANDARD.decode(secret).expect("Invalid secret");
    let key_array: [u8; 32] = key_bytes.try_into().expect("Invalid secret length");
    encryption::decrypt(encrypted_text, &key_array)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![prepare_secret, encrypt_text, decrypt_text])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
