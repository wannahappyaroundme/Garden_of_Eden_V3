# Deployment Guide

Complete guide to deploying Garden of Eden V3 to production.

---

## Table of Contents

1. [Overview](#overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Local Build Process](#local-build-process)
4. [Code Signing](#code-signing)
5. [Creating GitHub Release](#creating-github-release)
6. [Distribution](#distribution)
7. [Post-Release Verification](#post-release-verification)
8. [Rollback Procedures](#rollback-procedures)
9. [CI/CD with GitHub Actions](#cicd-with-github-actions)

---

## Overview

### Build Architecture

Garden of Eden V3 uses:
- **Framework**: Tauri 2.9
- **Build System**: Tauri CLI + cargo
- **Platforms**: macOS (Intel + Apple Silicon universal binary)
- **Package Format**: DMG (macOS), future: MSI/EXE (Windows)

### Release Process Summary

```
1. Code freeze → 2. Testing → 3. Version bump → 4. Build →
5. Code signing → 6. GitHub Release → 7. Verification → 8. Announce
```

---

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing (`npm test`)
- [ ] Type checking clean (`npm run type-check`)
- [ ] Linting clean (`npm run lint`)
- [ ] No console errors in dev mode
- [ ] All TODOs resolved or documented

### Functionality

- [ ] Chat interface working
- [ ] Voice input/output working
- [ ] Screen context capture working
- [ ] Persona settings save/load working
- [ ] Google OAuth working (if enabled)
- [ ] Cloud backup working (if enabled)
- [ ] File operations working
- [ ] Git integration working
- [ ] Model download working (onboarding)

### Documentation

- [ ] README.md updated with new version
- [ ] CHANGELOG.md updated with changes
- [ ] Version number bumped in:
  - [ ] `package.json`
  - [ ] `src-tauri/Cargo.toml`
  - [ ] `src-tauri/tauri.conf.json`
  - [ ] README.md badges

### Dependencies

- [ ] All dependencies up to date
- [ ] No critical security vulnerabilities (`npm audit`)
- [ ] Rust dependencies updated (`cargo update`)
- [ ] Ollama version compatibility checked

---

## Local Build Process

### 1. Environment Setup

```bash
# Ensure correct Node version
node --version  # Should be v20.x.x

# Ensure Rust installed
rustc --version  # Should be 1.70+

# Ensure Tauri CLI installed
npm install -g @tauri-apps/cli
```

### 2. Clean Build

```bash
# Clean previous builds
rm -rf dist/
rm -rf src-tauri/target/
rm -rf out/
rm -rf program/

# Install dependencies
npm install

# Type check
npm run type-check

# Lint
npm run lint
```

### 3. Build for macOS

```bash
# Set environment variables
export PATH="/opt/homebrew/opt/node@20/bin:$HOME/.cargo/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export CSC_IDENTITY_AUTO_DISCOVERY=false  # Disable auto signing (we'll sign manually)

# Build universal binary (Intel + Apple Silicon)
npm run build:mac
```

**Output**: `src-tauri/target/release/bundle/dmg/Garden of Eden V3_[version]_aarch64.dmg`

### 4. Build for Windows (Future)

```bash
# On Windows machine
npm run build:win
```

**Output**: `src-tauri/target/release/bundle/msi/Garden of Eden V3_[version]_x64.msi`

---

## Code Signing

### macOS Code Signing

#### Prerequisites

1. **Apple Developer Account** - $99/year
2. **Developer ID Certificate** - From Apple Developer Portal
3. **Xcode Command Line Tools** - `xcode-select --install`

#### Step 1: Create Signing Identity

```bash
# List available certificates
security find-identity -v -p codesigning

# Should show:
# 1) XXXXXXXXX "Developer ID Application: Your Name (TEAM_ID)"
```

#### Step 2: Sign the DMG

```bash
# Define variables
DMG_PATH="src-tauri/target/release/bundle/dmg/Garden of Eden V3_3.0.4_aarch64.dmg"
IDENTITY="Developer ID Application: Your Name (TEAM_ID)"

# Sign the DMG
codesign --sign "$IDENTITY" \
         --deep \
         --force \
         --options runtime \
         --entitlements src-tauri/entitlements.plist \
         "$DMG_PATH"

# Verify signature
codesign --verify --deep --strict --verbose=2 "$DMG_PATH"
```

#### Step 3: Notarize with Apple

```bash
# Create app-specific password at appleid.apple.com

# Store credentials
xcrun notarytool store-credentials "garden-of-eden" \
  --apple-id "your-email@example.com" \
  --team-id "TEAM_ID" \
  --password "app-specific-password"

# Submit for notarization
xcrun notarytool submit "$DMG_PATH" \
  --keychain-profile "garden-of-eden" \
  --wait

# Check status
xcrun notarytool log <submission-id> \
  --keychain-profile "garden-of-eden"

# Staple notarization ticket
xcrun stapler staple "$DMG_PATH"

# Verify stapling
xcrun stapler validate "$DMG_PATH"
```

#### Step 4: Verify Gatekeeper

```bash
# Test Gatekeeper approval
spctl --assess --type open --context context:primary-signature "$DMG_PATH"

# Should show: "accepted"
```

### Windows Code Signing (Future)

```bash
# Use SignTool from Windows SDK
signtool sign /f certificate.pfx /p password /t http://timestamp.digicert.com "Garden of Eden V3.msi"
```

---

## Creating GitHub Release

### 1. Prepare Release Assets

```bash
# Create release directory
mkdir -p release/v3.0.4

# Copy signed DMG
cp "$DMG_PATH" "release/v3.0.4/Garden-of-Eden-V3-macOS-v3.0.4.dmg"

# Generate checksums
cd release/v3.0.4
shasum -a 256 *.dmg > SHA256SUMS.txt
cat SHA256SUMS.txt
```

### 2. Create Git Tag

```bash
# Create annotated tag
git tag -a v3.0.4 -m "Release v3.0.4: [Brief description]"

# Push tag
git push origin v3.0.4
```

### 3. Create GitHub Release

#### Option A: GitHub CLI (Recommended)

```bash
# Create release
gh release create v3.0.4 \
  --title "Garden of Eden V3 - v3.0.4" \
  --notes "$(cat RELEASE_NOTES.md)" \
  release/v3.0.4/*.dmg \
  release/v3.0.4/SHA256SUMS.txt
```

#### Option B: GitHub Web Interface

1. Go to https://github.com/wannahappyaroundme/Garden_of_Eden_V3/releases
2. Click "Draft a new release"
3. Tag: `v3.0.4`
4. Title: `Garden of Eden V3 - v3.0.4`
5. Description: Paste from `RELEASE_NOTES.md`
6. Upload files:
   - `Garden-of-Eden-V3-macOS-v3.0.4.dmg`
   - `SHA256SUMS.txt`
7. Check "Set as latest release"
8. Click "Publish release"

### 4. Release Notes Template

```markdown
# 🌳 Garden of Eden V3 - v3.0.4

## 🎉 What's New

[List major new features]

- New feature 1
- New feature 2
- Improvement 3

## 🐛 Bug Fixes

[List bug fixes]

- Fixed issue #123
- Fixed crash when...

## 🔧 Technical Changes

[List technical improvements]

- Upgraded Tauri to 2.9
- Improved performance...

## 📦 Downloads

### macOS
- **Apple Silicon (M1/M2/M3)**: `Garden-of-Eden-V3-macOS-v3.0.4.dmg` (7.1 MB)
- **Intel**: Same universal binary

### System Requirements
- macOS 11 Big Sur or later
- 16GB RAM minimum, 24GB recommended
- 20GB free disk space

### Installation
1. Download DMG file
2. Open DMG
3. Drag "Garden of Eden V3" to Applications
4. Launch and follow onboarding

### Verification
SHA256 checksum available in `SHA256SUMS.txt`

## 📖 Documentation

- [Quick Start Guide](docs/QUICKSTART.md)
- [User Guide](docs/USER_GUIDE.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Full Wiki](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/wiki)

## 🙏 Contributors

[List contributors]

## ⬆️ Upgrade Notes

[Any breaking changes or migration steps]

---

**Full Changelog**: https://github.com/wannahappyaroundme/Garden_of_Eden_V3/compare/v3.0.3...v3.0.4
```

---

## Distribution

### GitHub Releases (Primary)

**URL**: https://github.com/wannahappyaroundme/Garden_of_Eden_V3/releases

**Pros**:
- ✅ Free hosting
- ✅ Unlimited downloads
- ✅ Version history
- ✅ Checksums included

**Setup**: Automatic via GitHub

### Homebrew Cask (Future)

```bash
# Create Homebrew cask
brew tap wannahappyaroundme/garden-of-eden
brew install --cask garden-of-eden
```

**File**: `homebrew-garden-of-eden/Casks/garden-of-eden.rb`

```ruby
cask "garden-of-eden" do
  version "3.0.4"
  sha256 "abc123..."

  url "https://github.com/wannahappyaroundme/Garden_of_Eden_V3/releases/download/v#{version}/Garden-of-Eden-V3-macOS-v#{version}.dmg"
  name "Garden of Eden V3"
  desc "100% local, privacy-first AI assistant"
  homepage "https://github.com/wannahappyaroundme/Garden_of_Eden_V3"

  app "Garden of Eden V3.app"
end
```

### Direct Website (Future)

- Host on custom domain
- Provide direct download links
- Include auto-update checker

---

## Post-Release Verification

### 1. Download Test

```bash
# Download from GitHub Release
curl -L -o test.dmg "https://github.com/wannahappyaroundme/Garden_of_Eden_V3/releases/download/v3.0.4/Garden-of-Eden-V3-macOS-v3.0.4.dmg"

# Verify checksum
shasum -a 256 test.dmg
# Compare with SHA256SUMS.txt
```

### 2. Installation Test

```bash
# Mount DMG
hdiutil attach test.dmg

# Copy to Applications (in test folder)
mkdir -p ~/Desktop/TestInstall
cp -R "/Volumes/Garden of Eden V3/Garden of Eden V3.app" ~/Desktop/TestInstall/

# Unmount
hdiutil detach "/Volumes/Garden of Eden V3"

# Launch
open ~/Desktop/TestInstall/Garden\ of\ Eden\ V3.app
```

### 3. Functional Test

- [ ] App launches without errors
- [ ] Onboarding wizard completes
- [ ] Model downloads successfully
- [ ] Chat works (send/receive messages)
- [ ] Voice input works
- [ ] Screen context works
- [ ] Settings save correctly
- [ ] No crashes or memory leaks

### 4. Gatekeeper Test

```bash
# Test on fresh macOS install or different Mac
# Should open without security warnings (if signed & notarized)
```

---

## Rollback Procedures

### If Release is Broken

#### Option 1: Mark as Pre-release

1. Go to GitHub Release
2. Edit release
3. Check "This is a pre-release"
4. Save

#### Option 2: Delete Release

```bash
# Delete tag locally
git tag -d v3.0.4

# Delete tag remotely
git push origin :refs/tags/v3.0.4

# Delete release on GitHub
gh release delete v3.0.4 --yes
```

#### Option 3: Create Hotfix Release

```bash
# Create hotfix branch
git checkout -b hotfix/v3.0.5

# Fix issues
# ...

# Build and release v3.0.5
npm run build:mac
# ... follow release process
```

### Communication

**Announce rollback immediately**:
- GitHub Discussions post
- Update README with warning
- Close issues related to broken release

---

## CI/CD with GitHub Actions

### Automated Build on Tag

Create `.github/workflows/release.yml`:

```yaml
name: Release Build

on:
  push:
    tags:
      - 'v*'

jobs:
  build-macos:
    runs-on: macos-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable

      - name: Install dependencies
        run: npm install

      - name: Build app
        run: |
          export CSC_IDENTITY_AUTO_DISCOVERY=false
          npm run build:mac

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: macos-dmg
          path: src-tauri/target/release/bundle/dmg/*.dmg

  create-release:
    needs: build-macos
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Download artifacts
        uses: actions/download-artifact@v3

      - name: Create release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            macos-dmg/*.dmg
          draft: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Automated Tests

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: macos-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Run tests
        run: npm test

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint
```

---

## Version Numbering

### Semantic Versioning

```
MAJOR.MINOR.PATCH

Example: 3.0.4
- 3 = Major version (breaking changes)
- 0 = Minor version (new features, backward compatible)
- 4 = Patch version (bug fixes)
```

### When to Bump

- **MAJOR** (3.0.0 → 4.0.0): Breaking changes, API changes
- **MINOR** (3.0.0 → 3.1.0): New features, backward compatible
- **PATCH** (3.0.4 → 3.0.5): Bug fixes, no new features

---

## Deployment Schedule

### Release Cadence

- **Major releases**: Quarterly (Q1, Q2, Q3, Q4)
- **Minor releases**: Monthly
- **Patch releases**: As needed (hotfixes)

### Example Timeline

- **Week 1-2**: Development
- **Week 3**: Code freeze, testing
- **Week 4, Day 1**: Build and code signing
- **Week 4, Day 2**: Release creation
- **Week 4, Day 3**: Verification and announcement

---

## Security

### Code Signing Certificates

- **Store securely**: Use macOS Keychain
- **Rotate annually**: Renew before expiration
- **Backup**: Keep P12 backup in secure location

### Secrets Management

- Never commit signing certificates
- Use GitHub Secrets for CI/CD
- Use environment variables for sensitive data

---

## Monitoring

### Post-Release Monitoring

- GitHub Issues (bug reports)
- GitHub Discussions (user feedback)
- Download statistics (GitHub Releases)
- Crash reports (future: Sentry integration)

### Metrics to Track

- Number of downloads
- Installation success rate
- Crash rate
- User feedback sentiment

---

## Troubleshooting Deployment

### Build Fails

```bash
# Clean and rebuild
rm -rf node_modules src-tauri/target
npm install
npm run build:mac
```

### Code Signing Fails

```bash
# Verify certificate
security find-identity -v -p codesigning

# Check entitlements
cat src-tauri/entitlements.plist

# Re-sign manually
codesign --force --sign "Developer ID Application: ..." --deep "path/to/app"
```

### Notarization Fails

```bash
# Check notarization log
xcrun notarytool log <submission-id> --keychain-profile "garden-of-eden"

# Common issues:
# - Hardened runtime not enabled
# - Missing entitlements
# - Unsigned dependencies
```

### GitHub Release Fails

```bash
# Check GitHub CLI auth
gh auth status

# Re-login
gh auth login

# Try creating release manually via web interface
```

---

## Checklist: Complete Release Process

- [ ] **Pre-release**
  - [ ] Code freeze
  - [ ] All tests passing
  - [ ] Version bumped in all files
  - [ ] CHANGELOG updated
  - [ ] Documentation updated

- [ ] **Build**
  - [ ] Clean build
  - [ ] macOS universal binary created
  - [ ] File size verified (<10MB)

- [ ] **Code Signing**
  - [ ] DMG signed with Developer ID
  - [ ] Notarized by Apple
  - [ ] Stapled notarization ticket
  - [ ] Gatekeeper test passed

- [ ] **Release**
  - [ ] Git tag created and pushed
  - [ ] GitHub Release created
  - [ ] DMG uploaded
  - [ ] SHA256SUMS.txt uploaded
  - [ ] Release notes complete

- [ ] **Verification**
  - [ ] Download test
  - [ ] Installation test
  - [ ] Functional test
  - [ ] No security warnings

- [ ] **Announcement**
  - [ ] GitHub Discussions post
  - [ ] README badge updated
  - [ ] Social media (if applicable)

- [ ] **Post-release**
  - [ ] Monitor issues
  - [ ] Track downloads
  - [ ] Respond to feedback

---

**Deployment Owner**: Matthew (@wannahappyaroundme)
**Last Updated**: 2025-01-16
**Version**: 3.0.4
