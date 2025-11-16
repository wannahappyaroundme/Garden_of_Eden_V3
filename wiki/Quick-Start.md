# Quick Start Guide

Get up and running with Garden of Eden V3 in 5 minutes!

---

## 1. Install Prerequisites

```bash
# Install Ollama (AI model runtime)
brew install ollama

# Start Ollama service
brew services start ollama
```

---

## 2. Install Garden of Eden V3

### Option A: Download Release (Easiest)

1. Download the [latest release](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/releases/latest)
2. Open the DMG and drag to Applications
3. Launch the app

### Option B: Build from Source

```bash
# Clone repository
git clone https://github.com/wannahappyaroundme/Garden_of_Eden_V3.git
cd Garden_of_Eden_V3

# Install dependencies
npm install

# Run the app
npm run dev
```

---

## 3. Complete Onboarding

On first launch, the wizard will guide you through:

1. **Language Selection** - Choose Korean or English
2. **Model Download** - Automatic download of qwen2.5:7b (~4.7GB, 5-10 min)
3. **Persona Setup** - Customize AI personality
4. **Google Login** (Optional) - For cloud backup

---

## 4. Start Chatting!

### Basic Chat

Type any message and press Enter:

```
You: 안녕하세요! 자기소개 해주세요.
AI: 안녕하세요! 저는 Garden of Eden V3 AI 어시스턴트입니다...
```

### Voice Input

Click the microphone icon or press `Cmd+Shift+V`:
- Speak your message
- Click again to stop recording
- Message automatically transcribed and sent

### Screen Context

Click the monitor icon to add screen context:
- AI can see your current screen
- Useful for debugging, UI feedback, etc.

---

## 5. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` | Focus chat input |
| `Cmd+,` | Open settings |
| `Cmd+Shift+V` | Toggle voice input |
| `Cmd+N` | New conversation |
| `Cmd+H` | Toggle conversation history |

---

## 6. Customize Persona

Go to Settings > Persona to adjust:

- **Formality** - How professional the AI sounds
- **Verbosity** - How detailed responses are
- **Humor** - How playful the AI is
- **Emoji Usage** - How many emojis to use
- And 6 more parameters!

---

## 7. Enable Cloud Backup (Optional)

1. Go to Settings > Account
2. Click "Login with Google"
3. Authorize the app
4. Go to Settings > Persona
5. Click "Backup to Cloud"

Your persona settings are now backed up to Google Drive!

---

## Common Commands

### Ask for help
```
"What can you help me with?"
"Show me examples of what you can do"
```

### File operations
```
"Create a new file called README.md with project description"
"Search for TODO comments in my code"
```

### Git operations
```
"Show me git status"
"Create a commit with message 'Add feature X'"
```

### Screen analysis
```
"What do you see on my screen?"
"Analyze this UI and suggest improvements"
```

---

## Next Steps

- Read the full [User Guide](User-Guide)
- Learn about [Voice Features](Voice-Features)
- Explore [Advanced Features](Advanced-Features)
- Check out [Keyboard Shortcuts](Keyboard-Shortcuts)

---

## Troubleshooting

### Model won't download?
```bash
# Manually download
ollama pull qwen2.5:7b
```

### App won't start?
- Check Ollama is running: `brew services list`
- Restart Ollama: `brew services restart ollama`

### Slow responses?
- Close other apps to free RAM
- Ensure you have 16GB+ RAM
- Use Apple Silicon for best performance

For more help, see [Troubleshooting Guide](Troubleshooting).

---

**Congratulations!** You're now ready to use Garden of Eden V3 🎉
