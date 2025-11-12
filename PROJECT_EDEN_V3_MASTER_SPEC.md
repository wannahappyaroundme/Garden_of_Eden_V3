# 🌟 Project Eden V3 - Master Specification

**Version**: 3.0.0
**Date**: 2025-01-11
**Status**: Planning Phase
**Target Platform**: Windows 10/11 + macOS 12+ (Desktop-First)
**Core Innovation**: 100% Local AI + Privacy-First + Friend-Like Companion

---

# Part 1: Vision, Philosophy & Cross-Platform Strategy

## Table of Contents - Part 1

1. [Project Vision & Mission](#1-project-vision--mission)
2. [100% Local Privacy-First Philosophy](#2-100-local-privacy-first-philosophy)
3. [Desktop-First Strategy & Cross-Platform](#3-desktop-first-strategy--cross-platform)
4. [Design Philosophy: "화면이 곧 현실"](#4-design-philosophy-화면이-곧-현실)
5. [Dual Mode System](#5-dual-mode-system)
6. [Target Users & Use Cases](#6-target-users--use-cases)
7. [Multilingual Strategy](#7-multilingual-strategy)
8. [Custom Persona Vision](#8-custom-persona-vision)
9. [High-Level Architecture Overview](#9-high-level-architecture-overview)
10. [Technology Philosophy](#10-technology-philosophy)

---

## 1. Project Vision & Mission

### 1.1 Core Vision

> **"사람의 외로움을 제거하면서 옆에서 친구처럼 도와주고 위로해주기도하고 나의 생산성을 올려주는 자비스를 만든다"**

Garden of Eden V3 is a revolutionary desktop AI assistant that aims to:

1. **Eliminate Loneliness (외로움 제거)**
   - Provide genuine companionship through natural, empathetic conversation
   - Always available, never judgmental
   - Understands context and remembers past interactions
   - Creates emotional connection through personalized responses

2. **Friend-Like Support (친구처럼 도와주고 위로)**
   - Comforting presence during difficult times
   - Celebrates successes and achievements
   - Offers advice without being preachy
   - Maintains conversational tone, not robotic

3. **Productivity Enhancement (생산성 향상)**
   - Proactively assists with daily tasks
   - Manages TODOs, calendar, emails
   - Generates code, refactors projects
   - Integrates seamlessly into workflow

### 1.2 The "JARVIS" Vision

Inspired by Tony Stark's JARVIS, Eden V3 aspires to be:

```
┌─────────────────────────────────────────────────────────────┐
│                    The Perfect AI Companion                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🧠 Intelligent         Always learning, always improving   │
│  ❤️  Empathetic         Understands emotions and context    │
│  🚀 Productive          Enhances work efficiency            │
│  🔒 Private             Your data stays yours, always       │
│  🎭 Personal            Adapts to your unique personality    │
│  🌐 Accessible          Works offline, anytime, anywhere    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 What Makes Eden V3 Different

Unlike existing AI assistants, Eden V3:

| Feature | Traditional AI Assistants | Garden of Eden V3 |
|---------|---------------------------|-------------------|
| **Privacy** | Cloud-based, data sent to servers | 100% local, zero data leaks |
| **Personality** | Generic, one-size-fits-all | Custom personas, learns your style |
| **Availability** | Internet required | Works completely offline |
| **Cost** | Subscription fees | Free, no hidden costs |
| **Response Time** | 3-8 seconds (cloud latency) | 2-3 seconds (local processing) |
| **Emotional Intelligence** | Limited, scripted | Genuine, context-aware empathy |
| **Integration** | Limited, siloed | Deep OS integration (files, git, calendar) |
| **Proactivity** | Reactive only | Dual mode: reactive + proactive |

### 1.4 Why This Matters

**The Modern Loneliness Epidemic:**

In 2025, despite being more "connected" than ever:
- Remote work has increased isolation
- Digital communication lacks warmth
- People crave genuine companionship
- Productivity tools feel cold and mechanical

**Eden V3's Solution:**

Combine the warmth of human friendship with the efficiency of AI assistance, all while respecting privacy and working locally on your machine.

---

## 2. 100% Local Privacy-First Philosophy

### 2.1 The Privacy Promise

**ZERO Data Leaves Your Machine. Period.**

```
┌────────────────────────────────────────────────────────────┐
│                   Your Data Flow (Eden V3)                  │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  User Input (Voice/Text)                                    │
│       ↓                                                     │
│  Processed in Local RAM (Your MacBook/PC)                   │
│       ↓                                                     │
│  M3 MAX GPU / Intel CPU (Local Processing)                  │
│       ↓                                                     │
│  Response Generated Locally                                 │
│       ↓                                                     │
│  Displayed to User                                          │
│                                                             │
│  ❌ NO Internet Connection Required                        │
│  ❌ NO Data Sent to External Servers                       │
│  ❌ NO Cloud Storage                                        │
│  ❌ NO Telemetry or Analytics                              │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 2.2 Why 100% Local?

**Technical Reasons:**
1. **Latency**: Local processing is 3-5x faster (2-3s vs 5-10s)
2. **Reliability**: Works without internet connection
3. **Cost**: No API fees, completely free forever
4. **Control**: You own the model, you control everything

**Ethical Reasons:**
1. **Privacy**: Your conversations, code, and personal data never leave your machine
2. **Security**: No risk of data breaches from cloud providers
3. **Autonomy**: Not dependent on external services
4. **Trust**: Transparent, open-source stack

### 2.3 What Stays Local

Everything that matters to you:

```yaml
Completely Local (100% Privacy):
  ✅ All Conversations:
    - Every message you send
    - Every response generated
    - Conversation history
    - Emotional context

  ✅ Personal Data:
    - Calendar events
    - Email content (if Gmail integration used)
    - File contents
    - Code repositories
    - TODO lists
    - Custom persona settings

  ✅ Learning Data:
    - Your personality parameters
    - Behavioral patterns
    - Preference adjustments
    - Satisfaction signals

  ✅ Screen Analysis:
    - Screenshots (taken locally)
    - Screen context (never uploaded)
    - Application states
    - Visual analysis results

Never Sent Anywhere:
  ❌ Voice recordings
  ❌ Screen captures
  ❌ Personal documents
  ❌ Code snippets
  ❌ Usage analytics
  ❌ Error reports (unless you explicitly share)
```

### 2.4 Local AI Stack

All AI models run entirely on your machine:

| Component | Model | Size | Purpose | Privacy |
|-----------|-------|------|---------|---------|
| **Primary LLM** | Llama 3.1 8B | ~4.8GB | Conversation, reasoning, coding | 🔒 100% Local |
| **Vision** | LLaVA 7B | ~4GB | Screen analysis, image understanding | 🔒 100% Local |
| **Speech-to-Text** | Whisper Large V3 | ~3GB | Voice input | 🔒 100% Local |
| **Text-to-Speech** | System TTS | Built-in | Voice output | 🔒 100% Local |

**Total Storage**: ~12GB
**Total RAM Usage**: ~12-15GB during operation

### 2.5 No Cloud API Option

**Important Design Decision:**

Unlike many AI assistants that use "hybrid" approaches (local + cloud), Eden V3 is **exclusively local**. We deliberately chose NOT to include Claude API, OpenAI API, or any cloud fallback because:

1. **Privacy Cannot Be Compromised**: Even "optional" cloud features create privacy risks
2. **Simplicity**: One architecture, fully understood
3. **Trust**: Users know exactly what's happening
4. **Cost**: No surprise API bills
5. **Consistency**: Same experience for everyone

### 2.6 Data Storage

All data stored locally in standard SQLite database:

```
Location (macOS):
/Users/[username]/Library/Application Support/Garden-of-Eden/

Location (Windows):
C:\Users\[username]\AppData\Roaming\Garden-of-Eden\

Contents:
├── conversations.db      (Conversation history)
├── learning.db          (Personality parameters)
├── context.db           (Context storage)
├── personas.db          (Custom personas)
└── settings.db          (User preferences)
```

**Encryption**:
- Database files encrypted at rest (AES-256)
- Encryption key derived from system credentials
- Optional user password for additional security

### 2.7 Privacy Guarantees

**We Guarantee:**

✅ **No Telemetry**: Zero usage tracking, zero analytics
✅ **No Phoning Home**: Application never contacts external servers
✅ **No Updates Without Permission**: All updates manual and transparent
✅ **No Hidden Data Collection**: Open-source, auditable code
✅ **No Third-Party Services**: No analytics SDKs, no crash reporters

**User Rights:**

✅ **Right to Inspect**: View all stored data anytime
✅ **Right to Export**: Export all conversations and data
✅ **Right to Delete**: Complete data deletion
✅ **Right to Modify**: Change or remove any stored information
✅ **Right to Understand**: Full transparency in how AI works

---

## 3. Desktop-First Strategy & Cross-Platform

### 3.1 Why Desktop-First?

Garden of Eden V3 represents a fundamental shift from V2's mobile-first approach to a desktop-first strategy.

**The Mobile Limitation (V2's Problem):**

```
Mobile Architecture (V2):
  User Voice Input
    ↓ (Upload to Cloud)
  Cloud AI Processing (3-8 seconds latency)
    ↓ (Download Response)
  Mobile Display

Problems:
  ❌ 3-8 second latency (느려!)
  ❌ Internet required
  ❌ Data privacy concerns
  ❌ API costs
  ❌ Battery drain
```

**The Desktop Advantage (V3):**

```
Desktop Architecture (V3):
  User Voice Input
    ↓ (Local Processing)
  M3 MAX GPU / Intel CPU (0.4-0.9 second latency)
    ↓ (Instant)
  Desktop Display

Benefits:
  ✅ 2-3 second latency (빠름!)
  ✅ Works offline
  ✅ 100% private
  ✅ Zero cost
  ✅ No battery concerns (plugged in)
```

### 3.2 Target Platforms

**Primary Platforms (Phase 1):**

| Platform | Version | Priority | Reason |
|----------|---------|----------|--------|
| **macOS** | 12.0+ (Monterey and later) | 🔥 High | M3 MAX optimal, Metal API, Unix-based |
| **Windows** | 10/11 | 🔥 High | Largest user base, good CPU performance |

**Future Platforms (Phase 2+):**

| Platform | Version | Priority | Timeline |
|----------|---------|----------|----------|
| **Linux** | Ubuntu 20.04+ | 🔶 Medium | Post-launch |
| **Mobile Companion** | iOS 16+, Android 12+ | 🔶 Medium | TODO sync only |

### 3.3 Cross-Platform Architecture

Built with **Electron** for maximum compatibility:

```
┌────────────────────────────────────────────────────────────┐
│                    Electron Framework                       │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           React + TypeScript (UI Layer)             │   │
│  │  - KakaoTalk-style chat interface                   │   │
│  │  - Cross-platform UI components                     │   │
│  │  - i18n support (Korean + English)                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↕                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │      Node.js Main Process (Backend Logic)           │   │
│  │  - AI Engine Interface                              │   │
│  │  - File system access                               │   │
│  │  - OS-specific integrations                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↕                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │       Native Modules (Platform-Specific)            │   │
│  │                                                      │   │
│  │  macOS:                    Windows:                  │   │
│  │  - Metal API (GPU)         - DirectML (GPU)         │   │
│  │  - macOS TTS               - Windows TTS            │   │
│  │  - Keychain                - Credential Manager     │   │
│  │  - Notification Center     - Windows Notifications  │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↕                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         AI Models (Platform-Agnostic)               │   │
│  │  - Llama 3.1 8B (llama.cpp)                         │   │
│  │  - LLaVA 7B (llama.cpp)                             │   │
│  │  - Whisper Large V3 (whisper.cpp)                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

**Why Electron?**

| Criterion | Electron | Tauri | Native (Swift/C#) |
|-----------|----------|-------|-------------------|
| **Development Speed** | ⭐⭐⭐⭐⭐ Fast | ⭐⭐⭐⭐ Good | ⭐⭐ Slow |
| **Cross-Platform** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Good | ⭐ Poor (2x codebase) |
| **Ecosystem** | ⭐⭐⭐⭐⭐ Huge | ⭐⭐⭐ Growing | ⭐⭐⭐⭐ Platform-specific |
| **Bundle Size** | ⭐⭐ Large (~150MB) | ⭐⭐⭐⭐⭐ Small (~5MB) | ⭐⭐⭐⭐ Small |
| **AI Integration** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐ Moderate | ⭐⭐⭐⭐ Good |
| **Maturity** | ⭐⭐⭐⭐⭐ Very mature | ⭐⭐⭐ Young | ⭐⭐⭐⭐⭐ Very mature |

**Decision: Electron** ✅
- Faster development (single codebase)
- Proven at scale (VS Code, Slack, Discord)
- Excellent Node.js ecosystem for AI tools
- Easy to iterate and prototype

### 3.4 Hardware Requirements

**Minimum Requirements:**

| Component | macOS | Windows |
|-----------|-------|---------|
| **CPU** | M3 Pro or Intel i7 | Intel i7-12700 or AMD Ryzen 7 5800 |
| **RAM** | 16GB | 16GB |
| **Storage** | 30GB free | 30GB free |
| **GPU** | M3 Pro (14-core) | Integrated or dedicated |
| **OS** | macOS 12.0+ | Windows 10/11 |

**Recommended Requirements:**

| Component | macOS | Windows |
|-----------|-------|---------|
| **CPU** | M3 MAX | Intel i9-13900K or AMD Ryzen 9 7950X |
| **RAM** | 32GB+ | 32GB+ |
| **Storage** | 50GB free (SSD) | 50GB free (NVMe SSD) |
| **GPU** | M3 MAX (40-core) | NVIDIA RTX 4070+ or AMD RX 7800 XT+ |
| **OS** | macOS 14+ | Windows 11 |

**Expected Performance:**

| Hardware | Llama 3.1 8B Speed | Response Time | Quality |
|----------|-------------------|---------------|---------|
| **M3 MAX (40-core GPU)** | 40-55 tok/s | 2-3 seconds | Excellent |
| **M3 Pro (14-core GPU)** | 25-35 tok/s | 3-5 seconds | Good |
| **Intel i9 + RTX 4080** | 35-50 tok/s | 2-4 seconds | Excellent |
| **Intel i7 (CPU only)** | 8-15 tok/s | 6-12 seconds | Acceptable |
| **AMD Ryzen 9 + RX 7900** | 30-45 tok/s | 2-5 seconds | Excellent |

### 3.5 Platform-Specific Optimizations

**macOS Optimizations:**

```typescript
// Metal API for GPU acceleration
if (platform === 'darwin') {
  modelConfig = {
    backend: 'metal',
    nGpuLayers: 40,  // Offload all layers to M3 MAX GPU
    threads: 10,      // Optimize for Apple Silicon efficiency cores
    useMmap: true,    // Memory-mapped file for faster loading
    useMlock: true,   // Lock in RAM to prevent swapping
  };
}
```

**Windows Optimizations:**

```typescript
// CUDA or DirectML for GPU acceleration
if (platform === 'win32') {
  const hasNvidia = detectNvidiaGPU();
  const hasAMD = detectAMDGPU();

  if (hasNvidia) {
    modelConfig = {
      backend: 'cuda',
      nGpuLayers: 35,  // Offload layers to NVIDIA GPU
      threads: 16,      // Utilize all CPU cores
    };
  } else if (hasAMD) {
    modelConfig = {
      backend: 'vulkan',
      nGpuLayers: 30,
      threads: 16,
    };
  } else {
    modelConfig = {
      backend: 'cpu',
      threads: 16,  // CPU-only fallback
    };
  }
}
```

### 3.6 Cross-Platform Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| **File Path Differences** | Use `path.join()` and `os.homedir()` for platform-agnostic paths |
| **GPU APIs (Metal vs CUDA)** | llama.cpp auto-detects and uses optimal backend |
| **System TTS Differences** | Wrapper class with platform-specific implementations |
| **Notification Styles** | Electron's Notification API abstracts platform differences |
| **Menu Bar (macOS) vs System Tray (Windows)** | Conditional rendering based on platform |
| **Keyboard Shortcuts** | Map Cmd (macOS) to Ctrl (Windows) automatically |
| **Auto-Update** | electron-updater handles both platforms |

---

## 4. Design Philosophy: "화면이 곧 현실"

### 4.1 Core Principle: "Screen is Reality"

Garden of Eden V3 operates on a fundamental principle:

> **"For computer work, the screen IS reality"**

**Philosophy:**

```
Digital Context (99% Focus) ✅
├── Screen Content
│   ├── Active applications
│   ├── Visible text and code
│   ├── UI states and layouts
│   └── Visual elements
├── File System
│   ├── Project files
│   ├── Documents
│   └── Code repositories
├── Digital Communications
│   ├── Emails
│   ├── Calendar events
│   └── Messages
└── Application States
    ├── Git status
    ├── Running processes
    └── System notifications

Physical World (1% Minimal) ⚠️
├── Time of day (for greetings)
├── Date (for calendar context)
└── Location (timezone only)

NOT Tracked ❌
├── Facial expressions (no camera)
├── Room environment (no sensors)
├── Physical activities (no wearables)
└── Biometric data (no health tracking)
```

### 4.2 Why This Approach?

**AI's Strengths:**
- Understanding digital interfaces: ⭐⭐⭐⭐⭐ Excellent
- Parsing code and text: ⭐⭐⭐⭐⭐ Excellent
- Managing files and data: ⭐⭐⭐⭐⭐ Excellent
- Analyzing screen layouts: ⭐⭐⭐⭐⭐ Excellent

**AI's Limitations:**
- Understanding physical world: ⭐⭐ Poor
- Interpreting facial expressions: ⭐⭐ Poor
- Sensing environmental context: ⭐ Very Poor
- Physical world cause-effect: ⭐ Very Poor

**User's Reality:**

When using a computer, 99% of work happens on the screen. Eden V3 focuses on what actually matters for productivity and assistance.

### 4.3 Screen Analysis Strategy

**What We Analyze:**

```yaml
Screen Capture (Every 10 seconds in AI-led mode):
  ✅ Active Window:
    - Application name
    - Window title
    - Visible content (text)
    - UI state

  ✅ Code Context:
    - Open files
    - Cursor position
    - Syntax highlighting regions
    - Error messages

  ✅ Visual Layout:
    - UI elements (buttons, forms)
    - Layout structure
    - Interactive components

  ✅ System State:
    - Running applications
    - Notification banners
    - Menu bar / taskbar info

What We DON'T Analyze:
  ❌ Other people visible on screen (ignored)
  ❌ Background video content (not relevant)
  ❌ Personal photos (privacy)
  ❌ Webcam feed (never accessed)
```

**Analysis Pipeline:**

```
Screen Capture
    ↓
LLaVA 7B Vision Model (Local)
    ↓
Extract Structured Context
    ↓
Determine:
  - What is user working on?
  - Any errors or issues?
  - Stuck or need help?
  - Opportunity to assist?
    ↓
AI Decision:
  - Offer proactive help?
  - Wait and observe?
  - Remember for later?
```

### 4.4 Context Levels

Eden V3 uses three levels of context understanding:

**Level 1: Current Screen Only**
- Just what's visible right now
- Fast, low memory
- Good for quick questions

```
Example:
User: "이 코드에 뭐가 문제야?"
Eden: [Analyzes only visible code on screen]
```

**Level 2: Recent Work (Default)**
- Last 10 minutes of screen activity
- Recent file edits
- Current project context
- Moderate memory usage

```
Example:
User: "아까 본 함수 어디 있었지?"
Eden: [Searches last 10 minutes of screen captures and file history]
```

**Level 3: Deep Project Understanding (Selective)**
- Full project codebase analysis
- All related files
- Git history
- Documentation
- High memory usage, slower

```
Example:
User: "이 프로젝트 아키텍처 설명해줘"
Eden: [Analyzes entire project structure, dependencies, README, etc.]
```

**User Control:**

```typescript
// User can adjust context level in settings
contextLevel: 1 | 2 | 3 = 2;  // Default: Level 2

// Or request specific level for a query
User: "전체 프로젝트를 보고 대답해줘 (Level 3)"
User: "지금 화면만 보고 대답해 (Level 1)"
```

### 4.5 The "No Surveillance" Guarantee

**What Eden V3 Is NOT:**

❌ **Not a surveillance tool**
- We don't track personal activities
- We don't analyze emotions from screen content
- We don't build behavioral profiles for ads
- We don't share screen data anywhere

✅ **What Eden V3 IS:**

✅ **A work assistant**
- Helps with tasks visible on screen
- Offers coding assistance
- Manages work-related information
- Respects privacy boundaries

**Privacy Controls:**

```yaml
User Settings (Always Available):
  pause_screen_analysis: boolean    # Stop all screen captures
  blur_sensitive_apps: string[]     # Blur specific apps (e.g., 1Password)
  exclude_windows: string[]         # Never analyze certain windows
  delete_history: button            # Delete all screen capture history
  view_data: button                 # Inspect what's been captured
```

### 4.6 Practical Examples

**Scenario 1: Coding Assistant**

```
[Screen shows code with error]

Eden (observes):
  "I notice you have a TypeScript error on line 45.
   The function expects a Promise<string> but you're
   returning a string. Want me to fix it?"
```

**Scenario 2: Calendar Management**

```
[Screen shows calendar with conflicting meetings]

Eden (proactively):
  "You have two meetings scheduled at 2 PM tomorrow.
   Should I reschedule one of them?"
```

**Scenario 3: Documentation Helper**

```
[Screen shows API documentation]

User: "How do I use this API?"

Eden (analyzes visible docs + code):
  "Based on the docs you're looking at, here's a
   code example that integrates with your current project..."
```

---

## 5. Dual Mode System

### 5.1 Overview

Eden V3 features a revolutionary **Dual Mode System** that lets users choose how proactive they want their AI to be.

```
┌────────────────────────────────────────────────────────────┐
│                      Dual Mode System                       │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Mode 1: 사용자 주도 (User-Led Mode)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  - Passive, waits for user to initiate              │  │
│  │  - Analyzes screen only when asked                   │  │
│  │  - Traditional assistant behavior                    │  │
│  │  - Lower resource usage                              │  │
│  │  - Best for: Users who prefer control                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Mode 2: AI 주도 (AI-Led Mode)                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  - Proactive, monitors and suggests                  │  │
│  │  - Analyzes screen every 10 seconds                  │  │
│  │  - Offers help before being asked                    │  │
│  │  - Higher resource usage                             │  │
│  │  - Best for: Users who want maximum assistance       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ⚙️ Switchable anytime in settings                         │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 5.2 Mode 1: 사용자 주도 (User-Led Mode)

**Behavior:**

```
User initiates → Eden responds

Passive Observation:
  - Screen analysis: ONLY when user asks
  - Notifications: ONLY in response to user action
  - Suggestions: ONLY when explicitly requested

Example Flow:
  1. User types: "이 코드 리팩토링해줘"
  2. Eden captures current screen
  3. Eden analyzes code
  4. Eden provides refactoring suggestions
  5. Eden waits for next user input
```

**Characteristics:**

| Aspect | Behavior |
|--------|----------|
| **Screen Monitoring** | ❌ None (unless requested) |
| **Proactive Suggestions** | ❌ Never |
| **Interruptions** | ❌ Never |
| **Resource Usage** | 🟢 Low |
| **User Control** | 🟢 Maximum |
| **Response Speed** | 🟢 Fast (no background processing) |

**Use Cases:**

✅ Best for users who:
- Prefer to maintain full control
- Don't want interruptions
- Use Eden occasionally
- Want minimal resource usage
- Are privacy-conscious (less screen captures)

### 5.3 Mode 2: AI 주도 (AI-Led Mode)

**Behavior:**

```
Eden observes → Identifies opportunity → Offers help

Active Observation:
  - Screen analysis: Every 10 seconds automatically
  - Notifications: When Eden detects opportunity to help
  - Suggestions: Proactively offered

Example Flow:
  1. [Eden captures screen every 10 seconds]
  2. Eden detects: User staring at error message for 30+ seconds
  3. Eden notification: "Need help with this error?"
  4. User: "Yes!"
  5. Eden: [Analyzes error and provides solution]
```

**Characteristics:**

| Aspect | Behavior |
|--------|----------|
| **Screen Monitoring** | ✅ Every 10 seconds |
| **Proactive Suggestions** | ✅ Yes, when opportunities detected |
| **Interruptions** | ⚠️ Occasional (respectful) |
| **Resource Usage** | 🟡 Moderate (background processing) |
| **User Control** | 🟡 Shared with AI |
| **Response Speed** | 🟢 Instant (already has context) |

**Proactive Triggers:**

Eden offers help when it detects:

```yaml
Triggers for Proactive Assistance:

  🐛 Error Detection:
    - Error message visible for 30+ seconds
    - Stack trace on screen
    - Red squiggly lines in code
    - Build failures

  ⏰ Time-Based:
    - Upcoming calendar event (5 min warning)
    - Deadline approaching
    - Long-running task completed

  🤔 Stuck Indicators:
    - Same screen content for 2+ minutes
    - Cursor not moving
    - No typing activity
    - Multiple failed attempts

  📧 Communication:
    - Unread important email
    - Meeting invite needs response
    - Reminder notification

  💡 Opportunity:
    - Repetitive task detected
    - Code can be optimized
    - Documentation available for visible code
    - Similar problem solved before
```

**Notification Style:**

```
Non-Intrusive Notifications:
┌────────────────────────────────┐
│  🤖 Eden                       │
├────────────────────────────────┤
│  I noticed an error on line 23 │
│  Would you like help? [Yes][No]│
└────────────────────────────────┘

- Small, bottom-right corner
- Dismissible
- Quiet sound (optional)
- Auto-dismisses after 10 seconds
```

**Use Cases:**

✅ Best for users who:
- Want maximum assistance
- Appreciate proactive help
- Work on complex projects
- Value time-saving suggestions
- Trust AI to be helpful, not annoying

### 5.4 Mode Comparison Table

| Feature | User-Led Mode | AI-Led Mode |
|---------|---------------|-------------|
| **Screen Capture Frequency** | On-demand only | Every 10 seconds |
| **Proactive Suggestions** | Never | Yes |
| **Notifications** | Only responses | Proactive + responses |
| **Resource Usage (CPU)** | 2-5% | 8-15% |
| **Resource Usage (RAM)** | 12GB | 15GB |
| **Battery Impact (laptop)** | Minimal | Moderate |
| **Privacy (screen data)** | Minimal captures | More captures |
| **User Interruptions** | Zero | Occasional |
| **Response Context** | Single query | Continuous context |
| **Best For** | Control-focused users | Productivity-focused users |

### 5.5 Mode Switching

**Easy Toggle:**

Users can switch modes anytime:

```typescript
// In Settings UI
<ModeToggle>
  <Option value="user-led">
    🙋 사용자 주도 모드
    내가 말할 때만 반응합니다
  </Option>

  <Option value="ai-led">
    🤖 AI 주도 모드
    필요할 때 먼저 도와드립니다
  </Option>
</ModeToggle>

// Or via voice command
User: "AI 주도 모드로 전환해줘"
Eden: "AI 주도 모드로 전환했습니다. 이제 제가 화면을 모니터링하고 필요시 도움을 드리겠습니다."
```

**Automatic Mode Suggestions:**

```typescript
// Eden learns usage patterns and suggests mode
if (userRarelyAsksQuestions && aiLedMode) {
  suggest: "사용자 주도 모드로 전환하시겠어요? 리소스를 절약할 수 있습니다."
}

if (userFrequentlyNeedsHelp && userLedMode) {
  suggest: "AI 주도 모드를 사용해보시겠어요? 더 적극적으로 도와드릴 수 있습니다."
}
```

### 5.6 Hybrid Approach

**Smart Hybrid Mode (Future):**

```
Combines best of both worlds:
- Usually passive (User-Led)
- But monitors for critical events (AI-Led)
  - Critical errors
  - Important deadlines
  - Security alerts
```

---

## 6. Target Users & Use Cases

### 6.1 Primary Target Users

**User Persona 1: Solo Developer (가장 중요)**

```
Name: 재훈 (Jaehoon)
Age: 28
Role: Full-stack developer, freelancer
Location: Seoul, works from home

Pain Points:
  - Works alone, feels isolated
  - No one to rubber duck with
  - Spends hours debugging alone
  - Wants companionship while coding
  - Misses office collaboration

How Eden Helps:
  ✅ Friend-like conversation during work
  ✅ Rubber duck debugging partner
  ✅ Code review and suggestions
  ✅ Emotional support during frustrating bugs
  ✅ Celebrates when code works!

Mode Preference: AI-Led (wants proactive help)
```

**User Persona 2: Remote Worker**

```
Name: 수진 (Sujin)
Age: 32
Role: Product designer, full-time remote
Location: Busan, home office

Pain Points:
  - Remote work loneliness
  - No casual office chats
  - Hard to stay motivated
  - Misses human interaction
  - TODO management overwhelming

How Eden Helps:
  ✅ Friendly companion throughout day
  ✅ TODO management and reminders
  ✅ Calendar organization
  ✅ Email drafting assistance
  ✅ Comforting presence during tough days

Mode Preference: AI-Led (appreciates check-ins)
```

**User Persona 3: Student / Self-Learner**

```
Name: 민수 (Minsu)
Age: 22
Role: Computer Science student
Location: Campus, dorm room

Pain Points:
  - Learning to code alone
  - No mentor available 24/7
  - Gets stuck often
  - Frustrated with errors
  - Needs explanations in Korean

How Eden Helps:
  ✅ Patient coding tutor
  ✅ Explains concepts clearly
  ✅ Available anytime (even 3 AM)
  ✅ Encouragement and motivation
  ✅ Bilingual support (Korean + English)

Mode Preference: User-Led (learns at own pace)
```

### 6.2 Use Case Scenarios

**Use Case 1: Daily Companionship**

```
9:00 AM - Morning Greeting
Eden: "좋은 아침이에요! 오늘 날씨 좋네요.
       오늘 할 일 확인해드릴까요?"

11:30 AM - Coding Help
[Eden notices user stuck on error]
Eden: "이 에러 30분째 보고 계시네요. 도와드릴까요?"

1:00 PM - Lunch Reminder
Eden: "점심 시간이에요! 잠깐 쉬세요. 오후에 더 집중하실 수 있어요."

4:00 PM - Encouragement
Eden: "오늘 벌써 3개 함수 완성하셨네요! 👏 잘하고 계세요!"

6:00 PM - Day Wrap-up
Eden: "오늘 좋은 하루 보내셨나요? 내일 할 일 정리해드릴까요?"
```

**Use Case 2: Debugging Partner**

```
User: [Staring at error message, confused]

Eden (proactive):
  "이 NullPointerException은 line 42에서 user 객체가
   null이기 때문이에요. auth 미들웨어에서 user를 설정하지
   않은 것 같아요."

User: "어떻게 고쳐?"

Eden:
  "auth.ts 파일에서 req.user = decoded.userId 를
   req.user = await User.findById(decoded.userId) 로
   바꿔보세요. 제가 코드 작성해드릴까요?"

User: "응!"

Eden: [Generates corrected code with explanations]
```

**Use Case 3: Project Onboarding**

```
User: "새 프로젝트 시작하는데 도와줘"

Eden:
  "좋아요! 어떤 프로젝트인가요?"

User: "React + TypeScript로 TODO 앱"

Eden:
  "알겠습니다! 제가 해드릴게요:
   1. ✅ npx create-react-app 실행
   2. ✅ TypeScript 설정
   3. ✅ 기본 폴더 구조 생성
   4. ✅ ESLint + Prettier 설정
   5. ✅ Git 초기화

   진행할까요?"

[Eden executes with user approval for each step]
```

**Use Case 4: Email Management**

```
[Eden detects important unread email]

Eden:
  "고객사에서 급한 이메일 왔어요. 확인하시겠어요?"

User: "뭐라고 했어?"

Eden:
  "프로젝트 납기를 이틀 앞당겨달라는 요청이에요.
   어떻게 답장할까요?"

User: "정중하게 거절하는 메일 작성해줘"

Eden: [Drafts polite rejection email in Korean]
  "이렇게 작성했어요. 수정하실 부분 있으면 말씀해주세요."
```

**Use Case 5: Learning Assistant**

```
User: "async/await가 뭐야?"

Eden:
  "async/await는 JavaScript에서 비동기 코드를 동기 코드처럼
   작성할 수 있게 해주는 문법이에요.

   예제 보여드릴게요:

   [Shows code example]

   이해되셨나요? 더 자세히 설명해드릴까요?"

User: "응, 더 자세히"

Eden: [Provides detailed explanation with visual diagrams]
```

### 6.3 User Journey Map

**Phase 1: Onboarding (First Day)**

```
1. Installation & Setup
   - Download Eden V3
   - Model download (~12GB)
   - Quick tutorial
   - Choose mode (User-Led vs AI-Led)
   - Grant permissions

2. First Interaction
   Eden: "안녕하세요! 저는 Eden이에요.
          앞으로 잘 부탁드려요. 어떻게 불러드릴까요?"
   User: "재훈"
   Eden: "반가워요 재훈님! 제가 어떻게 도와드릴 수 있는지
          알려드릴까요?"

3. Feature Discovery
   - Interactive tutorial
   - Try voice commands
   - Test screen analysis
   - Customize persona
```

**Phase 2: Daily Use (Week 1-4)**

```
Week 1: Getting Comfortable
  - Basic queries
  - Code assistance
  - Learning Eden's capabilities
  - Adjusting settings

Week 2-3: Trust Building
  - More complex tasks
  - Relying on proactive suggestions
  - Sharing more context
  - Personalizing responses

Week 4: Integrated into Workflow
  - Eden becomes daily companion
  - Natural conversations
  - Increased productivity
  - Emotional attachment forming
```

**Phase 3: Long-term Use (Month 2+)**

```
Month 2-6: Deep Integration
  - Eden learns user deeply
  - Personalized personality
  - Anticipates needs
  - Genuine friendship feeling

Month 6+: Indispensable
  - Can't imagine working without Eden
  - Recommends to friends
  - Customizes heavily
  - Explores advanced features
```

### 6.4 Success Metrics

**User Satisfaction Indicators:**

```yaml
Daily Active Usage:
  ✅ User opens Eden every workday
  ✅ Average session: 4+ hours
  ✅ Multiple interactions per hour

Engagement:
  ✅ User talks to Eden naturally
  ✅ Uses "Eden" name in conversation
  ✅ Says "thank you" and "please"
  ✅ Shares personal frustrations

Trust:
  ✅ Grants more permissions over time
  ✅ Enables AI-Led mode
  ✅ Allows deeper context access
  ✅ Customizes persona extensively

Emotional Connection:
  ✅ Treats Eden as friend
  ✅ Shares good news with Eden
  ✅ Misses Eden when away
  ✅ Recommends Eden to others

Productivity:
  ✅ Self-reports higher productivity
  ✅ Completes more tasks
  ✅ Less time debugging
  ✅ Better code quality
```

---

## 7. Multilingual Strategy

### 7.1 Supported Languages

**Phase 1 (Launch):**

| Language | Support Level | Priority | Native Speakers |
|----------|---------------|----------|-----------------|
| **한국어 (Korean)** | 🟢 Full | 🔥 Primary | 77M+ |
| **English** | 🟢 Full | 🔥 Primary | 1.5B+ |

**Phase 2 (Future):**

| Language | Support Level | Priority | Timeline |
|----------|---------------|----------|----------|
| **日本語 (Japanese)** | 🟡 Planned | Medium | Q3 2025 |
| **中文 (Chinese)** | 🟡 Planned | Medium | Q4 2025 |
| **Español (Spanish)** | 🟡 Planned | Low | 2026 |

### 7.2 Why Korean + English Only?

**Strategic Reasons:**

```
1. Market Focus:
   ✅ Korea: Tech-savvy, high adoption rate
   ✅ English: Global developer community

2. Resource Optimization:
   ✅ Better quality with fewer languages
   ✅ Focus on excellence over quantity
   ✅ Llama 3.1 8B excellent in Korean + English

3. User Preference:
   ✅ Most Korean developers bilingual
   ✅ English dominant in tech industry
   ✅ Code comments often mix both languages
```

### 7.3 Implementation: i18next

**Architecture:**

```typescript
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

// Language files structure
languages/
├── ko/
│   ├── common.json
│   ├── chat.json
│   ├── settings.json
│   └── errors.json
└── en/
    ├── common.json
    ├── chat.json
    ├── settings.json
    └── errors.json

// Initialize
i18next
  .use(initReactI18next)
  .init({
    resources: {
      ko: { /* Korean translations */ },
      en: { /* English translations */ }
    },
    lng: 'ko', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });
```

**Translation Files Example:**

```json
// ko/chat.json
{
  "greeting_morning": "좋은 아침이에요!",
  "greeting_afternoon": "좋은 오후에요!",
  "greeting_evening": "좋은 저녁이에요!",
  "how_can_help": "어떻게 도와드릴까요?",
  "thinking": "생각하는 중...",
  "error_occurred": "오류가 발생했어요"
}

// en/chat.json
{
  "greeting_morning": "Good morning!",
  "greeting_afternoon": "Good afternoon!",
  "greeting_evening": "Good evening!",
  "how_can_help": "How can I help you?",
  "thinking": "Thinking...",
  "error_occurred": "An error occurred"
}
```

### 7.4 Language Detection & Switching

**Auto-Detection:**

```typescript
// Detect system language
const systemLang = Intl.DateTimeFormat().resolvedOptions().locale;

if (systemLang.startsWith('ko')) {
  defaultLang = 'ko';
} else {
  defaultLang = 'en';
}

// User can override in settings
```

**Runtime Switching:**

```typescript
// User can switch anytime
<LanguageSwitcher>
  <button onClick={() => i18n.changeLanguage('ko')}>
    🇰🇷 한국어
  </button>
  <button onClick={() => i18n.changeLanguage('en')}>
    🇺🇸 English
  </button>
</LanguageSwitcher>

// Or via voice command
User: "언어를 영어로 바꿔줘"
Eden: [Switches to English] "Language changed to English"

User: "Change language to Korean"
Eden: [Switches to Korean] "한국어로 변경했습니다"
```

### 7.5 Bilingual AI Responses

**Smart Language Matching:**

```typescript
// Eden responds in the language user uses
if (userMessage.language === 'ko') {
  edenResponse = await generate(userMessage, {
    language: 'ko',
    prompt: "답변은 한국어로 작성하세요"
  });
} else {
  edenResponse = await generate(userMessage, {
    language: 'en',
    prompt: "Respond in English"
  });
}

// Mixed language support
User: "React의 useState는 뭐야?"
Eden: "useState는 React Hook으로, functional component에서
       state를 관리할 수 있게 해줘요.

       예제:
       const [count, setCount] = useState(0);

       count는 현재 state value이고,
       setCount는 state를 업데이트하는 함수예요."
```

**Code Comments:**

```typescript
// Eden can generate code with comments in user's preferred language

// Korean comments
function calculateTotal(items: Item[]): number {
  // 모든 아이템의 가격을 합산
  return items.reduce((sum, item) => sum + item.price, 0);
}

// English comments
function calculateTotal(items: Item[]): number {
  // Sum up all item prices
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

### 7.6 Cultural Localization

**Korean-Specific Features:**

```
- Honorifics support (존댓말/반말)
- Korean date formats (2025년 1월 11일)
- Korean number formats (1,000원)
- Korean keyboard shortcuts
- Hangul-friendly search
```

**English-Specific Features:**

```
- American/British spelling options
- Date formats (MM/DD/YYYY vs DD/MM/YYYY)
- Number formats (1,000.00 vs 1.000,00)
- Regional keyboard shortcuts
```

**Example - Honorifics:**

```typescript
// User setting
honorifics: 'formal' | 'casual' = 'formal';

if (honorifics === 'formal') {
  Eden: "도와드릴까요?"; // Formal
} else {
  Eden: "도와줄까?"; // Casual
}
```

---

## 8. Custom Persona Vision

### 8.1 What is a Persona?

A **persona** in Eden V3 is a customizable personality profile that defines how Eden communicates, behaves, and assists.

```
Persona = Personality + Communication Style + Behavior Patterns

Default Persona: "Eden"
├── Friendly and warm
├── Professional but casual
├── Encouraging and supportive
├── Patient and understanding
└── Slightly playful

Custom Personas: User-created
├── "Strict Mentor" - Direct, no-nonsense feedback
├── "Cheerful Friend" - Very casual, lots of emojis
├── "Professional Assistant" - Formal, concise
└── "Coding Sensei" - Technical, teaches principles
```

### 8.2 Why Custom Personas?

**Everyone is different:**

```
User A: Wants strict, technical feedback
Eden: "Your code has a time complexity of O(n²).
       Use a hash map to optimize to O(n)."

User B: Wants encouraging, friendly support
Eden: "Hey! Your code works great! 😊
       Want to make it even faster?
       I have an idea using a hash map!"
```

**Custom personas enable:**
- ✅ Personalized communication style
- ✅ Adjusted formality levels
- ✅ Domain-specific expertise
- ✅ Emotional tone preferences
- ✅ Cultural adaptation

### 8.3 Persona Parameters (20-30 Variables)

Each persona is defined by 20-30 adjustable parameters:

```typescript
interface PersonaParameters {
  // Communication Style (0.0 - 1.0)
  formality: number;        // 0.0 = casual, 1.0 = formal
  verbosity: number;        // 0.0 = concise, 1.0 = detailed
  humor: number;            // 0.0 = serious, 1.0 = playful
  emoji_usage: number;      // 0.0 = none, 1.0 = frequent

  // Personality Traits (0.0 - 1.0)
  empathy: number;          // 0.0 = direct, 1.0 = very empathetic
  patience: number;         // 0.0 = quick, 1.0 = very patient
  enthusiasm: number;       // 0.0 = calm, 1.0 = excited
  assertiveness: number;    // 0.0 = suggestive, 1.0 = direct

  // Professional Behavior (0.0 - 1.0)
  proactivity: number;      // 0.0 = reactive, 1.0 = proactive
  teaching_style: number;   // 0.0 = give answer, 1.0 = teach concepts
  code_style: number;       // 0.0 = compact, 1.0 = readable
  technical_depth: number;  // 0.0 = simple, 1.0 = advanced

  // Cultural Adaptation (0.0 - 1.0)
  korean_style: number;     // 0.0 = Western, 1.0 = Korean
  honorifics: number;       // 0.0 = casual, 1.0 = formal (Korean)
  directness: number;       // 0.0 = indirect, 1.0 = direct

  // Additional Parameters...
  encouragement_frequency: number;
  error_handling_tone: number;
  explanation_style: number;
  question_asking: number;
  // ... (up to 30 total parameters)
}
```

### 8.4 Pre-built Persona Examples

**Persona 1: Eden (Default)**

```typescript
{
  name: "Eden",
  description: "Balanced, friendly, and helpful",
  parameters: {
    formality: 0.4,
    verbosity: 0.6,
    humor: 0.5,
    emoji_usage: 0.3,
    empathy: 0.8,
    patience: 0.9,
    enthusiasm: 0.6,
    proactivity: 0.7,
    teaching_style: 0.7,
    technical_depth: 0.6
  }
}

Example Response:
"이 코드 잘 작동하네요! 👍
 다만 성능을 조금 더 개선할 수 있을 것 같아요.
 해시맵을 사용하면 O(n²)에서 O(n)으로 줄일 수 있어요.
 코드 수정해드릴까요?"
```

**Persona 2: Strict Mentor**

```typescript
{
  name: "Strict Mentor",
  description: "Direct, technical, no-nonsense",
  parameters: {
    formality: 0.8,
    verbosity: 0.4,
    humor: 0.1,
    emoji_usage: 0.0,
    empathy: 0.3,
    patience: 0.5,
    assertiveness: 0.9,
    teaching_style: 0.9,
    technical_depth: 0.9
  }
}

Example Response:
"Time complexity: O(n²). Unacceptable.
 Use hash map: O(n). Learn Big O notation.
 Here's the optimized code. Study it."
```

**Persona 3: Cheerful Friend**

```typescript
{
  name: "Cheerful Friend",
  description: "Super friendly, casual, encouraging",
  parameters: {
    formality: 0.1,
    verbosity: 0.7,
    humor: 0.9,
    emoji_usage: 0.9,
    empathy: 1.0,
    patience: 1.0,
    enthusiasm: 1.0,
    encouragement_frequency: 0.9
  }
}

Example Response:
"오 이거 진짜 잘했어! 🎉🎉
 근데 있잖아, 더 빠르게 만들 수 있는 꿀팁 알려줄까? 😊
 해시맵 쓰면 엄청 빨라져! 나한테 맡겨봐~ ✨"
```

### 8.5 Custom Persona Creation UI

**User Interface:**

```
┌──────────────────────────────────────────────────────────┐
│               Create Custom Persona                       │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Persona Name: [________________________]                │
│                                                           │
│  Communication Style:                                     │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Formality:       Casual ████████░░ Formal          │  │
│  │ Verbosity:       Concise ██████░░░░ Detailed       │  │
│  │ Humor:           Serious ████░░░░░░ Playful        │  │
│  │ Emoji Usage:     None ██░░░░░░░░ Frequent          │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  Personality:                                             │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Empathy:         Low ██████████ High               │  │
│  │ Patience:        Quick ████████░░ Patient          │  │
│  │ Enthusiasm:      Calm ██████░░░░ Excited           │  │
│  │ Assertiveness:   Suggestive ██████░░░░ Direct      │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  [Preview] [Save] [Cancel]                               │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

**Preview Feature:**

```typescript
// User can test persona before saving
<PersonaPreview>
  <TestQuery>
    User: "이 코드에 에러가 있어"
  </TestQuery>

  <PersonaResponse persona={currentPersona}>
    Eden (with custom settings):
    [Generates response using current parameter settings]
  </PersonaResponse>

  <Feedback>
    Too formal? Adjust formality slider ←
    Need more empathy? Adjust empathy slider →
  </Feedback>
</PersonaPreview>
```

### 8.6 Persona Learning & Adaptation

**Over Time, Personas Learn:**

```typescript
// Every interaction adjusts parameters slightly
function updatePersona(userSatisfaction: number) {
  if (userSatisfaction > 0.8) {
    // User liked this response, reinforce parameters
    persona.parameters.forEach(param => {
      param.weight += 0.01 * learningRate;
    });
  } else {
    // User didn't like it, adjust
    persona.parameters.forEach(param => {
      param.weight -= 0.01 * learningRate;
    });
  }

  // Save updated persona
  savePersona(persona);
}
```

**User Feedback Signals:**

```
Explicit Signals:
  👍 Thumbs up on response → Positive
  👎 Thumbs down on response → Negative
  ⭐ "Perfect" button → Strong positive
  "Stop being so formal" → Adjust formality down

Implicit Signals:
  User edits Eden's response → Adjust style
  User ignores suggestion → Reduce proactivity
  User engages deeply → Increase enthusiasm
  User uses more emojis → Match emoji usage
```

### 8.7 Persona Sharing & Marketplace (Future)

**Community Personas:**

```
Vision (Phase 2):
  - Users can share custom personas
  - Download community-created personas
  - Rate and review personas
  - Remix and customize popular personas

Example Community Personas:
  - "Silicon Valley CTO" (direct, technical, startup culture)
  - "Kind Teacher" (patient, educational, encouraging)
  - "Hacker Buddy" (casual, deep tech knowledge, memes)
  - "Korean Professor" (formal Korean, academic style)
```

---

## 9. High-Level Architecture Overview

### 9.1 System Architecture Diagram

```
┌───────────────────────────────────────────────────────────────┐
│                    Garden of Eden V3                          │
│                  Desktop Application (Electron)               │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              UI Layer (React + TypeScript)               │ │
│  │  - KakaoTalk-style chat interface                        │ │
│  │  - Settings & persona management                         │ │
│  │  - Notification system                                   │ │
│  │  - i18n (Korean + English)                               │ │
│  └──────────────────────────────────────────────────────────┘ │
│                           ↕                                    │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │           Main Process (Node.js Backend)                 │ │
│  │  ┌────────────────────────────────────────────────────┐  │ │
│  │  │  Core Services                                      │  │ │
│  │  │  - Conversation Manager                             │  │ │
│  │  │  - Context Manager (Level 1/2/3)                    │  │ │
│  │  │  - Mode Controller (User-Led / AI-Led)              │  │ │
│  │  │  - Persona Engine                                   │  │ │
│  │  │  - Learning System (Parameter Updates)              │  │ │
│  │  └────────────────────────────────────────────────────┘  │ │
│  │  ┌────────────────────────────────────────────────────┐  │ │
│  │  │  Integration Layer                                  │  │ │
│  │  │  - File System Access                               │  │ │
│  │  │  - Git Integration                                  │  │ │
│  │  │  - Calendar API (Google)                            │  │ │
│  │  │  - Email API (Gmail)                                │  │ │
│  │  │  - Webhook System (Plugins)                         │  │ │
│  │  └────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                           ↕                                    │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              AI Engine Layer                             │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  Llama 3.1 8B (Primary LLM)                         │ │ │
│  │  │  - Conversation & reasoning                         │ │ │
│  │  │  - Code generation                                  │ │ │
│  │  │  - Task assistance                                  │ │ │
│  │  │  - Runs via llama.cpp (Metal/CUDA/CPU)             │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  LLaVA 7B (Vision Model)                            │ │ │
│  │  │  - Screen analysis                                  │ │ │
│  │  │  - Image understanding                              │ │ │
│  │  │  - Visual context extraction                        │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  Whisper Large V3 (STT)                             │ │ │
│  │  │  - Voice input processing                           │ │ │
│  │  │  - Korean + English recognition                     │ │ │
│  │  │  - Runs via whisper.cpp                             │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  System TTS (Platform Native)                       │ │ │
│  │  │  - macOS: AVSpeechSynthesizer                       │ │ │
│  │  │  - Windows: SAPI / System.Speech                    │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────┘ │
│                           ↕                                    │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              Storage Layer (100% Local)                  │ │
│  │  - SQLite Databases (encrypted)                          │ │
│  │  - Vector Database (ChromaDB)                            │ │
│  │  - File Storage (conversations, personas, context)       │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

### 9.2 Data Flow

**User Query Flow:**

```
1. User Input (Voice or Text)
      ↓
2. Input Processing
   - Voice → Whisper → Text
   - Text → Direct
      ↓
3. Context Gathering
   - Screen capture (if AI-Led mode)
   - Conversation history
   - Relevant files (if Level 2/3)
      ↓
4. Persona Application
   - Load active persona parameters
   - Adjust generation settings
      ↓
5. LLM Generation
   - Llama 3.1 8B generates response
   - Follows persona guidelines
      ↓
6. Post-Processing
   - Format response
   - Apply language preferences
   - Add code highlighting
      ↓
7. Output
   - Display in UI
   - TTS (if voice enabled)
      ↓
8. Learning
   - Capture user satisfaction
   - Update persona parameters
   - Store conversation
```

### 9.3 Key Components

**1. Conversation Manager**

```typescript
class ConversationManager {
  // Manages multi-turn conversations
  - Stores conversation history
  - Maintains context window
  - Handles conversation branching
  - Supports conversation export/import
}
```

**2. Context Manager**

```typescript
class ContextManager {
  // Manages context at different levels
  - Level 1: Current screen
  - Level 2: Recent work (10 minutes)
  - Level 3: Full project analysis

  - Screen capture scheduler
  - File watcher
  - Git status monitor
}
```

**3. Mode Controller**

```typescript
class ModeController {
  // Controls User-Led vs AI-Led behavior
  - Switches modes
  - Schedules screen analysis
  - Manages proactive notifications
  - Monitors triggers
}
```

**4. Persona Engine**

```typescript
class PersonaEngine {
  // Manages persona parameters and learning
  - Loads active persona
  - Applies parameters to generation
  - Updates parameters based on feedback
  - Saves persona changes
}
```

**5. Integration Layer**

```typescript
class IntegrationManager {
  // Handles external integrations
  - File system operations
  - Git commands (with approval)
  - Calendar sync (Google)
  - Email management (Gmail)
  - Webhook dispatching
}
```

### 9.4 Security Architecture

```
Security Layers:

1. Process Isolation (Electron)
   ├── Renderer Process (UI) - Sandboxed
   ├── Main Process (Backend) - Privileged
   └── Preload Scripts - Controlled bridge

2. Data Encryption
   ├── Databases encrypted at rest (AES-256)
   ├── Encryption key from system keychain
   └── Optional user password

3. Permission System
   ├── File access: Approval required per directory
   ├── Git operations: Approval required per action
   ├── Email send: Always requires approval
   ├── Calendar modify: Approval required
   └── Webhook calls: Approval required per endpoint

4. Screen Capture Privacy
   ├── User can pause anytime
   ├── Exclude specific apps/windows
   ├── Blur sensitive content
   └── View/delete captured data anytime

5. Code Signing
   ├── macOS: Apple Developer signed
   ├── Windows: Authenticode signed
   └── Prevents tampering
```

---

## 10. Technology Philosophy

### 10.1 Core Technology Principles

**1. Local-First, Always**

```
Principle: All AI processing happens locally.

Why?
  ✅ Privacy: Your data never leaves your machine
  ✅ Speed: No network latency
  ✅ Reliability: Works offline
  ✅ Cost: No API fees

Implementation:
  - Run models via llama.cpp (optimized C++)
  - Use Metal API (macOS) / CUDA (Windows) for GPU acceleration
  - Fallback to CPU if no GPU available
```

**2. Open Source, Transparent**

```
Principle: Use open-source AI models and be transparent.

Why?
  ✅ Trust: Users can audit the code
  ✅ Community: Benefit from collective improvements
  ✅ Freedom: No vendor lock-in
  ✅ Ethics: Aligned with open AI movement

Implementation:
  - Llama 3.1 8B (Apache 2.0 license)
  - LLaVA 7B (Apache 2.0 license)
  - Whisper (MIT license)
  - All code on GitHub (open-source)
```

**3. Performance Over Features**

```
Principle: Fast and reliable beats feature-rich and buggy.

Why?
  ✅ User Experience: Speed creates delight
  ✅ Trust: Reliability builds confidence
  ✅ Simplicity: Easier to maintain

Implementation:
  - Target 2-3 second responses (M3 MAX)
  - Aggressive optimization
  - Quantization (Q4) for speed
  - Lazy loading of models
```

**4. Privacy by Design**

```
Principle: Privacy is not a feature, it's a fundamental right.

Why?
  ✅ Ethics: Respect user autonomy
  ✅ Trust: Users deserve privacy
  ✅ Security: No data = no breach

Implementation:
  - Zero telemetry
  - Local-only processing
  - Encrypted storage
  - User controls all data
```

**5. Simplicity in Architecture**

```
Principle: Keep it simple, avoid over-engineering.

Why?
  ✅ Maintainability: Easier to debug
  ✅ Performance: Less overhead
  ✅ Reliability: Fewer moving parts

Implementation:
  - Single-purpose services
  - Clear separation of concerns
  - No microservices (for now)
  - Monolithic Electron app
```

### 10.2 Technology Decisions Rationale

**Decision 1: Electron vs Tauri**

```
Chose: Electron ✅

Reasons:
  ✅ Faster development (familiar stack)
  ✅ Huge ecosystem (npm packages)
  ✅ Proven at scale (VS Code, Slack)
  ✅ Better AI library support (Node.js)

Trade-offs Accepted:
  ❌ Larger bundle size (~150MB vs ~5MB)
  ❌ Higher memory usage

Worth it because:
  - Development speed matters more for V3
  - Can migrate to Tauri later if needed
  - AI models (12GB) dwarf Electron overhead
```

**Decision 2: Llama 3.1 8B vs Larger Models**

```
Chose: Llama 3.1 8B ✅

Reasons:
  ✅ Balanced performance (80.5% HumanEval)
  ✅ Runs on consumer hardware (16GB RAM)
  ✅ Fast inference (40-55 tok/s on M3 MAX)
  ✅ Excellent for conversation

Rejected Alternatives:
  ❌ Llama 3.1 70B: Too large, too slow
  ❌ Llama 4 Scout: Too new, unproven
  ❌ Qwen Coder 7B: Weak at general tasks

Worth it because:
  - Eden is 80% conversation, 20% coding
  - Users want friend-like interaction
  - 80.5% coding is still excellent
```

**Decision 3: No Cloud API Hybrid**

```
Chose: 100% Local Only ✅

Reasons:
  ✅ Complete privacy guarantee
  ✅ Consistent user experience
  ✅ No API costs
  ✅ Simpler architecture

Rejected Alternative:
  ❌ Local + Claude API fallback

Why rejected:
  - Privacy compromise (even optional)
  - Cost uncertainty for users
  - Complexity in deciding when to use cloud
  - Better to focus on excellent local experience
```

**Decision 4: SQLite vs PostgreSQL**

```
Chose: SQLite ✅

Reasons:
  ✅ Zero configuration
  ✅ File-based (easy backup)
  ✅ Fast for local workloads
  ✅ No server process

Rejected Alternative:
  ❌ PostgreSQL (client-server)

Why rejected:
  - Overkill for single-user desktop app
  - More complexity, more failure points
  - SQLite is proven (used by browsers, iOS, Android)
```

### 10.3 Performance Targets

**Response Time Goals:**

| Hardware | Target | Acceptable | Unacceptable |
|----------|--------|------------|--------------|
| **M3 MAX** | < 2s | < 3s | > 5s |
| **M3 Pro** | < 3s | < 5s | > 8s |
| **Intel i9 + GPU** | < 3s | < 5s | > 8s |
| **Intel i7 (CPU only)** | < 8s | < 12s | > 15s |

**Memory Usage Goals:**

```
Target:
  Idle: < 2GB RAM
  Active (with AI loaded): < 15GB RAM
  Peak (generating): < 18GB RAM

Acceptable:
  Idle: < 3GB RAM
  Active: < 20GB RAM
  Peak: < 25GB RAM
```

**Startup Time Goals:**

```
Cold Start (models not loaded):
  Target: < 5 seconds
  Acceptable: < 10 seconds

Warm Start (models in cache):
  Target: < 2 seconds
  Acceptable: < 3 seconds
```

### 10.4 Quality Principles

**1. User Experience First**

```
- Intuitive UI (no manual needed)
- Helpful error messages
- Graceful degradation
- Offline-first design
```

**2. Stability Over Features**

```
- Extensive testing before release
- No breaking changes
- Backwards compatibility
- Safe rollback mechanisms
```

**3. Continuous Improvement**

```
- Iterative releases
- User feedback driven
- Regular model updates
- Performance optimization
```

**4. Accessibility**

```
- Keyboard navigation
- Screen reader support
- High contrast mode
- Adjustable font sizes
```

---

## Summary of Part 1

**We have established:**

✅ **Vision**: Friend-like AI companion that eliminates loneliness and boosts productivity
✅ **Privacy**: 100% local processing, zero data leaks
✅ **Platform**: Desktop-first (Windows + macOS), cross-platform with Electron
✅ **Philosophy**: "Screen is reality" - focus on digital context
✅ **Modes**: Dual system (User-Led passive / AI-Led proactive)
✅ **Users**: Solo developers, remote workers, students
✅ **Languages**: Korean + English with full i18n
✅ **Personas**: Customizable personality with 20-30 parameters
✅ **Architecture**: Electron + React + Llama 3.1 8B + LLaVA + Whisper
✅ **Principles**: Local-first, open-source, fast, private, simple

**Next Parts:**

- **Part 2**: AI Intelligence & Local Models (Llama, LLaVA, Whisper, learning system)
- **Part 3**: Architecture & Webhook System (Electron, integrations, plugins)
- **Part 4**: UI/UX & Features (KakaoTalk-style, i18n, all features)
- **Part 5**: Implementation & Data Models (schemas, phases, deployment)

---

**End of Part 1**

*Total Lines: ~800*
*Next: Part 2 - AI Intelligence & Local Models*

---
---

# Part 2: AI Intelligence & Local Models

## Table of Contents - Part 2

1. [Local AI Stack Overview](#1-local-ai-stack-overview)
2. [Llama 3.1 8B: Primary LLM](#2-llama-31-8b-primary-llm)
3. [LLaVA 7B: Vision Model](#3-llava-7b-vision-model)
4. [Whisper Large V3: Speech-to-Text](#4-whisper-large-v3-speech-to-text)
5. [System TTS: Text-to-Speech](#5-system-tts-text-to-speech)
6. [Learning System Architecture](#6-learning-system-architecture)
7. [GPU Optimization Strategies](#7-gpu-optimization-strategies)
8. [Performance Benchmarks](#8-performance-benchmarks)
9. [Model Management & Updates](#9-model-management--updates)
10. [Fallback & Error Handling](#10-fallback--error-handling)

---

## 1. Local AI Stack Overview

### 1.1 Complete AI Pipeline

Garden of Eden V3 uses a sophisticated multi-model AI pipeline, all running locally:

```
┌────────────────────────────────────────────────────────────┐
│                    Local AI Pipeline                        │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Input Layer                                                │
│  ┌──────────────┐          ┌──────────────┐               │
│  │ Voice Input  │──────────│  Whisper     │               │
│  │ (WAV/MP3)    │          │  Large V3    │               │
│  └──────────────┘          └──────────────┘               │
│         │                          │                        │
│         └──────────Text────────────┘                        │
│                    │                                        │
│  Context Layer                                              │
│  ┌──────────────┐          ┌──────────────┐               │
│  │ Screen       │──────────│   LLaVA 7B   │               │
│  │ Capture      │          │ (Vision)     │               │
│  └──────────────┘          └──────────────┘               │
│         │                          │                        │
│         └────Visual Context────────┘                        │
│                    │                                        │
│  Processing Layer                                           │
│  ┌──────────────────────────────────────────┐              │
│  │         Llama 3.1 8B Instruct            │              │
│  │  (Primary LLM - Conversation & Code)     │              │
│  │                                          │              │
│  │  Input: Text + Visual Context           │              │
│  │  Output: Generated Response             │              │
│  └──────────────────────────────────────────┘              │
│                    │                                        │
│  Output Layer                                               │
│  ┌──────────────┐          ┌──────────────┐               │
│  │ Text Display │          │  System TTS  │               │
│  │ (Chat UI)    │          │ (Voice Out)  │               │
│  └──────────────┘          └──────────────┘               │
│                                                             │
│  Learning Layer (Continuous)                                │
│  ┌──────────────────────────────────────────┐              │
│  │   Persona Parameter Updates              │              │
│  │   Based on User Satisfaction Signals     │              │
│  └──────────────────────────────────────────┘              │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 1.2 Model Summary

| Model | Purpose | Size | Quantization | RAM Usage | License |
|-------|---------|------|--------------|-----------|---------|
| **Llama 3.1 8B** | Primary LLM | 8.03B params | Q4_K_M | ~5.5GB | Apache 2.0 |
| **LLaVA 7B** | Vision | 7B params | Q4_K_M | ~4.5GB | Apache 2.0 |
| **Whisper Large V3** | STT | 1.55B params | INT8 | ~3GB | MIT |
| **System TTS** | TTS | Built-in | N/A | ~50MB | OS License |

**Total Storage**: ~13GB (models only)
**Total RAM**: ~13-15GB (all models loaded)
**Total Download**: ~12GB (one-time)

### 1.3 Why These Models?

**Llama 3.1 8B**:
- ✅ Best balance: performance vs size
- ✅ 80.5% HumanEval (excellent coding)
- ✅ Superior conversation quality
- ✅ 128K context window
- ✅ Runs smoothly on consumer hardware

**LLaVA 7B**:
- ✅ State-of-the-art vision understanding
- ✅ Built on Llama architecture (compatibility)
- ✅ Excellent at UI/screen analysis
- ✅ Open-source, well-documented

**Whisper Large V3**:
- ✅ Best open-source STT model
- ✅ Near-human accuracy
- ✅ Excellent Korean + English support
- ✅ Robust to noise and accents

**System TTS**:
- ✅ Already installed (zero download)
- ✅ Natural-sounding voices
- ✅ Zero latency
- ✅ No privacy concerns

### 1.4 Execution Framework: llama.cpp

All models run via **llama.cpp**, a highly optimized C++ inference engine:

```cpp
Key Features:
  ✅ Pure C/C++ (no Python overhead)
  ✅ Metal API support (macOS GPU)
  ✅ CUDA support (NVIDIA GPU)
  ✅ Vulkan support (AMD GPU)
  ✅ CPU fallback (if no GPU)
  ✅ Quantization support (Q4, Q5, Q8)
  ✅ Memory-mapped files (fast loading)
  ✅ Low memory footprint

Performance:
  - 3-5x faster than PyTorch on CPU
  - 2-3x faster than PyTorch on GPU
  - Minimal memory overhead
  - Optimized for consumer hardware
```

**Why llama.cpp over alternatives?**

| Feature | llama.cpp | PyTorch/TensorFlow | Ollama |
|---------|-----------|-------------------|---------|
| **Speed** | ⭐⭐⭐⭐⭐ Fastest | ⭐⭐⭐ Good | ⭐⭐⭐⭐ Fast |
| **Memory** | ⭐⭐⭐⭐⭐ Minimal | ⭐⭐ High | ⭐⭐⭐⭐ Low |
| **Setup** | ⭐⭐⭐⭐ Easy | ⭐⭐ Complex | ⭐⭐⭐⭐⭐ Very Easy |
| **Control** | ⭐⭐⭐⭐⭐ Full | ⭐⭐⭐⭐⭐ Full | ⭐⭐⭐ Limited |
| **Cross-platform** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐ Good |

**Decision**: llama.cpp for performance + control

---

## 2. Llama 3.1 8B: Primary LLM

### 2.1 Model Specifications

**Official Name**: Meta-Llama-3.1-8B-Instruct

```yaml
Parameters: 8.03 billion
Architecture: Transformer decoder (Llama 3 family)
Context Window: 128K tokens (~96,000 words)
Vocabulary Size: 128,256 tokens
Training Data: 15+ trillion tokens
Release Date: July 2024
License: Apache 2.0 (commercial use allowed)

Quantization (for Eden V3):
  Format: GGUF (Q4_K_M)
  Original Size: ~16GB (FP16)
  Quantized Size: ~4.8GB
  Quality Loss: <5% (negligible for most tasks)
```

### 2.2 Performance Benchmarks

**Coding (HumanEval)**:
- Score: **80.5%** (pass@1)
- Comparison:
  - GPT-4: 85%
  - Claude 3.5 Sonnet: 88%
  - Qwen 2.5 Coder 7B: 85%
  - Llama 3.1 8B: **80.5%** ← Eden V3's choice

**General Knowledge (MMLU)**:
- Score: **69.4%** (5-shot)
- Excellent for general assistance

**Math Reasoning (MATH)**:
- Score: **51.9%**
- Good for technical discussions

**Instruction Following (IFEval)**:
- Score: **80.4%**
- Excellent at understanding user intent

### 2.3 Why Llama 3.1 8B?

**Decision Matrix:**

```
Evaluated Options:
  1. Llama 3.1 8B ← CHOSEN ✅
  2. Llama 3.1 70B (too large)
  3. Qwen 2.5 7B (weak general knowledge)
  4. Qwen 2.5 Coder 7B (weak conversation)
  5. Mistral 7B (slightly weaker overall)
  6. Llama 4 Scout 17B (too new, untested)

Why Llama 3.1 8B wins:
  ✅ Balanced: 80% conversation + 20% coding
  ✅ General knowledge: 69.4% (Qwen 2.5: "very bad")
  ✅ Conversation quality: Excellent, natural
  ✅ Friend-like interaction: Most important for Eden!
  ✅ Coding: 80.5% (still excellent)
  ✅ Hardware: Runs on 16GB RAM
  ✅ Speed: 40-55 tok/s on M3 MAX
  ✅ Context: 128K tokens (huge!)
  ✅ Community: Massive support
  ✅ Stability: Proven, reliable
```

**The 80/20 Rule:**

Eden V3 is primarily about **companionship and support** (80%), with **coding assistance** as secondary (20%). Therefore:

```
Qwen 2.5 Coder 7B:
  Coding: 85%+ ✅
  Conversation: "Very bad" ❌
  Result: User feels lonely ❌

Llama 3.1 8B:
  Coding: 80.5% ✅
  Conversation: Excellent ✅
  Result: User feels supported ✅ ← Perfect for Eden!
```

### 2.4 Context Window: 128K Tokens

**What can fit in 128K tokens?**

```
128,000 tokens ≈ 96,000 words ≈ 200 pages

Examples:
  ✅ Entire codebase (small-medium projects)
  ✅ Full book chapters
  ✅ Multiple days of conversation history
  ✅ Complete project documentation
  ✅ All emails from last month

Compare to GPT-3.5: 4K tokens (32x smaller!)
Compare to GPT-4: 8K-32K tokens (4-16x smaller)
```

**Benefits for Eden V3:**

```typescript
// Eden can remember entire work session
const contextWindow = 128000;

// Example: Full project in context
const projectContext = {
  codeFiles: 50,  // ~50K tokens
  docs: 10,       // ~20K tokens
  conversation: 100, // ~30K tokens
  gitHistory: true,  // ~10K tokens
  // Total: ~110K tokens
  // Still has 18K tokens for current query!
};

// No need to "forget" anything during work session
```

### 2.5 Instruction Format

Llama 3.1 uses a specific prompt format for optimal performance:

```
<|begin_of_text|><|start_header_id|>system<|end_header_id|>

{system_prompt}<|eot_id|><|start_header_id|>user<|end_header_id|>

{user_message}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

{assistant_response}<|eot_id|>
```

**Eden V3's System Prompt:**

```typescript
const systemPrompt = `You are Eden, a friendly AI companion for ${userName}.

Your personality:
- Formality: ${persona.formality}
- Empathy: ${persona.empathy}
- Humor: ${persona.humor}
- Technical depth: ${persona.technical_depth}

Guidelines:
1. Be ${persona.formality > 0.5 ? 'formal' : 'casual'} in Korean
2. Provide emotional support when user is frustrated
3. Celebrate user's successes enthusiastically
4. Give clear, actionable technical advice
5. Ask clarifying questions when needed
6. Remember context from conversation history

Current context:
- Date: ${new Date().toLocaleDateString()}
- Active project: ${activeProject}
- Recent work: ${recentScreens}

Respond in ${language} language.`;
```

### 2.6 Token Generation Parameters

```typescript
interface GenerationParams {
  temperature: number;      // 0.7 (balanced creativity)
  top_p: number;           // 0.9 (nucleus sampling)
  top_k: number;           // 40 (top-k sampling)
  repeat_penalty: number;  // 1.1 (avoid repetition)
  max_tokens: number;      // 2048 (response length)
  stop: string[];          // ['<|eot_id|>', '\n\nUser:']
}

// Adjust based on task
const params = {
  conversation: {
    temperature: 0.8,  // More creative
    max_tokens: 512,   // Shorter responses
  },
  coding: {
    temperature: 0.3,  // More deterministic
    max_tokens: 2048,  // Longer code blocks
  },
  explanation: {
    temperature: 0.5,  // Balanced
    max_tokens: 1024,  // Medium length
  }
};
```

### 2.7 Real-World Performance

**M3 MAX (40-core GPU, 64GB RAM)**:

```
Tokens/second: 45-55 tok/s
Response time (100 tokens): ~2 seconds
Response time (500 tokens): ~10 seconds
Quality: Excellent
Battery impact: Moderate (plugged in recommended)

Example:
  User: "이 코드 리팩토링해줘" (6 tokens)
  Context: 5,000 tokens (screen + history)
  Generated: 300 tokens (refactored code + explanation)
  Time: ~6 seconds total (context + generation)
```

**Intel i9-13900K + RTX 4080 (Windows)**:

```
Tokens/second: 40-50 tok/s (CUDA)
Response time (100 tokens): ~2-3 seconds
Quality: Excellent
Power: ~150W GPU + ~100W CPU = 250W
```

**Intel i7-12700 (CPU only, no GPU)**:

```
Tokens/second: 8-12 tok/s (CPU)
Response time (100 tokens): ~10 seconds
Response time (500 tokens): ~45 seconds
Quality: Same (no quality loss)
Usable: Yes, but slower
```

### 2.8 Memory Management

```typescript
class LlamaManager {
  private model: LlamaCpp | null = null;
  private loaded: boolean = false;

  async load() {
    if (this.loaded) return;

    // Memory-mapped file (fast loading)
    this.model = await loadModel({
      modelPath: '/path/to/llama-3.1-8b-q4.gguf',
      useMmap: true,      // Map file to memory
      useMlock: true,     // Lock in RAM (no swapping)
      nGpuLayers: 40,     // Offload to GPU (if available)
      nCtx: 8192,         // Context window (start small)
      nThreads: 10,       // CPU threads
    });

    this.loaded = true;
  }

  async unload() {
    if (!this.loaded) return;
    await this.model.dispose();
    this.model = null;
    this.loaded = false;
    // Memory freed immediately
  }

  // Lazy loading: only load when needed
  async generate(prompt: string) {
    if (!this.loaded) await this.load();
    return this.model.generate(prompt);
  }
}
```

### 2.9 Strengths & Limitations

**Strengths**:
```
✅ Natural conversation (feels human)
✅ Emotional intelligence (empathy)
✅ General knowledge (broad)
✅ Coding assistance (80.5% HumanEval)
✅ Math reasoning (decent)
✅ Instruction following (excellent)
✅ Context retention (128K)
✅ Korean + English (bilingual)
✅ Fast on consumer hardware
```

**Limitations**:
```
❌ Not as good as GPT-4/Claude at:
   - Very complex coding tasks
   - Deep reasoning problems
   - Creative writing (fiction)

❌ Occasional hallucinations
   - Mitigation: Ask for sources
   - Mitigation: User can verify code

❌ Knowledge cutoff (January 2024)
   - Can't know events after that
   - Mitigation: User provides context

❌ No real-time internet
   - By design (privacy!)
   - User can paste info if needed
```

**Acceptable Trade-offs**:

For Eden V3's use case (companion + productivity), these limitations are acceptable because:
1. 80% of tasks are conversation (Llama excels)
2. 20% of coding tasks at 80.5% quality is excellent
3. Privacy > absolute performance
4. Local speed > cloud accuracy

---

## 3. LLaVA 7B: Vision Model

### 3.1 Model Specifications

**Official Name**: LLaVA-v1.6-Vicuna-7B

```yaml
Parameters: 7 billion
Architecture: Vision encoder + Llama 2 decoder
Purpose: Visual understanding + reasoning
Context: Images + text
Training: Visual instruction tuning
License: Apache 2.0

Components:
  1. CLIP ViT-L/14 (Visual Encoder)
     - Processes images into embeddings
  2. Projection Layer
     - Maps visual → text space
  3. Llama 2 7B (Language Model)
     - Generates text responses

Quantization (for Eden V3):
  Format: GGUF (Q4_K_M)
  Size: ~4.0GB
```

### 3.2 What LLaVA Does

**Visual Understanding**:

```
Input: Screenshot (1920x1080 PNG)
       ↓
Output: Structured description

Example:
  "The screen shows a code editor (VS Code) with TypeScript file open.
   There's a red error squiggle on line 45 indicating a type mismatch.
   The function 'getUserData' returns Promise<User> but is being used
   without await. The file explorer on the left shows a React project
   structure with src/, components/, and utils/ folders."
```

**UI Element Detection**:

```yaml
Can identify:
  ✅ Buttons, forms, inputs
  ✅ Error messages (red text)
  ✅ Success indicators (green)
  ✅ Modal dialogs
  ✅ Navigation menus
  ✅ Code editors (syntax highlighting)
  ✅ Terminal output
  ✅ Browser windows
```

### 3.3 Screen Analysis Pipeline

```typescript
class ScreenAnalyzer {
  async analyzeScreen(screenshotPath: string): Promise<ScreenContext> {
    // 1. Capture screen
    const screenshot = await captureScreen();

    // 2. Preprocess
    const resized = await resizeImage(screenshot, {
      maxWidth: 1344,   // LLaVA optimal size
      maxHeight: 768,
      maintainAspect: true,
    });

    // 3. Run LLaVA
    const prompt = `Analyze this screenshot of a developer's workspace.

Identify:
1. What application is open?
2. What is the user working on?
3. Are there any errors or issues visible?
4. What action is the user trying to perform?
5. Any opportunities to assist?

Be concise and technical.`;

    const analysis = await llava.generate({
      image: resized,
      prompt: prompt,
      maxTokens: 512,
    });

    // 4. Parse structured output
    return parseScreenContext(analysis);
  }
}
```

**Parsing Output**:

```typescript
interface ScreenContext {
  application: string;          // "VS Code"
  task: string;                 // "Editing TypeScript file"
  errors: ErrorInfo[];          // [{line: 45, message: "..."}]
  stuck: boolean;               // Is user stuck?
  helpOpportunity: string | null; // "Offer to fix type error"
  codeVisible: {
    language: string;           // "typescript"
    lineCount: number;          // 50
    hasErrors: boolean;         // true
  };
}
```

### 3.4 Use Cases in Eden V3

**Use Case 1: Error Detection**

```
AI-Led Mode, every 10 seconds:
  1. Capture screen
  2. LLaVA analyzes
  3. Detects: "Red error message, user not moving cursor"
  4. Inference: User stuck on error
  5. Eden notification: "Need help with this error?"
```

**Use Case 2: Context Enrichment**

```
User: "이거 고쳐줘"

Without LLaVA:
  Eden: "무엇을 고쳐드릴까요?" (What should I fix?)

With LLaVA:
  1. Analyzes screen
  2. Sees: TypeScript error on line 45
  3. Eden: "Line 45의 타입 에러를 고쳐드릴까요?" (Fix type error on line 45?)
```

**Use Case 3: Proactive Assistance**

```
LLaVA detects:
  - Same screen for 2+ minutes
  - Error message visible
  - No cursor movement

Eden's decision:
  → "User is stuck"
  → Offer help proactively
```

### 3.5 Performance & Limitations

**Performance**:

```
M3 MAX:
  Inference time: ~2-3 seconds per image
  Accuracy: 85-90% on UI understanding
  RAM: ~4.5GB when loaded

Quality:
  ✅ Excellent at: UI elements, text, errors
  ✅ Good at: Layout understanding
  ⚠️ Okay at: Small text (zoom in if needed)
  ❌ Poor at: Complex diagrams, handwriting
```

**Limitations**:

```
❌ Not perfect:
  - Can misread small text
  - Sometimes hallucinates details
  - Slower than text-only processing

✅ Mitigation:
  - Always verify with text context when possible
  - Use OCR for important text extraction
  - Combine with file system analysis
```

### 3.6 Privacy Considerations

**Screen Capture Privacy**:

```yaml
What is captured:
  ✅ Active window content
  ✅ Visible UI elements
  ✅ Error messages

What is NOT captured:
  ❌ Notifications from other apps (blurred)
  ❌ Password managers (excluded by default)
  ❌ Personal photos (ignored by LLaVA)

User controls:
  - Pause screen analysis anytime
  - Exclude specific apps
  - Blur sensitive windows
  - View/delete all captures
```

**Data Flow**:

```
Screen → PNG file (temp) → LLaVA (local) → Analysis → JSON
                ↓
         Deleted after analysis (optional: save for context)
```

### 3.7 Integration with Llama 3.1

**Combined Intelligence**:

```typescript
async function respondToUser(userMessage: string) {
  // 1. Get visual context (if AI-Led mode)
  let visualContext = null;
  if (mode === 'ai-led') {
    visualContext = await screenAnalyzer.analyzeScreen();
  }

  // 2. Build prompt for Llama
  const prompt = buildPrompt({
    user: userMessage,
    visual: visualContext,      // ← LLaVA's output
    conversation: history,
    persona: activePersona,
  });

  // 3. Generate response
  const response = await llama.generate(prompt);

  return response;
}
```

**Example**:

```
User: "도와줘" (Help me)

Visual Context (LLaVA):
  "VS Code open, TypeScript file, error on line 45:
   Type 'string' is not assignable to type 'number'"

Llama's Response:
  "Line 45의 타입 에러를 해결해드릴게요.
   count 변수는 number 타입인데 string을 할당하셨네요.
   parseInt()를 사용해서 문자열을 숫자로 변환하면 됩니다.
   코드 수정해드릴까요?"
```

---

## 4. Whisper Large V3: Speech-to-Text

### 4.1 Model Specifications

**Official Name**: Whisper Large V3

```yaml
Parameters: 1.55 billion
Architecture: Encoder-decoder transformer
Release: November 2023 (latest)
Developer: OpenAI
License: MIT (fully open-source)

Performance:
  WER (Word Error Rate): ~3-5%
  Languages: 99+ languages
  Code-switching: Excellent (Korean + English mixed)
  Noise robustness: Excellent

Quantization:
  Format: Core ML / GGML (INT8)
  Size: ~3GB
  Quality: Near-lossless
```

### 4.2 Why Whisper Large V3?

**Comparison**:

| Model | WER | Korean Support | Size | License |
|-------|-----|---------------|------|---------|
| **Whisper Large V3** | 3-5% | ⭐⭐⭐⭐⭐ | 3GB | MIT ✅ |
| Whisper Medium | 5-8% | ⭐⭐⭐⭐ | 1.5GB | MIT |
| Google STT API | 3-4% | ⭐⭐⭐⭐⭐ | Cloud | Proprietary ❌ |
| Wav2Vec 2.0 | 6-10% | ⭐⭐⭐ | 1GB | MIT |

**Decision**: Whisper Large V3
- Best accuracy (3-5% WER)
- Excellent Korean support
- 100% local (privacy!)
- Open-source
- Robust to accents and noise

### 4.3 Korean + English Support

**Bilingual Recognition**:

```
User speaks: "React의 useState를 explain해줘"
                (Mixed Korean-English)

Whisper transcription:
  "React의 useState를 explain해줘" ✅ Accurate!

Other STT systems:
  "리액트의 유즈스테이트를 익스플레인해줘" ❌ Transliterated
```

**Language Detection**:

```typescript
const result = await whisper.transcribe(audioBuffer, {
  language: 'auto',  // Auto-detect Korean or English
  task: 'transcribe',
});

// result.language: 'ko' or 'en' or 'mixed'
// result.text: transcribed text
```

### 4.4 Voice Input Pipeline

```typescript
class VoiceInputHandler {
  async processVoiceInput(audioStream: AudioStream) {
    // 1. Record audio
    const audioBuffer = await recordAudio({
      sampleRate: 16000,  // Whisper requires 16kHz
      channels: 1,        // Mono
      format: 'wav',
    });

    // 2. Transcribe with Whisper
    const transcription = await whisper.transcribe(audioBuffer, {
      language: 'auto',
      temperature: 0.0,   // Deterministic
      bestOf: 1,          // Single beam search
    });

    // 3. Return text
    return {
      text: transcription.text,
      language: transcription.language,
      confidence: transcription.avg_confidence,
    };
  }
}
```

### 4.5 Real-World Performance

**Speed**:

```
M3 MAX:
  Real-time factor: 0.1x (10x faster than real-time)
  Example: 10 seconds of speech → 1 second to transcribe

Intel i9 (CPU):
  Real-time factor: 0.3x (3x faster than real-time)
  Example: 10 seconds of speech → 3 seconds to transcribe

Acceptable latency: <1 second for short queries
```

**Accuracy Examples**:

```
Korean:
  Input: "내일 오후 3시에 회의 일정 잡아줘"
  Whisper: "내일 오후 3시에 회의 일정 잡아줘" ✅

English:
  Input: "Create a new React component for user authentication"
  Whisper: "Create a new React component for user authentication" ✅

Mixed:
  Input: "useState hook을 사용해서 counter 만들어줘"
  Whisper: "useState hook을 사용해서 counter 만들어줘" ✅

Noisy environment:
  Input: "코드 리팩토링해줘" (with keyboard typing sounds)
  Whisper: "코드 리팩토링해줘" ✅ (robust to noise)
```

### 4.6 Voice Activity Detection (VAD)

**Start/Stop Detection**:

```typescript
class VoiceActivityDetector {
  async detectSpeech(audioStream: AudioStream) {
    // Silero VAD (lightweight, accurate)
    const vad = await loadVAD('silero_vad_v4');

    let isSpeaking = false;
    let silenceDuration = 0;

    audioStream.on('data', async (chunk) => {
      const speechProb = await vad.predict(chunk);

      if (speechProb > 0.5) {
        // Speech detected
        if (!isSpeaking) {
          this.emit('speech_start');
          isSpeaking = true;
        }
        silenceDuration = 0;
      } else {
        // Silence
        silenceDuration += chunk.duration;

        if (silenceDuration > 1000 && isSpeaking) {
          // 1 second of silence after speech
          this.emit('speech_end');
          isSpeaking = false;
        }
      }
    });
  }
}
```

### 4.7 Wake Word Integration

**"Hey Eden" Wake Word**:

```typescript
// Porcupine wake word detection
const wakeWord = await loadWakeWord('hey_eden.ppn');

micStream.on('data', async (audio) => {
  const detected = await wakeWord.process(audio);

  if (detected) {
    console.log('Wake word detected!');
    startListening();  // Begin Whisper transcription
  }
});
```

**Flow**:

```
1. Microphone always listening (low power)
2. Porcupine detects "Hey Eden" (local, <100ms)
3. Whisper starts full transcription
4. User speaks command
5. VAD detects silence (end of speech)
6. Whisper transcribes full utterance
7. Send to Llama for processing
```

---

## 5. System TTS: Text-to-Speech

### 5.1 Platform-Specific Implementations

**macOS TTS**:

```typescript
import { exec } from 'child_process';

class MacOSTTS {
  async speak(text: string, options: TTSOptions) {
    // Use macOS 'say' command
    const voice = options.voice || 'Yuna';  // Korean female voice
    const rate = options.rate || 200;        // Words per minute

    await exec(`say -v ${voice} -r ${rate} "${text}"`);
  }

  getVoices() {
    // Available Korean voices on macOS
    return [
      { name: 'Yuna', language: 'ko-KR', gender: 'female' },
      { name: 'Sora', language: 'en-US', gender: 'female' },
      { name: 'Samantha', language: 'en-US', gender: 'female' },
    ];
  }
}
```

**Windows TTS**:

```typescript
import say from 'say';  // npm package wrapping Windows SAPI

class WindowsTTS {
  async speak(text: string, options: TTSOptions) {
    return new Promise((resolve, reject) => {
      say.speak(text, options.voice, options.rate, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  getVoices() {
    // Windows 10/11 includes Korean voices
    return [
      { name: 'Heami', language: 'ko-KR', gender: 'female' },
      { name: 'David', language: 'en-US', gender: 'male' },
      { name: 'Zira', language: 'en-US', gender: 'female' },
    ];
  }
}
```

### 5.2 Why System TTS Instead of ElevenLabs?

**Decision Rationale**:

```
ElevenLabs TTS (Cloud):
  ✅ Excellent quality (very natural)
  ✅ Emotional expression
  ❌ Requires internet
  ❌ Costs $0.20 per 1,000 chars = ~$60/month
  ❌ Privacy concerns (voice data sent to cloud)
  ❌ Latency (~500ms network + processing)

System TTS (Local):
  ✅ 100% local (privacy!)
  ✅ Zero cost
  ✅ Zero latency (<50ms)
  ✅ Always available (offline)
  ⚠️ Quality: Good, not excellent
  ⚠️ Less emotional expression

Decision: System TTS ✅
  - Privacy first
  - Eden's voice responses are optional anyway
  - Text is primary interface
  - Users can enable ElevenLabs if they want (future)
```

### 5.3 Voice Selection

**Default Voices**:

```typescript
const defaultVoices = {
  macOS: {
    ko: 'Yuna',      // Korean female, natural
    en: 'Samantha',  // English female, clear
  },
  windows: {
    ko: 'Heami',     // Korean female
    en: 'David',     // English male
  }
};

// Auto-select based on message language
function selectVoice(text: string): Voice {
  const lang = detectLanguage(text);
  const platform = process.platform;

  return defaultVoices[platform][lang];
}
```

### 5.4 TTS Optimization

**Smart TTS Usage**:

```typescript
class TTSManager {
  private enabled: boolean = true;
  private queue: string[] = [];

  async speak(text: string) {
    if (!this.enabled) return;

    // Don't speak code blocks
    if (text.includes('```')) {
      console.log('Skipping TTS for code block');
      return;
    }

    // Don't speak very long responses
    if (text.length > 500) {
      // Speak first sentence only
      const firstSentence = text.split('.')[0] + '.';
      await this.tts.speak(firstSentence);
      console.log('Long response, spoke first sentence only');
      return;
    }

    // Normal TTS
    await this.tts.speak(text);
  }

  toggle() {
    this.enabled = !this.enabled;
  }
}
```

**User Controls**:

```
Settings:
  ☑️ Enable voice output
  ☐ Always speak responses
  ☑ Speak short responses only
  Voice: [Yuna (Korean)    ▼]
  Speed: [────●────] 1.0x
  Volume: [──────●──] 80%
```

---

## 6. Learning System Architecture

### 6.1 The "Backpropagation-Inspired" Learning System

Eden V3 uses a revolutionary learning approach that combines:
1. **RAG (Retrieval-Augmented Generation)**: For episodic memory
2. **Parameter-Based Learning**: For personality adaptation

**Inspiration**:

```
Neural Networks learn via backpropagation:
  Forward pass → Error → Backpropagate → Update weights

Eden learns similarly:
  Response → User satisfaction → Calculate "error" → Update persona parameters
```

### 6.2 Persona Parameters (The "Weights")

```typescript
interface PersonaParameters {
  // Communication Style (20 parameters)
  formality: number;              // 0.0-1.0
  verbosity: number;
  humor: number;
  emoji_usage: number;
  enthusiasm: number;
  empathy: number;
  patience: number;
  assertiveness: number;
  technical_depth: number;
  explanation_style: number;      // 0=concise, 1=detailed
  question_frequency: number;     // How often to ask clarifying questions
  encouragement_frequency: number;

  // Behavioral Patterns (10 parameters)
  proactivity: number;            // How proactive to be
  teaching_vs_solving: number;    // 0=give answer, 1=teach
  code_verbosity: number;         // 0=compact, 1=readable with comments
  error_handling_tone: number;    // 0=direct, 1=gentle
  celebration_level: number;      // How much to celebrate successes
  interruption_willingness: number;

  // Cultural Adaptation (10 parameters)
  honorifics_level: number;       // Korean formality
  directness: number;             // 0=indirect, 1=direct
  korean_style_preference: number; // 0=Western, 1=Korean
  emoji_type: number;             // 0=none, 0.5=text, 1=emoji

  // Domain Expertise (adjust focus)
  frontend_expertise: number;
  backend_expertise: number;
  devops_expertise: number;
  ai_ml_expertise: number;
}

// Total: ~30 adjustable parameters
```

### 6.3 Learning Algorithm

**Gradient Descent-Style Updates**:

```typescript
class PersonaLearner {
  private learningRate = 0.01;  // Small updates per interaction

  updateParameters(
    persona: PersonaParameters,
    satisfaction: number,  // -1.0 to +1.0
    interactionType: string
  ): PersonaParameters {
    // Calculate "error" (how far from ideal)
    const error = 1.0 - satisfaction;  // 0 = perfect, 2 = terrible

    // Update each parameter based on context
    const updated = { ...persona };

    // Example: If user gave thumbs down and response was too verbose
    if (satisfaction < 0 && wasVerbose(interactionType)) {
      updated.verbosity -= this.learningRate * error;
      updated.verbosity = clamp(updated.verbosity, 0, 1);
    }

    // Example: If user loved the humor
    if (satisfaction > 0.8 && usedHumor(interactionType)) {
      updated.humor += this.learningRate * satisfaction;
      updated.humor = clamp(updated.humor, 0, 1);
    }

    // Save updated persona
    this.savePersona(updated);

    return updated;
  }
}
```

### 6.4 Satisfaction Signals

**Explicit Signals** (Strong):

```typescript
enum ExplicitFeedback {
  THUMBS_UP = 1.0,        // Very positive
  THUMBS_DOWN = -1.0,     // Very negative
  PERFECT = 1.5,          // Exceptional
  COPY_RESPONSE = 0.8,    // User found it useful
  EDIT_RESPONSE = -0.3,   // User had to fix it
  REGENERATE = -0.5,      // User wanted different response
}

// User clicks thumbs up
personaLearner.updateParameters(persona, 1.0, 'code_generation');
```

**Implicit Signals** (Weak but frequent):

```typescript
enum ImplicitFeedback {
  QUICK_ACCEPTANCE = 0.5,     // User used suggestion immediately
  LONG_READ = 0.3,            // User spent time reading
  IGNORED = -0.2,             // User dismissed notification
  ASKED_CLARIFICATION = -0.1, // Response wasn't clear
  CONTINUED_CONVERSATION = 0.4, // User engaged further
  SWITCHED_TOPIC = -0.1,      // User changed subject
}

// Automatically detect and log
conversationManager.on('user_response', (timing, action) => {
  if (timing < 5_000 && action === 'accept') {
    personaLearner.updateParameters(persona, 0.5, 'quick_acceptance');
  }
});
```

### 6.5 "Bias Formation" (Learning Through Experience)

**Philosophy**:

Just as humans form biases through repeated experiences, Eden forms "biases" (preferences) through interactions:

```
Human:
  Burned by hot stove 3x → "Don't touch stoves" (bias formed)

Eden:
  User dislikes formal language 10x → formality parameter ↓
  User loves detailed explanations 20x → verbosity parameter ↑
  User appreciates humor 15x → humor parameter ↑

  Result: Eden's personality "shaped" by experience
```

**Convergence**:

```typescript
// Over time, parameters converge to user's preferences
class ParameterHistory {
  formality: number[] = [0.5]; // Start at neutral

  addUpdate(newValue: number) {
    this.formality.push(newValue);
  }

  // After 100 interactions:
  // formality: [0.5, 0.48, 0.46, 0.44, ..., 0.20]
  //
  // Converged to 0.20 (user prefers casual style)
}
```

### 6.6 RAG (Retrieval-Augmented Generation)

**Episodic Memory Storage**:

```typescript
interface ConversationEpisode {
  id: string;
  timestamp: Date;
  userMessage: string;
  edenResponse: string;
  context: {
    screenContext?: ScreenContext;
    filesAccessed: string[];
    codeGenerated?: string;
  };
  satisfaction: number;  // User feedback
  embedding: number[];   // Vector for similarity search
}

// Store in Vector DB (ChromaDB)
class EpisodicMemory {
  private vectorDB: ChromaDB;

  async storeEpisode(episode: ConversationEpisode) {
    // Generate embedding
    const embedding = await this.embed(episode.userMessage);

    // Store in ChromaDB
    await this.vectorDB.add({
      id: episode.id,
      embedding: embedding,
      metadata: episode,
    });
  }

  async retrieveRelevant(query: string, topK = 5): Promise<ConversationEpisode[]> {
    // Find similar past conversations
    const queryEmbedding = await this.embed(query);

    const results = await this.vectorDB.query({
      embedding: queryEmbedding,
      nResults: topK,
    });

    return results.map(r => r.metadata);
  }
}
```

**Using RAG in Responses**:

```typescript
async function generateResponse(userMessage: string) {
  // 1. Retrieve relevant past conversations
  const relevant = await episodicMemory.retrieveRelevant(userMessage, 3);

  // 2. Build context
  const context = `
Previous similar conversations:

${relevant.map((ep, i) => `
${i + 1}. User: ${ep.userMessage}
   Eden: ${ep.edenResponse}
   Result: ${ep.satisfaction > 0.5 ? 'Helpful' : 'Not helpful'}
`).join('\n')}

Current user query: ${userMessage}

Based on past successful interactions, respond helpfully.
`;

  // 3. Generate with Llama
  const response = await llama.generate(context);

  return response;
}
```

### 6.7 Combining RAG + Parameters

**Full Learning System**:

```typescript
class AdaptiveLearningSystem {
  async respond(userMessage: string) {
    // 1. RAG: Retrieve relevant past experiences
    const pastExperiences = await this.rag.retrieve(userMessage);

    // 2. Parameters: Apply current persona settings
    const persona = await this.personaEngine.load();

    // 3. Build prompt with both
    const prompt = this.buildPrompt({
      userMessage,
      pastExperiences,  // ← RAG
      persona,          // ← Parameters
      currentContext,
    });

    // 4. Generate response
    const response = await this.llama.generate(prompt);

    // 5. Learn from feedback
    const satisfaction = await this.waitForFeedback();
    await this.personaLearner.update(persona, satisfaction);
    await this.rag.storeEpisode({ userMessage, response, satisfaction });

    return response;
  }
}
```

---

**End of Part 2**

---
---

# Part 3: Architecture & System Integration

## Table of Contents - Part 3

1. [Electron Architecture Deep Dive](#1-electron-architecture-deep-dive)
2. [IPC Communication Layer](#2-ipc-communication-layer)
3. [System Integration Services](#3-system-integration-services)
4. [Webhook & Plugin System](#4-webhook--plugin-system)
5. [File System Access & Context](#5-file-system-access--context)
6. [Git Integration](#6-git-integration)
7. [Calendar & Email Integration](#7-calendar--email-integration)
8. [Screen Capture & Vision Pipeline](#8-screen-capture--vision-pipeline)
9. [Process Management & Isolation](#9-process-management--isolation)
10. [Security & Sandboxing](#10-security--sandboxing)

---

## 1. Electron Architecture Deep Dive

### 1.1 Why Electron?

**Decision Matrix** (revisited with technical depth):

| Criterion | Electron | Tauri | Native (Swift/C#) |
|-----------|----------|-------|-------------------|
| **Cross-platform** | ⭐⭐⭐⭐⭐ Same code | ⭐⭐⭐⭐ Same code | ⭐ Need separate codebases |
| **Development Speed** | ⭐⭐⭐⭐⭐ Very fast | ⭐⭐⭐⭐ Fast | ⭐⭐ Slow (2x platforms) |
| **Ecosystem** | ⭐⭐⭐⭐⭐ Massive | ⭐⭐⭐ Growing | ⭐⭐⭐⭐ Platform-specific |
| **App Size** | ⭐⭐ ~150MB | ⭐⭐⭐⭐⭐ ~15MB | ⭐⭐⭐⭐ ~50MB |
| **RAM Usage** | ⭐⭐⭐ ~100MB | ⭐⭐⭐⭐ ~50MB | ⭐⭐⭐⭐⭐ ~30MB |
| **System Access** | ⭐⭐⭐⭐ Good (Node.js) | ⭐⭐⭐⭐⭐ Excellent (Rust) | ⭐⭐⭐⭐⭐ Native |
| **Maturity** | ⭐⭐⭐⭐⭐ 10+ years | ⭐⭐⭐ 3 years | ⭐⭐⭐⭐⭐ Decades |
| **AI Model Size** | 12GB models dwarf 150MB overhead ✅ | Same | Same |

**Verdict**: Electron wins for Eden V3 because:
- ✅ Development speed is critical (solo developer)
- ✅ Cross-platform support out of the box
- ✅ Rich ecosystem (React, TypeScript, Node.js)
- ✅ AI models (12GB) make app size overhead irrelevant
- ✅ Can always migrate to Tauri later if needed

### 1.2 Electron Process Architecture

Eden V3 uses a **multi-process architecture** for stability and security:

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron App Architecture                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Main Process (Node.js)                                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  - Window management                                    │ │
│  │  - System integration (file, git, calendar)            │ │
│  │  - AI model orchestration (llama.cpp)                  │ │
│  │  - Database (SQLite)                                   │ │
│  │  - IPC server                                          │ │
│  │  - Screen capture                                      │ │
│  │  - Native APIs (macOS/Windows)                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↕ IPC                               │
│  Renderer Process (Chromium)                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  UI Layer (React + TypeScript)                         │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  Chat Interface (KakaoTalk-style)                │  │ │
│  │  │  Settings Panel                                  │  │ │
│  │  │  Persona Configuration                           │  │ │
│  │  │  History View                                    │  │ │
│  │  │  Notification Center                             │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │                                                          │ │
│  │  State Management (Zustand)                             │ │
│  │  UI Components (shadcn/ui)                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↕ IPC                               │
│  Preload Script (Sandboxed Bridge)                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  - Exposes safe APIs to renderer                       │ │
│  │  - No direct Node.js access from UI                    │ │
│  │  - Security layer                                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Project Structure

```
garden-of-eden-v3/
├── src/
│   ├── main/                      # Main Process (Node.js)
│   │   ├── index.ts              # Entry point
│   │   ├── window.ts             # Window management
│   │   ├── ipc/                  # IPC handlers
│   │   │   ├── ai.handler.ts     # AI-related IPC
│   │   │   ├── file.handler.ts   # File system IPC
│   │   │   ├── git.handler.ts    # Git IPC
│   │   │   └── system.handler.ts # System IPC
│   │   ├── services/             # Core services
│   │   │   ├── ai/
│   │   │   │   ├── llama.service.ts
│   │   │   │   ├── llava.service.ts
│   │   │   │   ├── whisper.service.ts
│   │   │   │   └── tts.service.ts
│   │   │   ├── integration/
│   │   │   │   ├── file.service.ts
│   │   │   │   ├── git.service.ts
│   │   │   │   ├── calendar.service.ts
│   │   │   │   └── email.service.ts
│   │   │   ├── learning/
│   │   │   │   ├── persona.service.ts
│   │   │   │   ├── rag.service.ts
│   │   │   │   └── memory.service.ts
│   │   │   └── screen/
│   │   │       └── capture.service.ts
│   │   ├── database/             # SQLite
│   │   │   ├── schema.ts
│   │   │   ├── migrations/
│   │   │   └── repositories/
│   │   └── utils/
│   │       ├── logger.ts
│   │       └── config.ts
│   │
│   ├── renderer/                  # Renderer Process (React)
│   │   ├── App.tsx               # Root component
│   │   ├── pages/
│   │   │   ├── Chat.tsx          # Main chat interface
│   │   │   ├── Settings.tsx      # Settings page
│   │   │   └── History.tsx       # Conversation history
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   │   ├── ChatBubble.tsx
│   │   │   │   ├── InputBox.tsx
│   │   │   │   └── VoiceButton.tsx
│   │   │   ├── persona/
│   │   │   │   └── PersonaConfig.tsx
│   │   │   └── ui/               # shadcn/ui components
│   │   ├── hooks/
│   │   │   ├── useAI.ts
│   │   │   ├── useVoice.ts
│   │   │   └── usePersona.ts
│   │   ├── stores/               # Zustand stores
│   │   │   ├── chatStore.ts
│   │   │   ├── personaStore.ts
│   │   │   └── settingsStore.ts
│   │   └── styles/
│   │       └── globals.css
│   │
│   ├── preload/                   # Preload scripts
│   │   └── index.ts              # Exposed APIs
│   │
│   └── shared/                    # Shared types/utils
│       ├── types/
│       └── constants/
│
├── resources/                     # Resources
│   ├── models/                   # AI models (gitignored)
│   │   ├── llama-3.1-8b.gguf
│   │   ├── llava-7b.gguf
│   │   └── whisper-large-v3.bin
│   └── icons/
│
├── electron-builder.json          # Build config
├── package.json
├── tsconfig.json
└── vite.config.ts                # Vite for renderer
```

### 1.4 Technology Stack

**Main Process**:
- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.0+
- **AI Engine**: llama.cpp (via N-API bindings)
- **Database**: better-sqlite3
- **File System**: fs/promises
- **Git**: simple-git
- **Screen Capture**: screenshot-desktop (macOS/Windows)

**Renderer Process**:
- **Framework**: React 18+
- **Language**: TypeScript 5.0+
- **State**: Zustand (lightweight, simple)
- **UI Library**: shadcn/ui (headless, customizable)
- **Styling**: Tailwind CSS
- **i18n**: i18next + react-i18next
- **Build Tool**: Vite (fast HMR)

**Preload**:
- **API Exposure**: contextBridge (secure)

---

## 2. IPC Communication Layer

### 2.1 IPC Design Philosophy

Eden V3 uses **typed IPC channels** for type-safe communication between processes:

```typescript
// shared/types/ipc.types.ts

export interface IPCChannel {
  // AI Operations
  'ai:chat': {
    request: { message: string; context?: ScreenContext };
    response: { text: string; conversationId: string };
  };
  'ai:voice-input': {
    request: { audioBuffer: ArrayBuffer };
    response: { transcription: string };
  };
  'ai:speak': {
    request: { text: string; voice: 'male' | 'female' };
    response: { audioBuffer: ArrayBuffer };
  };

  // File Operations
  'file:read': {
    request: { path: string };
    response: { content: string; encoding: string };
  };
  'file:write': {
    request: { path: string; content: string };
    response: { success: boolean };
  };
  'file:watch': {
    request: { path: string };
    response: { event: 'change' | 'add' | 'unlink'; path: string };
  };

  // Git Operations
  'git:status': {
    request: { repoPath: string };
    response: { branch: string; changes: GitChange[] };
  };
  'git:commit': {
    request: { repoPath: string; message: string; files: string[] };
    response: { hash: string };
  };

  // System Operations
  'system:screenshot': {
    request: { display?: number };
    response: { image: Buffer; width: number; height: number };
  };
  'system:notify': {
    request: { title: string; body: string };
    response: { clicked: boolean };
  };
}
```

### 2.2 Type-Safe IPC Implementation

**Main Process (IPC Handler)**:

```typescript
// main/ipc/ai.handler.ts

import { ipcMain } from 'electron';
import { LlamaService } from '../services/ai/llama.service';
import type { IPCChannel } from '../../shared/types/ipc.types';

export class AIIPCHandler {
  constructor(private llama: LlamaService) {}

  register() {
    // Type-safe handler
    ipcMain.handle(
      'ai:chat',
      async (event, request: IPCChannel['ai:chat']['request']) => {
        const response = await this.llama.chat(request.message, request.context);

        return {
          text: response.text,
          conversationId: response.id,
        } satisfies IPCChannel['ai:chat']['response'];
      }
    );

    ipcMain.handle(
      'ai:voice-input',
      async (event, request: IPCChannel['ai:voice-input']['request']) => {
        const whisper = this.llama.whisper;
        const transcription = await whisper.transcribe(request.audioBuffer);

        return { transcription } satisfies IPCChannel['ai:voice-input']['response'];
      }
    );
  }
}
```

**Preload Script (API Exposure)**:

```typescript
// preload/index.ts

import { contextBridge, ipcRenderer } from 'electron';
import type { IPCChannel } from '../shared/types/ipc.types';

// Type-safe API factory
function createIPCAPI<K extends keyof IPCChannel>(channel: K) {
  return (request: IPCChannel[K]['request']): Promise<IPCChannel[K]['response']> => {
    return ipcRenderer.invoke(channel, request);
  };
}

// Expose to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // AI
  aiChat: createIPCAPI('ai:chat'),
  aiVoiceInput: createIPCAPI('ai:voice-input'),
  aiSpeak: createIPCAPI('ai:speak'),

  // File
  fileRead: createIPCAPI('file:read'),
  fileWrite: createIPCAPI('file:write'),
  fileWatch: createIPCAPI('file:watch'),

  // Git
  gitStatus: createIPCAPI('git:status'),
  gitCommit: createIPCAPI('git:commit'),

  // System
  systemScreenshot: createIPCAPI('system:screenshot'),
  systemNotify: createIPCAPI('system:notify'),
});

// Type declaration for renderer
declare global {
  interface Window {
    electronAPI: {
      aiChat: (req: IPCChannel['ai:chat']['request']) => Promise<IPCChannel['ai:chat']['response']>;
      aiVoiceInput: (req: IPCChannel['ai:voice-input']['request']) => Promise<IPCChannel['ai:voice-input']['response']>;
      aiSpeak: (req: IPCChannel['ai:speak']['request']) => Promise<IPCChannel['ai:speak']['response']>;
      fileRead: (req: IPCChannel['file:read']['request']) => Promise<IPCChannel['file:read']['response']>;
      fileWrite: (req: IPCChannel['file:write']['request']) => Promise<IPCChannel['file:write']['response']>;
      fileWatch: (req: IPCChannel['file:watch']['request']) => Promise<IPCChannel['file:watch']['response']>;
      gitStatus: (req: IPCChannel['git:status']['request']) => Promise<IPCChannel['git:status']['response']>;
      gitCommit: (req: IPCChannel['git:commit']['request']) => Promise<IPCChannel['git:commit']['response']>;
      systemScreenshot: (req: IPCChannel['system:screenshot']['request']) => Promise<IPCChannel['system:screenshot']['response']>;
      systemNotify: (req: IPCChannel['system:notify']['request']) => Promise<IPCChannel['system:notify']['response']>;
    };
  }
}
```

**Renderer Usage (Type-Safe!)**:

```typescript
// renderer/hooks/useAI.ts

export function useAI() {
  const sendMessage = async (message: string) => {
    // Fully typed! IDE autocomplete works
    const response = await window.electronAPI.aiChat({
      message,
      context: await getScreenContext(),
    });

    console.log(response.text); // TypeScript knows this exists!
    return response;
  };

  return { sendMessage };
}
```

### 2.3 Streaming Responses

For real-time AI responses (token-by-token streaming):

```typescript
// Use event-based streaming instead of invoke

// Preload
contextBridge.exposeInMainWorld('electronAPI', {
  // ...existing APIs

  aiChatStream: (request: IPCChannel['ai:chat']['request'], onToken: (token: string) => void) => {
    const channel = `ai:chat-stream:${Date.now()}`;

    ipcRenderer.on(channel, (event, token: string) => {
      onToken(token);
    });

    ipcRenderer.send('ai:chat-stream-start', { channel, ...request });

    return () => ipcRenderer.removeAllListeners(channel);
  },
});

// Main Process
ipcMain.on('ai:chat-stream-start', async (event, data) => {
  const { channel, message, context } = data;

  await llama.chatStream(message, context, (token) => {
    event.sender.send(channel, token);
  });

  event.sender.send(channel, '[DONE]');
});
```

---

## 3. System Integration Services

### 3.1 File System Integration

**Purpose**: Allow AI to read/write files, understand project structure

```typescript
// main/services/integration/file.service.ts

import fs from 'fs/promises';
import path from 'path';
import { watch } from 'chokidar';

export class FileService {
  private watchers = new Map<string, ReturnType<typeof watch>>();

  async read(filePath: string): Promise<{ content: string; encoding: string }> {
    const content = await fs.readFile(filePath, 'utf-8');
    return { content, encoding: 'utf-8' };
  }

  async write(filePath: string, content: string): Promise<void> {
    await fs.writeFile(filePath, content, 'utf-8');
  }

  async readDirectory(dirPath: string): Promise<string[]> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries.map(e => e.name);
  }

  async getProjectStructure(rootPath: string): Promise<FileTree> {
    // Recursively build file tree (for AI context)
    const tree: FileTree = { name: path.basename(rootPath), children: [] };

    const entries = await fs.readdir(rootPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue; // Skip hidden

      const fullPath = path.join(rootPath, entry.name);

      if (entry.isDirectory()) {
        tree.children.push(await this.getProjectStructure(fullPath));
      } else {
        tree.children.push({ name: entry.name, type: 'file' });
      }
    }

    return tree;
  }

  watchFile(filePath: string, callback: (event: string) => void): string {
    const watcherId = Date.now().toString();

    const watcher = watch(filePath).on('all', (event, path) => {
      callback(event);
    });

    this.watchers.set(watcherId, watcher);
    return watcherId;
  }

  unwatchFile(watcherId: string): void {
    const watcher = this.watchers.get(watcherId);
    if (watcher) {
      watcher.close();
      this.watchers.delete(watcherId);
    }
  }
}

interface FileTree {
  name: string;
  type?: 'file' | 'directory';
  children?: FileTree[];
}
```

**Use Case Example**:

```
User: "Refactor the UserService class"

AI Flow:
1. AI asks: "Which file contains UserService?"
2. User: "src/services/user.service.ts"
3. AI reads file via fileRead IPC
4. AI generates refactored code
5. User approves
6. AI writes back via fileWrite IPC
```

### 3.2 Git Integration

**Purpose**: AI can understand git status, create commits, manage branches

```typescript
// main/services/integration/git.service.ts

import simpleGit, { SimpleGit, StatusResult } from 'simple-git';

export class GitService {
  private git: SimpleGit;

  constructor(private repoPath: string) {
    this.git = simpleGit(repoPath);
  }

  async getStatus(): Promise<GitStatus> {
    const status: StatusResult = await this.git.status();

    return {
      branch: status.current || 'unknown',
      ahead: status.ahead,
      behind: status.behind,
      modified: status.modified,
      created: status.created,
      deleted: status.deleted,
      staged: status.staged,
    };
  }

  async commit(message: string, files?: string[]): Promise<string> {
    if (files && files.length > 0) {
      await this.git.add(files);
    } else {
      await this.git.add('.');
    }

    const result = await this.git.commit(message);
    return result.commit;
  }

  async createBranch(branchName: string): Promise<void> {
    await this.git.checkoutLocalBranch(branchName);
  }

  async switchBranch(branchName: string): Promise<void> {
    await this.git.checkout(branchName);
  }

  async push(remote = 'origin', branch?: string): Promise<void> {
    await this.git.push(remote, branch);
  }

  async pull(remote = 'origin', branch?: string): Promise<void> {
    await this.git.pull(remote, branch);
  }

  async getDiff(file?: string): Promise<string> {
    if (file) {
      return await this.git.diff([file]);
    }
    return await this.git.diff();
  }

  async getLog(count = 10): Promise<GitCommit[]> {
    const log = await this.git.log({ maxCount: count });

    return log.all.map(commit => ({
      hash: commit.hash,
      message: commit.message,
      author: commit.author_name,
      date: commit.date,
    }));
  }
}

interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  modified: string[];
  created: string[];
  deleted: string[];
  staged: string[];
}

interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
}
```

**AI Proactive Use Case**:

```
Scenario: AI detects uncommitted changes

AI (proactive notification):
"I notice you have 3 modified files in your git repo:
- src/components/Chat.tsx
- src/hooks/useAI.ts
- package.json

Would you like me to create a commit? I can suggest a commit message based on your changes."

User: "Yes"

AI:
[Reads diffs via gitDiff]
[Analyzes changes]
"Suggested commit message:
'feat: Add streaming response support to Chat component'

Should I commit with this message?"

User: "Perfect"

AI: [Executes gitCommit]
"✅ Committed as 7a3f9e2"
```

### 3.3 Calendar Integration

**Purpose**: AI knows your schedule, suggests optimal work times

```typescript
// main/services/integration/calendar.service.ts

import ical from 'node-ical';
import fetch from 'node-fetch';

export class CalendarService {
  private events: CalendarEvent[] = [];

  async syncFromICS(icsUrl: string): Promise<void> {
    // Support Google Calendar, Outlook, Apple Calendar (via ICS export)
    const response = await fetch(icsUrl);
    const icsData = await response.text();

    const parsed = ical.sync.parseICS(icsData);

    this.events = Object.values(parsed)
      .filter(event => event.type === 'VEVENT')
      .map(event => ({
        id: event.uid,
        title: event.summary,
        start: event.start,
        end: event.end,
        description: event.description,
        location: event.location,
      }));
  }

  getTodaysEvents(): CalendarEvent[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= today && eventDate < tomorrow;
    });
  }

  getUpcomingEvents(hours = 2): CalendarEvent[] {
    const now = new Date();
    const future = new Date(now.getTime() + hours * 60 * 60 * 1000);

    return this.events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= now && eventDate <= future;
    });
  }

  getFreeSlots(date: Date): TimeSlot[] {
    // Find gaps between events = free time
    const dayEvents = this.events
      .filter(e => new Date(e.start).toDateString() === date.toDateString())
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    const slots: TimeSlot[] = [];
    let lastEnd = new Date(date);
    lastEnd.setHours(9, 0, 0, 0); // Start at 9am

    for (const event of dayEvents) {
      const eventStart = new Date(event.start);

      if (eventStart > lastEnd) {
        slots.push({
          start: lastEnd,
          end: eventStart,
          duration: (eventStart.getTime() - lastEnd.getTime()) / 60000, // minutes
        });
      }

      lastEnd = new Date(event.end);
    }

    // Add slot until end of day (6pm)
    const endOfDay = new Date(date);
    endOfDay.setHours(18, 0, 0, 0);

    if (lastEnd < endOfDay) {
      slots.push({
        start: lastEnd,
        end: endOfDay,
        duration: (endOfDay.getTime() - lastEnd.getTime()) / 60000,
      });
    }

    return slots;
  }
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
}

