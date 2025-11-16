# Garden of Eden V3 - Product Roadmap

Vision, milestones, and future plans for Garden of Eden V3.

---

## Vision

**"사람의 외로움을 제거하면서 옆에서 친구처럼 도와주고 위로해주기도하고 나의 생산성을 올려주는 자비스를 만든다"**

*"Creating JARVIS that eliminates loneliness, supports you like a friend, comforts you, and enhances your productivity"*

### Long-Term Goal

Build the world's best **privacy-first, local-first AI assistant** that matches or exceeds cloud AI capabilities while keeping all data on the user's machine.

---

## Current Status (v3.0.4)

### ✅ Completed Phases

#### Phase 1: Foundation (Weeks 1-2) - COMPLETE
- ✅ Tauri 2.9 + React + TypeScript setup
- ✅ SQLite database with migrations
- ✅ IPC communication (type-safe)
- ✅ Window management & system tray
- ✅ Project structure scaffolding

#### Phase 2: AI Integration (Weeks 3-4) - COMPLETE
- ✅ Ollama integration (qwen2.5:7b)
- ✅ Streaming responses
- ✅ Whisper Large V3 (speech-to-text)
- ✅ System TTS (macOS AVFoundation)
- ✅ Model download UI
- ✅ End-to-end conversation flow

#### Phase 3: UI/UX (Weeks 5-6) - COMPLETE
- ✅ KakaoTalk-style chat interface
- ✅ Voice input button with visualizer
- ✅ Dark mode support
- ✅ i18n (Korean + English)
- ✅ Settings screen
- ✅ Conversation history
- ✅ Keyboard shortcuts

#### Phase 4: System Integration (Weeks 7-8) - COMPLETE
- ✅ File system integration (read/write/search)
- ✅ Git integration (status, diff, commit, push)
- ✅ Workspace detection (VSCode, IntelliJ)
- ✅ Screen capture service (LLaVA)
- ✅ Webhook system

#### Phase 5: Learning System (Weeks 9-10) - COMPLETE
- ✅ 10-parameter persona system
- ✅ RAG episodic memory (TF-IDF)
- ✅ Satisfaction feedback (thumbs up/down)
- ✅ Gradient descent optimization
- ✅ Persona UI (sliders, presets)
- ✅ System prompt preview

#### Phase 6: Polish & Testing (Weeks 11-12) - COMPLETE
- ✅ Error handling & logging
- ✅ Loading states & skeletons
- ✅ Performance optimization
- ✅ Basic test coverage
- ✅ User testing

#### Phase 7: Distribution (Week 13) - COMPLETE
- ✅ electron-builder / Tauri bundler configuration
- ✅ Auto-updater setup
- ✅ First-run onboarding flow
- ✅ Model downloader UI

#### Phase 8: v3.0 Launch (Week 14) - COMPLETE
- ✅ GitHub releases with binaries
- ✅ Documentation (README, QUICKSTART, USER_GUIDE)
- ✅ GitHub Wiki (6 pages)
- ✅ Launch announcement
- ✅ Community setup (Issues, Discussions)

#### Phase 9: Cloud Backup & Docs (v3.0.4) - COMPLETE
- ✅ Google OAuth integration
- ✅ Google Drive backup (persona settings only)
- ✅ Complete documentation overhaul
- ✅ SERVICE.md, DEPLOYMENT.md, MARKETING.md
- ✅ 15,000+ words of user docs

---

## Timeline

```
2024 Q4  ████████████████████ Phases 1-8 Complete (v3.0.0)
2025 Q1  ████░░░░░░░░░░░░░░░░ Phase 9 Complete (v3.0.4)
2025 Q2  ░░░░░░░░░░░░░░░░░░░░ Phase 10: Windows Build
2025 Q3  ░░░░░░░░░░░░░░░░░░░░ Phase 11: Advanced Features
2025 Q4  ░░░░░░░░░░░░░░░░░░░░ Phase 12: Plugin System
2026 Q1  ░░░░░░░░░░░░░░░░░░░░ Phase 13: AI Enhancements
```

---

## Upcoming Releases

### v3.1.0 - Windows Support (Q2 2025)

**Goal**: Bring Garden of Eden V3 to Windows users

**Features**:
- [ ] Windows 10/11 build (MSI installer)
- [ ] Windows-specific screen capture
- [ ] Windows TTS integration
- [ ] Ollama Windows support
- [ ] Code signing (Windows Authenticode)
- [ ] SmartScreen handling
- [ ] Installation guide for Windows
- [ ] Chocolatey package (future)

**Technical**:
- Tauri Windows build
- Windows API integration
- Path resolution (Windows vs Unix)
- Registry settings (optional)

