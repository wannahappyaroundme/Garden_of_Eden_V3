# Smart Onboarding Testing Guide

## 🎯 Current Status
✅ **App is running in development mode**
- Dev server running in background
- Vite: http://localhost:5173/
- Tauri app window should be open

## 📋 Your System Specs (Expected Results)
- **RAM**: 36GB → Should recommend **Qwen 2.5 14B (optimal tier)**
- **Disk**: 556GB free → Sufficient for all models
- **Ollama**: v0.12.10 installed and running ✅

## 🧪 Testing Checklist

### Step 1: System Check ⏱️ Auto (2-3 seconds)
**What to test:**
- [ ] App shows "시스템 분석 중..." with loading spinner
- [ ] Progress items appear one by one (CPU, RAM, GPU, Disk)
- [ ] After detection, shows your specs:
  - CPU: Apple M3 Max (16 cores) or similar
  - RAM: 36GB (available: ~XX GB)
  - GPU: Apple Silicon (Metal) ✅
  - Disk: 556GB free
- [ ] Auto-proceeds to Step 2 after 1.5 seconds

**Expected behavior:** Clean detection, no errors

---

### Step 2: Model Recommendation ⏱️ User action required
**What to test:**
- [ ] Shows green "최적의 성능!" badge with 🚀 emoji
- [ ] Recommends **Qwen 2.5 14B Instruct** (~9.0GB)
- [ ] Lists 3 required models:
  - 대화 AI (LLM): qwen2.5:14b
  - 비전 AI (LLaVA): llava:7b
  - 음성 인식 (Whisper): whisper:large-v3
- [ ] Shows total size: ~16.5GB
- [ ] Shows expected RAM usage: ~12-14GB
- [ ] "다음: 개성 설정" button is clickable
- [ ] "이전으로" button goes back to System Check

**Expected behavior:** Correct recommendation for 36GB system

---

### Step 3: Survey Flow ⏱️ User action required (7 questions)
**What to test:**
- [ ] Progress bar shows "1 / 7", "2 / 7", etc.
- [ ] Question 1 (Multiple choice): "에덴을 주로 어떤 용도로 사용하실 계획인가요?"
  - 4 options with emojis
  - Click animates and auto-proceeds
- [ ] Question 2 (Multiple choice): "AI 어시스턴트 사용 경험이 어느 정도이신가요?"
  - 4 experience levels
- [ ] Question 3 (Multiple choice): "주로 어떤 언어로 대화하실 건가요?"
  - Korean, English, or both
- [ ] Question 4 (Multiple choice): "AI가 어떤 말투로 대화하기를 원하시나요?"
  - 3 speech styles
- [ ] Question 5 (Text): "이상적인 AI의 성격과 특성은 어떤 모습인가요?"
  - Textarea input
  - Can skip
  - Submit with button or Cmd/Ctrl+Enter
- [ ] Question 6 (Text): "이전에 사용했던 AI에서 아쉬웠던 점이 있나요?"
- [ ] Question 7 (Text): "에덴에서 가장 기대하는 기능이나 특징은 무엇인가요?"
- [ ] After last question, shows "당신만을 위한 AI를 만들고 있습니다..." with spinner
- [ ] Auto-proceeds to Step 4

**Expected behavior:** Smooth transitions, no UI glitches

---

### Step 4: Model Downloader ⏱️ Auto (may take 10-30 minutes)
**What to test:**

#### 4a. Ollama Check (should pass)
- [ ] Shows "환경 확인 중..." briefly
- [ ] Detects Ollama is installed ✅
- [ ] No error screen appears

#### 4b. Model Check
- [ ] Checks which models already exist
- [ ] If you already have qwen2.5:14b, it should skip that download
- [ ] If you already have llava:7b, it should skip that download
- [ ] If you already have whisper:large-v3, it should skip that download

#### 4c. Download Progress
For each missing model:
- [ ] Shows model card with icon (💬 🎁 🎤)
- [ ] Progress bar updates in real-time
- [ ] Percentage shows (e.g., "다운로드 중... 45.3%")
- [ ] Download speed shows (e.g., "12.5 MB/s") if available
- [ ] Status changes: "대기 중..." → "다운로드 중... X%" → "완료!"
- [ ] Green checkmark appears when completed
- [ ] Blue info box at bottom: "다운로드가 중단되어도 다음 실행 시 자동으로 이어서 진행됩니다."
- [ ] "이전으로" button available (will cancel downloads)

