use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use rand::RngCore;
use std::fs;
use std::path::PathBuf;

const NONCE_SIZE: usize = 12;

fn get_key_path(app_data_dir: &PathBuf) -> PathBuf {
    app_data_dir.join("encryption.key")
}

fn get_or_create_key(app_data_dir: &PathBuf) -> Result<[u8; 32], String> {
    let key_path = get_key_path(app_data_dir);

    if key_path.exists() {
        let encoded = fs::read_to_string(&key_path).map_err(|e| e.to_string())?;
        let bytes = BASE64
            .decode(encoded.trim())
            .map_err(|e| format!("Failed to decode key: {}", e))?;
        let key: [u8; 32] = bytes
            .try_into()
            .map_err(|_| "Invalid key length".to_string())?;
        Ok(key)
    } else {
        let mut key = [0u8; 32];
        rand::thread_rng().fill_bytes(&mut key);
        let encoded = BASE64.encode(key);
        fs::write(&key_path, &encoded).map_err(|e| e.to_string())?;
        Ok(key)
    }
}

pub fn encrypt(plaintext: &str, app_data_dir: &PathBuf) -> Result<String, String> {
    let key = get_or_create_key(app_data_dir)?;
    let cipher = Aes256Gcm::new_from_slice(&key).map_err(|e| e.to_string())?;

    let mut nonce_bytes = [0u8; NONCE_SIZE];
    rand::thread_rng().fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(|e| format!("Encryption failed: {}", e))?;

    // Format: base64(nonce + ciphertext)
    let mut combined = Vec::with_capacity(NONCE_SIZE + ciphertext.len());
    combined.extend_from_slice(&nonce_bytes);
    combined.extend_from_slice(&ciphertext);

    Ok(BASE64.encode(combined))
}

pub fn decrypt(encrypted: &str, app_data_dir: &PathBuf) -> Result<String, String> {
    let key = get_or_create_key(app_data_dir)?;
    let cipher = Aes256Gcm::new_from_slice(&key).map_err(|e| e.to_string())?;

    let combined = BASE64
        .decode(encrypted)
        .map_err(|e| format!("Failed to decode: {}", e))?;

    if combined.len() < NONCE_SIZE {
        return Err("Invalid encrypted data".to_string());
    }

    let (nonce_bytes, ciphertext) = combined.split_at(NONCE_SIZE);
    let nonce = Nonce::from_slice(nonce_bytes);

    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| format!("Decryption failed: {}", e))?;

    String::from_utf8(plaintext).map_err(|e| format!("Invalid UTF-8: {}", e))
}
