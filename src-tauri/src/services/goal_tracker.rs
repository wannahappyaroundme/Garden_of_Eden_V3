//! Phase 5 Stage 4: Goal Tracker Service (v3.9.0)
//!
//! Long-term goal monitoring and progress tracking with automatic milestone detection.
//!
//! Features:
//! - Goal creation and management
//! - Milestone tracking
//! - Automatic progress detection
//! - Proactive reminders
//! - Achievement recognition
//! - Goal-oriented context retrieval

#![allow(dead_code)]  // Phase 5: Goal tracking (Stage 4)

use crate::database::Database;
use crate::services::ollama;
use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

/// Goal status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum GoalStatus {
    Active,
    Paused,
    Completed,
    Abandoned,
}

/// Goal category
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum GoalCategory {
    Learning,       // Learn a new skill
    Project,        // Complete a project
    Habit,          // Build a habit
    Career,         // Career advancement
    Personal,       // Personal development
    Health,         // Health & fitness
    Creative,       // Creative pursuits
    Other,
}

/// Goal time frame
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum GoalTimeFrame {
    Short,   // < 1 month
    Medium,  // 1-6 months
    Long,    // > 6 months
}

/// Goal
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Goal {
    pub id: String,
    pub title: String,
    pub description: String,
    pub category: GoalCategory,
    pub status: GoalStatus,
    pub time_frame: GoalTimeFrame,
    pub target_date: Option<i64>, // Unix timestamp
    pub progress_percentage: f32,
    pub milestones: Vec<Milestone>,
    pub success_criteria: Vec<String>,
    pub obstacles: Vec<String>,
    pub created_at: i64,
    pub updated_at: i64,
    pub completed_at: Option<i64>,
    pub last_check_in: Option<i64>,
    pub tags: Vec<String>,
}

/// Milestone within a goal
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Milestone {
    pub id: String,
    pub goal_id: String,
    pub title: String,
    pub description: String,
    pub target_date: Option<i64>,
    pub completed: bool,
    pub completed_at: Option<i64>,
    pub order: i32, // For sequential milestones
}