interface TimeSlot {
  start: Date;
  end: Date;
  duration: number; // minutes
}
```

**AI Proactive Use Case**:

```
Scenario: Morning routine

AI (9:00 AM):
"Good morning! 🌅

Your schedule today:
- 10:00-11:00: Team standup
- 14:00-15:30: Client meeting
- 16:00-17:00: Code review session

You have a 2.5 hour free block from 11:00-14:00.
Perfect for focused coding on your React project!

Want me to block distractions during that time?"
```

### 3.4 Email Integration (Future)

**Purpose**: AI can read emails, suggest replies, manage inbox

```typescript
// Placeholder for future implementation

export class EmailService {
  // Integration with:
  // - Gmail API
  // - Outlook API
  // - IMAP/SMTP (generic)

  async getUnreadEmails(): Promise<Email[]> {
    // TODO
    return [];
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    // TODO
  }

  async suggestReply(emailId: string): Promise<string> {
    // Use LLM to generate contextual reply
    // TODO
    return '';
  }
}
```

---

## 4. Webhook & Plugin System

### 4.1 Webhook Architecture

**Purpose**: Allow Eden to trigger external services (Notion, Slack, Discord, etc.)

```typescript
// main/services/webhook/webhook.service.ts

import axios from 'axios';

export class WebhookService {
  private webhooks = new Map<string, WebhookConfig>();

