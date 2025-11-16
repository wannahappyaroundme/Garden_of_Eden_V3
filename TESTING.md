# Testing Guide - Garden of Eden V3

Complete testing guide for Garden of Eden V3 covering manual testing, UX testing, and automated testing.

---

## 📋 Table of Contents

1. [Test Environment Setup](#test-environment-setup)
2. [Onboarding Testing](#onboarding-testing)
3. [Core Features Testing](#core-features-testing)
4. [UX Testing](#ux-testing)
5. [Performance Testing](#performance-testing)
6. [Accessibility Testing](#accessibility-testing)
7. [Bug Reporting](#bug-reporting)

---

## Test Environment Setup

### Prerequisites

**Services Required:**
- ✅ **Ollama Service**: Running (`ollama serve`)
- ✅ **phi3:mini Model**: Installed (`ollama pull phi3:mini`)
- ✅ **Development Server**: Running (`npm run dev`)

**System Requirements:**
- **OS**: macOS 14+ or Windows 11
- **RAM**: Minimum 8GB (16GB recommended for optimal performance)
- **Disk**: 20GB free space
- **Microphone**: For voice input testing
- **Speakers/Headphones**: For TTS output testing

### Installation

```bash
# 1. Clone and install dependencies
git clone https://github.com/wannahappyaroundme/Garden_of_Eden_V3.git
cd Garden_of_Eden_V3
npm install

# 2. Install Ollama and model
brew install ollama  # macOS
ollama pull phi3:mini

# 3. Run development mode
npm run dev
```

---

## Onboarding Testing

### Step 1: System Check (Auto, 2-3 seconds)

**What to test:**
- [ ] App shows "시스템 분석 중..." with loading spinner
- [ ] Progress items appear one by one (CPU, RAM, GPU, Disk)
- [ ] After detection, shows system specs:
  - CPU: Processor name and cores
  - RAM: Total and available
  - GPU: Graphics card info
  - Disk: Free space
- [ ] Auto-proceeds to Step 2 after 1.5 seconds

**Expected behavior:** Clean detection, no errors

---

### Step 2: Model Recommendation (User action required)

**What to test:**
- [ ] Shows appropriate recommendation badge based on RAM:
  - 8-12GB: "기본 성능" (phi3:mini or gemma2:2b)
  - 12-20GB: "균형 성능" (phi3:mini)
  - 20GB+: "최적 성능" (phi3:mini with higher performance)
- [ ] Lists required models:
  - 대화 AI (LLM): phi3:mini (~2.2GB)
  - Optional: Whisper for voice (if enabled)
- [ ] Shows total size and expected RAM usage
- [ ] "다음: 개성 설정" button is clickable
- [ ] "이전으로" button goes back to System Check

**Expected behavior:** Correct recommendation for user's system

---

### Step 3: Persona Survey (7 questions)

**What to test:**
- [ ] Progress bar shows "1 / 7", "2 / 7", etc.
- [ ] Each question has clear options
- [ ] Selection is highlighted
- [ ] "다음" button enabled after selection
- [ ] "이전" button works correctly
- [ ] Final question shows "완료" button
- [ ] Persona parameters calculated correctly

**Questions covered:**
1. Formality level (격식/반말)
2. Response length preference
3. Explanation style (간단/상세)
4. Humor usage
5. Emoji usage
6. Technical depth
7. Proactive suggestions

---

### Step 4: Model Download

**What to test:**
- [ ] Download starts automatically
- [ ] Progress bar shows percentage
- [ ] Shows current/total size (e.g., "0.5GB / 2.2GB")
- [ ] Download speed displayed
- [ ] Success screen shows after completion
- [ ] "앱 시작하기" button appears

**Expected behavior:** Smooth download with accurate progress

---

## Core Features Testing

### Chat Interface

**Test Scenarios:**

#### 1. Basic Text Chat
- [ ] Type message in input field
- [ ] Press Enter or click send button
- [ ] Message appears as user bubble (right-aligned, blue)
- [ ] AI response appears as assistant bubble (left-aligned, gray)
- [ ] Timestamp shows below each message
- [ ] Markdown rendering works (bold, italic, code blocks, lists)
- [ ] Code syntax highlighting works
- [ ] Response time < 5 seconds (phi3:mini)

#### 2. Streaming Response
- [ ] AI response appears word-by-word
- [ ] Typing indicator shows before response
- [ ] No visual glitches during streaming
- [ ] Can scroll while streaming
- [ ] Stream completes successfully

#### 3. Korean Language Support
- [ ] Korean questions get Korean responses
- [ ] English questions get English responses
- [ ] Mixed language handled correctly
- [ ] No encoding issues with Korean text
- [ ] Emojis render correctly

#### 4. Voice Input (if enabled)
- [ ] Click microphone button
- [ ] Recording indicator shows
- [ ] Stop button appears
- [ ] Audio waveform visualizes input
- [ ] Transcription appears in input field
- [ ] Can edit transcription before sending

#### 5. Text-to-Speech
- [ ] Speaker button appears on AI messages
- [ ] Click speaker to play TTS
- [ ] Audio plays correctly (Korean or English)
- [ ] Can pause/stop playback
- [ ] Volume/speed settings work

---

### Settings Panel

**Test Scenarios:**

- [ ] Settings icon opens panel
- [ ] Persona sliders work smoothly
- [ ] Changes apply in real-time
- [ ] Reset to defaults works
- [ ] Export persona configuration
- [ ] Import persona configuration
- [ ] Dark mode toggle works
- [ ] Language toggle (Korean/English) works
- [ ] Model selection dropdown works

---

### Conversation History

**Test Scenarios:**

- [ ] History sidebar opens/closes
- [ ] Shows list of past conversations
- [ ] Click conversation to load
- [ ] Delete conversation works
- [ ] Search conversations works
- [ ] New conversation button creates fresh chat
- [ ] Conversation titles auto-generate
- [ ] Can rename conversations

---

## UX Testing

### Usability Checklist

#### First-Time User Experience
- [ ] Onboarding is intuitive (no confusion)
- [ ] Clear instructions at each step
- [ ] Can complete onboarding in < 5 minutes
- [ ] Error messages are helpful

#### Visual Design
- [ ] UI feels modern and clean
- [ ] Colors are pleasant (not harsh)
- [ ] Typography is readable
- [ ] Icons are intuitive
- [ ] Spacing feels comfortable

#### Interaction Design
- [ ] Buttons have clear hover states
- [ ] Loading states are visible
- [ ] Transitions are smooth
- [ ] No accidental clicks
- [ ] Keyboard shortcuts work (Enter to send, etc.)

---

## Performance Testing

### Response Time Benchmarks

**Target: < 5 seconds for all responses**

Test with different message types:
- [ ] Short question (< 20 words): < 4 seconds
- [ ] Medium question (20-50 words): < 5 seconds
- [ ] Long question (50+ words): < 7 seconds
- [ ] Code generation request: < 8 seconds

### Memory Usage

- [ ] Initial load: < 500MB
- [ ] After 10 messages: < 800MB
- [ ] After 50 messages: < 1.2GB
- [ ] No memory leaks after extended use

### UI Responsiveness

- [ ] Smooth scrolling (60 FPS)
- [ ] No lag when typing
- [ ] Animations don't stutter
- [ ] App remains responsive during AI generation

---

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Enter/Space activates buttons
- [ ] Escape closes modals/panels
- [ ] Arrow keys navigate lists

### Screen Reader Support
- [ ] All buttons have aria-labels
- [ ] Messages announce correctly
- [ ] Loading states announced
- [ ] Error messages readable

### Visual Accessibility
- [ ] Color contrast meets WCAG AA
- [ ] Text is resizable
- [ ] Focus indicators visible
- [ ] No flashing content

---

## Bug Reporting

### Bug Report Template

```markdown
**Bug Title**: [Clear, one-line description]

**Severity**: [Critical / High / Medium / Low]

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happened]

**Screenshots/Video**:
[Attach if applicable]

**Environment**:
- OS: [macOS 14 / Windows 11]
- RAM: [16GB]
- Model: [phi3:mini]
- Build: [Development / Production]

**Console Errors**:
[Paste any console errors]
```

### Common Issues

| Issue | Severity | Solution |
|-------|----------|----------|
| Ollama not running | Critical | Run `ollama serve` |
| Model not found | High | Run `ollama pull phi3:mini` |
| Slow responses (>10s) | High | Check system RAM, restart app |
| Voice input fails | Medium | Check microphone permissions |
| TTS not working | Medium | Check system audio settings |

---

## Test Coverage Goals

- **Unit Tests**: 80% coverage (Jest)
- **Integration Tests**: Key user flows
- **E2E Tests**: Critical paths (Playwright)
- **Manual Testing**: All features before release

---

**Last Updated**: 2025-11-16
**Test Status**: ✅ Core features tested | ⏳ Performance optimization ongoing
**Next Test Cycle**: Before v1.0.0 release
