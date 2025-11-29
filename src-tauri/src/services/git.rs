/**
 * Production-Level Git Integration Service
 *
 * Provides Git operations for AI assistant:
 * - Repository detection and initialization
 * - Status checking (modified, staged, untracked files)
 * - Diff generation
 * - Commit creation with messages
 * - Push to remote
 * - Branch operations
 * - Log and history
 */

use anyhow::{anyhow, Result};
use git2::{
    Repository, Status, StatusOptions, Signature,
    BranchType, Diff, DiffFormat,
};
use log::info;
use serde::{Deserialize, Serialize};
use std::path::Path;

/// Git file status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitFileStatus {
    pub path: String,
    pub status: String,  // "modified", "added", "deleted", "untracked", "renamed"
    pub staged: bool,
}

/// Git repository status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitStatus {
    pub branch: String,
    pub ahead: usize,
    pub behind: usize,
    pub files: Vec<GitFileStatus>,
    pub is_clean: bool,
}

/// Git commit information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitCommit {
    pub id: String,
    pub author: String,
    pub email: String,
    pub message: String,
    pub timestamp: i64,
}

/// Git branch information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitBranch {
    pub name: String,
    pub is_current: bool,
    pub is_remote: bool,
}

/// Git Service
pub struct GitService;

impl GitService {
    /// Open repository at path
    fn open_repo(path: &str) -> Result<Repository> {
        Repository::open(path)
            .map_err(|e| anyhow!("Failed to open repository: {}", e))
    }

    /// Check if directory is a git repository
    pub fn is_repository(path: &str) -> Result<bool> {
        match Repository::open(path) {
            Ok(_) => Ok(true),
            Err(_) => Ok(false),
        }
    }

    /// Initialize new git repository
    pub fn init_repository(path: &str) -> Result<()> {
        info!("Initializing git repository at: {}", path);

        Repository::init(path)
            .map_err(|e| anyhow!("Failed to initialize repository: {}", e))?;

        info!("Git repository initialized successfully");
        Ok(())
    }

    /// Get repository status
    pub fn get_status(repo_path: &str) -> Result<GitStatus> {
        info!("Getting git status for: {}", repo_path);

        let repo = Self::open_repo(repo_path)?;

        // Get current branch
        let head = repo.head()?;
        let branch_name = if head.is_branch() {
            head.shorthand().unwrap_or("HEAD").to_string()
        } else {
            "HEAD (detached)".to_string()
        };

        // Get ahead/behind count
        let (ahead, behind) = Self::get_ahead_behind(&repo)?;

        // Get file statuses
        let mut opts = StatusOptions::new();
        opts.include_untracked(true);
        opts.recurse_untracked_dirs(true);

        let statuses = repo.statuses(Some(&mut opts))?;
        let mut files = Vec::new();

        for entry in statuses.iter() {
            let path = entry.path().unwrap_or("").to_string();
            let status_flags = entry.status();

            let (status, staged) = Self::parse_status_flags(status_flags);

            files.push(GitFileStatus {
                path,
                status,
                staged,
            });
        }

        let is_clean = files.is_empty();

        let status = GitStatus {
            branch: branch_name,
            ahead,
            behind,
            files,
            is_clean,
        };

        info!("Git status: {} files changed, branch: {}", status.files.len(), status.branch);
        Ok(status)
    }

    /// Parse git status flags
    fn parse_status_flags(flags: Status) -> (String, bool) {
        if flags.is_index_new() || flags.is_wt_new() {
            ("added".to_string(), flags.is_index_new())
        } else if flags.is_index_modified() || flags.is_wt_modified() {
            ("modified".to_string(), flags.is_index_modified())
        } else if flags.is_index_deleted() || flags.is_wt_deleted() {
            ("deleted".to_string(), flags.is_index_deleted())
        } else if flags.is_index_renamed() || flags.is_wt_renamed() {
            ("renamed".to_string(), flags.is_index_renamed())
        } else {
            ("untracked".to_string(), false)
        }
    }

