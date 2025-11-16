use anyhow::{Context, Result};
use log::info;
use serde::{Deserialize, Serialize};
use sysinfo::{System, Disks};

/// System specifications detected from user's computer
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemSpecs {
    /// Total RAM in GB
    pub total_ram_gb: u32,

    /// Available RAM in GB
    pub available_ram_gb: u32,

    /// Number of CPU cores
    pub cpu_cores: u32,

    /// CPU brand/name
    pub cpu_name: String,

    /// GPU availability (Metal for macOS, CUDA for Windows)
    pub has_gpu: bool,

    /// GPU name if available
    pub gpu_name: Option<String>,

    /// Free disk space in GB
    pub disk_free_gb: u32,

    /// Operating system
    pub os: String,

    /// OS version
    pub os_version: String,
}

/// System Info Service
pub struct SystemInfoService {
    sys: System,
}

impl SystemInfoService {
    /// Create a new SystemInfoService
    pub fn new() -> Self {
        Self {
            sys: System::new_all(),
        }
    }

    /// Detect system specifications
    pub fn detect_specs(&mut self) -> Result<SystemSpecs> {
        info!("Detecting system specifications...");

        // Refresh system information
        self.sys.refresh_all();

        // Get total RAM in bytes, convert to GB
        let total_ram_bytes = self.sys.total_memory();
        let total_ram_gb = (total_ram_bytes / (1024 * 1024 * 1024)) as u32;

        // Get available RAM in bytes, convert to GB
        let available_ram_bytes = self.sys.available_memory();
        let available_ram_gb = (available_ram_bytes / (1024 * 1024 * 1024)) as u32;

        // Get CPU information
        let cpu_cores = self.sys.cpus().len() as u32;
        let cpu_name = if let Some(cpu) = self.sys.cpus().first() {
            cpu.brand().to_string()
        } else {
            "Unknown CPU".to_string()
        };

        // Detect GPU (platform-specific)
        let (has_gpu, gpu_name) = self.detect_gpu()?;

        // Get disk space
        let disk_free_gb = self.get_free_disk_space()?;

        // Get OS information
        let os = System::name().unwrap_or_else(|| "Unknown".to_string());
        let os_version = System::os_version().unwrap_or_else(|| "Unknown".to_string());

        let specs = SystemSpecs {
            total_ram_gb,
            available_ram_gb,
            cpu_cores,
            cpu_name: cpu_name.clone(),
            has_gpu,
            gpu_name: gpu_name.clone(),
            disk_free_gb,
            os: os.clone(),
            os_version,
        };

        info!("System specs detected:");
        info!("  RAM: {}GB total, {}GB available", total_ram_gb, available_ram_gb);
        info!("  CPU: {} ({} cores)", cpu_name, cpu_cores);
        info!("  GPU: {} ({})",
            if has_gpu { "Available" } else { "Not detected" },
            gpu_name.as_deref().unwrap_or("N/A")
        );
        info!("  Disk: {}GB free", disk_free_gb);
        info!("  OS: {} {}", os, specs.os_version);

        Ok(specs)
    }

