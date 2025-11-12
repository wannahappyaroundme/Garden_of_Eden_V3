# Quick Start Guide

Get Garden of Eden V3 running in 5 minutes.

---

## Prerequisites

### Required
- **Node.js**: v20+ (v20.11.0 recommended)
- **npm**: v10+
- **macOS**: 12.0+ (Monterey or later) for Metal GPU acceleration
- **RAM**: 16GB minimum (32GB recommended for smooth AI operation)
- **Storage**: 15GB free space (12GB for AI models, 3GB for app)

### Optional
- **Git**: For version control and development
- **VSCode**: Recommended IDE with TypeScript support

---

## Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd Eden_Project_V3
```

### 2. Install Dependencies
```bash
# Install Node.js dependencies
npm install

# Install Python dependencies (for future ML integrations)
pip install -r requirements.txt
```

### 3. Download AI Models

The Llama 3.1 8B model is required for the AI to function:

```bash
# Create models directory
mkdir -p ~/.garden-of-eden-v3/models

# Download Llama 3.1 8B (4.8GB, takes 2-5 minutes)
cd ~/.garden-of-eden-v3/models
curl -L -o llama-3.1-8b-instruct-q4_k_m.gguf \
  "https://huggingface.co/lmstudio-community/Meta-Llama-3.1-8B-Instruct-GGUF/resolve/main/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf?download=true"

# Verify download (should be ~4.8GB)
ls -lh llama-3.1-8b-instruct-q4_k_m.gguf
```

**Alternative**: Use a download manager or browser to download from:
```
https://huggingface.co/lmstudio-community/Meta-Llama-3.1-8B-Instruct-GGUF/blob/main/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf
```

Then move it to `~/.garden-of-eden-v3/models/`

---

## Running the App

### Development Mode (Hot Reload)
```bash
# Start both main and renderer processes
npm run dev

# Or run separately in two terminals:
npm run dev:main       # Terminal 1: Main process
npm run dev:renderer   # Terminal 2: React UI
```

The app will open automatically. If not, check the terminal for the URL (usually `http://localhost:5173`).

### First Launch
On first launch, the app will:
1. Create database at `~/.garden-of-eden-v3/database/eden.db`
2. Initialize with default persona settings
3. Load the Llama model (takes ~10-15 seconds on M3)
4. Display the chat interface

---

## Your First Conversation

### 1. Send a Message
Type anything in the input box at the bottom and press Enter:
```
Hello! What can you help me with?
```

### 2. Watch the Magic
- Conversation automatically created with title from your message
- AI response streams in real-time (token by token)
- Message saved to database
- Conversation appears in left sidebar

