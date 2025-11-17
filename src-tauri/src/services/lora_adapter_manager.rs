// v3.8.0 Phase 3.2: LoRA Adapter Manager
//
// This service manages LoRA adapters for Ollama models.
// It handles Modelfile generation, adapter versioning, and switching between adapters.
//
// NOTE: Ollama doesn't support built-in LoRA fine-tuning. Users must:
// 1. Export training data using LoRADataCollectorService
// 2. Train LoRA adapters externally (LLaMA-Factory, Axolotl, etc.)
// 3. Use this service to load adapters into Ollama via Modelfiles

use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::sync::Mutex;
use std::path::{Path, PathBuf};
use anyhow::{Result as AnyhowResult, Context};
use chrono::Utc;
use uuid::Uuid;

use crate::database::Database;

/// LoRA adapter metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoRAAdapter {
    pub id: String,
    pub name: String,
    pub description: String,
    pub base_model: String,          // e.g., "qwen2.5:14b"
    pub adapter_path: String,        // Path to LoRA adapter weights
    pub created_at: i64,
    pub version: String,             // Semantic version (e.g., "1.0.0")
    pub training_dataset_id: Option<String>, // Link to training dataset
    pub performance_metrics: Option<PerformanceMetrics>,
    pub is_active: bool,             // Currently loaded in Ollama
}

/// Performance metrics for adapter evaluation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    pub avg_satisfaction: f32,       // Average user satisfaction
    pub total_conversations: usize,  // Total conversations with this adapter
    pub training_loss: Option<f32>,  // Final training loss (if available)
    pub eval_loss: Option<f32>,      // Evaluation loss (if available)
    pub perplexity: Option<f32>,     // Model perplexity
}

/// Modelfile template for Ollama
pub struct ModelfileTemplate {
    pub base_model: String,
    pub adapter_path: String,
    pub temperature: f32,
    pub top_p: f32,
    pub top_k: i32,
    pub repeat_penalty: f32,
    pub system_prompt: Option<String>,
}

impl ModelfileTemplate {
    /// Generate Modelfile content
    pub fn generate(&self) -> String {
        let mut modelfile = String::new();

        // FROM directive - base model
        modelfile.push_str(&format!("FROM {}\n\n", self.base_model));

        // ADAPTER directive - LoRA weights
        modelfile.push_str(&format!("ADAPTER {}\n\n", self.adapter_path));

        // PARAMETER directives
        modelfile.push_str(&format!("PARAMETER temperature {}\n", self.temperature));
        modelfile.push_str(&format!("PARAMETER top_p {}\n", self.top_p));
        modelfile.push_str(&format!("PARAMETER top_k {}\n", self.top_k));
        modelfile.push_str(&format!("PARAMETER repeat_penalty {}\n\n", self.repeat_penalty));

        // SYSTEM directive (optional)
        if let Some(system_prompt) = &self.system_prompt {
            modelfile.push_str(&format!("SYSTEM \"\"\"\n{}\n\"\"\"\n", system_prompt));
        }

        modelfile
    }
}

/// LoRA adapter manager service
pub struct LoRAAdapterManager {
    db: Arc<Mutex<Database>>,
    adapters_dir: PathBuf,
}

impl LoRAAdapterManager {
    /// Create a new LoRA adapter manager
    pub fn new(db: Arc<Mutex<Database>>) -> AnyhowResult<Self> {
        let adapters_dir = Self::get_adapters_dir()?;

        // Ensure adapters directory exists
        std::fs::create_dir_all(&adapters_dir)
            .context("Failed to create adapters directory")?;

        Ok(Self { db, adapters_dir })
    }

    /// Get adapters directory path
    fn get_adapters_dir() -> AnyhowResult<PathBuf> {
        let app_dir = dirs::data_dir()
            .context("Failed to get app data directory")?;

        Ok(app_dir.join("garden-of-eden-v3").join("lora_adapters"))
    }

    /// Register a new LoRA adapter
    pub fn register_adapter(
        &self,
        name: String,
        description: String,
        base_model: String,
        adapter_path: String,
        version: String,
        training_dataset_id: Option<String>,
    ) -> AnyhowResult<LoRAAdapter> {
        // Validate adapter path exists
        if !Path::new(&adapter_path).exists() {
            return Err(anyhow::anyhow!("Adapter path does not exist: {}", adapter_path));
        }

        let adapter = LoRAAdapter {
            id: Uuid::new_v4().to_string(),
            name,
            description,
            base_model,
            adapter_path,
            created_at: Utc::now().timestamp_millis(),
            version,
            training_dataset_id,
            performance_metrics: None,
            is_active: false,
        };

        // Store in database
        self.save_adapter(&adapter)?;

        log::info!("Registered new LoRA adapter: {} (v{})", adapter.name, adapter.version);

        Ok(adapter)
    }