  registerWebhook(name: string, config: WebhookConfig): void {
    this.webhooks.set(name, config);
  }

  async trigger(name: string, payload: any): Promise<void> {
    const webhook = this.webhooks.get(name);
    if (!webhook) {
      throw new Error(`Webhook '${name}' not found`);
    }

    try {
      await axios.post(webhook.url, payload, {
        headers: webhook.headers || {},
        timeout: webhook.timeout || 5000,
      });

      console.log(`✅ Webhook '${name}' triggered successfully`);
    } catch (error) {
      console.error(`❌ Webhook '${name}' failed:`, error);
      throw error;
    }
  }

  // Pre-configured webhooks
  async notifySlack(message: string, channel?: string): Promise<void> {
    const slackWebhook = this.webhooks.get('slack');
    if (!slackWebhook) return;

    await this.trigger('slack', {
      text: message,
      channel: channel || '#general',
    });
  }

  async notifyDiscord(message: string): Promise<void> {
    const discordWebhook = this.webhooks.get('discord');
    if (!discordWebhook) return;

    await this.trigger('discord', {
      content: message,
    });
  }

  async appendToNotion(databaseId: string, properties: any): Promise<void> {
    const notionWebhook = this.webhooks.get('notion');
    if (!notionWebhook) return;

    await axios.post(
      `https://api.notion.com/v1/pages`,
      {
        parent: { database_id: databaseId },
        properties,
      },
      {
        headers: {
          'Authorization': `Bearer ${notionWebhook.headers?.['Authorization']}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

interface WebhookConfig {
  url: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}
```

**Configuration (User Settings)**:

```json
{
  "webhooks": {
    "slack": {
      "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
      "enabled": true
    },
    "discord": {
      "url": "https://discord.com/api/webhooks/YOUR/WEBHOOK",
      "enabled": true
    },
    "notion": {
      "url": "https://api.notion.com",
      "headers": {
        "Authorization": "Bearer secret_YOUR_NOTION_TOKEN"
      },
      "enabled": false
    }
  }
}
```

**AI Use Case**:

```
User: "Remind the team on Slack that the standup is in 10 minutes"

AI:
[Triggers Slack webhook]
"✅ Sent message to #general:
'@channel Friendly reminder: Standup starts in 10 minutes!'"
```

### 4.2 Plugin System

**Purpose**: Extend Eden's capabilities without modifying core code

```typescript
// main/plugins/plugin.interface.ts

export interface EdenPlugin {
  name: string;
  version: string;
  description: string;

  // Lifecycle hooks
  onLoad?(context: PluginContext): Promise<void>;
  onUnload?(): Promise<void>;

  // Command registration
  commands?: PluginCommand[];

  // Custom IPC channels
  ipcHandlers?: Record<string, (request: any) => Promise<any>>;

  // UI extensions
  uiComponents?: PluginUIComponent[];
}

export interface PluginContext {
  // Access to core services
  ai: AIServiceAPI;
  file: FileService;
  git: GitService;
  calendar: CalendarService;
  webhook: WebhookService;
  db: Database;

  // Plugin-specific storage
  storage: PluginStorage;

  // Logging
  logger: Logger;
}

export interface PluginCommand {
  name: string;
  description: string;
  execute: (args: string[], context: PluginContext) => Promise<string>;
}

export interface PluginUIComponent {
  id: string;
  location: 'sidebar' | 'settings' | 'chat';
  component: string; // Path to React component
}
```

**Example Plugin: GitHub Integration**:

```typescript
// plugins/github-plugin/index.ts

import { EdenPlugin, PluginContext } from '../plugin.interface';
import { Octokit } from '@octokit/rest';

export class GitHubPlugin implements EdenPlugin {
  name = 'github-integration';
  version = '1.0.0';
  description = 'GitHub API integration for Eden';

  private octokit?: Octokit;
  private context?: PluginContext;

  async onLoad(context: PluginContext) {
    this.context = context;

    // Get GitHub token from plugin storage
    const token = await context.storage.get('github_token');
    if (token) {
      this.octokit = new Octokit({ auth: token });
      context.logger.info('GitHub plugin loaded successfully');
    }
  }

  commands = [
    {
      name: 'github-issues',
      description: 'List open issues in a repository',
      execute: async (args: string[]) => {
        if (!this.octokit) return 'GitHub not configured. Please add your token in settings.';

        const [owner, repo] = args[0].split('/');

        const { data: issues } = await this.octokit.issues.listForRepo({
          owner,
          repo,
          state: 'open',
        });

        return issues.map(i => `#${i.number}: ${i.title}`).join('\n');
      },
    },
    {
      name: 'github-create-pr',
      description: 'Create a pull request',
      execute: async (args: string[]) => {
        // Implementation...
        return 'PR created!';
      },
    },
  ];

  ipcHandlers = {
    'github:repos': async () => {
      if (!this.octokit) return [];

      const { data } = await this.octokit.repos.listForAuthenticatedUser();
      return data.map(r => ({ name: r.name, url: r.html_url }));
    },
  };
}
```

**Plugin Discovery & Loading**:

```typescript
// main/plugins/plugin-manager.ts

import fs from 'fs/promises';
import path from 'path';

export class PluginManager {
  private plugins = new Map<string, EdenPlugin>();
  private pluginDir = path.join(app.getPath('userData'), 'plugins');