    /// Detect GPU availability and name (platform-specific)
    fn detect_gpu(&self) -> Result<(bool, Option<String>)> {
        #[cfg(target_os = "macos")]
        {
            // macOS: Check for Metal support
            // Apple Silicon Macs (M1, M2, M3) have integrated GPUs with Metal support
            // Intel Macs may have discrete GPUs
            use std::process::Command;

            let output = Command::new("system_profiler")
                .args(&["SPDisplaysDataType", "-json"])
                .output()
                .context("Failed to run system_profiler")?;

            if output.status.success() {
                let json_str = String::from_utf8_lossy(&output.stdout);

                // Check if we have any GPU detected
                if json_str.contains("sppci_model") || json_str.contains("_name") {
                    // Try to extract GPU name (simplified parsing)
                    let gpu_name = if json_str.contains("Apple M") {
                        Some("Apple Silicon (Metal)".to_string())
                    } else if json_str.contains("AMD") {
                        Some("AMD GPU (Metal)".to_string())
                    } else if json_str.contains("Intel") {
                        Some("Intel GPU (Metal)".to_string())
                    } else {
                        Some("GPU (Metal supported)".to_string())
                    };

                    return Ok((true, gpu_name));
                }
            }

            // Fallback: Assume Metal is available on macOS 10.11+
            Ok((true, Some("Metal supported".to_string())))
        }

        #[cfg(target_os = "windows")]
        {
            // Windows: Check for NVIDIA CUDA or DirectX GPU
            use std::process::Command;

            // Try nvidia-smi for NVIDIA GPUs
            if let Ok(output) = Command::new("nvidia-smi")
                .arg("--query-gpu=name")
                .arg("--format=csv,noheader")
                .output()
            {
                if output.status.success() {
                    let gpu_name = String::from_utf8_lossy(&output.stdout).trim().to_string();
                    if !gpu_name.is_empty() {
                        return Ok((true, Some(format!("{} (CUDA)", gpu_name))));
                    }
                }
            }

            // Try wmic for any GPU
            if let Ok(output) = Command::new("wmic")
                .args(&["path", "win32_VideoController", "get", "name"])
                .output()
            {
                if output.status.success() {
                    let gpu_info = String::from_utf8_lossy(&output.stdout);
                    let lines: Vec<&str> = gpu_info.lines().collect();

                    // Skip header line, get first GPU
                    if lines.len() > 1 {
                        let gpu_name = lines[1].trim().to_string();
                        if !gpu_name.is_empty() && gpu_name != "Name" {
                            return Ok((true, Some(gpu_name)));
                        }
                    }
                }
            }

            Ok((false, None))
        }

        #[cfg(not(any(target_os = "macos", target_os = "windows")))]
        {
            // Linux: Check for NVIDIA CUDA
            use std::process::Command;

            if let Ok(output) = Command::new("nvidia-smi")
                .arg("--query-gpu=name")
                .arg("--format=csv,noheader")
                .output()
            {
                if output.status.success() {
                    let gpu_name = String::from_utf8_lossy(&output.stdout).trim().to_string();
                    if !gpu_name.is_empty() {
                        return Ok((true, Some(format!("{} (CUDA)", gpu_name))));
                    }
                }
            }

            Ok((false, None))
        }
    }

    /// Get free disk space in GB
    fn get_free_disk_space(&self) -> Result<u32> {
        let disks = Disks::new_with_refreshed_list();

        // Get the first disk (usually system disk)
        if let Some(disk) = disks.list().first() {
            let available_bytes = disk.available_space();
            let available_gb = (available_bytes / (1024 * 1024 * 1024)) as u32;
            Ok(available_gb)
        } else {
            // Fallback if no disk detected
            Ok(0)
        }
    }

    /// Check if system meets minimum requirements
    pub fn meets_minimum_requirements(specs: &SystemSpecs) -> bool {
        // Minimum requirements:
        // - 8GB RAM
        // - 20GB free disk space
        specs.total_ram_gb >= 8 && specs.disk_free_gb >= 20
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_specs() {
        let mut service = SystemInfoService::new();
        let specs = service.detect_specs();

        assert!(specs.is_ok());
        let specs = specs.unwrap();

        // Basic sanity checks
        assert!(specs.total_ram_gb > 0);
        assert!(specs.cpu_cores > 0);
        assert!(!specs.cpu_name.is_empty());
        assert!(!specs.os.is_empty());
    }

    #[test]
    fn test_minimum_requirements() {
        let good_specs = SystemSpecs {
            total_ram_gb: 16,
            available_ram_gb: 8,
            cpu_cores: 8,
            cpu_name: "Test CPU".to_string(),
            has_gpu: true,
            gpu_name: Some("Test GPU".to_string()),
            disk_free_gb: 50,
            os: "Test OS".to_string(),
            os_version: "1.0".to_string(),
        };

        assert!(SystemInfoService::meets_minimum_requirements(&good_specs));

        let bad_specs = SystemSpecs {
            total_ram_gb: 4,
            available_ram_gb: 2,
            cpu_cores: 2,
            cpu_name: "Test CPU".to_string(),
            has_gpu: false,
            gpu_name: None,
            disk_free_gb: 10,
            os: "Test OS".to_string(),
            os_version: "1.0".to_string(),
        };

        assert!(!SystemInfoService::meets_minimum_requirements(&bad_specs));
    }
}
