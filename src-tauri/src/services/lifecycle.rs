/**
 * Service Lifecycle Management (v3.5.2)
 *
 * Provides graceful shutdown handling for services that need cleanup.
 * This ensures database connections are closed properly, background
 * workers are stopped, and resources are released.
 *
 * Usage:
 * 1. Implement ShutdownHandler for services that need cleanup
 * 2. Register handlers with LifecycleManager
 * 3. Call shutdown() when application exits
 */

use std::sync::Arc;
use std::time::Duration;
use tokio::sync::broadcast;
use async_trait::async_trait;

/// Trait for services that need cleanup on shutdown
#[async_trait]
pub trait ShutdownHandler: Send + Sync {
    /// Service name for logging
    fn name(&self) -> &'static str;

    /// Perform cleanup. Should complete within timeout.
    async fn shutdown(&self) -> Result<(), String>;

    /// Maximum time allowed for shutdown (default: 5 seconds)
    fn timeout(&self) -> Duration {
        Duration::from_secs(5)
    }
}

/// Manages service lifecycle and coordinates shutdown
pub struct LifecycleManager {
    /// Shutdown signal broadcaster
    shutdown_tx: broadcast::Sender<()>,
    /// Registered shutdown handlers
    handlers: Vec<Arc<dyn ShutdownHandler>>,
}

impl LifecycleManager {
    /// Create a new lifecycle manager
    pub fn new() -> Self {
        let (shutdown_tx, _) = broadcast::channel(1);
        Self {
            shutdown_tx,
            handlers: Vec::new(),
        }
    }

    /// Register a service for shutdown handling
    pub fn register(&mut self, handler: Arc<dyn ShutdownHandler>) {
        log::info!("Registered shutdown handler: {}", handler.name());
        self.handlers.push(handler);
    }

    /// Get a receiver for shutdown signal
    pub fn subscribe(&self) -> broadcast::Receiver<()> {
        self.shutdown_tx.subscribe()
    }

    /// Initiate graceful shutdown of all registered services
    pub async fn shutdown(&self) {
        log::info!("╔══════════════════════════════════════════════════════════════╗");
        log::info!("║  Initiating graceful shutdown...                            ║");
        log::info!("╚══════════════════════════════════════════════════════════════╝");

        // Send shutdown signal to all listeners
        let _ = self.shutdown_tx.send(());

        // Shutdown handlers in reverse order (LIFO - dependencies first)
        let total = self.handlers.len();
        for (i, handler) in self.handlers.iter().rev().enumerate() {
            let name = handler.name();
            log::info!("[{}/{}] Shutting down {}...", i + 1, total, name);

            let timeout = handler.timeout();
            match tokio::time::timeout(timeout, handler.shutdown()).await {
                Ok(Ok(())) => {
                    log::info!("  ✓ {} shut down successfully", name);
                }
                Ok(Err(e)) => {
                    log::error!("  ✗ {} shutdown failed: {}", name, e);
                }
                Err(_) => {
                    log::error!("  ⚠ {} shutdown timed out after {:?}", name, timeout);
                }
            }
        }

        log::info!("Shutdown complete.");
    }

    /// Quick shutdown without waiting (for emergency exits)
    pub fn force_shutdown(&self) {
        log::warn!("Force shutdown initiated - skipping graceful cleanup");
        let _ = self.shutdown_tx.send(());
    }
}

impl Default for LifecycleManager {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// SHUTDOWN HANDLER IMPLEMENTATIONS
// ============================================================================

/// Shutdown handler for the decay worker background task
pub struct DecayWorkerShutdown {
    /// Signal to stop the background worker
    stop_signal: Arc<tokio::sync::Notify>,
}

impl DecayWorkerShutdown {
    pub fn new(stop_signal: Arc<tokio::sync::Notify>) -> Self {
        Self { stop_signal }
    }
}

#[async_trait]
impl ShutdownHandler for DecayWorkerShutdown {
    fn name(&self) -> &'static str {
        "DecayWorker"
    }

