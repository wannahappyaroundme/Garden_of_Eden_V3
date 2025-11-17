// Library entry point for Garden of Eden V3
// Exposes modules for testing and internal use

pub mod database;
pub mod services;

// Re-export commonly used types for testing
pub use database::{Database, models, schema};
pub use services::learning;
