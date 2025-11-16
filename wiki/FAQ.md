# Frequently Asked Questions (FAQ)

Common questions about Garden of Eden V3.

---

## General

### What is Garden of Eden V3?

Garden of Eden V3 is a **100% local, privacy-first desktop AI assistant** that runs entirely on your Mac. Unlike cloud AI services (ChatGPT, Claude, etc.), all processing happens on your computer - no data ever leaves your machine.

### Is it really free?

Yes! Garden of Eden V3 is:
- **Free to use** - No subscription fees
- **Open source** - MIT license
- **No API costs** - Local AI models via Ollama
- **No data collection** - Zero telemetry or tracking

### What languages does it support?

- **Korean (한국어)** - Full support
- **English** - Full support
- More languages may be added in future versions

---

## Installation & Setup

### What are the system requirements?

**Minimum**:
- macOS 11 Big Sur or later
- 16GB RAM
- 20GB free disk space

**Recommended**:
- macOS 13 Ventura or later
- 24GB+ RAM (for better performance)
- Apple Silicon (M1/M2/M3) for Metal acceleration

### Will this work on Windows or Linux?

Currently **macOS only**. Windows and Linux support are on the roadmap but not yet implemented.

### Do I need to install anything else?

Yes, you need **Ollama** for running local AI models:
```bash
brew install ollama
brew services start ollama
```

The app will guide you through this during first-time setup.

### How long does installation take?

- App installation: <1 minute
- Model download (qwen2.5:7b): 5-15 minutes depending on internet speed
- Total setup: ~20 minutes

---

## Privacy & Security

### Does any data leave my computer?

**No**, with one exception:
- **Local AI**: All AI processing happens on your Mac via Ollama
- **Conversations**: Never uploaded anywhere
- **Files**: Never accessed remotely
- **Screen captures**: Processed locally, never stored

**Exception**: If you enable **optional Google Cloud Backup**, only your persona settings (10 numbers) are uploaded to your Google Drive. Conversations are never backed up.

### Can Google see my data?

If you enable cloud backup:
- Google can see your **persona settings only** (10 parameter values)
- These are stored in **your** Google Drive (only you have access)
- **Conversations, files, and screen captures are never backed up**

### Is my data encrypted?

Yes:
- **Local database**: AES-256 encryption
- **Cloud backup**: HTTPS in transit
- **AI models**: Run locally in RAM, no persistent storage

### Can I use this completely offline?

Yes! After initial setup:
- All AI runs locally via Ollama
- No internet required for chat
- Cloud backup is optional and disabled by default

---

## AI Model

### What AI model does it use?

**qwen2.5:7b** - A 7 billion parameter language model:
- Size: 4.7GB (Q4_K_M quantization)
- Speed: 2-4 second responses on Apple Silicon
- Languages: 29+ including Korean and English
- Open source: Apache 2.0 license

### Why qwen2.5 instead of other models?

We chose qwen2.5:7b because:
- **Excellent Korean support** - Better than most 7B models
- **Fast inference** - 2-4s responses on M1/M2
- **Good reasoning** - Competitive with much larger models
- **Low memory** - Runs well on 16GB RAM Macs
- **Open license** - Commercial-friendly Apache 2.0

### Can I use a different model?

Not currently. Model selection is on the roadmap, but qwen2.5:7b is currently the only supported model.

### How does it compare to ChatGPT/Claude?

**Advantages**:
- ✅ 100% private, runs locally
- ✅ No subscriptions, completely free
- ✅ Works offline
- ✅ Customizable personality
- ✅ No rate limits

**Trade-offs**:
- ❌ Smaller model (7B vs 100B+ for GPT-4/Claude)
- ❌ Slower responses (2-4s vs <1s for cloud AI)
- ❌ Requires powerful computer (16GB+ RAM)
- ❌ No internet search capability (yet)

### Why are responses slower than ChatGPT?

Your Mac is running a 7 billion parameter model locally. Cloud AIs like ChatGPT use massive data centers with hundreds of GPUs. The 2-4 second response time is actually quite fast for local inference!

**Speed improvements**:
- Use Apple Silicon (M1/M2/M3) - much faster than Intel
- Close other apps to free RAM
- Reduce persona verbosity for shorter responses

---

## Features

### Does it have voice input?

Yes! Click the microphone icon or press `Cmd+Shift+V`:
- Speech-to-text via Whisper model
- Supports Korean and English
- Real-time waveform visualization

### Can it see my screen?

Yes, when you click the screen context button:
- Captures current active window
- Analyzes with LLaVA vision model
- Useful for debugging, UI feedback, documentation help
- **Images processed locally and not stored**

### Can it write code?

Yes! qwen2.5:7b is excellent at:
- Code generation (TypeScript, Python, Rust, etc.)
- Debugging and error analysis
- Code reviews and suggestions
- Explaining code concepts

### Can it access my files?

Yes, with your permission:
- Read, write, search files
- Git operations (status, diff, commit)
- Workspace detection (VSCode, IntelliJ)
- **All operations are local, nothing uploaded**

### Does it remember previous conversations?

Yes, using RAG (Retrieval-Augmented Generation):
- Episodic memory system
- TF-IDF embeddings for semantic search
- Recalls context from past conversations
- Stored locally in SQLite database

### Can it browse the internet?

Not currently. Internet access is on the roadmap but not yet implemented.

---

## Customization

### What is the persona system?

