# Troubleshooting Guide

Solutions to common issues with Garden of Eden V3.

---

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Model Issues](#model-issues)
3. [Performance Issues](#performance-issues)
4. [Voice Issues](#voice-issues)
5. [Cloud Backup Issues](#cloud-backup-issues)
6. [System Integration Issues](#system-integration-issues)
7. [Error Messages](#error-messages)
8. [Getting Further Help](#getting-further-help)

---

## Installation Issues

### "Ollama not found" Error

**Problem**: App shows "Ollama is not installed"

**Solution**:
```bash
# Install Ollama
brew install ollama

# Start the service
brew services start ollama

# Verify it's running
curl http://localhost:11434/api/tags
```

### App Won't Open (macOS Gatekeeper)

**Problem**: "App can't be opened because it is from an unidentified developer"

**Solution**:
1. Right-click the app and select "Open"
2. Click "Open" in the confirmation dialog

Or:
1. Go to **System Settings** > **Privacy & Security**
2. Scroll to "Security" section
3. Click "Open Anyway" next to Garden of Eden V3

### Homebrew Not Found

**Problem**: `brew: command not found`

**Solution**:
```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Add to PATH (Apple Silicon)
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

### Node.js Version Mismatch

**Problem**: "Node.js version 20+ required"

**Solution**:
```bash
# Install Node 20
brew install node@20

# Add to PATH
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify version
node --version  # Should show v20.x.x
```

---

## Model Issues

### Model Download Fails

**Problem**: qwen2.5:7b download stops or errors

**Solution 1 - Retry Download**:
```bash
ollama pull qwen2.5:7b
```

**Solution 2 - Check Disk Space**:
```bash
# Need at least 10GB free
df -h
```

**Solution 3 - Restart Ollama**:
```bash
brew services restart ollama
ollama pull qwen2.5:7b
```

### Model Won't Load

**Problem**: "Failed to load model" error

**Solution**:
```bash
# Check if model exists
ollama list

# If not listed, download again
ollama pull qwen2.5:7b

# Test the model
ollama run qwen2.5:7b "Hello"
```

### Model Responds in Wrong Language

**Problem**: AI responds in English when Korean expected (or vice versa)

**Solution**:
1. Go to Settings > Persona
2. Check "Language Preference" setting
3. Or include language hint in your message:
   - Korean: "한국어로 답변해주세요"
   - English: "Please respond in English"

### Slow Model Loading

**Problem**: Model takes >10 seconds to load

**Solution**:
- **Apple Silicon (M1/M2/M3)**: Should load in 4-6 seconds
- **Intel Macs**: May be slower, this is normal
- **Low RAM**: Close other applications

---

## Performance Issues

### Slow Response Times (>10 seconds)

**Diagnosis**:
```bash
# Check RAM usage
top -l 1 | grep PhysMem

# Check Ollama status
curl http://localhost:11434/api/tags
```

**Solutions**:

1. **Close Other Apps**:
   - Free up RAM (AI needs ~12GB)
   - Close browsers, IDEs, video apps

2. **Restart Ollama**:
   ```bash
   brew services restart ollama
   ```

3. **Check CPU Usage**:
   - Open Activity Monitor
   - Look for high CPU processes
   - Close or restart them

4. **Optimize Persona**:
   - Go to Settings > Persona
   - Reduce "Verbosity" slider
   - Reduce "Technical Depth" slider

### High Memory Usage

**Problem**: App uses >20GB RAM

**Solutions**:
- Expected usage: 10-14GB (Ollama ~12GB + App ~2GB)
- If higher:
  1. Restart the app
  2. Restart Ollama: `brew services restart ollama`
  3. Clear conversation history (delete old chats)

### App Freezes or Hangs

**Solution**:
1. Force quit the app: `Cmd+Option+Esc`
2. Restart Ollama:
   ```bash
   brew services restart ollama
   ```
3. Relaunch Garden of Eden V3
4. If persists, restart your Mac

### Slow Startup

**Problem**: App takes >10 seconds to start

**Solutions**:
- First launch: Normal (model loading)
- Subsequent launches: Should be <2 seconds
- If slow:
  1. Check Ollama is running: `brew services list`
  2. Restart Ollama: `brew services restart ollama`
  3. Free up RAM (close other apps)

---

## Voice Issues

### Microphone Not Working

**Problem**: Voice button doesn't record

**Solution 1 - Check Permissions**:
1. Go to **System Settings** > **Privacy & Security**
2. Click "Microphone"
3. Enable for "Garden of Eden V3"

**Solution 2 - Restart App**:
1. Quit Garden of Eden V3
2. Relaunch the app
3. Allow microphone when prompted

**Solution 3 - Test Microphone**:
```bash
# Test in Terminal
rec -r 16000 -c 1 test.wav
# Speak, then Ctrl+C to stop
# If this fails, microphone has hardware issue
```

### Poor Voice Recognition

**Problem**: Speech-to-text produces incorrect text

**Solutions**:
1. **Speak Clearly** - Normal pace, clear pronunciation
2. **Quiet Environment** - Reduce background noise
3. **Proper Distance** - 6-12 inches from microphone
4. **Check Language** - Ensure correct language selected
5. **Better Microphone** - Use external microphone if possible

### Voice Visualizer Not Showing

**Problem**: No waveform animation during recording

**Solution**:
- This is a visual feature only
- Recording still works without visualization
- If recording also doesn't work, see "Microphone Not Working"

---

## Cloud Backup Issues

### Google Login Fails

**Problem**: "Failed to authenticate with Google"

**Solutions**:
1. **Check Internet** - Ensure connected to internet
2. **Retry Login**:
   - Click "Logout" in Settings > Account
   - Click "Login with Google" again
3. **Clear Browser Cache** - If using system browser for OAuth
4. **Try Different Browser** - Change default browser temporarily

### Backup Upload Fails

**Problem**: "Failed to backup to cloud"

**Solutions**:

1. **Check Internet Connection**:
   ```bash
   ping google.com
   ```

2. **Check Google Drive Storage**:
   - Visit [Google Drive](https://drive.google.com)
   - Ensure you have free space (backup is <1MB)

3. **Re-authenticate**:
   - Settings > Account > Logout
   - Login with Google again

4. **Check Token Expiration**:
   - Logout and login again (tokens expire after 1 hour)

### Backup Restore Fails

**Problem**: "Failed to restore from cloud"

**Solutions**:
1. **Ensure Backup Exists**:
   - Check Google Drive folder: "Garden of Eden Backups"
   - Look for `eden_backup.json` file

2. **Check File Permissions**:
   - File should be readable by you
   - If shared, ensure you have access

3. **Manual Restore**:
   - Download `eden_backup.json` from Google Drive
   - Copy persona values manually to Settings > Persona

### "No backup found" Message

**Problem**: Restore shows "No cloud backup found"

**Solution**:
- You haven't created a backup yet
- Click "Backup to Cloud" first
- Then try "Restore from Cloud"

---

## System Integration Issues

### Git Commands Don't Work

**Problem**: "Git not found" or "Not a git repository"

**Solutions**:

1. **Install Git**:
   ```bash
   brew install git
   git --version
   ```

2. **Initialize Repository**:
   ```bash
   cd /path/to/your/project
   git init
   ```

3. **Check Working Directory**:
   - The app must be in a git repository
   - Or specify full path to git repo

### File Operations Fail

**Problem**: "Permission denied" when reading/writing files

**Solutions**:

1. **Grant File Access**:
   - macOS: System Settings > Privacy & Security > Files and Folders
   - Enable for "Garden of Eden V3"

2. **Check File Permissions**:
   ```bash
   ls -la /path/to/file
   # Ensure you have read/write permissions
   ```

3. **Use Absolute Paths**:
   - Instead of: "Read config.json"
   - Use: "Read /Users/yourname/project/config.json"

### Screen Capture Not Working

**Problem**: "Failed to capture screen"

**Solutions**:

1. **Grant Screen Recording Permission**:
   - System Settings > Privacy & Security > Screen Recording
   - Enable for "Garden of Eden V3"

2. **Restart App**:
   - Quit and relaunch after granting permission

3. **macOS 11-12 Only**:
   - Screen capture requires macOS 11+
   - Update macOS if on older version

---

## Error Messages

### "Failed to connect to Ollama"

**Cause**: Ollama service not running

**Solution**:
```bash
brew services start ollama
```

### "Model not found: qwen2.5:7b"

**Cause**: Model not downloaded

**Solution**:
```bash
ollama pull qwen2.5:7b
```

### "Out of memory"

**Cause**: Insufficient RAM for model

**Solution**:
- Close other applications
- Ensure 16GB+ total RAM
- Restart Ollama to free memory:
  ```bash
  brew services restart ollama
  ```

### "Network error"

**Cause**: No internet connection (for cloud features only)

**Solution**:
- Local features work offline
- Cloud backup requires internet
- Check connection: `ping google.com`

### "Database locked"

**Cause**: Multiple instances or corrupt database

**Solution**:
1. Quit all Garden of Eden V3 instances
2. If persists, restart Mac
3. If still broken:
   ```bash
   # Backup database
   cp ~/Library/Application\ Support/garden-of-eden-v3/data.db ~/data.db.backup
   # Delete and restart app (will recreate)
   rm ~/Library/Application\ Support/garden-of-eden-v3/data.db
   ```

### "Invalid token" (Cloud Backup)

**Cause**: Google OAuth token expired

**Solution**:
1. Go to Settings > Account
2. Click "Logout"
3. Click "Login with Google" again

---

## Getting Further Help

### Before Reporting an Issue

1. **Check This Guide** - Search for your error message
2. **Check Logs**:
   ```bash
   # View app logs
   tail -f ~/Library/Application\ Support/garden-of-eden-v3/logs/app.log
   ```
3. **Check Ollama Logs**:
   ```bash
   brew services info ollama
   ```
4. **Try Clean Reinstall**:
   ```bash
   # Uninstall
   brew services stop ollama
   brew uninstall ollama

   # Delete app data (backup first!)
   rm -rf ~/Library/Application\ Support/garden-of-eden-v3

   # Reinstall
   brew install ollama
   brew services start ollama
   ollama pull qwen2.5:7b
   ```

### Reporting an Issue

When reporting issues, include:

1. **System Information**:
   - macOS version: `sw_vers`
   - Chip: Apple Silicon or Intel
   - RAM: 16GB, 24GB, etc.

2. **Software Versions**:
   - Garden of Eden V3 version
   - Ollama version: `ollama --version`
   - Node version: `node --version`

3. **Error Details**:
   - Exact error message
   - Steps to reproduce
   - Screenshots if helpful

4. **Logs**:
   ```bash
   # App logs
   cat ~/Library/Application\ Support/garden-of-eden-v3/logs/app.log

   # Ollama status
   curl http://localhost:11434/api/tags
   ```

### Where to Get Help

- **GitHub Issues**: [Report a Bug](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/issues)
- **GitHub Discussions**: [Ask a Question](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/discussions)
- **Email**: bu5119@hanyang.ac.kr
- **Wiki**: [Full Documentation](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/wiki)

---

## Common Fixes Checklist

When something goes wrong, try these in order:

- [ ] Restart the app
- [ ] Restart Ollama: `brew services restart ollama`
- [ ] Check internet connection (for cloud features)
- [ ] Check permissions (microphone, screen recording, files)
- [ ] Close other applications (free RAM)
- [ ] Update macOS to latest version
- [ ] Reinstall Ollama and re-download model
- [ ] Clean reinstall of Garden of Eden V3

---

**Still Having Issues?**

Don't hesitate to [open an issue](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/issues) - we're here to help!

---

**Last Updated**: 2025-01-16
**Version**: 3.0.4
