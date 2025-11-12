# Changelog

All notable changes to Garden of Eden V3 will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Current Version: 0.7.0-alpha (2025-01-12)

**12 Major Commits | ~70% MVP Complete | ~50% Production Ready**

---

## [0.7.0] - 2025-01-12

### Added
- **Automatic Conversation List Refresh** (Commit 12: 21efe41)
  - ConversationHistory component converted to forwardRef with exposed refresh method
  - Chat component now triggers sidebar refresh immediately when new conversations are created
  - Real-time visual feedback when sending first message in a conversation

- **Full Conversation Management System** (Commit 11: 1d25492)
  - Complete CRUD operations for conversations
  - Auto-create conversations from first message with intelligent title generation (first 30 chars)
  - Conversation IPC handler with create, getAll, getById, update, delete, search operations
  - Cascade delete: deleting conversation removes all associated messages
  - Message count tracking per conversation with automatic increment
  - Conversation sidebar integration with Electron IPC (migrated from Tauri)
  - Real-time conversation list updates

- **Message Persistence to Database** (Commit 10: b07f384)
  - Message IPC handler with full CRUD operations
  - Automatic message saving after sending/receiving
  - Load conversation history from database when switching conversations
  - Metadata tracking: response time, context level, tokens
  - Message search functionality
  - Satisfaction feedback support (thumbs up/down)

### Technical Details
- **Message Repository**: Full database integration with better-sqlite3
- **Conversation Repository**: Auto-updating timestamps and message counts
- **IPC Layer**: Type-safe handlers for message and conversation operations
- **Preload Bridge**: Exposed 13 new APIs (6 message + 7 conversation operations)

---

## [0.6.0] - 2025-01-12

### Added
- **Comprehensive Project Documentation** (Commit 9: a0dd349)
  - Created IMPLEMENTATION_STATUS.md (689 lines)
  - Detailed phase-by-phase progress tracking
  - Architecture overview and tech stack documentation
  - Feature checklist with status indicators
  - Known limitations and next steps
  - Developer guide for running, debugging, contributing

---

## [0.5.0] - 2025-01-12

### Added
- **Chat UI Integration with AI Backend** (Commit 8: 76689cd)
  - Streaming chat interface connected to Llama service
  - Real-time token-by-token response display
  - Markdown rendering with syntax highlighting
  - GitHub Dark theme for code blocks
  - Custom styling for all markdown elements
  - react-markdown + rehype-highlight + remark-gfm integration

- **AI Backend Foundation** (Commit 7: fb47bf4)
  - LlamaService: Complete AI model management
  - Streaming token generation with callbacks
  - Conversation history management with context window trimming
  - GPU acceleration support (Metal for macOS, CUDA for Windows)
  - Persona system integration via dynamic system prompts
  - AI IPC handlers for chat, streaming, and cancellation
  - node-llama-cpp@3.4.0 integration

### Technical Details
- **Model Configuration**: Temperature, top_p, top_k, max_tokens, context size (4096)
- **GPU Layers**: Default 33 layers for M3 chips
- **Context Management**: Automatic history trimming to fit context window
- **Lazy Initialization**: Model loads only on first chat request

---

## [0.4.0] - 2025-01-11

### Added
- **Git Integration** (Commit 6)
  - Complete Git operations via simple-git
  - Status, diff, add, commit, push, pull operations
  - Branch management (create, checkout, list)
  - Stash operations
  - Remote URL retrieval
  - Commit history with log

- **File System Integration** (Commit 5)
  - File read/write operations
  - Directory listing and creation
  - File search with glob patterns
  - Workspace root detection
  - File info (size, modified time, permissions)
  - Copy and move operations

- **Error Handling & Logging** (Commit 4)
  - Winston logger integration with file rotation
  - Service-specific log instances (ai, database, system)
  - React ErrorBoundary with graceful fallback
  - Comprehensive error messages in Korean and English
  - Sentry crash reporting preparation (not yet enabled)

---

## [0.3.0] - 2025-01-10

### Added
- **Persona System** (Commit 3)
  - 28 adjustable parameters for AI personality
  - 6 preset personas (Professional, Friendly, Technical, Creative, Casual, Empathetic)
  - Real-time persona switching
  - PersonaService generates dynamic system prompts
  - Persona settings UI with sliders and presets
  - Database persistence for custom personas