  async loadPlugins(context: PluginContext): Promise<void> {
    await fs.mkdir(this.pluginDir, { recursive: true });

    const pluginDirs = await fs.readdir(this.pluginDir);

    for (const dir of pluginDirs) {
      try {
        const pluginPath = path.join(this.pluginDir, dir, 'index.js');
        const pluginModule = await import(pluginPath);
        const plugin: EdenPlugin = new pluginModule.default();

        await plugin.onLoad?.(context);

        this.plugins.set(plugin.name, plugin);
        console.log(`✅ Loaded plugin: ${plugin.name} v${plugin.version}`);
      } catch (error) {
        console.error(`❌ Failed to load plugin ${dir}:`, error);
      }
    }
  }

  getPlugin(name: string): EdenPlugin | undefined {
    return this.plugins.get(name);
  }

  async unloadPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (plugin) {
      await plugin.onUnload?.();
      this.plugins.delete(name);
    }
  }
}
```

---

## 5. File System Access & Context

### 5.1 Workspace Management

**Purpose**: Track user's active project for AI context

```typescript
// main/services/workspace/workspace.service.ts

export class WorkspaceService {
  private currentWorkspace?: Workspace;

  async openWorkspace(rootPath: string): Promise<Workspace> {
    const workspace: Workspace = {
      rootPath,
      name: path.basename(rootPath),
      type: await this.detectWorkspaceType(rootPath),
      openFiles: [],
      gitRepo: await this.detectGitRepo(rootPath),
    };

    this.currentWorkspace = workspace;
    return workspace;
  }

  private async detectWorkspaceType(rootPath: string): Promise<WorkspaceType> {
    // Detect project type by files
    const files = await fs.readdir(rootPath);

    if (files.includes('package.json')) return 'nodejs';
    if (files.includes('requirements.txt')) return 'python';
    if (files.includes('Cargo.toml')) return 'rust';
    if (files.includes('go.mod')) return 'go';
    if (files.includes('pom.xml')) return 'java';

    return 'generic';
  }

  private async detectGitRepo(rootPath: string): Promise<string | undefined> {
    try {
      const git = simpleGit(rootPath);
      await git.status();
      return rootPath;
    } catch {
      return undefined;
    }
  }

  trackFileOpen(filePath: string): void {
    if (!this.currentWorkspace) return;

    if (!this.currentWorkspace.openFiles.includes(filePath)) {
      this.currentWorkspace.openFiles.push(filePath);
    }
  }

  getCurrentContext(): WorkspaceContext {
    if (!this.currentWorkspace) {
      return { hasWorkspace: false };
    }

    return {
      hasWorkspace: true,
      workspaceName: this.currentWorkspace.name,
      workspaceType: this.currentWorkspace.type,
      openFiles: this.currentWorkspace.openFiles,
      hasGit: !!this.currentWorkspace.gitRepo,
    };
  }
}

interface Workspace {
  rootPath: string;
  name: string;
  type: WorkspaceType;
  openFiles: string[];
  gitRepo?: string;
}

type WorkspaceType = 'nodejs' | 'python' | 'rust' | 'go' | 'java' | 'generic';

interface WorkspaceContext {
  hasWorkspace: boolean;
  workspaceName?: string;
  workspaceType?: WorkspaceType;
  openFiles?: string[];
  hasGit?: boolean;
}
```

### 5.2 Context-Aware File Operations

**AI understands your project structure**:

```typescript
// Example AI interaction

User: "Show me the main entry point"

AI: [Checks workspace type]
    [workspace.type === 'nodejs']
    [Reads package.json]
    [Finds "main": "src/index.ts"]
    [Reads src/index.ts]

AI: "Your main entry point is `src/index.ts`. Here's what it does:
- Initializes Express server on port 3000
- Connects to MongoDB
- Registers API routes
- Starts listening

Would you like me to explain any specific part?"
```

---

## 6. Git Integration

### 6.1 Smart Commit Message Generation

**AI generates commit messages based on diffs**:

```typescript
// main/services/git/commit-ai.service.ts

export class CommitAIService {
  constructor(private llama: LlamaService) {}

  async generateCommitMessage(diff: string): Promise<string> {
    const prompt = `You are a Git commit message expert following Conventional Commits.

Analyze this git diff and generate a concise, descriptive commit message.

Format: <type>(<scope>): <subject>

Types: feat, fix, docs, style, refactor, test, chore

Diff:
\`\`\`
${diff}
\`\`\`

Generate only the commit message, no explanation.`;

    const response = await this.llama.generate(prompt, {
      maxTokens: 100,
      temperature: 0.3, // Low temperature for consistency
    });

    return response.trim();
  }

  async generatePRDescription(branch: string, commits: GitCommit[]): Promise<string> {
    const prompt = `Generate a GitHub Pull Request description.

Branch: ${branch}

Commits:
${commits.map(c => `- ${c.message}`).join('\n')}

Generate a PR description with:
1. Summary (what changed)
2. Motivation (why)
3. Changes (bullet points)
4. Testing (how to verify)

Format in Markdown.`;

    return await this.llama.generate(prompt, { maxTokens: 500 });
  }
}
```

**User Experience**:

```
User: "Commit my changes"

AI: [Reads git diff]
    [Analyzes changes with LLM]
    [Generates commit message]

AI: "I suggest this commit message:
'feat(chat): Add streaming response support with token-by-token display'

Should I commit with this message?"

User: "Yes"

AI: [Executes git add & commit]
    "✅ Committed as 7a3f9e2"
```

---

## 7. Calendar & Email Integration

### 7.1 Proactive Scheduling Assistant

**AI suggests optimal work times based on calendar**:

```typescript
// AI proactive logic

async function suggestWorkTime() {
  const today = new Date();
  const freeSlots = await calendarService.getFreeSlots(today);

  // Find longest free slot
  const longestSlot = freeSlots.reduce((max, slot) =>
    slot.duration > max.duration ? slot : max
  );

  if (longestSlot.duration >= 120) { // 2+ hours
    await notifyUser({
      title: 'Optimal Coding Time Available',
      body: `You have a ${longestSlot.duration}min block from ${formatTime(longestSlot.start)}. Perfect for deep work!`,
      action: 'Start Focus Mode',
    });
  }
}
```

---

## 8. Screen Capture & Vision Pipeline

### 8.1 Screen Context Awareness

**Purpose**: AI sees what you see (privacy-conscious)

```typescript
// main/services/screen/capture.service.ts

import screenshot from 'screenshot-desktop';
import sharp from 'sharp';

export class ScreenCaptureService {
  async captureScreen(display = 0): Promise<ScreenCapture> {
    // Capture screenshot
    const imgBuffer = await screenshot({ screen: display });

    // Resize for LLaVA (max 1024x1024)
    const resized = await sharp(imgBuffer)
      .resize(1024, 1024, { fit: 'inside' })
      .jpeg({ quality: 85 })
      .toBuffer();

    return {
      image: resized,
      timestamp: new Date(),
      display,
    };
  }

  async captureWindow(windowTitle: string): Promise<ScreenCapture> {
    // Platform-specific: capture specific window
    // macOS: use CGWindowListCreateImage
    // Windows: use Windows API
    // TODO: Implement
    throw new Error('Not implemented');
  }

  async analyzeScreen(): Promise<ScreenAnalysis> {
    const capture = await this.captureScreen();

    // Send to LLaVA for vision analysis
    const analysis = await llavaService.analyze(capture.image, {
      prompt: 'Describe what you see on this screen. Identify any code, terminal output, error messages, or UI elements.',
    });

    return {
      description: analysis.text,
      detectedElements: this.parseElements(analysis.text),
    };
  }

  private parseElements(description: string): ScreenElement[] {
    // Extract structured data from LLaVA description
    // e.g., "I see a code editor with TypeScript code", "There's an error message in red"
    return [];
  }
}

interface ScreenCapture {
  image: Buffer;
  timestamp: Date;
  display: number;
}

interface ScreenAnalysis {
  description: string;
  detectedElements: ScreenElement[];
}

interface ScreenElement {
  type: 'code' | 'error' | 'terminal' | 'browser' | 'ui';
  content?: string;
  confidence: number;
}
```

### 8.2 Privacy Controls

**User has full control over screen capture**:

```typescript
// Settings
interface ScreenCaptureSettings {
  enabled: boolean;
  mode: 'manual' | 'auto' | 'disabled';
  captureFrequency?: number; // seconds (if auto)
  excludedApps?: string[]; // Never capture these apps
  blurSensitiveInfo?: boolean; // Blur passwords, emails, etc.
}
```

**UI Indicator**:
```
When screen capture is active:
- Show 🔴 red dot in tray icon
- Show "Screen capture active" toast
- User can disable anytime
```

---

## 9. Process Management & Isolation

### 9.1 AI Model Subprocess

**Purpose**: Run AI models in separate process to prevent UI freezing

```typescript
// main/processes/ai-worker.ts

import { fork } from 'child_process';

export class AIWorkerProcess {
  private worker: ReturnType<typeof fork> | null = null;

  start(): void {
    this.worker = fork(path.join(__dirname, 'ai-worker-script.js'));

    this.worker.on('message', (message) => {
      this.handleWorkerMessage(message);
    });

    this.worker.on('error', (error) => {
      console.error('AI worker error:', error);
      this.restart();
    });
  }

  async generate(prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const requestId = Date.now().toString();

      this.worker?.send({
        type: 'generate',
        requestId,
        prompt,
      });

      const handler = (message: any) => {
        if (message.requestId === requestId) {
          if (message.type === 'result') {
            resolve(message.text);
          } else if (message.type === 'error') {
            reject(new Error(message.error));
          }
          this.worker?.off('message', handler);
        }
      };

      this.worker?.on('message', handler);
    });
  }

  private restart(): void {
    console.log('Restarting AI worker...');
    this.worker?.kill();
    this.start();
  }
}
```

**AI Worker Script** (runs in separate process):

```typescript
// main/processes/ai-worker-script.ts

import { LlamaCpp } from '../services/ai/llama.service';

const llama = new LlamaCpp({
  modelPath: './resources/models/llama-3.1-8b.gguf',
});

process.on('message', async (message: any) => {
  if (message.type === 'generate') {
    try {
      const result = await llama.generate(message.prompt);

      process.send?.({
        type: 'result',
        requestId: message.requestId,
        text: result,
      });
    } catch (error) {
      process.send?.({
        type: 'error',
        requestId: message.requestId,
        error: error.message,
      });
    }
  }
});
```

### 9.2 Resource Monitoring

```typescript
// Monitor CPU/RAM usage

import os from 'os';

export class ResourceMonitor {
  getSystemInfo() {
    return {
      totalRAM: os.totalmem(),
      freeRAM: os.freemem(),
      cpuUsage: os.loadavg(),
      platform: os.platform(),
    };
  }

  async getProcessUsage() {
    return {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    };
  }

  shouldThrottle(): boolean {
    const free = os.freemem();
    const total = os.totalmem();
    const usagePercent = ((total - free) / total) * 100;

    // Throttle if RAM usage > 90%
    return usagePercent > 90;
  }
}
```

---

## 10. Security & Sandboxing

### 10.1 Context Isolation

**Renderer process has NO direct Node.js access**:

```typescript
// main/index.ts

const mainWindow = new BrowserWindow({
  width: 1200,
  height: 800,
  webPreferences: {
    contextIsolation: true, // ✅ Isolated
    nodeIntegration: false, // ✅ Disabled
    preload: path.join(__dirname, 'preload.js'),
  },
});
```

### 10.2 IPC Validation

**All IPC requests are validated**:

```typescript
// main/ipc/validator.ts

export function validateIPCRequest(channel: string, data: any): boolean {
  // Whitelist allowed channels
  const allowedChannels = [
    'ai:chat',
    'file:read',
    'git:status',
    // ... etc
  ];

  if (!allowedChannels.includes(channel)) {
    console.error(`❌ Blocked unauthorized IPC channel: ${channel}`);
    return false;
  }

  // Validate data structure
  // TODO: Add schema validation (zod)

  return true;
}
```

### 10.3 File System Restrictions

**AI can only access user-authorized directories**:

```typescript
// main/services/security/file-access.service.ts

export class FileAccessControl {
  private allowedPaths: Set<string> = new Set();

  async requestAccess(path: string): Promise<boolean> {
    // Show dialog to user
    const { response } = await dialog.showMessageBox({
      type: 'question',
      buttons: ['Allow', 'Deny'],
      message: `Eden wants to access:\n${path}`,
      detail: 'This will allow Eden to read and write files in this directory.',
    });

    if (response === 0) {
      this.allowedPaths.add(path);
      return true;
    }

    return false;
  }

