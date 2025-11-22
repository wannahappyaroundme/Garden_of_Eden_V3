# Windows Development Guide - 100% Quality

Complete guide for developing and building Garden of Eden V3 on Windows with production-grade quality.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Setup](#development-setup)
3. [Building for Production](#building-for-production)
4. [Quality Assurance](#quality-assurance)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)
7. [Performance Optimization](#performance-optimization)

---

## Prerequisites

### System Requirements

**Minimum:**
- Windows 10 (21H1 or later) / Windows 11
- 8GB RAM
- 20GB free disk space
- x64 processor

**Recommended:**
- Windows 11 (latest)
- 16GB+ RAM
- 50GB+ free disk space (for models)
- GPU with 8GB+ VRAM for optimal LLM performance

### Required Software

#### 1. Visual Studio Build Tools

**Required for Rust compilation:**

```powershell
# Download Visual Studio 2022 Build Tools
# https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022

# During installation, select:
# - Desktop development with C++
# - Windows 10/11 SDK
# - MSVC v143 - VS 2022 C++ x64/x86 build tools
```

#### 2. Node.js 20 LTS

```powershell
# Download from https://nodejs.org/
# Or use winget:
winget install OpenJS.NodeJS.LTS

# Verify installation
node --version  # Should be v20.x.x
npm --version   # Should be 10.x.x
```

#### 3. Rust

```powershell
# Download from https://rustup.rs/
# Or direct download: https://win.rust-lang.org/x86_64

# Verify installation
rustc --version  # Should be 1.70+
cargo --version  # Should be 1.70+

# Add Windows target (should be installed by default)
rustup target add x86_64-pc-windows-msvc
```

#### 4. Protocol Buffers

```powershell
# Install via Chocolatey
choco install protoc -y

# Or download manually from:
# https://github.com/protocolbuffers/protobuf/releases

# Verify installation
protoc --version  # Should be 3.x or 25.x+
```

#### 5. Ollama (for AI models)

```powershell
# Download from https://ollama.com/download/windows
# Or use winget:
winget install Ollama.Ollama

# Pull required models
ollama pull qwen2.5:14b
ollama pull bge-m3
```

#### 6. Git

```powershell
# Download from https://git-scm.com/download/win
# Or use winget:
winget install Git.Git

# Configure Git
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

---

## Development Setup

### 1. Clone Repository

```powershell
git clone https://github.com/wannahappyaroundme/Garden_of_Eden_V3.git
cd Garden_of_Eden_V3
```

### 2. Install Dependencies

```powershell
# Install npm packages
npm install

# Verify Rust dependencies
cd src-tauri
cargo check
cd ..
```

### 3. Environment Configuration

Create `.env` file in project root:

```env
# Development mode
NODE_ENV=development

# Database path
DATABASE_PATH=%APPDATA%\\garden-of-eden-v3\\data.db

# Ollama configuration
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=qwen2.5:14b
OLLAMA_EMBEDDING_MODEL=bge-m3

# VRAM settings (adjust based on your GPU)
MIN_VRAM_GB=6
RECOMMENDED_VRAM_GB=12

# Debug settings
RUST_LOG=info
RUST_BACKTRACE=1
```

### 4. Development Mode

```powershell
# Start development server (renderer + Tauri)
npm run dev

# Or start separately:
npm run dev:renderer  # Vite dev server on localhost:5173
npm run tauri dev     # Tauri app with hot reload
```

---

## Building for Production

### Build Process

```powershell
# Clean previous builds
Remove-Item -Recurse -Force src-tauri\target\release -ErrorAction SilentlyContinue

# Type check TypeScript
npm run type-check

# Build React renderer
npm run build:renderer

# Build Windows installers (NSIS + MSI)
npm run tauri:build:win

# Output:
# - NSIS: src-tauri\target\x86_64-pc-windows-msvc\release\bundle\nsis\*.exe
# - MSI:  src-tauri\target\x86_64-pc-windows-msvc\release\bundle\msi\*.msi
```

### Build Configuration

**Tauri Windows Settings** ([src-tauri/tauri.conf.json](../src-tauri/tauri.conf.json)):

```json
{
  "bundle": {
    "windows": {
      "certificateThumbprint": null,
      "digestAlgorithm": "sha256",
      "timestampUrl": "",
      "wix": {
        "language": ["en-US", "ko-KR"],
        "template": null,
        "bannerPath": null,
        "dialogImagePath": null
      },
      "nsis": {
        "installerIcon": "icons/icon.ico",
        "installMode": "currentUser",
        "languages": ["English", "Korean"],
        "displayLanguageSelector": true,
        "compression": "lzma",
        "oneClick": false,
        "allowToChangeInstallationDirectory": true
      }
    }
  }
}
```

### Installer Types

#### NSIS Installer (Recommended)

**Features:**
- Modern UI with language selection
- User/system-wide installation choice
- Custom installation directory
- Uninstaller included
- File associations
- Start menu shortcuts

**File:** `Garden of Eden V3_3.4.0_x64-setup.exe`

**Size:** ~150-250 MB (includes all dependencies)

#### MSI Installer

**Features:**
- Windows Installer standard
- Group Policy deployment support
- Corporate environment compatible
- Automated deployment via SCCM/Intune
- Repair and modify options

**File:** `Garden of Eden V3_3.4.0_x64.msi`

**Size:** ~150-250 MB

---

## Quality Assurance

### Code Quality Checks

#### 1. TypeScript Quality

```powershell
# Type checking (zero errors required)
npm run type-check

# Linting
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

#### 2. Rust Quality

```powershell
cd src-tauri

# Format check (required before commit)
cargo fmt --all -- --check

# Apply formatting
cargo fmt --all

# Clippy linting (zero warnings required)
cargo clippy --all-targets --all-features -- -D warnings

# Run tests
cargo test --all
```

#### 3. Build Quality

```powershell
# Zero compilation errors
cargo build --release

# Zero warnings in critical areas
cargo build --release 2>&1 | Select-String "warning:" | Measure-Object
```

### Testing Strategy

#### Unit Tests

**Rust Backend:**

```powershell
cd src-tauri

# Run all tests
cargo test --all

# Run specific module
cargo test --lib services::raft

# Run with output
cargo test -- --nocapture

# Run with coverage (requires tarpaulin)
cargo install cargo-tarpaulin
cargo tarpaulin --out Html
```

**TypeScript/React Frontend:**

```powershell
# Run Jest tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

#### Integration Tests

```powershell
# End-to-end tests with Playwright
npm run test:e2e

# Specific test file
npx playwright test tests/e2e/chat.spec.ts

# Debug mode
npx playwright test --debug
```

### Performance Testing

#### LLM Performance

```powershell
# Benchmark LLM response times
npm run benchmark:llm

# Expected results:
# - First token: < 500ms
# - Tokens/sec: > 15 (with 4-bit quantization)
# - Total response (100 tokens): < 8 seconds
```

#### Memory Usage

```powershell
# Monitor memory during development
# Task Manager > Performance > Memory

# Acceptable levels:
# - Idle: < 500MB
# - Active conversation: < 2GB
# - With LLaVA loaded: < 4GB
```

#### Startup Performance

```powershell
# Measure cold start time
# Target: < 3 seconds

# Measure warm start time
# Target: < 1 second
```

---

## Testing

### Manual Testing Checklist

#### Installation Testing

- [ ] NSIS installer runs without errors
- [ ] MSI installer runs without errors
- [ ] App launches after installation
- [ ] Uninstaller works completely
- [ ] No files left after uninstall
- [ ] Start menu shortcut works
- [ ] File associations work (if applicable)

#### Functionality Testing

- [ ] **Chat Interface**
  - [ ] Send message and receive response
  - [ ] Streaming works smoothly
  - [ ] Markdown rendering (code, lists, tables)
  - [ ] Code syntax highlighting
  - [ ] Korean character support

- [ ] **Personality System**
  - [ ] All 10 parameters adjustable
  - [ ] Settings persist after restart
  - [ ] Personality detection works
  - [ ] LoRA fine-tuning (if enabled)

- [ ] **RAFT Hallucination Reduction**
  - [ ] Settings UI accessible
  - [ ] Threshold adjustments work
  - [ ] Distractor injection works
  - [ ] Chain-of-Thought toggle works
  - [ ] "I don't know" responses when appropriate

- [ ] **Memory & RAG**
  - [ ] Episodes saved to database
  - [ ] Similarity search works
  - [ ] LanceDB vector search (< 10ms)
  - [ ] Context retrieval accurate

- [ ] **Tools**
  - [ ] Web search (DuckDuckGo)
  - [ ] File operations
  - [ ] System information
  - [ ] Calculator

- [ ] **Settings**
  - [ ] LLM configuration
  - [ ] Update checks
  - [ ] RAFT settings
  - [ ] Personality settings
  - [ ] Theme switching (light/dark)

#### Performance Testing

- [ ] CPU usage < 50% during inference
- [ ] Memory usage < 4GB
- [ ] Disk usage reasonable
- [ ] No memory leaks (check after 1 hour)
- [ ] Startup time < 3 seconds
- [ ] LLM response time < 10 seconds

#### Compatibility Testing

- [ ] Windows 10 (21H1+)
- [ ] Windows 11
- [ ] Intel processors
- [ ] AMD processors
- [ ] NVIDIA GPUs
- [ ] AMD GPUs
- [ ] Integrated graphics (degraded performance acceptable)

#### Security Testing

- [ ] No data sent to cloud (verify with Wireshark)
- [ ] Database encryption works
- [ ] API keys stored securely
- [ ] No hardcoded secrets in code
- [ ] Code signing (if certificate available)

---

## Troubleshooting

### Build Issues

#### Problem: `protoc` not found

**Solution:**

```powershell
# Install Protocol Buffers
choco install protoc -y

# Or set PROTOC environment variable
$env:PROTOC = "C:\path\to\protoc.exe"
```

#### Problem: OpenSSL linking errors

**Solution:**

```powershell
# Install OpenSSL via Chocolatey
choco install openssl -y

# Or set OpenSSL directory
$env:OPENSSL_DIR = "C:\Program Files\OpenSSL-Win64"
```

#### Problem: MSVC not found

**Solution:**

```powershell
# Install Visual Studio Build Tools
# https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022

# Or use rustup default MSVC
rustup default stable-x86_64-pc-windows-msvc
```

### Runtime Issues

#### Problem: Ollama connection failed

**Solution:**

```powershell
# Check if Ollama is running
Get-Process ollama

# Start Ollama
ollama serve

# Pull models if missing
ollama pull qwen2.5:14b
ollama pull bge-m3
```

#### Problem: Database locked

**Solution:**

```powershell
# Close all instances of the app
Get-Process "Garden of Eden V3" | Stop-Process

# Delete lock file
Remove-Item "$env:APPDATA\garden-of-eden-v3\data.db-shm" -ErrorAction SilentlyContinue
Remove-Item "$env:APPDATA\garden-of-eden-v3\data.db-wal" -ErrorAction SilentlyContinue
```

#### Problem: LanceDB index errors

**Solution:**

```powershell
# Rebuild vector index
# Settings → Advanced → Rebuild Vector Index

# Or delete and recreate
Remove-Item -Recurse "$env:APPDATA\garden-of-eden-v3\lance" -ErrorAction SilentlyContinue
# Restart app - will auto-recreate
```

---

## Performance Optimization

### LLM Performance

**GPU Acceleration:**

```powershell
# NVIDIA (CUDA)
# Ollama automatically detects and uses CUDA if available

# AMD (ROCm)
# Set environment variable
$env:HSA_OVERRIDE_GFX_VERSION = "10.3.0"  # Adjust for your GPU
```

**Quantization:**

```text
Model Size vs Quality Trade-off:

Q4_K_M (9GB):  Best balance - RECOMMENDED
Q5_K_M (11GB): Better quality, slower
Q8_0 (14GB):   Highest quality, slowest
Q3_K_M (6GB):  Faster, lower quality
```

**Batch Size Tuning:**

Edit Ollama model configuration:

```json
{
  "num_ctx": 4096,
  "num_batch": 512,
  "num_gpu": 99,
  "num_thread": 8
}
```

### Disk I/O Optimization

**SSD Recommended:**

- LanceDB benefits significantly from fast random reads
- Move data directory to SSD if on HDD:

```powershell
# Default: %APPDATA%\garden-of-eden-v3
# Move to: D:\GardenOfEden\data (SSD)

# Create symlink
New-Item -ItemType SymbolicLink `
  -Path "$env:APPDATA\garden-of-eden-v3" `
  -Target "D:\GardenOfEden\data"
```

### Memory Management

**Virtual Memory:**

```powershell
# Increase pagefile for large models
# System → Advanced → Performance → Advanced → Virtual Memory
# Set to 1.5x RAM (e.g., 24GB for 16GB RAM)
```

---

## Code Signing (Optional but Recommended)

### Obtain Certificate

**Options:**

1. **Commercial CA** (Recommended for distribution):
   - DigiCert ($200-400/year)
   - Sectigo ($150-300/year)
   - GlobalSign ($200-400/year)

2. **Self-signed** (Testing only):
   ```powershell
   # Create self-signed certificate
   $cert = New-SelfSignedCertificate `
     -Type CodeSigningCert `
     -Subject "CN=Garden of Eden V3" `
     -CertStoreLocation "Cert:\CurrentUser\My"
   ```

### Configure Signing

Edit `src-tauri/tauri.conf.json`:

```json
{
  "bundle": {
    "windows": {
      "certificateThumbprint": "YOUR_CERT_THUMBPRINT",
      "digestAlgorithm": "sha256",
      "timestampUrl": "http://timestamp.digicert.com"
    }
  }
}
```

### Sign After Build

```powershell
# Sign NSIS installer
signtool sign /fd SHA256 /tr http://timestamp.digicert.com /td SHA256 `
  /sha1 YOUR_CERT_THUMBPRINT `
  "src-tauri\target\x86_64-pc-windows-msvc\release\bundle\nsis\*.exe"

# Sign MSI installer
signtool sign /fd SHA256 /tr http://timestamp.digicert.com /td SHA256 `
  /sha1 YOUR_CERT_THUMBPRINT `
  "src-tauri\target\x86_64-pc-windows-msvc\release\bundle\msi\*.msi"
```

---

## CI/CD with GitHub Actions

The project includes GitHub Actions workflow for automated Windows builds.

### Trigger Build

```bash
# Automatic on push to main
git push origin main

# Manual trigger
gh workflow run build-windows.yml

# On version tag
git tag v3.4.0
git push origin v3.4.0
```

### View Build Artifacts

```bash
# List recent runs
gh run list --workflow=build-windows.yml

# Download artifacts
gh run download RUN_ID
```

---

## Best Practices

### Development

1. ✅ **Always run type-check before committing**
   ```powershell
   npm run type-check
   ```

2. ✅ **Format code before commit**
   ```powershell
   cargo fmt --all
   npm run lint:fix
   ```

3. ✅ **Run tests locally**
   ```powershell
   npm test
   cargo test --all
   ```

4. ✅ **Test on clean VM before release**
   - Use Windows Sandbox or Hyper-V VM
   - Fresh Windows 10/11 installation
   - Install only from your installer

### Release

1. ✅ **Version consistency**
   - package.json
   - src-tauri/Cargo.toml
   - src-tauri/tauri.conf.json

2. ✅ **Changelog update**
   - Document all changes
   - Include breaking changes
   - List new features

3. ✅ **Quality gates**
   - Zero compilation errors
   - Zero TypeScript errors
   - All tests passing
   - Performance benchmarks met

4. ✅ **Release notes**
   - Clear installation instructions
   - Known issues
   - System requirements
   - Upgrade instructions

---

## Resources

### Official Documentation

- [Tauri Windows Guide](https://tauri.app/v1/guides/building/windows)
- [Rust Windows](https://www.rust-lang.org/tools/install)
- [Ollama Windows](https://ollama.com/blog/windows-preview)
- [LanceDB](https://lancedb.github.io/lancedb/)

### Community

- [GitHub Discussions](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/discussions)
- [GitHub Issues](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/issues)

---

## Quality Checklist

Before releasing:

- [ ] All tests passing (TypeScript + Rust)
- [ ] Zero compilation errors
- [ ] Zero TypeScript errors
- [ ] Clippy warnings addressed
- [ ] Performance benchmarks met
- [ ] NSIS installer works
- [ ] MSI installer works
- [ ] Tested on Windows 10
- [ ] Tested on Windows 11
- [ ] Code signed (if certificate available)
- [ ] Checksums generated
- [ ] Release notes complete
- [ ] Documentation updated

**100% Quality = 100% Confidence** 🚀
