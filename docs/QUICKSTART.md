# Quick Start Guide

Get Garden of Eden V3 running in 5 minutes.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Running the App](#running-the-app)
4. [Your First Conversation](#your-first-conversation)
5. [Keyboard Shortcuts](#keyboard-shortcuts)
6. [Features to Try](#features-to-try)
7. [Testing the App](#-testing-the-app)
8. [Building for Production](#-building-for-production)
9. [Installing Production Builds](#-installing-production-builds)
10. [Distribution Guide](#-distribution-guide-for-maintainers)
11. [Troubleshooting](#troubleshooting)
12. [Development Workflow](#development-workflow)
13. [Performance Tips](#performance-tips)

---

## Prerequisites

### Required

- **Node.js**: v20+ (v20.11.0 recommended)
- **npm**: v10+
- **Rust**: v1.70+ (for Tauri backend)
- **Operating System**:
  - **macOS**: 12.0+ (Monterey or later) for Metal GPU acceleration
  - **Windows**: 10/11 (64-bit)
- **RAM**: 8GB minimum (12GB recommended)
- **Storage**: 10GB free space (4.7GB for AI model qwen2.5:7b, 5GB for app)

### Optional

- **Git**: For version control and development
- **VSCode**: Recommended IDE with TypeScript support

---

## Installation

### Option 1: Download Pre-built Binary (Recommended for Users)

Download installers from [GitHub Releases](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/releases) or `program/` folder:

- **macOS (Apple Silicon)**: `Garden of Eden V3_1.0.0_aarch64.dmg` (7.1MB)
- **Windows (64-bit)**: `Garden of Eden V3_1.0.0_x64-setup.msi` (coming soon)

See [Installing Production Builds](#-installing-production-builds) for detailed instructions.

---

### Option 2: Build from Source (For Developers)

#### 1. Clone Repository

```bash
git clone https://github.com/wannahappyaroundme/Garden_of_Eden_V3.git
cd Garden_of_Eden_V3
```

#### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Tauri CLI
cargo install tauri-cli
```

#### 3. Download AI Models (Optional for Development)

AI models are **optional** for development but **required** for the AI to function. The app includes an auto-download feature on first run.

**Manual Download** (if you want to pre-download):

```bash
# Install Ollama
brew install ollama  # macOS
# OR download from https://ollama.ai for Windows

# Download qwen2.5:7b model (4.7GB, recommended for 12-19GB RAM)
ollama pull qwen2.5:7b

# OR download qwen2.5:3b for 8-11GB RAM systems (2.0GB)
# ollama pull qwen2.5:3b

# Verify download
ollama list  # Should show qwen2.5:7b
```

Models download automatically on first run via the app's UI.

---

## Running the App

### Development Mode (Hot Reload)

```bash
# Run Tauri app in development mode
npm run dev
```

This will:

1. Start Vite dev server (React frontend) on `http://localhost:5173`
2. Compile and run Tauri backend (Rust)
3. Open app window automatically

**Hot reload**: Frontend changes auto-reload, backend changes require restart.

**Debugging**: Use Chrome DevTools for frontend, Rust debugger for backend.

---

### First Launch

On first launch, the app will:

1. **Create database** at `~/Library/Application Support/garden-of-eden-v3/data.db` (macOS) or `%APPDATA%/garden-of-eden-v3/data.db` (Windows)
2. **Initialize schema** with 7 tables (conversations, messages, persona_settings, etc.)
3. **Load default persona** settings (28 parameters with default values)
4. **Check for AI models**:
   - If qwen2.5:7b model not found: Show onboarding wizard with download option
   - If found: Load model (~4-6 seconds on Apple Silicon)
5. **Display chat interface** with welcome message

**Expected First Launch Time**:

- **With models pre-downloaded**: ~6-8 seconds (Tauri is fast!)
- **Without models**: ~10-15 minutes (downloads 4.7GB qwen2.5:7b)

---

## Your First Conversation

### 1. Send a Message

Type anything in the input box at the bottom and press Enter:

```
Hello! What can you help me with?
```

Or try a more specific question:

```
Explain how async/await works in JavaScript
```

### 2. Watch the Magic ✨

- **Conversation auto-created** with title generated from your message
- **AI response streams** in real-time (token by token)
- **Message saved** to SQLite database
- **Conversation appears** in left sidebar

**Response Time** (qwen2.5:7b):

- Apple Silicon (M1-M3): 3-4 seconds for complete response (~40-50 tokens/sec)
- Intel/AMD (12GB+ RAM): 4-6 seconds for complete response (~30-40 tokens/sec)
- Target: 3-4 seconds for modern hardware (25% faster than previous phi3:mini)

### 3. Switch Personas (Optional)

Click the ⚙️ **Settings** icon (top-right) → **Persona** tab → Try different presets:

- **Default**: Balanced, friendly, helpful (all parameters at 50%)
- **Professional**: Formal, concise, business-focused (formality: 80%, verbosity: 30%)
- **Friendly**: Warm, encouraging, casual (empathy: 90%, humor: 70%)
- **Technical**: Detailed, precise, developer-focused (technical depth: 90%, verbosity: 70%)
- **Creative**: Imaginative, expressive, brainstorming (creativity: 90%, proactivity: 80%)
- **Teacher**: Socratic, patient, encouraging (teaching style: 80%, empathy: 70%)

Or **customize** any of the 28 parameters with sliders!

---

## Keyboard Shortcuts

| Shortcut                       | Action                 |
| ------------------------------ | ---------------------- |
| `Cmd+K` / `Ctrl+K`             | Focus chat input       |
| `Cmd+N` / `Ctrl+N`             | Start new conversation |
| `Cmd+,` / `Ctrl+,`             | Open settings          |
| `Cmd+Shift+S` / `Ctrl+Shift+S` | Toggle screen tracking |
| `Enter`                        | Send message           |
| `Shift+Enter`                  | New line in message    |
| `Esc`                          | Unfocus input          |

---

## Features to Try

### 1. Ask Code Questions

```
Can you explain how JavaScript promises work with examples?
```

Response will include **syntax-highlighted code blocks** with proper language detection!

### 2. Multi-Turn Conversations

```
User: What is React?
AI: [explains React fundamentals]
User: How do React hooks work?
AI: [explains hooks, remembering previous context about React]
```

The AI maintains **conversation context** across multiple turns.

### 3. File Operations

```
Read my package.json file and tell me what dependencies we have
```

The AI can:

- Read files: `Read the README.md file`
- Search files: `Find all .ts files in src/main`
- Analyze code: `Analyze this TypeScript file and suggest improvements`

### 4. Git Integration

```
Check the git status and tell me what files have changed
```

The AI can:

- Git status: `What's the current git status?`
- Git diff: `Show me the diff for the last commit`
- Git history: `Show me recent commits`

### 5. Voice Input (Coming Soon)

Click the 🎤 microphone button to speak your question (Korean or English). Whisper STT will transcribe in real-time.

### 6. Screen Context Analysis (Coming Soon)

Enable in Settings → Screen Tracking → Choose context level:

- **Level 1**: Current window only (fast)
- **Level 2**: Recent work (last 10 minutes)
- **Level 3**: Full project context

### 7. Conversation History

- All conversations **auto-saved** to SQLite
- Click any conversation in sidebar to resume
- Search conversations with search bar
- Delete or rename via right-click context menu

---

## 🧪 Testing the App

Before building for production or contributing code, run all tests to ensure quality.

### Type Checking

Check for TypeScript errors across all processes:

```bash
npm run type-check
```

This runs TypeScript compiler on:

- Frontend (React/TypeScript in `src/`)
- Tauri expects clean types

**Expected Output**: "Found 0 errors"

---

### Linting

Check code style and catch common errors:

```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint:fix
```

ESLint rules configured:

- TypeScript strict mode
- React best practices
- React Hooks rules
- No unused variables
- Consistent imports

---

### Running Tests

```bash
# Run all tests (unit + integration)
npm test

# Unit tests only (8 services, 101 test suites)
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests (Playwright)
npm run test:e2e

# Watch mode (re-run on file changes)
npm run test:watch

# Coverage report (target: 80%)
npm run test:coverage
```

**Test Coverage**:

| Service             | Test Lines | Status         |
| ------------------- | ---------- | -------------- |
| Ollama (qwen2.5:7b) | ~300       | ✅ Basic tests |
| Whisper             | ~200       | ✅ Voice input |
| File System         | ~150       | ✅ Complete    |
| Git                 | ~200       | ✅ Complete    |
| Screen Capture      | ~150       | ✅ Complete    |

**Total**: ~1,000 lines of test code (expanding)

---

### Pre-Build Checklist

Before building for production:

- [ ] `npm run type-check` passes with 0 errors
- [ ] `npm run lint` passes with 0 errors
- [ ] `npm test` passes (all tests green)
- [ ] Version bumped in `package.json`
- [ ] `CHANGELOG.md` updated with new version
- [ ] Git working tree is clean (no uncommitted changes)

---

## 🏗️ Building for Production

### Prerequisites

- **Node.js 20+** installed
- **Rust 1.70+** installed (`cargo --version`)
- All dependencies: `npm install`
- Tauri CLI: `cargo install tauri-cli`
- Clean git working tree (recommended)

### Build Process

#### Tauri Build (All-in-One)

**macOS (DMG)** - Must build on macOS:

```bash
# Build frontend + Tauri app
npm run build:mac
```

This will:

1. Build React frontend with Vite → `dist/`
2. Compile Rust backend → `src-tauri/target/release/`
3. Package as DMG → `src-tauri/target/release/bundle/dmg/`

**Output**:

- `Garden of Eden V3_1.0.0_aarch64.dmg` (~7.1MB) - Apple Silicon installer
- `Garden of Eden V3.app` - Application bundle

**Architectures**: arm64 (Apple Silicon) or x64 (Intel)

---

**Windows (MSI)** - Must build on Windows:

```bash
# Build frontend + Tauri app
npm run build:win
```

**Output** (in `src-tauri/target/release/bundle/msi/`):

- `Garden of Eden V3_1.0.0_x64-setup.msi` (~15MB) - Installer
- App files in `src-tauri/target/release/`

**Architectures**: x64 only (64-bit Intel/AMD)

---

### What Gets Bundled

**Included in Tauri Build**:

- ✅ Compiled Rust backend (native binary)
- ✅ React frontend (HTML + CSS + JS)
- ✅ Tauri runtime (lightweight, ~2-3MB)
- ✅ App icons and resources
- ✅ SQLite database schema

**NOT Included** (downloaded on first run):

- ❌ AI models (4.7GB qwen2.5:7b) - Downloaded via Ollama
- ❌ Ollama runtime - Auto-installed if not present

**Why Models Aren't Bundled**:

- qwen2.5:7b: 4.7GB (recommended for 12-19GB RAM)
- qwen2.5:3b: 2.0GB (alternative for 8-11GB RAM)
- Whisper Large V3: 3.1GB (optional)
- **Total**: ~7.8GB would make installer large and slow

Instead, models **auto-download** on first launch with progress tracking.

---

### Build Output Sizes

| File        | Size   | Platform | Notes                   |
| ----------- | ------ | -------- | ----------------------- |
| macOS DMG   | ~7.1MB | arm64    | Apple Silicon optimized |
| macOS DMG   | ~8MB   | x64      | Intel processors        |
| Windows MSI | ~15MB  | x64      | Installer               |
| Windows EXE | ~12MB  | x64      | Portable                |

**Plus AI models** (downloaded separately): ~4.7GB (qwen2.5:7b, recommended)

---

### Troubleshooting Build Errors

**Error**: `Rust compiler not found`

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

**Error**: `Tauri CLI not found`

```bash
# Install Tauri CLI
cargo install tauri-cli
```

**Error**: `Type errors in compiled code`

```bash
# Run type-check first
npm run type-check
# Fix errors before building
```

**Error**: `Code signing failed` (macOS)

```bash
# Disable code signing for development builds
export CSC_IDENTITY_AUTO_DISCOVERY=false
npm run build:mac
```

**Error**: `Frontend build failed`

```bash
# Clear cache and rebuild
rm -rf dist node_modules/.vite
npm run build:renderer
```

---

## 📦 Installing Production Builds

### macOS Installation (Apple Silicon)

#### Download

1. Go to [GitHub Releases](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/releases)
2. Download `Garden of Eden V3_1.0.0_aarch64.dmg` (~7.1MB)

#### Install

1. **Open the DMG file** by double-clicking
2. **Drag the app icon** to the Applications folder
3. **Eject the DMG** (right-click → Eject)

#### First Launch (Unsigned App)

Since the app is **not code-signed** (requires $99/year Apple Developer account), macOS Gatekeeper will block it:

**Option 1: Right-Click Method** (Recommended)

1. Navigate to **Applications** folder
2. **Right-click** (or Ctrl+Click) on "Garden of Eden V3"
3. Click **"Open"** from context menu
4. Click **"Open"** again in the dialog

This permanently allows the app.

**Option 2: System Settings Method**

1. Try to open the app (will show "cannot be opened" error)
2. Go to **System Settings** → **Privacy & Security**
3. Scroll down to see **"Garden of Eden V3 was blocked"**
4. Click **"Open Anyway"**
5. Click **"Open"** in confirmation dialog

**Option 3: Remove Quarantine** (Advanced)

```bash
# Remove quarantine attribute
xattr -d com.apple.quarantine /Applications/Garden\ of\ Eden\ V3.app
```

#### First Run Experience

1. App opens with **Welcome screen**
2. **4-step onboarding wizard**:
   - Step 1: System Check (auto-detects CPU, RAM, GPU, Disk)
   - Step 2: Model Recommendation (suggests qwen2.5:7b for 12-19GB RAM, qwen2.5:3b for 8-11GB)
   - Step 3: Persona Survey (7 questions to customize AI personality)
   - Step 4: Model download (4.7GB qwen2.5:7b, ~10-15 minutes)
3. Models download with **progress bars**:
   - qwen2.5:7b: 4.7GB (primary LLM, fast 3-4s responses, excellent Korean)
   - Whisper Large V3: 3.1GB (optional, for voice input)
4. **Start chatting** after download completes!

**Storage Location**:

- App: `/Applications/Garden of Eden V3.app`
- User data: `~/Library/Application Support/garden-of-eden-v3/`
  - Database: `data.db` (encrypted SQLite)
  - Models: Via Ollama at `~/.ollama/models/`
  - Logs: In app support directory

---

### Windows Installation (64-bit)

#### Download

1. Go to [GitHub Releases](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/releases)
2. Download MSI installer:
   - **MSI Installer**: `Garden of Eden V3_1.0.0_x64-setup.msi` (~15MB)

---

#### MSI Installer (Recommended)

1. **Run the installer** (`Garden of Eden V3_1.0.0_x64-setup.msi`)
2. **Windows Defender SmartScreen** may show warning:
   - Click **"More info"**
   - Click **"Run anyway"**
3. **Installation wizard**:
   - Choose installation directory (default: `C:\Program Files\Garden of Eden V3`)
   - Select shortcuts:
     - ✅ Desktop shortcut
     - ✅ Start Menu shortcut
   - Click **"Install"**
4. **Installation completes** (~30 seconds, Tauri is fast!)
5. **Launch** from:
   - Desktop icon, or
   - Start Menu → "Garden of Eden V3"

**Uninstall**:

- Settings → Apps → Uninstall "Garden of Eden V3", or
- Control Panel → Programs → Uninstall

---

#### Windows Defender / Antivirus Warnings

Since the app is **not code-signed** (requires ~$100-400/year certificate), Windows may show warnings:

**Windows Defender SmartScreen**:

1. You'll see: "Windows protected your PC"
2. Click **"More info"**
3. Click **"Run anyway"**

**Third-Party Antivirus** (Norton, McAfee, Avast, etc.):

1. May quarantine the .msi or .exe file
2. Add exception for `Garden of Eden V3*`
3. Restore from quarantine if needed

**Why This Happens**:

- App is not code-signed (requires expensive certificate)
- Tauri apps are relatively new and may trigger false positives
- First few downloads may be flagged more

**Safety Assurance**:

- ✅ Open-source code (audit on GitHub)
- ✅ Built with official Tauri framework (Rust-based, secure)
- ✅ No malware, no telemetry
- ✅ Community-verified

---

#### First Run Experience (Windows)

Same as macOS:

1. Welcome screen → Onboarding wizard (7 steps)
2. Model download (12GB, ~20-30 minutes)
3. Persona setup
4. Start chatting!

**Storage Location**:

- App: `C:\Program Files\Garden of Eden V3\` (installer) or `<folder>\` (portable)
- User data: `C:\Users\<YourName>\.garden-of-eden-v3\`
  - Database: `.garden-of-eden-v3\database\eden.db`
  - Models: `.garden-of-eden-v3\models\`
  - Logs: `.garden-of-eden-v3\logs\`

---

### Linux Installation

#### AppImage (Recommended)

1. Download `Garden-of-Eden-V3-{version}.AppImage`
2. Make executable:
   ```bash
   chmod +x Garden-of-Eden-V3-*.AppImage
   ```
3. Run:
   ```bash
   ./Garden-of-Eden-V3-*.AppImage
   ```

#### Debian/Ubuntu (.deb)

```bash
sudo dpkg -i Garden-of-Eden-V3_{version}_amd64.deb
sudo apt-get install -f  # Fix dependencies
```

**Launch**:

- Application menu → "Garden of Eden V3"
- Or: `garden-of-eden-v3` command

---

## 🚀 Distribution Guide (for Maintainers)

This section is for **project maintainers** who want to build and distribute releases.

### Prerequisites for Building

1. **Development Environment**:
   - Node.js 20+ installed
   - npm 10+ installed
   - Git installed
   - macOS (for macOS builds) or Windows/Linux (for Windows/Linux builds)

2. **Dependencies Installed**:

   ```bash
   npm install
   ```

3. **Icons Generated**:

   ```bash
   npm run generate:icons
   ```

   This creates placeholder icons in `resources/icons/` if they don't exist.

4. **Clean Git Tree** (recommended):
   ```bash
   git status  # Should show "working tree clean"
   ```

---

### Building for Distribution

#### Pre-Build Checklist

Before building a release:

- [ ] **Version bumped** in `package.json` (e.g., `1.0.0` → `1.0.1`)
- [ ] **CHANGELOG.md updated** with new version and changes
- [ ] **All tests passing**: `npm test`
- [ ] **Type checking clean**: `npm run type-check`
- [ ] **Linting clean**: `npm run lint`
- [ ] **Git committed**: All changes committed
- [ ] **Git tagged**: `git tag v1.0.1 && git push --tags`

---

#### Build Commands

**macOS** (must build on macOS):

```bash
# 1. Type check
npm run type-check

# 2. Run tests
npm test

# 3. Build
npm run build:mac

# 4. Test installer
open release/Garden-of-Eden-V3-*-arm64.dmg
```

**Windows** (can build on any platform):

```bash
# 1. Type check
npm run type-check

# 2. Run tests
npm test

# 3. Build
npm run build:win

# 4. Output files
ls -la release/*.exe
```

**Linux**:

```bash
npm run type-check
npm test
npm run build:linux
```

---

### What Gets Built

Each platform produces multiple files:

**macOS** (`release/` directory):

- `Garden-of-Eden-V3-{version}-arm64.dmg` - Installer for drag-and-drop
- `Garden-of-Eden-V3-{version}-arm64-mac.zip` - ZIP archive for direct extraction
- `latest-mac.yml` - Auto-updater metadata

**Windows** (`release/` directory):

- `Garden-of-Eden-V3-Setup-{version}.exe` - NSIS installer (user-friendly)
- `Garden-of-Eden-V3-{version}.exe` - Portable executable (no install)
- `latest.yml` - Auto-updater metadata

**Linux** (`release/` directory):

- `Garden-of-Eden-V3-{version}.AppImage` - Universal Linux binary
- `Garden-of-Eden-V3_{version}_amd64.deb` - Debian/Ubuntu package
- `latest-linux.yml` - Auto-updater metadata

---

### File Sizes & What's Included

**Installer Size**: ~150-200MB

**Includes**:

- Compiled JavaScript (`dist/`)
- Electron runtime (~100MB)
- Production dependencies (node_modules, tree-shaken)
- App icons
- Config files
- Package metadata

**Does NOT Include**:

- ❌ AI models (12GB) - Too large, downloaded on first run
- ❌ Source TypeScript files
- ❌ Development dependencies
- ❌ Tests, docs, scripts

---

### Code Signing (Optional but Recommended)

Code signing removes security warnings for users, but requires paid certificates.

#### macOS Code Signing

**Prerequisites**:

- Apple Developer account ($99/year)
- "Developer ID Application" certificate
- Certificate exported as `.p12` file

**Setup**:

```bash
# Set environment variables
export CSC_LINK=/path/to/certificate.p12
export CSC_KEY_PASSWORD=your_certificate_password
export CSC_NAME="Developer ID Application: Your Name (TEAM_ID)"

# Build (will auto-sign)
npm run build:mac
```

**Verify Signing**:

```bash
codesign -dv --verbose=4 release/mac-arm64/Garden\ of\ Eden\ V3.app
# Should show: "Authority=Developer ID Application"
```

**Notarization** (required for macOS 10.15+):

```bash
# electron-builder can auto-notarize
export APPLE_ID=your@email.com
export APPLE_ID_PASSWORD=app-specific-password
npm run build:mac
```

See Apple's docs for getting app-specific password.

---

#### Windows Code Signing

**Prerequisites**:

- Code signing certificate from CA (Sectigo, DigiCert, etc.) - ~$100-400/year
- Certificate as `.pfx` or `.p12` file

**Setup**:

```bash
# Set environment variables
export CSC_LINK=/path/to/certificate.pfx
export CSC_KEY_PASSWORD=your_certificate_password

# Build (will auto-sign)
npm run build:win
```

**Verify Signing**:

- Right-click .exe → Properties → Digital Signatures
- Should show your certificate

---

#### Building Without Code Signing

If you don't have certificates:

**electron-builder.yml** (already configured):

```yaml
mac:
  identity: null # Skip code signing
```

Users will see warnings but app still works:

- macOS: "Unidentified developer" warning (can bypass)
- Windows: SmartScreen warning (can bypass)

---

### Creating a GitHub Release

1. **Build all platforms**:

   ```bash
   # On macOS machine
   npm run build:mac

   # On Windows/Linux machine (or cross-compile)
   npm run build:win
   npm run build:linux
   ```

2. **Generate checksums** (for integrity):

   ```bash
   cd release/
   shasum -a 256 *.dmg *.exe *.AppImage *.deb > SHA256SUMS.txt
   ```

3. **Create GitHub release**:

   ```bash
   # Via GitHub CLI
   gh release create v1.0.0 \
     --title "Garden of Eden V3 v1.0.0" \
     --notes "See CHANGELOG.md for details" \
     release/*.dmg \
     release/*.zip \
     release/*.exe \
     release/*.AppImage \
     release/*.deb \
     release/SHA256SUMS.txt
   ```

   Or manually via GitHub web interface:
   - Go to https://github.com/wannahappyaroundme/Garden_of_Eden_V3/releases
   - Click "Draft a new release"
   - Tag: `v1.0.0`
   - Title: "Garden of Eden V3 v1.0.0"
   - Description: Copy from CHANGELOG.md
   - Upload files from `release/` directory
   - Publish

4. **Update links** in README.md to point to new release

---

### Distribution Checklist

Before releasing to public:

- [ ] All platforms built successfully
- [ ] Installers tested on clean machines:
  - [ ] macOS arm64 (M1/M2/M3)
  - [ ] Windows 10 (x64)
  - [ ] Windows 11 (x64)
  - [ ] Linux (Ubuntu 22.04+)
- [ ] First-run experience tested:
  - [ ] Onboarding wizard completes
  - [ ] Models download successfully
  - [ ] App launches and chat works
- [ ] Version numbers correct:
  - [ ] package.json
  - [ ] CHANGELOG.md
  - [ ] Git tag
- [ ] Documentation updated:
  - [ ] README.md (version, download links)
  - [ ] CHANGELOG.md (new version entry)
  - [ ] QUICKSTART.md (if needed)
- [ ] GitHub release created with:
  - [ ] All platform binaries
  - [ ] SHA256 checksums
  - [ ] Release notes
- [ ] Auto-updater metadata files included:
  - [ ] latest-mac.yml
  - [ ] latest.yml (Windows)
  - [ ] latest-linux.yml
- [ ] Announcement ready:
  - [ ] GitHub Discussions post
  - [ ] Reddit posts (r/selfhosted, r/opensource, etc.)
  - [ ] Social media (Twitter, etc.)

---

### Distribution Best Practices

1. **Semantic Versioning**: Follow SemVer (MAJOR.MINOR.PATCH)
   - `1.0.0` → `1.0.1` (bug fixes)
   - `1.0.0` → `1.1.0` (new features)
   - `1.0.0` → `2.0.0` (breaking changes)

2. **Release Frequency**:
   - Patch releases (bug fixes): Every 1-2 weeks
   - Minor releases (features): Every 1-2 months
   - Major releases (breaking): Every 6-12 months

3. **Beta Releases**:
   - Tag as `v1.1.0-beta.1`
   - Mark as "Pre-release" on GitHub
   - Test with community before stable

4. **File Naming**:
   - Use consistent format: `Garden-of-Eden-V3-{version}-{platform}.{ext}`
   - Examples:
     - `Garden-of-Eden-V3-1.0.0-arm64.dmg`
     - `Garden-of-Eden-V3-Setup-1.0.0.exe`

5. **Documentation**:
   - Always update CHANGELOG.md before release
   - Include migration guide for breaking changes
   - Update screenshots if UI changed

---

## Troubleshooting

### Development Issues

#### Model Not Loading

**Error**: "Failed to initialize AI model"

**Solutions**:

1. Verify model file exists:
   ```bash
   ls -lh ~/.garden-of-eden-v3/models/llama-3.1-8b-instruct-q4_k_m.gguf
   ```
2. Check file size is ~4.92GB (4,920,000,000 bytes)
3. Re-download if corrupted
4. Check logs: `~/.garden-of-eden-v3/logs/main.log`

---

#### Slow AI Responses

**Symptoms**: Responses take >30 seconds

**Solutions**:

1. Check GPU acceleration:
   ```bash
   # macOS: Should use Metal
   # Check logs for "Metal GPU detected"
   ```
2. Close other heavy applications (Chrome, Docker, etc.)
3. Ensure 16GB+ RAM available (check Activity Monitor / Task Manager)
4. Verify SSD (not HDD) - AI models require fast storage

---

#### Database Errors

**Error**: "Database locked" or "Failed to save message"

**Solutions**:

1. Close all app windows
2. Delete database (will recreate):
   ```bash
   rm -rf ~/.garden-of-eden-v3/database/
   ```
3. Restart app

---

#### Port Already in Use

**Error**: "Port 5173 already in use"

**Solutions**:

1. Kill existing Vite process:

   ```bash
   # macOS/Linux
   lsof -ti:5173 | xargs kill

   # Windows (PowerShell)
   Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process
   ```

2. Or change port in `vite.config.ts`:
   ```ts
   server: {
     port: 5174;
   }
   ```

---

#### Electron Not Starting

**Error**: "Electron failed to start"

**Solutions**:

1. Rebuild native modules:
   ```bash
   npm run build:native
   ```
2. Clear dist folder and rebuild:
   ```bash
   rm -rf dist/
   npm run build:electron
   ```
3. Reinstall dependencies:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

---

### Build Issues

#### Build Fails with Type Errors

**Solution**:

```bash
# Fix TypeScript errors first
npm run type-check

# Then rebuild
npm run build:electron
```

---

#### Native Module Errors

**Error**: "The module was compiled against a different Node.js version"

**Solution**:

```bash
# Rebuild for Electron
npm run build:native

# Or manually
npm rebuild better-sqlite3 --runtime=electron --target=39.1.2 --disturl=https://electronjs.org/headers
```

---

#### electron-builder Fails

**Error**: "Application entry file not found"

**Solution**:

1. Ensure main process is built:
   ```bash
   npm run build:main
   ls dist/main/main/index.js  # Should exist
   ```
2. Check `package.json` → `main` field points to correct path:
   ```json
   "main": "dist/main/main/index.js"
   ```

---

### Installation Issues

#### macOS: "App is damaged and can't be opened"

**Cause**: Gatekeeper quarantine

**Solution**:

```bash
xattr -cr /Applications/Garden\ of\ Eden\ V3.app
```

---

#### Windows: "Windows Defender blocked this app"

**Cause**: App is not code-signed

**Solution**:

1. Click "More info"
2. Click "Run anyway"
3. Or add exception in Windows Defender

---

#### Models Fail to Download

**Symptoms**: Stuck at "Downloading models..." for >1 hour

**Solutions**:

1. Check internet connection
2. Check firewall (allow Node.js / Electron)
3. Check disk space (need 15GB free)
4. Manual download:
   ```bash
   # Download manually from HuggingFace
   # Place in ~/.garden-of-eden-v3/models/
   ```
5. Check logs for detailed error:
   ```bash
   tail -f ~/.garden-of-eden-v3/logs/main.log
   ```

---

## Development Workflow

### Making Code Changes

1. **Edit code** in `src/`
2. **Renderer changes**: Vite auto-reloads (hot module replacement)
3. **Main process changes**: Restart manually (`Cmd+C` → `npm run dev:main`)
4. **Preload changes**: Restart Electron window (Cmd+R / Ctrl+R)

---

### Database Schema Changes

1. Edit schema in `src/main/database/schema.ts`
2. Delete database:
   ```bash
   rm -rf ~/.garden-of-eden-v3/database/
   ```
3. Restart app (will recreate with new schema)

**Note**: No migrations for development. Production will need proper migrations.

---

### Adding Dependencies

```bash
# Frontend (renderer process)
npm install <package> --save

# Backend (main process)
npm install <package> --save

# Dev dependencies
npm install <package> --save-dev
```

**Rebuild** if adding native modules:

```bash
npm run build:native
```

---

### Debugging

**Main Process** (Node.js):

- Chrome DevTools: Open `chrome://inspect` → "Open dedicated DevTools for Node"
- VSCode: Attach debugger to port 5858
- Logs: `~/.garden-of-eden-v3/logs/main.log`

**Renderer Process** (React):

- Open DevTools in app: `Cmd+Option+I` (macOS) / `Ctrl+Shift+I` (Windows)
- Console, React DevTools available
- Logs: Browser console

---

## Project Structure (Quick Reference)

```
garden-of-eden-v3/
├── src/
│   ├── main/                    # Electron main process (Node.js backend)
│   │   ├── index.ts             # Entry point, app lifecycle
│   │   ├── window.ts            # Window management, system tray
│   │   ├── services/            # Core business logic
│   │   │   ├── ai/              # Llama, Whisper, LLaVA, TTS
│   │   │   ├── integration/     # File, Git, Screen, Calendar, Webhook
│   │   │   ├── learning/        # Persona, RAG, Learner
│   │   │   ├── download/        # Model downloader
│   │   │   └── update/          # Auto-updater
│   │   ├── database/            # SQLite + Repositories
│   │   │   ├── schema.ts        # 7 tables definition
│   │   │   └── repositories/    # Data access layer
│   │   └── ipc/                 # IPC handlers (13 handlers)
│   ├── renderer/                # React UI (sandboxed)
│   │   ├── App.tsx              # Root component
│   │   ├── pages/               # Chat, Settings, Onboarding
│   │   ├── components/          # UI components (shadcn/ui)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── stores/              # Zustand state management
│   │   └── i18n/                # Korean + English translations
│   ├── preload/                 # Secure IPC bridge
│   │   └── index.ts             # 100+ API methods
│   └── shared/                  # Shared types & constants
│       └── types/               # TypeScript interfaces
│
├── dist/                        # Compiled JavaScript (gitignored)
│   ├── main/                    # Main process build output
│   ├── renderer/                # Renderer build output
│   └── preload/                 # Preload build output
│
├── release/                     # electron-builder output (gitignored)
│   ├── *.dmg                    # macOS installers
│   ├── *.exe                    # Windows installers
│   ├── *.AppImage               # Linux installers
│   └── *.yml                    # Auto-updater metadata
│
├── resources/                   # Build resources
│   ├── icons/                   # App icons (.icns, .ico)
│   ├── models/                  # AI models (gitignored, 12GB)
│   └── entitlements.mac.plist   # macOS entitlements
│
├── tests/                       # Test suites
│   ├── unit/                    # Unit tests (5,807 lines)
│   ├── integration/             # Integration tests
│   └── e2e/                     # E2E tests (Playwright)
│
└── ~/.garden-of-eden-v3/        # User data (runtime)
    ├── models/                  # AI models (12GB)
    │   ├── llama-3.1-8b-instruct-q4_k_m.gguf
    │   ├── whisper-large-v3/    # (auto-download)
    │   └── llava-7b/            # (auto-download)
    ├── database/                # SQLite database
    │   └── eden.db              # Conversations, messages, settings
    └── logs/                    # Application logs
        ├── main.log             # Main process logs
        └── error.log            # Error logs
```

---

## Performance Tips

### For Best Experience

1. **RAM**: 32GB recommended, 16GB minimum
2. **Storage**: SSD required (NVMe preferred) - HDD will be too slow for AI models
3. **CPU**: Apple Silicon (M1+) for Metal, or modern Intel/AMD with AVX2
4. **GPU**: Dedicated GPU helps (Metal on macOS, CUDA on Windows)
5. **Close**: Other heavy apps while using AI (Chrome, Docker, IDEs)
6. **Monitor**: Check Activity Monitor / Task Manager during first run

---

### Expected Performance

**Apple Silicon (qwen2.5:7b)**:

- **M3 MAX/Pro/Air**: 3-4s response time, ~40-50 tokens/sec, 6-8GB RAM
- **M2 MAX/Pro/Air**: 3-5s response time, ~40-50 tokens/sec, 6-8GB RAM
- **M1 MAX/Pro/Air**: 4-6s response time, ~30-40 tokens/sec, 6-8GB RAM

**Intel/AMD (with AVX2)**:

- **High-end** (i9, Ryzen 9): 4-6s response time, ~30-40 tokens/sec
- **Mid-range** (i7, Ryzen 7): 5-7s response time, ~20-30 tokens/sec
- **Low-end** (i5, Ryzen 5): 6-10s response time, ~15-25 tokens/sec

**Memory Usage** (qwen2.5:7b):

- Base app: ~100MB (Tauri is lightweight!)
- With qwen2.5:7b loaded: ~6-8GB
- With Whisper loaded: +3GB (optional)
- **Total**: 6-8GB RAM (or 9-11GB with voice input)

**Note**: For 8-11GB RAM systems, use qwen2.5:3b (2GB model, 4-5GB RAM usage)

---

## Next Steps

### For Users

1. ✅ Try different personas and find your favorite
2. ✅ Ask complex questions and see AI reasoning
3. ✅ Test file and Git integrations
4. ✅ Explore conversation history
5. ⏳ Wait for voice input (in development)
6. ⏳ Wait for screen context analysis (in development)

### For Developers

1. Read **PROJECT_EDEN_V3_MASTER_SPEC.md** (complete specification, 12,000 lines)
2. Check **CLAUDE.md** (AI assistant development guidelines)
3. Explore architecture in **README.md**
4. Review **TESTING.md** (testing strategy)
5. Check **BUILD_AND_DEPLOY.md** (build instructions)
6. Start contributing! Open issues or discussions on GitHub

---

## Getting Help

### Documentation

- **README.md** - Project overview and features
- **QUICKSTART.md** - This file (setup and testing)
- **TESTING.md** - Testing strategy and guides
- **BUILD_AND_DEPLOY.md** - Detailed build and distribution guide
- **SERVICE_OVERVIEW.md** - Marketing and feature overview
- **PROJECT_EDEN_V3_MASTER_SPEC.md** - Complete technical specification

### Community

- **GitHub Issues**: [Report bugs or request features](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/issues)
- **GitHub Discussions**: [Ask questions, share ideas](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/discussions)
- **Discord**: Community chat server (coming soon)

### Logs

Check logs for detailed error information:

```bash
# macOS
tail -f ~/Library/Application\ Support/garden-of-eden-v3/logs/main.log

# Windows
type %APPDATA%\garden-of-eden-v3\logs\main.log
```

---

**Ready to start?**

```bash
# For development
npm run dev

# For production build
npm run build:mac    # macOS
npm run build:win    # Windows
```

**Start chatting with your private AI assistant!** 🚀
