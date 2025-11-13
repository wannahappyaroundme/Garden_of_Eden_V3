# Garden of Eden V3 - Distribution Guide

**Last Updated**: 2025-01-13
**Status**: Phase 7 - Distribution Setup Complete
**Current Version**: 1.0.0-alpha

---

## Overview

This document describes the build and distribution process for Garden of Eden V3, including packaging, code signing, and release management.

## Prerequisites

### For All Platforms
- Node.js 20+ installed
- npm 9+ installed
- All dependencies installed (`npm install`)
- Project built successfully (`npm run build:electron`)

### For macOS Builds
- macOS 12+ (Monterey or later)
- Xcode Command Line Tools
- Apple Developer Account (for code signing & notarization)
- Apple Developer Certificate installed in Keychain

### For Windows Builds
- Windows 10/11 or macOS with Wine
- Authenticode certificate (for code signing)
- Windows SDK (if building natively on Windows)

---

## Build Configuration

### electron-builder Configuration

The build configuration is in `package.json` under the `build` section:

```json
{
  "build": {
    "appId": "com.garden-of-eden.v3",
    "productName": "Garden of Eden V3",
    "directories": {
      "output": "release",
      "buildResources": "resources"
    }
  }
}
```

### File Structure

**Included in Build**:
- `dist/**/*` - Compiled main & renderer code
- `resources/**/*` - Icons, entitlements
- `package.json` - App metadata

**Excluded** (via `.gitignore` and build config):
- `node_modules` (rebuilt during packaging)
- `src/**/*` - Source files (only dist included)
- `tests/**/*` - Test files
- AI models (downloaded separately post-install)

---

## Building for Production

### 1. Build All Processes

```bash
# Build main process + renderer
npm run build:electron
```

This compiles:
- **Main process**: TypeScript → JavaScript (CommonJS)
- **Renderer**: React + Vite → Optimized bundle (~834KB)

### 2. Platform-Specific Builds

#### macOS

```bash
# Build for macOS (Intel + Apple Silicon universal)
npm run build:mac
```

**Outputs** (in `release/` directory):
- `Garden of Eden V3-1.0.0.dmg` - DMG installer
- `Garden of Eden V3-1.0.0-mac.zip` - ZIP archive
- `Garden of Eden V3.app` - Application bundle

**Configuration** ([package.json:142-152](package.json)):
- Target: DMG + ZIP
- Category: Productivity
- Universal binary (x64 + arm64)
- Hardened Runtime enabled
- Entitlements: `resources/entitlements.mac.plist`

#### Windows

```bash
# Build for Windows
npm run build:win
```

**Outputs** (in `release/` directory):
- `Garden of Eden V3 Setup 1.0.0.exe` - NSIS installer
- `Garden of Eden V3 1.0.0.exe` - Portable executable

**Configuration** ([package.json:154-160](package.json)):
- Target: NSIS + Portable
- Installer: Custom install directory option
- Desktop + Start Menu shortcuts

#### Linux (Optional)

```bash
# Build for Linux
npm run build:linux
```

**Outputs**:
- `Garden of Eden V3-1.0.0.AppImage` - AppImage
- `garden-of-eden-v3_1.0.0_amd64.deb` - Debian package

---

## Code Signing

### macOS Code Signing

**Why**: Required for distribution outside Mac App Store, Gatekeeper approval

**Steps**:

