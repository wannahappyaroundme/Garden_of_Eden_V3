# Manual Testing Checklist - Garden of Eden V3

**Test Date**: 2025-11-15
**Build Status**: ✅ Running (Development Mode)
**Tester**: User Manual Testing

---

## Prerequisites

### ✅ Services Required

- [x] **Ollama Service**: Running (`ollama serve`)
- [x] **Qwen Model**: Installed (`ollama pull qwen2.5:14b`)
- [x] **Whisper**: Installed (`/opt/homebrew/bin/whisper`)
- [x] **Whisper Model**: ggml-base.bin in `~/.whisper-models/`
- [x] **Development Server**: Running (`npm run dev`)

### System Requirements

- macOS (current platform)
- 16GB+ RAM recommended for Qwen 2.5 14B
- Microphone access for voice input
- Speaker/headphones for TTS output

---

## 🎯 Test Plan Overview

### Phase 2 Features (100% Complete)

1. ✅ Basic chat interface
2. ✅ AI response streaming
3. ✅ Voice input (Whisper STT)
4. ✅ Text-to-speech (TTS)
5. ✅ KakaoTalk-style UI
6. ✅ Conversation history
7. ✅ Error handling
8. ✅ Settings panel

### Features to Test Today

1. Voice recording → transcription → chat
2. TTS speak button on AI messages
3. TTS settings (rate, volume)
4. Conversation history toggle
5. Chat bubble animations
6. Error states and retry
7. End-to-end chat flow

---

## 📋 Detailed Test Cases

### 1. Application Startup

**Goal**: Verify app launches successfully without errors

- [x] App window opens
- [x] No console errors in DevTools
- [x] Database initializes (check terminal logs)
- [x] UI renders correctly (no blank screens)
- [x] Chat interface is visible
- [x] Conversation history is **hidden by default** ✨

**Expected**: Clean startup, chat ready to use

---

### 2. Conversation History Sidebar

**Goal**: Test the hamburger menu toggle functionality

#### Test 2A: Default State (Hidden)

- [x] Open app fresh
- [x] Verify conversation history sidebar is **NOT visible**
- [x] Chat area takes full width

**Expected**: Sidebar hidden on startup

#### Test 2B: Toggle Visibility

- [x] Click hamburger menu button (☰) in top-left header
- [x] Sidebar slides in from left with animation
- [x] Click hamburger button again
- [x] Sidebar disappears

**Expected**: Smooth slide-in-left animation, toggle works

#### Test 2C: Navigation

- [x] Open sidebar
- [x] Send a few messages to create a conversation
- [x] Click "New Chat" button
- [x] Verify messages clear
- [x] Send another message (new conversation)
- [x] Click previous conversation in sidebar
- [x] Verify old messages load

**Expected**: Conversation switching works correctly

---

### 3. Basic Text Chat

**Goal**: Test standard text input → AI response flow

#### Test 3A: Simple Message

- [x] Type "안녕하세요" (or "Hello") in chat input
- [x] Press Enter or click send button
- [x] User message appears immediately (right side, purple bubble)
- [x] Typing indicator shows (3 animated dots with AI avatar)
- [x] AI response streams in (left side, gray bubble)
- [x] Timestamp appears below each bubble (HH:MM format)

**Expected**: Smooth chat flow, streaming works, messages appear correctly

#### Test 3B: Long Message

- [x] Send a long message (e.g., "Tell me a story about a dragon in Korean")
- [x] Verify streaming updates in real-time
- [x] Check that bubble width adjusts (max 70%)
- [x] Verify markdown rendering works (bold, italic, lists)

**Expected**: Long responses stream correctly, UI doesn't break

#### Test 3C: Multiple Messages

- [x] Send 5-10 messages in succession
- [x] Verify scroll works
- [x] Check that timestamps are accurate
- [x] Verify chat history persists

**Expected**: No performance issues, smooth scrolling

---

### 4. Voice Input (Whisper STT)

**Goal**: Test voice recording → transcription → chat integration

#### Test 4A: Start Recording

- [x] Click microphone button in chat input (bottom-right)
- [x] Button changes color to indicate recording
- [ ] Speak clearly: "안녕하세요, 날씨가 어때요?" (or English phrase)
- [ ] Check DevTools console for "Recording started" log
- [ ] Visual feedback shows recording in progress

**Expected**: Recording starts, UI updates

#### Test 4B: Stop & Transcribe

- [ ] Click microphone button again to stop
- [ ] Wait for transcription (2-5 seconds)
- [ ] Transcribed text appears in chat input field
- [ ] Text is editable before sending

**Expected**: Transcription works, text appears in input

#### Test 4C: Send Transcribed Message

- [ ] After transcription appears, press Enter
- [ ] Message sends normally
- [ ] AI responds to the transcribed content

**Expected**: Voice → text → AI flow works end-to-end

#### Test 4D: Error Handling

- [ ] Click mic button
- [ ] Immediately click again (cancel)
- [ ] Verify no errors
- [ ] Try recording with no microphone permission
- [ ] Verify friendly error message appears

**Expected**: Graceful error handling

---

### 5. Text-to-Speech (TTS)