#### 4d. Completion
- [ ] All 3 models show green checkmarks
- [ ] Auto-proceeds to Step 5 after ~2 seconds

**Expected behavior:**
- If models already exist: Skip to Step 5 immediately
- If downloading: Real-time progress updates, smooth completion

**How to test download resume:**
1. Let one model partially download (e.g., 30%)
2. Kill the app (Cmd+Q)
3. Restart app
4. Should resume from ~30%

---

### Step 5: Completion Screen ⏱️ User action required
**What to test:**
- [ ] Confetti animation plays (colorful dots falling)
- [ ] Large green checkmark with bounce animation
- [ ] "설정 완료!" title
- [ ] 3 feature cards:
  - 💬 자연스러운 대화
  - 👁️ 화면 이해
  - 🎤 음성 대화
- [ ] "에덴과 대화 시작하기" button with arrow icon
- [ ] Button hover effect (scale up, shadow)
- [ ] Privacy note at bottom: "100% 로컬 실행 · 데이터는 절대 외부로 전송되지 않습니다"
- [ ] Clicking button goes to Chat page

**Expected behavior:** Celebration feel, smooth transition to chat

---

## 🐛 Common Issues to Watch For

### Backend Errors
Check terminal output for:
- [ ] Rust panic messages
- [ ] "Failed to detect system specs"
- [ ] "Failed to get model recommendation"
- [ ] "Failed to save onboarding state"
- [ ] Database errors

### Frontend Errors
Open DevTools (Cmd+Option+I) and check Console for:
- [ ] TypeScript errors
- [ ] Failed API calls (red network errors)
- [ ] React warnings
- [ ] Unhandled promise rejections

### UI Issues
- [ ] Dark mode works correctly
- [ ] Buttons are clickable
- [ ] Text is readable
- [ ] Animations don't stutter
- [ ] No layout shifts
- [ ] Progress bars update smoothly

---

## 🔧 Troubleshooting

### If Ollama Error Appears
1. Check Ollama is running: `pgrep ollama`
2. If not running: `ollama serve &`
3. Click "다시 시도" button

### If Download Fails
1. Check internet connection
2. Check Ollama is running
3. Try manually: `ollama pull qwen2.5:14b`
4. Click "다시 시도" in app

### If App Crashes
1. Check terminal for error messages
2. Check database permissions
3. Try deleting database to restart onboarding:
   ```bash
   rm "$HOME/Library/Application Support/garden-of-eden-v3/data.db"
   ```

### To Reset Onboarding
```bash
rm "$HOME/Library/Application Support/garden-of-eden-v3/data.db"
# Restart app
```

---

## 📊 What Gets Saved to Database

After each step, check database persistence:

```bash
# View onboarding state
sqlite3 "$HOME/Library/Application Support/garden-of-eden-v3/data.db" \
  "SELECT * FROM onboarding_state;"

# View persona settings (after completion)
sqlite3 "$HOME/Library/Application Support/garden-of-eden-v3/data.db" \
  "SELECT * FROM persona_settings;"

# View user profile (after completion)
sqlite3 "$HOME/Library/Application Support/garden-of-eden-v3/data.db" \
  "SELECT * FROM user_profile;"
```

Expected data:
- **onboarding_state**: system_specs_json, recommended_model, selected_model, survey_results_json, custom_prompt, completed=1
- **persona_settings**: formality, humor, emoji_usage, etc. (adjusted based on survey)

---

## ✅ Success Criteria

The onboarding is **successful** if:
1. ✅ All 5 steps complete without errors
2. ✅ System specs detected correctly (36GB RAM → Qwen 14B)
3. ✅ Survey data collected and custom prompt generated
4. ✅ All 3 models download successfully (or skip if already exist)
5. ✅ Database has complete onboarding state (completed=1)
6. ✅ App transitions to Chat page
7. ✅ No console errors or warnings

---

## 📝 Monitoring Logs

The dev server is running in background. To view real-time logs:

```bash
# View current output
tail -f /tmp/eden-dev.log

# Or check background process
# [Process ID will be shown when server started]
```

---

## 🎬 Recording Test Results

Please note:
- Any error messages in terminal
- Any UI glitches or layout issues
- Download speeds and total time
- Whether resume works correctly
- Any confusing UX moments

---

**Happy Testing!** 🚀

Let me know if you find any issues, and I'll fix them immediately.
