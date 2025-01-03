use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use base64::{engine::general_purpose::STANDARD, Engine};
use rand::{rngs::OsRng, RngCore};

pub fn encrypt(text: &str, secret: &[u8; 32]) -> String {
    let cipher = Aes256Gcm::new_from_slice(secret).unwrap();

    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, text.as_bytes().as_ref())
        .expect("encryption failure!");

    let mut combined = nonce_bytes.to_vec();
    combined.extend(ciphertext);
    STANDARD.encode(combined)
}

pub fn decrypt(encrypted_text: &str, secret: &[u8; 32]) -> String {
    let encrypted_bytes = STANDARD.decode(encrypted_text).expect("invalid base64");

    let nonce = Nonce::from_slice(&encrypted_bytes[..12]);
    let ciphertext = &encrypted_bytes[12..];

    let cipher = Aes256Gcm::new_from_slice(secret).unwrap();

    let plaintext = cipher
        .decrypt(nonce, ciphertext.as_ref())
        .expect("decryption failure!");

    String::from_utf8(plaintext).expect("invalid utf8")
}