### Parameters
- Formality, Humor, Verbosity, Emoji Usage, Enthusiasm
- Empathy, Directness, Technicality, Creativity, Proactivity
- Language Preference, Code Language Preference
- Patience, Encouragement, Formality Honorifics
- Reasoning Depth, Context Awareness

---

## [0.2.0] - 2025-01-09

### Added
- **KakaoTalk-Style Chat Interface** (Commit 2)
  - Message bubbles with timestamps
  - Date dividers for conversation grouping
  - Typing indicator with animated dots
  - Voice input button (UI only, functionality pending)
  - Smooth scrolling to latest messages
  - Empty state with welcoming message
  - Keyboard shortcuts (Cmd+K to focus, Esc to blur)

- **Conversation History Sidebar** (Commit 2)
  - Conversation list with search
  - Rename and delete conversations
  - Message count per conversation
  - Empty state handling
  - Loading skeletons for better UX

---

## [0.1.0] - 2025-01-08

### Added
- **Foundation** (Commit 1)
  - Electron 35 + React 18 + TypeScript 5 + Vite setup
  - Multi-process architecture (main + renderer + preload)
  - SQLite database with better-sqlite3
  - Repository pattern for data access
  - Type-safe IPC channels via contextBridge
  - Window management with system tray
  - Build configuration (Vite for renderer, esbuild for main)
  - Database migrations system

### Technical Stack
- **Frontend**: React 18, TypeScript 5, Tailwind CSS, shadcn/ui
- **Build**: Vite (renderer), esbuild (main)
- **State**: Zustand for global state management
- **Database**: better-sqlite3 with encryption support
- **IPC**: Secure contextBridge with no Node.js exposure

---

## Architecture Highlights

### Multi-Process Design
```
Main Process (Node.js)
  ├── AI Services (Llama, Whisper, LLaVA)
  ├── Database (SQLite + Repositories)
  ├── System Integration (File, Git)
  └── IPC Handlers (Type-safe)
       ↕
Preload Script (Secure Bridge)
       ↕
Renderer Process (React UI - Sandboxed)
  ├── Chat Interface
  ├── Settings & Persona
  └── Conversation History
```

### Database Schema
- **conversations**: id, title, mode, created_at, updated_at, message_count
- **messages**: id, conversation_id, role, content, timestamp, tokens, response_time, context_level, satisfaction
- **persona_settings**: 28 parameters + metadata

---

## Known Limitations

### Critical (Blocks MVP)
- ❌ Llama model not downloaded yet (~4.8GB, download in progress)
- ❌ Voice input not functional (Whisper integration pending)
- ❌ Screen capture not implemented
- ❌ Vision model not integrated (LLaVA pending)

### Non-Critical (Can ship without)
- ⚠️ RAG memory system not implemented
- ⚠️ Plugin system not built
- ⚠️ Calendar/Email integration not started
- ⚠️ AI-led mode not implemented
- ⚠️ Production build not tested

---

## Next Steps

### For MVP (4-5 hours)
1. ✅ Download Llama model (in progress - 32% complete)
2. ✅ Test end-to-end AI chat flow
3. Fix any critical bugs discovered
4. Create production build with electron-builder
5. Test installer on clean machine

### For Production (Additional 20-30 hours)
1. Integrate Whisper for voice input
2. Integrate LLaVA for screen analysis
3. Implement screen capture service (3 context levels)
4. Build RAG memory system with ChromaDB
5. Add calendar and email integrations
6. Implement plugin system
7. Comprehensive testing (unit + integration + e2e)
8. Code signing and auto-updater

---

## Performance Targets

### Current (Estimated)
- Cold start: ~3-5s
- Message send: Instant (UI)
- AI response: Pending model test
- Memory usage: ~200MB (without AI)
- Build size: ~150MB

### Target (With AI)
- Cold start: <5s
- AI response: 2-3s on M3 MAX, 3-5s on M3 Pro
- Memory usage: 12-15GB during AI operation
- Streaming: <100ms first token
- Frame rate: 60 FPS (UI)

---

## Contributors

- Claude (AI Assistant) - Architecture, Implementation, Documentation
- User - Product Vision, Requirements, Testing

---

## License

[To be determined]

---

**Note**: This is an alpha version under active development. Features and APIs may change significantly before v1.0.0 release.
