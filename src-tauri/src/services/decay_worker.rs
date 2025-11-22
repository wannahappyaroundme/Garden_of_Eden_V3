/**
 * Phase 3: Memory Decay Worker (v3.8.0)
 *
 * Background worker that runs every 24 hours to update memory retention scores.
 *
 * Features:
 * - Automated decay updates using Ebbinghaus curve
 * - Configurable interval (default: 24 hours)
 * - Optional automatic pruning of very low retention memories (<5%)
 * - Graceful error handling with logging
 */

use crate::services::temporal_memory::TemporalMemoryService;
use std::sync::Arc;
use std::time::Duration;
use std::thread::JoinHandle;

/// Decay Worker
///
/// Spawns a background task that periodically updates memory retention scores.
pub struct DecayWorker {
    handle: JoinHandle<()>,
}

impl DecayWorker {
    /// Start the decay worker
    ///
    /// # Arguments
    /// * `temporal_service` - Arc reference to TemporalMemoryService
    /// * `enable_auto_prune` - Whether to automatically prune very low retention memories (<5%)
    ///
    /// # Returns
    /// DecayWorker instance with background task handle
    pub fn start(
        temporal_service: Arc<TemporalMemoryService>,
        enable_auto_prune: bool,
    ) -> Self {
        let handle = std::thread::spawn(move || {
            // Create a new Tokio runtime for this background thread
            let rt = tokio::runtime::Runtime::new().expect("Failed to create Tokio runtime for DecayWorker");

            rt.block_on(async move {
            // Get interval from config
            let interval_hours = temporal_service.get_config().decay_worker_interval_hours;

            let mut interval = tokio::time::interval(
                Duration::from_secs(interval_hours * 60 * 60)
            );

            log::info!(
                "Memory decay worker started (interval: {}h, auto-prune: {})",
                interval_hours,
                enable_auto_prune
            );

            loop {
                interval.tick().await;

                log::info!("Running memory decay update...");

                // Update all retention scores
                match temporal_service.update_all_retention_scores() {
                    Ok(count) => {
                        log::info!("✓ Updated {} memory retention scores", count);

                        // Optional: Prune very low retention memories
                        if enable_auto_prune {
                            match temporal_service.prune_low_retention_memories(0.05) {
                                Ok(pruned) if pruned > 0 => {
                                    log::info!("✓ Pruned {} low-retention memories (<5%)", pruned);
                                }
                                Ok(_) => {
                                    log::debug!("No low-retention memories to prune");
                                }
                                Err(e) => {
                                    log::error!("Failed to prune low-retention memories: {}", e);
                                }
                            }
                        }

                        // Log retention statistics
                        match temporal_service.get_retention_stats() {
                            Ok(stats) => {
                                log::info!(
                                    "Memory stats: {} total ({} pinned), avg retention: {:.2}%, high/med/low: {}/{}/{}",
                                    stats.total_memories,
                                    stats.pinned_memories,
                                    stats.average_retention * 100.0,
                                    stats.high_retention,
                                    stats.medium_retention,
                                    stats.low_retention
                                );
                            }
                            Err(e) => {
                                log::error!("Failed to get retention stats: {}", e);
                            }
                        }
                    }
                    Err(e) => {
                        log::error!("Memory decay update failed: {}", e);
                    }
                }
            }
            })  // End of rt.block_on(async move {})
        });  // End of std::thread::spawn

        Self { handle }
    }

    /// Stop the decay worker
    ///
    /// Note: Thread-based worker cannot be aborted. It will run until completion.
    pub fn stop(self) {
        log::info!("Memory decay worker stop requested (thread will finish current cycle)");
        // Join the thread to ensure clean shutdown
        let _ = self.handle.join();
    }

    /// Check if worker is still running
    pub fn is_running(&self) -> bool {
        !self.handle.is_finished()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::Database;
    use std::sync::Mutex;

    #[tokio::test]
    async fn test_decay_worker_starts() {
        let db = Arc::new(Mutex::new(Database::new().unwrap()));
        let temporal = Arc::new(TemporalMemoryService::new(db).unwrap());

        let worker = DecayWorker::start(temporal, false);

        // Worker should be running
        assert!(worker.is_running());

        // Stop worker
        worker.stop();

        // Give it a moment to stop
        tokio::time::sleep(Duration::from_millis(100)).await;
    }
}
