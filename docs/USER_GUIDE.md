# Garden of Eden V3 - User Guide

Complete guide to using all features of Garden of Eden V3.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Chat Interface](#chat-interface)
3. [Voice Features](#voice-features)
4. [Persona Customization](#persona-customization)
5. [Screen Context Analysis](#screen-context-analysis)
6. [Cloud Backup](#cloud-backup)
7. [System Integration](#system-integration)
8. [Keyboard Shortcuts](#keyboard-shortcuts)
9. [Tips & Best Practices](#tips--best-practices)

---

## Getting Started

### First Launch

When you first open Garden of Eden V3:

1. **Language Selection** - Choose Korean (한국어) or English
2. **Model Download** - The app will automatically download qwen2.5:7b (~4.7GB)
3. **Persona Setup** - Customize AI personality with 10 parameters
4. **Optional Google Login** - Enable cloud backup for settings

### Main Interface

The app has a clean, KakaoTalk-style messaging interface:

- **Left Sidebar** - Conversation history
- **Center** - Chat messages
- **Bottom** - Input field with voice and screen context buttons
- **Top Right** - Settings button

---

## Chat Interface

### Sending Messages

1. Type your message in the input field
2. Press `Enter` to send (or `Shift+Enter` for new line)
3. Click the send button (paper plane icon)

### Message Types

The AI can respond with:
- **Text responses** - Regular conversation
- **Code blocks** - Syntax-highlighted code
- **Markdown** - Formatted text with headers, lists, links
- **Tables** - Structured data

### Conversation Management

- **New Conversation** - Click `+` button or press `Cmd+N`
- **View History** - Click sidebar or press `Cmd+H`
- **Search Conversations** - Use search bar in sidebar
- **Delete Conversation** - Right-click and select "Delete"

---

## Voice Features

### Speech-to-Text (Voice Input)

1. Click the microphone icon or press `Cmd+Shift+V`
2. Speak your message clearly
3. Click again to stop recording
4. Your speech is automatically transcribed and sent

**Supported Languages**: Korean, English

**Tips for Better Recognition**:
- Speak clearly and at normal pace
- Use in quiet environment
- Position microphone 6-12 inches from mouth
- Pause briefly between sentences

### Voice Visualizer

When recording, you'll see a real-time waveform animation showing your voice input.

---

## Persona Customization

Access via Settings > Persona

### 10 Personality Parameters

#### 1. **Formality** (격식)
- **Low (0.0-0.3)**: Casual, friendly, uses informal language
- **Medium (0.4-0.6)**: Balanced, professional yet approachable
- **High (0.7-1.0)**: Formal, respectful, uses honorifics (Korean)

*Example*:
- Low: "야! 뭐 도와줄까?"
- High: "안녕하세요. 무엇을 도와드릴까요?"

#### 2. **Verbosity** (상세도)
- **Low**: Concise, brief answers
- **High**: Detailed explanations with examples

*Example*:
- Low: "React is a UI library."
- High: "React is a JavaScript library for building user interfaces. It was created by Facebook and uses a component-based architecture..."

#### 3. **Humor** (유머)
- **Low**: Serious, straightforward
- **High**: Playful, uses jokes and puns

#### 4. **Emoji Usage** (이모지 사용)
- **Low**: No emojis
- **High**: Frequent emojis 😊🎉✨

#### 5. **Proactiveness** (적극성)
- **Low**: Waits for user requests
- **High**: Suggests next steps, asks clarifying questions

#### 6. **Technical Depth** (기술 깊이)
- **Low**: Simple explanations, no jargon
- **High**: Technical details, advanced concepts

#### 7. **Empathy** (공감)
- **Low**: Direct, task-focused
- **High**: Understanding, supportive

#### 8. **Code Examples** (코드 예시)
- **Low**: Theory and concepts
- **High**: Concrete code examples

#### 9. **Questioning** (질문)
- **Low**: Accepts requests as-is
- **High**: Asks clarifying questions

#### 10. **Suggestions** (제안)
- **Low**: Answers only what's asked
- **High**: Provides additional suggestions

### Saving Persona

1. Adjust sliders to desired values
2. Click "Save" to store locally (works offline)
3. Click "Preview" to see generated system prompt

### Learning System

The AI learns from your feedback:
- **Thumbs Up** 👍 - AI optimizes toward current persona
- **Thumbs Down** 👎 - AI adjusts away from current behavior

The learning algorithm uses gradient descent with 0.1 learning rate to optimize all 10 parameters based on your satisfaction.

---

## Screen Context Analysis

### Adding Screen Context

Click the monitor icon to capture current screen:
- AI can see your active window
- Useful for debugging, UI reviews, documentation help

### Use Cases

1. **Debugging** - "What's wrong with this error message?"
2. **UI Feedback** - "Analyze this design and suggest improvements"
3. **Documentation Help** - "Explain what this documentation says"
4. **Code Review** - "Review the code on my screen"

### Privacy

- Screen captures are processed locally via LLaVA 7B
- Images never leave your machine
- Captures are not stored permanently

---

## Cloud Backup

### Setting Up Cloud Backup

1. Go to Settings > Account
2. Click "Login with Google"
3. Authorize Garden of Eden V3
4. Your Google account is now connected

### Backing Up Persona Settings

1. Go to Settings > Persona
2. Click "Backup to Cloud"
3. Your 10 persona parameters are uploaded to Google Drive

**What's Backed Up**:
- Persona parameters (10 values)
- Timestamp of backup

**What's NOT Backed Up**:
- Conversations (privacy-first)
- Local files
- System settings

### Restoring from Cloud

1. Go to Settings > Persona
2. Click "Restore from Cloud"
3. Your persona settings are downloaded and applied

### Security

- All backups are stored in Google Drive folder: "Garden of Eden Backups"
- File name: `eden_backup.json`
- Data is transmitted over HTTPS
- Only you can access your backup files

---

## System Integration

### File Operations

```
"Create a new file called index.ts with a Hello World function"
"Read the contents of package.json"
"Search for TODO comments in src/ directory"
"List all TypeScript files in the project"
```

### Git Integration

```
"Show me git status"
"What files have changed?"
"Create a commit with message 'Add feature X'"
"Show me the diff for main.ts"
```

**Note**: The AI will not push to remote without explicit confirmation.

### Workspace Detection

The AI automatically detects:
- VSCode workspace
- IntelliJ/WebStorm projects
- Git repositories
- Package managers (npm, cargo, etc.)

---

## Keyboard Shortcuts

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` | Focus chat input |
| `Cmd+,` | Open settings |
| `Cmd+N` | New conversation |
| `Cmd+H` | Toggle conversation history |
| `Cmd+Q` | Quit application |

### Chat Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift+Enter` | New line in message |
| `Cmd+Shift+V` | Toggle voice input |
| `Cmd+Shift+S` | Add screen context |
| `Esc` | Cancel current operation |

### Message Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+C` | Copy message text |
| `Cmd+A` | Select all text |
| `Cmd+Z` | Undo typing |

---

## Tips & Best Practices

### Getting Better Responses

1. **Be Specific** - "Create a React component for user login" vs "Make a form"
2. **Provide Context** - "I'm building a Tauri app in TypeScript..."
3. **Use Screen Context** - Show code/errors for better debugging help
4. **Iterate** - Ask follow-up questions to refine responses

### Optimizing Persona

1. **Start with Defaults** - Use the app for a week with default settings
2. **Adjust Gradually** - Change one parameter at a time
3. **Use Feedback** - Thumbs up/down helps AI learn your preferences
4. **Save Often** - Save persona after finding good settings
5. **Backup to Cloud** - Keep your preferred settings safe

### Performance Tips

1. **Close Other Apps** - Free up RAM for AI model (needs ~12GB)
2. **Use Apple Silicon** - M1/M2/M3 Macs are much faster
3. **Shorter Messages** - For quick responses, ask concise questions
4. **Clear Old Conversations** - Delete old chats to keep app fast

### Privacy Best Practices

1. **No Sensitive Data in Cloud Backup** - Only persona settings are backed up
2. **Screen Context Awareness** - Don't share screens with passwords/secrets
3. **Local Processing** - All AI runs on your machine, nothing goes to cloud
4. **Disable Cloud Backup** - If you don't need it, don't enable it

---

## Troubleshooting

### Slow Responses

- Close other applications
- Ensure 16GB+ RAM available
- Restart Ollama: `brew services restart ollama`

### Voice Not Working

- Check microphone permissions in System Settings
- Try different microphone (if available)
- Ensure quiet environment

### Cloud Backup Fails

- Check internet connection
- Re-login to Google account
- Check Google Drive storage quota

### Model Errors

```bash
# Restart Ollama
brew services restart ollama

# Re-download model
ollama pull qwen2.5:7b
```

For more help, see [Troubleshooting Guide](TROUBLESHOOTING.md) or [open an issue](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/issues).

---

## Advanced Features

### Proactive Notifications

The AI can proactively notify you about:
- Errors detected in your code
- Warnings in terminal output
- Long-running processes
- TODO comments in files

Configure in Settings > Notifications.

### RAG Memory System

The AI remembers past conversations using:
- **Episodic Memory** - Stores conversation context
- **TF-IDF Embeddings** - Semantic search for relevant memories
- **Context Window** - Uses past 5-10 messages for continuity

### Learning Optimization

The AI optimizes persona parameters based on:
- Your thumbs up/down feedback
- Conversation patterns
- Response quality metrics
- User engagement signals

---

**Need More Help?**

- [FAQ](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/wiki/FAQ)
- [GitHub Discussions](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/discussions)
- [Report an Issue](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/issues)
- Email: bu5119@hanyang.ac.kr

---

**Last Updated**: 2025-01-16
**Version**: 3.0.4
