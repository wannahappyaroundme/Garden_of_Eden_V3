/**
 * Episodic Memory Commands (v3.6.0)
 *
 * Tauri commands for Memory Visualization page:
 * - Get recent episodes
 * - Get memory stats
 * - Search memories
 * - Export/Import memories
 * - Delete episodes
 */

use crate::app_state::AppState;
use serde::{Deserialize, Serialize};
use tauri::{command, State};

/// Episode response for frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EpisodeResponse {
    pub id: String,
    pub user_message: String,
    pub ai_response: String,
    pub satisfaction: f32,
    pub created_at: i64,
    pub access_count: i32,
    pub importance: f32,
}

/// Memory statistics response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryStatsResponse {
    pub total_memories: i64,
    pub average_satisfaction: f64,
    pub most_accessed_topic: Option<String>,
}

/// Get recent episodes for Memory Visualization
#[command]
pub async fn episodic_get_recent(
    state: State<'_, AppState>,
    limit: Option<usize>,
) -> Result<Vec<EpisodeResponse>, String> {
    let limit = limit.unwrap_or(50);
    log::info!("Command: episodic_get_recent (limit: {})", limit);

    let db = state.db().lock()
        .map_err(|e| format!("Failed to lock database: {}", e))?;
    let conn = db.conn();

    let mut stmt = conn.prepare(
        "SELECT id, user_message, ai_response, satisfaction, created_at, access_count, importance
         FROM episodic_memory
         ORDER BY created_at DESC
         LIMIT ?1"
    ).map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let episodes: Vec<EpisodeResponse> = stmt.query_map(
        [limit as i64],
        |row| {
            Ok(EpisodeResponse {
                id: row.get(0)?,
                user_message: row.get(1)?,
                ai_response: row.get(2)?,
                satisfaction: row.get(3)?,
                created_at: row.get(4)?,
                access_count: row.get(5)?,
                importance: row.get(6)?,
            })
        }
    )
    .map_err(|e| format!("Failed to query: {}", e))?
    .filter_map(|r| r.ok())
    .collect();

    Ok(episodes)
}