/// Progress update
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProgressUpdate {
    pub goal_id: String,
    pub update_type: UpdateType,
    pub description: String,
    pub progress_delta: f32, // Change in progress percentage
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum UpdateType {
    Progress,       // General progress
    Milestone,      // Milestone achieved
    Obstacle,       // Encountered obstacle
    Insight,        // Learning or insight
    Setback,        // Temporary setback
}

/// Achievement
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Achievement {
    pub id: String,
    pub goal_id: String,
    pub title: String,
    pub description: String,
    pub earned_at: i64,
    pub celebration_message: String,
}

/// Goal reminder
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoalReminder {
    pub goal_id: String,
    pub goal_title: String,
    pub message: String,
    pub days_since_update: i32,
    pub progress: f32,
}

/// Goal Tracker Service
pub struct GoalTrackerService {
    db: Arc<Mutex<Database>>,
}

impl GoalTrackerService {
    /// Create new Goal Tracker service
    pub fn new(db: Arc<Mutex<Database>>) -> Result<Self> {
        let service = Self { db };
        service.init_database()?;
        Ok(service)
    }

    /// Initialize database tables
    fn init_database(&self) -> Result<()> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        conn.execute(
            "CREATE TABLE IF NOT EXISTS goals (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                category TEXT NOT NULL,
                status TEXT NOT NULL,
                time_frame TEXT NOT NULL,
                target_date INTEGER,
                progress_percentage REAL DEFAULT 0.0,
                success_criteria TEXT, -- JSON array
                obstacles TEXT, -- JSON array
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                completed_at INTEGER,
                last_check_in INTEGER,
                tags TEXT -- JSON array
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS milestones (
                id TEXT PRIMARY KEY,
                goal_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                target_date INTEGER,
                completed BOOLEAN NOT NULL DEFAULT 0,
                completed_at INTEGER,
                display_order INTEGER NOT NULL,
                FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS progress_updates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                goal_id TEXT NOT NULL,
                update_type TEXT NOT NULL,
                description TEXT NOT NULL,
                progress_delta REAL NOT NULL,
                created_at INTEGER NOT NULL,
                FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS achievements (
                id TEXT PRIMARY KEY,
                goal_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                earned_at INTEGER NOT NULL,
                celebration_message TEXT NOT NULL,
                FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
            )",
            [],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status)",
            [],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_milestones_goal ON milestones(goal_id)",
            [],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_updates_goal ON progress_updates(goal_id)",
            [],
        )?;

        log::info!("✓ Goal Tracker database initialized");
        Ok(())
    }

    /// Create a new goal
    pub fn create_goal(&self, goal: Goal) -> Result<String> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let success_criteria_json = serde_json::to_string(&goal.success_criteria)?;
        let obstacles_json = serde_json::to_string(&goal.obstacles)?;
        let tags_json = serde_json::to_string(&goal.tags)?;

        conn.execute(
            "INSERT INTO goals (id, title, description, category, status, time_frame,
             target_date, progress_percentage, success_criteria, obstacles,
             created_at, updated_at, completed_at, last_check_in, tags)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)",
            rusqlite::params![
                goal.id,
                goal.title,
                goal.description,
                serde_json::to_string(&goal.category)?.trim_matches('"'),
                serde_json::to_string(&goal.status)?.trim_matches('"'),
                serde_json::to_string(&goal.time_frame)?.trim_matches('"'),
                goal.target_date,
                goal.progress_percentage,
                success_criteria_json,
                obstacles_json,
                goal.created_at,
                goal.updated_at,
                goal.completed_at,
                goal.last_check_in,
                tags_json,
            ],
        )?;

        // Create milestones
        for milestone in &goal.milestones {
            self.create_milestone_internal(milestone, &conn)?;
        }

        log::info!("✓ Goal created: {}", goal.title);
        Ok(goal.id)
    }

    /// Internal milestone creation (with existing connection)
    fn create_milestone_internal(&self, milestone: &Milestone, conn: &rusqlite::Connection) -> Result<()> {
        conn.execute(
            "INSERT INTO milestones (id, goal_id, title, description, target_date,
             completed, completed_at, display_order)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            rusqlite::params![
                milestone.id,
                milestone.goal_id,
                milestone.title,
                milestone.description,
                milestone.target_date,
                milestone.completed,
                milestone.completed_at,
                milestone.order,
            ],
        )?;
        Ok(())
    }

    /// Get goal by ID
    pub fn get_goal(&self, goal_id: &str) -> Result<Goal> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let mut goal = conn.query_row(
            "SELECT id, title, description, category, status, time_frame,
             target_date, progress_percentage, success_criteria, obstacles,
             created_at, updated_at, completed_at, last_check_in, tags
             FROM goals WHERE id = ?1",
            [goal_id],
            |row| {
                let success_criteria_json: String = row.get(8)?;
                let success_criteria: Vec<String> = serde_json::from_str(&success_criteria_json).unwrap_or_default();

                let obstacles_json: String = row.get(9)?;
                let obstacles: Vec<String> = serde_json::from_str(&obstacles_json).unwrap_or_default();

                let tags_json: String = row.get(14)?;
                let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();

                let category_str: String = row.get(3)?;
                let category = serde_json::from_str(&format!("\"{}\"", category_str)).unwrap_or(GoalCategory::Other);

                let status_str: String = row.get(4)?;
                let status = serde_json::from_str(&format!("\"{}\"", status_str)).unwrap_or(GoalStatus::Active);

                let time_frame_str: String = row.get(5)?;
                let time_frame = serde_json::from_str(&format!("\"{}\"", time_frame_str)).unwrap_or(GoalTimeFrame::Medium);

                Ok(Goal {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    description: row.get(2)?,
                    category,
                    status,
                    time_frame,
                    target_date: row.get(6)?,
                    progress_percentage: row.get(7)?,
                    milestones: Vec::new(), // Will be loaded separately
                    success_criteria,
                    obstacles,
                    created_at: row.get(10)?,
                    updated_at: row.get(11)?,
                    completed_at: row.get(12)?,
                    last_check_in: row.get(13)?,
                    tags,
                })
            },
        )?;

        // Load milestones
        goal.milestones = self.get_milestones_for_goal(goal_id, &conn)?;

        Ok(goal)
    }

    /// Get milestones for a goal
    fn get_milestones_for_goal(&self, goal_id: &str, conn: &rusqlite::Connection) -> Result<Vec<Milestone>> {
        let mut stmt = conn.prepare(
            "SELECT id, goal_id, title, description, target_date, completed, completed_at, display_order
             FROM milestones WHERE goal_id = ?1 ORDER BY display_order ASC"
        )?;

        let milestones = stmt.query_map([goal_id], |row| {
            Ok(Milestone {
                id: row.get(0)?,
                goal_id: row.get(1)?,
                title: row.get(2)?,
                description: row.get(3)?,
                target_date: row.get(4)?,
                completed: row.get(5)?,
                completed_at: row.get(6)?,
                order: row.get(7)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

        Ok(milestones)
    }

    /// Update goal progress
    pub fn update_progress(&self, goal_id: &str, progress_delta: f32, description: &str) -> Result<()> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        // Get current progress
        let current_progress: f32 = conn.query_row(
            "SELECT progress_percentage FROM goals WHERE id = ?1",
            [goal_id],
            |row| row.get(0),
        )?;

        let new_progress = (current_progress + progress_delta).clamp(0.0, 100.0);
        let now = chrono::Utc::now().timestamp();

        // Update goal
        conn.execute(
            "UPDATE goals SET progress_percentage = ?1, updated_at = ?2, last_check_in = ?2 WHERE id = ?3",
            rusqlite::params![new_progress, now, goal_id],
        )?;

        // Record progress update
        conn.execute(
            "INSERT INTO progress_updates (goal_id, update_type, description, progress_delta, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![goal_id, "progress", description, progress_delta, now],
        )?;

        // Check for completion
        if new_progress >= 100.0 {
            self.complete_goal_internal(goal_id, &conn)?;
        }

        log::info!("✓ Goal progress updated: {} → {:.1}%", goal_id, new_progress);
        Ok(())
    }

    /// Complete a milestone
    pub fn complete_milestone(&self, milestone_id: &str) -> Result<()> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let now = chrono::Utc::now().timestamp();

        conn.execute(
            "UPDATE milestones SET completed = 1, completed_at = ?1 WHERE id = ?2",
            rusqlite::params![now, milestone_id],
        )?;

        // Get goal_id to update progress
        let goal_id: String = conn.query_row(
            "SELECT goal_id FROM milestones WHERE id = ?1",
            [milestone_id],
            |row| row.get(0),
        )?;

        // Calculate progress based on milestone completion
        let (total, completed): (i32, i32) = conn.query_row(
            "SELECT COUNT(*), SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) FROM milestones WHERE goal_id = ?1",
            [&goal_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )?;

        if total > 0 {
            let progress = (completed as f32 / total as f32) * 100.0;
            conn.execute(
                "UPDATE goals SET progress_percentage = ?1, updated_at = ?2, last_check_in = ?2 WHERE id = ?3",
                rusqlite::params![progress, now, goal_id],
            )?;

            // Record as progress update
            conn.execute(
                "INSERT INTO progress_updates (goal_id, update_type, description, progress_delta, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
                rusqlite::params![goal_id, "milestone", format!("Milestone completed: {}", milestone_id), 0.0, now],
            )?;
        }

        log::info!("✓ Milestone completed: {}", milestone_id);
        Ok(())
    }

    /// Complete a goal
    fn complete_goal_internal(&self, goal_id: &str, conn: &rusqlite::Connection) -> Result<()> {
        let now = chrono::Utc::now().timestamp();

        conn.execute(
            "UPDATE goals SET status = 'completed', completed_at = ?1, progress_percentage = 100.0 WHERE id = ?2",
            rusqlite::params![now, goal_id],
        )?;

        // Create achievement
        let achievement = Achievement {
            id: uuid::Uuid::new_v4().to_string(),
            goal_id: goal_id.to_string(),
            title: "Goal Completed!".to_string(),
            description: "Congratulations on achieving your goal!".to_string(),
            earned_at: now,
            celebration_message: "🎉 Amazing work! You've reached your goal!".to_string(),
        };

        conn.execute(
            "INSERT INTO achievements (id, goal_id, title, description, earned_at, celebration_message)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![
                achievement.id,
                achievement.goal_id,
                achievement.title,
                achievement.description,
                achievement.earned_at,
                achievement.celebration_message,
            ],
        )?;

        log::info!("✓ Goal completed: {}", goal_id);
        Ok(())
    }

    /// Get active goals
    pub fn get_active_goals(&self) -> Result<Vec<Goal>> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let mut stmt = conn.prepare(
            "SELECT id FROM goals WHERE status = 'active' ORDER BY created_at DESC"
        )?;

        let goal_ids: Vec<String> = stmt.query_map([], |row| row.get(0))?
            .collect::<Result<Vec<_>, _>>()?;

        drop(stmt);
        drop(db);

        let mut goals = Vec::new();
        for id in goal_ids {
            goals.push(self.get_goal(&id)?);
        }

        Ok(goals)
    }

    /// Get goals needing check-in (inactive for > 7 days)
    pub fn get_stale_goals(&self, days_threshold: i64) -> Result<Vec<GoalReminder>> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let now = chrono::Utc::now().timestamp();
        let threshold_timestamp = now - (days_threshold * 24 * 60 * 60);

        let mut stmt = conn.prepare(
            "SELECT id, title, progress_percentage, last_check_in, created_at
             FROM goals
             WHERE status = 'active' AND (last_check_in IS NULL OR last_check_in < ?1)
             ORDER BY last_check_in ASC"
        )?;

        let reminders = stmt.query_map([threshold_timestamp], |row| {
            let last_check_in: Option<i64> = row.get(3)?;
            let created_at: i64 = row.get(4)?;

            let days_since = ((now - last_check_in.unwrap_or(created_at)) / (24 * 60 * 60)) as i32;

            Ok(GoalReminder {
                goal_id: row.get(0)?,
                goal_title: row.get(1)?,
                message: format!("It's been {} days since your last update. How's it going?", days_since),
                days_since_update: days_since,
                progress: row.get(2)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

        Ok(reminders)
    }

    /// Analyze conversation for goal-related progress
    pub async fn detect_progress_from_conversation(&self, conversation: &str, goal_id: &str) -> Result<Option<f32>> {
        let goal = self.get_goal(goal_id)?;

        let prompt = format!(
            r#"You are a goal progress analyzer. Analyze this conversation to detect progress toward the goal.

Goal: "{}"
Description: {}
Success Criteria: {:?}

Conversation:
{}

Has the user made progress on this goal? Estimate progress change.

Respond ONLY with valid JSON:
{{
  "has_progress": true | false,
  "progress_delta": 0.0-100.0,
  "description": "Brief description of progress made"
}}

If no progress detected, set has_progress to false and progress_delta to 0.0"#,
            goal.title, goal.description, goal.success_criteria, conversation
        );

        let response = ollama::generate_response(&prompt).await
            .map_err(|e| anyhow!("Failed to detect progress: {}", e))?;

        let analysis: serde_json::Value = serde_json::from_str(response.trim())
            .map_err(|e| anyhow!("Failed to parse progress analysis: {}", e))?;

        if analysis["has_progress"].as_bool().unwrap_or(false) {
            let delta = analysis["progress_delta"].as_f64().unwrap_or(0.0) as f32;
            let description = analysis["description"].as_str().unwrap_or("Progress detected");

            if delta > 0.0 {
                self.update_progress(goal_id, delta, description)?;
                return Ok(Some(delta));
            }
        }

        Ok(None)
    }

    /// Get achievements for a goal
    pub fn get_achievements(&self, goal_id: &str) -> Result<Vec<Achievement>> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let mut stmt = conn.prepare(
            "SELECT id, goal_id, title, description, earned_at, celebration_message
             FROM achievements WHERE goal_id = ?1 ORDER BY earned_at DESC"
        )?;

        let achievements = stmt.query_map([goal_id], |row| {
            Ok(Achievement {
                id: row.get(0)?,
                goal_id: row.get(1)?,
                title: row.get(2)?,
                description: row.get(3)?,
                earned_at: row.get(4)?,
                celebration_message: row.get(5)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

        Ok(achievements)
    }

    /// Delete a goal
    pub fn delete_goal(&self, goal_id: &str) -> Result<()> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        conn.execute("DELETE FROM goals WHERE id = ?1", [goal_id])?;
        log::info!("✓ Goal deleted: {}", goal_id);
        Ok(())
    }
}
