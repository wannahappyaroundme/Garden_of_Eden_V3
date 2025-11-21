# Changelog

All notable changes to Garden of Eden V3 will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.5.0] - 2025-01-21

### ✨ Features

#### Enhanced Update Management
- **Beta Update Channel**: Switch between stable and beta releases
  - Warning dialog for beta channel with important notes
  - Visual status indicator showing active channel
  - Seamless switching between channels
- **Update Scheduling**: Configurable automatic update checks
  - Customizable check intervals (30 min - 24 hours)
  - Background download support
  - Bandwidth throttling (KB/s limit)
  - Last check timestamp tracking
- **Update History**: Complete timeline of all updates
  - Success/failure status with icons
  - Version transitions (e.g., 3.4.0 → 3.5.0)
  - Download size and installation duration
  - Error messages for failed updates
  - Smart date formatting (relative for recent)

#### VRAM-Based LLM Selection
- **Automatic VRAM detection**: Cross-platform support (macOS/Windows/Linux)
  - Apple Silicon unified memory detection
  - NVIDIA CUDA memory detection
  - AMD GPU memory detection
- **Smart model recommendations**: Based on available VRAM
  - 4-6GB: Small models (1.5B-3B params)
  - 8-12GB: Medium models (7B-8B params)
  - 16GB+: Large models (13B-70B params)
- **Reasoning mode toggle**: Quick ⚡ vs Deep 🧠 reasoning
- **Model management**: Select and switch between models

### 🗃️ Database
- Added `llm_settings` table (VRAM capacity, selected model, reasoning mode)
- Added `conversation_summaries` table (multi-turn conversation memory)
- Added indexes for performance optimization

### 🔧 Technical Improvements
- Extended `SystemSpecs` struct with VRAM detection
- Platform-specific VRAM detection implementation
- All Rust and TypeScript code compilation verified

---

## [3.4.0] - 2025-11-18

### ✨ Features

#### Auto-Updater System
- **Automatic update checking** on app startup (configurable interval: 30 min - 24 hours)
- **Manual update checks** from Settings → Updates panel
- **Download progress tracking** with real-time progress bar
- **Release notes preview** before installing updates
- **One-click installation** with automatic app restart
- **Smart notifications** with non-intrusive top-right corner popups
- **GitHub releases integration** with SHA-256 checksum verification

#### Crash Reporting System
- **Automatic crash detection** with full error capture
- **Detailed crash reports** including:
  - Error message and stack trace
  - Timestamp and platform information
  - Application state at crash time
- **Statistics dashboard** tracking crashes by period:
  - Total crashes (all-time)
  - Last 7 days
  - Last 30 days
  - Crashes by error type with percentage breakdown
- **Report management**: View, export (JSON), delete individual or all reports
- **Test mode** for developers to generate test crashes
- **Privacy-first**: All reports stored locally with AES-256 encryption

### ♿ Improvements

#### Accessibility
- Added comprehensive **ARIA labels** for screen readers across all new components
- Added **keyboard navigation** support (full keyboard accessibility)
- Added **role="alert"** and **aria-live="polite"** for update notifications
- Added **aria-valuenow/min/max** for progress bars
- Added **screen reader text** (sr-only) for icon-only buttons
- All new components meet **WCAG AA** accessibility standards

#### User Experience
- Added **animated loading skeletons** for better loading states
- Implemented **skeleton cards** matching final layout (no layout shift)
- Updated **toast notifications** for consistent user feedback
- Improved **dark mode support** for all new panels
- Enhanced **responsive layout** for different window sizes
- Smooth **60fps animations** and transitions throughout

### 🐛 Bug Fixes
- Fixed `useEffect` dependency array in `UpdateNotification` component
- Removed unused imports causing TypeScript warnings (`Send`, `AlertCircle`)
- Fixed type safety issues in crash report handling
- Improved error boundary coverage

### 🔧 Technical

#### Backend (Rust/Tauri)
- Added `updater_check_for_updates` command (GitHub API integration)
- Added `updater_install_update` command (download + install)
- Added `updater_get_version` command
- Added `crash_get_all_reports` command
- Added `crash_delete_report` command
- Added `crash_export_report` command (JSON export)
- Added `crash_cleanup_old_reports` command (cleanup by age)
- Added `crash_get_statistics` command (statistics calculation)

#### Frontend (React/TypeScript)
- Added `UpdateNotification` component (floating update notification)
- Added `UpdateSettingsPanel` component (update configuration)
- Added `CrashReportsPanel` component (crash report dashboard)
- Added `Skeleton` component (reusable loading skeleton)
- Integrated Tauri event streaming for download progress
- Added real-time crash statistics calculation

### 📝 Documentation
- Added comprehensive `TESTING_GUIDE_V3.4.0.md` (400+ lines)
  - 6 test suites with 40+ test scenarios
  - Step-by-step testing instructions
  - Accessibility testing procedures
  - Bug report template