    /// Save adapter metadata to database
    fn save_adapter(&self, adapter: &LoRAAdapter) -> AnyhowResult<()> {
        let db = self.db.lock().map_err(|e| anyhow::anyhow!("Failed to lock database: {}", e))?;

        let adapter_json = serde_json::to_string(adapter)?;

        db.conn().execute(
            "INSERT OR REPLACE INTO user_preferences (key, value, updated_at)
             VALUES (?1, ?2, ?3)",
            rusqlite::params![
                format!("lora_adapter_{}", adapter.id),
                adapter_json,
                Utc::now().timestamp_millis(),
            ],
        )?;

        Ok(())
    }

    /// Load adapter metadata from database
    pub fn load_adapter(&self, adapter_id: &str) -> AnyhowResult<Option<LoRAAdapter>> {
        let db = self.db.lock().map_err(|e| anyhow::anyhow!("Failed to lock database: {}", e))?;

        let key = format!("lora_adapter_{}", adapter_id);

        let result = db.conn().query_row(
            "SELECT value FROM user_preferences WHERE key = ?1",
            rusqlite::params![key],
            |row| {
                let json: String = row.get(0)?;
                Ok(json)
            },
        );

        match result {
            Ok(json) => {
                let adapter: LoRAAdapter = serde_json::from_str(&json)?;
                Ok(Some(adapter))
            }
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(anyhow::anyhow!("Failed to load adapter: {}", e)),
        }
    }

    /// List all registered adapters
    pub fn list_adapters(&self) -> AnyhowResult<Vec<LoRAAdapter>> {
        let db = self.db.lock().map_err(|e| anyhow::anyhow!("Failed to lock database: {}", e))?;

        let mut stmt = db.conn().prepare(
            "SELECT value FROM user_preferences WHERE key LIKE 'lora_adapter_%'"
        )?;

        let rows = stmt.query_map([], |row| {
            let json: String = row.get(0)?;
            Ok(json)
        })?;

        let mut adapters = Vec::new();
        for row_result in rows {
            let json = row_result?;
            let adapter: LoRAAdapter = serde_json::from_str(&json)?;
            adapters.push(adapter);
        }

        // Sort by created_at descending (newest first)
        adapters.sort_by(|a, b| b.created_at.cmp(&a.created_at));

        Ok(adapters)
    }

    /// Get active adapter
    pub fn get_active_adapter(&self) -> AnyhowResult<Option<LoRAAdapter>> {
        let adapters = self.list_adapters()?;
        Ok(adapters.into_iter().find(|a| a.is_active))
    }

    /// Set active adapter
    pub fn set_active_adapter(&self, adapter_id: &str) -> AnyhowResult<()> {
        // Deactivate all adapters first
        let adapters = self.list_adapters()?;
        for mut adapter in adapters {
            adapter.is_active = false;
            self.save_adapter(&adapter)?;
        }

        // Activate the specified adapter
        if let Some(mut adapter) = self.load_adapter(adapter_id)? {
            adapter.is_active = true;
            self.save_adapter(&adapter)?;
            log::info!("Activated LoRA adapter: {} (v{})", adapter.name, adapter.version);
        } else {
            return Err(anyhow::anyhow!("Adapter not found: {}", adapter_id));
        }

        Ok(())
    }

    /// Update adapter performance metrics
    pub fn update_performance_metrics(
        &self,
        adapter_id: &str,
        metrics: PerformanceMetrics,
    ) -> AnyhowResult<()> {
        if let Some(mut adapter) = self.load_adapter(adapter_id)? {
            adapter.performance_metrics = Some(metrics);
            self.save_adapter(&adapter)?;
            log::info!("Updated performance metrics for adapter: {}", adapter.name);
        } else {
            return Err(anyhow::anyhow!("Adapter not found: {}", adapter_id));
        }

        Ok(())
    }

