#!/bin/bash

# Ollama Installation Script for Garden of Eden V3
# Supports macOS and Linux

set -e

echo "🌟 Garden of Eden V3 - Ollama Installer"
echo "========================================"
echo ""

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    echo "✅ Detected macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    echo "✅ Detected Linux"
else
    echo "❌ Unsupported OS: $OSTYPE"
    echo "   Please install Ollama manually from https://ollama.ai"
    exit 1
fi

# Check if Ollama is already installed
if command -v ollama &> /dev/null; then
    OLLAMA_VERSION=$(ollama --version 2>&1 | head -n 1)
    echo "✅ Ollama is already installed: $OLLAMA_VERSION"
    echo ""

    # Check if Ollama service is running
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "✅ Ollama service is running"
    else
        echo "⚠️  Ollama is installed but not running"
        echo "   Starting Ollama..."

        if [[ "$OS" == "macos" ]]; then
            open -a Ollama 2>/dev/null || ollama serve > /dev/null 2>&1 &
        else
            ollama serve > /dev/null 2>&1 &
        fi

        sleep 3

        if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
            echo "✅ Ollama service started successfully"
        else
            echo "❌ Failed to start Ollama service"
            exit 1
        fi
    fi
else
    echo "📥 Installing Ollama..."
    echo ""

    if [[ "$OS" == "macos" ]]; then
        # macOS installation
        if command -v brew &> /dev/null; then
            echo "   Using Homebrew..."
            brew install ollama
        else
            echo "   Downloading from ollama.ai..."
            curl -fsSL https://ollama.ai/install.sh | sh
        fi
    else
        # Linux installation
        echo "   Downloading from ollama.ai..."
        curl -fsSL https://ollama.ai/install.sh | sh
    fi

    echo "✅ Ollama installed successfully"
    echo ""

    # Start Ollama service
    echo "🚀 Starting Ollama service..."
    if [[ "$OS" == "macos" ]]; then
        open -a Ollama 2>/dev/null || ollama serve > /dev/null 2>&1 &
    else
        ollama serve > /dev/null 2>&1 &
    fi

    sleep 5

    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "✅ Ollama service started"
    else
        echo "❌ Failed to start Ollama service"
        exit 1
    fi
fi

echo ""
echo "📦 Checking for required models..."
echo ""

# Check if Qwen 2.5 14B is installed
if ollama list | grep -q "qwen2.5:14b"; then
    echo "✅ Qwen 2.5 14B is already installed"
else
    echo "📥 Downloading Qwen 2.5 14B (9.0GB)..."
    echo "   This may take 10-20 minutes depending on your internet speed..."
    echo ""

    ollama pull qwen2.5:14b

    if [ $? -eq 0 ]; then
        echo "✅ Qwen 2.5 14B downloaded successfully"
    else
        echo "❌ Failed to download Qwen 2.5 14B"
        exit 1
    fi
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm run dev' to start the application"
echo "2. The AI will be ready to chat immediately"
echo ""
echo "Note: Voice (Whisper) and Vision (LLaVA) features are coming soon!"
echo ""