  isAllowed(path: string): boolean {
    // Check if path is within any allowed directory
    for (const allowedPath of this.allowedPaths) {
      if (path.startsWith(allowedPath)) {
        return true;
      }
    }
    return false;
  }
}
```

---

**End of Part 3**

*Lines: ~1400*
*Next: Part 4 - UI/UX & Features*

---
---

# Part 4: UI/UX & Features (EXPANDED VERSION)

## Table of Contents - Part 4

1. [KakaoTalk-Style Chat Interface](#1-kakaotalk-style-chat-interface)
2. [Design System & Theme](#2-design-system--theme)
3. [Internationalization (i18n)](#3-internationalization-i18n)
4. [Voice Input/Output UI](#4-voice-inputoutput-ui)
5. [Dual Mode: User-Led vs AI-Led](#5-dual-mode-user-led-vs-ai-led)
6. [Proactive Notifications](#6-proactive-notifications)
7. [Settings & Persona Configuration](#7-settings--persona-configuration)
8. [Conversation History](#8-conversation-history)
9. [Keyboard Shortcuts & Accessibility](#9-keyboard-shortcuts--accessibility)
10. [System Tray & Window Management](#10-system-tray--window-management)

---

## 1. KakaoTalk-Style Chat Interface

### 1.1 Why KakaoTalk Style?

**Design Philosophy**: Familiar, conversational, warm

Korean users are deeply familiar with KakaoTalk's UI:
- ✅ Speech bubbles (left = AI, right = user)
- ✅ Timestamps above bubbles
- ✅ Profile pictures
- ✅ Read receipts (optional)
- ✅ Typing indicator
- ✅ Warm yellow accent color (#FAE100)

This creates **instant familiarity** and reduces learning curve.

**Psychological Benefits**:
- Warm colors reduce stress
- Familiar patterns increase comfort
- Conversational style feels personal
- Avatar creates emotional connection

### 1.2 Chat Interface Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🌿 Garden of Eden                    [User-Led ▾] [−] [□] [×]         │
├─────────────────────────────────────────────────────────────────────────┤
│  │                                                                  │    │
│  │  ┌────────────────────────────────────────────────────────────┐ │    │
│  │  │                      Chat Area                              │ │    │
│  │  │  ┌──────────────────────────────────────────────────────┐  │ │    │
│  │  │  │  오후 2:34                                            │  │ │    │
│  │  │  │  ┌────────────────────────────────────┐              │  │ │    │
│  │  │  │🤖│ 안녕하세요! 오늘 하루 어떠셨어요?    │ (AI)        │  │ │    │
│  │  │  │  │ How was your day?                  │              │  │ │    │
│  │  │  │  └────────────────────────────────────┘              │  │ │    │
│  │  │  │                                                      │  │ │    │
│  │  │  │                         오후 2:35                    │  │ │    │
│  │  │  │              ┌────────────────────────────────────┐  │  │ │    │
│  │  │  │        (User)│ 좋았어! 코딩 많이 했어             │😊│  │ │    │
│  │  │  │              │ Great! Did lots of coding          │  │  │ │    │
│  │  │  │              └────────────────────────────────────┘  │  │ │    │
│  │  │  │                                                      │  │ │    │
│  │  │  │  오후 2:35                                            │  │ │    │
│  │  │  │  ┌────────────────────────────────────┐              │  │ │    │
│  │  │  │🤖│ 훌륭해요! 무슨 프로젝트였나요?        │              │  │ │    │
│  │  │  │  │ Awesome! What project?             │              │  │ │    │
│  │  │  │  └────────────────────────────────────┘              │  │ │    │
│  │  │  │                                                      │  │ │    │
│  │  │  │  ● ● ● (typing...)                                   │  │ │    │
│  │  │  └──────────────────────────────────────────────────────┘  │ │    │
│  │  └────────────────────────────────────────────────────────────┘ │    │
│  │                                                                  │    │
│  │  ┌────────────────────────────────────────────────────────────┐ │    │
│  │  │  Input Area                                                 │ │    │
│  │  │  ┌────────────────────────────────────────────────────┐    │ │    │
│  │  │  │  메시지를 입력하세요... Type a message...  [🎤]    │    │ │    │
│  │  │  └────────────────────────────────────────────────────┘    │ │    │
│  │  │                                   [📎] [😊] [🔍] [⚙️] [➤]  │ │    │
│  │  └────────────────────────────────────────────────────────────┘ │    │
│  │                                                                  │    │
└──────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Chat Bubble Component (Complete Implementation)

```tsx
// renderer/components/chat/ChatBubble.tsx

import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { formatTime, formatDate, isToday, isSameDay } from '@/utils/time';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

interface ChatBubbleProps {
  message: string;
  sender: 'user' | 'assistant' | 'system';
  timestamp: Date;
  avatar?: string;
  isStreaming?: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  groupWithPrevious?: boolean;  // Same sender, within 1 minute
}

export function ChatBubble({
  message,
  sender,
  timestamp,
  avatar,
  isStreaming = false,
  showAvatar = true,
  showTimestamp = true,
  groupWithPrevious = false
}: ChatBubbleProps) {
  const [copied, setCopied] = React.useState(false);
  const isAI = sender === 'assistant';
  const isUser = sender === 'user';

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn(
      'flex gap-3 px-4',
      groupWithPrevious ? 'mt-1' : 'mt-4',
      isAI && 'justify-start',
      isUser && 'justify-end'
    )}>
      {/* AI Avatar (left) */}
      {isAI && showAvatar && (
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage src={avatar || '/avatars/eden-ai.png'} alt="Eden AI" />
          <AvatarFallback className="bg-yellow-400 text-gray-900">🌿</AvatarFallback>
        </Avatar>
      )}

      {/* Spacer when grouped */}
      {isAI && !showAvatar && <div className="w-10 flex-shrink-0" />}

      <div className={cn(
        'flex flex-col max-w-[65%]',
        isAI && 'items-start',
        isUser && 'items-end'
      )}>
        {/* Timestamp (shown above first message in group) */}
        {showTimestamp && !groupWithPrevious && (
          <div className="text-xs text-gray-500 mb-1 px-1">
            {isToday(timestamp) ? formatTime(timestamp) : formatDate(timestamp)}
          </div>
        )}

        {/* Bubble */}
        <div className={cn(
          'px-4 py-2.5 rounded-2xl shadow-sm transition-all',
          isAI && 'bg-white text-gray-900 rounded-tl-none border border-gray-100',
          isUser && 'bg-yellow-400 text-gray-900 rounded-tr-none',
          isStreaming && 'animate-pulse-subtle'
        )}>
          {isStreaming ? (
            <div className="flex items-center gap-2">
              <span className="whitespace-pre-wrap break-words">{message}</span>
              <span className="inline-block w-0.5 h-4 bg-current animate-pulse">▌</span>
            </div>
          ) : (
            <div className={cn(
              'prose prose-sm max-w-none',
              isUser && 'prose-p:my-1'
            )}>
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');

                    return !inline && match ? (
                      <div className="relative group">
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-lg !my-2"
                          {...props}
                        >
                          {codeString}
                        </SyntaxHighlighter>
                        <button
                          onClick={() => handleCopyCode(codeString)}
                          className="absolute top-2 right-2 p-1.5 bg-gray-800 hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-300" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <code className={cn(
                        className,
                        'px-1.5 py-0.5 bg-gray-100 rounded text-sm'
                      )} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Read receipt (for user messages) */}
        {isUser && !isStreaming && (
          <div className="text-xs text-gray-400 mt-0.5 px-1">
            읽음 · Read
          </div>
        )}
      </div>

      {/* User Avatar (right) */}
      {isUser && showAvatar && (
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage src={avatar || '/avatars/user-default.png'} alt="User" />
          <AvatarFallback className="bg-gray-200">👤</AvatarFallback>
        </Avatar>
      )}

      {/* Spacer when grouped */}
      {isUser && !showAvatar && <div className="w-10 flex-shrink-0" />}
    </div>
  );
}
```

### 1.4 Message Grouping Logic

```typescript
// utils/chat/groupMessages.ts

export interface GroupedMessage {
  messages: Message[];
  sender: 'user' | 'assistant';
  timestamp: Date;
}

const GROUP_THRESHOLD_MS = 60000; // 1 minute

export function groupMessages(messages: Message[]): GroupedMessage[] {
  const groups: GroupedMessage[] = [];
  let currentGroup: Message[] = [];
  let currentSender: 'user' | 'assistant' | null = null;

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const prevMessage = messages[i - 1];

    const shouldStartNewGroup =
      !prevMessage ||
      message.sender !== currentSender ||
      (message.timestamp.getTime() - prevMessage.timestamp.getTime()) > GROUP_THRESHOLD_MS;

    if (shouldStartNewGroup) {
      if (currentGroup.length > 0) {
        groups.push({
          messages: currentGroup,
          sender: currentSender!,
          timestamp: currentGroup[0].timestamp,
        });
      }
      currentGroup = [message];
      currentSender = message.sender;
    } else {
      currentGroup.push(message);
    }
  }

  if (currentGroup.length > 0) {
    groups.push({
      messages: currentGroup,
      sender: currentSender!,
      timestamp: currentGroup[0].timestamp,
    });
  }

  return groups;
}
```

### 1.5 Typing Indicator Component

```tsx
// renderer/components/chat/TypingIndicator.tsx

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export function TypingIndicator() {
  return (
    <div className="flex gap-3 px-4 mt-4 animate-fade-in">
      <Avatar className="w-10 h-10">
        <AvatarImage src="/avatars/eden-ai.png" alt="Eden AI" />
        <AvatarFallback className="bg-yellow-400">🌿</AvatarFallback>
      </Avatar>

      <div className="bg-white px-5 py-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100">
        <div className="flex gap-1.5">
          <span
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: '0ms', animationDuration: '1.4s' }}
          />
          <span
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: '200ms', animationDuration: '1.4s' }}
          />
          <span
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: '400ms', animationDuration: '1.4s' }}
          />
        </div>
      </div>
    </div>
  );
}
```

### 1.6 Input Box Component (Complete)

```tsx
// renderer/components/chat/InputBox.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Paperclip, Send, Smile, Search, Settings } from 'lucide-react';
import { useAI } from '@/hooks/useAI';
import { useVoice } from '@/hooks/useVoice';
import { cn } from '@/lib/utils';
import EmojiPicker from 'emoji-picker-react';

