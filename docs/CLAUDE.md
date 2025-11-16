# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Garden of Eden V3** is a privacy-first, desktop AI assistant that runs 100% locally. It aims to be a friend-like companion that eliminates loneliness while boosting productivity, inspired by Tony Stark's JARVIS.

**Core Mission**: "사람의 외로움을 제거하면서 옆에서 친구처럼 도와주고 위로해주기도하고 나의 생산성을 올려주는 자비스를 만든다"

## Current Status

**IMPLEMENTATION IN PROGRESS** - Starting from specification phase. Full 14-week implementation roadmap in execution.

## Technology Stack

### Frontend
- **Framework**: Tauri 2.9 (Rust + WebView, ultra-lightweight 7.1MB builds)
- **UI Library**: React 18+ with TypeScript 5.0+
- **Build Tool**: Vite 7.2 (fast HMR, optimized builds)
- **State Management**: Zustand (lightweight, performant)
- **UI Components**: shadcn/ui (headless, customizable)
- **Styling**: Tailwind CSS 3.4
- **Internationalization**: i18next + react-i18next (Korean + English)

### Backend (Tauri Rust Core)
- **Runtime**: Rust (async with tokio)
- **Language**: Rust (safe, fast, efficient)
- **Database**: rusqlite 0.32 (encrypted with AES-256)
- **Git Integration**: Via Rust
- **Screen Capture**: screenshots 0.8 crate

### AI Stack (100% Local via Ollama)
- **Primary LLM**: phi3:mini (~2.2GB) - Conversation, reasoning, code generation, Korean language
  - 4B parameters (Microsoft Phi-3)
  - Ultra-fast <5 second responses
  - 29+ language support including Korean
  - Context: 4K tokens
  - MIT license (commercial friendly)
  - **Overfitting Prevention**: temperature 0.8, top_p 0.92, top_k 45, repeat_penalty 1.15
- **Vision Model**: (Future) LLaVA 7B (~4.4GB) - Screen analysis
- **Speech-to-Text**: (Future) Whisper - Voice input
- **Text-to-Speech**: System native TTS (platform-specific)
- **AI Runtime**: Ollama with Metal (macOS) / CUDA (Windows) acceleration

**Total AI Storage**: ~2.2GB (phi3:mini only, 40x smaller than previous)
**RAM Usage During Operation**: 3-4GB (phi3:mini: ~3GB + app)

## Key Architectural Decisions

### 1. 100% Local Privacy-First Philosophy
- **Zero data leaves your machine** - No cloud, no telemetry, no analytics
- **Works completely offline** after initial setup
- **Encrypted local storage** - AES-256 encryption for all user data
- **No subscription fees** - Free, open-source alternative to cloud AI assistants

### 2. "화면이 곧 현실" (Screen is Reality)
AI understands context through screen analysis with 3 levels:
- **Level 1**: Current screen only (fast, low resource)
- **Level 2**: Recent work window (10 minutes of context)
- **Level 3**: Full project analysis (deep understanding)

### 3. Dual Mode System
- **Mode 1: User-Led (사용자 주도)** - Reactive, waits for user input, traditional assistant behavior
- **Mode 2: AI-Led (AI 주도)** - Proactive, monitors screen, suggests actions, interrupts when helpful

### 4. Custom Persona System
- **20-30 adjustable parameters** - Formality, humor, verbosity, emoji usage, etc.
- **Learning system** - Adapts to user preferences over time
- **RAG-based episodic memory** - Remembers past conversations and context
- **Satisfaction feedback loop** - Optimizes persona based on user reactions

### 5. Tauri Architecture
```
┌─────────────────────────────────────────┐
│  Rust Backend (Tauri Core)              │
│  - AI model management (Ollama)         │
│  - System integration (files, git)      │
│  - Database & storage (rusqlite)        │
│  - IPC commands                         │
└─────────────────────────────────────────┘
          ↕ (Type-safe IPC via Tauri invoke)
┌─────────────────────────────────────────┐
│  React Frontend (WebView - Sandboxed)   │
│  - Chat interface                       │
│  - Settings & persona management        │
│  - Notifications                        │
└─────────────────────────────────────────┘
```

## Project Structure

