<div align="center">

# 🌳 Garden of Eden V3

### **Your Private AI Assistant That Never Leaves Your Computer**

[![Version](https://img.shields.io/badge/version-3.4.0-blue.svg)](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows-lightgrey.svg)](#-system-requirements)
[![Tauri](https://img.shields.io/badge/Tauri-2.9-24C8DB.svg)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
[![Rust](https://img.shields.io/badge/Rust-1.70+-orange.svg)](https://www.rust-lang.org/)

> "사람의 외로움을 제거하면서 옆에서 친구처럼 도와주고 위로해주기도하고 나의 생산성을 올려주는 자비스를 만든다"
> *"Creating JARVIS that eliminates loneliness, supports you like a friend, comforts you, and enhances your productivity"*

**100% Local • 100% Private • 0% Cloud • 0% Subscriptions**

[🚀 Quick Start](docs/QUICKSTART.md) • [✨ Features](#-current-features) • [📖 Documentation](#-documentation) • [📚 Wiki](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/wiki) • [🛣️ Roadmap](#-roadmap)

</div>

---

## 🎯 What is Garden of Eden V3?

Garden of Eden V3 is a **production-quality, privacy-first desktop AI assistant** inspired by Tony Stark's JARVIS. Unlike cloud-based AI services, **every single byte of your data stays on your machine**. No subscriptions, no tracking, no compromises.

Built with **Tauri 2.9** (Rust + React), powered by **Qwen 2.5 14B** via **Ollama**, and designed for **maximum privacy and performance**.

### Why Choose Garden of Eden?

<table>
<tr>
<td width="33%" align="center">
<h3>🔒 100% Private</h3>
<p>All AI processing happens locally via Ollama. Zero data sent to the cloud. Works completely offline after setup.</p>
</td>
<td width="33%" align="center">
<h3>⚡ Ultra-Fast</h3>
<p>Qwen 2.5 14B delivers responses in 2-4 seconds. Optimized with 4-bit quantization and Metal/CUDA acceleration.</p>
</td>
<td width="33%" align="center">
<h3>🧠 Learns Your Style</h3>
<p>10 customizable personality parameters. Automatic personality detection (Big Five + MBTI). LoRA fine-tuning for deep personalization.</p>
</td>
</tr>
<tr>
<td width="33%" align="center">
<h3>💰 Free Forever</h3>
<p>No subscription fees. No API costs. Just open-source software that respects you.</p>
</td>
<td width="33%" align="center">
<h3>📁 Local Storage</h3>
<p>All data stored locally in encrypted SQLite. No cloud dependencies. Complete privacy.</p>
</td>
<td width="33%" align="center">
<h3>🎨 Fully Customizable</h3>
<p>KakaoTalk-style chat UI. Dark mode. Keyboard shortcuts. Voice input. Screen context analysis.</p>
</td>
</tr>
</table>

---

## ✨ Current Features (v3.9.0 - Phase 5 Stage 2 Complete)

### 🤖 AI Intelligence
- **Local LLM**: Qwen 2.5 14B (9.0GB Q4_K_M) via Ollama - excellent reasoning, Korean support, fast inference
- **Embeddings**: BGE-M3 (543MB quantized INT8) - state-of-the-art 1024-dim multilingual embeddings for 100+ languages
- **Reasoning Engine 2.0** ✨ NEW (v3.9.0): Advanced multi-stage reasoning pipeline
  - **Chain-of-Thought**: Step-by-step reasoning with self-correction and confidence scoring
  - **Context Enricher**: 5-source context aggregation (temporal, active window, conversation, RAG, visual)
  - **Semantic Wiki**: Automatic fact extraction and knowledge base with BGE-M3 semantic search
  - **Memory Enhancer**: Quality scoring and automatic enhancement of memories
  - **Visual Analyzer**: LLaVA-powered image understanding with lazy loading (0MB→2GB→0MB)
- **Tool Calling System**: AI can use 6 production tools (web search, file ops, system info, calculator)
- **Internet Access**: Privacy-preserving web search (DuckDuckGo/SearX) and URL fetching
- **Plugin System**: V8 JavaScript runtime for extensible plugins
- **Streaming Responses**: Real-time token-by-token output
- **Markdown Support**: Code highlighting with rehype-highlight
- **RAG Memory**: Episodic memory with RAFT hallucination reduction
- **Learning System**: AI optimizes personality based on user feedback
- **Personality Detection** (v3.3.0): Automatic Big Five + MBTI analysis from conversation patterns
- **LoRA Fine-tuning** (v3.3.0): Deep personalization with parameter-efficient training

### 🎛️ Persona Customization & Learning (v3.3.0 Upgrade)
- **10 Adjustable Parameters**: Formality, Verbosity, Humor, Emoji Usage, Empathy, Creativity, Proactiveness, Technical Depth, Code Examples, Questioning
- **Automatic Personality Detection** ✨ NEW:
  - Linguistic pattern analysis (11 metrics)
  - Big Five personality traits (OCEAN model)
  - MBTI type indicators (I/E, S/N, T/F, J/P)
  - Confidence scoring (sample size + statistical validation)
- **Automatic Persona Adjustment** ✨ NEW:
  - 3 strategies: Conservative (20% max), Moderate (40%), Aggressive (60%)
  - Learning rate control (default: 0.3)
  - Human-readable explanation generation
- **LoRA Fine-tuning System** ✨ NEW:
  - Export high-quality training data (Alpaca, ShareGPT, JSONL formats)
  - Train adapters with LLaMA-Factory (1-3 hours on GPU)
  - Manage multiple adapter versions (semantic versioning)
  - A/B testing framework for adapter comparison
  - **1인 1모델 비용**: Base model 공유 + adapter만 per-user (**100배 비용 절감**)
- **System Prompt Preview**: See how persona affects AI behavior
- **Local Storage**: All settings saved to encrypted SQLite (100% offline)

### 📸 Screen Context Analysis
- **LLaVA Vision Integration**: AI can see and understand your screen
- **3-Level Analysis**: Quick, Detailed, Comprehensive
- **Active Window Detection**: macOS/Windows support
- **Screen Context Button**: Capture current screen in chat

### 🔔 Proactive AI Notifications
- **Background Monitoring**: Watches for errors, warnings, TODOs
- **Smart Interruptions**: Priority-based alerts
- **Customizable Triggers**: Configure when AI should notify you

### 🎙️ Voice & Audio
- **Speech-to-Text**: Whisper model via Xenova/transformers
- **Voice Visualizer**: Real-time waveform animation
- **Voice Input Button**: Click to record, auto-transcribe

### 💬 Chat Interface
- **KakaoTalk-Style Design**: Familiar messaging UX
- **Conversation History**: Sidebar with all past chats
- **Real-time Typing Indicator**: See when AI is thinking
- **Error Boundaries**: Graceful error handling
- **Toast Notifications**: Non-intrusive feedback

### ⚙️ System Integration & Tools ✨ NEW
- **Tool Calling Framework**: AI can execute tools to complete tasks
  - `web_search` - Search the web (DuckDuckGo/SearX, privacy-first)
  - `fetch_url` - Fetch and parse web pages (HTML extraction)
  - `read_file` - Read local files
  - `write_file` - Write to local files
  - `get_system_info` - Get CPU, RAM, GPU information
  - `calculate` - Perform math calculations
- **File Operations**: Read, write, search files
- **Git Integration**: Status, diff, commit, push
- **Workspace Detection**: Detects VSCode, IntelliJ, etc.
- **Screen Tracking**: 3 context levels for AI awareness
- **Webhook Support**: POST requests to external services
- **Plugin System**: Load custom V8 JavaScript plugins (permission-based)

### 🔐 Privacy & Security
- **100% Local Processing**: No cloud APIs, no telemetry
- **Encrypted Database**: AES-256 for local data
- **Optional Google OAuth**: For cloud backup only
- **No Data Collection**: Zero tracking, zero analytics

### 🎨 UI/UX
- **Dark Mode**: Full dark theme support
- **Keyboard Shortcuts**: ⌘K (focus), ⌘, (settings), etc.
- **Responsive Design**: Optimized for desktop
- **Spring Animations**: Smooth transitions
- **Onboarding Wizard**: 7-step setup guide

---

## 📦 What's Included

### Backend (Rust/Tauri)

**Phase 5: Reasoning Engine 2.0 (v3.9.0) - NEW**
- `src-tauri/src/services/chain_of_thought.rs` - Step-by-step reasoning with self-correction
  - Multi-step reasoning pipeline (up to 5 steps)
  - Confidence scoring (0.0-1.0) with automatic retry below 0.6 threshold
  - LRU cache (50 entries) for repeated queries
  - Weighted confidence calculation (later steps weighted higher)
- `src-tauri/src/services/context_enricher.rs` - Multi-source context aggregation
  - 5 context sources: Temporal, Active Window, Conversation, RAG, Visual
  - Priority-based sorting (Conversation=4, Visual/Window=3, RAG=2, Temporal=1)
  - Token budget management (1000 tokens ≈ 4000 chars max)
  - Smart pruning to fit context within limits
- `src-tauri/src/services/visual_analyzer.rs` - LLaVA image understanding
  - Lazy loading pattern: 0MB idle → 2GB active → 0MB unloaded
  - Screen capture + base64 image analysis
  - SQLite storage for visual memories (5 most recent cached)
  - Auto-unload after 30s of inactivity
- `src-tauri/src/services/semantic_wiki.rs` - Automatic fact extraction & knowledge base
  - 6 fact categories: preference, knowledge, task, definition, instruction, other
  - JSON-based fact extraction from conversations via LLM
  - Semantic search with BGE-M3 embeddings (cosine similarity > 0.7)
  - Duplicate detection (95% similarity threshold)
  - Entity-based grouping and relationship tracking
- `src-tauri/src/services/memory_enhancer.rs` - Memory quality scoring & enhancement
  - 4-dimensional quality metrics: clarity, completeness, relevance, specificity (0.0-1.0)
  - Automatic enhancement for memories with quality < 0.6
  - LLM-powered context injection for weak areas (< 0.7)
  - Batch processing (configurable batch size, default: 10)
  - Enhancement statistics tracking

**Core Services**
- `src-tauri/src/services/ollama.rs` - Ollama integration with streaming
- `src-tauri/src/services/learning.rs` - Persona optimization engine
- `src-tauri/src/services/personality_detector.rs` - **v3.3.0**: Big Five + MBTI detection
- `src-tauri/src/services/persona_adjuster.rs` - **v3.3.0**: Automatic persona adjustment
- `src-tauri/src/services/lora_data_collector.rs` - **v3.3.0**: Training data export
- `src-tauri/src/services/lora_adapter_manager.rs` - **v3.3.0**: LoRA adapter management
- `src-tauri/src/services/rag.rs` - RAG episodic memory
- `src-tauri/src/services/llava.rs` - Vision model integration
- `src-tauri/src/services/screen.rs` - Screen capture & context
- `src-tauri/src/services/active_window.rs` - Active window detection
- `src-tauri/src/services/embedding.rs` - BGE-M3 embeddings (ONNX Runtime)
- `src-tauri/src/services/proactive_manager.rs` - Background monitoring
- `src-tauri/src/database/` - SQLite with migrations

### Frontend (React/TypeScript)
- `src/renderer/pages/Chat.tsx` - Main chat interface
- `src/renderer/pages/PersonaSettings.tsx` - Persona customization
- `src/renderer/pages/Account.tsx` - Google OAuth & cloud backup
- `src/renderer/components/ProactiveNotification.tsx` - Alert system
- `src/renderer/components/auth/GoogleLoginButton.tsx` - OAuth UI
- `src/renderer/services/cloudSync.ts` - Google Drive integration
- `src/renderer/stores/authStore.ts` - Auth state management

---

## 🚀 Quick Start

### Prerequisites
- macOS 11+ (Apple Silicon or Intel)
- 16GB+ RAM recommended
- 20GB free disk space

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/wannahappyaroundme/Garden_of_Eden_V3.git
cd Garden_of_Eden_V3

# 2. Install dependencies
npm install

# 3. Run the app (Ollama will auto-install if not present)
npm run dev
```

**🎉 No manual Ollama setup required!**
- The app will automatically detect and install Ollama on first run
- **macOS**: Downloads directly from ollama.ai (no Homebrew needed!)
- **Windows**: Downloads official installer and runs silent installation
- Works on both platforms without any prerequisites

The onboarding wizard will guide you through:
1. Language selection (Korean/English)
2. **Automatic Ollama Installation** (if not detected) ✨ NEW
3. Model selection (Qwen 2.5 14B auto-downloads ~9GB)
4. Persona customization
5. Optional Google login for cloud backup

**Detailed instructions**: See [docs/QUICKSTART.md](docs/QUICKSTART.md)

---

## 🛣️ Roadmap

### ✅ Completed (v3.3.0)
- [x] **Tool Calling System** with 6 production tools
- [x] **Internet Access** (privacy-preserving web search + URL fetching)
- [x] **Plugin System Architecture** (V8 JavaScript runtime)
- [x] **Personality Detection** (Big Five + MBTI from conversation patterns)
- [x] **Automatic Persona Adjustment** (3 strategies: Conservative/Moderate/Aggressive)
- [x] **LoRA Fine-tuning System** (training data export, adapter management, A/B testing)
- [x] **Model Upgrade** (qwen2.5:7b → Qwen 2.5 14B Q4_K_M 9.0GB)
- [x] **Cross-platform Ollama Installation** (macOS + Windows auto-install)
- [x] **Tool UI Components** (ToolCallIndicator, ToolResultCard, ToolHistory panels)
- [x] **Real-time Tool Event Emission** (v3.3.1 - tool execution start/success/error events)
- [x] **Tool History & Settings IPC** (v3.3.1 - frontend can manage tool history and settings)

### 🚧 In Progress (v3.4.0 - Planned Q4 2025)
- [ ] **Advanced RAG** - BGE-M3 embeddings + LanceDB vector database
- [ ] **RAFT Hallucination Reduction** - Full integration
- [ ] **Windows Build** - MSI installer with code signing
- [ ] **Plugin Tool Discovery** - Auto-discover tools from loaded plugins
- [ ] **Plugin Tool Execution** - Full V8 runtime integration

### 📋 Planned Features (Not Yet Implemented)

#### 🔮 Vision & Advanced AI (v3.5.0+)
- [ ] LLaVA 7B full integration for deep screen analysis
- [ ] Multi-image conversations
- [ ] Screenshot annotation and UI/UX analysis
- [ ] Synthetic data generation for training
- [ ] Whisper Large V3 upgrade (currently using small model)

#### 🤖 Proactive AI Mode (v3.6.0+)
- [ ] AI-led conversation mode (fully autonomous)
- [ ] Advanced screen monitoring with Level 2/3 context
- [ ] Calendar auto-scheduling (Google Calendar + iCal)
- [ ] Email reading/composition (Gmail API)

#### 🔌 Extensibility (v3.7.0+)
- [ ] Plugin marketplace (GitHub-based discovery)
- [ ] Community plugin signing and verification
- [ ] Persona import/export marketplace
- [ ] Custom model support (beyond Qwen 2.5 14B)

#### 📦 Distribution & Polish (v3.8.0+)
- [ ] Linux build (Debian, Ubuntu, Fedora)
- [ ] Auto-updater (in-app update notifications)
- [ ] Crash reporting (Sentry integration, opt-in)
- [ ] Comprehensive test coverage (target: 80%, current: ~40%)
- [ ] E2E testing with Playwright

**Full specification**: See [docs/archive/MASTER_SPEC.md](docs/archive/MASTER_SPEC.md) for the original 12,000-line vision document.
**Detailed roadmap**: See [docs/ROADMAP.md](docs/ROADMAP.md) for version-by-version plans.

---

## 💻 Tech Stack

### Core
- **Framework**: Tauri 2.9 (Rust backend + React frontend)
- **Language**: TypeScript 5.3+ (strict mode)
- **Build**: Vite 7.2 (fast HMR)
- **State**: Zustand (lightweight, persistent)

### AI & ML
- **LLM**: Qwen 2.5 14B (14.8B params, Q4_K_M quantization, 9.0GB)
- **Runtime**: Ollama (Metal/CUDA acceleration)
- **Speech**: Xenova/transformers (Whisper-small)
- **Embeddings**: TF-IDF (128-dim vectors)
- **Vision**: LLaVA 7B (planned)
- **Fine-tuning** (v3.8.0): LLaMA-Factory + LoRA (rank 16, alpha 32)

### Backend (Rust)
- **Database**: SQLite via rusqlite (AES-256 encrypted)
- **Async**: Tokio runtime
- **HTTP**: reqwest for Ollama API
- **Serialization**: serde_json

### Frontend (React)
- **UI Components**: shadcn/ui (headless, accessible)
- **Styling**: Tailwind CSS
- **Markdown**: react-markdown + rehype-highlight
- **Animations**: Spring animations
- **i18n**: i18next (Korean + English)

### Cloud (Optional)
- **OAuth**: @react-oauth/google
- **Storage**: Google Drive API v3
- **Auth**: JWT decode

---

## 📖 Documentation

### Quick Links
- **[📚 GitHub Wiki](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/wiki)** - Complete user and developer documentation
- **[🚀 Quick Start](docs/QUICKSTART.md)** - Get up and running in 5 minutes
- **[📘 User Guide](docs/USER_GUIDE.md)** - Complete feature guide
- **[🔧 Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions

### Developer Documentation
- **[Building & Deployment](docs/BUILDING.md)** - Build from source, create releases
- **[API Reference](docs/API.md)** - Tauri IPC commands documentation
- **[Testing Guide](docs/TESTING.md)** - Running tests, adding new tests
- **[Tool Calling Testing](TESTING_v3.6.0.md)** - v3.6.0 tool system testing guide
- **[LoRA Fine-tuning Guide](docs/LORA_FINE_TUNING_GUIDE.md)** - **v3.3.0**: Complete fine-tuning workflow ✨ NEW
- **[Claude Development](docs/CLAUDE.md)** - Using Claude Code for development
- **[Contributing](CONTRIBUTING.md)** - How to contribute

### Additional Resources
- **[Changelog](CHANGELOG.md)** - Version history (v3.3.0 updates)
- **[Progress Log](PROGRESS.md)** - Development progress (69+ tests passing)
- **[Master Specification](docs/archive/MASTER_SPEC.md)** - Complete original design (12,000 lines)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│  Frontend (React + TypeScript)          │
│  - Chat UI (KakaoTalk-style)            │
│  - Persona Settings                     │
│  - Account & OAuth                      │
│  - Proactive Notifications              │
└─────────────────┬───────────────────────┘
                  │ IPC (Type-safe)
┌─────────────────▼───────────────────────┐
│  Backend (Rust/Tauri)                   │
│  - Ollama Service (qwen2.5:7b)          │
│  - Learning Service (Persona)           │
│  - RAG Service (Memory)                 │
│  - Screen Service (Context)             │
│  - SQLite Database (Encrypted)          │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  Local Services                         │
│  - Ollama (localhost:11434)             │
│  - SQLite (~/.garden-of-eden-v3/)       │
│  - File System                          │
└─────────────────────────────────────────┘
```

### Phase 5: Reasoning Engine 2.0 Architecture (v3.9.0)

**4-Stage Sequential Pipeline** (VRAM-Efficient Design):

```
Stage 1: Context Gathering
┌────────────────────────────────────┐
│ Context Enricher                   │
│ ├─ Temporal Context (time/date)    │
│ ├─ Active Window (current app)     │
│ ├─ Conversation History (3 msgs)   │
│ ├─ RAG Memories (3 results)        │
│ └─ Visual Analyzer (lazy-loaded)   │──▶ LLaVA 2GB (load on demand)
└────────────────────────────────────┘
                  ↓

Stage 2: Knowledge Enhancement
┌────────────────────────────────────┐
│ Semantic Wiki                      │
│ ├─ Fact Extraction (6 categories)  │
│ ├─ Duplicate Detection (95%)       │
│ └─ Semantic Search (cosine > 0.7)  │
│ Memory Enhancer                    │
│ ├─ Quality Scoring (4 metrics)     │
│ └─ Auto Enhancement (< 0.6)        │
└────────────────────────────────────┘
                  ↓

Stage 3: Reasoning
┌────────────────────────────────────┐
│ Chain-of-Thought Engine            │
│ ├─ Multi-step Reasoning (5 steps)  │
│ ├─ Confidence Scoring (> 0.6)      │
│ ├─ Self-Correction (retry)         │
│ └─ LRU Cache (50 entries)          │
└────────────────────────────────────┘
                  ↓

Stage 4: Future (Learning & Planning)
┌────────────────────────────────────┐
│ Task Planner (TODO)                │
│ Learning Style Adapter (TODO)      │
│ Goal Tracker (TODO)                │
└────────────────────────────────────┘
```

**Key Design Decisions:**
- **Lazy Loading**: LLaVA loads only when visual analysis needed (0MB → 2GB → 0MB)
- **Sequential Execution**: Stages run in order to avoid dependency conflicts
- **Shared Ollama Instance**: All services reuse single LLM connection (no VRAM overhead)
- **Cache-First**: CoT cache + wiki duplicate detection reduce redundant LLM calls
- **Quality-First**: Self-correction + enhancement ensure high-quality outputs

**Database Schema (Phase 5 Tables):**
- `visual_memories`: Stores LLaVA analysis results (id, image_data, analysis, created_at)
- `wiki_facts`: Knowledge base (id, statement, category, entity, confidence, source_conversation_id, created_at)
- `wiki_fact_embeddings`: BGE-M3 embeddings for semantic search (fact_id, embedding)
- `memory_enhancements`: Quality metrics (id, memory_id, original_content, enhanced_content, quality_score, clarity, completeness, relevance, specificity, was_enhanced, enhanced_at)

**API Commands (28 new commands):**
- CoT: `cot_reason`, `cot_update_config`, `cot_get_config`, `cot_clear_cache`, `cot_get_cache_stats`
- Visual: `visual_analyze_image`, `visual_analyze_screen`, `visual_update_config`, `visual_get_config`, `visual_is_loaded`, `visual_get_recent`
- Context: `context_enrich`, `context_update_config`, `context_get_config`
- Wiki: `wiki_extract_facts`, `wiki_store_facts`, `wiki_search`, `wiki_get_by_entity`, `wiki_get_stats`, `wiki_update_config`, `wiki_get_config`
- Memory: `memory_analyze_quality`, `memory_enhance`, `memory_process`, `memory_batch_enhance`, `memory_get_enhancement_stats`, `memory_get_enhancement`, `memory_update_config`, `memory_get_config`

---

## 📊 Performance

- **Response Time**: 2-4 seconds (Qwen 2.5 14B Q4_K_M on M2/RTX 4090)
- **GPU VRAM Usage (Inference)**: **12-13GB** (model 9GB + KV cache 3-4GB)
- **GPU VRAM Usage (LoRA Training)**: **15-19GB** (model 9GB + adapters 0.5GB + optimizer 2-3GB + batch 4GB)
- **System RAM Usage**: ~4-6GB (app + database + OS overhead)
- **Startup Time**: <2s warm start, ~6s cold start (model loading)
- **Model Size**: 9.0GB (Qwen 2.5 14B Q4_K_M) + 50-200MB per LoRA adapter
- **Database**: <10MB typical (grows with conversations)
- **LoRA Training Time**: 1-3 hours for 1000 examples (RTX 4090 / M2 Max)

---

## 🔧 System Requirements

### For Inference (추론/대화)

#### macOS
**Minimum:**
- macOS 11 Big Sur or later
- **GPU VRAM**: 16GB (M1 Pro/Max, M2 Pro/Max, M3)
- **System RAM**: 16GB total
- 20GB free disk space (for models)

**Recommended:**
- macOS 13 Ventura or later
- **GPU VRAM**: 24GB+ (M1 Max/Ultra, M2 Max/Ultra, M3 Max)
- **System RAM**: 24GB+ total
- 50GB free disk space
- Apple Silicon (M1/M2/M3) for Metal acceleration

#### Windows
**Minimum:**
- Windows 10 (64-bit) or Windows 11
- **GPU**: NVIDIA RTX 3060 12GB or RTX 4060 Ti 16GB
- **System RAM**: 16GB
- 20GB free disk space (for models)

**Recommended:**
- Windows 11
- **GPU**: NVIDIA RTX 4090 24GB or RTX 4080 16GB
- **System RAM**: 24GB+
- 50GB free disk space
- CUDA 11.8+ for optimal performance

---

### For LoRA Fine-tuning (추가 학습)

#### GPU Requirements
**Minimum:**
- **GPU VRAM**: 16GB (RTX 3090, RTX 4060 Ti 16GB, M1 Max 64GB, M2 Max 96GB)
- **System RAM**: 24GB
- 50GB free disk space

**Recommended:**
- **GPU VRAM**: 24GB+ (RTX 4090, M1 Ultra, M2 Ultra, M3 Max)
- **System RAM**: 32GB+
- 100GB free disk space (for multiple adapter versions)

**Training Time**: 1-3 hours for 1000 examples
**Batch Size**: 4-8 (adjust based on VRAM)
**LoRA Adapter Size**: 50-200MB per version

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Clone and install
git clone https://github.com/wannahappyaroundme/Garden_of_Eden_V3.git
cd Garden_of_Eden_V3
npm install

# Start dev server (with hot reload)
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **Qwen Team** for the excellent qwen2.5 model
- **Ollama** for making local LLMs accessible
- **Tauri Team** for the amazing framework
- **shadcn/ui** for beautiful, accessible components

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/issues)
- **Discussions**: [GitHub Discussions](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/discussions)
- **Email**: bu5119@hanyang.ac.kr

---

<div align="center">

**Made with ❤️ by [Matthew](https://github.com/wannahappyaroundme)**

**Privacy-First • Local-First • Open Source**

⭐ Star this repo if you find it useful!

</div>