    /// Generate Modelfile for an adapter
    pub fn generate_modelfile(
        &self,
        adapter_id: &str,
        system_prompt: Option<String>,
    ) -> AnyhowResult<String> {
        let adapter = self.load_adapter(adapter_id)?
            .ok_or_else(|| anyhow::anyhow!("Adapter not found: {}", adapter_id))?;

        let template = ModelfileTemplate {
            base_model: adapter.base_model.clone(),
            adapter_path: adapter.adapter_path.clone(),
            temperature: 0.8,
            top_p: 0.92,
            top_k: 45,
            repeat_penalty: 1.15,
            system_prompt,
        };

        Ok(template.generate())
    }

    /// Save Modelfile to disk
    pub fn save_modelfile(
        &self,
        adapter_id: &str,
        system_prompt: Option<String>,
    ) -> AnyhowResult<PathBuf> {
        let modelfile_content = self.generate_modelfile(adapter_id, system_prompt)?;

        let adapter = self.load_adapter(adapter_id)?
            .ok_or_else(|| anyhow::anyhow!("Adapter not found: {}", adapter_id))?;

        let modelfile_path = self.adapters_dir.join(format!("{}_Modelfile", adapter.name));

        std::fs::write(&modelfile_path, modelfile_content)
            .context("Failed to write Modelfile")?;

        log::info!("Saved Modelfile for adapter {} to {:?}", adapter.name, modelfile_path);

        Ok(modelfile_path)
    }

    /// Delete an adapter
    pub fn delete_adapter(&self, adapter_id: &str) -> AnyhowResult<()> {
        let db = self.db.lock().map_err(|e| anyhow::anyhow!("Failed to lock database: {}", e))?;

        let key = format!("lora_adapter_{}", adapter_id);

        db.conn().execute(
            "DELETE FROM user_preferences WHERE key = ?1",
            rusqlite::params![key],
        )?;

        log::info!("Deleted LoRA adapter: {}", adapter_id);

        Ok(())
    }

    /// Compare two adapters by performance metrics
    pub fn compare_adapters(
        &self,
        adapter_id_a: &str,
        adapter_id_b: &str,
    ) -> AnyhowResult<AdapterComparison> {
        let adapter_a = self.load_adapter(adapter_id_a)?
            .ok_or_else(|| anyhow::anyhow!("Adapter A not found: {}", adapter_id_a))?;
        let adapter_b = self.load_adapter(adapter_id_b)?
            .ok_or_else(|| anyhow::anyhow!("Adapter B not found: {}", adapter_id_b))?;

        Ok(AdapterComparison {
            adapter_a: adapter_a.clone(),
            adapter_b: adapter_b.clone(),
            satisfaction_diff: adapter_a.performance_metrics.as_ref()
                .and_then(|m| adapter_b.performance_metrics.as_ref().map(|n| m.avg_satisfaction - n.avg_satisfaction)),
            conversation_count_diff: adapter_a.performance_metrics.as_ref()
                .and_then(|m| adapter_b.performance_metrics.as_ref().map(|n| m.total_conversations as i64 - n.total_conversations as i64)),
        })
    }
}

/// Adapter comparison result
#[derive(Debug, Clone, Serialize)]
pub struct AdapterComparison {
    pub adapter_a: LoRAAdapter,
    pub adapter_b: LoRAAdapter,
    pub satisfaction_diff: Option<f32>,  // Positive means A is better
    pub conversation_count_diff: Option<i64>,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_db() -> Arc<Mutex<Database>> {
        let db = Database::new_test_db().unwrap();
        Arc::new(Mutex::new(db))
    }

    fn create_test_adapter_file() -> PathBuf {
        let temp_dir = std::env::temp_dir();
        let adapter_path = temp_dir.join("test_adapter.bin");
        std::fs::write(&adapter_path, b"fake adapter weights").unwrap();
        adapter_path
    }

    #[test]
    fn test_register_adapter() {
        let db = create_test_db();
        let manager = LoRAAdapterManager::new(db).unwrap();

        let adapter_path = create_test_adapter_file();

        let adapter = manager.register_adapter(
            "Test Adapter".to_string(),
            "A test LoRA adapter".to_string(),
            "qwen2.5:14b".to_string(),
            adapter_path.to_str().unwrap().to_string(),
            "1.0.0".to_string(),
            None,
        ).unwrap();

        assert_eq!(adapter.name, "Test Adapter");
        assert_eq!(adapter.version, "1.0.0");
        assert!(!adapter.is_active);

        // Cleanup
        std::fs::remove_file(adapter_path).ok();
    }

