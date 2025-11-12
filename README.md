# 🌟 Garden of Eden V3

**100% Local AI Assistant - Privacy-First Desktop Companion**

> "사람의 외로움을 제거하면서 옆에서 친구처럼 도와주고 위로해주기도하고 나의 생산성을 올려주는 자비스를 만든다"

Inspired by Tony Stark's JARVIS, Garden of Eden V3 is a revolutionary desktop AI assistant that runs completely locally on your machine, ensuring total privacy while providing friend-like companionship and productivity enhancement.

---

## ✨ Key Features

- 🔒 **100% Local & Private** - All AI processing happens on your machine, zero data sent to cloud
- 🤖 **Powerful Local AI** - Llama 3.1 8B, LLaVA 7B, Whisper Large V3 (~12GB models)
- 💬 **KakaoTalk-Style Chat** - Familiar, messaging-app interface
- 🎤 **Voice Input/Output** - Korean + English speech recognition and synthesis
- 👁️ **Screen Context Analysis** - AI understands what you're working on (3 levels)
- 🎭 **Custom Personas** - 20-30 adjustable parameters that learn your preferences
- 🧠 **Learning System** - RAG episodic memory, adapts to your style over time
- 🔄 **Dual Mode** - User-Led (reactive) + AI-Led (proactive assistance)
- 🔗 **Deep Integration** - File system, Git, Calendar, Email, Webhooks
- 🧩 **Plugin System** - Extensible via JavaScript plugins
- 🌐 **Multilingual** - Korean + English (with i18n)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ (LTS recommended, <25.0.0)
- **Python** 3.10+ (for AI model bindings)
- **CMake** 3.20+ (for native module compilation)
- **macOS** 12+ or **Windows** 10/11
- **~15GB RAM** during operation
- **~12GB disk space** for AI models

### Installation

```bash
# Clone the repository
git clone https://github.com/wannahappyaroundme/Garden_of_Eden_V3.git
cd Garden_of_Eden_V3

# Install dependencies
npm install
pip install -r requirements.txt

# Build native modules
npm run build:native

# Download AI models (~12GB)
npm run download:models
```

### Development

```bash
# Start development mode (hot reload)
npm run dev

# Run main process only
npm run dev:main

# Run renderer only
npm run dev:renderer

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix
```

### Build

```bash
# Build for current platform
npm run build

# Platform-specific builds
npm run build:mac      # macOS (Intel + Apple Silicon)
npm run build:win      # Windows 10/11
npm run build:linux    # Linux (optional)
```

---

## 📂 Project Structure

```
garden-of-eden-v3/
├── src/
│   ├── main/              # Electron main process (Node.js backend)
│   │   ├── index.ts       # Entry point
│   │   ├── window.ts      # Window management
│   │   ├── ipc/           # IPC handlers
│   │   ├── services/      # Core services (AI, integrations, learning)
│   │   └── database/      # SQLite database layer
│   │
│   ├── renderer/          # React UI (sandboxed)
│   │   ├── App.tsx        # Root component
│   │   ├── pages/         # Chat, Settings, History
│   │   ├── components/    # UI components
│   │   ├── stores/        # Zustand state management
│   │   └── i18n/          # Translations (ko, en)
│   │
│   ├── preload/           # Secure IPC bridge
│   │   └── index.ts
│   │
│   └── shared/            # Shared types/constants
│       ├── types/         # TypeScript interfaces
│       └── constants/     # App-wide constants
│
├── resources/
│   ├── models/            # AI models (gitignored)
│   └── icons/             # App icons
│
├── tests/                 # Unit, integration, E2E tests
├── scripts/               # Build & utility scripts
├── plugins/               # User plugins
└── docs/                  # Additional documentation
```

---

## 🛠️ Technology Stack

### Frontend
- **Electron** - Cross-platform desktop framework
- **React 18** - UI library with TypeScript
- **Vite** - Fast build tool with HMR
- **Zustand** - Lightweight state management
- **shadcn/ui** - Headless, customizable components
- **Tailwind CSS** - Utility-first styling
- **i18next** - Internationalization (Korean + English)