- Added detailed `RELEASE_NOTES_V3.4.0.md` (400+ lines)
  - Feature descriptions and usage guide
  - Technical details and API reference
  - Installation instructions
  - Privacy & security information

### 🔒 Security & Privacy
- All crash reports encrypted with **AES-256**
- **SHA-256 checksum verification** for downloaded updates
- **Code signing** for macOS and Windows builds
- **No telemetry** - all data stays local
- **Personal information sanitization** from crash reports

---

## [3.3.0] - 2025-11-17

### ✨ Features

#### Personality Detection & Auto-Adjustment System
- **Automatic personality detection** from conversation patterns
  - 11 linguistic metrics (formality, verbosity, humor, emoji usage, empathy, creativity, etc.)
  - Big Five personality traits (OCEAN model)
  - MBTI type indicators (I/E, S/N, T/F, J/P)
  - Confidence scoring with sample size validation
- **Automatic persona adjustment** with 3 strategies
  - Conservative (20% max change), Moderate (40%), Aggressive (60%)
  - Learning rate control (default: 0.3)
  - Human-readable explanation generation
  - Database tracking of all adjustments

#### LoRA Fine-tuning System
- **Training data export** in 3 formats (Alpaca, ShareGPT, JSONL)
  - Quality filtering (satisfaction >= 0.7, length 10-4000 chars)
  - Dataset statistics and metadata tracking
  - Compatible with LLaMA-Factory, Axolotl, UnSloth
- **LoRA adapter management**
  - Modelfile generation for Ollama integration
  - Semantic versioning (e.g., "1.0.0")
  - Performance metrics tracking (satisfaction, training loss, perplexity)
  - A/B testing framework for adapter comparison
- **1인 1모델 비용**: Base model sharing + per-user adapters = **100x cost reduction**

### ✨ Added

#### Core Features
- Added `personality_detector.rs` service (600+ lines) for conversation pattern analysis
- Added `persona_adjuster.rs` service (500+ lines) for automatic persona optimization
- Added `lora_data_collector.rs` service (750+ lines) for training data export
- Added `lora_adapter_manager.rs` service (650+ lines) for LoRA adapter lifecycle management

#### Database
- Added `personality_insights` table with 24 fields (11 patterns + 5 Big Five + 4 MBTI + metadata)
- Added 3 indexes for performance optimization (`conversation_id`, `timestamp DESC`, `confidence DESC`)
- Added `persona_changes` table tracking (reason, magnitude, changed parameters)
- Migrated `persona_settings` table from 16 parameters → 10 core parameters

#### Documentation
- Added [LORA_FINE_TUNING_GUIDE.md](docs/LORA_FINE_TUNING_GUIDE.md) (400+ lines) - Complete fine-tuning workflow
- Added [PROGRESS.md](PROGRESS.md) - Detailed development progress and technical metrics
- Updated [README.md](README.md) - GPU VRAM requirements, v3.8.0 features, LoRA system overview

### 🔧 Changed

#### Model & Performance
- **Upgraded base model**: qwen2.5:7b (4.7GB) → **Qwen 2.5 14B** (9.0GB Q4_K_M)
  - Better reasoning capabilities
  - Improved Korean language support
  - Same response time (2-4s) with 4-bit quantization
- **GPU VRAM requirements** (re-calculated):
  - **Inference**: 12-13GB (model 9GB + KV cache 3-4GB)
  - **LoRA Training**: 15-19GB (model 9GB + adapters 0.5GB + optimizer 2-3GB + batch 4GB)
  - Minimum GPU: RTX 3060 12GB / M1 Pro 16GB
  - Recommended GPU: RTX 4090 24GB / M2 Max 32GB

#### System Prompt Engineering
- Enhanced `generate_system_prompt()` with nuanced parameter-driven behavior
- Added Korean honorifics mapping based on formality parameter
- Improved verbosity control (concise vs detailed responses)

#### Database Schema
- Standardized persona parameters: 0-100 (database) ↔ 0.0-1.0 (service layer)
- Added bidirectional conversion: `to_learning_params()` / `from_learning_params()`
- Added migration logic for v3.8.0 schema upgrade

### 🐛 Fixed

- Fixed persona parameter conversion precision loss (f32 → i32 → f32 rounding)
- Fixed database lock contention in personality detection tests
- Fixed test isolation issues with unique conversation IDs per thread
- Fixed `create_default_persona()` visibility for testing

### 🧪 Testing

#### Test Coverage: 69+ tests passing (95% pass rate)
- **Persona Standardization**: 15+ tests
- **Personality Detection**: 34 tests (pattern detection, Big Five, MBTI)
- **LoRA System**: 20 tests (data collector, adapter manager)

#### Test Files
- `src-tauri/src/database/tests.rs` - Persona tests
- `src-tauri/src/services/personality_tests.rs` - Personality tests (1000+ lines)
- `src-tauri/src/services/lora_data_collector.rs` - Data collector tests (embedded)
- `src-tauri/src/services/lora_adapter_manager.rs` - Adapter manager tests (embedded)

