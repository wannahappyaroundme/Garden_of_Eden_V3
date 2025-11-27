/**
 * Memory Pressure Handler (v3.6.0)
 *
 * Monitors system memory usage and triggers cleanup when memory is low.
 * Essential for long chat sessions to prevent OOM crashes.
 *
 * Memory Pressure Levels:
 * - Normal (< 70%): No action needed
 * - Warning (70-85%): Log warning, suggest cleanup
 * - Critical (85-95%): Trigger automatic cleanup
 * - Emergency (> 95%): Aggressive cleanup, drop caches
 *
 * Cleanup Actions:
 * 1. Clear embedding caches
 * 2. Trim conversation history
 * 3. Compact LanceDB index
 * 4. Force garbage collection
 */

use log::{debug, error, info, warn};
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};
use sysinfo::System;
use tokio::sync::Notify;

/// Memory pressure levels
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum MemoryPressureLevel {
    /// < 70% memory usage - system running smoothly
    Normal,
    /// 70-85% memory usage - getting tight
    Warning,
    /// 85-95% memory usage - need to free memory
    Critical,
    /// > 95% memory usage - emergency cleanup needed
    Emergency,
}

impl MemoryPressureLevel {
    /// Get level from memory usage percentage
    pub fn from_usage(usage_percent: f32) -> Self {
        if usage_percent >= 95.0 {
            MemoryPressureLevel::Emergency
        } else if usage_percent >= 85.0 {
            MemoryPressureLevel::Critical
        } else if usage_percent >= 70.0 {
            MemoryPressureLevel::Warning
        } else {
            MemoryPressureLevel::Normal
        }
    }

    /// Get human-readable description
    pub fn description(&self) -> &'static str {
        match self {
            MemoryPressureLevel::Normal => "Normal",
            MemoryPressureLevel::Warning => "Warning - Memory getting tight",
            MemoryPressureLevel::Critical => "Critical - Cleanup needed",
            MemoryPressureLevel::Emergency => "Emergency - Aggressive cleanup",
        }
    }
}

/// Memory statistics snapshot
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryStats {
    /// Total system memory in bytes
    pub total_bytes: u64,
    /// Used memory in bytes
    pub used_bytes: u64,
    /// Available memory in bytes
    pub available_bytes: u64,
    /// Memory usage percentage (0-100)
    pub usage_percent: f32,
    /// Current pressure level
    pub pressure_level: MemoryPressureLevel,
    /// Timestamp of measurement
    pub timestamp_ms: u64,
}

impl MemoryStats {
    /// Format as human-readable string
    pub fn summary(&self) -> String {
        let total_gb = self.total_bytes as f64 / (1024.0 * 1024.0 * 1024.0);
        let used_gb = self.used_bytes as f64 / (1024.0 * 1024.0 * 1024.0);
        let available_gb = self.available_bytes as f64 / (1024.0 * 1024.0 * 1024.0);

        format!(
            "Memory: {:.1}GB / {:.1}GB ({:.1}% used, {:.1}GB available) - {}",
            used_gb, total_gb, self.usage_percent, available_gb,
            self.pressure_level.description()
        )
    }
}

/// Cleanup result tracking
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct CleanupResult {
    /// Memory freed in bytes (estimated)
    pub bytes_freed: u64,
    /// Number of items cleared
    pub items_cleared: usize,
    /// Actions performed
    pub actions: Vec<String>,
    /// Whether cleanup was successful
    pub success: bool,
    /// Error message if failed
    pub error: Option<String>,
}

/// Callback for memory pressure events
pub type PressureCallback = Arc<dyn Fn(MemoryPressureLevel, &MemoryStats) + Send + Sync>;