    #[test]
    fn test_load_adapter() {
        let db = create_test_db();
        let manager = LoRAAdapterManager::new(Arc::clone(&db)).unwrap();

        let adapter_path = create_test_adapter_file();

        let registered = manager.register_adapter(
            "Load Test".to_string(),
            "Test loading".to_string(),
            "qwen2.5:14b".to_string(),
            adapter_path.to_str().unwrap().to_string(),
            "1.0.0".to_string(),
            None,
        ).unwrap();

        let loaded = manager.load_adapter(&registered.id).unwrap().unwrap();

        assert_eq!(loaded.id, registered.id);
        assert_eq!(loaded.name, "Load Test");

        // Cleanup
        std::fs::remove_file(adapter_path).ok();
    }

    #[test]
    fn test_list_adapters() {
        let db = create_test_db();
        let manager = LoRAAdapterManager::new(Arc::clone(&db)).unwrap();

        let adapter_path = create_test_adapter_file();

        manager.register_adapter(
            "Adapter 1".to_string(),
            "First adapter".to_string(),
            "qwen2.5:14b".to_string(),
            adapter_path.to_str().unwrap().to_string(),
            "1.0.0".to_string(),
            None,
        ).unwrap();

        manager.register_adapter(
            "Adapter 2".to_string(),
            "Second adapter".to_string(),
            "qwen2.5:14b".to_string(),
            adapter_path.to_str().unwrap().to_string(),
            "2.0.0".to_string(),
            None,
        ).unwrap();

        let adapters = manager.list_adapters().unwrap();

        assert_eq!(adapters.len(), 2);
        assert!(adapters.iter().any(|a| a.name == "Adapter 1"));
        assert!(adapters.iter().any(|a| a.name == "Adapter 2"));

        // Cleanup
        std::fs::remove_file(adapter_path).ok();
    }

    #[test]
    fn test_set_active_adapter() {
        let db = create_test_db();
        let manager = LoRAAdapterManager::new(Arc::clone(&db)).unwrap();

        let adapter_path = create_test_adapter_file();

        let adapter = manager.register_adapter(
            "Active Test".to_string(),
            "Test activation".to_string(),
            "qwen2.5:14b".to_string(),
            adapter_path.to_str().unwrap().to_string(),
            "1.0.0".to_string(),
            None,
        ).unwrap();

        manager.set_active_adapter(&adapter.id).unwrap();

        let active = manager.get_active_adapter().unwrap().unwrap();

        assert_eq!(active.id, adapter.id);
        assert!(active.is_active);

        // Cleanup
        std::fs::remove_file(adapter_path).ok();
    }

    #[test]
    fn test_update_performance_metrics() {
        let db = create_test_db();
        let manager = LoRAAdapterManager::new(Arc::clone(&db)).unwrap();

        let adapter_path = create_test_adapter_file();

        let adapter = manager.register_adapter(
            "Metrics Test".to_string(),
            "Test metrics".to_string(),
            "qwen2.5:14b".to_string(),
            adapter_path.to_str().unwrap().to_string(),
            "1.0.0".to_string(),
            None,
        ).unwrap();

        let metrics = PerformanceMetrics {
            avg_satisfaction: 0.85,
            total_conversations: 100,
            training_loss: Some(0.5),
            eval_loss: Some(0.6),
            perplexity: Some(15.2),
        };

        manager.update_performance_metrics(&adapter.id, metrics).unwrap();

        let updated = manager.load_adapter(&adapter.id).unwrap().unwrap();

        assert!(updated.performance_metrics.is_some());
        assert_eq!(updated.performance_metrics.unwrap().avg_satisfaction, 0.85);

        // Cleanup
        std::fs::remove_file(adapter_path).ok();
    }

    #[test]
    fn test_generate_modelfile() {
        let db = create_test_db();
        let manager = LoRAAdapterManager::new(Arc::clone(&db)).unwrap();

        let adapter_path = create_test_adapter_file();

        let adapter = manager.register_adapter(
            "Modelfile Test".to_string(),
            "Test Modelfile generation".to_string(),
            "qwen2.5:14b".to_string(),
            adapter_path.to_str().unwrap().to_string(),
            "1.0.0".to_string(),
            None,
        ).unwrap();

        let modelfile = manager.generate_modelfile(&adapter.id, Some("You are a helpful assistant.".to_string())).unwrap();

        assert!(modelfile.contains("FROM qwen2.5:14b"));
        assert!(modelfile.contains(&format!("ADAPTER {}", adapter_path.to_str().unwrap())));
        assert!(modelfile.contains("PARAMETER temperature"));
        assert!(modelfile.contains("SYSTEM"));

        // Cleanup
        std::fs::remove_file(adapter_path).ok();
    }

