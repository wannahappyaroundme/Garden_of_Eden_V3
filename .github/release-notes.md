# Garden of Eden V3 - v1.0.0

## 🎉 First Stable Release!

We're excited to announce the first stable release of Garden of Eden V3 - a 100% local, privacy-first AI desktop assistant inspired by Tony Stark's JARVIS.

> "사람의 외로움을 제거하면서 옆에서 친구처럼 도와주고 위로해주기도하고 나의 생산성을 올려주는 자비스를 만든다"

---

## ✨ Key Features

### 🔒 100% Local & Private
- All AI processing happens on your machine
- Zero data sent to the cloud
- Works completely offline after initial setup
- AES-256 encrypted local storage

### 🤖 Powerful Local AI Stack (~12GB)
- **Llama 3.1 8B** - Conversation, reasoning, code generation
- **LLaVA 7B** - Screen analysis and image understanding
- **Whisper Large V3** - Speech-to-text (Korean + English)
- **System TTS** - Native text-to-speech

### 💬 KakaoTalk-Style Chat Interface
- Familiar messaging-app UX
- Markdown rendering with syntax highlighting
- Streaming responses (token-by-token)
- Conversation history and search

### 🎭 Custom Persona System
- 28 adjustable parameters for AI personality
- 6 preset personas (Professional, Friendly, Technical, etc.)
- Learning system that adapts to your preferences
- RAG episodic memory for context retention

### 👁️ Screen Context Analysis
- 3 levels of context understanding
- Multi-monitor support
- Automatic workspace detection
- Project-aware assistance

### 🔗 Deep System Integration
- **File System**: Read, write, search operations
- **Git**: Full version control integration
- **Calendar**: ICS and Google Calendar sync
- **Webhooks**: Slack, Discord, Notion integration
- **Workspace Detection**: VSCode, IntelliJ, and more

### 🌐 Internationalization
- Korean and English support
- i18n infrastructure for future languages
- Language-aware AI responses

---

## 📦 Installation

### macOS (12+)
1. Download `Garden-of-Eden-V3-1.0.0.dmg`
2. Open the DMG file
3. Drag the app to Applications folder
4. Open the app (you may need to allow it in System Preferences → Security)
5. Follow the onboarding wizard to download AI models (~12GB)

### Windows (10/11)
1. Download `Garden-of-Eden-V3-Setup-1.0.0.exe`
2. Run the installer
3. Follow the installation wizard
4. Launch the app from Start Menu
5. Follow the onboarding wizard to download AI models (~12GB)

### System Requirements
- **RAM**: 15GB during operation (12GB for AI models + 3GB for app)
- **Disk**: 12GB for AI models + 500MB for application
- **CPU**: Apple Silicon (M1/M2/M3) recommended for macOS, GPU recommended for Windows
- **OS**: macOS 12+ or Windows 10/11

---

## 🚀 What's New in v1.0.0

### Phase 7: Distribution (New in v0.8.0)
- ✅ Auto-updater with electron-updater
- ✅ Model downloader service (12GB AI models)
- ✅ First-run onboarding wizard (7 steps)
- ✅ Icon generation tooling
- ✅ Code signing and notarization

### Phase 6: Testing Infrastructure
- ✅ Comprehensive unit tests (5,517 lines, 115+ suites)
- ✅ Jest configuration for main and renderer processes
- ✅ 80%+ code coverage target
- ✅ Mocking strategy for AI services

### Phase 5: Learning System
- ✅ 28-parameter persona system
- ✅ RAG episodic memory with ChromaDB
- ✅ Satisfaction feedback loop
- ✅ Parameter optimization with gradient descent

### Phase 4: System Integration
- ✅ File system operations
- ✅ Git integration (status, diff, commit, push)
- ✅ Screen capture service (3 context levels)
- ✅ Workspace detection and analysis
- ✅ Calendar integration (ICS + Google)
- ✅ Webhook system (Slack, Discord, Notion)