```
garden-of-eden-v3/
├── src/
│   ├── renderer/               # React frontend (WebView)
│   │   ├── App.tsx            # Root component
│   │   ├── pages/             # Chat, Settings, etc.
│   │   ├── components/        # UI components
│   │   └── stores/            # Zustand state
│   │
│   └── preload/               # (Tauri handles IPC internally)
│
├── src-tauri/                 # Rust backend
│   ├── src/
│   │   ├── main.rs           # Entry point
│   │   ├── commands/         # Tauri IPC commands
│   │   │   ├── ai.handler.ts
│   │   │   ├── file.handler.ts
│   │   │   ├── git.handler.ts
│   │   │   └── system.handler.ts
│   │   ├── services/           # Core business logic
│   │   │   ├── ai/
│   │   │   │   ├── llama.service.ts      # Qwen 2.5 14B integration (via Ollama)
│   │   │   │   ├── llava.service.ts      # LLaVA vision model
│   │   │   │   ├── whisper.service.ts    # Speech-to-text
│   │   │   │   ├── tts.service.ts        # Text-to-speech
│   │   │   │   ├── raft.service.ts       # RAFT hallucination reduction
│   │   │   │   ├── proactive-ai.service.ts # Proactive conversation
│   │   │   │   ├── chunking.service.ts   # Text chunking for BGE-M3
│   │   │   │   └── synthetic-data.service.ts # Training data generation
│   │   │   ├── integration/
│   │   │   │   ├── file.service.ts       # File system access
│   │   │   │   ├── git.service.ts        # Git operations
│   │   │   │   ├── calendar.service.ts   # Calendar API (Google/ICS)
│   │   │   │   └── email.service.ts      # Email API (Gmail)
│   │   │   ├── learning/
│   │   │   │   ├── persona.service.ts    # Custom persona engine
│   │   │   │   ├── rag.service.ts        # RAG memory system
│   │   │   │   └── memory.service.ts     # Episodic memory
│   │   │   └── screen/
│   │   │       └── capture.service.ts    # Screen context capture
│   │   ├── database/           # SQLite layer
│   │   │   ├── schema.ts
│   │   │   ├── migrations/
│   │   │   └── repositories/
│   │   └── utils/
│   │
│   ├── renderer/                # Renderer process (React UI)
│   │   ├── App.tsx             # Root component
│   │   ├── pages/
│   │   │   ├── Chat.tsx        # Main chat interface (KakaoTalk-style)
│   │   │   ├── Settings.tsx    # Settings & persona customization
│   │   │   └── History.tsx     # Conversation history
│   │   ├── components/
│   │   │   ├── chat/           # Chat bubbles, input, voice button
│   │   │   ├── persona/        # Persona parameter sliders
│   │   │   └── ui/             # shadcn/ui components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── stores/             # Zustand stores (global state)
│   │   ├── styles/             # Tailwind config & global CSS
│   │   └── i18n/               # i18next translations (ko, en)
│   │
│   ├── preload/                 # Preload scripts (secure IPC bridge)
│   │   └── index.ts
│   │
│   └── shared/                  # Shared types/constants between processes
│       ├── types/
│       │   ├── ai.types.ts
│       │   ├── chat.types.ts
│       │   ├── persona.types.ts
│       │   └── ipc.types.ts
│       └── constants/
│
├── resources/
│   ├── models/                  # AI models (via Ollama, ~16.5GB total)
│   │   ├── qwen2.5:14b (via Ollama)            # 9.0GB Q4_K_M
│   │   ├── llava-7b.gguf                       # 4.4GB
│   │   ├── whisper-large-v3.bin                # 3.1GB
│   │   └── bge-m3-embeddings/                  # BGE-M3 for RAG
│   └── icons/                   # App icons (macOS, Windows)
│
├── tests/
│   ├── unit/                    # Unit tests (Jest)
│   ├── integration/             # Integration tests
│   └── e2e/                     # E2E tests (Playwright)
│
├── scripts/                     # Build & utility scripts
│   ├── download-models.js       # AI model downloader
│   └── build.js                 # Custom build logic
│
├── plugins/                     # User plugins directory
├── docs/                        # Additional documentation
├── package.json
├── tsconfig.json
├── electron-builder.yml         # Build configuration
├── vite.config.ts              # Vite configuration
└── PROJECT_EDEN_V3_MASTER_SPEC.md  # Complete specification (12,000 lines)
```

## Development Commands

### Setup
```bash
# Install dependencies
npm install
pip install -r requirements.txt

# Build native modules (llama.cpp bindings)
npm run build:native

# Install Ollama and download AI models (~16.5GB total)
brew install ollama         # macOS
ollama pull qwen2.5:14b    # Qwen 2.5 14B Instruct (9.0GB Q4_K_M)
# Or manually download other models:
npm run download:whisper   # Whisper Large V3 (3.1GB)
npm run download:llava     # LLaVA 7B (4.4GB)
```