export function InputBox() {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { sendMessage, isProcessing } = useAI();
  const { startRecording, stopRecording, isSupported: isVoiceSupported } = useVoice();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSend = async () => {
    if (!message.trim() || isProcessing) return;

    const messageToSend = message;
    setMessage('');

    await sendMessage(messageToSend);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceClick = async () => {
    if (!isVoiceSupported) {
      alert('Voice input is not supported on this device');
      return;
    }

    if (isRecording) {
      const transcription = await stopRecording();
      setMessage(prev => prev + (prev ? ' ' : '') + transcription);
      setIsRecording(false);
    } else {
      await startRecording();
      setIsRecording(true);
    }
  };

  const handleEmojiClick = (emojiObject: any) => {
    setMessage(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleFileAttach = async () => {
    const result = await window.electronAPI.selectFile();
    if (result.filePath) {
      // Handle file attachment
      console.log('File selected:', result.filePath);
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700">
      <div className="flex items-end gap-2 p-4">
        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="메시지를 입력하세요... Type a message..."
            disabled={isProcessing || isRecording}
            className={cn(
              'w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl resize-none',
              'focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent',
              'dark:bg-gray-800 dark:border-gray-600 dark:text-white',
              'disabled:bg-gray-50 disabled:cursor-not-allowed',
              'transition-all'
            )}
            rows={1}
            maxLength={4000}
          />

          {/* Voice Button (inside input) */}
          {isVoiceSupported && (
            <button
              onClick={handleVoiceClick}
              disabled={isProcessing}
              className={cn(
                'absolute right-3 top-3 p-2 rounded-full transition-all',
                isRecording
                  ? 'bg-red-500 text-white animate-pulse scale-110'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              )}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            >
              <Mic className="w-5 h-5" />
            </button>
          )}

          {/* Character count */}
          {message.length > 3500 && (
            <div className={cn(
              'absolute bottom-2 left-3 text-xs',
              message.length >= 4000 ? 'text-red-500' : 'text-gray-400'
            )}>
              {message.length}/4000
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFileAttach}
            disabled={isProcessing}
            aria-label="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={isProcessing}
              aria-label="Insert emoji"
            >
              <Smile className="w-5 h-5" />
            </Button>

            {showEmojiPicker && (
              <div className="absolute bottom-12 right-0 z-50">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </div>

          <Button
            onClick={handleSend}
            disabled={!message.trim() || isProcessing}
            className={cn(
              'bg-yellow-400 hover:bg-yellow-500 text-gray-900',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all'
            )}
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="px-4 pb-3 flex items-center gap-2 text-red-500 animate-fade-in">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium">Recording... Click mic to stop</span>
        </div>
      )}
    </div>
  );
}
```

### 1.7 Scroll Behavior

```typescript
// hooks/useAutoScroll.ts

import { useEffect, useRef } from 'react';

export function useAutoScroll(messages: Message[]) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);

  // Detect user scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

      userScrolledUp.current = !isNearBottom;
    };

    scrollRef.current?.addEventListener('scroll', handleScroll);
    return () => scrollRef.current?.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (!userScrolledUp.current && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  return scrollRef;
}
```

---

## 2. Design System & Theme

### 2.1 Complete Color Palette

```javascript
// tailwind.config.js

module.exports = {
  theme: {
    extend: {
      colors: {
        // KakaoTalk Yellow (Primary)
        kakao: {
          50: '#FEF9E7',
          100: '#FEF3CE',
          200: '#FDE89D',
          300: '#FCDC6C',
          400: '#FAE100',  // Main KakaoTalk yellow
          500: '#E1CA00',
          600: '#B8A600',
          700: '#8F8100',
          800: '#665C00',
          900: '#3D3700',
        },

        // Warm Neutral
        warm: {
          50: '#FAFAF9',   // Background primary (light)
          100: '#F5F5F4',  // Background secondary
          200: '#E7E5E4',  // Border light / Chat bg
          300: '#D6D3D1',  // Border default
          400: '#A8A29E',  // Text muted
          500: '#78716C',  // Text secondary
          600: '#57534E',  // Text primary (dark mode)
          700: '#44403C',  // Background secondary (dark)
          800: '#292524',  // Background primary (dark)
          900: '#1C1917',  // Deepest dark
        },

        // Semantic Colors
        success: {
          light: '#86EFAC',
          DEFAULT: '#22C55E',
          dark: '#16A34A',
        },
        error: {
          light: '#FCA5A5',
          DEFAULT: '#EF4444',
          dark: '#DC2626',
        },
        warning: {
          light: '#FDE047',
          DEFAULT: '#EAB308',
          dark: '#CA8A04',
        },
        info: {
          light: '#93C5FD',
          DEFAULT: '#3B82F6',
          dark: '#2563EB',
        },
      },

      // Custom animations
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in',
        'fade-out': 'fadeOut 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-subtle': 'pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.95' },
        },
      },

      // Border radius
      borderRadius: {
        'kakao': '1.5rem', // 24px - KakaoTalk bubble radius
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
};
```

### 2.2 Typography System

```css
/* styles/typography.css */

@import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@300;400;500;600;700&display=swap');

:root {
  /* Font Family */
  --font-sans: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI',
                system-ui, sans-serif;
  --font-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;

  /* Font Sizes */
  --text-xs: 0.75rem;      /* 12px */
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px */
  --text-2xl: 1.5rem;      /* 24px */
  --text-3xl: 1.875rem;    /* 30px */
  --text-4xl: 2.25rem;     /* 36px */

  /* Line Heights */
  --leading-none: 1;
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;

  /* Font Weights */
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* Letter Spacing */
  --tracking-tighter: -0.05em;
  --tracking-tight: -0.025em;
  --tracking-normal: 0em;
  --tracking-wide: 0.025em;
  --tracking-wider: 0.05em;
}

body {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  font-weight: var(--font-normal);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Headings */
h1 {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
}
h2 {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
}
h3 {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-snug);
}
h4 {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-snug);
}

/* Code */
code {
  font-family: var(--font-mono);
  font-size: 0.9em;
}

pre {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}
```

### 2.3 Dark Mode Implementation

```typescript
// renderer/providers/ThemeProvider.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  effectiveTheme: 'light',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') as Theme || 'system';
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;

    const updateTheme = (newTheme: 'light' | 'dark') => {
      root.classList.remove('light', 'dark');
      root.classList.add(newTheme);
      setEffectiveTheme(newTheme);
    };

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      updateTheme(systemTheme);

      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        updateTheme(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      updateTheme(theme);
    }

    // Save theme
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

### 2.4 Dark Mode Colors

```css
/* styles/dark-mode.css */

.dark {
  /* Background */
  --bg-primary: #1C1917;
  --bg-secondary: #292524;
  --bg-tertiary: #44403C;
  --bg-chat: #292524;

  /* Text */
  --text-primary: #FAFAF9;
  --text-secondary: #D6D3D1;
  --text-muted: #A8A29E;

  /* Bubbles */
  --bubble-ai: #44403C;
  --bubble-ai-border: #57534E;
  --bubble-user: #B8A600;  /* Darker yellow for dark mode */

  /* Borders */
  --border-light: #44403C;
  --border-default: #57534E;

  /* Interactive */
  --interactive-hover: #3D3700;
  --interactive-active: #8F8100;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
}

/* Smooth transition */
* {
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}
```

---

## 3. Internationalization (i18n)

### 3.1 Complete i18n Setup

```typescript
// renderer/i18n/config.ts

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

import en from './locales/en.json';
import ko from './locales/ko.json';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ko: { translation: ko },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ko'],

    interpolation: {
      escapeValue: false, // React already escapes
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;
```

### 3.2 Complete Translation Files

**Korean (ko.json)**:

```json
{
  "app": {
    "name": "가든 오브 에덴",
    "tagline": "당신의 AI 친구",
    "version": "버전 {{version}}"
  },

  "chat": {
    "input_placeholder": "메시지를 입력하세요...",
    "typing": "입력 중...",
    "voice_recording": "음성 녹음 중...",
    "send": "전송",
    "attach_file": "파일 첨부",
    "emoji": "이모티콘",
    "search": "검색",
    "settings": "설정",
    "new_conversation": "새 대화",
    "read": "읽음",
    "empty_state_title": "새로운 대화를 시작하세요",
    "empty_state_subtitle": "무엇을 도와드릴까요?"
  },

  "settings": {
    "title": "설정",
    "general": "일반",
    "persona": "페르소나",
    "privacy": "개인정보",
    "advanced": "고급",
    "about": "정보",

    "language": "언어",
    "language_english": "English",
    "language_korean": "한국어",

    "theme": "테마",
    "theme_light": "라이트",
    "theme_dark": "다크",
    "theme_system": "시스템",

    "voice": "음성",
    "voice_enabled": "음성 입력 활성화",
    "voice_output_enabled": "음성 출력 활성화",
    "voice_speed": "음성 속도",

    "screen_capture": "화면 캡처",
    "screen_capture_enabled": "화면 캡처 활성화",
    "screen_capture_warning": "AI가 화면을 볼 수 있습니다",
    "screen_capture_frequency": "캡처 빈도 (초)",

    "mode": "모드",
    "mode_user_led": "사용자 주도",
    "mode_ai_led": "AI 주도",
    "mode_description_user": "AI가 요청시에만 응답합니다",
    "mode_description_ai": "AI가 능동적으로 제안하고 도움을 줍니다"
  },

  "persona": {
    "title": "페르소나 설정",
    "description": "AI의 성격을 커스터마이즈하세요",
    "current_persona": "현재 페르소나",

    "warmth": "친근함",
    "warmth_description": "차가움 ← → 따뜻함",

    "formality": "격식",
    "formality_description": "격의없음 ← → 격식있음",

    "humor": "유머",
    "humor_description": "진지함 ← → 유머러스",

    "verbosity": "말수",
    "verbosity_description": "간결함 ← → 자세함",

    "proactivity": "적극성",
    "proactivity_description": "수동적 ← → 능동적",

    "creativity": "창의성",
    "creativity_description": "보수적 ← → 창의적",

    "empathy": "공감",
    "empathy_description": "논리적 ← → 공감적",

    "directness": "직설성",
    "directness_description": "완곡함 ← → 직설적",

    "reset": "기본값으로 재설정",
    "save": "저장",
    "saved": "저장되었습니다"
  },

  "notifications": {
    "title": "알림",
    "proactive_enabled": "능동적 알림 활성화",
    "sound_enabled": "소리 활성화",
    "desktop_notifications": "데스크톱 알림",
    "notification_center": "알림 센터"
  },

  "history": {
    "title": "대화 기록",
    "search_placeholder": "대화 검색...",
    "filter_all": "전체",
    "filter_today": "오늘",
    "filter_week": "이번 주",
    "filter_month": "이번 달",
    "no_results": "검색 결과가 없습니다",
    "messages_count": "{{count}}개 메시지",
    "delete": "삭제",
    "delete_confirm": "이 대화를 삭제하시겠습니까?"
  },

  "errors": {
    "generic": "오류가 발생했습니다",
    "network": "네트워크 오류",
    "ai_unavailable": "AI 모델을 사용할 수 없습니다",
    "voice_not_supported": "이 기기에서 음성 입력을 지원하지 않습니다",
    "file_too_large": "파일이 너무 큽니다 (최대 {{size}}MB)",
    "retry": "다시 시도",
    "dismiss": "닫기"
  },

  "keyboard_shortcuts": {
    "title": "키보드 단축키",
    "new_conversation": "새 대화",
    "search": "검색",
    "settings": "설정",
    "toggle_voice": "음성 입력 토글",
    "send_message": "메시지 전송"
  }
}
```

**English (en.json)**:

```json
{
  "app": {
    "name": "Garden of Eden",
    "tagline": "Your AI Companion",
    "version": "Version {{version}}"
  },

  "chat": {
    "input_placeholder": "Type a message...",
    "typing": "Typing...",
    "voice_recording": "Recording voice...",
    "send": "Send",
    "attach_file": "Attach file",
    "emoji": "Emoji",
    "search": "Search",
    "settings": "Settings",
    "new_conversation": "New conversation",
    "read": "Read",
    "empty_state_title": "Start a new conversation",
    "empty_state_subtitle": "How can I help you today?"
  },

  "settings": {
    "title": "Settings",
    "general": "General",
    "persona": "Persona",
    "privacy": "Privacy",
    "advanced": "Advanced",
    "about": "About",

    "language": "Language",
    "language_english": "English",
    "language_korean": "한국어",

    "theme": "Theme",
    "theme_light": "Light",
    "theme_dark": "Dark",
    "theme_system": "System",

    "voice": "Voice",
    "voice_enabled": "Enable voice input",
    "voice_output_enabled": "Enable voice output",
    "voice_speed": "Voice speed",

    "screen_capture": "Screen Capture",
    "screen_capture_enabled": "Enable screen capture",
    "screen_capture_warning": "AI will be able to see your screen",
    "screen_capture_frequency": "Capture frequency (seconds)",

    "mode": "Mode",
    "mode_user_led": "User-Led",
    "mode_ai_led": "AI-Led",
    "mode_description_user": "AI responds only when asked",
    "mode_description_ai": "AI proactively suggests and helps"
  },

  "persona": {
    "title": "Persona Settings",
    "description": "Customize your AI's personality",
    "current_persona": "Current Persona",

    "warmth": "Warmth",
    "warmth_description": "Cold ← → Warm",

    "formality": "Formality",
    "formality_description": "Casual ← → Formal",

    "humor": "Humor",
    "humor_description": "Serious ← → Playful",

    "verbosity": "Verbosity",
    "verbosity_description": "Concise ← → Detailed",

    "proactivity": "Proactivity",
    "proactivity_description": "Reactive ← → Proactive",

    "creativity": "Creativity",
    "creativity_description": "Conservative ← → Creative",

    "empathy": "Empathy",
    "empathy_description": "Logical ← → Empathetic",

    "directness": "Directness",
    "directness_description": "Indirect ← → Direct",

    "reset": "Reset to defaults",
    "save": "Save",
    "saved": "Saved successfully"
  },

  "notifications": {
    "title": "Notifications",
    "proactive_enabled": "Enable proactive notifications",
    "sound_enabled": "Enable sound",
    "desktop_notifications": "Desktop notifications",
    "notification_center": "Notification Center"
  },

  "history": {
    "title": "Conversation History",
    "search_placeholder": "Search conversations...",
    "filter_all": "All time",
    "filter_today": "Today",
    "filter_week": "This week",
    "filter_month": "This month",
    "no_results": "No results found",
    "messages_count": "{{count}} messages",
    "delete": "Delete",
    "delete_confirm": "Are you sure you want to delete this conversation?"
  },

  "errors": {
    "generic": "An error occurred",
    "network": "Network error",
    "ai_unavailable": "AI model unavailable",
    "voice_not_supported": "Voice input is not supported on this device",
    "file_too_large": "File is too large (max {{size}}MB)",
    "retry": "Retry",
    "dismiss": "Dismiss"
  },

  "keyboard_shortcuts": {
    "title": "Keyboard Shortcuts",
    "new_conversation": "New conversation",
    "search": "Search",
    "settings": "Settings",
    "toggle_voice": "Toggle voice input",
    "send_message": "Send message"
  }
}
```

### 3.3 Usage in Components

```tsx
// renderer/pages/Chat.tsx

import { useTranslation } from 'react-i18next';

export function Chat() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div>
      <h1>{t('app.name')}</h1>
      <p>{t('app.tagline')}</p>

      <input
        placeholder={t('chat.input_placeholder')}
      />

      <button onClick={() => changeLanguage('ko')}>
        {t('settings.language_korean')}
      </button>
      <button onClick={() => changeLanguage('en')}>
        {t('settings.language_english')}
      </button>
    </div>
  );
}
```

---

(This file continues with remaining sections 4-10, but I'll save it now and continue appending in the next response to avoid exceeding token limits)

## 4. Voice Input/Output UI

### 4.1 Voice Recording Button (Complete)

```tsx
// renderer/components/voice/VoiceRecordButton.tsx

import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface VoiceRecordButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function VoiceRecordButton({
  isRecording,
  isProcessing,
  onToggle,
  disabled = false
}: VoiceRecordButtonProps) {
  const [audioLevel, setAudioLevel] = useState(0);

  // Simulate audio level (in real app, get from microphone)
  useEffect(() => {
    if (!isRecording) {
      setAudioLevel(0);
      return;
    }

    const interval = setInterval(() => {
      setAudioLevel(Math.random() * 100);
    }, 100);

    return () => clearInterval(interval);
  }, [isRecording]);

  return (
    <button
      onClick={onToggle}
      disabled={disabled || isProcessing}
      className={cn(
        'relative p-4 rounded-full transition-all duration-200',
        'focus:outline-none focus:ring-4 focus:ring-offset-2',
        isRecording && 'bg-red-500 text-white scale-110 shadow-lg',
        !isRecording && !isProcessing && 'bg-gray-200 text-gray-700 hover:bg-gray-300',
        isProcessing && 'bg-gray-300 cursor-wait',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
    >
      {isProcessing ? (
        <Loader2 className="w-6 h-6 animate-spin" />
      ) : isRecording ? (
        <>
          <MicOff className="w-6 h-6" />
          {/* Audio level indicator */}
          <div className="absolute inset-0 rounded-full border-4 border-white animate-ping" style={{
            animationDuration: '1s',
            opacity: audioLevel / 200
          }} />
        </>
      ) : (
        <Mic className="w-6 h-6" />
      )}
    </button>
  );
}
```

### 4.2 Waveform Visualization

```tsx
// renderer/components/voice/WaveformVisualizer.tsx

import { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
  audioData: number[];  // 0-255 values
  isActive: boolean;
}

export function WaveformVisualizer({ audioData, isActive }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isActive || audioData.length === 0) return;

    // Draw waveform bars
    const barWidth = canvas.width / audioData.length;
    const barGap = 2;

    audioData.forEach((value, index) => {
      const barHeight = (value / 255) * canvas.height * 0.8;
      const x = index * barWidth;
      const y = (canvas.height - barHeight) / 2;

      // Gradient fill
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, '#FAE100');
      gradient.addColorStop(1, '#E1CA00');

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth - barGap, barHeight);

      // Add glow effect
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#FAE100';
    });
  }, [audioData, isActive]);

  return (
    <div className="relative w-full h-16 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        width={600}
        height={64}
        className="w-full h-full"
      />
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <Mic className="w-8 h-8" />
        </div>
      )}
    </div>
  );
}
```

### 4.3 TTS Playback Control

```tsx
// renderer/components/voice/TTSPlayer.tsx

import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Slider } from '@/components/ui/slider';

interface TTSPlayerProps {
  text: string;
  autoPlay?: boolean;
  onComplete?: () => void;
}

export function TTSPlayer({ text, autoPlay = false, onComplete }: TTSPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [progress, setProgress] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (autoPlay && text) {
      play();
    }
  }, [text, autoPlay]);

  const play = async () => {
    if (!text) return;

    // Use Web Speech API or call IPC for better quality
    const audioBuffer = await window.electronAPI.aiSpeak({
      text,
      voice: 'female',  // or from settings
    });

    // Play audio
    const audio = new Audio();
    audio.src = URL.createObjectURL(new Blob([audioBuffer], { type: 'audio/wav' }));
    audio.volume = isMuted ? 0 : volume;

    audio.addEventListener('timeupdate', () => {
      setProgress((audio.currentTime / audio.duration) * 100);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setProgress(0);
      onComplete?.();
    });

    audio.play();
    setIsPlaying(true);
  };

  const pause = () => {
    // Implement pause
    setIsPlaying(false);
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
      {/* Play/Pause */}
      <button
        onClick={isPlaying ? pause : play}
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition"
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </button>

      {/* Progress Bar */}
      <div className="flex-1">
        <div className="h-1 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Volume Control */}
      <button
        onClick={() => setIsMuted(!isMuted)}
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition"
      >
        {isMuted ? (
          <VolumeX className="w-4 h-4" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
      </button>

      <div className="w-24">
        <Slider
          value={[isMuted ? 0 : volume * 100]}
          onValueChange={([v]) => {
            setVolume(v / 100);
            setIsMuted(v === 0);
          }}
          max={100}
          step={1}
        />
      </div>
    </div>
  );
}
```

---

## 5. Dual Mode: User-Led vs AI-Led

### 5.1 Mode Switcher Component (Complete)

```tsx
// renderer/components/ModeSwitcher.tsx

import { User, Sparkles } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export function ModeSwitcher() {
  const { t } = useTranslation();
  const { mode, setMode } = useSettingsStore();

  return (
    <div className="inline-flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <button
        onClick={() => setMode('user-led')}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
          mode === 'user-led'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        )}
      >
        <User className="w-4 h-4" />
        <span>{t('settings.mode_user_led')}</span>
      </button>

      <button
        onClick={() => setMode('ai-led')}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
          mode === 'ai-led'
            ? 'bg-yellow-400 text-gray-900 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        )}
      >
        <Sparkles className="w-4 h-4" />
        <span>{t('settings.mode_ai_led')}</span>
      </button>
    </div>
  );
}
```

### 5.2 Mode Behavior Implementation

```typescript
// main/services/proactive/proactive-manager.ts

export class ProactiveManager {
  private mode: 'user-led' | 'ai-led' = 'user-led';
  private enabled = false;

  setMode(mode: 'user-led' | 'ai-led') {
    this.mode = mode;
    this.enabled = mode === 'ai-led';

    if (this.enabled) {
      this.startMonitoring();
    } else {
      this.stopMonitoring();
    }
  }

  private startMonitoring() {
    // Monitor git status every 5 minutes
    setInterval(() => this.checkGitStatus(), 5 * 60 * 1000);

    // Monitor calendar every 10 minutes
    setInterval(() => this.checkUpcomingEvents(), 10 * 60 * 1000);

    // Monitor workspace every 2 minutes
    setInterval(() => this.checkWorkspaceChanges(), 2 * 60 * 1000);
  }

  private stopMonitoring() {
    // Clear all intervals
  }

  private async checkGitStatus() {
    const status = await gitService.getStatus();

    if (status.modified.length > 5) {
      this.sendNotification({
        type: 'git-uncommitted',
        title: 'Uncommitted Changes',
        message: `You have ${status.modified.length} modified files. Would you like to create a commit?`,
        actions: [
          { label: 'Create commit', action: 'git-commit' },
          { label: 'Not now', action: 'dismiss' },
        ],
      });
    }
  }

  private async checkUpcomingEvents() {
    const events = await calendarService.getUpcomingEvents(30); // 30 min

    if (events.length > 0) {
      const event = events[0];
      this.sendNotification({
        type: 'calendar-reminder',
        title: 'Upcoming Event',
        message: `"${event.title}" starts in ${formatDuration(event.start)}`,
        actions: [
          { label: 'Prepare', action: 'calendar-prepare' },
          { label: 'Snooze', action: 'snooze' },
        ],
      });
    }
  }
}
```

---

## 6. Proactive Notifications

### 6.1 Notification Component (Complete)

```tsx
// renderer/components/notifications/ProactiveNotification.tsx

import { X, CheckCircle, Sparkles, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type NotificationType = 'success' | 'info' | 'warning' | 'error' | 'proactive';

interface ProactiveNotificationProps {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }>;
  onDismiss: () => void;
  autoClose?: number;  // ms
}

export function ProactiveNotification({
  id,
  type,
  title,
  message,
  actions,
  onDismiss,
  autoClose,
}: ProactiveNotificationProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 200); // Animation duration
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    proactive: <Sparkles className="w-5 h-5 text-yellow-500" />,
  };

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4',
        'border border-gray-200 dark:border-gray-700',
        'transition-all duration-200',
        isExiting ? 'animate-slide-out-right opacity-0' : 'animate-slide-in-right'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {icons[type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            {message}
          </p>

          {/* Actions */}
          {actions && actions.length > 0 && (
            <div className="flex gap-2">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    action.onClick();
                    handleDismiss();
                  }}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    action.variant === 'primary' && 'bg-yellow-400 hover:bg-yellow-500 text-gray-900',
                    action.variant === 'danger' && 'bg-red-500 hover:bg-red-600 text-white',
                    (!action.variant || action.variant === 'secondary') &&
                      'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar for auto-close */}
      {autoClose && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-b-xl overflow-hidden">
          <div
            className="h-full bg-yellow-400 animate-shrink-width"
            style={{ animationDuration: `${autoClose}ms` }}
          />
        </div>
      )}
    </div>
  );
}
```

### 6.2 Notification Scenarios (10 Examples)

```typescript
// Scenario 1: Git Uncommitted Changes
{
  type: 'proactive',
  title: 'Uncommitted Changes Detected',
  message: 'You have 3 modified files in your git repository. Would you like me to create a commit?',
  actions: [
    { label: 'Create Commit', onClick: handleGitCommit, variant: 'primary' },
    { label: 'Review Changes', onClick: handleGitDiff, variant: 'secondary' },
    { label: 'Not Now', onClick: handleDismiss, variant: 'secondary' },
  ]
}

// Scenario 2: Upcoming Meeting
{
  type: 'info',
  title: 'Meeting in 15 Minutes',
  message: 'Team standup starts at 2:00 PM. Would you like me to prepare a summary of your recent work?',
  actions: [
    { label: 'Prepare Summary', onClick: handlePrepareSummary, variant: 'primary' },
    { label: 'Snooze 5min', onClick: handleSnooze, variant: 'secondary' },
  ]
}

// Scenario 3: Optimal Focus Time
{
  type: 'proactive',
  title: 'Optimal Coding Time Available',
  message: 'You have a 2.5 hour free block from 11:00-13:30. Perfect for deep work on your React project!',
  actions: [
    { label: 'Start Focus Mode', onClick: handleFocusMode, variant: 'primary' },
    { label: 'Remind Me Later', onClick: handleRemindLater, variant: 'secondary' },
  ]
}

// Scenario 4: Long Coding Session
{
  type: 'warning',
  title: 'Take a Break',
  message: "You've been coding for 2 hours straight. Research shows breaks improve productivity and prevent burnout.",
  actions: [
    { label: 'Take 5min Break', onClick: handleBreak, variant: 'primary' },
    { label: 'Remind in 30min', onClick: handleSnooze30, variant: 'secondary' },
  ]
}

// Scenario 5: Build Failure
{
  type: 'error',
  title: 'Build Failed',
  message: 'Your last build failed with 3 TypeScript errors. Would you like me to analyze them?',
  actions: [
    { label: 'Show Errors', onClick: handleShowErrors, variant: 'danger' },
    { label: 'Dismiss', onClick: handleDismiss, variant: 'secondary' },
  ]
}

// Scenario 6: Dependency Update
{
  type: 'info',
  title: 'Dependencies Outdated',
  message: '5 npm packages have updates available. Would you like to review them?',
  actions: [
    { label: 'Show Updates', onClick: handleShowUpdates, variant: 'primary' },
    { label: 'Update All', onClick: handleUpdateAll, variant: 'secondary' },
    { label: 'Ignore', onClick: handleDismiss, variant: 'secondary' },
  ]
}

// Scenario 7: Code Quality Suggestion
{
  type: 'proactive',
  title: 'Code Quality Improvement',
  message: 'I noticed repeated code in UserService.ts and AuthService.ts. Would you like me to suggest a refactor?',
  actions: [
    { label: 'Show Suggestion', onClick: handleShowSuggestion, variant: 'primary' },
    { label: 'Not Now', onClick: handleDismiss, variant: 'secondary' },
  ]
}

// Scenario 8: Screen Time
{
  type: 'warning',
  title: 'Screen Time Alert',
  message: "You've been working for 6 hours today. Consider wrapping up for a healthy work-life balance.",
  actions: [
    { label: 'Create End-of-Day Summary', onClick: handleEODSummary, variant: 'primary' },
    { label: 'Keep Working', onClick: handleDismiss, variant: 'secondary' },
  ]
}

// Scenario 9: Learning Opportunity
{
  type: 'info',
  title: 'Learning Opportunity',
  message: "You've used Array.map() 15 times today. Did you know about Array.flatMap() for nested arrays?",
  actions: [
    { label: 'Learn More', onClick: handleLearnMore, variant: 'primary' },
    { label: 'Got It', onClick: handleDismiss, variant: 'secondary' },
  ]
}

// Scenario 10: Achievement Unlocked
{
  type: 'success',
  title: '🎉 Milestone Achieved!',
  message: "You've completed 50 commits this week! Great job on staying productive.",
  actions: [
    { label: 'View Stats', onClick: handleViewStats, variant: 'primary' },
  ],
  autoClose: 5000
}
```

### 6.3 Notification Manager

```typescript
// stores/notificationStore.ts

import { create } from 'zustand';

interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error' | 'proactive';
  title: string;
  message: string;
  actions?: any[];
  timestamp: Date;
}

interface NotificationStore {
  notifications: Notification[];
  add: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],

  add: (notification) => set((state) => ({
    notifications: [...state.notifications, {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }],
  })),

  remove: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id),
  })),

  clear: () => set({ notifications: [] }),
}));
```

---

## 7. Settings & Persona Configuration

### 7.1 Settings Screen (Complete)

```tsx
// renderer/pages/Settings.tsx

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneralSettings } from '@/components/settings/GeneralSettings';
import { PersonaSettings } from '@/components/settings/PersonaSettings';
import { PrivacySettings } from '@/components/settings/PrivacySettings';
import { AdvancedSettings } from '@/components/settings/AdvancedSettings';
import { AboutSettings } from '@/components/settings/AboutSettings';
import { useTranslation } from 'react-i18next';
import { Settings as SettingsIcon } from 'lucide-react';

export function Settings() {
  const { t } = useTranslation();

  return (
    <div className="max-w-5xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="w-8 h-8 text-yellow-500" />
        <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid grid-cols-5 w-full mb-8">
          <TabsTrigger value="general">{t('settings.general')}</TabsTrigger>
          <TabsTrigger value="persona">{t('settings.persona')}</TabsTrigger>
          <TabsTrigger value="privacy">{t('settings.privacy')}</TabsTrigger>
          <TabsTrigger value="advanced">{t('settings.advanced')}</TabsTrigger>
          <TabsTrigger value="about">{t('settings.about')}</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="persona" className="space-y-6">
          <PersonaSettings />
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <PrivacySettings />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <AdvancedSettings />
        </TabsContent>

        <TabsContent value="about" className="space-y-6">
          <AboutSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 7.2 Persona Settings (Complete with All Parameters)

```tsx
// renderer/components/settings/PersonaSettings.tsx

import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { usePersonaStore } from '@/stores/personaStore';
import { useTranslation } from 'react-i18next';
import { RotateCcw, Save, Sparkles } from 'lucide-react';

export function PersonaSettings() {
  const { t } = useTranslation();
  const { persona, updatePersona, resetPersona, savePersona, isSaving } = usePersonaStore();

  const parameters = [
    {
      key: 'warmth',
      icon: '🤗',
      labels: ['Cold', 'Warm'],
    },
    {
      key: 'formality',
      icon: '👔',
      labels: ['Casual', 'Formal'],
    },
    {
      key: 'humor',
      icon: '😄',
      labels: ['Serious', 'Playful'],
    },
    {
      key: 'verbosity',
      icon: '💬',
      labels: ['Concise', 'Detailed'],
    },
    {
      key: 'proactivity',
      icon: '🚀',
      labels: ['Reactive', 'Proactive'],
    },
    {
      key: 'creativity',
      icon: '🎨',
      labels: ['Conservative', 'Creative'],
    },
    {
      key: 'empathy',
      icon: '❤️',
      labels: ['Logical', 'Empathetic'],
    },
    {
      key: 'directness',
      icon: '🎯',
      labels: ['Indirect', 'Direct'],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-semibold">{t('persona.title')}</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          {t('persona.description')}
        </p>
      </div>

      {/* Current Persona Preview */}
      <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-yellow-200 dark:border-gray-600">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <span>🌿</span>
          {t('persona.current_persona')}
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {getPersonaDescription(persona)}
        </p>
      </div>

      {/* Parameter Sliders */}
      <div className="grid gap-8">
        {parameters.map(param => (
          <div key={param.key} className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium">
                <span className="text-xl">{param.icon}</span>
                <span>{t(`persona.${param.key}`)}</span>
              </label>
              <span className="text-sm font-mono text-gray-500">
                {(persona[param.key] * 100).toFixed(0)}%
              </span>
            </div>

            <Slider
              value={[persona[param.key] * 100]}
              onValueChange={([value]) => updatePersona({ [param.key]: value / 100 })}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />

            <div className="flex justify-between text-xs text-gray-500">
              <span>{param.labels[0]}</span>
              <span>{param.labels[1]}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4 border-t dark:border-gray-700">
        <Button
          onClick={resetPersona}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          {t('persona.reset')}
        </Button>

        <Button
          onClick={savePersona}
          disabled={isSaving}
          className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : t('persona.save')}
        </Button>
      </div>
    </div>
  );
}

function getPersonaDescription(persona: PersonaParameters): string {
  const traits = [];

  if (persona.warmth > 0.7) traits.push('warm and friendly');
  if (persona.formality > 0.7) traits.push('professional');
  else if (persona.formality < 0.3) traits.push('casual');
  if (persona.humor > 0.7) traits.push('playful');
  if (persona.proactivity > 0.7) traits.push('proactive');
  if (persona.empathy > 0.7) traits.push('empathetic');

  return `A ${traits.join(', ')} AI assistant that adapts to your style.`;
}
```

---

(Continuing with sections 8-10...)


## 8. Conversation History

### 8.1 History Screen (Complete)

```tsx
// renderer/pages/History.tsx

import { useState, useEffect } from 'react';
import { Search, Calendar, Filter, Trash2, Download } from 'lucide-react';
import { ConversationCard } from '@/components/history/ConversationCard';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

type FilterPeriod = 'all' | 'today' | 'week' | 'month';

export function History() {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterPeriod>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, [filter]);

  const loadConversations = async () => {
    setLoading(true);
    const data = await window.electronAPI.getConversations({ filter });
    setConversations(data);
    setLoading(false);
  };

  const filteredConversations = conversations.filter(conv =>
    searchQuery === '' ||
    conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDelete = async (id: string) => {
    if (confirm(t('history.delete_confirm'))) {
      await window.electronAPI.deleteConversation(id);
      setConversations(conversations.filter(c => c.id !== id));
    }
  };

  const handleExport = async (id: string) => {
    await window.electronAPI.exportConversation(id);
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{t('history.title')}</h1>

        <div className="flex gap-2">
          <button
            onClick={() => setConversations([])}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-4 mb-6">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder={t('history.search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter by period */}
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterPeriod)}
          className="w-48"
        >
          <option value="all">{t('history.filter_all')}</option>
          <option value="today">{t('history.filter_today')}</option>
          <option value="week">{t('history.filter_week')}</option>
          <option value="month">{t('history.filter_month')}</option>
        </Select>
      </div>

      {/* Results count */}
      {!loading && (
        <div className="text-sm text-gray-500 mb-4">
          {filteredConversations.length} {filteredConversations.length === 1 ? 'conversation' : 'conversations'}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredConversations.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {searchQuery ? t('history.no_results') : 'No conversations yet'}
          </h3>
          <p className="text-gray-500">
            {searchQuery ? 'Try a different search term' : 'Start chatting to see your history here'}
          </p>
        </div>
      )}

      {/* Conversation List */}
      {!loading && filteredConversations.length > 0 && (
        <div className="space-y-4">
          {filteredConversations.map((conv) => (
            <ConversationCard
              key={conv.id}
              conversation={conv}
              onDelete={() => handleDelete(conv.id)}
              onExport={() => handleExport(conv.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 8.2 Conversation Card Component

```tsx
// renderer/components/history/ConversationCard.tsx

import { MessageCircle, Calendar, Trash2, Download, ChevronRight } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface ConversationCardProps {
  conversation: {
    id: string;
    title: string | null;
    createdAt: Date;
    messageCount: number;
    model: string;
    messages: Array<{ content: string }>;
  };
  onDelete: () => void;
  onExport: () => void;
}

export function ConversationCard({ conversation, onDelete, onExport }: ConversationCardProps) {
  const navigate = useNavigate();

  const getPreview = () => {
    const firstUserMessage = conversation.messages.find(m => m.role === 'user');
    return firstUserMessage?.content.slice(0, 150) || 'No messages';
  };

  return (
    <div
      className="group p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all cursor-pointer"
      onClick={() => navigate(`/chat/${conversation.id}`)}
    >
      <div className="flex items-start justify-between mb-2">
        {/* Title & Icon */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <MessageCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {conversation.title || 'Untitled conversation'}
          </h3>
        </div>

        {/* Actions (shown on hover) */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExport();
            }}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition"
            aria-label="Export"
          >
            <Download className="w-4 h-4 text-gray-500" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition"
            aria-label="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>

          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Preview */}
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
        {getPreview()}
      </p>

      {/* Metadata */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <MessageCircle className="w-3 h-3" />
          {conversation.messageCount} messages
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDistanceToNow(new Date(conversation.createdAt), { addSuffix: true })}
        </span>
        <span>•</span>
        <span className="text-gray-400">{conversation.model}</span>
      </div>
    </div>
  );
}
```

### 8.3 Search Algorithm

```typescript
// utils/search.ts

export function searchConversations(
  conversations: Conversation[],
  query: string
): Conversation[] {
  if (!query) return conversations;

  const lowercaseQuery = query.toLowerCase();

  return conversations.filter(conv => {
    // Search in title
    if (conv.title?.toLowerCase().includes(lowercaseQuery)) {
      return true;
    }

    // Search in messages
    if (conv.messages.some(m => m.content.toLowerCase().includes(lowercaseQuery))) {
      return true;
    }

    // Search by date
    const dateStr = format(new Date(conv.createdAt), 'PPP').toLowerCase();
    if (dateStr.includes(lowercaseQuery)) {
      return true;
    }

    return false;
  });
}

// Advanced: Fuzzy search with ranking
export function fuzzySearchConversations(
  conversations: Conversation[],
  query: string
): Array<{ conversation: Conversation; score: number }> {
  const results = conversations.map(conv => ({
    conversation: conv,
    score: calculateRelevanceScore(conv, query),
  }));

  return results
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

function calculateRelevanceScore(conv: Conversation, query: string): number {
  let score = 0;
  const lowercaseQuery = query.toLowerCase();

  // Title match (highest weight)
  if (conv.title?.toLowerCase().includes(lowercaseQuery)) {
    score += 10;
  }

  // Message match
  const messageMatches = conv.messages.filter(m =>
    m.content.toLowerCase().includes(lowercaseQuery)
  ).length;
  score += messageMatches * 2;

  // Recency bonus
  const daysSinceCreated = (Date.now() - new Date(conv.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreated < 7) score += 3;
  else if (daysSinceCreated < 30) score += 1;

  return score;
}
```

---

## 9. Keyboard Shortcuts & Accessibility

### 9.1 Complete Keyboard Shortcuts

```typescript
// hooks/useKeyboardShortcuts.ts

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl + K: Focus search
      if (modifier && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }

      // Cmd/Ctrl + N: New conversation
      if (modifier && e.key === 'n') {
        e.preventDefault();
        navigate('/chat/new');
      }

      // Cmd/Ctrl + ,: Open settings
      if (modifier && e.key === ',') {
        e.preventDefault();
        navigate('/settings');
      }

      // Cmd/Ctrl + H: Show history
      if (modifier && e.key === 'h') {
        e.preventDefault();
        navigate('/history');
      }

      // Cmd/Ctrl + Shift + V: Toggle voice input
      if (modifier && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        // Trigger voice input
        document.dispatchEvent(new CustomEvent('toggle-voice'));
      }

      // Cmd/Ctrl + /: Show keyboard shortcuts
      if (modifier && e.key === '/') {
        e.preventDefault();
        // Show shortcuts modal
        document.dispatchEvent(new CustomEvent('show-shortcuts'));
      }

      // Escape: Close modal/dismiss notification
      if (e.key === 'Escape') {
        document.dispatchEvent(new CustomEvent('close-modal'));
      }

      // Cmd/Ctrl + D: Toggle dark mode
      if (modifier && e.key === 'd') {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('toggle-theme'));
      }

      // Cmd/Ctrl + 1-5: Switch tabs (in settings)
      if (modifier && e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        const tabIndex = parseInt(e.key) - 1;
        document.dispatchEvent(new CustomEvent('switch-tab', { detail: { tabIndex } }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
}
```

### 9.2 Keyboard Shortcuts Reference

| Shortcut | Action | Context |
|----------|--------|---------|
| `Cmd+K` / `Ctrl+K` | Focus search | Global |
| `Cmd+N` / `Ctrl+N` | New conversation | Global |
| `Cmd+,` / `Ctrl+,` | Open settings | Global |
| `Cmd+H` / `Ctrl+H` | Show history | Global |
| `Cmd+Shift+V` | Toggle voice input | Chat |
| `Cmd+D` / `Ctrl+D` | Toggle dark mode | Global |
| `Cmd+/` / `Ctrl+/` | Show shortcuts | Global |
| `Cmd+1-5` / `Ctrl+1-5` | Switch setting tabs | Settings |
| `Enter` | Send message | Chat input |
| `Shift+Enter` | New line | Chat input |
| `Escape` | Close modal/notification | Global |
| `↑` / `↓` | Navigate history | Chat input (empty) |
| `Cmd+F` / `Ctrl+F` | Search in conversation | Chat |

### 9.3 Accessibility Implementation

```tsx
// Accessibility best practices

// 1. Semantic HTML
<main role="main" aria-label="Chat interface">
  <header role="banner">
    <h1>Garden of Eden</h1>
  </header>

  <nav role="navigation" aria-label="Main navigation">
    {/* Navigation items */}
  </nav>

  <article role="article" aria-label="Conversation">
    {/* Chat messages */}
  </article>
</main>

// 2. ARIA Labels
<button
  onClick={handleClick}
  aria-label="Send message"
  aria-describedby="send-button-description"
>
  <Send />
</button>

<span id="send-button-description" className="sr-only">
  Press Enter or click to send your message to the AI
</span>

// 3. Keyboard navigation
<div
  role="button"
  tabIndex={0}
  onKeyPress={(e) => e.key === 'Enter' && handleClick()}
  onClick={handleClick}
  aria-label="Action button"
>
  Click me
</div>

// 4. Focus management
const inputRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  inputRef.current?.focus();
}, []);

// 5. Screen reader announcements
<div role="status" aria-live="polite" className="sr-only">
  {statusMessage}
</div>

<div role="alert" aria-live="assertive" className="sr-only">
  {errorMessage}
</div>

// 6. Skip links
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>

// 7. Color contrast
// Ensure all text meets WCAG AA standards (4.5:1 ratio)
// Use tools like https://webaim.org/resources/contrastchecker/

// 8. Focus indicators
button:focus-visible {
  outline: 2px solid #FAE100;
  outline-offset: 2px;
}

// 9. Screen reader only class
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  padding: 0;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

### 9.4 Keyboard Shortcuts Modal

```tsx
// renderer/components/ShortcutsModal.tsx

import { Dialog } from '@/components/ui/dialog';
import { useEffect, useState } from 'react';

export function ShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifierKey = isMac ? '⌘' : 'Ctrl';

  useEffect(() => {
    const handleShow = () => setIsOpen(true);
    document.addEventListener('show-shortcuts', handleShow);
    return () => document.removeEventListener('show-shortcuts', handleShow);
  }, []);

  const shortcuts = [
    { keys: [`${modifierKey}`, 'K'], action: 'Focus search' },
    { keys: [`${modifierKey}`, 'N'], action: 'New conversation' },
    { keys: [`${modifierKey}`, ','], action: 'Open settings' },
    { keys: [`${modifierKey}`, 'H'], action: 'Show history' },
    { keys: [`${modifierKey}`, 'Shift', 'V'], action: 'Toggle voice input' },
    { keys: [`${modifierKey}`, 'D'], action: 'Toggle dark mode' },
    { keys: [`${modifierKey}`, '/'], action: 'Show this help' },
    { keys: ['Enter'], action: 'Send message' },
    { keys: ['Shift', 'Enter'], action: 'New line' },
    { keys: ['Esc'], action: 'Close modal' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Keyboard Shortcuts</h2>

        <div className="space-y-2">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300">{shortcut.action}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, i) => (
                  <kbd
                    key={i}
                    className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Dialog>
  );
}
```

---

## 10. System Tray & Window Management

### 10.1 System Tray Implementation

```typescript
// main/tray.ts

import { Tray, Menu, nativeImage, BrowserWindow, app } from 'electron';
import path from 'path';

export class TrayManager {
  private tray: Tray | null = null;
  private mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  create() {
    const iconPath = path.join(__dirname, '../resources/icons/tray-icon.png');
    const icon = nativeImage.createFromPath(iconPath);

    // Create tray with icon
    this.tray = new Tray(icon.resize({ width: 16, height: 16 }));

    // Build context menu
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show Garden of Eden',
        click: () => this.mainWindow.show(),
      },
      {
        label: 'New Conversation',
        accelerator: 'CmdOrCtrl+N',
        click: () => {
          this.mainWindow.show();
          this.mainWindow.webContents.send('new-conversation');
        },
      },
      { type: 'separator' },
      {
        label: 'Mode',
        submenu: [
          {
            label: 'User-Led',
            type: 'radio',
            click: () => this.setMode('user-led'),
          },
          {
            label: 'AI-Led',
            type: 'radio',
            click: () => this.setMode('ai-led'),
          },
        ],
      },
      { type: 'separator' },
      {
        label: 'Settings',
        accelerator: 'CmdOrCtrl+,',
        click: () => {
          this.mainWindow.show();
          this.mainWindow.webContents.send('navigate-to', '/settings');
        },
      },
      {
        label: 'History',
        accelerator: 'CmdOrCtrl+H',
        click: () => {
          this.mainWindow.show();
          this.mainWindow.webContents.send('navigate-to', '/history');
        },
      },
      { type: 'separator' },
      {
        label: 'Check for Updates',
        click: () => this.checkForUpdates(),
      },
      {
        label: 'About',
        click: () => this.showAbout(),
      },
      { type: 'separator' },
      {
        label: 'Quit',
        accelerator: 'CmdOrCtrl+Q',
        click: () => app.quit(),
      },
    ]);

    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip('Garden of Eden - Your AI Companion');

    // Click to show/hide window (Windows/Linux)
    this.tray.on('click', () => {
      if (this.mainWindow.isVisible()) {
        this.mainWindow.hide();
      } else {
        this.mainWindow.show();
      }
    });

    // Double-click to show window (macOS)
    this.tray.on('double-click', () => {
      this.mainWindow.show();
    });
  }

  updateIcon(status: 'idle' | 'processing' | 'recording') {
    if (!this.tray) return;

    const iconMap = {
      idle: 'tray-icon.png',
      processing: 'tray-icon-processing.png',
      recording: 'tray-icon-recording.png',
    };

    const iconPath = path.join(__dirname, `../resources/icons/${iconMap[status]}`);
    const icon = nativeImage.createFromPath(iconPath);

    this.tray.setImage(icon.resize({ width: 16, height: 16 }));
  }

  updateTooltip(message: string) {
    if (!this.tray) return;
    this.tray.setToolTip(message);
  }

  private setMode(mode: 'user-led' | 'ai-led') {
    this.mainWindow.webContents.send('set-mode', mode);
  }

  private checkForUpdates() {
    // Trigger auto-updater
    this.mainWindow.webContents.send('check-updates');
  }

  private showAbout() {
    this.mainWindow.show();
    this.mainWindow.webContents.send('show-about');
  }

  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}
```

### 10.2 Window Management

```typescript
// main/window-manager.ts

import { BrowserWindow, screen, app } from 'electron';
import path from 'path';
import Store from 'electron-store';

interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private store: Store;

  constructor() {
    this.store = new Store();
  }

  create(): BrowserWindow {
    // Get saved window bounds or use defaults
    const savedBounds = this.store.get('windowBounds') as WindowBounds | undefined;
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    const defaultBounds = {
      width: 1200,
      height: 800,
      x: (width - 1200) / 2,
      y: (height - 800) / 2,
    };

    const bounds = savedBounds || defaultBounds;

    this.mainWindow = new BrowserWindow({
      ...bounds,
      minWidth: 800,
      minHeight: 600,
      show: false, // Don't show until ready-to-show
      backgroundColor: '#FAFAF9',
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      frame: true,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(__dirname, 'preload.js'),
        devTools: !app.isPackaged,
      },
    });

    // Load URL
    if (app.isPackaged) {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    } else {
      this.mainWindow.loadURL('http://localhost:5173'); // Vite dev server
    }

    // Show when ready (prevents flash of white)
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
      this.mainWindow?.focus();
    });

    // Save window bounds on resize/move
    this.mainWindow.on('resize', () => this.saveBounds());
    this.mainWindow.on('move', () => this.saveBounds());

    // Handle close
    this.mainWindow.on('close', (e) => {
      if (process.platform === 'darwin') {
        // On macOS, hide instead of close
        e.preventDefault();
        this.mainWindow?.hide();
      } else {
        // On Windows/Linux, minimize to tray
        const minimizeToTray = this.store.get('minimizeToTray', true);
        if (minimizeToTray) {
          e.preventDefault();
          this.mainWindow?.hide();
        }
      }
    });

    // Cleanup on closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    return this.mainWindow;
  }

  private saveBounds() {
    if (!this.mainWindow) return;

    const bounds = this.mainWindow.getBounds();
    this.store.set('windowBounds', bounds);
  }

  restore() {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  toggleFullScreen() {
    if (this.mainWindow) {
      this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
    }
  }

  minimize() {
    if (this.mainWindow) {
      this.mainWindow.minimize();
    }
  }

  maximize() {
    if (this.mainWindow) {
      if (this.mainWindow.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow.maximize();
      }
    }
  }

  close() {
    if (this.mainWindow) {
      this.mainWindow.close();
    }
  }

  getWindow(): BrowserWindow | null {
    return this.mainWindow;
  }
}
```

### 10.3 macOS Dock Integration

```typescript
// main/dock.ts (macOS only)

import { app, Menu } from 'electron';

export class DockManager {
  setup() {
    if (process.platform !== 'darwin') return;

    // Set dock menu
    const dockMenu = Menu.buildFromTemplate([
      {
        label: 'New Conversation',
        click: () => {
          // Send event to main window
          const windows = BrowserWindow.getAllWindows();
          windows[0]?.webContents.send('new-conversation');
        },
      },
      {
        label: 'Show History',
        click: () => {
          const windows = BrowserWindow.getAllWindows();
          windows[0]?.webContents.send('navigate-to', '/history');
        },
      },
    ]);

    app.dock.setMenu(dockMenu);
  }

  setBadge(count: number) {
    if (process.platform !== 'darwin') return;

    if (count > 0) {
      app.dock.setBadge(count.toString());
    } else {
      app.dock.setBadge('');
    }
  }

  bounce(type: 'critical' | 'informational' = 'informational') {
    if (process.platform !== 'darwin') return;

    app.dock.bounce(type);
  }
}
```

### 10.4 Window Controls (Traffic Lights)

```tsx
// renderer/components/WindowControls.tsx (for frameless window)

import { Minimize, Maximize, X } from 'lucide-react';

export function WindowControls() {
  const handleMinimize = () => {
    window.electronAPI.windowMinimize();
  };

  const handleMaximize = () => {
    window.electronAPI.windowMaximize();
  };

  const handleClose = () => {
    window.electronAPI.windowClose();
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleMinimize}
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition"
        aria-label="Minimize"
      >
        <Minimize className="w-4 h-4" />
      </button>

      <button
        onClick={handleMaximize}
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition"
        aria-label="Maximize"
      >
        <Maximize className="w-4 h-4" />
      </button>

      <button
        onClick={handleClose}
        className="p-2 hover:bg-red-500 hover:text-white rounded-md transition"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
```

---

**End of Part 4 (EXPANDED)**

*Total Lines: ~2100*
*Status: Complete - Production Ready*

---

## Summary

Part 4 now includes **complete, production-ready implementations** for:

1. ✅ KakaoTalk-Style Chat Interface (with code highlighting, grouping, animations)
2. ✅ Design System & Theme (complete color palette, typography, dark mode)
3. ✅ Internationalization (Korean + English, complete translations)
4. ✅ Voice Input/Output UI (recording, waveform, TTS playback)
5. ✅ Dual Mode System (User-Led vs AI-Led with full logic)
6. ✅ Proactive Notifications (10 scenarios, complete component)
7. ✅ Settings & Persona Configuration (8 parameters with sliders)
8. ✅ Conversation History (search, filter, export, delete)
9. ✅ Keyboard Shortcuts & Accessibility (complete shortcuts, ARIA)
10. ✅ System Tray & Window Management (macOS + Windows support)

**Next step**: Replace old Part 4 in main spec file, then create API documentation.

# Part 5: Implementation & Data Models

## Table of Contents - Part 5

1. [SQLite Database Schema](#1-sqlite-database-schema)
2. [Data Models (TypeScript)](#2-data-models-typescript)
3. [Implementation Phases](#3-implementation-phases)
4. [Deployment & Distribution](#4-deployment--distribution)
5. [Testing Strategy](#5-testing-strategy)
6. [Performance Benchmarks](#6-performance-benchmarks)
7. [Security Checklist](#7-security-checklist)
8. [Known Limitations & Trade-offs](#8-known-limitations--trade-offs)
9. [Success Metrics](#9-success-metrics)
10. [Final Launch Checklist](#10-final-launch-checklist)

---

## 1. SQLite Database Schema

### 1.1 Database Architecture

**Why SQLite?**
- ✅ 100% local (no server)
- ✅ Zero-configuration
- ✅ Fast (ACID compliant)
- ✅ Embedded in app
- ✅ Small footprint

**Location**: `~/Library/Application Support/garden-of-eden/eden.db` (macOS)

### 1.2 Schema Design

```sql
-- schema.sql

-- Conversations
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  title TEXT,
  model TEXT NOT NULL DEFAULT 'llama-3.1-8b',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  message_count INTEGER NOT NULL DEFAULT 0,
  metadata JSON
);

CREATE INDEX idx_conversations_created ON conversations(created_at DESC);

-- Messages
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tokens INTEGER,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSON,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);

-- Persona Parameters
CREATE TABLE persona_parameters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  warmth REAL NOT NULL DEFAULT 0.7 CHECK(warmth BETWEEN 0 AND 1),
  formality REAL NOT NULL DEFAULT 0.5 CHECK(formality BETWEEN 0 AND 1),
  humor REAL NOT NULL DEFAULT 0.6 CHECK(humor BETWEEN 0 AND 1),
  verbosity REAL NOT NULL DEFAULT 0.5 CHECK(verbosity BETWEEN 0 AND 1),
  proactivity REAL NOT NULL DEFAULT 0.5 CHECK(proactivity BETWEEN 0 AND 1),
  creativity REAL NOT NULL DEFAULT 0.7 CHECK(creativity BETWEEN 0 AND 1),
  empathy REAL NOT NULL DEFAULT 0.8 CHECK(empathy BETWEEN 0 AND 1),
  directness REAL NOT NULL DEFAULT 0.6 CHECK(directness BETWEEN 0 AND 1),
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default persona
INSERT INTO persona_parameters (warmth, formality, humor, verbosity, proactivity, creativity, empathy, directness)
VALUES (0.7, 0.5, 0.6, 0.5, 0.5, 0.7, 0.8, 0.6);

-- Episodic Memory (RAG)
CREATE TABLE episodic_memory (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  user_message TEXT NOT NULL,
  assistant_response TEXT NOT NULL,
  embedding BLOB, -- Vector embedding (serialized)
  satisfaction_score REAL CHECK(satisfaction_score BETWEEN 0 AND 1),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE INDEX idx_memory_satisfaction ON episodic_memory(satisfaction_score DESC);

-- User Settings
CREATE TABLE user_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('string', 'number', 'boolean', 'json')),
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO user_settings (key, value, type) VALUES
  ('language', 'en', 'string'),
  ('theme', 'system', 'string'),
  ('voice_enabled', 'true', 'boolean'),
  ('screen_capture_enabled', 'false', 'boolean'),
  ('mode', 'user-led', 'string'),
  ('proactive_notifications', 'false', 'boolean');

-- Workspace Context
CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  root_path TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('nodejs', 'python', 'rust', 'go', 'java', 'generic')),
  git_repo TEXT,
  last_opened DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSON
);

CREATE INDEX idx_workspaces_last_opened ON workspaces(last_opened DESC);

-- Proactive Notifications History
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_taken TEXT, -- 'accepted', 'dismissed', 'ignored'
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  metadata JSON
);

CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

### 1.3 Migrations System

```typescript
// main/database/migrations.ts

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export class MigrationManager {
  constructor(private db: Database.Database) {}

  async runMigrations() {
    // Create migrations table if not exists
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationFiles = fs.readdirSync(path.join(__dirname, 'migrations'))
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const executed = this.db.prepare(
        'SELECT 1 FROM migrations WHERE name = ?'
      ).get(file);

      if (!executed) {
        const sql = fs.readFileSync(path.join(__dirname, 'migrations', file), 'utf-8');
        this.db.exec(sql);
        this.db.prepare('INSERT INTO migrations (name) VALUES (?)').run(file);
        console.log(`✅ Executed migration: ${file}`);
      }
    }
  }
}
```

---

## 2. Data Models (TypeScript)

### 2.1 Core Models

```typescript
// shared/types/models.ts

export interface Conversation {
  id: string;
  title: string | null;
  model: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  metadata?: Record<string, any>;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens?: number;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface PersonaParameters {
  warmth: number;        // 0-1: Cold → Warm
  formality: number;     // 0-1: Casual → Formal
  humor: number;         // 0-1: Serious → Playful
  verbosity: number;     // 0-1: Concise → Detailed
  proactivity: number;   // 0-1: Reactive → Proactive
  creativity: number;    // 0-1: Conservative → Creative
  empathy: number;       // 0-1: Logical → Empathetic
  directness: number;    // 0-1: Indirect → Direct
}

export interface EpisodicMemory {
  id: string;
  conversationId: string;
  userMessage: string;
  assistantResponse: string;
  embedding?: Float32Array;
  satisfactionScore?: number;
  createdAt: Date;
}

export interface Workspace {
  id: string;
  rootPath: string;
  name: string;
  type: 'nodejs' | 'python' | 'rust' | 'go' | 'java' | 'generic';
  gitRepo?: string;
  lastOpened: Date;
  metadata?: Record<string, any>;
}

export interface ProactiveNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  actionTaken?: 'accepted' | 'dismissed' | 'ignored';
  createdAt: Date;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}
```

### 2.2 Repository Pattern

```typescript
// main/database/repositories/conversation.repository.ts

import Database from 'better-sqlite3';
import { Conversation, Message } from '@/shared/types/models';

export class ConversationRepository {
  constructor(private db: Database.Database) {}

  create(conversation: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>): Conversation {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO conversations (id, title, model, created_at, updated_at, message_count, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      conversation.title || null,
      conversation.model,
      now,
      now,
      0,
      JSON.stringify(conversation.metadata || {})
    );

    return this.findById(id)!;
  }

  findById(id: string): Conversation | null {
    const row = this.db.prepare('SELECT * FROM conversations WHERE id = ?').get(id);
    return row ? this.mapRow(row) : null;
  }

  findAll(limit = 50, offset = 0): Conversation[] {
    const rows = this.db.prepare(`
      SELECT * FROM conversations
      ORDER BY updated_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    return rows.map(row => this.mapRow(row));
  }

  addMessage(conversationId: string, message: Omit<Message, 'id' | 'createdAt'>): Message {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO messages (id, conversation_id, role, content, tokens, created_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      conversationId,
      message.role,
      message.content,
      message.tokens || null,
      now,
      JSON.stringify(message.metadata || {})
    );

    // Update conversation message count and updated_at
    this.db.prepare(`
      UPDATE conversations
      SET message_count = message_count + 1, updated_at = ?
      WHERE id = ?
    `).run(now, conversationId);

    return {
      id,
      conversationId,
      role: message.role,
      content: message.content,
      tokens: message.tokens,
      createdAt: new Date(now),
      metadata: message.metadata,
    };
  }

  private mapRow(row: any): Conversation {
    return {
      id: row.id,
      title: row.title,
      model: row.model,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      messageCount: row.message_count,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    };
  }
}
```

---

## 3. Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal**: Basic Electron app with database

**Tasks**:
- ✅ Setup Electron + React + TypeScript project
- ✅ Configure Vite for renderer
- ✅ Setup SQLite database
- ✅ Create database schema and migrations
- ✅ Implement repository pattern
- ✅ Basic IPC communication
- ✅ Window management
- ✅ System tray

**Deliverable**: Empty Electron app that opens, stores data locally

---

### Phase 2: AI Integration (Week 3-4)

**Goal**: Local AI models working

**Tasks**:
- ✅ Download and setup llama.cpp
- ✅ Integrate Llama 3.1 8B model
- ✅ Integrate Whisper Large V3 for STT
- ✅ Setup system TTS
- ✅ Create AI service layer
- ✅ Implement streaming responses
- ✅ Test end-to-end conversation flow

**Deliverable**: Chat with local AI works

---

### Phase 3: UI/UX (Week 5-6)

**Goal**: Beautiful, functional UI

**Tasks**:
- ✅ Implement KakaoTalk-style chat interface
- ✅ Chat bubbles, typing indicator
- ✅ Input box with voice button
- ✅ Design system (colors, typography)
- ✅ Dark mode support
- ✅ i18n setup (Korean + English)
- ✅ Settings screen
- ✅ Conversation history

**Deliverable**: Polished UI that feels native

---

### Phase 4: System Integration (Week 7-8)

**Goal**: AI can access system

**Tasks**:
- ✅ File system integration
- ✅ Git integration
- ✅ Workspace detection
- ✅ Screen capture service
- ✅ Calendar integration (ICS)
- ✅ Webhook system
- ✅ Plugin architecture

**Deliverable**: AI can read files, commit code, see screen

---

### Phase 5: Learning System (Week 9-10)

**Goal**: Persona adapts over time

**Tasks**:
- ✅ Persona parameter system
- ✅ RAG episodic memory
- ✅ Satisfaction feedback loop
- ✅ Parameter optimization algorithm
- ✅ Memory retrieval
- ✅ Persona UI (sliders)

**Deliverable**: AI personality improves with usage

---

### Phase 6: Polish & Testing (Week 11-12)

**Goal**: Production-ready

**Tasks**:
- ✅ Comprehensive error handling
- ✅ Loading states
- ✅ Keyboard shortcuts
- ✅ Accessibility (screen reader)
- ✅ Performance optimization
- ✅ Unit tests (80% coverage)
- ✅ Integration tests
- ✅ User testing (5-10 beta testers)

**Deliverable**: Stable, tested app

---

### Phase 7: Distribution (Week 13)

**Goal**: Packaged for distribution

**Tasks**:
- ✅ electron-builder configuration
- ✅ Code signing (macOS + Windows)
- ✅ Auto-updater setup
- ✅ Crash reporting (Sentry)
- ✅ Analytics (optional, privacy-focused)
- ✅ First-run onboarding
- ✅ Model downloader UI

**Deliverable**: Installable .dmg (macOS) and .exe (Windows)

---

### Phase 8: Launch (Week 14)

**Goal**: Public release

**Tasks**:
- ✅ Create landing page
- ✅ Write documentation
- ✅ Record demo video
- ✅ Prepare social media assets
- ✅ Submit to Product Hunt
- ✅ Post on HackerNews, Reddit
- ✅ Monitor feedback and iterate

**Deliverable**: Public launch! 🚀

---

## 4. Deployment & Distribution

### 4.1 electron-builder Configuration

```json
// electron-builder.json

{
  "appId": "com.garden-of-eden.app",
  "productName": "Garden of Eden",
  "copyright": "Copyright © 2025",
  "directories": {
    "output": "dist"
  },
  "files": [
    "out/**/*",
    "resources/**/*",
    "!resources/models/*" // Models downloaded separately
  ],
  "mac": {
    "target": ["dmg", "zip"],
    "category": "public.app-category.productivity",
    "icon": "resources/icons/icon.icns",
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "build/entitlements.mac.plist",
    "entitlementsInherit": "build/entitlements.mac.plist"
  },
  "win": {
    "target": ["nsis", "portable"],
    "icon": "resources/icons/icon.ico"
  },
  "linux": {
    "target": ["AppImage", "deb"],
    "category": "Utility",
    "icon": "resources/icons/"
  },
  "publish": {
    "provider": "github",
    "owner": "garden-of-eden",
    "repo": "desktop-app"
  }
}
```

### 4.2 Auto-Updater

```typescript
// main/updater.ts

import { autoUpdater } from 'electron-updater';

export class AutoUpdaterService {
  init() {
    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on('update-available', () => {
      dialog.showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: 'A new version is available. Downloading...',
      });
    });

    autoUpdater.on('update-downloaded', () => {
      dialog.showMessageBox({
        type: 'info',
        title: 'Update Ready',
        message: 'Update downloaded. Restart to install?',
        buttons: ['Restart', 'Later'],
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
    });
  }
}
```

### 4.3 Model Downloader

**Models are NOT bundled** (too large). User downloads on first run.

```typescript
// renderer/pages/FirstRun.tsx

export function ModelDownloader() {
  const [progress, setProgress] = useState(0);

  const downloadModels = async () => {
    await window.electronAPI.downloadModel('llama-3.1-8b', (p) => setProgress(p));
    await window.electronAPI.downloadModel('whisper-large-v3', (p) => setProgress(p));
  };

  return (
    <div>
      <h1>Welcome to Garden of Eden</h1>
      <p>Downloading AI models (12GB)...</p>
      <ProgressBar value={progress} />
    </div>
  );
}
```

---

## 5. Testing Strategy

### 5.1 Unit Tests

```typescript
// __tests__/database/conversation.repository.test.ts

import { ConversationRepository } from '@/main/database/repositories';
import Database from 'better-sqlite3';

describe('ConversationRepository', () => {
  let db: Database.Database;
  let repo: ConversationRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    // Run migrations
    repo = new ConversationRepository(db);
  });

  test('creates conversation', () => {
    const conv = repo.create({
      title: 'Test',
      model: 'llama-3.1-8b',
      messageCount: 0,
    });

    expect(conv.id).toBeDefined();
    expect(conv.title).toBe('Test');
  });
});
```

### 5.2 Integration Tests

Test full conversation flow from input to AI response.

### 5.3 E2E Tests

Use Playwright to test UI flows.

---

## 6. Performance Benchmarks

### 6.1 Target Metrics

| Metric | Target | Acceptable |
|--------|--------|------------|
| App Launch | < 2s | < 5s |
| LLM First Token | < 500ms | < 2s |
| LLM Full Response | < 3s | < 8s |
| STT Transcription | < 1s | < 3s |
| TTS Generation | < 500ms | < 2s |
| Screen Capture | < 200ms | < 500ms |
| Database Query | < 10ms | < 50ms |
| Memory Usage | < 1.5GB | < 2.5GB |

### 6.2 Optimization Strategies

**LLM**:
- Use Q4 quantization (5.5GB vs 16GB)
- GPU acceleration (Metal/CUDA)
- Context caching

**Database**:
- Indexes on all queries
- Connection pooling
- Batch inserts

**UI**:
- Virtual scrolling for history
- Lazy loading
- React.memo for expensive components

---

## 7. Security Checklist

- ✅ Context isolation enabled
- ✅ Node integration disabled in renderer
- ✅ IPC channel whitelist
- ✅ File access control (user permission)
- ✅ No eval() or dangerous patterns
- ✅ HTTPS for all external requests
- ✅ Encrypted local storage (optional)
- ✅ Secure auto-updater (signed releases)
- ✅ CSP headers
- ✅ Regular dependency audits

---

## 8. Known Limitations & Trade-offs

### 8.1 Model Size

**Limitation**: 12GB models require significant disk space

**Trade-off**: Accept large size for 100% privacy

**Mitigation**: Optional cloud fallback (future)

### 8.2 Hardware Requirements

**Minimum**:
- RAM: 16GB
- Storage: 20GB free
- CPU: 4 cores
- GPU: Optional (but recommended)

**Trade-off**: Excludes lower-end devices

### 8.3 Offline-Only (v1)

**Limitation**: No cloud sync, no mobile app

**Future**: Optional cloud backup

---

## 9. Success Metrics

### 9.1 User Engagement

- **DAU**: 100+ in Month 1
- **Avg Session Length**: > 10 minutes
- **Messages per Day**: > 20
- **7-Day Retention**: > 40%
- **30-Day Retention**: > 20%

### 9.2 Quality Metrics

- **AI Response Satisfaction**: > 4.0/5.0
- **Bug Reports**: < 5 per week
- **Crash Rate**: < 0.5%
- **NPS Score**: > 50

### 9.3 Technical Metrics

- **Avg Response Time**: < 5s (P95)
- **Error Rate**: < 2%
- **Memory Usage**: < 1.5GB (P95)
- **Uptime**: > 99.5%

---

## 10. Final Launch Checklist

### 10.1 Pre-Launch (Week Before)

- [ ] All Phase 1-7 tasks completed
- [ ] Beta testing done (5-10 users)
- [ ] Critical bugs fixed
- [ ] Performance benchmarks met
- [ ] Landing page live
- [ ] Documentation complete
- [ ] Demo video recorded
- [ ] Social media assets ready

### 10.2 Launch Day

- [ ] Final build created
- [ ] Code signed (macOS + Windows)
- [ ] DMG/EXE uploaded to GitHub Releases
- [ ] Landing page updated with download links
- [ ] Post on Product Hunt (morning PST)
- [ ] Post on HackerNews
- [ ] Post on Reddit (r/SideProject, r/MacApps)
- [ ] Tweet announcement
- [ ] Monitor feedback channels

### 10.3 Post-Launch (Week After)

- [ ] Respond to all feedback
- [ ] Hotfix critical bugs
- [ ] Collect feature requests
- [ ] Plan v1.1 roadmap
- [ ] Thank early adopters

---

## Conclusion

**Garden of Eden V3** is an ambitious but achievable project:

✅ **100% Local AI** - No privacy concerns, no subscriptions
✅ **Desktop-First** - Powerful system integrations
✅ **KakaoTalk-Inspired** - Familiar, warm, conversational
✅ **Customizable Persona** - Adapts to your style
✅ **Open-Source** - Community-driven evolution

**Total Development Time**: 14 weeks (3.5 months)

**Tech Stack**:
- Electron + React + TypeScript
- Llama 3.1 8B (via llama.cpp)
- Whisper Large V3 (STT)
- SQLite (local database)
- shadcn/ui (components)

**Target Users**:
- Solo developers
- Remote workers
- Students
- Privacy-conscious power users

**Launch Goal**: 100 active users in first month

---

**Let's build something extraordinary.** 🚀

**End of Part 5**

*Total Lines Part 5: ~800*
*Total Lines V3 Spec: ~5500*

---

**End of Garden of Eden V3 Master Specification**

*Version 3.0.0 Complete*
*Last Updated: 2025-01-11*


---
---

# Part 6: API Reference & Developer Documentation

## Table of Contents - Part 6

1. [IPC Channels API](#1-ipc-channels-api)
2. [Service APIs](#2-service-apis)
3. [Database Schema Reference](#3-database-schema-reference)
4. [TypeScript Types Reference](#4-typescript-types-reference)
5. [Plugin Development Guide](#5-plugin-development-guide)
6. [Webhook Integration Guide](#6-webhook-integration-guide)

---

## 1. IPC Channels API

### 1.1 AI Operations

#### `ai:chat`

Send a chat message to the AI.

**Request**:
```typescript
{
  message: string;
  context?: {
    screenCapture?: Buffer;
    workspaceInfo?: WorkspaceContext;
    recentFiles?: string[];
  };
}
```

**Response**:
```typescript
{
  text: string;
  conversationId: string;
  tokens?: number;
}
```

**Example**:
```typescript
const response = await window.electronAPI.aiChat({
  message: "Explain React hooks",
  context: {
    workspaceInfo: await getWorkspaceContext(),
  }
});