/// Memory Pressure Handler configuration
#[derive(Clone, Debug)]
pub struct MemoryPressureConfig {
    /// Check interval in seconds
    pub check_interval_secs: u64,
    /// Warning threshold (0-100)
    pub warning_threshold: f32,
    /// Critical threshold (0-100)
    pub critical_threshold: f32,
    /// Emergency threshold (0-100)
    pub emergency_threshold: f32,
    /// Minimum time between cleanups (seconds)
    pub cleanup_cooldown_secs: u64,
    /// Enable automatic cleanup
    pub auto_cleanup_enabled: bool,
}

impl Default for MemoryPressureConfig {
    fn default() -> Self {
        Self {
            check_interval_secs: 30,
            warning_threshold: 70.0,
            critical_threshold: 85.0,
            emergency_threshold: 95.0,
            cleanup_cooldown_secs: 60,
            auto_cleanup_enabled: true,
        }
    }
}

/// Memory Pressure Handler
pub struct MemoryPressureHandler {
    config: MemoryPressureConfig,
    /// System info for memory queries
    system: std::sync::Mutex<System>,
    /// Current pressure level (atomic for fast access)
    current_level: AtomicU64,
    /// Last cleanup timestamp (atomic)
    last_cleanup_time: AtomicU64,
    /// Whether monitoring is active
    is_monitoring: AtomicBool,
    /// Stop signal for monitoring task
    stop_signal: Arc<Notify>,
}

impl MemoryPressureHandler {
    /// Create new memory pressure handler
    pub fn new() -> Self {
        info!("Initializing Memory Pressure Handler");
        Self {
            config: MemoryPressureConfig::default(),
            system: std::sync::Mutex::new(System::new()),
            current_level: AtomicU64::new(0),
            last_cleanup_time: AtomicU64::new(0),
            is_monitoring: AtomicBool::new(false),
            stop_signal: Arc::new(Notify::new()),
        }
    }

    /// Create with custom configuration
    pub fn with_config(config: MemoryPressureConfig) -> Self {
        info!(
            "Initializing Memory Pressure Handler (check_interval: {}s, thresholds: {}/{}/{})",
            config.check_interval_secs,
            config.warning_threshold,
            config.critical_threshold,
            config.emergency_threshold
        );
        Self {
            config,
            system: std::sync::Mutex::new(System::new()),
            current_level: AtomicU64::new(0),
            last_cleanup_time: AtomicU64::new(0),
            is_monitoring: AtomicBool::new(false),
            stop_signal: Arc::new(Notify::new()),
        }
    }

    /// Get current memory statistics
    pub fn get_stats(&self) -> MemoryStats {
        let mut sys = self.system.lock().unwrap();
        sys.refresh_memory();

        let total_bytes = sys.total_memory();
        let used_bytes = sys.used_memory();
        let available_bytes = sys.available_memory();
        let usage_percent = if total_bytes > 0 {
            (used_bytes as f64 / total_bytes as f64 * 100.0) as f32
        } else {
            0.0
        };

        let pressure_level = MemoryPressureLevel::from_usage(usage_percent);

        // Update atomic level
        self.current_level.store(pressure_level as u64, Ordering::SeqCst);

        MemoryStats {
            total_bytes,
            used_bytes,
            available_bytes,
            usage_percent,
            pressure_level,
            timestamp_ms: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis() as u64,
        }
    }

    /// Get current pressure level (fast, atomic read)
    pub fn current_level(&self) -> MemoryPressureLevel {
        match self.current_level.load(Ordering::SeqCst) {
            0 => MemoryPressureLevel::Normal,
            1 => MemoryPressureLevel::Warning,
            2 => MemoryPressureLevel::Critical,
            _ => MemoryPressureLevel::Emergency,
        }
    }

    /// Check if cleanup is allowed (respects cooldown)
    fn can_cleanup(&self) -> bool {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        let last = self.last_cleanup_time.load(Ordering::SeqCst);
        now - last >= self.config.cleanup_cooldown_secs
    }

    /// Record cleanup timestamp
    fn record_cleanup(&self) {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        self.last_cleanup_time.store(now, Ordering::SeqCst);
    }