### Development
```bash
# Start development mode (hot reload)
npm run dev

# Run processes separately
npm run dev:main       # Main process only
npm run dev:renderer   # Renderer (React) only

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
npm run build:mac      # macOS (Intel + Apple Silicon universal)
npm run build:win      # Windows 10/11
npm run build:linux    # Linux (optional)

# Package without building
npm run package
```

### Testing
```bash
# Run all tests
npm test

# Test types
npm run test:unit           # Unit tests (Jest)
npm run test:integration    # Integration tests
npm run test:e2e           # E2E tests (Playwright)
npm run test:coverage      # Coverage report (target: 80%)

# Watch mode
npm run test:watch
```

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- ✅ Setup Electron + React + TypeScript + Vite
- ✅ Configure build tools (Vite for renderer, esbuild for main)
- ✅ Setup SQLite database with migrations
- ✅ Implement repository pattern
- ✅ Basic IPC communication (type-safe channels)
- ✅ Window management & system tray
- ✅ Project structure scaffolding

### Phase 2: AI Integration (Week 3-4) ✅ COMPLETE
- ✅ Integrate Ollama for LLM runtime
- ✅ Load Qwen 2.5 14B Instruct model (streaming responses via Ollama)
- ✅ Integrate Whisper Large V3 (speech-to-text)
- ✅ Setup system TTS (macOS AVFoundation / Windows SAPI)
- ✅ Implement streaming responses to UI
- ✅ Test end-to-end conversation flow
- ✅ Add model download UI

### Phase 3: UI/UX (Week 5-6)
- KakaoTalk-style chat interface (bubbles, timestamps)
- Chat input with voice button
- Typing indicator & loading states
- Design system (colors, typography, spacing)
- Dark mode support
- i18n setup (Korean + English)
- Settings screen & conversation history
- Keyboard shortcuts (Cmd+K to focus, etc.)

### Phase 4: System Integration (Week 7-8)
- File system integration (read/write/search)
- Git integration (status, diff, commit, push)
- Workspace detection (VSCode, IntelliJ, etc.)
- Screen capture service (3 context levels)
- Calendar integration (Google Calendar API + ICS)
- Email integration (Gmail API)
- Webhook system (POST requests to external services)
- Plugin architecture (load user scripts)

### Phase 5: Learning System (Week 9-10)
- Persona parameter system (20-30 parameters)
- RAG episodic memory (ChromaDB integration)
- Satisfaction feedback loop (thumbs up/down)
- Parameter optimization algorithm (gradient descent)
- Memory retrieval (semantic search)
- Persona UI (sliders, presets, import/export)
- Learning analytics dashboard

### Phase 6: Polish & Testing (Week 11-12)
- Comprehensive error handling & logging
- Loading states & skeleton screens
- Accessibility (screen reader, keyboard navigation)
- Performance optimization (lazy loading, memoization)
- Unit tests (80% coverage target)
- Integration tests (full chat flow)
- E2E tests (Playwright)
- User testing with 5-10 beta testers

### Phase 7: Distribution (Week 13)
- electron-builder configuration
- Code signing (macOS: Apple Developer, Windows: Authenticode)
- Auto-updater setup (check for updates on startup)
- Crash reporting (Sentry integration)
- First-run onboarding flow
- Model downloader UI with progress
- Installer testing (clean installs)

### Phase 8: Launch (Week 14)
- GitHub releases with binaries
- Website/landing page
- Documentation site (VitePress)
- Community channels (Discord/GitHub Discussions)
- Launch announcement
- User feedback collection

## Core Features

1. **KakaoTalk-Style Chat Interface** - Familiar, messaging-app UX
2. **Voice Input/Output** - Whisper STT + System TTS (Korean + English)
3. **Screen Context Analysis** - 3 levels of context understanding
4. **File System & Git Integration** - Deep workspace awareness
5. **Custom Personas** - 20-30 parameters, learning system
6. **Learning System** - RAG memory, satisfaction feedback
7. **Dual Mode** - User-Led (reactive) + AI-Led (proactive)
8. **Plugin System** - Extensible via user scripts
9. **Webhook Support** - Integrate with external services
10. **Multilingual** - Korean + English only (via i18next)

## Performance Targets

- **Response Time**: 2-4s for typical responses (Qwen 2.5 14B via Ollama)
  - Fast mode (casual chat): 2-3s for short responses
  - Detailed mode (complex queries): 3-5s for longer responses
  - Meets original 2-4s target ✅
- **Memory Usage**: 10-14GB RAM during operation (Qwen 14B: ~12GB + system)
- **Startup Time**: <6s cold start (model loading), <2s warm start
- **UI Responsiveness**: <16ms frame time (60 FPS)
- **Model Load Time**: 4-6s for Qwen 2.5 14B with Ollama on first launch