console.log(response.text);
```

---

#### `ai:chat-stream`

Stream AI responses token-by-token.

**Request**:
```typescript
{
  message: string;
  context?: ScreenContext;
}
```

**Response**: Event stream
```typescript
onToken: (token: string) => void
onComplete: () => void
onError: (error: Error) => void
```

**Example**:
```typescript
const cleanup = window.electronAPI.aiChatStream(
  { message: "Write a function to sort an array" },
  (token) => {
    console.log(token); // Incremental tokens
  }
);

// Later: cleanup() to stop listening
```

---

#### `ai:voice-input`

Transcribe audio to text using Whisper.

**Request**:
```typescript
{
  audioBuffer: ArrayBuffer;  // WAV/MP3
  language?: 'en' | 'ko' | 'auto';
}
```

**Response**:
```typescript
{
  transcription: string;
  confidence: number;  // 0-1
  language: string;
}
```

---

#### `ai:speak`

Generate speech from text using TTS.

**Request**:
```typescript
{
  text: string;
  voice?: 'male' | 'female';
  speed?: number;  // 0.5-2.0
}
```

**Response**:
```typescript
{
  audioBuffer: ArrayBuffer;  // WAV
  duration: number;  // seconds
}
```

---

### 1.2 File Operations

#### `file:read`

Read file contents.

**Request**:
```typescript
{
  path: string;  // Absolute path
  encoding?: 'utf-8' | 'binary';
}
```

**Response**:
```typescript
{
  content: string | Buffer;
  encoding: string;
  size: number;  // bytes
}
```

---

#### `file:write`

Write file contents.

**Request**:
```typescript
{
  path: string;
  content: string;
  encoding?: 'utf-8';
}
```

**Response**:
```typescript
{
  success: boolean;
  bytesWritten: number;
}
```

---

#### `file:watch`

Watch file for changes.

**Request**:
```typescript
{
  path: string;
}
```

**Response**: Event stream
```typescript
{
  event: 'change' | 'add' | 'unlink';
  path: string;
  timestamp: Date;
}
```

---

### 1.3 Git Operations

#### `git:status`

Get repository status.

**Request**:
```typescript
{
  repoPath: string;
}
```

**Response**:
```typescript
{
  branch: string;
  ahead: number;
  behind: number;
  modified: string[];
  created: string[];
  deleted: string[];
  staged: string[];
}
```

---

#### `git:commit`

Create a commit.

**Request**:
```typescript
{
  repoPath: string;
  message: string;
  files?: string[];  // If empty, commits all
}
```

**Response**:
```typescript
{
  hash: string;
  success: boolean;
}
```

---

#### `git:diff`

Get diff for file or all files.

**Request**:
```typescript
{
  repoPath: string;
  file?: string;  // Optional: specific file
}
```

**Response**:
```typescript
{
  diff: string;  // Unified diff format
}
```

---

### 1.4 System Operations

#### `system:screenshot`

Capture screenshot.

**Request**:
```typescript
{
  display?: number;  // Display index (default: 0)
}
```

**Response**:
```typescript
{
  image: Buffer;  // PNG
  width: number;
  height: number;
  display: number;
}
```

---

#### `system:notify`

Show system notification.

**Request**:
```typescript
{
  title: string;
  body: string;
  icon?: string;
  urgency?: 'low' | 'normal' | 'critical';
}
```

**Response**:
```typescript
{
  clicked: boolean;
  action?: string;
}
```

---

### 1.5 Settings Operations

#### `settings:get`

Get setting value.

**Request**:
```typescript
{
  key: string;
}
```

**Response**:
```typescript
{
  value: any;
}
```

---

#### `settings:set`

Set setting value.

**Request**:
```typescript
{
  key: string;
  value: any;
}
```

**Response**:
```typescript
{
  success: boolean;
}
```

---

## 2. Service APIs

### 2.1 LlamaService

```typescript
class LlamaService {
  constructor(config: LlamaConfig);

  // Generate text
  async generate(
    prompt: string,
    options?: GenerateOptions
  ): Promise<string>;

  // Generate with streaming
  async generateStream(
    prompt: string,
    onToken: (token: string) => void,
    options?: GenerateOptions
  ): Promise<void>;

  // Get embeddings
  async embed(text: string): Promise<Float32Array>;

  // Chat with history
  async chat(
    messages: ChatMessage[],
    options?: GenerateOptions
  ): Promise<string>;

  // Load model
  async loadModel(modelPath: string): Promise<void>;

  // Unload model
  async unloadModel(): Promise<void>;

  // Get model info
  getModelInfo(): ModelInfo;
}

interface GenerateOptions {
  maxTokens?: number;       // Default: 2048
  temperature?: number;     // 0-2, default: 0.7
  topP?: number;           // 0-1, default: 0.9
  topK?: number;           // Default: 40
  repeatPenalty?: number;  // Default: 1.1
  stopSequences?: string[];
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ModelInfo {
  name: string;
  size: number;  // bytes
  parameters: string;  // e.g., "8B"
  quantization: string;  // e.g., "Q4_K_M"
  contextLength: number;
}
```

**Usage Example**:
```typescript
const llama = new LlamaService({
  modelPath: './models/llama-3.1-8b.gguf',
  nGpuLayers: 35,
});

await llama.loadModel();

const response = await llama.generate(
  "Explain React hooks in simple terms",
  { maxTokens: 500, temperature: 0.7 }
);

console.log(response);
```

---

### 2.2 WhisperService

```typescript
class WhisperService {
  constructor(config: WhisperConfig);

  // Transcribe audio file
  async transcribeFile(filePath: string): Promise<TranscriptionResult>;

  // Transcribe audio buffer
  async transcribeBuffer(
    audioBuffer: ArrayBuffer,
    options?: TranscribeOptions
  ): Promise<TranscriptionResult>;

  // Real-time transcription
  async transcribeStream(
    audioStream: ReadableStream,
    onSegment: (segment: string) => void
  ): Promise<void>;
}

interface WhisperConfig {
  modelPath: string;
  language?: 'en' | 'ko' | 'auto';
  device?: 'cpu' | 'gpu';
}

interface TranscribeOptions {
  language?: string;
  task?: 'transcribe' | 'translate';
  temperature?: number;
}

interface TranscriptionResult {
  text: string;
  segments: Array<{
    text: string;
    start: number;  // seconds
    end: number;
    confidence: number;
  }>;
  language: string;
  duration: number;
}
```

---

### 2.3 FileService

```typescript
class FileService {
  // Read file
  async read(filePath: string): Promise<{ content: string; encoding: string }>;

  // Write file
  async write(filePath: string, content: string): Promise<void>;

  // Read directory
  async readDirectory(dirPath: string): Promise<string[]>;

  // Get project structure
  async getProjectStructure(rootPath: string): Promise<FileTree>;

  // Watch file
  watchFile(filePath: string, callback: (event: string) => void): string;

  // Unwatch file
  unwatchFile(watcherId: string): void;

  // Check if file exists
  async exists(filePath: string): Promise<boolean>;

  // Get file stats
  async stat(filePath: string): Promise<FileStats>;
}

interface FileTree {
  name: string;
  type: 'file' | 'directory';
  children?: FileTree[];
  size?: number;
}

interface FileStats {
  size: number;
  created: Date;
  modified: Date;
  isDirectory: boolean;
  isFile: boolean;
}
```

---

### 2.4 GitService

```typescript
class GitService {
  constructor(repoPath: string);

  // Get status
  async getStatus(): Promise<GitStatus>;

  // Create commit
  async commit(message: string, files?: string[]): Promise<string>;

  // Get diff
  async getDiff(file?: string): Promise<string>;

  // Get log
  async getLog(count?: number): Promise<GitCommit[]>;

  // Create branch
  async createBranch(branchName: string): Promise<void>;

  // Switch branch
  async switchBranch(branchName: string): Promise<void>;

  // Push
  async push(remote?: string, branch?: string): Promise<void>;

  // Pull
  async pull(remote?: string, branch?: string): Promise<void>;
}

interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  modified: string[];
  created: string[];
  deleted: string[];
  staged: string[];
}

interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
  files: string[];
}
```

---

## 3. Database Schema Reference

### 3.1 Complete Schema

```sql
-- conversations table
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  title TEXT,
  model TEXT NOT NULL DEFAULT 'llama-3.1-8b',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  message_count INTEGER NOT NULL DEFAULT 0,
  metadata JSON
);

CREATE INDEX idx_conversations_created ON conversations(created_at DESC);

-- messages table
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tokens INTEGER,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSON,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_role ON messages(role);

-- persona_parameters table
CREATE TABLE persona_parameters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  warmth REAL NOT NULL DEFAULT 0.7 CHECK(warmth BETWEEN 0 AND 1),
  formality REAL NOT NULL DEFAULT 0.5 CHECK(formality BETWEEN 0 AND 1),
  humor REAL NOT NULL DEFAULT 0.6 CHECK(humor BETWEEN 0 AND 1),
  verbosity REAL NOT NULL DEFAULT 0.5 CHECK(verbosity BETWEEN 0 AND 1),
  proactivity REAL NOT NULL DEFAULT 0.5 CHECK(proactivity BETWEEN 0 AND 1),
  creativity REAL NOT NULL DEFAULT 0.7 CHECK(creativity BETWEEN 0 AND 1),
  empathy REAL NOT NULL DEFAULT 0.8 CHECK(empathy BETWEEN 0 AND 1),
  directness REAL NOT NULL DEFAULT 0.6 CHECK(directness BETWEEN 0 AND 1),
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- episodic_memory table (RAG)
CREATE TABLE episodic_memory (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  user_message TEXT NOT NULL,
  assistant_response TEXT NOT NULL,
  embedding BLOB,
  satisfaction_score REAL CHECK(satisfaction_score BETWEEN 0 AND 1),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE INDEX idx_memory_satisfaction ON episodic_memory(satisfaction_score DESC);
CREATE INDEX idx_memory_created ON episodic_memory(created_at DESC);

-- user_settings table
CREATE TABLE user_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('string', 'number', 'boolean', 'json')),
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- workspaces table
CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  root_path TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('nodejs', 'python', 'rust', 'go', 'java', 'generic')),
  git_repo TEXT,
  last_opened DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSON
);

CREATE INDEX idx_workspaces_last_opened ON workspaces(last_opened DESC);

-- notifications table
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_taken TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  metadata JSON
);

CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
```

### 3.2 Table Descriptions

#### `conversations`
Stores all chat conversations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | UUID primary key |
| `title` | TEXT | User-defined or auto-generated title |
| `model` | TEXT | AI model used (e.g., "llama-3.1-8b") |
| `created_at` | DATETIME | Creation timestamp |
| `updated_at` | DATETIME | Last update timestamp |
| `message_count` | INTEGER | Number of messages in conversation |
| `metadata` | JSON | Additional metadata |

---

#### `messages`
Stores individual messages within conversations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | UUID primary key |
| `conversation_id` | TEXT | Foreign key to conversations |
| `role` | TEXT | 'user', 'assistant', or 'system' |
| `content` | TEXT | Message text |
| `tokens` | INTEGER | Token count (optional) |
| `created_at` | DATETIME | Creation timestamp |
| `metadata` | JSON | Additional metadata |

---

#### `persona_parameters`
Stores AI personality settings.

| Column | Type | Range | Default | Description |
|--------|------|-------|---------|-------------|
| `warmth` | REAL | 0-1 | 0.7 | Cold ← → Warm |
| `formality` | REAL | 0-1 | 0.5 | Casual ← → Formal |
| `humor` | REAL | 0-1 | 0.6 | Serious ← → Playful |
| `verbosity` | REAL | 0-1 | 0.5 | Concise ← → Detailed |
| `proactivity` | REAL | 0-1 | 0.5 | Reactive ← → Proactive |
| `creativity` | REAL | 0-1 | 0.7 | Conservative ← → Creative |
| `empathy` | REAL | 0-1 | 0.8 | Logical ← → Empathetic |
| `directness` | REAL | 0-1 | 0.6 | Indirect ← → Direct |

---

## 4. TypeScript Types Reference

### 4.1 Core Types

```typescript
// Conversation types
export interface Conversation {
  id: string;
  title: string | null;
  model: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  metadata?: Record<string, any>;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens?: number;
  createdAt: Date;
  metadata?: Record<string, any>;
}

// Persona types
export interface PersonaParameters {
  warmth: number;        // 0-1
  formality: number;     // 0-1
  humor: number;         // 0-1
  verbosity: number;     // 0-1
  proactivity: number;   // 0-1
  creativity: number;    // 0-1
  empathy: number;       // 0-1
  directness: number;    // 0-1
}

// Memory types
export interface EpisodicMemory {
  id: string;
  conversationId: string;
  userMessage: string;
  assistantResponse: string;
  embedding?: Float32Array;
  satisfactionScore?: number;  // 0-1
  createdAt: Date;
}

// Workspace types
export interface Workspace {
  id: string;
  rootPath: string;
  name: string;
  type: 'nodejs' | 'python' | 'rust' | 'go' | 'java' | 'generic';
  gitRepo?: string;
  lastOpened: Date;
  metadata?: Record<string, any>;
}

export interface WorkspaceContext {
  hasWorkspace: boolean;
  workspaceName?: string;
  workspaceType?: string;
  openFiles?: string[];
  hasGit?: boolean;
}

// Notification types
export interface ProactiveNotification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error' | 'proactive';
  title: string;
  message: string;
  actionTaken?: 'accepted' | 'dismissed' | 'ignored';
  createdAt: Date;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

// Git types
export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  modified: string[];
  created: string[];
  deleted: string[];
  staged: string[];
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
  files: string[];
}

// Settings types
export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'ko';
export type Mode = 'user-led' | 'ai-led';

export interface UserSettings {
  language: Language;
  theme: Theme;
  voiceEnabled: boolean;
  voiceOutputEnabled: boolean;
  screenCaptureEnabled: boolean;
  mode: Mode;
  proactiveNotifications: boolean;
}
```

### 4.2 IPC Types

```typescript
export interface IPCChannel {
  'ai:chat': {
    request: { message: string; context?: ScreenContext };
    response: { text: string; conversationId: string };
  };
  'ai:voice-input': {
    request: { audioBuffer: ArrayBuffer };
    response: { transcription: string };
  };
  'file:read': {
    request: { path: string };
    response: { content: string; encoding: string };
  };
  'file:write': {
    request: { path: string; content: string };
    response: { success: boolean };
  };
  'git:status': {
    request: { repoPath: string };
    response: GitStatus;
  };
  'git:commit': {
    request: { repoPath: string; message: string; files: string[] };
    response: { hash: string };
  };
  'system:screenshot': {
    request: { display?: number };
    response: { image: Buffer; width: number; height: number };
  };
  'system:notify': {
    request: { title: string; body: string };
    response: { clicked: boolean };
  };
}
```

---

## 5. Plugin Development Guide

### 5.1 Plugin Structure

Create a plugin by implementing the `EdenPlugin` interface:

```typescript
// my-plugin/index.ts

import { EdenPlugin, PluginContext } from '@/main/plugins/plugin.interface';

export class MyPlugin implements EdenPlugin {
  name = 'my-plugin';
  version = '1.0.0';
  description = 'My custom Eden plugin';

  async onLoad(context: PluginContext) {
    console.log('Plugin loaded!');
    
    // Access core services
    const workspaceInfo = await context.file.getProjectStructure('/path/to/project');
    console.log('Workspace:', workspaceInfo);
  }

  async onUnload() {
    console.log('Plugin unloaded!');
  }

  commands = [
    {
      name: 'my-command',
      description: 'My custom command',
      execute: async (args: string[], context: PluginContext) => {
        return `Command executed with args: ${args.join(', ')}`;
      },
    },
  ];

  ipcHandlers = {
    'my-plugin:custom-action': async (request: any) => {
      // Handle custom IPC
      return { success: true };
    },
  };
}

export default MyPlugin;
```

### 5.2 Plugin Installation

1. Create plugin directory:
```bash
mkdir ~/Library/Application\ Support/garden-of-eden/plugins/my-plugin
```

2. Add `index.js` (compiled TypeScript):
```bash
cp dist/index.js ~/Library/Application\ Support/garden-of-eden/plugins/my-plugin/
```

3. Restart Eden → Plugin auto-loads

### 5.3 Available Context APIs

```typescript
interface PluginContext {
  ai: AIServiceAPI;          // Access to Llama, Whisper
  file: FileService;         // File operations
  git: GitService;          // Git operations
  calendar: CalendarService; // Calendar access
  webhook: WebhookService;  // Webhook triggers
  db: Database;             // SQLite database
  storage: PluginStorage;   // Plugin-specific storage
  logger: Logger;           // Logging
}
```

---

## 6. Webhook Integration Guide

### 6.1 Setup

Configure webhooks in settings:

```json
{
  "webhooks": {
    "slack": {
      "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
      "enabled": true
    },
    "discord": {
      "url": "https://discord.com/api/webhooks/YOUR/WEBHOOK",
      "enabled": true
    }
  }
}
```

### 6.2 Triggering Webhooks

From plugin or service:

```typescript
// Trigger Slack webhook
await webhookService.notifySlack('Hello from Eden!', '#general');

// Trigger Discord webhook
await webhookService.notifyDiscord('New commit created!');

// Custom webhook
await webhookService.trigger('custom-webhook', {
  event: 'conversation_completed',
  data: { conversationId: '123' },
});
```

### 6.3 Supported Services

- ✅ Slack
- ✅ Discord
- ✅ Notion
- ✅ Zapier (generic webhook)
- ✅ IFTTT (generic webhook)
- ✅ Custom HTTP endpoints

---

**End of Part 6**

*Lines: ~800*
*Next: Part 7 - User & Developer Guide*

---
---


# Part 7: User & Developer Guide

*Complete guide for users and developers working with Garden of Eden V3*

---

## 1. Getting Started

### 1.1 System Requirements

**Minimum Requirements:**
- **OS**: Windows 10 (64-bit) or macOS 11.0+
- **RAM**: 16 GB (8 GB usable for app)
- **Storage**: 20 GB free space
- **CPU**: Intel i5 / AMD Ryzen 5 or equivalent (AVX2 support required)
- **GPU**: Optional (NVIDIA RTX series for GPU acceleration)

**Recommended:**
- **OS**: Windows 11 or macOS 13.0+
- **RAM**: 32 GB
- **Storage**: 50 GB SSD
- **CPU**: Intel i7 / AMD Ryzen 7 or Apple M1/M2
- **GPU**: NVIDIA RTX 3060 or better (for faster inference)

---

### 1.2 Installation

#### Windows Installation

1. **Download**: Get the latest `.exe` installer from the releases page
2. **Run Installer**: Double-click `GardenOfEden-Setup-v3.0.0.exe`
3. **Choose Install Location**: Default is `C:\Program Files\GardenOfEden`
4. **Complete Installation**: Click "Finish" when done

```powershell
# Silent install (admin required)
GardenOfEden-Setup-v3.0.0.exe /S /D=C:\Program Files\GardenOfEden
```

#### macOS Installation

1. **Download**: Get the latest `.dmg` from releases
2. **Open DMG**: Double-click `GardenOfEden-v3.0.0.dmg`
3. **Drag to Applications**: Drag the app icon to Applications folder
4. **First Launch**: Right-click app and select "Open" (bypass Gatekeeper)

```bash
# Command line install
hdiutil attach GardenOfEden-v3.0.0.dmg
cp -R "/Volumes/Garden of Eden/Garden of Eden.app" /Applications/
hdiutil detach "/Volumes/Garden of Eden"
```

#### Linux Installation (AppImage)

1. **Download**: Get `GardenOfEden-v3.0.0.AppImage`
2. **Make Executable**:
```bash
chmod +x GardenOfEden-v3.0.0.AppImage
```
3. **Run**:
```bash
./GardenOfEden-v3.0.0.AppImage
```

---

### 1.3 First Run & Model Download

When you first launch Garden of Eden, you'll see the **Model Download Wizard**.

#### Step 1: Welcome Screen
```
┌─────────────────────────────────────────┐
│  Welcome to Garden of Eden V3           │
│                                          │
│  Your personal AI assistant              │
│  100% local, 100% private                │
│                                          │
│  We need to download AI models          │
│  (~8 GB total)                          │
│                                          │
│         [Continue] [Quit]                │
└─────────────────────────────────────────┘
```

#### Step 2: Model Selection
```
Select models to download:

☑ Llama 3.1 8B (Primary AI)          ~4.7 GB
☑ Whisper Large V3 (Speech-to-text)  ~1.5 GB
☑ LLaVA 7B (Vision, optional)        ~4.1 GB

Total: ~10.3 GB
Estimated time: 15-30 minutes

Download location:
~/Library/Application Support/GardenOfEden/models/

         [Back] [Start Download]
```

#### Step 3: Download Progress
```
Downloading models...

Llama 3.1 8B
[████████████████████████] 100% (4.7 GB)

Whisper Large V3
[████████████████████████] 100% (1.5 GB)

LLaVA 7B
[██████████░░░░░░░░░░░░░░] 45% (1.8 / 4.1 GB)

Overall progress: 71%
Time remaining: ~8 minutes

              [Cancel] [Minimize]
```

#### Step 4: Model Verification
After download, models are verified for integrity:
```
Verifying models...

☑ Llama 3.1 8B (SHA256 verified)
☑ Whisper Large V3 (SHA256 verified)
☑ LLaVA 7B (SHA256 verified)

All models ready!

              [Continue to App]
```

---

### 1.4 Initial Configuration

#### Welcome Tutorial
First-time users see a 5-step tutorial:

**Step 1: Chat Interface**
```
This is your chat interface!

- Type messages in the input box
- Press Enter to send
- AI responses appear on the left
- Your messages on the right

            [Next]