### Backend
- **Node.js 20+** - Runtime
- **TypeScript 5** - Strict type safety
- **SQLite** - Local database (encrypted)
- **ChromaDB** - Vector database for RAG
- **simple-git** - Git integration
- **screenshot-desktop** - Screen capture

### AI Stack (100% Local)
- **Llama 3.1 8B** (~4.8GB) - Conversation, reasoning, code generation
- **LLaVA 7B** (~4GB) - Screen analysis, image understanding
- **Whisper Large V3** (~3GB) - Speech-to-text (Korean + English)
- **System TTS** - Text-to-speech (native)
- **llama.cpp** - AI runtime with Metal/CUDA acceleration

---

## 🎯 Development Roadmap

### Phase 1: Foundation ✅ (Current)
- [x] Project structure setup
- [x] Electron + React + TypeScript + Vite
- [x] Type-safe IPC communication
- [x] Window management & system tray
- [ ] SQLite database with migrations
- [ ] Repository pattern implementation

### Phase 2: AI Integration (Week 3-4)
- [ ] Llama 3.1 8B integration (llama.cpp)
- [ ] Whisper Large V3 (speech-to-text)
- [ ] LLaVA 7B (vision model)
- [ ] System TTS (macOS/Windows)
- [ ] Streaming responses to UI

### Phase 3: UI/UX (Week 5-6)
- [ ] KakaoTalk-style chat interface
- [ ] Settings page with persona customization
- [ ] Conversation history
- [ ] Dark mode support
- [ ] i18n (Korean + English)

### Phase 4: System Integration (Week 7-8)
- [ ] File system integration
- [ ] Git integration
- [ ] Screen capture service (3 levels)
- [ ] Calendar & Email integration
- [ ] Webhook system
- [ ] Plugin architecture

### Phase 5: Learning System (Week 9-10)
- [ ] Persona parameter system
- [ ] RAG episodic memory (ChromaDB)
- [ ] Satisfaction feedback loop
- [ ] Parameter optimization algorithm

### Phase 6: Polish & Testing (Week 11-12)
- [ ] Error handling & logging
- [ ] Performance optimization
- [ ] Accessibility
- [ ] Unit tests (80% coverage)
- [ ] Integration & E2E tests

### Phase 7: Distribution (Week 13)
- [ ] electron-builder configuration
- [ ] Code signing (macOS + Windows)
- [ ] Auto-updater
- [ ] First-run onboarding

### Phase 8: Launch (Week 14)
- [ ] GitHub releases
- [ ] Documentation site
- [ ] Landing page
- [ ] Community setup

---

## 📊 Performance Targets

- **Response Time**: 2-3s on M3 MAX, 3-5s on M3 Pro
- **Memory Usage**: <15GB RAM during operation
- **Startup Time**: <5s cold start, <2s warm start
- **UI Responsiveness**: <16ms frame time (60 FPS)
- **Model Load Time**: <10s for all models

---

## 🔒 Privacy & Security

- **No Telemetry** - Zero analytics or tracking
- **No Cloud Dependency** - Works completely offline
- **Encrypted Storage** - AES-256 encryption for sensitive data
- **Sandboxed Renderer** - Context isolation enabled
- **Secure IPC** - Type-safe, validated communication
- **No Data Leaks** - All processing happens locally

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## 📖 Documentation

- [Complete Specification](PROJECT_EDEN_V3_MASTER_SPEC.md) - 12,000-line detailed spec
- [Claude Code Guide](CLAUDE.md) - Development guidelines for AI assistants
- [TODO List](TODO.md) - Complete implementation checklist (350+ tasks)

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting PRs.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Inspired by Tony Stark's JARVIS from the Marvel Universe
- Built with ❤️ using open-source technologies
- Special thanks to the Llama, Whisper, and LLaVA teams

---

## 📧 Contact & Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/issues)
- **GitHub Discussions**: [Community Q&A](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/discussions)

---

**Current Version**: 1.0.0-alpha
**Last Updated**: 2025-01-12
**Status**: 🚧 Active Development (Phase 1)

---

Made with 💚 by the Garden of Eden Team