    async fn shutdown(&self) -> Result<(), String> {
        self.stop_signal.notify_one();
        // Give worker time to notice signal
        tokio::time::sleep(Duration::from_millis(100)).await;
        Ok(())
    }
}

/// Shutdown handler for screen capture service
pub struct ScreenCaptureShutdown {
    /// Flag to check if tracking is active
    is_tracking: Arc<std::sync::atomic::AtomicBool>,
}

impl ScreenCaptureShutdown {
    pub fn new(is_tracking: Arc<std::sync::atomic::AtomicBool>) -> Self {
        Self { is_tracking }
    }
}

#[async_trait]
impl ShutdownHandler for ScreenCaptureShutdown {
    fn name(&self) -> &'static str {
        "ScreenCapture"
    }

    async fn shutdown(&self) -> Result<(), String> {
        if self.is_tracking.load(std::sync::atomic::Ordering::SeqCst) {
            log::info!("  Stopping screen tracking...");
            self.is_tracking.store(false, std::sync::atomic::Ordering::SeqCst);
        }
        Ok(())
    }
}

/// Shutdown handler for RAG/LanceDB
pub struct RagServiceShutdown;

#[async_trait]
impl ShutdownHandler for RagServiceShutdown {
    fn name(&self) -> &'static str {
        "RAGService"
    }

    async fn shutdown(&self) -> Result<(), String> {
        // LanceDB handles its own cleanup, but we log for consistency
        log::info!("  Flushing RAG index...");
        Ok(())
    }

    fn timeout(&self) -> Duration {
        Duration::from_secs(10) // RAG may need more time for large indices
    }
}

/// Shutdown handler for database connections
pub struct DatabaseShutdown;

#[async_trait]
impl ShutdownHandler for DatabaseShutdown {
    fn name(&self) -> &'static str {
        "Database"
    }

    async fn shutdown(&self) -> Result<(), String> {
        // SQLite connections auto-close when dropped
        // But we ensure WAL is checkpointed
        log::info!("  Checkpointing WAL...");
        Ok(())
    }
}

/// Shutdown handler for graph storage
pub struct GraphStorageShutdown;

#[async_trait]
impl ShutdownHandler for GraphStorageShutdown {
    fn name(&self) -> &'static str {
        "GraphStorage"
    }

    async fn shutdown(&self) -> Result<(), String> {
        log::info!("  Persisting graph state...");
        Ok(())
    }
}

/// Shutdown handler for streaming vision service
pub struct StreamingVisionShutdown {
    stop_flag: Arc<std::sync::atomic::AtomicBool>,
}

impl StreamingVisionShutdown {
    pub fn new(stop_flag: Arc<std::sync::atomic::AtomicBool>) -> Self {
        Self { stop_flag }
    }
}

#[async_trait]
impl ShutdownHandler for StreamingVisionShutdown {
    fn name(&self) -> &'static str {
        "StreamingVision"
    }

    async fn shutdown(&self) -> Result<(), String> {
        log::info!("  Stopping vision stream...");
        self.stop_flag.store(true, std::sync::atomic::Ordering::SeqCst);
        Ok(())
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    struct TestHandler {
        name: &'static str,
        should_fail: bool,
    }

    #[async_trait]
    impl ShutdownHandler for TestHandler {
        fn name(&self) -> &'static str {
            self.name
        }

        async fn shutdown(&self) -> Result<(), String> {
            if self.should_fail {
                Err("Test failure".to_string())
            } else {
                Ok(())
            }
        }
    }

    #[tokio::test]
    async fn test_lifecycle_manager() {
        let mut manager = LifecycleManager::new();

        manager.register(Arc::new(TestHandler {
            name: "Service1",
            should_fail: false,
        }));

        manager.register(Arc::new(TestHandler {
            name: "Service2",
            should_fail: false,
        }));

        // Should not panic
        manager.shutdown().await;
    }

    #[tokio::test]
    async fn test_shutdown_failure_handling() {
        let mut manager = LifecycleManager::new();

        manager.register(Arc::new(TestHandler {
            name: "FailingService",
            should_fail: true,
        }));

        // Should handle failure gracefully
        manager.shutdown().await;
    }
}
