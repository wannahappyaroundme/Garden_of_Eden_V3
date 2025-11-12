use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemInfo {
    pub platform: String,
    pub arch: String,
    pub os_version: String,
    pub app_version: String,
}

/// Get system information
#[tauri::command]
pub async fn get_system_info() -> Result<SystemInfo, String> {
    log::info!("Getting system info");

    let platform = env::consts::OS.to_string();
    let arch = env::consts::ARCH.to_string();
    let os_version = sys_info::os_release()
        .unwrap_or_else(|_| "Unknown".to_string());

    Ok(SystemInfo {
        platform,
        arch,
        os_version,
        app_version: env!("CARGO_PKG_VERSION").to_string(),
    })
}