1. **Obtain Developer Certificate**
   - Enroll in [Apple Developer Program](https://developer.apple.com/programs/) ($99/year)
   - Create "Developer ID Application" certificate in Xcode

2. **Configure Environment Variables**
   ```bash
   export APPLE_ID="your-apple-id@email.com"
   export APPLE_ID_PASSWORD="app-specific-password"  # Generate in Apple ID settings
   export CSC_NAME="Developer ID Application: Your Name (TEAM_ID)"
   ```

3. **Build with Signing**
   ```bash
   npm run build:mac
   ```

4. **Notarize with Apple**
   ```bash
   # Automatic during build if APPLE_ID env vars set
   # Or manually:
   xcrun notarytool submit "release/Garden of Eden V3-1.0.0.dmg" \
     --apple-id "$APPLE_ID" --password "$APPLE_ID_PASSWORD" \
     --team-id "YOUR_TEAM_ID" --wait
   ```

**Entitlements** ([resources/entitlements.mac.plist](resources/entitlements.mac.plist)):
- JIT compilation (for Node.js)
- Unsigned executable memory
- Network client/server
- File system access
- Microphone access
- Screen recording

### Windows Code Signing

**Why**: Required to avoid SmartScreen warnings, build trust

**Steps**:

1. **Obtain Authenticode Certificate**
   - Purchase from DigiCert, Sectigo, or other CA (~$100-300/year)
   - Or use free code signing via SignPath (for open source)

2. **Configure Certificate**
   ```bash
   export CSC_LINK="path/to/certificate.p12"
   export CSC_KEY_PASSWORD="certificate-password"
   ```

3. **Build with Signing**
   ```bash
   npm run build:win
   ```

---

## Auto-Update System

Garden of Eden V3 uses `electron-updater` for automatic updates.

### Configuration

**In package.json**:
```json
{
  "dependencies": {
    "electron-updater": "^6.1.7"
  }
}
```

**Update Server Options**:
1. **GitHub Releases** (Free, Recommended)
   - Upload builds to GitHub Releases
   - electron-updater auto-detects and downloads

2. **Custom Server**
   - Host `latest-mac.yml` and `.dmg`/`.exe` files
   - Configure `publish` in package.json

### Implementation

**In `src/main/index.ts`** (to be implemented):
```typescript
import { autoUpdater } from 'electron-updater';

// Check for updates on startup
autoUpdater.checkForUpdatesAndNotify();

// Listen for update events
autoUpdater.on('update-available', () => {
  // Show notification in UI
});

autoUpdater.on('update-downloaded', () => {
  // Prompt user to restart
});
```

---

## First-Run Experience

### Model Download on First Launch

**Challenge**: AI models (~12GB) are too large to bundle in installer

**Solution**: Download models on first run with progress UI

**Implementation** (to be done):

1. **Check if models exist** (`~/.garden-of-eden-v3/models/`)
2. **Show onboarding dialog** with download progress
3. **Download models in background** using `scripts/download-models.js`
4. **Verify checksums** before marking complete
5. **Support resume** if download interrupted

### Onboarding Flow

**Steps** (to be implemented):
1. Welcome screen
2. Language selection (Korean/English)
3. Model download (12GB, ~10-30 min)
4. Mode selection (User-Led / AI-Led)
5. Quick tutorial (interactive demo)
6. Permissions request (mic, screen capture)
7. Basic persona customization
8. Ready to use!

---

## Release Process

### 1. Pre-Release Checklist

- [ ] All features complete for version
- [ ] All tests passing (`npm test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No ESLint warnings (`npm run lint`)
- [ ] Build succeeds on macOS (`npm run build:mac`)
- [ ] Build succeeds on Windows (`npm run build:win`)
- [ ] Icons created (`.icns`, `.ico`)
- [ ] CHANGELOG.md updated
- [ ] Version bumped in `package.json`

### 2. Build & Sign

```bash
# 1. Clean previous builds
rm -rf release/ dist/

# 2. Build all processes
npm run build:electron

# 3. Build platform installers (with code signing)
npm run build:mac
npm run build:win

# 4. Verify builds
ls -lh release/
```

### 3. Test Installers

**macOS**:
```bash
# Install on clean system
open "release/Garden of Eden V3-1.0.0.dmg"

# Verify no Gatekeeper warnings
# Test app launches and works
```

**Windows**:
```bash
# Install on clean system
# Run "Garden of Eden V3 Setup 1.0.0.exe"

# Verify no SmartScreen warnings
# Test app launches and works
```

### 4. Create GitHub Release

```bash
# 1. Tag version
git tag v1.0.0
git push origin v1.0.0

# 2. Create release on GitHub
gh release create v1.0.0 \
  --title "Garden of Eden V3 v1.0.0" \
  --notes "$(cat CHANGELOG.md)" \
  release/*.dmg \
  release/*.exe \
  release/*.zip

# 3. Publish release
gh release edit v1.0.0 --draft=false
```

---

## Troubleshooting

### Build Fails: "Cannot find module"

**Solution**: Rebuild native modules
```bash
npm run build:native
npm run build:electron
```

### macOS: "App is damaged and can't be opened"

**Solution**: App not notarized or signature invalid
```bash
# Re-sign manually
codesign --force --deep --sign "Developer ID Application: Your Name" \
  "release/mac/Garden of Eden V3.app"

# Re-notarize
xcrun notarytool submit ...
```

### Windows: "SmartScreen prevented an unrecognized app"

**Solution**:
1. Code sign with valid certificate
2. Build reputation over time (Microsoft tracks downloads)
3. Submit for SmartScreen review

### electron-builder: "Application entry file not found"

**Solution**: Check `main` field in package.json
```json
{
  "main": "dist/main/main/index.js"
}
```

---

## Performance Targets

### Build Times
- **Development**: ~2-3s (incremental)
- **Production**: ~30-60s (full rebuild)
- **electron-builder**: ~2-5 min (per platform)

### Bundle Sizes
- **Renderer**: ~834KB (minified + gzipped: ~257KB)
- **Main**: ~500KB (TypeScript compiled)
- **Total App**: ~150MB (without models)
- **With Models**: ~12GB (AI models)

### Installer Sizes
- **macOS DMG**: ~150MB
- **Windows NSIS**: ~150MB
- **Linux AppImage**: ~150MB

---

## Next Steps

### Phase 7 Remaining Tasks

- [ ] Create app icons (`.icns`, `.ico`, `.png`)
- [ ] Test code signing on macOS
- [ ] Test code signing on Windows
- [ ] Implement auto-updater in main process
- [ ] Create first-run onboarding UI
- [ ] Create model downloader UI with progress
- [ ] Test installers on clean systems
- [ ] Set up GitHub Releases automation

### Phase 8: Launch

- [ ] Create GitHub Release with binaries
- [ ] Write comprehensive README
- [ ] Create demo video/screenshots
- [ ] Set up landing page
- [ ] Announce on social media

---

## Resources

- [electron-builder Documentation](https://www.electron.build/)
- [Apple Code Signing Guide](https://developer.apple.com/support/code-signing/)
- [Windows Code Signing](https://docs.microsoft.com/en-us/windows/win32/seccrypto/signtool)
- [electron-updater Guide](https://www.electron.build/auto-update)

---

**Repository**: https://github.com/wannahappyaroundme/Garden_of_Eden_V3
**Issues**: https://github.com/wannahappyaroundme/Garden_of_Eden_V3/issues

