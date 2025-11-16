/**
 * File System Commands for Tauri
 *
 * Exposes secure file system operations to the frontend
 */

use crate::services::file::{
    DirectoryEntry, FileMetadata, FileService, WorkspaceInfo,
};
use log::{error, info};

/// Read file contents as string
#[tauri::command]
pub async fn file_read(path: String) -> Result<String, String> {
    info!("Command: file_read - {}", path);

    FileService::read_file(&path)
        .map_err(|e| {
            error!("Failed to read file {}: {}", path, e);
            format!("Failed to read file: {}", e)
        })
}

/// Write contents to file
#[tauri::command]
pub async fn file_write(path: String, contents: String) -> Result<(), String> {
    info!("Command: file_write - {} ({} bytes)", path, contents.len());

    FileService::write_file(&path, &contents)
        .map_err(|e| {
            error!("Failed to write file {}: {}", path, e);
            format!("Failed to write file: {}", e)
        })
}

/// Delete file
#[tauri::command]
pub async fn file_delete(path: String) -> Result<(), String> {
    info!("Command: file_delete - {}", path);

    FileService::delete_file(&path)
        .map_err(|e| {
            error!("Failed to delete file {}: {}", path, e);
            format!("Failed to delete file: {}", e)
        })
}

/// Get file metadata
#[tauri::command]
pub async fn file_get_metadata(path: String) -> Result<FileMetadata, String> {
    info!("Command: file_get_metadata - {}", path);

    FileService::get_metadata(&path)
        .map_err(|e| {
            error!("Failed to get metadata for {}: {}", path, e);
            format!("Failed to get file metadata: {}", e)
        })
}

/// List directory contents
#[tauri::command]
pub async fn file_list_directory(path: String) -> Result<Vec<DirectoryEntry>, String> {
    info!("Command: file_list_directory - {}", path);

    FileService::list_directory(&path)
        .map_err(|e| {
            error!("Failed to list directory {}: {}", path, e);
            format!("Failed to list directory: {}", e)
        })
}

/// Create directory
#[tauri::command]
pub async fn file_create_directory(path: String) -> Result<(), String> {
    info!("Command: file_create_directory - {}", path);

    FileService::create_directory(&path)
        .map_err(|e| {
            error!("Failed to create directory {}: {}", path, e);
            format!("Failed to create directory: {}", e)
        })
}

/// Delete directory (recursive)
#[tauri::command]
pub async fn file_delete_directory(path: String) -> Result<(), String> {
    info!("Command: file_delete_directory - {}", path);

    FileService::delete_directory(&path)
        .map_err(|e| {
            error!("Failed to delete directory {}: {}", path, e);
            format!("Failed to delete directory: {}", e)
        })
}

/// Search files by name pattern
#[tauri::command]
pub async fn file_search(directory: String, pattern: String) -> Result<Vec<String>, String> {
    info!("Command: file_search - {} with pattern: {}", directory, pattern);

    FileService::search_files(&directory, &pattern)
        .map_err(|e| {
            error!("Failed to search files in {}: {}", directory, e);
            format!("Failed to search files: {}", e)
        })
}

/// Detect workspace type
#[tauri::command]
pub async fn file_detect_workspace(path: String) -> Result<WorkspaceInfo, String> {
    info!("Command: file_detect_workspace - {}", path);

    FileService::detect_workspace(&path)
        .map_err(|e| {
            error!("Failed to detect workspace for {}: {}", path, e);
            format!("Failed to detect workspace: {}", e)
        })
}

/// Check if path exists
#[tauri::command]
pub async fn file_exists(path: String) -> Result<bool, String> {
    FileService::exists(&path)
        .map_err(|e| format!("Failed to check existence: {}", e))
}

/// Check if path is a directory
#[tauri::command]
pub async fn file_is_directory(path: String) -> Result<bool, String> {
    FileService::is_directory(&path)
        .map_err(|e| format!("Failed to check if directory: {}", e))
}

/// Check if path is a file
#[tauri::command]
pub async fn file_is_file(path: String) -> Result<bool, String> {
    FileService::is_file(&path)
        .map_err(|e| format!("Failed to check if file: {}", e))
}