    /// Get ahead/behind count
    fn get_ahead_behind(repo: &Repository) -> Result<(usize, usize)> {
        let head = repo.head()?;

        if !head.is_branch() {
            return Ok((0, 0));
        }

        let local_oid = head.target().ok_or_else(|| anyhow!("No target for HEAD"))?;

        // Try to get upstream branch
        let branch = git2::Branch::wrap(head);
        let upstream = match branch.upstream() {
            Ok(u) => u,
            Err(_) => return Ok((0, 0)), // No upstream
        };

        let upstream_oid = upstream.get().target().ok_or_else(|| anyhow!("No target for upstream"))?;

        let (ahead, behind) = repo.graph_ahead_behind(local_oid, upstream_oid)?;

        Ok((ahead, behind))
    }

    /// Get diff (changes)
    pub fn get_diff(repo_path: &str, staged: bool) -> Result<String> {
        info!("Getting git diff for: {} (staged: {})", repo_path, staged);

        let repo = Self::open_repo(repo_path)?;

        let diff = if staged {
            // Diff between index and HEAD
            let tree = repo.head()?.peel_to_tree()?;
            repo.diff_tree_to_index(Some(&tree), None, None)?
        } else {
            // Diff between working directory and index
            repo.diff_index_to_workdir(None, None)?
        };

        let diff_text = Self::diff_to_string(&diff)?;

        info!("Generated diff: {} bytes", diff_text.len());
        Ok(diff_text)
    }

    /// Convert diff to string
    fn diff_to_string(diff: &Diff) -> Result<String> {
        let mut diff_text = String::new();

        diff.print(DiffFormat::Patch, |_delta, _hunk, line| {
            let content = std::str::from_utf8(line.content()).unwrap_or("");
            diff_text.push_str(content);
            true
        })?;

        Ok(diff_text)
    }

    /// Stage files (git add)
    pub fn stage_files(repo_path: &str, paths: Vec<String>) -> Result<()> {
        info!("Staging {} files in: {}", paths.len(), repo_path);

        let repo = Self::open_repo(repo_path)?;
        let mut index = repo.index()?;

        for path in &paths {
            index.add_path(Path::new(path))?;
        }

        index.write()?;

        info!("Successfully staged {} files", paths.len());
        Ok(())
    }

    /// Unstage files (git reset)
    pub fn unstage_files(repo_path: &str, paths: Vec<String>) -> Result<()> {
        info!("Unstaging {} files in: {}", paths.len(), repo_path);

        let repo = Self::open_repo(repo_path)?;
        let head = repo.head()?.peel_to_tree()?;
        let mut index = repo.index()?;

        for path in &paths {
            let path_obj = Path::new(path);

            // Reset the file in index to HEAD version
            if let Ok(entry) = head.get_path(path_obj) {
                index.add(&git2::IndexEntry {
                    ctime: git2::IndexTime::new(0, 0),
                    mtime: git2::IndexTime::new(0, 0),
                    dev: 0,
                    ino: 0,
                    mode: entry.filemode() as u32,
                    uid: 0,
                    gid: 0,
                    file_size: 0,
                    id: entry.id(),
                    flags: 0,
                    flags_extended: 0,
                    path: path.as_bytes().to_vec(),
                })?;
            }
        }

        index.write()?;

        info!("Successfully unstaged {} files", paths.len());
        Ok(())
    }

    /// Create commit
    pub fn commit(
        repo_path: &str,
        message: &str,
        author_name: &str,
        author_email: &str,
    ) -> Result<String> {
        info!("Creating commit in: {}", repo_path);

        let repo = Self::open_repo(repo_path)?;
        let signature = Signature::now(author_name, author_email)?;

        let mut index = repo.index()?;
        let tree_id = index.write_tree()?;
        let tree = repo.find_tree(tree_id)?;

        // Check if this is the initial commit (no HEAD yet)
        let parents = match repo.head() {
            Ok(head) => {
                let parent_commit = head.peel_to_commit()?;
                vec![parent_commit]
            }
            Err(_) => vec![], // No parent for initial commit
        };

        let parent_refs: Vec<&_> = parents.iter().collect();

        let commit_id = repo.commit(
            Some("HEAD"),
            &signature,
            &signature,
            message,
            &tree,
            &parent_refs,
        )?;

        let commit_id_str = commit_id.to_string();
        info!("Created commit: {}", commit_id_str);

        Ok(commit_id_str)
    }