/// Get memory statistics
#[command]
pub async fn episodic_get_stats(
    state: State<'_, AppState>,
) -> Result<MemoryStatsResponse, String> {
    log::info!("Command: episodic_get_stats");

    let db = state.db().lock()
        .map_err(|e| format!("Failed to lock database: {}", e))?;
    let conn = db.conn();

    // Get total count
    let total_memories: i64 = conn.query_row(
        "SELECT COUNT(*) FROM episodic_memory",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    // Get average satisfaction
    let average_satisfaction: f64 = conn.query_row(
        "SELECT AVG(satisfaction) FROM episodic_memory",
        [],
        |row| row.get::<_, Option<f64>>(0),
    ).unwrap_or(None).unwrap_or(0.0);

    // Get most accessed topic (based on user_message with highest access_count)
    let most_accessed_topic: Option<String> = conn.query_row(
        "SELECT user_message FROM episodic_memory ORDER BY access_count DESC LIMIT 1",
        [],
        |row| row.get(0),
    ).ok();

    // Truncate topic if too long
    let most_accessed_topic = most_accessed_topic.map(|t| {
        if t.len() > 50 {
            format!("{}...", &t[..47])
        } else {
            t
        }
    });

    Ok(MemoryStatsResponse {
        total_memories,
        average_satisfaction,
        most_accessed_topic,
    })
}

/// Search memories by query
#[command]
pub async fn episodic_search(
    state: State<'_, AppState>,
    query: String,
    limit: Option<usize>,
) -> Result<Vec<EpisodeResponse>, String> {
    let limit = limit.unwrap_or(20);
    log::info!("Command: episodic_search (query: {}, limit: {})", query, limit);

    // Simple text search (semantic search requires embedding service)
    let db = state.db().lock()
        .map_err(|e| format!("Failed to lock database: {}", e))?;
    let conn = db.conn();

    let pattern = format!("%{}%", query);
    let mut stmt = conn.prepare(
        "SELECT id, user_message, ai_response, satisfaction, created_at, access_count, importance
         FROM episodic_memory
         WHERE user_message LIKE ?1 OR ai_response LIKE ?1
         ORDER BY created_at DESC
         LIMIT ?2"
    ).map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let episodes: Vec<EpisodeResponse> = stmt.query_map(
        rusqlite::params![pattern, limit as i64],
        |row| {
            Ok(EpisodeResponse {
                id: row.get(0)?,
                user_message: row.get(1)?,
                ai_response: row.get(2)?,
                satisfaction: row.get(3)?,
                created_at: row.get(4)?,
                access_count: row.get(5)?,
                importance: row.get(6)?,
            })
        }
    )
    .map_err(|e| format!("Failed to query: {}", e))?
    .filter_map(|r| r.ok())
    .collect();

    Ok(episodes)
}

/// Export memories to JSON
#[command]
pub async fn episodic_export(
    state: State<'_, AppState>,
    limit: Option<usize>,
) -> Result<Vec<EpisodeResponse>, String> {
    let limit = limit.unwrap_or(1000);
    log::info!("Command: episodic_export (limit: {})", limit);

    let db = state.db().lock()
        .map_err(|e| format!("Failed to lock database: {}", e))?;
    let conn = db.conn();

    let mut stmt = conn.prepare(
        "SELECT id, user_message, ai_response, satisfaction, created_at, access_count, importance
         FROM episodic_memory
         ORDER BY created_at DESC
         LIMIT ?1"
    ).map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let episodes: Vec<EpisodeResponse> = stmt.query_map(
        [limit as i64],
        |row| {
            Ok(EpisodeResponse {
                id: row.get(0)?,
                user_message: row.get(1)?,
                ai_response: row.get(2)?,
                satisfaction: row.get(3)?,
                created_at: row.get(4)?,
                access_count: row.get(5)?,
                importance: row.get(6)?,
            })
        }
    )
    .map_err(|e| format!("Failed to query: {}", e))?
    .filter_map(|r| r.ok())
    .collect();

    Ok(episodes)
}

/// Import memories from JSON
#[command]
pub async fn episodic_import(
    state: State<'_, AppState>,
    episodes: Vec<EpisodeResponse>,
) -> Result<usize, String> {
    log::info!("Command: episodic_import ({} episodes)", episodes.len());

    let db = state.db().lock()
        .map_err(|e| format!("Failed to lock database: {}", e))?;
    let conn = db.conn();

    let mut imported = 0;
    for episode in episodes {
        // Check if episode already exists
        let exists: bool = conn.query_row(
            "SELECT 1 FROM episodic_memory WHERE id = ?1",
            [&episode.id],
            |_| Ok(true),
        ).unwrap_or(false);

        if !exists {
            conn.execute(
                "INSERT INTO episodic_memory (id, user_message, ai_response, satisfaction, created_at, access_count, importance)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                rusqlite::params![
                    episode.id,
                    episode.user_message,
                    episode.ai_response,
                    episode.satisfaction,
                    episode.created_at,
                    episode.access_count,
                    episode.importance,
                ],
            ).map_err(|e| format!("Failed to import episode: {}", e))?;
            imported += 1;
        }
    }

    log::info!("Imported {} new episodes", imported);
    Ok(imported)
}

/// Delete an episode
#[command]
pub async fn episodic_delete(
    state: State<'_, AppState>,
    episode_id: String,
) -> Result<bool, String> {
    log::info!("Command: episodic_delete (id: {})", episode_id);

    let db = state.db().lock()
        .map_err(|e| format!("Failed to lock database: {}", e))?;
    let conn = db.conn();

    let deleted = conn.execute(
        "DELETE FROM episodic_memory WHERE id = ?1",
        [&episode_id],
    ).map_err(|e| format!("Failed to delete episode: {}", e))?;

    Ok(deleted > 0)
}
