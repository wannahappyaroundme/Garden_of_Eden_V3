/**
 * Phase 5 Stage 4: Task Planner Service (v3.9.0)
 *
 * Autonomous task breakdown and execution planning with dependency tracking.
 *
 * Features:
 * - Intelligent task decomposition using Ollama
 * - Dependency graph management
 * - Execution plan generation
 * - Progress tracking
 * - Subtask reordering based on dependencies
 */

use crate::database::Database;
use crate::services::ollama;
use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::sync::{Arc, Mutex};

/// Task status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TaskStatus {
    Pending,
    InProgress,
    Completed,
    Blocked,
    Cancelled,
}

/// Task priority
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TaskPriority {
    Low,
    Medium,
    High,
    Critical,
}

impl TaskPriority {
    pub fn score(&self) -> i32 {
        match self {
            TaskPriority::Low => 1,
            TaskPriority::Medium => 2,
            TaskPriority::High => 3,
            TaskPriority::Critical => 4,
        }
    }
}

/// Task item
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub parent_id: Option<String>,
    pub title: String,
    pub description: String,
    pub status: TaskStatus,
    pub priority: TaskPriority,
    pub dependencies: Vec<String>, // IDs of tasks that must complete first
    pub estimated_duration_minutes: Option<i32>,
    pub actual_duration_minutes: Option<i32>,
    pub progress_percentage: f32,
    pub created_at: i64,
    pub started_at: Option<i64>,
    pub completed_at: Option<i64>,
    pub tags: Vec<String>,
}

/// Execution plan
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionPlan {
    pub root_task_id: String,
    pub ordered_tasks: Vec<String>, // Topologically sorted task IDs
    pub parallel_groups: Vec<Vec<String>>, // Groups of tasks that can run in parallel
    pub estimated_total_duration_minutes: i32,
    pub critical_path: Vec<String>,
}

/// Task breakdown result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskBreakdown {
    pub subtasks: Vec<Task>,
    pub dependencies: HashMap<String, Vec<String>>, // task_id -> [dependency_ids]
}

/// Task Planner Service
pub struct TaskPlannerService {
    db: Arc<Mutex<Database>>,
}

