use anyhow::Result;
use log::{info, error};

/// Active window information
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ActiveWindow {
    pub title: String,
    pub app_name: String,
    pub bundle_id: Option<String>,  // macOS only
    pub process_id: Option<u32>,
}

/// Active Window Detection Service
/// Detects which application and window is currently active
#[derive(Clone)]
pub struct ActiveWindowService;

impl ActiveWindowService {
    pub fn new() -> Result<Self> {
        info!("Active window detection service initialized");
        Ok(Self)
    }

    /// Get the currently active window
    pub fn get_active_window(&self) -> Result<ActiveWindow> {
        #[cfg(target_os = "macos")]
        return self.get_active_window_macos();

        #[cfg(target_os = "windows")]
        return self.get_active_window_windows();

        #[cfg(not(any(target_os = "macos", target_os = "windows")))]
        {
            warn!("Active window detection not supported on this platform");
            Err(anyhow::anyhow!("Platform not supported"))
        }
    }

    /// macOS implementation using NSWorkspace
    #[cfg(target_os = "macos")]
    fn get_active_window_macos(&self) -> Result<ActiveWindow> {
        use cocoa::base::{id, nil};
        use cocoa::foundation::NSAutoreleasePool;
        use objc::{msg_send, sel, sel_impl, class};

        unsafe {
            let _pool = NSAutoreleasePool::new(nil);

            // Get shared workspace
            let workspace_class = class!(NSWorkspace);
            let workspace: id = msg_send![workspace_class, sharedWorkspace];

            // Get frontmost application
            let frontmost_app: id = msg_send![workspace, frontmostApplication];

            if frontmost_app == nil {
                return Err(anyhow::anyhow!("No frontmost application found"));
            }

            // Get app name
            let app_name_ns: id = msg_send![frontmost_app, localizedName];
            let app_name = nsstring_to_string(app_name_ns);

            // Get bundle identifier
            let bundle_id_ns: id = msg_send![frontmost_app, bundleIdentifier];
            let bundle_id = if bundle_id_ns != nil {
                Some(nsstring_to_string(bundle_id_ns))
            } else {
                None
            };

            // Get process identifier
            let pid: i32 = msg_send![frontmost_app, processIdentifier];

            // Try to get window title using Accessibility API
            let window_title = self.get_window_title_macos(pid).unwrap_or_else(|_| app_name.clone());

            info!("Active window detected: {} ({})", window_title, app_name);

            Ok(ActiveWindow {
                title: window_title,
                app_name,
                bundle_id,
                process_id: Some(pid as u32),
            })
        }
    }

    /// Get window title using macOS Accessibility API
    #[cfg(target_os = "macos")]
    fn get_window_title_macos(&self, pid: i32) -> Result<String> {
        // This is a simplified implementation
        // For production, you'd need to use the Accessibility API (AXUIElement)
        // which requires additional dependencies and permissions

        // For now, we'll return a placeholder that indicates we need the app name
        Err(anyhow::anyhow!("Window title API not fully implemented"))
    }

    /// Windows implementation using Win32 API
    #[cfg(target_os = "windows")]
    fn get_active_window_windows(&self) -> Result<ActiveWindow> {
        use windows::Win32::Foundation::HWND;
        use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowTextW};