    /// Push to remote
    pub fn push(repo_path: &str, remote_name: &str, branch_name: &str) -> Result<()> {
        info!("Pushing to remote: {}/{}", remote_name, branch_name);

        let repo = Self::open_repo(repo_path)?;
        let mut remote = repo.find_remote(remote_name)?;

        let refspec = format!("refs/heads/{}", branch_name);

        remote.push(&[&refspec], None)?;

        info!("Successfully pushed to {}/{}", remote_name, branch_name);
        Ok(())
    }

    /// Get commit log
    pub fn get_log(repo_path: &str, limit: usize) -> Result<Vec<GitCommit>> {
        info!("Getting commit log for: {} (limit: {})", repo_path, limit);

        let repo = Self::open_repo(repo_path)?;
        let mut revwalk = repo.revwalk()?;

        revwalk.push_head()?;
        revwalk.set_sorting(git2::Sort::TIME)?;

        let mut commits = Vec::new();

        for oid in revwalk.take(limit) {
            let oid = oid?;
            let commit = repo.find_commit(oid)?;

            commits.push(GitCommit {
                id: oid.to_string(),
                author: commit.author().name().unwrap_or("").to_string(),
                email: commit.author().email().unwrap_or("").to_string(),
                message: commit.message().unwrap_or("").to_string(),
                timestamp: commit.time().seconds(),
            });
        }

        info!("Retrieved {} commits", commits.len());
        Ok(commits)
    }

    /// List branches
    pub fn list_branches(repo_path: &str) -> Result<Vec<GitBranch>> {
        info!("Listing branches for: {}", repo_path);

        let repo = Self::open_repo(repo_path)?;
        let branches = repo.branches(None)?;

        let current_branch = repo.head()?.shorthand().unwrap_or("").to_string();
        let mut branch_list = Vec::new();

        for branch in branches {
            let (branch, branch_type) = branch?;
            let name = branch.name()?.unwrap_or("").to_string();
            let is_current = name == current_branch;
            let is_remote = branch_type == BranchType::Remote;

            branch_list.push(GitBranch {
                name,
                is_current,
                is_remote,
            });
        }

        info!("Found {} branches", branch_list.len());
        Ok(branch_list)
    }

    /// Create new branch
    pub fn create_branch(repo_path: &str, branch_name: &str) -> Result<()> {
        info!("Creating branch: {} in {}", branch_name, repo_path);

        let repo = Self::open_repo(repo_path)?;
        let head = repo.head()?.peel_to_commit()?;

        repo.branch(branch_name, &head, false)?;

        info!("Branch created: {}", branch_name);
        Ok(())
    }

    /// Checkout branch
    pub fn checkout_branch(repo_path: &str, branch_name: &str) -> Result<()> {
        info!("Checking out branch: {} in {}", branch_name, repo_path);

        let repo = Self::open_repo(repo_path)?;
        let obj = repo.revparse_single(&format!("refs/heads/{}", branch_name))?;

        repo.checkout_tree(&obj, None)?;
        repo.set_head(&format!("refs/heads/{}", branch_name))?;

        info!("Checked out branch: {}", branch_name);
        Ok(())
    }