### 📊 Performance Metrics

- **Response Time**: 2-4 seconds (Qwen 2.5 14B Q4_K_M on M2 Max / RTX 4090)
- **GPU VRAM Usage**: 12-13GB (inference), 15-19GB (training)
- **System RAM Usage**: 4-6GB (app + database overhead)
- **LoRA Training Time**: 1-3 hours for 1000 examples
- **LoRA Adapter Size**: 50-200MB per version
- **Accuracy Trade-off**: -3-5% vs full precision (acceptable for practical use)

### 💰 Cost Analysis

#### 1인 1모델 비용 절감
- **기존 방식** (Separate models per user):
  - 100 users × RTX 4090 = **$159,900**
- **LoRA 방식** (Shared base + per-user adapters):
  - 1 × RTX 4090 + 100 × 100MB adapters = **$1,599**
  - **100배 비용 절감!** 🎉

### 🚧 Known Issues

- **LoRA Training**: Not real-time (1-3 hours per training session)
  - Scheduled weekly/monthly training approach
  - Future: Background training pipeline optimization

### 🔬 Technical Details

#### Files Modified (Phase 1)
- `src-tauri/src/database/schema.rs` - Migrated persona_settings table
- `src-tauri/src/database/mod.rs` - Added persona CRUD methods
- `src-tauri/src/database/models.rs` - Updated PersonaParameters struct
- `src-tauri/src/services/learning.rs` - Enhanced system prompt generation
- `src-tauri/src/services/ollama.rs` - Integrated persona loading

#### Files Added (Phase 2)
- `src-tauri/src/services/personality_detector.rs` (600+ lines)
- `src-tauri/src/services/persona_adjuster.rs` (500+ lines)
- `src-tauri/src/services/personality_tests.rs` (1000+ lines)
- `src-tauri/src/lib.rs` - Library entry point for testing

#### Files Added (Phase 3)
- `src-tauri/src/services/lora_data_collector.rs` (750+ lines)
- `src-tauri/src/services/lora_adapter_manager.rs` (650+ lines)
- `docs/LORA_FINE_TUNING_GUIDE.md` (589 lines)

#### Database Schema Changes
- Added `personality_insights` table (24 fields)
- Added `persona_changes` table (tracking)
- Added 6 new indexes for performance
- Updated `persona_settings` table (16 → 10 parameters)

---

## [3.2.0] - 2025-11-15

### Added
- Tool Calling System with 6 production tools
- Internet Access (DuckDuckGo/SearX web search)
- Plugin System with V8 JavaScript runtime
- Google OAuth for cloud backup
- Proactive AI notifications

### Changed
- Upgraded to Tauri 2.9
- Improved UI with shadcn/ui components
- Enhanced KakaoTalk-style chat interface

### Fixed
- Performance improvements for streaming responses
- Better error handling for Ollama connection

---

## [3.0.0] - 2025-11-12

### Added
- Initial release of Garden of Eden V3
- qwen2.5:7b integration via Ollama
- RAG episodic memory system
- 10 customizable persona parameters
- SQLite database with AES-256 encryption
- KakaoTalk-style chat UI
- Dark mode support

---

## How to Upgrade

### From v3.2.0 to v3.3.0

1. **Backup your data**:
   ```bash
   cp -r ~/Library/Application\ Support/garden-of-eden-v3 ~/garden-eden-backup
   ```

2. **Update the app**:
   ```bash
   git pull origin main
   npm install
   ```

3. **Upgrade Ollama model**:
   ```bash
   ollama pull qwen2.5:14b
   ```

4. **Database migration** (automatic on first run):
   - Old `persona_settings` table will be migrated
   - New tables (`personality_insights`, `persona_changes`) will be created
   - All existing conversations will be preserved

5. **GPU requirements**:
   - Inference: Ensure 12-13GB VRAM (RTX 3060 12GB or M1 Pro 16GB minimum)
   - Fine-tuning: Ensure 16GB+ VRAM (RTX 3090 or M1 Max recommended)

### Breaking Changes

#### v3.3.0
- **Model Change**: qwen2.5:7b (4.7GB) → Qwen 2.5 14B (9.0GB)
  - Requires additional 4.3GB disk space
  - Requires minimum 12GB VRAM (previously 8GB)
- **Persona Parameters**: Reduced from 16 to 10 core parameters
  - Old parameters will be mapped automatically during migration
  - Some legacy parameters (enthusiasm, directness, patience) removed
- **Database Schema**: Added 2 new tables (`personality_insights`, `persona_changes`)
  - Automatic migration on first run
  - No data loss

#### v3.2.0
- **Tool System**: Requires Ollama with tool calling support
- **OAuth**: Google OAuth requires app credentials (optional feature)

---

## Support

- **Issues**: [GitHub Issues](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/issues)
- **Discussions**: [GitHub Discussions](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/discussions)
- **Email**: bu5119@hanyang.ac.kr

---

**Made with ❤️ by [Matthew](https://github.com/wannahappyaroundme)**