### 3. Switch Personas (Optional)
Click the ⚙️ settings icon → Persona tab → Try different presets:
- **Professional**: Formal, concise, business-focused
- **Friendly**: Warm, encouraging, casual
- **Technical**: Detailed, precise, developer-focused
- **Creative**: Imaginative, expressive, brainstorming
- **Casual**: Relaxed, emoji-friendly, conversational
- **Empathetic**: Understanding, supportive, patient

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` / `Ctrl+K` | Focus chat input |
| `Enter` | Send message |
| `Shift+Enter` | New line in message |
| `Esc` | Unfocus input |
| `Cmd+,` / `Ctrl+,` | Open settings |

---

## Features to Try

### 1. Ask Code Questions
```
Can you explain how JavaScript promises work?
```

Response will include syntax-highlighted code blocks!

### 2. Multi-Turn Conversations
```
User: What is React?
AI: [explains React]
User: How do hooks work?
AI: [explains hooks, remembering context]
```

### 3. File Operations
```
Read the package.json file and tell me what dependencies we have
```

The AI can read, search, and analyze files in your workspace.

### 4. Git Integration
```
Check the git status and tell me what files have changed
```

### 5. Conversation History
- All conversations auto-saved
- Click any conversation in sidebar to resume
- Delete or rename conversations via context menu

---

## Troubleshooting

### Model Not Loading
**Error**: "Failed to initialize AI model"

**Solutions**:
1. Verify model file exists:
   ```bash
   ls -lh ~/.garden-of-eden-v3/models/llama-3.1-8b-instruct-q4_k_m.gguf
   ```
2. Check file size is ~4.8GB (4,920,000,000 bytes)
3. Re-download if corrupted
4. Check console for detailed error logs

### Slow AI Responses
**Symptoms**: Responses take >10 seconds

**Solutions**:
1. Check GPU acceleration is working (should use Metal on macOS)
2. Close other heavy applications
3. Ensure you have 16GB+ RAM available
4. Check Activity Monitor for memory pressure

### Database Errors
**Error**: "Database locked" or "Failed to save message"

**Solutions**:
1. Close all Electron windows
2. Delete database: `rm -rf ~/.garden-of-eden-v3/database/`
3. Restart app (will recreate database)

### Port Already in Use
**Error**: "Port 5173 already in use"

**Solutions**:
1. Kill existing process:
   ```bash
   lsof -ti:5173 | xargs kill
   ```
2. Or change port in `vite.config.ts`

---

## Development Workflow

### Code Changes
1. Edit code in `src/`
2. Vite auto-reloads renderer (React UI)
3. Main process requires restart (Cmd+C then `npm run dev:main`)

### Database Changes
1. Edit schema in `src/main/database/schema.ts`
2. Delete database: `rm -rf ~/.garden-of-eden-v3/database/`
3. Restart app to recreate with new schema

### Adding Dependencies
```bash
# Frontend
npm install <package> --save

# Backend (main process)
npm install <package> --save

# Dev dependencies
npm install <package> --save-dev
```

---

## Project Structure (Quick Reference)

```
garden-of-eden-v3/
├── src/
│   ├── main/               # Electron main process (Node.js)
│   │   ├── services/ai/    # AI integrations
│   │   ├── database/       # SQLite + Repositories
│   │   └── ipc/            # IPC handlers
│   ├── renderer/           # React UI
│   │   ├── pages/          # Chat, Settings
│   │   └── components/     # UI components
│   ├── preload/            # Secure IPC bridge
│   └── shared/             # Types & constants
└── ~/.garden-of-eden-v3/   # User data
    ├── models/             # AI models (12GB)
    ├── database/           # SQLite DB
    └── logs/               # Application logs
```

---

## Next Steps

### For Users
1. ✅ Try different personas and find your favorite
2. ✅ Ask complex questions and see AI reasoning
3. ✅ Test file and git integrations
4. ⏳ Wait for voice input (coming soon)
5. ⏳ Wait for screen context (coming soon)

### For Developers
1. Read `PROJECT_EDEN_V3_MASTER_SPEC.md` (complete specification)
2. Read `IMPLEMENTATION_STATUS.md` (current progress)
3. Check `CLAUDE.md` (AI assistant guidelines)
4. Review architecture in main README
5. Start contributing!

---

## Getting Help

- **Issues**: File on GitHub Issues
- **Questions**: GitHub Discussions
- **Documentation**: See `/docs` folder
- **Logs**: Check `~/.garden-of-eden-v3/logs/`

---

## Performance Tips

### For Best Experience
1. **RAM**: 32GB recommended, 16GB minimum
2. **Storage**: SSD required (HDD will be too slow)
3. **CPU**: M3 or newer for Metal acceleration
4. **Close**: Other heavy apps while using AI
5. **Monitor**: Check Activity Monitor during first run

### Expected Performance (M3 chips)
- **M3 MAX**: 2-3s response time, ~60 tokens/sec
- **M3 Pro**: 3-5s response time, ~40 tokens/sec
- **M3**: 4-6s response time, ~30 tokens/sec

---

**Ready to start?** Run `npm run dev` and start chatting! 🚀