    /// Get current branch name
    pub fn get_current_branch(repo_path: &str) -> Result<String> {
        let repo = Self::open_repo(repo_path)?;
        let head = repo.head()?;

        let branch_name = if head.is_branch() {
            head.shorthand().unwrap_or("HEAD").to_string()
        } else {
            "HEAD (detached)".to_string()
        };

        Ok(branch_name)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;
    use std::fs;

    fn setup_test_repo(test_name: &str) -> (String, tempfile::TempDir) {
        let temp_dir = tempfile::tempdir().unwrap();
        let repo_path = temp_dir.path().to_str().unwrap().to_string();

        // Initialize repo
        GitService::init_repository(&repo_path).unwrap();

        // Create initial commit (required for git operations)
        let init_file = format!("{}/README.md", repo_path);
        fs::write(&init_file, "# Test Repository").unwrap();
        GitService::stage_files(&repo_path, vec!["README.md".to_string()]).unwrap();
        GitService::commit(&repo_path, "Initial commit", "Test User", "test@example.com").unwrap();

        (repo_path, temp_dir)
    }

    #[test]
    fn test_init_repository() {
        let temp_dir = tempfile::tempdir().unwrap();
        let path = temp_dir.path().to_str().unwrap();

        GitService::init_repository(path).unwrap();
        assert!(GitService::is_repository(path).unwrap());
    }

    #[test]
    fn test_is_repository() {
        let (repo_path, _temp) = setup_test_repo("is_repo");

        assert!(GitService::is_repository(&repo_path).unwrap());

        let non_repo = env::temp_dir().join("not_a_repo");
        assert!(!GitService::is_repository(non_repo.to_str().unwrap()).unwrap());
    }

    #[test]
    fn test_get_current_branch() {
        let (repo_path, _temp) = setup_test_repo("current_branch");

        let branch = GitService::get_current_branch(&repo_path).unwrap();
        // New repos might have "main" or "master" depending on git config
        assert!(branch == "main" || branch == "master" || branch.contains("HEAD"));
    }

    #[test]
    fn test_create_and_list_branches() {
        let (repo_path, _temp) = setup_test_repo("branches");

        // Need at least one commit to create branches
        fs::write(format!("{}/test.txt", repo_path), "test").unwrap();
        GitService::stage_files(&repo_path, vec!["test.txt".to_string()]).unwrap();
        GitService::commit(&repo_path, "Initial commit", "Test", "test@example.com").unwrap();

        GitService::create_branch(&repo_path, "feature").unwrap();

        let branches = GitService::list_branches(&repo_path).unwrap();
        assert!(branches.len() >= 2); // main/master + feature
    }

    #[test]
    fn test_stage_and_commit() {
        let (repo_path, _temp) = setup_test_repo("stage_commit");

        // Create a file
        fs::write(format!("{}/test.txt", repo_path), "Hello, Git!").unwrap();

        // Stage it
        GitService::stage_files(&repo_path, vec!["test.txt".to_string()]).unwrap();

        // Commit it
        let commit_id = GitService::commit(
            &repo_path,
            "Add test file",
            "Test Author",
            "test@example.com",
        ).unwrap();

        assert!(!commit_id.is_empty());
    }

    #[test]
    fn test_get_status() {
        let (repo_path, _temp) = setup_test_repo("status");

        // Create and commit initial file
        fs::write(format!("{}/test.txt", repo_path), "initial").unwrap();
        GitService::stage_files(&repo_path, vec!["test.txt".to_string()]).unwrap();
        GitService::commit(&repo_path, "Initial", "Test", "test@example.com").unwrap();

        // Modify file
        fs::write(format!("{}/test.txt", repo_path), "modified").unwrap();

        let status = GitService::get_status(&repo_path).unwrap();
        assert!(!status.is_clean);
        assert!(status.files.len() > 0);
    }

    #[test]
    fn test_get_log() {
        let (repo_path, _temp) = setup_test_repo("log");

        // Create commits (setup already created 1 initial commit)
        for i in 1..=3 {
            let filename = format!("file{}.txt", i);
            fs::write(format!("{}/{}", repo_path, filename), format!("content{}", i)).unwrap();
            GitService::stage_files(&repo_path, vec![filename]).unwrap();
            GitService::commit(&repo_path, &format!("Commit {}", i), "Test", "test@example.com").unwrap();
        }

        let log = GitService::get_log(&repo_path, 10).unwrap();
        assert_eq!(log.len(), 4); // 3 test commits + 1 initial commit
        assert_eq!(log[0].message, "Commit 3"); // Most recent commit first
    }
}