        unsafe {
            // Get foreground window handle
            let hwnd = GetForegroundWindow();

            if hwnd.0.is_null() {
                return Err(anyhow::anyhow!("No foreground window found"));
            }

            // Get window title
            let mut title_buffer = vec![0u16; 512];
            let title_len = GetWindowTextW(hwnd, &mut title_buffer);

            let title = if title_len > 0 {
                String::from_utf16_lossy(&title_buffer[0..title_len as usize])
            } else {
                String::from("Unknown Window")
            };

            // Get process name (simplified - could use GetWindowThreadProcessId + OpenProcess)
            let app_name = self.get_process_name_windows(hwnd).unwrap_or_else(|_| "Unknown".to_string());

            info!("Active window detected: {} ({})", title, app_name);

            Ok(ActiveWindow {
                title,
                app_name,
                bundle_id: None,
                process_id: None,
            })
        }
    }

    /// Get process name from window handle (Windows)
    #[cfg(target_os = "windows")]
    fn get_process_name_windows(&self, hwnd: windows::Win32::Foundation::HWND) -> Result<String> {
        use windows::Win32::UI::WindowsAndMessaging::GetWindowThreadProcessId;
        use windows::Win32::System::Threading::{OpenProcess, QueryFullProcessImageNameW, PROCESS_QUERY_LIMITED_INFORMATION, PROCESS_NAME_FORMAT};
        use windows::Win32::Foundation::{CloseHandle, MAX_PATH};

        unsafe {
            let mut process_id = 0u32;
            GetWindowThreadProcessId(hwnd, Some(&mut process_id));

            if process_id == 0 {
                return Err(anyhow::anyhow!("Failed to get process ID"));
            }

            let process_handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, process_id)?;

            let mut name_buffer = vec![0u16; MAX_PATH as usize];
            let mut name_len = name_buffer.len() as u32;

            let result = QueryFullProcessImageNameW(
                process_handle,
                PROCESS_NAME_FORMAT(0),
                windows::core::PWSTR(name_buffer.as_mut_ptr()),
                &mut name_len,
            );

            CloseHandle(process_handle)?;

            if result.is_ok() {
                let full_path = String::from_utf16_lossy(&name_buffer[0..name_len as usize]);
                // Extract just the executable name
                let app_name = full_path.split('\\').last().unwrap_or("Unknown").to_string();
                Ok(app_name)
            } else {
                Err(anyhow::anyhow!("Failed to query process name"))
            }
        }
    }

    /// Check if a specific application is active
    pub fn is_app_active(&self, app_name_or_bundle: &str) -> Result<bool> {
        let active = self.get_active_window()?;

        Ok(active.app_name.to_lowercase().contains(&app_name_or_bundle.to_lowercase()) ||
           active.bundle_id.as_ref().map_or(false, |bundle| bundle.to_lowercase().contains(&app_name_or_bundle.to_lowercase())))
    }

    /// Get active window with retry (useful for transient focus changes)
    pub fn get_active_window_stable(&self, retries: u32) -> Result<ActiveWindow> {
        let mut last_window: Option<ActiveWindow> = None;
        let mut stable_count = 0;

        for _ in 0..retries {
            match self.get_active_window() {
                Ok(window) => {
                    if let Some(ref last) = last_window {
                        if window.app_name == last.app_name && window.title == last.title {
                            stable_count += 1;
                            if stable_count >= 2 {
                                return Ok(window);
                            }
                        } else {
                            stable_count = 0;
                        }
                    }
                    last_window = Some(window);
                }
                Err(e) => {
                    error!("Failed to get active window: {}", e);
                }
            }

            std::thread::sleep(std::time::Duration::from_millis(100));
        }

        last_window.ok_or_else(|| anyhow::anyhow!("Failed to get stable active window"))
    }
}

/// Helper function to convert NSString to Rust String
#[cfg(target_os = "macos")]
unsafe fn nsstring_to_string(ns_string: cocoa::base::id) -> String {
    use cocoa::foundation::NSString;
    use std::ffi::CStr;

    if ns_string == cocoa::base::nil {
        return String::new();
    }

    let utf8_ptr = ns_string.UTF8String();
    if utf8_ptr.is_null() {
        return String::new();
    }

    CStr::from_ptr(utf8_ptr as *const i8)
        .to_string_lossy()
        .into_owned()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_service_creation() {
        let service = ActiveWindowService::new();
        assert!(service.is_ok());
    }

    #[test]
    #[ignore] // Run manually to test actual window detection
    fn test_get_active_window() {
        let service = ActiveWindowService::new().unwrap();
        let window = service.get_active_window();

        if let Ok(w) = window {
            println!("Active window: {} ({})", w.title, w.app_name);
            assert!(!w.app_name.is_empty());
        }
    }

    #[test]
    #[ignore] // Run manually
    fn test_stable_window_detection() {
        let service = ActiveWindowService::new().unwrap();
        let window = service.get_active_window_stable(5);

        assert!(window.is_ok());
    }
}