### Phase 3: UI/UX
- ✅ KakaoTalk-style chat interface
- ✅ Settings page with persona customization
- ✅ Conversation history sidebar
- ✅ Dark mode support
- ✅ i18n (Korean + English)

### Phase 2: AI Integration
- ✅ Llama 3.1 8B with streaming responses
- ✅ Whisper Large V3 speech-to-text
- ✅ LLaVA 7B vision model
- ✅ System TTS (macOS/Windows)

### Phase 1: Foundation
- ✅ Electron + React + TypeScript + Vite
- ✅ Type-safe IPC communication
- ✅ SQLite database with migrations
- ✅ Window management with system tray

---

## 📊 Performance

- **Response Time**: 2-3s on M3 MAX, 3-5s on M3 Pro
- **Memory Usage**: <15GB RAM during operation
- **Startup Time**: <5s cold start, <2s warm start
- **UI Responsiveness**: 60 FPS
- **Model Load Time**: <10s for all models on first launch

---

## 🔧 Known Issues

### Critical
- None

### Minor
- First model load may take 10-15 seconds
- High memory usage (12-15GB) during AI operations (expected for local models)
- Auto-update requires restart to install

### Workarounds
- Restart app if models fail to load
- Ensure 15GB+ free RAM before launching
- Close other memory-intensive apps while using Eden

---

## 📖 Documentation

- **README**: [Complete project overview](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/blob/main/README.md)
- **CHANGELOG**: [Full version history](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/blob/main/CHANGELOG.md)
- **CONTRIBUTING**: [Contribution guidelines](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/blob/main/CONTRIBUTING.md)
- **Specification**: [12,000-line detailed spec](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/blob/main/PROJECT_EDEN_V3_MASTER_SPEC.md)

---

## 🙏 Acknowledgments

- Inspired by Tony Stark's JARVIS from the Marvel Universe
- Built with ❤️ using 100% open-source technologies
- Special thanks to:
  - **Meta** - Llama 3.1 model
  - **OpenAI** - Whisper model
  - **Haotian Liu** - LLaVA vision model
  - **Electron** - Cross-platform framework
  - **React** - UI library
  - All contributors and testers

---

## 🤝 Community

- **GitHub Issues**: [Report bugs or request features](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/issues)
- **GitHub Discussions**: [Community Q&A](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/discussions)
- **Discord**: Coming soon!

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ⚠️ Important Notes

### Privacy Guarantee
- **No telemetry** - We don't collect any usage data
- **No analytics** - We don't track your behavior
- **No cloud** - Everything runs locally on your machine
- **No accounts** - No sign-up or login required

### First-Time Setup
- Initial setup downloads ~12GB of AI models
- This is a one-time download that takes 30-60 minutes depending on your internet speed
- Models are stored locally and never need to be re-downloaded
- You can use the app while models are downloading (UI will be available)

### Updates
- Auto-updater checks for new versions on startup (production only)
- Updates are downloaded in the background
- You control when to install updates (restart required)
- No forced updates - you decide when to upgrade

---

## 🔮 What's Next?

### v1.1.0 (Planned)
- AI-led proactive mode implementation
- Plugin system for user extensions
- Email integration (Gmail API)
- Advanced screen analysis with object detection
- Performance optimizations

### v1.2.0 (Planned)
- Multi-language support (Spanish, Japanese, Chinese)
- Custom model support (bring your own models)
- Cloud sync option (optional, opt-in only)
- Mobile companion app (view-only)

---

## 💚 Support the Project

If you find Garden of Eden V3 useful, please:
- ⭐ Star the repository
- 🐛 Report bugs and issues
- 💡 Suggest new features
- 📢 Share with friends and colleagues
- 🤝 Contribute code or documentation

---

**Made with 💚 by the Garden of Eden Team**

**Version**: 1.0.0
**Release Date**: 2025-01-13
**License**: MIT