**Goal**: Test TTS speak button and controls

#### Test 5A: TTS Speak Button (Basic)

- [ ] Send a message, get AI response
- [ ] Hover over AI message bubble
- [ ] Action buttons appear on the right (-36px offset)
- [ ] Click **first button** (microphone icon) to speak
- [ ] Audio plays through speakers/headphones
- [ ] Button changes to pause icon (blue highlight)
- [ ] Korean text is pronounced correctly

**Expected**: TTS plays, button updates, audio is clear

#### Test 5B: Stop TTS Mid-Speech

- [ ] Start TTS playback (long AI message)
- [ ] Click pause button (same button) mid-speech
- [ ] Audio stops immediately
- [ ] Button returns to microphone icon

**Expected**: TTS can be interrupted

#### Test 5C: TTS on Multiple Messages

- [ ] Get 3-4 AI responses
- [ ] Hover over each bubble
- [ ] Click speak button on different messages
- [ ] Verify only one plays at a time (new one stops previous)

**Expected**: No audio overlap

---

### 6. TTS Settings (Rate & Volume)

**Goal**: Test TTS customization controls

#### Test 6A: Navigate to Settings

- [ ] Click Settings button (top-right or bottom navigation)
- [ ] Open "App Settings" tab
- [ ] Scroll to "🔊 음성 출력 (TTS)" section

**Expected**: TTS settings visible

#### Test 6B: Adjust Speech Rate

- [ ] Default rate is **1.0x**
- [ ] Move slider to **0.5x** (slow)
- [ ] Go back to chat, trigger TTS
- [ ] Verify speech is slower
- [ ] Return to settings, set to **2.0x** (fast)
- [ ] Trigger TTS again
- [ ] Verify speech is faster

**Expected**: Rate changes take effect immediately

#### Test 6C: Adjust Volume

- [ ] Default volume is **100%**
- [ ] Move slider to **50%**
- [ ] Trigger TTS
- [ ] Verify quieter audio
- [ ] Set to **0%**
- [ ] Trigger TTS
- [ ] Verify silent (or very quiet)

**Expected**: Volume changes take effect

#### Test 6D: Visual Feedback

- [ ] As you drag sliders, verify:
  - Rate shows decimal value (e.g., "1.2x")
  - Volume shows percentage (e.g., "75%")
  - Labels update in real-time

**Expected**: Smooth slider interaction, live updates

---

### 7. Chat Bubble Styling (KakaoTalk-Inspired)

**Goal**: Verify enhanced visual design

#### Test 7A: User Bubbles

- [ ] Send a message
- [ ] Verify bubble is on the **right side**
- [ ] Background color: Light purple (`--chat-user-bg`)
- [ ] Rounded corners with top-right cutoff (rounded-tr-sm)
- [ ] Shadow on hover (hover:shadow-lg)
- [ ] Slide-in-right animation

**Expected**: Matches KakaoTalk user message style

#### Test 7B: AI Bubbles

- [ ] Get AI response
- [ ] Verify bubble is on the **left side**
- [ ] AI avatar "E" in gradient circle (primary colors)
- [ ] Background: Light gray (`--chat-ai-bg`)
- [ ] Top-left cutoff (rounded-tl-sm)
- [ ] Border: `border-border/50`
- [ ] Slide-in-left animation

**Expected**: Matches KakaoTalk AI message style

#### Test 7C: Action Buttons (Hover)

- [ ] Hover over AI message
- [ ] Verify 4 buttons appear smoothly on the right:
  1. **TTS Speak** (microphone icon)
  2. **Thumbs Up** (positive feedback)
  3. **Thumbs Down** (negative feedback)
  4. **Copy** (clipboard icon)
- [ ] Buttons have hover effects (scale 1.1)
- [ ] Click animations (scale 0.95)
- [ ] Background: `bg-background/80 backdrop-blur-sm`

**Expected**: Polished hover interactions

---

### 8. Error Handling

**Goal**: Test error states and retry functionality

#### Test 8A: Ollama Not Running

- [ ] Stop Ollama service (`killall ollama` in terminal)
- [ ] Send a message
- [ ] Verify friendly error message:

  ```
  🔌 AI 서비스에 연결할 수 없습니다.

  Ollama가 실행 중인지 확인해주세요:
  1. 터미널에서 "ollama serve" 실행
  2. "ollama pull qwen2.5:14b" 로 모델 다운로드
  ```

- [ ] Error bubble appears with red avatar
- [ ] "다시 시도" button shows

**Expected**: User-friendly error, helpful instructions

#### Test 8B: Retry Failed Message

- [ ] Click "다시 시도" button on error
- [ ] Original message re-sends
- [ ] If Ollama is still down, error repeats
- [ ] Start Ollama (`ollama serve`)
- [ ] Click "다시 시도" again
- [ ] Message succeeds this time

**Expected**: Retry works, recovers from errors

#### Test 8C: Other Error Types

- [ ] Test timeout error (mock slow response)
- [ ] Verify timeout message shows
- [ ] Test database error (if possible)
- [ ] Verify database error message shows

**Expected**: Different errors have specific messages

---

### 9. Loading States & Animations