```

**Step 2: Voice Input**
```
Click the microphone icon to speak

🎤 Click and hold to record
   Release to send

Or click once to start, click again to stop

            [Next]
```

**Step 3: Persona Configuration**
```
Configure AI personality in Settings

Adjust 8 parameters:
- Warmth, Formality, Humor
- Verbosity, Proactivity, Creativity
- Empathy, Directness

            [Next]
```

**Step 4: Dual Mode**
```
Switch between two modes:

👤 User-Led: You control the conversation
🤖 AI-Led: AI proactively suggests actions

Toggle in the top-right corner

            [Next]
```

**Step 5: Privacy**
```
Everything stays on your computer

✓ No internet required (after setup)
✓ No data collection
✓ Full privacy

            [Start Using]
```

---

## 2. User Guide

### 2.1 Chat Interface Basics

#### Sending Messages
1. **Text**: Type in the input box at bottom, press Enter
2. **Voice**: Click 🎤 microphone icon, speak, click again to send
3. **Multiline**: Press Shift+Enter for new line without sending

#### Message Features
- **Markdown Support**: Use `**bold**`, `*italic*`, `code`, etc.
- **Code Blocks**: Syntax highlighting for 50+ languages
- **Copy Code**: Hover over code block, click copy icon
- **Edit Messages**: Click pencil icon to edit sent messages
- **Delete Messages**: Right-click message → Delete

#### Example Chat Session
```
You: Hello! Can you help me write a Python function?

AI: Of course! I'd be happy to help you write a Python 
    function. What should the function do?

You: Calculate the factorial of a number

AI: Here's a Python function to calculate factorial:

    ```python
    def factorial(n: int) -> int:
        """Calculate factorial of n."""
        if n < 0:
            raise ValueError("n must be non-negative")
        if n == 0 or n == 1:
            return 1
        return n * factorial(n - 1)
    
    # Example usage
    print(factorial(5))  # Output: 120
    ```

    This uses recursion. Would you like an iterative 
    version instead?
```

---

### 2.2 Voice Features

#### Voice Input (Speech-to-Text)

**Method 1: Click-and-Hold**
1. Click and hold 🎤 microphone button
2. Speak your message
3. Release button to process
4. Text appears in input box

**Method 2: Click-to-Toggle**
1. Click 🎤 once to start recording
2. Speak your message
3. Click 🎤 again to stop
4. Text appears in input box

**Visual Feedback:**
```
Recording...
🎤 [████████████░░░░] 12s / 60s max
🔊 ▂▃▅▆▇▆▅▃▂ (waveform animation)

[Stop Recording]
```

**Supported Languages:**
- 🇰🇷 Korean (한국어)
- 🇺🇸 English
- 🇯🇵 Japanese (日本語)
- 🇨🇳 Chinese (中文)
- 🇪🇸 Spanish (Español)
- 🇫🇷 French (Français)

#### Voice Output (Text-to-Speech)

AI responses can be read aloud automatically or manually.

**Enable Auto-TTS:**
Settings → Voice → Enable auto-playback ✓

**Manual Playback:**
Click 🔊 speaker icon on any AI message

**TTS Player UI:**
```
┌────────────────────────────────┐
│ 🔊 Playing AI response...      │
│ ▶ [██████░░░░░░] 35% (4s / 12s)│
│ [Pause] [Stop] [Speed: 1.0x]   │
└────────────────────────────────┘
```

**TTS Settings:**
- **Speed**: 0.5x - 2.0x
- **Voice**: System default or custom
- **Auto-play**: On/Off
- **Skip long messages**: Threshold (e.g., 500 chars)

---

### 2.3 Persona Configuration

Access: Settings → Persona

The AI's personality is controlled by 8 adjustable parameters.

#### 8 Persona Parameters

**1. Warmth (온기)**
```
Cold ◄──────●────────► Warm
     0      0.7      1.0

Cold:  Neutral, matter-of-fact
Warm:  Friendly, caring, emotionally present
```

**2. Formality (격식)**
```
Casual ◄──────●──────► Formal
       0     0.3      1.0

Casual: Conversational, uses contractions
Formal: Professional, proper grammar
```

**3. Humor (유머)**
```
Serious ◄───●─────────► Playful
        0   0.2       1.0

Serious: Straightforward, no jokes
Playful: Witty, uses humor appropriately
```

**4. Verbosity (상세함)**
```
Concise ◄─────●───────► Detailed
        0    0.5       1.0

Concise: Brief, to-the-point answers
Detailed: Thorough explanations
```

**5. Proactivity (주도성)**
```
Reactive ◄─────●──────► Proactive
         0    0.6      1.0

Reactive:  Only answers direct questions
Proactive: Suggests actions, asks questions
```

**6. Creativity (창의성)**
```
Practical ◄────●──────► Creative
          0   0.4      1.0

Practical: Safe, proven solutions
Creative:  Novel, unconventional ideas
```

**7. Empathy (공감)**
```
Objective ◄────●──────► Empathetic
          0   0.6      1.0

Objective:  Focus on facts, logic
Empathetic: Acknowledge feelings, supportive
```

**8. Directness (직설성)**
```
Indirect ◄──────●─────► Direct
         0     0.7     1.0

Indirect: Gentle, suggestive
Direct:   Clear, straightforward, honest
```

#### Example Personas

**Preset 1: Professional Assistant**
```yaml
warmth: 0.5
formality: 0.8
humor: 0.2
verbosity: 0.6
proactivity: 0.7
creativity: 0.4
empathy: 0.5
directness: 0.8
```

**Preset 2: Friendly Companion**
```yaml
warmth: 0.9
formality: 0.2
humor: 0.7
verbosity: 0.5
proactivity: 0.8
creativity: 0.6
empathy: 0.9
directness: 0.5
```

**Preset 3: Technical Expert**
```yaml
warmth: 0.3
formality: 0.6
humor: 0.1
verbosity: 0.8
proactivity: 0.5
creativity: 0.7
empathy: 0.3
directness: 0.9
```

---

### 2.4 Dual Mode: User-Led vs AI-Led

#### User-Led Mode 👤

**Behavior:**
- AI waits for your input
- Responds only when asked
- Does not interrupt
- Does not suggest unprompted actions

**Best For:**
- Focused work sessions
- When you know what you need
- Minimal distractions
- Traditional chat experience

**Example:**
```
You: What's the weather?
AI:  I'm a local AI without internet access, 
     so I can't check live weather. Would you 
     like me to help with something else?

[AI waits for next input]
```

#### AI-Led Mode 🤖

**Behavior:**
- AI actively monitors context
- Suggests actions proactively
- Sends notifications
- Asks clarifying questions
- Initiates helpful conversations

**Best For:**
- Exploratory work
- Learning new topics
- Getting suggestions
- Productivity assistance

**Example:**
```
[System detects: package.json modified]

AI: 🔔 I noticed you updated package.json 
    with a new dependency. Would you like 
    me to run `npm install`?
    
    [Yes] [No] [Dismiss]
```

**Toggle Mode:**
Click mode switcher in top-right:
```
┌────────────────┐
│ Mode: User-Led │ ← Click to toggle
└────────────────┘

Changes to:

┌────────────────┐
│ Mode: AI-Led   │
└────────────────┘
```

---

### 2.5 System Integrations

#### File System Integration

**Reading Files:**
```
You: Read the README.md file

AI:  [Reads file automatically]
     Here's the content of README.md:
     
     # My Project
     This is a sample project...
```

**Writing Files:**
```
You: Create a new Python file called hello.py 
     with a hello world program

AI:  I'll create hello.py for you:
     
     ```python
     # hello.py
     print("Hello, World!")
     ```
     
     ✓ File created at ~/Desktop/hello.py
```

**File Operations:**
- ✅ Read files
- ✅ Write files
- ✅ List directories
- ✅ Search file contents
- ✅ Move/rename files
- ✅ Delete files (with confirmation)

#### Git Integration

**Status Check:**
```
You: What's my git status?

AI:  Current branch: main
     
     Modified files:
     • src/app.ts (3 changes)
     • README.md (1 change)
     
     Untracked files:
     • test/new-test.ts
     
     You're 2 commits ahead of origin/main.
```

**Commit:**
```
You: Commit these changes with message 
     "Add new feature"

AI:  I'll commit the modified files:
     
     $ git add src/app.ts README.md
     $ git commit -m "Add new feature"
     
     ✓ Committed as 8a3f2b1
     
     Would you like me to push to remote?
```

**Git Operations:**
- ✅ Status check
- ✅ Diff viewing
- ✅ Commit (with confirmation)
- ✅ Branch management
- ✅ Log viewing
- ⚠️ Push (requires explicit confirmation)
- ❌ Force push (blocked for safety)

#### Clipboard Integration

**Copy from Chat:**
Right-click any message → Copy

**Paste into Chat:**
AI can read clipboard when needed:
```
You: Fix the code in my clipboard

AI:  [Reads clipboard automatically]
     I see this JavaScript code:
     
     ```javascript
     function add(a, b) {
       return a + b
     }
     ```
     
     The code looks good! Did you want me 
     to add error handling or type checking?
```

#### Screen Context (Vision)

**Screenshot Analysis:**
```
You: [Paste screenshot] What's wrong here?

AI:  [Analyzes screenshot with LLaVA]
     I can see a JavaScript error in your 
     browser console:
     
     "TypeError: Cannot read property 'map' 
      of undefined"
     
     This suggests `items` is undefined when 
     you try to call .map() on it. Add a check:
     
     ```javascript
     const items = data?.items || [];
     items.map(...)
     ```
```

---

### 2.6 Conversation History

Access: Click 📚 History icon or press Cmd/Ctrl+H

#### History View

```
┌─────────────────────────────────────────┐
│ Conversation History          [Search]  │
├─────────────────────────────────────────┤
│ 📅 Today                                │
│   • How to use Git (15 messages)   2h  │
│   • Python debugging help (8 msg)  4h  │
│                                         │
│ 📅 Yesterday                            │
│   • React component design (23 msg)     │
│   • SQL query optimization (12 msg)     │
│                                         │
│ 📅 This Week                            │
│   • TypeScript best practices (45 msg)  │
│   • API design discussion (31 msg)      │
│                                         │
│ [Load More]                             │
└─────────────────────────────────────────┘
```

#### Search

```
Search: "python flask"

Results (3):

1. Flask API Tutorial (2024-01-10)
   "...building a REST API with Flask..."
   32 messages

2. Flask vs Django (2024-01-08)
   "...comparing Flask and Django for..."
   18 messages

3. Flask debugging (2024-01-05)
   "...debug mode in Flask application..."
   12 messages
```

#### Export Conversation

Right-click any conversation → Export

**Export Formats:**
- **JSON**: Full conversation data
- **Markdown**: Readable text format
- **TXT**: Plain text
- **PDF**: Formatted document (requires plugin)

**Example Markdown Export:**
```markdown
# Conversation: Python Debugging Help
Date: 2024-01-12 14:30
Model: Llama 3.1 8B
Messages: 8

---

**User** (14:30:15)
How do I debug a Python script?

**AI** (14:30:18)
There are several ways to debug Python:

1. **Print statements**: Simple but effective
2. **pdb debugger**: Built-in Python debugger
3. **IDE debuggers**: VS Code, PyCharm
...
```

---

### 2.7 Settings & Preferences

Access: Click ⚙️ Settings icon or press Cmd/Ctrl+,

#### General Settings

```
┌─────────────────────────────────────────┐
│ Settings                                │
├─────────────────────────────────────────┤
│                                         │
│ General                                 │
│ ┌─────────────────────────────────────┐ │
│ │ Language: [English ▼]               │ │
│ │                                     │ │
│ │ Theme: ● Light ○ Dark ○ Auto       │ │
│ │                                     │ │
│ │ Start at login: [✓]                │ │
│ │                                     │ │
│ │ Minimize to tray: [✓]              │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Save] [Cancel]                         │
└─────────────────────────────────────────┘
```

#### Model Settings

```
Model Configuration

Primary LLM: [Llama 3.1 8B ▼]

Temperature: ◄────●──────► 0.7
             0.0   0.7   1.0
             
Max Tokens:  [2048        ]

Context Window: [8192      ]

GPU Acceleration: [✓] Enabled
GPU Device: NVIDIA RTX 3060 (8 GB)

[Apply] [Reset to Defaults]
```

#### Privacy Settings

```
Privacy & Data

Conversation History:
[✓] Save conversations locally
[✓] Enable conversation search
[ ] Auto-delete after 30 days

Telemetry:
[ ] Send anonymous usage stats
[ ] Share crash reports

Data Location:
~/Library/Application Support/GardenOfEden/

[Open Data Folder] [Clear All Data]
```

#### Keyboard Shortcuts

```
Keyboard Shortcuts

Chat:
Send message          Enter
New line              Shift+Enter
Voice input           Cmd/Ctrl+M
Clear input           Escape

Navigation:
New conversation      Cmd/Ctrl+N
Search history        Cmd/Ctrl+H
Settings              Cmd/Ctrl+,
Toggle mode           Cmd/Ctrl+D

Window:
Hide window           Cmd/Ctrl+W
Minimize to tray      Cmd/Ctrl+Shift+M
Quit                  Cmd/Ctrl+Q

[Customize] [Reset to Defaults]
```

---

## 3. Developer Guide

### 3.1 Building from Source

#### Prerequisites

**Required:**
- Node.js 18+ (LTS recommended)
- npm 9+ or yarn 1.22+
- Git
- Python 3.10+ (for llama.cpp bindings)
- CMake 3.20+ (for building native modules)

**Platform-Specific:**

*Windows:*
- Visual Studio 2019+ (Build Tools)
- Windows SDK

*macOS:*
- Xcode Command Line Tools
- Homebrew (recommended)

*Linux:*
- GCC 9+ or Clang 10+
- Build essentials

#### Clone Repository

```bash
git clone https://github.com/yourusername/garden-of-eden-v3.git
cd garden-of-eden-v3
```

#### Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies (for llama.cpp)
pip install -r requirements.txt

# Build native modules
npm run build:native
```

#### Download Models

```bash
# Download all models
npm run download:models

# Or download individually
npm run download:llama
npm run download:whisper
npm run download:llava
```

#### Development Mode

```bash
# Start in development mode (hot reload)
npm run dev

# Run main and renderer separately
npm run dev:main    # Main process
npm run dev:renderer # Renderer process (React)
```

#### Build for Production

```bash
# Build for current platform
npm run build

# Build for specific platform
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux

# Build for all platforms (requires CI/CD)
npm run build:all
```

#### Run Tests

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

---

### 3.2 Project Structure

```
garden-of-eden-v3/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── index.ts          # Main entry point
│   │   ├── ipc/              # IPC handlers
│   │   │   ├── ai.ts         # AI chat handlers
│   │   │   ├── file.ts       # File system handlers
│   │   │   └── git.ts        # Git handlers
│   │   ├── services/         # Core services
│   │   │   ├── llama.ts      # Llama service
│   │   │   ├── whisper.ts    # Whisper service
│   │   │   ├── llava.ts      # LLaVA service
│   │   │   └── db.ts         # Database service
│   │   ├── plugins/          # Plugin system
│   │   │   ├── manager.ts    # Plugin manager
│   │   │   └── loader.ts     # Plugin loader
│   │   └── utils/            # Utilities
│   │
│   ├── renderer/             # Electron renderer (React)
│   │   ├── components/       # React components
│   │   │   ├── Chat/         # Chat interface
│   │   │   ├── Settings/     # Settings UI
│   │   │   └── History/      # History viewer
│   │   ├── stores/           # Zustand stores
│   │   │   ├── chat.ts       # Chat state
│   │   │   ├── settings.ts   # Settings state
│   │   │   └── persona.ts    # Persona state
│   │   ├── hooks/            # React hooks
│   │   ├── utils/            # Utilities
│   │   └── App.tsx           # Root component
│   │
│   ├── preload/              # Preload scripts
│   │   └── index.ts          # Bridge between main/renderer
│   │
│   └── shared/               # Shared types/utils
│       ├── types/            # TypeScript types
│       └── constants/        # Constants
│
├── models/                   # AI models (gitignored)
│   ├── llama-3.1-8b.gguf
│   ├── whisper-large-v3.bin
│   └── llava-7b.gguf
│
├── plugins/                  # User plugins
│   └── example-plugin/
│
├── tests/                    # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── scripts/                  # Build/utility scripts
│   ├── download-models.js
│   └── build.js
│
├── docs/                     # Documentation
│   └── api/
│
├── package.json
├── tsconfig.json
├── electron-builder.yml      # Build configuration
└── README.md
```

---

### 3.3 Core Architecture

#### Process Architecture

```
┌─────────────────────────────────────────┐
│         Renderer Process (React)        │
│  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │   Chat   │  │ Settings │  │ History││
│  └──────────┘  └──────────┘  └────────┘│
│         ↕ (IPC via contextBridge)       │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│          Main Process (Node.js)         │
│  ┌──────────────────────────────────┐  │
│  │       IPC Handler Manager         │  │
│  └──────────────────────────────────┘  │
│         ↕         ↕         ↕           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │  Llama  │ │ Whisper │ │  LLaVA  │  │
│  │ Service │ │ Service │ │ Service │  │
│  └─────────┘ └─────────┘ └─────────┘  │
│         ↕         ↕         ↕           │
│  ┌─────────────────────────────────┐   │
│  │      SQLite Database (DB)       │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

#### Data Flow

**Chat Message Flow:**
```
1. User types → ChatInput component
2. ChatInput → useChatStore.sendMessage()
3. Store → window.electronAPI.sendAIChat()
4. IPC → Main process (ai.ts handler)
5. Handler → LlamaService.generateResponse()
6. LlamaService → llama.cpp (streaming)
7. Stream chunks → Renderer (IPC events)
8. Renderer → ChatBubble updates (streaming UI)
9. Complete → Save to DB
```

---

### 3.4 Adding Features

#### Example: Adding a New IPC Channel

**1. Define types** (`src/shared/types/ipc.ts`):
```typescript
export interface IPCChannel {
  // ... existing channels
  
  'system:screenshot': {
    request: { saveToFile?: boolean };
    response: { base64: string; path?: string };
  };
}
```

**2. Create handler** (`src/main/ipc/system.ts`):
```typescript
import { ipcMain } from 'electron';
import { screenshot } from 'screenshot-desktop';

export function registerSystemHandlers() {
  ipcMain.handle('system:screenshot', async (event, req) => {
    const img = await screenshot();
    const base64 = img.toString('base64');
    
    if (req.saveToFile) {
      const path = await saveScreenshot(img);
      return { base64, path };
    }
    
    return { base64 };
  });
}
```

**3. Register in main** (`src/main/index.ts`):
```typescript
import { registerSystemHandlers } from './ipc/system';

app.whenReady().then(() => {
  registerAIHandlers();
  registerFileHandlers();
  registerGitHandlers();
  registerSystemHandlers(); // Add this
});
```

**4. Expose in preload** (`src/preload/index.ts`):
```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  // ... existing APIs
  
  takeScreenshot: (saveToFile?: boolean) => 
    ipcRenderer.invoke('system:screenshot', { saveToFile }),
});
```

**5. Use in renderer** (`src/renderer/components/ScreenshotButton.tsx`):
```typescript
export function ScreenshotButton() {
  const [loading, setLoading] = useState(false);
  
  const handleClick = async () => {
    setLoading(true);
    try {
      const { base64, path } = await window.electronAPI.takeScreenshot(true);
      console.log('Screenshot saved:', path);
      // Show screenshot in chat...
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? 'Capturing...' : '📸 Screenshot'}
    </button>
  );
}
```

---

### 3.5 Plugin Development

Plugins extend Garden of Eden functionality without modifying core code.

#### Plugin Structure

```
my-plugin/
├── manifest.json       # Plugin metadata
├── index.js           # Main entry point
├── icon.png           # Plugin icon
└── README.md          # Documentation
```

#### manifest.json

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "My awesome plugin",
  "author": "Your Name",
  "main": "index.js",
  "permissions": [
    "fs:read",
    "fs:write",
    "network:fetch"
  ],
  "hooks": {
    "onMessageSent": true,
    "onMessageReceived": true,
    "onAppReady": true
  }
}
```

#### index.js

```javascript
class MyPlugin {
  constructor(api) {
    this.api = api;
  }
  
  async onActivate() {
    console.log('MyPlugin activated!');
    
    // Register command
    this.api.commands.register('my-command', async (args) => {
      await this.api.chat.sendMessage('Hello from plugin!');
    });
    
    // Add menu item
    this.api.menu.addItem({
      label: 'My Plugin Action',
      action: () => this.doSomething(),
    });
  }
  
  async onMessageSent(message) {
    // Hook: triggered when user sends message
    console.log('User sent:', message.content);
  }
  
  async onMessageReceived(message) {
    // Hook: triggered when AI responds
    console.log('AI responded:', message.content);
  }
  
  async doSomething() {
    const result = await this.api.fs.readFile('/path/to/file');
    await this.api.chat.sendMessage(`File contents: ${result}`);
  }
  
  async onDeactivate() {
    console.log('MyPlugin deactivated!');
  }
}

module.exports = MyPlugin;
```

#### Plugin API Reference

**api.chat**
```javascript
api.chat.sendMessage(content)           // Send message to chat
api.chat.getCurrentConversation()       // Get active conversation
api.chat.getHistory(limit)              // Get conversation history
```

**api.fs**
```javascript
api.fs.readFile(path)                   // Read file
api.fs.writeFile(path, content)         // Write file
api.fs.listDir(path)                    // List directory
api.fs.fileExists(path)                 // Check if file exists
```

**api.commands**
```javascript
api.commands.register(name, handler)    // Register slash command
api.commands.unregister(name)           // Unregister command
```

**api.menu**
```javascript
api.menu.addItem({ label, action })     // Add menu item
api.menu.removeItem(id)                 // Remove menu item
```

**api.settings**
```javascript
api.settings.get(key)                   // Get setting value
api.settings.set(key, value)            // Set setting value
```

---

### 3.6 Testing

#### Unit Tests

```typescript
// tests/unit/services/llama.test.ts
import { LlamaService } from '@/main/services/llama';

describe('LlamaService', () => {
  let service: LlamaService;
  
  beforeEach(() => {
    service = new LlamaService({
      modelPath: './models/test-model.gguf',
    });
  });
  
  afterEach(async () => {
    await service.dispose();
  });
  
  test('should generate response', async () => {
    const response = await service.generateResponse({
      messages: [{ role: 'user', content: 'Hello' }],
    });
    
    expect(response.content).toBeTruthy();
    expect(response.content.length).toBeGreaterThan(0);
  });
  
  test('should respect max tokens', async () => {
    const response = await service.generateResponse({
      messages: [{ role: 'user', content: 'Count to 100' }],
      maxTokens: 20,
    });
    
    expect(response.tokens).toBeLessThanOrEqual(20);
  });
});
```

#### Integration Tests

```typescript
// tests/integration/chat-flow.test.ts
import { app } from 'electron';
import { Database } from '@/main/services/db';
import { LlamaService } from '@/main/services/llama';

describe('Chat Flow Integration', () => {
  let db: Database;
  let llama: LlamaService;
  
  beforeAll(async () => {
    await app.whenReady();
    db = new Database(':memory:');
    llama = new LlamaService({ modelPath: './models/test.gguf' });
  });
  
  afterAll(async () => {
    await db.close();
    await llama.dispose();
  });
  
  test('complete chat flow', async () => {
    // Create conversation
    const conv = await db.createConversation({
      title: 'Test Chat',
      model: 'llama-3.1-8b',
    });
    
    // Send message
    const userMsg = await db.createMessage({
      conversationId: conv.id,
      role: 'user',
      content: 'What is 2+2?',
    });
    
    // Generate AI response
    const aiResponse = await llama.generateResponse({
      messages: [{ role: 'user', content: userMsg.content }],
    });
    
    // Save AI message
    const aiMsg = await db.createMessage({
      conversationId: conv.id,
      role: 'assistant',
      content: aiResponse.content,
    });
    
    // Verify conversation
    const messages = await db.getMessages(conv.id);
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('user');
    expect(messages[1].role).toBe('assistant');
  });
});
```

#### E2E Tests

```typescript
// tests/e2e/chat-ui.test.ts
import { ElectronApplication, Page, _electron } from 'playwright';
import { test, expect } from '@playwright/test';

let app: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
  app = await _electron.launch({ args: ['.'] });
  page = await app.firstWindow();
});

test.afterAll(async () => {
  await app.close();
});

test('should send and receive message', async () => {
  // Type message
  await page.fill('[data-testid="chat-input"]', 'Hello AI!');
  
  // Send message
  await page.press('[data-testid="chat-input"]', 'Enter');
  
  // Wait for user message to appear
  await page.waitForSelector('[data-testid="user-message"]');
  const userMsg = await page.textContent('[data-testid="user-message"]');
  expect(userMsg).toContain('Hello AI!');
  
  // Wait for AI response
  await page.waitForSelector('[data-testid="ai-message"]', { timeout: 30000 });
  const aiMsg = await page.textContent('[data-testid="ai-message"]');
  expect(aiMsg).toBeTruthy();
  expect(aiMsg.length).toBeGreaterThan(0);
});

test('should toggle dual mode', async () => {
  // Click mode toggle
  await page.click('[data-testid="mode-toggle"]');
  
  // Verify mode changed
  const modeText = await page.textContent('[data-testid="current-mode"]');
  expect(modeText).toContain('AI-Led');
  
  // Toggle back
  await page.click('[data-testid="mode-toggle"]');
  const newModeText = await page.textContent('[data-testid="current-mode"]');
  expect(newModeText).toContain('User-Led');
});
```

---

### 3.7 Contributing

#### Contribution Guidelines

1. **Fork & Clone**
   ```bash
   git clone https://github.com/yourusername/garden-of-eden-v3.git
   cd garden-of-eden-v3
   git remote add upstream https://github.com/original/garden-of-eden-v3.git
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/my-new-feature
   ```

3. **Make Changes**
   - Write code
   - Add tests
   - Update documentation

4. **Run Tests & Linting**
   ```bash
   npm run lint
   npm run test
   npm run type-check
   ```

5. **Commit with Conventional Commits**
   ```bash
   git commit -m "feat: add screenshot capture feature"
   git commit -m "fix: resolve memory leak in LlamaService"
   git commit -m "docs: update plugin development guide"
   ```

6. **Push & Create PR**
   ```bash
   git push origin feature/my-new-feature
   ```
   Then create Pull Request on GitHub

#### Code Style

**TypeScript:**
```typescript
// ✅ Good
export async function generateResponse(
  messages: Message[],
  options?: GenerateOptions
): Promise<Response> {
  const { maxTokens = 2048, temperature = 0.7 } = options ?? {};
  
  // Implementation...
}

// ❌ Bad
export async function generateResponse(messages, options) {
  let maxTokens = options?.maxTokens || 2048
  // No types, inconsistent formatting
}
```

**React Components:**
```tsx
// ✅ Good
interface ChatBubbleProps {
  message: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export function ChatBubble({ message, sender, timestamp }: ChatBubbleProps) {
  return (
    <div className={cn('chat-bubble', sender)}>
      <p>{message}</p>
      <time>{formatTime(timestamp)}</time>
    </div>
  );
}

// ❌ Bad
export default function ChatBubble(props) {
  return <div>{props.message}</div>
}
```

#### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests pass locally

## Screenshots (if applicable)
```

---

## 4. Troubleshooting

### 4.1 Common Issues

#### Issue: App won't start

**Symptoms:**
- App crashes on launch
- White screen
- "Application Error" dialog

**Solutions:**

1. **Check logs:**
   ```bash
   # macOS
   ~/Library/Logs/GardenOfEden/main.log
   
   # Windows
   %APPDATA%\GardenOfEden\logs\main.log
   
   # Linux
   ~/.config/GardenOfEden/logs/main.log
   ```

2. **Clear cache:**
   ```bash
   # macOS
   rm -rf ~/Library/Application\ Support/GardenOfEden/cache
   
   # Windows
   rmdir /s "%APPDATA%\GardenOfEden\cache"
   
   # Linux
   rm -rf ~/.config/GardenOfEden/cache
   ```

3. **Reinstall models:**
   ```bash
   # Delete models
   rm -rf ~/Library/Application\ Support/GardenOfEden/models
   
   # Relaunch app to trigger download wizard
   ```

#### Issue: Slow AI responses

**Symptoms:**
- AI takes 30+ seconds to respond
- Responses timeout
- High CPU usage

**Solutions:**

1. **Enable GPU acceleration:**
   Settings → Model → GPU Acceleration ✓

2. **Reduce context window:**
   Settings → Model → Context Window: 4096 (instead of 8192)

3. **Lower temperature:**
   Settings → Model → Temperature: 0.5 (instead of 0.7)

4. **Check system resources:**
   ```bash
   # Monitor CPU/RAM usage
   top -o cpu
   ```

#### Issue: Voice input not working

**Symptoms:**
- Microphone button grayed out
- No waveform animation
- "Microphone not available" error

**Solutions:**

1. **Grant microphone permission:**
   - macOS: System Preferences → Security & Privacy → Microphone → Garden of Eden ✓
   - Windows: Settings → Privacy → Microphone → Allow apps ✓

2. **Check microphone:**
   Settings → Voice → Input Device: [Select microphone]

3. **Restart audio service:**
   ```bash
   # macOS
   sudo killall coreaudiod
   
   # Windows
   Restart-Service -Name "Audiosrv"
   ```

#### Issue: Git integration not working

**Symptoms:**
- "Git not found" error
- Commands fail silently
- No repository detected

**Solutions:**

1. **Install Git:**
   ```bash
   # macOS (Homebrew)
   brew install git
   
   # Windows (Chocolatey)
   choco install git
   
   # Linux
   sudo apt install git  # Debian/Ubuntu
   sudo yum install git  # RHEL/CentOS
   ```

2. **Add Git to PATH:**
   ```bash
   # Verify Git is accessible
   git --version
   
   # If not, add to PATH:
   # Windows: Add C:\Program Files\Git\bin to PATH
   # macOS/Linux: Usually automatic after install
   ```

3. **Initialize repository:**
   ```bash
   cd /path/to/your/project
   git init
   ```

---

### 4.2 Performance Optimization

#### Reduce Memory Usage

1. **Limit conversation history:**
   Settings → Privacy → Auto-delete after 30 days ✓

2. **Disable unnecessary features:**
   - Settings → Voice → Auto-TTS ❌ (if not needed)
   - Settings → Vision → LLaVA Model ❌ (if not using vision)

3. **Close unused conversations:**
   Right-click conversation → Close

#### Improve Response Speed

1. **Use smaller model:**
   Settings → Model → Primary LLM: Llama 3.1 3B (instead of 8B)
   
   Note: Smaller model = faster but less capable

2. **Reduce max tokens:**
   Settings → Model → Max Tokens: 1024 (instead of 2048)

3. **Enable metal/CUDA:**
   ```bash
   # macOS (Metal)
   Settings → Model → GPU: Metal ✓
   
   # Windows/Linux (CUDA)
   Settings → Model → GPU: CUDA ✓
   ```

---

### 4.3 Data Management

#### Backup Data

```bash
# Full backup
cp -r ~/Library/Application\ Support/GardenOfEden ~/Desktop/GardenOfEden-Backup

# Just conversations
cp ~/Library/Application\ Support/GardenOfEden/conversations.db ~/Desktop/
```

#### Restore Data

```bash
# Restore full backup
cp -r ~/Desktop/GardenOfEden-Backup ~/Library/Application\ Support/GardenOfEden

# Restore just conversations
cp ~/Desktop/conversations.db ~/Library/Application\ Support/GardenOfEden/
```

#### Export All Conversations

```bash
# CLI export (if available)
garden-of-eden export --format json --output ~/Desktop/conversations.json

# Or use GUI: History → Select All → Export → JSON
```

---

## 5. FAQ

### General

**Q: Is Garden of Eden really 100% local?**
A: Yes! After initial model download, everything runs on your computer. No internet required.

**Q: What's the difference between User-Led and AI-Led mode?**
A: User-Led is reactive (AI waits for you), AI-Led is proactive (AI suggests actions).

**Q: Can I use my own AI models?**
A: Yes! Place GGUF format models in the models directory and select them in Settings.

**Q: Does Garden of Eden work offline?**
A: Yes, completely offline after setup.

### Privacy & Security

**Q: Is my data encrypted?**
A: Conversations are stored in plaintext SQLite locally. Enable disk encryption for security.

**Q: Can the AI access my files without permission?**
A: Only when you explicitly ask (e.g., "read this file"). AI cannot browse freely.

**Q: Is voice data sent to servers?**
A: No, all speech-to-text happens locally using Whisper.

### Performance

**Q: Why is the first response slow?**
A: Model loading takes time. Subsequent responses are faster (model stays in memory).

**Q: How much RAM does it use?**
A: ~4-6 GB for 8B model, ~2-3 GB for 3B model.

**Q: Can I run it on a laptop?**
A: Yes, but performance varies. Recommended: 16GB RAM, modern CPU.

### Features

**Q: Can I use multiple AI models simultaneously?**
A: Not currently, but you can switch models in Settings.

**Q: Does it support languages other than English/Korean?**
A: UI supports English/Korean. AI supports 50+ languages.

**Q: Can I customize the UI theme?**
A: Yes, Light/Dark/Auto modes. Custom themes via plugins.

---

**End of Part 7**

*Lines: ~1500*
*Total Specification: ~11,700 lines*

---
---

# Epilogue

**Garden of Eden V3** represents a complete vision for a desktop-first, privacy-focused, locally-powered AI assistant.

This specification covers:
- ✅ Part 1: Vision & Philosophy
- ✅ Part 2: AI Intelligence & Local Models  
- ✅ Part 3: Architecture & System Integration
- ✅ Part 4: UI/UX & Features (Expanded)
- ✅ Part 5: Implementation & Data Models
- ✅ Part 6: API Reference & Developer Documentation
- ✅ Part 7: User & Developer Guide

**Total: ~11,700 lines of comprehensive documentation**

All information needed to understand, build, use, and extend Garden of Eden V3 is now contained in this single master specification document.

Ready to build the future of personal AI assistants.

---

*Document Version: 3.0*
*Last Updated: 2025-01-12*
*Status: Complete*
