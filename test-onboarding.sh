#!/bin/bash

# Test Onboarding Script
# Resets database and launches app in dev mode for onboarding testing

echo "🧪 Garden of Eden V3 - Onboarding Test Script"
echo "=============================================="
echo ""

# Get database path
DB_PATH="$HOME/Library/Application Support/garden-of-eden-v3/data.db"
BACKUP_PATH="$HOME/Library/Application Support/garden-of-eden-v3/data.db.backup"

# Check if database exists
if [ -f "$DB_PATH" ]; then
    echo "📦 Found existing database at: $DB_PATH"
    echo "Creating backup..."
    cp "$DB_PATH" "$BACKUP_PATH"
    echo "✅ Backup created: $BACKUP_PATH"
    echo ""

    # Ask user if they want to reset
    read -p "Do you want to reset the database to test onboarding? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm "$DB_PATH"
        echo "🗑️  Database deleted - onboarding will trigger on next launch"
        echo ""
    else
        echo "Keeping existing database - onboarding may be skipped if already completed"
        echo ""
    fi
else
    echo "ℹ️  No existing database found - fresh onboarding will run"
    echo ""
fi

# Check if Ollama is installed
echo "🔍 Checking Ollama installation..."
if command -v ollama &> /dev/null; then
    OLLAMA_VERSION=$(ollama --version 2>&1 | head -n 1)
    echo "✅ Ollama installed: $OLLAMA_VERSION"

    # Check if Ollama service is running
    if pgrep -x "ollama" > /dev/null; then
        echo "✅ Ollama service is running"
    else
        echo "⚠️  Ollama service not running - starting it..."
        ollama serve &> /dev/null &
        sleep 2
        echo "✅ Ollama service started"
    fi
else
    echo "❌ Ollama not installed!"
    echo "   Please install from: https://ollama.ai"
    echo "   The app will show an error during onboarding without Ollama"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🚀 Launching app in development mode..."
echo "Watch the console below for any errors or logs"
echo ""
echo "=============================================="
echo "ONBOARDING FLOW TO TEST:"
echo "1. System Check - Should auto-detect your specs"
echo "2. Model Recommendation - Should recommend based on RAM"
echo "3. Survey - 7 questions (4 choice + 3 text)"
echo "4. Download - Will download 3 models via Ollama"
echo "5. Complete - Success screen"
echo "=============================================="
echo ""

# Launch app
npm run dev