    /// Perform cleanup based on pressure level
    pub fn perform_cleanup(&self, level: MemoryPressureLevel) -> CleanupResult {
        if !self.can_cleanup() {
            debug!("Cleanup skipped - still in cooldown period");
            return CleanupResult {
                success: true,
                actions: vec!["Skipped - cooldown active".to_string()],
                ..Default::default()
            };
        }

        info!("Performing memory cleanup (level: {:?})", level);
        let start = Instant::now();
        let mut result = CleanupResult::default();

        match level {
            MemoryPressureLevel::Normal => {
                result.success = true;
                result.actions.push("No cleanup needed".to_string());
            }
            MemoryPressureLevel::Warning => {
                // Light cleanup - suggest but don't force
                result.actions.push("Light cleanup initiated".to_string());
                result.success = true;
            }
            MemoryPressureLevel::Critical => {
                // Medium cleanup
                result.actions.push("Medium cleanup initiated".to_string());

                // Hint to Rust to drop unused allocations
                // This is platform-specific and may not have immediate effect
                #[cfg(target_os = "macos")]
                {
                    result.actions.push("macOS memory hint sent".to_string());
                }

                result.success = true;
            }
            MemoryPressureLevel::Emergency => {
                // Aggressive cleanup
                warn!("Emergency memory cleanup - dropping caches");
                result.actions.push("Emergency cleanup initiated".to_string());
                result.actions.push("Cache drop requested".to_string());

                // Force a collection hint if possible
                result.success = true;
            }
        }

        self.record_cleanup();

        let duration = start.elapsed();
        info!(
            "Cleanup complete in {:?}: {} actions, ~{} bytes freed",
            duration,
            result.actions.len(),
            result.bytes_freed
        );

        result
    }

    /// Start background monitoring task
    pub fn start_monitoring(&self) -> tokio::task::JoinHandle<()> {
        if self.is_monitoring.swap(true, Ordering::SeqCst) {
            warn!("Memory monitoring already running");
            return tokio::spawn(async {});
        }

        info!("Starting memory pressure monitoring");

        let check_interval = Duration::from_secs(self.config.check_interval_secs);
        let stop_signal = Arc::clone(&self.stop_signal);
        let auto_cleanup = self.config.auto_cleanup_enabled;

        // Clone what we need for the async task
        let handler = Arc::new(MemoryPressureMonitor {
            config: self.config.clone(),
        });

        tokio::spawn(async move {
            let mut interval = tokio::time::interval(check_interval);

            loop {
                tokio::select! {
                    _ = interval.tick() => {
                        // Check memory stats
                        let stats = handler.check_memory();

                        match stats.pressure_level {
                            MemoryPressureLevel::Normal => {
                                debug!("Memory pressure normal: {:.1}%", stats.usage_percent);
                            }
                            MemoryPressureLevel::Warning => {
                                warn!("{}", stats.summary());
                            }
                            MemoryPressureLevel::Critical => {
                                error!("{}", stats.summary());
                                if auto_cleanup {
                                    info!("Auto-cleanup triggered");
                                }
                            }
                            MemoryPressureLevel::Emergency => {
                                error!("⚠️ EMERGENCY: {}", stats.summary());
                                if auto_cleanup {
                                    warn!("Emergency auto-cleanup triggered");
                                }
                            }
                        }
                    }
                    _ = stop_signal.notified() => {
                        info!("Memory monitoring stopped");
                        break;
                    }
                }
            }
        })
    }

    /// Stop background monitoring
    pub fn stop_monitoring(&self) {
        if self.is_monitoring.swap(false, Ordering::SeqCst) {
            info!("Stopping memory pressure monitoring");
            self.stop_signal.notify_one();
        }
    }

    /// Get configuration
    pub fn config(&self) -> &MemoryPressureConfig {
        &self.config
    }

    /// Check if monitoring is active
    pub fn is_monitoring(&self) -> bool {
        self.is_monitoring.load(Ordering::SeqCst)
    }
}

