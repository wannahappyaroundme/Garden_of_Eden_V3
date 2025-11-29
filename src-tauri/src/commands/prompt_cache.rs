use crate::AppState;
use log::info;
use tauri::{command, State};

/// Check if prompt is in cache
#[command]
pub fn prompt_cache_contains(state: State<'_, AppState>, prompt: String) -> Result<bool, String> {
    let cache = state.prompt_cache.lock().unwrap();
    Ok(cache.contains(&prompt))
}

/// Get cached prompt
#[command]
pub fn prompt_cache_get(state: State<'_, AppState>, prompt: String) -> Result<serde_json::Value, String> {
    let cache = state.prompt_cache.lock().unwrap();

    match cache.get(&prompt) {
        Some(entry) => Ok(serde_json::json!({
            "found": true,
            "prompt_hash": entry.prompt_hash,
            "cached_at": entry.cached_at,
            "last_accessed": entry.last_accessed,
            "access_count": entry.access_count,
            "size_bytes": entry.size_bytes,
        })),
        None => Ok(serde_json::json!({
            "found": false,
        })),
    }
}

/// Put prompt in cache
#[command]
pub fn prompt_cache_put(state: State<'_, AppState>, prompt: String) -> Result<String, String> {
    info!("Command: prompt_cache_put");
    let cache = state.prompt_cache.lock().unwrap();
    let hash = cache.put(&prompt);
    Ok(hash)
}

/// Clear expired cache entries
#[command]
pub fn prompt_cache_clear_expired(state: State<'_, AppState>) -> Result<usize, String> {
    info!("Command: prompt_cache_clear_expired");
    let cache = state.prompt_cache.lock().unwrap();
    let removed = cache.clear_expired();
    Ok(removed)
}

/// Clear all cache entries
#[command]
pub fn prompt_cache_clear_all(state: State<'_, AppState>) -> Result<(), String> {
    info!("Command: prompt_cache_clear_all");
    let cache = state.prompt_cache.lock().unwrap();
    cache.clear_all();
    Ok(())
}

/// Get cache statistics
#[command]
pub fn prompt_cache_stats(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    info!("Command: prompt_cache_stats");
    let cache = state.prompt_cache.lock().unwrap();
    let stats = cache.stats();

    Ok(serde_json::json!({
        "total_hits": stats.total_hits,
        "total_misses": stats.total_misses,
        "total_evictions": stats.total_evictions,
        "current_entries": stats.current_entries,
        "total_size_bytes": stats.total_size_bytes,
        "hit_rate": cache.hit_rate(),
    }))
}

/// Get cache hit rate
#[command]
pub fn prompt_cache_hit_rate(state: State<'_, AppState>) -> Result<f32, String> {
    let cache = state.prompt_cache.lock().unwrap();
    Ok(cache.hit_rate())
}

/// Get all cached entries (for debugging)
#[command]
pub fn prompt_cache_get_all(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    info!("Command: prompt_cache_get_all");
    let cache = state.prompt_cache.lock().unwrap();
    let entries = cache.get_all_entries();

    let json_entries: Vec<serde_json::Value> = entries
        .into_iter()
        .map(|e| {
            serde_json::json!({
                "prompt_hash": e.prompt_hash,
                "prompt_text": e.prompt_text,
                "cached_at": e.cached_at,
                "last_accessed": e.last_accessed,
                "access_count": e.access_count,
                "size_bytes": e.size_bytes,
            })
        })
        .collect();

    Ok(serde_json::json!({
        "entries": json_entries,
        "total": json_entries.len(),
    }))
}

/// Get cache configuration
#[command]
pub fn prompt_cache_get_config(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    info!("Command: prompt_cache_get_config");
    let cache = state.prompt_cache.lock().unwrap();
    let config = cache.config();

    Ok(serde_json::json!({
        "max_entries": config.max_entries,
        "ttl_seconds": config.ttl_seconds,
        "enable_eviction": config.enable_eviction,
    }))
}

/// Manually trigger LRU eviction
#[command]
pub fn prompt_cache_evict_lru(state: State<'_, AppState>) -> Result<(), String> {
    info!("Command: prompt_cache_evict_lru");
    let cache = state.prompt_cache.lock().unwrap();
    cache.evict_lru();
    Ok(())
}