**Timeline**: April-June 2025

---

### v3.2.0 - Advanced RAG (Q2 2025)

**Goal**: Upgrade memory system with better embeddings

**Features**:
- [ ] BGE-M3 embeddings (replace TF-IDF)
- [ ] LanceDB vector database (replace SQLite for vectors)
- [ ] RAFT hallucination reduction
- [ ] Improved context retrieval
- [ ] Memory visualization UI
- [ ] Export/import memory database

**Technical**:
- BGE-M3 model integration (~2GB)
- LanceDB setup
- Vector similarity search
- RAFT fine-tuning pipeline

**Timeline**: May-July 2025

---

### v3.3.0 - Internet Access (Q3 2025)

**Goal**: Enable AI to search web and fetch URLs

**Features**:
- [ ] Web search integration (DuckDuckGo, SearX)
- [ ] URL fetching (privacy-preserving)
- [ ] Website summarization
- [ ] News aggregation
- [ ] Privacy controls (opt-in)
- [ ] Content filtering

**Technical**:
- HTTP client with user-agent rotation
- HTML parsing and cleaning
- Content extraction
- Rate limiting
- Privacy-first implementation (no tracking)

**Timeline**: July-September 2025

---

### v3.4.0 - Plugin System (Q3-Q4 2025)

**Goal**: Allow users to extend functionality

**Features**:
- [ ] Plugin API architecture
- [ ] JavaScript/TypeScript plugin support
- [ ] Plugin marketplace (GitHub-based)
- [ ] Sandboxed execution
- [ ] Permission system
- [ ] Plugin discovery UI
- [ ] Example plugins (weather, calculator, etc.)

**Technical**:
- V8 isolate for plugins
- IPC for plugin communication
- Permission manifest
- Plugin signing (optional)

**Timeline**: August-December 2025

---

### v3.5.0 - LLaVA Full Integration (Q4 2025)

**Goal**: Deep screen analysis and image understanding

**Features**:
- [ ] LLaVA 7B full integration
- [ ] Multi-image conversations
- [ ] Image editing suggestions
- [ ] UI/UX analysis
- [ ] Diagram understanding
- [ ] Screenshot annotation

**Technical**:
- LLaVA 7B model (~4.4GB)
- Image preprocessing pipeline
- Multi-modal conversation history
- Optimized inference

**Timeline**: October-December 2025

---

### v4.0.0 - Multiple Personas (2026 Q1)

**Goal**: Save and switch between persona profiles

**Features**:
- [ ] Multiple persona profiles
- [ ] Quick persona switching
- [ ] Persona import/export
- [ ] Community persona marketplace
- [ ] Persona sharing (JSON)
- [ ] Persona versioning

**Technical**:
- Persona storage refactor
- UI for profile management
- Marketplace API design
- Persona validation

**Timeline**: January-March 2026

---

## Feature Backlog

### High Priority

- [ ] **Linux Build** - Debian, Ubuntu, Fedora support
- [ ] **Code Signing & Notarization** - macOS + Windows
- [ ] **Auto-Updater** - In-app update notifications
- [ ] **Crash Reporting** - Sentry integration (opt-in)
- [ ] **Test Coverage** - Increase to 80%
- [ ] **Performance Profiling** - Optimize memory and CPU
- [ ] **Voice Output** - TTS for AI responses
- [ ] **Conversation Export** - PDF, Markdown, JSON

### Medium Priority

- [ ] **Calendar Integration** - Google Calendar, iCal
- [ ] **Email Integration** - Gmail API (read-only)
- [ ] **Clipboard History** - AI-assisted clipboard
- [ ] **Hotkey Activation** - Global hotkey to summon AI
- [ ] **Floating Window Mode** - Always-on-top mini chat
- [ ] **Themes** - Customizable color schemes
- [ ] **Font Customization** - User-selectable fonts
- [ ] **Conversation Folders** - Organize chats
- [ ] **Search Conversations** - Full-text search

### Low Priority

- [ ] **Mobile Companion** - iOS/Android app (read-only sync)
- [ ] **Browser Extension** - Inject AI into web pages
- [ ] **CLI Tool** - Command-line interface
- [ ] **API Server Mode** - Run as local API server
- [ ] **Multi-User Support** - Separate profiles per user
- [ ] **Voice Cloning** - Custom TTS voices
- [ ] **Gesture Controls** - Trackpad gestures
- [ ] **Accessibility** - Screen reader support

---

## Community Requests

Vote on features in [GitHub Discussions](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/discussions)!

### Most Requested