impl TaskPlannerService {
    /// Create new Task Planner service
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
            "CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                parent_id TEXT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                status TEXT NOT NULL,
                priority TEXT NOT NULL,
                dependencies TEXT, -- JSON array
                estimated_duration_minutes INTEGER,
                actual_duration_minutes INTEGER,
                progress_percentage REAL DEFAULT 0.0,
                created_at INTEGER NOT NULL,
                started_at INTEGER,
                completed_at INTEGER,
                tags TEXT, -- JSON array
                FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE
            )",
            [],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id)",
            [],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)",
            [],
        )?;

        log::info!("✓ Task Planner database initialized");
        Ok(())
    }

    /// Decompose a complex task into subtasks using LLM
    pub async fn decompose_task(&self, task_description: &str, context: Option<&str>) -> Result<TaskBreakdown> {
        log::info!("Decomposing task: {}", task_description);

        let context_str = context.unwrap_or("");
        let prompt = format!(
            r#"You are a task planning expert. Break down this complex task into actionable subtasks.

Task: "{}"
Context: {}

Analyze the task and create a detailed breakdown with:
1. Clear, actionable subtasks
2. Dependencies between subtasks
3. Estimated duration for each subtask (in minutes)
4. Priority level for each subtask

Respond ONLY with valid JSON in this exact format:
{{
  "subtasks": [
    {{
      "title": "Subtask title",
      "description": "Detailed description",
      "priority": "low" | "medium" | "high" | "critical",
      "estimated_duration_minutes": 30,
      "dependencies": ["subtask_title_1", "subtask_title_2"],
      "tags": ["tag1", "tag2"]
    }}
  ]
}}

Rules:
- Create 3-10 subtasks (more for complex tasks)
- Each subtask should be completable in under 2 hours
- Use dependency titles, not IDs
- Be specific and actionable"#,
            task_description, context_str
        );

        let response = ollama::generate_response(&prompt).await
            .map_err(|e| anyhow!("Failed to decompose task: {}", e))?;

        // Parse LLM response
        let response_clean = response.trim();
        let parsed: serde_json::Value = serde_json::from_str(response_clean)
            .map_err(|e| anyhow!("Failed to parse task breakdown JSON: {}", e))?;

        // Convert to Task objects
        let mut subtasks = Vec::new();
        let mut dependencies_map: HashMap<String, Vec<String>> = HashMap::new();
        let mut title_to_id: HashMap<String, String> = HashMap::new();

        let subtasks_json = parsed["subtasks"]
            .as_array()
            .ok_or_else(|| anyhow!("Invalid response: missing 'subtasks' array"))?;

        let now = chrono::Utc::now().timestamp();

        for subtask_json in subtasks_json {
            let title = subtask_json["title"]
                .as_str()
                .ok_or_else(|| anyhow!("Missing 'title' field"))?
                .to_string();

            let id = uuid::Uuid::new_v4().to_string();
            title_to_id.insert(title.clone(), id.clone());

            let description = subtask_json["description"]
                .as_str()
                .unwrap_or("")
                .to_string();

            let priority_str = subtask_json["priority"]
                .as_str()
                .unwrap_or("medium");
            let priority = match priority_str {
                "low" => TaskPriority::Low,
                "medium" => TaskPriority::Medium,
                "high" => TaskPriority::High,
                "critical" => TaskPriority::Critical,
                _ => TaskPriority::Medium,
            };

            let estimated_duration = subtask_json["estimated_duration_minutes"]
                .as_i64()
                .map(|v| v as i32);

            let tags: Vec<String> = subtask_json["tags"]
                .as_array()
                .map(|arr| {
                    arr.iter()
                        .filter_map(|v| v.as_str().map(|s| s.to_string()))
                        .collect()
                })
                .unwrap_or_default();

            // Store dependency titles temporarily
            let dep_titles: Vec<String> = subtask_json["dependencies"]
                .as_array()
                .map(|arr| {
                    arr.iter()
                        .filter_map(|v| v.as_str().map(|s| s.to_string()))
                        .collect()
                })
                .unwrap_or_default();

            dependencies_map.insert(title.clone(), dep_titles);

            let task = Task {
                id: id.clone(),
                parent_id: None,
                title,
                description,
                status: TaskStatus::Pending,
                priority,
                dependencies: Vec::new(), // Will be filled after all IDs are known
                estimated_duration_minutes: estimated_duration,
                actual_duration_minutes: None,
                progress_percentage: 0.0,
                created_at: now,
                started_at: None,
                completed_at: None,
                tags,
            };

            subtasks.push(task);
        }

        // Convert dependency titles to IDs
        let mut final_dependencies: HashMap<String, Vec<String>> = HashMap::new();
        for task in &mut subtasks {
            if let Some(dep_titles) = dependencies_map.get(&task.title) {
                let dep_ids: Vec<String> = dep_titles
                    .iter()
                    .filter_map(|title| title_to_id.get(title).cloned())
                    .collect();
                task.dependencies = dep_ids.clone();
                final_dependencies.insert(task.id.clone(), dep_ids);
            }
        }

        log::info!("✓ Decomposed into {} subtasks", subtasks.len());

        Ok(TaskBreakdown {
            subtasks,
            dependencies: final_dependencies,
        })
    }

    /// Create a new task
    pub fn create_task(&self, task: Task) -> Result<String> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let dependencies_json = serde_json::to_string(&task.dependencies)?;
        let tags_json = serde_json::to_string(&task.tags)?;

        conn.execute(
            "INSERT INTO tasks (id, parent_id, title, description, status, priority,
             dependencies, estimated_duration_minutes, actual_duration_minutes,
             progress_percentage, created_at, started_at, completed_at, tags)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
            rusqlite::params![
                task.id,
                task.parent_id,
                task.title,
                task.description,
                serde_json::to_string(&task.status)?.trim_matches('"'),
                serde_json::to_string(&task.priority)?.trim_matches('"'),
                dependencies_json,
                task.estimated_duration_minutes,
                task.actual_duration_minutes,
                task.progress_percentage,
                task.created_at,
                task.started_at,
                task.completed_at,
                tags_json,
            ],
        )?;

        log::info!("✓ Task created: {}", task.title);
        Ok(task.id)
    }

    /// Get task by ID
    pub fn get_task(&self, task_id: &str) -> Result<Task> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let task = conn.query_row(
            "SELECT id, parent_id, title, description, status, priority,
             dependencies, estimated_duration_minutes, actual_duration_minutes,
             progress_percentage, created_at, started_at, completed_at, tags
             FROM tasks WHERE id = ?1",
            [task_id],
            |row| {
                let dependencies_json: String = row.get(6)?;
                let dependencies: Vec<String> = serde_json::from_str(&dependencies_json).unwrap_or_default();

                let tags_json: String = row.get(13)?;
                let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();

                let status_str: String = row.get(4)?;
                let status = serde_json::from_str(&format!("\"{}\"", status_str)).unwrap_or(TaskStatus::Pending);

                let priority_str: String = row.get(5)?;
                let priority = serde_json::from_str(&format!("\"{}\"", priority_str)).unwrap_or(TaskPriority::Medium);

                Ok(Task {
                    id: row.get(0)?,
                    parent_id: row.get(1)?,
                    title: row.get(2)?,
                    description: row.get(3)?,
                    status,
                    priority,
                    dependencies,
                    estimated_duration_minutes: row.get(7)?,
                    actual_duration_minutes: row.get(8)?,
                    progress_percentage: row.get(9)?,
                    created_at: row.get(10)?,
                    started_at: row.get(11)?,
                    completed_at: row.get(12)?,
                    tags,
                })
            },
        )?;

        Ok(task)
    }

    /// Update task status
    pub fn update_task_status(&self, task_id: &str, status: TaskStatus) -> Result<()> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let now = chrono::Utc::now().timestamp();
        let status_str = serde_json::to_string(&status)?.trim_matches('"').to_string();

        match status {
            TaskStatus::InProgress => {
                conn.execute(
                    "UPDATE tasks SET status = ?1, started_at = ?2 WHERE id = ?3",
                    rusqlite::params![status_str, now, task_id],
                )?;
            }
            TaskStatus::Completed => {
                conn.execute(
                    "UPDATE tasks SET status = ?1, completed_at = ?2, progress_percentage = 100.0 WHERE id = ?3",
                    rusqlite::params![status_str, now, task_id],
                )?;
            }
            _ => {
                conn.execute(
                    "UPDATE tasks SET status = ?1 WHERE id = ?2",
                    rusqlite::params![status_str, task_id],
                )?;
            }
        }

        log::info!("✓ Task {} status updated to {:?}", task_id, status);
        Ok(())
    }

    /// Update task progress
    pub fn update_task_progress(&self, task_id: &str, progress: f32) -> Result<()> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let clamped_progress = progress.clamp(0.0, 100.0);

        conn.execute(
            "UPDATE tasks SET progress_percentage = ?1 WHERE id = ?2",
            rusqlite::params![clamped_progress, task_id],
        )?;

        // Auto-complete if 100%
        if clamped_progress >= 100.0 {
            let now = chrono::Utc::now().timestamp();
            conn.execute(
                "UPDATE tasks SET status = 'completed', completed_at = ?1 WHERE id = ?2",
                rusqlite::params![now, task_id],
            )?;
        }

        Ok(())
    }

    /// Generate execution plan with dependency ordering
    pub fn generate_execution_plan(&self, root_task_id: &str) -> Result<ExecutionPlan> {
        let _root_task = self.get_task(root_task_id)?;

        // Get all subtasks
        let subtasks = self.get_subtasks(root_task_id)?;

        // Build dependency graph
        let mut graph: HashMap<String, Vec<String>> = HashMap::new();
        let mut in_degree: HashMap<String, usize> = HashMap::new();

        for task in &subtasks {
            in_degree.insert(task.id.clone(), task.dependencies.len());
            for dep_id in &task.dependencies {
                graph.entry(dep_id.clone()).or_insert_with(Vec::new).push(task.id.clone());
            }
        }

        // Topological sort (Kahn's algorithm)
        let mut ordered_tasks = Vec::new();
        let mut parallel_groups: Vec<Vec<String>> = Vec::new();
        let mut queue: Vec<String> = in_degree
            .iter()
            .filter(|(_, &degree)| degree == 0)
            .map(|(id, _)| id.clone())
            .collect();

        while !queue.is_empty() {
            // Current group can run in parallel
            parallel_groups.push(queue.clone());
            ordered_tasks.extend(queue.iter().cloned());

            let mut next_queue = Vec::new();
            for task_id in &queue {
                if let Some(dependents) = graph.get(task_id) {
                    for dependent_id in dependents {
                        if let Some(degree) = in_degree.get_mut(dependent_id) {
                            *degree -= 1;
                            if *degree == 0 {
                                next_queue.push(dependent_id.clone());
                            }
                        }
                    }
                }
            }
            queue = next_queue;
        }

        // Calculate total estimated duration
        let estimated_total_duration: i32 = subtasks
            .iter()
            .filter_map(|t| t.estimated_duration_minutes)
            .sum();

        // Find critical path (longest path through dependencies)
        let critical_path = self.find_critical_path(&subtasks)?;

        Ok(ExecutionPlan {
            root_task_id: root_task_id.to_string(),
            ordered_tasks,
            parallel_groups,
            estimated_total_duration_minutes: estimated_total_duration,
            critical_path,
        })
    }

    /// Get all subtasks for a parent task
    pub fn get_subtasks(&self, parent_id: &str) -> Result<Vec<Task>> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let mut stmt = conn.prepare(
            "SELECT id, parent_id, title, description, status, priority,
             dependencies, estimated_duration_minutes, actual_duration_minutes,
             progress_percentage, created_at, started_at, completed_at, tags
             FROM tasks WHERE parent_id = ?1 ORDER BY created_at ASC"
        )?;

        let tasks = stmt.query_map([parent_id], |row| {
            let dependencies_json: String = row.get(6)?;
            let dependencies: Vec<String> = serde_json::from_str(&dependencies_json).unwrap_or_default();

            let tags_json: String = row.get(13)?;
            let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();

            let status_str: String = row.get(4)?;
            let status = serde_json::from_str(&format!("\"{}\"", status_str)).unwrap_or(TaskStatus::Pending);

            let priority_str: String = row.get(5)?;
            let priority = serde_json::from_str(&format!("\"{}\"", priority_str)).unwrap_or(TaskPriority::Medium);

            Ok(Task {
                id: row.get(0)?,
                parent_id: row.get(1)?,
                title: row.get(2)?,
                description: row.get(3)?,
                status,
                priority,
                dependencies,
                estimated_duration_minutes: row.get(7)?,
                actual_duration_minutes: row.get(8)?,
                progress_percentage: row.get(9)?,
                created_at: row.get(10)?,
                started_at: row.get(11)?,
                completed_at: row.get(12)?,
                tags,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

        Ok(tasks)
    }

    /// Find critical path (longest path in dependency graph)
    fn find_critical_path(&self, tasks: &[Task]) -> Result<Vec<String>> {
        let mut longest_path = Vec::new();
        let mut max_duration = 0;

        // Simple DFS to find longest path
        for task in tasks {
            if task.dependencies.is_empty() {
                let (path, duration) = self.dfs_longest_path(task, tasks);
                if duration > max_duration {
                    max_duration = duration;
                    longest_path = path;
                }
            }
        }

        Ok(longest_path)
    }

    /// DFS helper for finding longest path
    fn dfs_longest_path(&self, current: &Task, all_tasks: &[Task]) -> (Vec<String>, i32) {
        let current_duration = current.estimated_duration_minutes.unwrap_or(0);

        // Find tasks that depend on current task
        let dependents: Vec<&Task> = all_tasks
            .iter()
            .filter(|t| t.dependencies.contains(&current.id))
            .collect();

        if dependents.is_empty() {
            return (vec![current.id.clone()], current_duration);
        }

        let mut max_path = Vec::new();
        let mut max_duration = 0;

        for dependent in dependents {
            let (path, duration) = self.dfs_longest_path(dependent, all_tasks);
            if duration > max_duration {
                max_duration = duration;
                max_path = path;
            }
        }

        let mut full_path = vec![current.id.clone()];
        full_path.extend(max_path);

        (full_path, current_duration + max_duration)
    }

    /// Get all tasks (optionally filtered by status)
    pub fn get_all_tasks(&self, status_filter: Option<TaskStatus>) -> Result<Vec<Task>> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        let query = if let Some(status) = status_filter {
            let status_str = serde_json::to_string(&status)?.trim_matches('"').to_string();
            format!(
                "SELECT id, parent_id, title, description, status, priority,
                 dependencies, estimated_duration_minutes, actual_duration_minutes,
                 progress_percentage, created_at, started_at, completed_at, tags
                 FROM tasks WHERE status = '{}' ORDER BY priority DESC, created_at ASC",
                status_str
            )
        } else {
            "SELECT id, parent_id, title, description, status, priority,
             dependencies, estimated_duration_minutes, actual_duration_minutes,
             progress_percentage, created_at, started_at, completed_at, tags
             FROM tasks ORDER BY priority DESC, created_at ASC".to_string()
        };

        let mut stmt = conn.prepare(&query)?;

        let tasks = stmt.query_map([], |row| {
            let dependencies_json: String = row.get(6)?;
            let dependencies: Vec<String> = serde_json::from_str(&dependencies_json).unwrap_or_default();

            let tags_json: String = row.get(13)?;
            let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();

            let status_str: String = row.get(4)?;
            let status = serde_json::from_str(&format!("\"{}\"", status_str)).unwrap_or(TaskStatus::Pending);

            let priority_str: String = row.get(5)?;
            let priority = serde_json::from_str(&format!("\"{}\"", priority_str)).unwrap_or(TaskPriority::Medium);

            Ok(Task {
                id: row.get(0)?,
                parent_id: row.get(1)?,
                title: row.get(2)?,
                description: row.get(3)?,
                status,
                priority,
                dependencies,
                estimated_duration_minutes: row.get(7)?,
                actual_duration_minutes: row.get(8)?,
                progress_percentage: row.get(9)?,
                created_at: row.get(10)?,
                started_at: row.get(11)?,
                completed_at: row.get(12)?,
                tags,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

        Ok(tasks)
    }

    /// Delete a task
    pub fn delete_task(&self, task_id: &str) -> Result<()> {
        let db = self.db.lock().unwrap();
        let conn = db.conn();

        conn.execute("DELETE FROM tasks WHERE id = ?1", [task_id])?;
        log::info!("✓ Task deleted: {}", task_id);
        Ok(())
    }
}
