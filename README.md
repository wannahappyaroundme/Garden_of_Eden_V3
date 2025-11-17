<div align="center">

# 🌳 Garden of Eden V3

### **Your Private AI Assistant That Never Leaves Your Computer**

[![Version](https://img.shields.io/badge/version-3.2.0-blue.svg)](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/releases)
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

Built with **Tauri 2.9** (Rust + React), powered by **qwen2.5:7b** via **Ollama**, and designed for **maximum privacy and performance**.

### Why Choose Garden of Eden?

<table>
<tr>
<td width="33%" align="center">
<h3>🔒 100% Private</h3>
<p>All AI processing happens locally via Ollama. Zero data sent to the cloud. Works completely offline after setup.</p>
</td>
<td width="33%" align="center">
<h3>⚡ Ultra-Fast</h3>
<p>qwen2.5:7b delivers responses in 2-4 seconds. Optimized for speed with Metal (macOS) acceleration.</p>
</td>
<td width="33%" align="center">
<h3>🧠 Learns Your Style</h3>
<p>10 customizable personality parameters. AI learns from your feedback and optimizes its behavior automatically.</p>
</td>
</tr>
<tr>
<td width="33%" align="center">
<h3>💰 Free Forever</h3>
<p>No subscription fees. No API costs. Just open-source software that respects you.</p>
</td>
<td width="33%" align="center">
<h3>☁️ Cloud Backup</h3>
<p>Optional Google Drive backup for persona settings. Encrypted end-to-end. Never required.</p>
</td>
<td width="33%" align="center">
<h3>🎨 Fully Customizable</h3>
<p>KakaoTalk-style chat UI. Dark mode. Keyboard shortcuts. Voice input. Screen context analysis.</p>
</td>
</tr>
</table>

---

## ✨ Current Features (v3.1.0)

### 🤖 AI Intelligence
- **Local LLM**: qwen2.5:7b (4.7GB) via Ollama - fast, multilingual, excellent reasoning
- **Streaming Responses**: Real-time token-by-token output
- **Markdown Support**: Code highlighting with rehype-highlight
- **RAG Memory**: Episodic memory with TF-IDF embeddings for context retention
- **Learning System**: AI optimizes personality based on user feedback

### 🎛️ Persona Customization
- **10 Adjustable Parameters**: Formality, Verbosity, Humor, Emoji Usage, Proactiveness, Technical Depth, Empathy, Code Examples, Questioning, Suggestions
- **Learning Optimization**: Gradient-based learning from thumbs up/down feedback
- **System Prompt Preview**: See how persona affects AI behavior
- **Cloud Backup**: Save/restore persona to Google Drive
- **Local Storage**: All settings saved to SQLite (works offline)

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

### ⚙️ System Integration
- **File Operations**: Read, write, search files
- **Git Integration**: Status, diff, commit, push
- **Workspace Detection**: Detects VSCode, IntelliJ, etc.
- **Screen Tracking**: 3 context levels for AI awareness
- **Webhook Support**: POST requests to external services

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
- `src-tauri/src/services/ollama.rs` - Ollama integration with streaming
- `src-tauri/src/services/learning.rs` - Persona optimization engine
- `src-tauri/src/services/rag.rs` - RAG episodic memory
- `src-tauri/src/services/llava.rs` - Vision model integration
- `src-tauri/src/services/screen.rs` - Screen capture & context
- `src-tauri/src/services/active_window.rs` - Active window detection
- `src-tauri/src/services/embedding.rs` - TF-IDF embeddings
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

# 3. Install Ollama (if not already installed)
brew install ollama

# 4. Start Ollama service
brew services start ollama

# 5. Run the app
npm run dev
```

The onboarding wizard will guide you through:
1. Language selection (Korean/English)
2. Model selection (qwen2.5:7b auto-downloads ~4.7GB)
3. Persona customization
4. Optional Google login for cloud backup

**Detailed instructions**: See [docs/QUICKSTART.md](docs/QUICKSTART.md)

---

## 🛣️ Roadmap

### Planned Features (Not Yet Implemented)

#### 🔮 Vision & Advanced AI
- [ ] LLaVA 7B full integration for deep screen analysis
- [ ] Advanced RAG with BGE-M3 embeddings + LanceDB
- [ ] RAFT hallucination reduction
- [ ] Synthetic data generation for training
- [ ] Whisper Large V3 upgrade (currently using small model)

#### 🤖 Proactive AI Mode
- [ ] AI-led conversation mode (fully autonomous)
- [ ] Advanced screen monitoring with Level 2/3 context
- [ ] Calendar auto-scheduling
- [ ] Email reading/composition

#### 🔌 Extensibility
- [ ] Plugin system architecture
- [ ] Plugin marketplace
- [ ] Persona import/export marketplace
- [ ] Custom model support (beyond qwen2.5:7b)

#### 📦 Distribution & Polish
- [ ] Windows build (currently macOS only)
- [ ] Code signing (macOS, Windows)
- [ ] Auto-updater
- [ ] Crash reporting (Sentry)
- [ ] Comprehensive test coverage (>80%)

**Full specification**: See [docs/archive/MASTER_SPEC.md](docs/archive/MASTER_SPEC.md) for the original 12,000-line vision document.

---

## 💻 Tech Stack

### Core
- **Framework**: Tauri 2.9 (Rust backend + React frontend)
- **Language**: TypeScript 5.3+ (strict mode)
- **Build**: Vite 7.2 (fast HMR)
- **State**: Zustand (lightweight, persistent)

### AI & ML
- **LLM**: qwen2.5:7b (14.8B params, Q4_K_M quantization)
- **Runtime**: Ollama (Metal acceleration on macOS)
- **Speech**: Xenova/transformers (Whisper-small)
- **Embeddings**: TF-IDF (128-dim vectors)
- **Vision**: LLaVA 7B (planned)

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
- **[Claude Development](docs/CLAUDE.md)** - Using Claude Code for development
- **[Contributing](CONTRIBUTING.md)** - How to contribute

### Additional Resources
- **[Changelog](CHANGELOG.md)** - Version history
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

---

## 📊 Performance

- **Response Time**: 2-4 seconds (qwen2.5:7b on M1/M2)
- **Memory Usage**: ~12GB RAM (Ollama + App)
- **Startup Time**: <2s warm start, ~6s cold start
- **Model Size**: 4.7GB (qwen2.5:7b Q4_K_M)
- **Database**: <10MB typical (grows with conversations)

---

## 🔧 System Requirements

### macOS
**Minimum:**
- macOS 11 Big Sur or later
- 16GB RAM
- 20GB free disk space (for models)
- Intel or Apple Silicon processor

**Recommended:**
- macOS 13 Ventura or later
- 24GB+ RAM
- 50GB free disk space
- Apple Silicon (M1/M2/M3) for Metal acceleration

### Windows
**Minimum:**
- Windows 10 (64-bit) or Windows 11
- 16GB RAM
- 20GB free disk space (for models)
- Intel or AMD processor (x86_64)

**Recommended:**
- Windows 11
- 24GB+ RAM
- 50GB free disk space
- Modern CPU with AVX2 support for optimal performance

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