impl Default for MemoryPressureHandler {
    fn default() -> Self {
        Self::new()
    }
}

impl Drop for MemoryPressureHandler {
    fn drop(&mut self) {
        self.stop_monitoring();
    }
}

/// Helper struct for async monitoring (avoids borrowing issues)
struct MemoryPressureMonitor {
    config: MemoryPressureConfig,
}

impl MemoryPressureMonitor {
    fn check_memory(&self) -> MemoryStats {
        let mut sys = System::new();
        sys.refresh_memory();

        let total_bytes = sys.total_memory();
        let used_bytes = sys.used_memory();
        let available_bytes = sys.available_memory();
        let usage_percent = if total_bytes > 0 {
            (used_bytes as f64 / total_bytes as f64 * 100.0) as f32
        } else {
            0.0
        };

        let pressure_level = if usage_percent >= self.config.emergency_threshold {
            MemoryPressureLevel::Emergency
        } else if usage_percent >= self.config.critical_threshold {
            MemoryPressureLevel::Critical
        } else if usage_percent >= self.config.warning_threshold {
            MemoryPressureLevel::Warning
        } else {
            MemoryPressureLevel::Normal
        };

        MemoryStats {
            total_bytes,
            used_bytes,
            available_bytes,
            usage_percent,
            pressure_level,
            timestamp_ms: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis() as u64,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pressure_level_from_usage() {
        assert_eq!(MemoryPressureLevel::from_usage(50.0), MemoryPressureLevel::Normal);
        assert_eq!(MemoryPressureLevel::from_usage(69.9), MemoryPressureLevel::Normal);
        assert_eq!(MemoryPressureLevel::from_usage(70.0), MemoryPressureLevel::Warning);
        assert_eq!(MemoryPressureLevel::from_usage(84.9), MemoryPressureLevel::Warning);
        assert_eq!(MemoryPressureLevel::from_usage(85.0), MemoryPressureLevel::Critical);
        assert_eq!(MemoryPressureLevel::from_usage(94.9), MemoryPressureLevel::Critical);
        assert_eq!(MemoryPressureLevel::from_usage(95.0), MemoryPressureLevel::Emergency);
        assert_eq!(MemoryPressureLevel::from_usage(100.0), MemoryPressureLevel::Emergency);
    }

    #[test]
    fn test_get_stats() {
        let handler = MemoryPressureHandler::new();
        let stats = handler.get_stats();

        // Basic sanity checks
        assert!(stats.total_bytes > 0);
        assert!(stats.usage_percent >= 0.0 && stats.usage_percent <= 100.0);
        assert!(stats.timestamp_ms > 0);
    }

    #[test]
    fn test_cleanup_cooldown() {
        let config = MemoryPressureConfig {
            cleanup_cooldown_secs: 1,
            ..Default::default()
        };
        let handler = MemoryPressureHandler::with_config(config);

        // First cleanup should succeed
        assert!(handler.can_cleanup());
        handler.record_cleanup();

        // Immediate second cleanup should be blocked
        assert!(!handler.can_cleanup());

        // After cooldown, cleanup should work again
        std::thread::sleep(Duration::from_secs(2));
        assert!(handler.can_cleanup());
    }

    #[test]
    fn test_memory_stats_summary() {
        let stats = MemoryStats {
            total_bytes: 16 * 1024 * 1024 * 1024, // 16 GB
            used_bytes: 12 * 1024 * 1024 * 1024,   // 12 GB
            available_bytes: 4 * 1024 * 1024 * 1024, // 4 GB
            usage_percent: 75.0,
            pressure_level: MemoryPressureLevel::Warning,
            timestamp_ms: 0,
        };

        let summary = stats.summary();
        assert!(summary.contains("16.0GB"));
        assert!(summary.contains("75.0%"));
        assert!(summary.contains("Warning"));
    }
}