1. **Windows Support** (46 votes) - v3.1.0
2. **Internet Access** (32 votes) - v3.3.0
3. **Plugin System** (28 votes) - v3.4.0
4. **Multiple Personas** (24 votes) - v4.0.0
5. **Linux Build** (18 votes) - Backlog
6. **Calendar Integration** (15 votes) - Backlog
7. **Browser Extension** (12 votes) - Backlog

---

## Technical Debt

### Code Quality
- [ ] Increase test coverage to 80% (currently ~40%)
- [ ] Add E2E tests with Playwright
- [ ] Improve TypeScript strictness
- [ ] Refactor large components (<300 lines)
- [ ] Add API documentation (JSDoc)

### Performance
- [ ] Optimize model loading time (<4s)
- [ ] Reduce memory footprint (<10GB)
- [ ] Lazy load UI components
- [ ] Virtualize conversation history
- [ ] Database query optimization

### Architecture
- [ ] Service layer abstraction
- [ ] Dependency injection
- [ ] Event-driven architecture for plugins
- [ ] State management refactor (consider Redux)

---

## Abandoned Ideas

### Features We Won't Build

- **Blockchain Integration** - Unnecessary complexity
- **NFT Support** - Not aligned with values
- **Paid Tiers** - Committed to free forever
- **Telemetry** - Privacy-first means no tracking
- **Cloud-First Mode** - Defeats the purpose

---

## Success Metrics

### v3.0.4 (Current)
- ✅ 100% local processing
- ✅ <10MB binary size (Tauri: 7.1MB)
- ✅ 2-4s response time
- ✅ 10 persona parameters
- ✅ Voice + screen context
- ✅ Korean + English support

### v4.0.0 (2026 Goal)
- [ ] 10,000+ downloads
- [ ] 1,000+ GitHub stars
- [ ] 80%+ test coverage
- [ ] <2s response time (model optimization)
- [ ] 3 platforms (macOS, Windows, Linux)
- [ ] 100+ community plugins

### v5.0.0 (2027 Goal)
- [ ] 100,000+ downloads
- [ ] 10,000+ GitHub stars
- [ ] Self-sustaining community
- [ ] Multi-modal (text, voice, vision, code)
- [ ] Sub-1s response time
- [ ] Industry-standard privacy tool

---

## Contributing to the Roadmap

### How to Influence

1. **Vote on Discussions** - Upvote features you want
2. **Submit Issues** - Request new features
3. **Create Plugins** - Extend functionality
4. **Contribute Code** - Pull requests welcome
5. **Share Feedback** - Let us know what works

### Roadmap Process

- **Monthly Review** - Adjust priorities based on feedback
- **Quarterly Releases** - Major versions every 3 months
- **Community Voting** - Top 3 requests get prioritized
- **Transparency** - All decisions documented in Discussions

---

## Philosophy

### Core Principles

1. **Privacy First** - Never compromise on privacy
2. **Local First** - Cloud is always optional
3. **Free Forever** - Core app will always be free
4. **Open Source** - MIT license, no exceptions
5. **Community-Driven** - Users guide development
6. **No Bloat** - Keep binary size <15MB
7. **Fast** - Response time <5s always
8. **Accessible** - Works for everyone

### What We Won't Do

- ❌ Add subscription fees
- ❌ Collect user data
- ❌ Require cloud accounts
- ❌ Bloat the app with unnecessary features
- ❌ Break backward compatibility without migration
- ❌ Close-source any core features

---

## FAQ

**Q: Why no mobile app?**
A: Mobile devices can't run 7B models efficiently. We may build a companion app that syncs with desktop (read-only).

**Q: Will you support other models?**
A: Yes! Model selection is planned for v3.6.0 (2026 Q1). Users will choose from Ollama's model library.

**Q: Why focus on macOS first?**
A: That's where our users are (developers, creatives). Windows coming Q2 2025, Linux later.

**Q: Can I sponsor specific features?**
A: We don't accept feature sponsorships to avoid conflicts of interest. All features are community-voted.

**Q: How can I help?**
A: Test, report bugs, suggest features, contribute code, share with others, write documentation, create plugins!

---

## Stay Updated

- **GitHub Releases**: [Watch releases](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/releases)
- **Discussions**: [Join conversations](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/discussions)
- **Changelog**: [Version history](../CHANGELOG.md)
- **Blog**: Future announcement channel

---

**Roadmap Version**: 1.0
**Last Updated**: 2025-01-16
**Next Review**: 2025-02-16

---

<div align="center">

**Made with ❤️ by the Garden of Eden Community**

**Your feedback shapes the future!**

[Vote on Features](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/discussions) • [Report Issues](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/issues) • [Contribute](../CONTRIBUTING.md)

</div>
