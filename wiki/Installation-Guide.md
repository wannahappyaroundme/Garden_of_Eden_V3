# Installation Guide

Complete installation instructions for Garden of Eden V3.

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Installing Prerequisites](#installing-prerequisites)
3. [Installing Garden of Eden V3](#installing-garden-of-eden-v3)
4. [First-Time Setup](#first-time-setup)
5. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum Requirements
- **OS**: macOS 11 Big Sur or later
- **RAM**: 16GB
- **Storage**: 20GB free disk space (for AI models)
- **Processor**: Intel or Apple Silicon

### Recommended Specifications
- **OS**: macOS 13 Ventura or later
- **RAM**: 24GB+ (for optimal performance)
- **Storage**: 50GB free disk space
- **Processor**: Apple Silicon (M1/M2/M3) for Metal acceleration

---

## Installing Prerequisites

### 1. Install Homebrew (if not installed)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Install Node.js

Garden of Eden V3 requires Node.js 20+:

```bash
brew install node@20
```

### 3. Install Ollama

Ollama is required for running local AI models:

```bash
brew install ollama
```

Start the Ollama service:

```bash
brew services start ollama
```

Verify installation:

```bash
ollama --version
```

---

## Installing Garden of Eden V3

### Option 1: Download Pre-built Binary (Recommended)

1. Go to the [Releases page](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/releases/latest)
2. Download `Garden-of-Eden-V3-macOS-[version].dmg`
3. Open the DMG file
4. Drag "Garden of Eden V3" to your Applications folder
5. Launch the app from Applications

**Note**: On first launch, you may see a security warning. Right-click the app and select "Open" to bypass Gatekeeper.

### Option 2: Build from Source

1. **Clone the repository**:
   ```bash
   git clone https://github.com/wannahappyaroundme/Garden_of_Eden_V3.git
   cd Garden_of_Eden_V3
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the app**:
   ```bash
   npm run dev
   ```

For production builds, see [Building from Source](Building-from-Source).

---

## First-Time Setup

When you first launch Garden of Eden V3, the onboarding wizard will guide you through:

### Step 1: Language Selection
- Choose between Korean (한국어) or English

### Step 2: Model Installation
The app will automatically:
- Check if Ollama is installed
- Install Ollama if not present (macOS only)
- Download qwen2.5:7b model (~4.7GB)

**This may take 5-15 minutes depending on your internet speed.**

### Step 3: Persona Customization
Adjust 10 personality parameters:
- **Formality** - Casual vs. Professional
- **Verbosity** - Concise vs. Detailed
- **Humor** - Serious vs. Playful
- **Emoji Usage** - None vs. Frequent
- **Proactiveness** - Reactive vs. Proactive
- **Technical Depth** - Simple vs. Advanced
- **Empathy** - Direct vs. Compassionate
- **Code Examples** - Theory vs. Practice
- **Questioning** - Accepting vs. Curious
- **Suggestions** - Minimal vs. Abundant

### Step 4: Optional Google Login
- Login with Google for cloud backup (optional)
- Your persona settings can be backed up to Google Drive
- **Note**: This is entirely optional and not required for operation

### Step 5: Complete Setup
You're ready to start chatting!

---

## Verifying Installation

### Check Ollama is Running

```bash
curl http://localhost:11434/api/tags
```

You should see a list of installed models including `qwen2.5:7b`.

### Check Model is Downloaded

```bash
ollama list
```

Expected output:
```
NAME              SIZE      MODIFIED
qwen2.5:7b        4.7 GB    2 minutes ago
```

### Test the App

1. Open Garden of Eden V3
2. Type a message: "Hello, introduce yourself"
3. You should receive a response in 2-4 seconds

---

## Troubleshooting

### Ollama Not Found

If you see "Ollama not installed" error:

```bash
brew install ollama
brew services start ollama
```

### Model Download Failed

If model download fails:

```bash
# Manually download the model
ollama pull qwen2.5:7b

# Verify download
ollama list
```

### App Won't Open (macOS Security)

If macOS blocks the app:

1. Go to **System Settings** > **Privacy & Security**
2. Scroll to "Security" section
3. Click "Open Anyway" next to the Garden of Eden V3 message
4. Or right-click the app and select "Open"

### Low Memory Errors

If you encounter out-of-memory errors:

1. Close other applications
2. Ensure you have at least 16GB RAM
3. Consider upgrading to 24GB+ RAM for optimal performance

### Model Loading Slow

If model loading is slow (>10 seconds):

- **Apple Silicon (M1/M2/M3)**: Should be fast with Metal acceleration
- **Intel Macs**: May be slower, consider reducing model size or upgrading hardware

For more issues, see [Troubleshooting Guide](Troubleshooting) or [open an issue](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/issues).

---

## Next Steps

After installation:
- Read the [Quick Start Guide](Quick-Start)
- Explore [Chat Interface](Chat-Interface) features
- Customize your [Persona Settings](Persona-Customization)
- Learn about [Voice Features](Voice-Features)

---

**Need help?** Visit our [Troubleshooting Guide](Troubleshooting) or ask in [Discussions](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/discussions).
