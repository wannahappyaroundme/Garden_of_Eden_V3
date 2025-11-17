/**
 * Git Commands for Tauri
 *
 * Exposes Git operations to the frontend
 */

use crate::services::git::{GitBranch, GitCommit, GitService, GitStatus};
use log::{error, info};

/// Check if directory is a git repository
#[tauri::command]
pub async fn git_is_repository(path: String) -> Result<bool, String> {
    info!("Command: git_is_repository - {}", path);

    GitService::is_repository(&path)
        .map_err(|e| {
            error!("Failed to check repository status for {}: {}", path, e);
            format!("Failed to check repository: {}", e)
        })
}

/// Initialize new git repository
#[tauri::command]
pub async fn git_init_repository(path: String) -> Result<(), String> {
    info!("Command: git_init_repository - {}", path);

    GitService::init_repository(&path)
        .map_err(|e| {
            error!("Failed to initialize repository at {}: {}", path, e);
            format!("Failed to initialize repository: {}", e)
        })
}

/// Get repository status
#[tauri::command]
pub async fn git_get_status(repo_path: String) -> Result<GitStatus, String> {
    info!("Command: git_get_status - {}", repo_path);

    GitService::get_status(&repo_path)
        .map_err(|e| {
            error!("Failed to get status for {}: {}", repo_path, e);
            format!("Failed to get repository status: {}", e)
        })
}

/// Get diff (changes)
#[tauri::command]
pub async fn git_get_diff(repo_path: String, staged: bool) -> Result<String, String> {
    info!("Command: git_get_diff - {} (staged: {})", repo_path, staged);

    GitService::get_diff(&repo_path, staged)
        .map_err(|e| {
            error!("Failed to get diff for {}: {}", repo_path, e);
            format!("Failed to get diff: {}", e)
        })
}

/// Stage files (git add)
#[tauri::command]
pub async fn git_stage_files(repo_path: String, paths: Vec<String>) -> Result<(), String> {
    info!("Command: git_stage_files - {} ({} files)", repo_path, paths.len());

    GitService::stage_files(&repo_path, paths)
        .map_err(|e| {
            error!("Failed to stage files in {}: {}", repo_path, e);
            format!("Failed to stage files: {}", e)
        })
}

/// Unstage files (git reset)
#[tauri::command]
pub async fn git_unstage_files(repo_path: String, paths: Vec<String>) -> Result<(), String> {
    info!("Command: git_unstage_files - {} ({} files)", repo_path, paths.len());

    GitService::unstage_files(&repo_path, paths)
        .map_err(|e| {
            error!("Failed to unstage files in {}: {}", repo_path, e);
            format!("Failed to unstage files: {}", e)
        })
}

/// Create commit
#[tauri::command]
pub async fn git_commit(
    repo_path: String,
    message: String,
    author_name: String,
    author_email: String,
) -> Result<String, String> {
    info!("Command: git_commit - {}", repo_path);

    GitService::commit(&repo_path, &message, &author_name, &author_email)
        .map_err(|e| {
            error!("Failed to create commit in {}: {}", repo_path, e);
            format!("Failed to create commit: {}", e)
        })
}

/// Push to remote
#[tauri::command]
pub async fn git_push(repo_path: String, remote_name: String, branch_name: String) -> Result<(), String> {
    info!("Command: git_push - {}/{}", remote_name, branch_name);

    GitService::push(&repo_path, &remote_name, &branch_name)
        .map_err(|e| {
            error!("Failed to push to {}/{}: {}", remote_name, branch_name, e);
            format!("Failed to push: {}", e)
        })
}

/// Get commit log
#[tauri::command]
pub async fn git_get_log(repo_path: String, limit: usize) -> Result<Vec<GitCommit>, String> {
    info!("Command: git_get_log - {} (limit: {})", repo_path, limit);

    GitService::get_log(&repo_path, limit)
        .map_err(|e| {
            error!("Failed to get log for {}: {}", repo_path, e);
            format!("Failed to get commit log: {}", e)
        })
}

/// List branches
#[tauri::command]
pub async fn git_list_branches(repo_path: String) -> Result<Vec<GitBranch>, String> {
    info!("Command: git_list_branches - {}", repo_path);

    GitService::list_branches(&repo_path)
        .map_err(|e| {
            error!("Failed to list branches for {}: {}", repo_path, e);
            format!("Failed to list branches: {}", e)
        })
}

/// Create new branch
#[tauri::command]
pub async fn git_create_branch(repo_path: String, branch_name: String) -> Result<(), String> {
    info!("Command: git_create_branch - {} ({})", repo_path, branch_name);

    GitService::create_branch(&repo_path, &branch_name)
        .map_err(|e| {
            error!("Failed to create branch {} in {}: {}", branch_name, repo_path, e);
            format!("Failed to create branch: {}", e)
        })
}

/// Checkout branch
#[tauri::command]
pub async fn git_checkout_branch(repo_path: String, branch_name: String) -> Result<(), String> {
    info!("Command: git_checkout_branch - {} ({})", repo_path, branch_name);

    GitService::checkout_branch(&repo_path, &branch_name)
        .map_err(|e| {
            error!("Failed to checkout branch {} in {}: {}", branch_name, repo_path, e);
            format!("Failed to checkout branch: {}", e)
        })
}

/// Get current branch name
#[tauri::command]
pub async fn git_get_current_branch(repo_path: String) -> Result<String, String> {
    info!("Command: git_get_current_branch - {}", repo_path);

    GitService::get_current_branch(&repo_path)
        .map_err(|e| {
            error!("Failed to get current branch for {}: {}", repo_path, e);
            format!("Failed to get current branch: {}", e)
        })
}