Garden of Eden V3 lets you customize the AI's personality with **10 parameters**:
1. Formality - Casual vs. Professional
2. Verbosity - Concise vs. Detailed
3. Humor - Serious vs. Playful
4. Emoji Usage - None vs. Frequent
5. Proactiveness - Reactive vs. Proactive
6. Technical Depth - Simple vs. Advanced
7. Empathy - Direct vs. Compassionate
8. Code Examples - Theory vs. Practice
9. Questioning - Accepting vs. Curious
10. Suggestions - Minimal vs. Abundant

See [Persona Customization](Persona-Customization) for details.

### How does the learning system work?

The AI learns from your feedback:
- Give 👍 (thumbs up) or 👎 (thumbs down) on responses
- AI adjusts persona parameters toward what you like
- Uses gradient descent optimization with 0.1 learning rate
- Completely local, no data sent anywhere

### Can I save multiple personas?

Not currently. You can:
- Save one persona locally
- Backup to Google Drive before trying new settings
- Restore from backup later

Multiple persona profiles are on the roadmap.

---

## Performance

### How much RAM does it use?

Typical usage: **10-14GB total**
- Ollama (qwen2.5:7b): ~12GB
- Garden of Eden V3 app: ~2GB
- **Recommendation: 16GB minimum, 24GB ideal**

### Why is my Mac slow when using the app?

The AI model (12GB) uses most of your RAM. Solutions:
- Close other apps (browsers, IDEs, etc.)
- Upgrade to 24GB+ RAM
- Restart Ollama to free memory: `brew services restart ollama`

### Can I use this on an 8GB Mac?

Not recommended. The qwen2.5:7b model alone needs ~12GB RAM. You'll experience:
- Severe system slowdowns
- Memory swapping to disk
- Very slow responses (>30 seconds)

### Why are responses slow on my Intel Mac?

Intel Macs lack Metal acceleration that Apple Silicon uses. Solutions:
- Reduce persona verbosity (shorter responses = faster)
- Close other applications
- Consider upgrading to M1/M2/M3 Mac

---

## Cloud Backup

### What gets backed up to cloud?

Only your **persona settings** (10 parameter values). That's it.

**Backed up**:
- ✅ Formality, Verbosity, Humor, Emoji Usage...

**NOT backed up**:
- ❌ Conversations
- ❌ Files or screen captures
- ❌ Local database
- ❌ Any personal data

### Why would I use cloud backup?

To restore your persona settings:
- On a new Mac
- After reinstalling the app
- After experimenting with different settings

### Do I need a Google account?

Only if you want cloud backup. The app works 100% offline without Google login.

### What if I don't trust Google?

Don't enable cloud backup! Everything works perfectly without it:
- Persona settings saved locally
- All features available
- 100% privacy maintained

---

## Troubleshooting

### App won't start

1. Check Ollama is running: `brew services list`
2. Restart Ollama: `brew services restart ollama`
3. Check logs: `~/Library/Application Support/garden-of-eden-v3/logs/`

### Model won't download

```bash
# Manually download
ollama pull qwen2.5:7b

# Verify
ollama list
```

### Responses are wrong/nonsensical

- AI is not perfect, especially 7B models
- Try rephrasing your question
- Provide more context
- Use screen context to show examples

### Voice input not working

1. Check microphone permissions: System Settings > Privacy > Microphone
2. Restart the app
3. Try external microphone

For more help, see [Troubleshooting Guide](../docs/TROUBLESHOOTING.md).

---

## Development

### Is this open source?

Yes! MIT license. See [GitHub repository](https://github.com/wannahappyaroundme/Garden_of_Eden_V3).

### Can I contribute?

Yes! See [Contributing Guide](../CONTRIBUTING.md) for:
- Bug reports
- Feature requests
- Pull requests
- Documentation improvements

### How was this built?

**Tech Stack**:
- **Framework**: Tauri 2.9 (Rust backend + React frontend)
- **Language**: TypeScript 5.3+
- **AI Runtime**: Ollama (local LLM server)
- **Database**: SQLite with rusqlite
- **UI**: React 18 + Tailwind CSS + shadcn/ui

See [Architecture](Architecture) for details.

### Can I build my own features?

Yes! Clone the repo and modify:
```bash
git clone https://github.com/wannahappyaroundme/Garden_of_Eden_V3.git
cd Garden_of_Eden_V3
npm install
npm run dev
```

See [Building from Source](Building-from-Source).

---

## Roadmap

### What features are coming next?

See [Roadmap](Roadmap) for full list. Highlights:
- **Windows build** (high priority)
- **Plugin system** - Extend functionality
- **Multiple personas** - Save and switch profiles
- **Advanced RAG** - Better memory with BGE-M3 embeddings
- **Internet access** - Web search and URL fetching

### When will Windows support come?

Planned for Q2 2025. Follow [GitHub releases](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/releases) for updates.

### Can I request features?

Yes! Open a [feature request](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/issues/new?template=feature_request.md).

---

## Support

### Where can I get help?

- **Wiki**: [Full documentation](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/wiki)
- **Issues**: [Report bugs](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/issues)
- **Discussions**: [Ask questions](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/discussions)
- **Email**: bu5119@hanyang.ac.kr

### How do I report a bug?

1. Check [existing issues](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/issues)
2. If new, [create an issue](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/issues/new)
3. Include:
   - macOS version
   - App version
   - Steps to reproduce
   - Error messages or screenshots

### Is there a community?

- GitHub Discussions (coming soon)
- Discord server (planned)

---

**More Questions?**

Ask in [GitHub Discussions](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/discussions) or email bu5119@hanyang.ac.kr!

---

**Last Updated**: 2025-01-16
**Version**: 3.0.4