## Development Guidelines

### TypeScript
- **Strict mode enabled** - No implicit any, strict null checks
- **Type-safe IPC channels** - Shared types between main/renderer
- **No `any` types** - Use `unknown` if necessary, then type guard
- **Prefer interfaces over types** for object shapes

### Testing
- **Target: 80% code coverage**
- **Unit tests for all services** (AI, integration, learning)
- **Integration tests for IPC** and database operations
- **E2E tests for critical flows** (chat, settings, voice)
- **Test doubles:** Use Jest mocks for AI models in tests

### Error Handling
- **Graceful degradation** - App should never crash
- **User-friendly error messages** in Korean + English
- **Logging:** Winston for structured logs
- **Sentry:** Crash reporting (opt-in only, privacy-first)

### Privacy & Security
- **No telemetry without consent**
- **No data leaves the machine** except user-initiated actions (calendar, email)
- **Encrypt sensitive data** (AES-256 for database)
- **Secure IPC** - Use contextBridge, never expose Node.js APIs directly
- **Validate all inputs** from renderer process

### Code Style
- **ESLint + Prettier** for consistent formatting
- **Conventional Commits** (feat/fix/docs/refactor/test/chore)
- **Meaningful variable names** - Prefer clarity over brevity
- **Comment complex logic** - Especially AI prompt engineering

### Performance
- **Lazy load components** with React.lazy
- **Memoize expensive computations** with useMemo/useCallback
- **Virtualize long lists** (react-window for history)
- **Debounce user input** to avoid excessive AI calls
- **Stream AI responses** - Never block UI

## Key Documents

### PROJECT_EDEN_V3_MASTER_SPEC.md (12,000 lines)
The complete specification covering:
- **Part 1:** Vision, Philosophy & Cross-Platform Strategy
- **Part 2:** AI Intelligence & Local Models
- **Part 3:** Architecture & System Integration
- **Part 4:** UI/UX & Features
- **Part 5:** Implementation & Data Models
- **Part 6:** API Reference
- **Part 7:** User & Developer Guide

**Always refer to this spec** for detailed implementation requirements, API contracts, and design decisions.

## Common Development Tasks

### Adding a New IPC Channel
1. Define types in `src/shared/types/ipc.types.ts`
2. Create handler in `src/main/ipc/[feature].handler.ts`
3. Register handler in `src/main/index.ts`
4. Expose via preload in `src/preload/index.ts`
5. Use in renderer via `window.api.[channel]`

### Adding a New Service
1. Create service file in `src/main/services/[category]/[name].service.ts`
2. Define interface with dependency injection
3. Write unit tests in `tests/unit/services/[category]/[name].service.test.ts`
4. Register in service container (if using DI)
5. Call from IPC handler

### Adding a New UI Component
1. Create component in `src/renderer/components/[category]/[Name].tsx`
2. Use shadcn/ui primitives where possible
3. Style with Tailwind CSS
4. Add translations to `src/renderer/i18n/locales/[ko|en].json`
5. Export from index for easy imports

### Running a Single Test
```bash
# Unit test
npm run test:unit -- tests/unit/services/ai/llama.service.test.ts

# E2E test
npm run test:e2e -- tests/e2e/chat.spec.ts
```

## Debugging

### Main Process
- VSCode debugger attached to Electron main process
- `console.log` → Terminal output
- Winston logs → `~/.garden-of-eden-v3/logs/`

### Renderer Process
- Open DevTools: `Cmd+Option+I` (macOS) / `Ctrl+Shift+I` (Windows)
- React DevTools available
- `console.log` → DevTools console

### AI Models
- Enable verbose logging in llama.cpp
- Monitor token generation speed
- Check memory usage with Activity Monitor / Task Manager

## Important Notes

- **Solo developer project** - Speed prioritized over perfection
- **Desktop-first** - Windows and macOS only (no mobile)
- **Migrated to Tauri** for lighter weight and better performance than Electron
- **AI models (16.5GB) via Ollama** for easy model management
- **Focus on local experience** - No cloud fallback, no compromise
- **Privacy is non-negotiable** - Never send user data to servers
- **RAM requirement: 16-24GB recommended** for optimal Qwen 2.5 14B performance
- **Production-ready quality** - This is NOT an MVP, aim for paid-product quality

## Support & Resources

- **GitHub Issues**: Bug reports & feature requests
- **Discussions**: Community Q&A
- **Wiki**: Extended documentation
- **Discord**: Real-time chat (when available)

---

**Last Updated**: 2025-01-12
**Spec Version**: 3.0.0
**Implementation Status**: Phase 1 - Foundation