    #[test]
    fn test_save_modelfile() {
        let db = create_test_db();
        let manager = LoRAAdapterManager::new(Arc::clone(&db)).unwrap();

        let adapter_path = create_test_adapter_file();

        let adapter = manager.register_adapter(
            "Save Modelfile Test".to_string(),
            "Test saving Modelfile".to_string(),
            "qwen2.5:14b".to_string(),
            adapter_path.to_str().unwrap().to_string(),
            "1.0.0".to_string(),
            None,
        ).unwrap();

        let modelfile_path = manager.save_modelfile(&adapter.id, None).unwrap();

        assert!(modelfile_path.exists());

        let content = std::fs::read_to_string(&modelfile_path).unwrap();
        assert!(content.contains("FROM qwen2.5:14b"));

        // Cleanup
        std::fs::remove_file(adapter_path).ok();
        std::fs::remove_file(modelfile_path).ok();
    }

    #[test]
    fn test_delete_adapter() {
        let db = create_test_db();
        let manager = LoRAAdapterManager::new(Arc::clone(&db)).unwrap();

        let adapter_path = create_test_adapter_file();

        let adapter = manager.register_adapter(
            "Delete Test".to_string(),
            "Test deletion".to_string(),
            "qwen2.5:14b".to_string(),
            adapter_path.to_str().unwrap().to_string(),
            "1.0.0".to_string(),
            None,
        ).unwrap();

        manager.delete_adapter(&adapter.id).unwrap();

        let loaded = manager.load_adapter(&adapter.id).unwrap();
        assert!(loaded.is_none());

        // Cleanup
        std::fs::remove_file(adapter_path).ok();
    }

    #[test]
    fn test_compare_adapters() {
        let db = create_test_db();
        let manager = LoRAAdapterManager::new(Arc::clone(&db)).unwrap();

        let adapter_path = create_test_adapter_file();

        let adapter_a = manager.register_adapter(
            "Adapter A".to_string(),
            "First adapter".to_string(),
            "qwen2.5:14b".to_string(),
            adapter_path.to_str().unwrap().to_string(),
            "1.0.0".to_string(),
            None,
        ).unwrap();

        let adapter_b = manager.register_adapter(
            "Adapter B".to_string(),
            "Second adapter".to_string(),
            "qwen2.5:14b".to_string(),
            adapter_path.to_str().unwrap().to_string(),
            "2.0.0".to_string(),
            None,
        ).unwrap();

        manager.update_performance_metrics(&adapter_a.id, PerformanceMetrics {
            avg_satisfaction: 0.9,
            total_conversations: 100,
            training_loss: None,
            eval_loss: None,
            perplexity: None,
        }).unwrap();

        manager.update_performance_metrics(&adapter_b.id, PerformanceMetrics {
            avg_satisfaction: 0.8,
            total_conversations: 50,
            training_loss: None,
            eval_loss: None,
            perplexity: None,
        }).unwrap();

        let comparison = manager.compare_adapters(&adapter_a.id, &adapter_b.id).unwrap();

        assert!(comparison.satisfaction_diff.is_some());
        assert!(comparison.satisfaction_diff.unwrap() > 0.0); // A is better than B

        // Cleanup
        std::fs::remove_file(adapter_path).ok();
    }

    #[test]
    fn test_modelfile_template() {
        let template = ModelfileTemplate {
            base_model: "qwen2.5:14b".to_string(),
            adapter_path: "/path/to/adapter.bin".to_string(),
            temperature: 0.8,
            top_p: 0.92,
            top_k: 45,
            repeat_penalty: 1.15,
            system_prompt: Some("You are Adam.".to_string()),
        };

        let modelfile = template.generate();

        assert!(modelfile.contains("FROM qwen2.5:14b"));
        assert!(modelfile.contains("ADAPTER /path/to/adapter.bin"));
        assert!(modelfile.contains("PARAMETER temperature 0.8"));
        assert!(modelfile.contains("PARAMETER top_p 0.92"));
        assert!(modelfile.contains("PARAMETER top_k 45"));
        assert!(modelfile.contains("PARAMETER repeat_penalty 1.15"));
        assert!(modelfile.contains("SYSTEM"));
        assert!(modelfile.contains("You are Adam."));
    }
}