**Goal**: Verify all loading indicators work

#### Test 9A: Typing Indicator

- [ ] Send a message
- [ ] While AI is thinking, check for:
  - AI avatar "E" circle
  - 3 animated dots bouncing
  - Gray bubble background
  - Smooth animation (bounce with delays)

**Expected**: Clear visual feedback

#### Test 9B: Message Animations

- [ ] Send user message → slide-in-right
- [ ] Receive AI message → slide-in-left
- [ ] Verify animations are smooth (300ms ease-out)

**Expected**: No jank, smooth transitions

#### Test 9C: Button Loading States

- [ ] Click TTS button → verify blue highlight during playback
- [ ] Click feedback buttons → verify green/red highlight on selection
- [ ] Click copy button → verify checkmark appears briefly

**Expected**: Interactive feedback

---

### 10. Dark Mode (If Implemented)

**Goal**: Test theme switching

- [ ] Toggle dark mode (if available in settings)
- [ ] Verify color scheme updates:
  - Background: Dark gray
  - Text: Light gray/white
  - User bubble: Darker purple
  - AI bubble: Dark gray
  - Borders and shadows adjust
- [ ] Check that all text is readable

**Expected**: Proper dark mode contrast

---

### 11. Keyboard Navigation & Accessibility

**Goal**: Test keyboard-only usage

#### Test 11A: Tab Navigation

- [ ] Press Tab repeatedly
- [ ] Verify focus moves through:
  - Chat input field
  - Send button
  - Voice button
  - Settings button
  - Sidebar toggle (if open)
- [ ] Check focus-visible outlines (2px primary color)

**Expected**: Logical tab order, visible focus

#### Test 11B: Keyboard Shortcuts

- [ ] Press Enter in chat input → sends message
- [ ] Press Escape in chat input → clears text (if implemented)
- [ ] Test any other shortcuts

**Expected**: Shortcuts work as documented

#### Test 11C: ARIA Labels

- [ ] Open DevTools → Accessibility Inspector
- [ ] Verify chat bubbles have proper roles:
  - `role="article"`
  - `aria-label="사용자 메시지"` or `"AI 메시지"`
- [ ] Verify buttons have `aria-label` attributes

**Expected**: Screen reader friendly

---

### 12. Performance

**Goal**: Ensure smooth performance

#### Test 12A: Memory Usage

- [ ] Open Activity Monitor (macOS) or Task Manager
- [ ] Monitor RAM usage during:
  - Idle: ~10-12GB (Qwen loaded)
  - Active chat: ~12-14GB
  - No memory leaks after 50+ messages

**Expected**: Stable memory usage

#### Test 12B: Response Time

- [ ] Send simple question: "Hello"
- [ ] Measure time to first token: **<3 seconds**
- [ ] Measure full response: **3-5 seconds**
- [ ] Complex question: "Explain quantum physics"
- [ ] Measure time: **5-8 seconds**

**Expected**: Meets 2-4s target for typical queries

#### Test 12C: UI Responsiveness

- [ ] While AI is responding, try:
  - Scrolling chat
  - Opening settings
  - Clicking buttons
- [ ] Verify no UI freezing (60 FPS maintained)

**Expected**: UI stays responsive

---

## 🐛 Known Issues

### To Report

- [ ] List any bugs found during testing
- [ ] Include steps to reproduce
- [ ] Include screenshots if applicable

### Current Warnings (Non-Critical)

- Rust warnings: unused imports (9 warnings)
- These don't affect functionality

---

## ✅ Test Results Summary

**Test Date**: **\*\***\_**\*\***
**Tester**: **\*\***\_**\*\***
**Build Version**: 1.0.0 (dev)

### Overall Status

- [ ] ✅ All tests passed
- [ ] ⚠️ Minor issues found (list below)
- [ ] ❌ Critical issues found (list below)

### Critical Features

- [ ] Chat works
- [ ] Voice input works
- [ ] TTS works
- [ ] Error handling works
- [ ] Performance acceptable

### Issues Found

1. ***
2. ***
3. ***

### Recommendations

1. ***
2. ***
3. ***

---

## 📌 Next Steps After Testing

1. **If all tests pass**:
   - Mark testing tasks as complete
   - Proceed to Phase 3 (System Integration)
   - Begin file system integration

2. **If issues found**:
   - Document bugs in GitHub Issues
   - Prioritize critical bugs
   - Fix before moving forward

3. **Performance optimization**:
   - Profile any slow areas
   - Optimize if needed
   - Re-test after fixes

---

## 🎓 Testing Tips

1. **Use DevTools Console**:
   - Open with `Cmd+Option+I` (macOS)
   - Watch for errors, warnings, logs
   - Check network tab for API calls

2. **Test Edge Cases**:
   - Empty input
   - Very long messages (1000+ characters)
   - Rapid clicking
   - Switching conversations mid-response

3. **User Perspective**:
   - Imagine you're a first-time user
   - Is anything confusing?
   - Are errors helpful?

4. **Document Everything**:
   - Screenshots of bugs
   - Console logs for errors
   - Steps to reproduce

---

**Good luck with testing! 🚀**
