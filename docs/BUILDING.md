# Build and Deployment Guide - Garden of Eden V3

Complete guide for building, packaging, and releasing Garden of Eden V3.

**Last Updated**: 2025-11-16
**Framework**: Tauri 2.9
**Current Version**: 1.0.0

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Build](#development-build)
3. [Production Build](#production-build)
4. [Platform-Specific Builds](#platform-specific-builds)
5. [Code Signing](#code-signing)
6. [Release Process](#release-process)
7. [Distribution](#distribution)

---

## Prerequisites

### Required Tools

**For All Platforms:**
- Node.js 20+ (`node --version`)
- npm 9+ (`npm --version`)
- Rust 1.70+ (`rustc --version`)
- Cargo (`cargo --version`)

**For macOS Builds:**
- macOS 12+ (Monterey or later)
- Xcode Command Line Tools (`xcode-select --install`)
- Tauri CLI (`cargo install tauri-cli`)

**For Windows Builds:**
- Windows 10/11
- Visual Studio Build Tools
- Windows SDK
- Tauri CLI (`cargo install tauri-cli`)

### Installation

```bash
# 1. Clone repository
git clone https://github.com/wannahappyaroundme/Garden_of_Eden_V3.git
cd Garden_of_Eden_V3

# 2. Install dependencies
npm install

# 3. Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 4. Install Tauri CLI
cargo install tauri-cli
```

---

## Development Build

### Run Development Server

```bash
# Start dev server (hot reload enabled)
npm run dev

# Alternative: Run processes separately
npm run dev:renderer  # Vite dev server (frontend)
cd src-tauri && cargo tauri dev  # Tauri dev (backend)
```

**Development Features:**
- ✅ Hot module replacement (HMR)
- ✅ Fast refresh for React components
- ✅ Rust auto-recompile on save
- ✅ DevTools enabled
- ✅ Source maps included

**Dev Server URLs:**
- Frontend: `http://localhost:5173/`
- Backend: Rust main process

---

## Production Build

### Step 1: Build Frontend

```bash
# Build optimized React frontend
npm run build:renderer
```

**Output**: `dist/renderer/` - Optimized HTML, CSS, JS

### Step 2: Build Tauri Application

```bash
# Build Tauri app for current platform
cd src-tauri
cargo tauri build
```

**Output** (example for macOS):
- `src-tauri/target/release/bundle/dmg/*.dmg`
- `src-tauri/target/release/bundle/macos/*.app`

### All-in-One Build Command

```bash
# Build frontend + Tauri app
npm run build:mac  # macOS
npm run build:win  # Windows (if on Windows)
```

---

## Platform-Specific Builds

### macOS

#### Build for Apple Silicon (M1/M2/M3)

```bash
# Frontend
npm run build:renderer

# Tauri app
cd src-tauri
cargo tauri build --target aarch64-apple-darwin
```

**Output:**
- `Garden of Eden V3_1.0.0_aarch64.dmg` (~7MB)
- `Garden of Eden V3.app` (Application bundle)

#### Build for Intel (x86_64)

```bash
cd src-tauri
cargo tauri build --target x86_64-apple-darwin
```

#### Universal Binary (Intel + Apple Silicon)

```bash
# Install targets
rustup target add aarch64-apple-darwin x86_64-apple-darwin

# Build universal binary
cargo tauri build --target universal-apple-darwin
```

**File Locations:**
- DMG: `src-tauri/target/release/bundle/dmg/`
- App Bundle: `src-tauri/target/release/bundle/macos/`

---

### Windows

```bash
# Frontend
npm run build:renderer

# Tauri app
cd src-tauri
cargo tauri build --target x86_64-pc-windows-msvc
```

**Output:**
- `Garden of Eden V3_1.0.0_x64-setup.msi` (~15MB) - Installer
- `Garden of Eden V3_1.0.0_x64.exe` - Portable executable

**File Locations:**
- MSI: `src-tauri/target/release/bundle/msi/`
- EXE: `src-tauri/target/release/`

---

## Code Signing

### macOS Code Signing

**Prerequisites:**
- Apple Developer Account
- Developer ID Application Certificate
- Developer ID Installer Certificate (for PKG)

#### Setup Certificates

```bash
# 1. Download certificates from Apple Developer Portal
# 2. Install certificates in Keychain Access

# 3. Verify certificates
security find-identity -v -p codesigning
```

#### Configure Signing

Edit `src-tauri/tauri.conf.json`:

```json
{
  "tauri": {
    "bundle": {
      "macOS": {
        "signingIdentity": "Developer ID Application: Your Name (TEAM_ID)",
        "entitlements": "path/to/entitlements.plist"
      }
    }
  }
}
```

#### Build with Signing

```bash
# Set environment variable
export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAM_ID)"

# Build (auto-signs if certificate found)
cargo tauri build
```

#### Notarization (Optional)

```bash
# Notarize DMG
xcrun notarytool submit "Garden of Eden V3_1.0.0_aarch64.dmg" \
  --apple-id "your@email.com" \
  --team-id "TEAM_ID" \
  --password "app-specific-password" \
  --wait

# Staple notarization ticket
xcrun stapler staple "Garden of Eden V3_1.0.0_aarch64.dmg"
```

---

### Windows Code Signing

**Prerequisites:**
- Authenticode certificate (.pfx or .p12)
- Certificate password

#### Setup Certificate

```bash
# Set environment variables (PowerShell)
$env:TAURI_PRIVATE_KEY = "path/to/certificate.pfx"
$env:TAURI_KEY_PASSWORD = "certificate_password"
```

#### Build with Signing

```bash
# Build (auto-signs if certificate configured)
cargo tauri build
```

---

## Release Process

### 1. Prepare Release

#### Update Version

```bash
# Update package.json
npm version <major|minor|patch> --no-git-tag-version

# Update src-tauri/tauri.conf.json
# Edit line: "version": "X.Y.Z"
```

#### Update CHANGELOG.md

```markdown
## [X.Y.Z] - 2025-MM-DD

### Added
- New features

### Changed
- Modifications

### Fixed
- Bug fixes

### Security
- Security improvements
```

#### Commit Changes

```bash
git add package.json src-tauri/tauri.conf.json CHANGELOG.md
git commit -m "chore: Bump version to X.Y.Z"
git push origin main
```

---

### 2. Create Git Tag

```bash
# Create annotated tag
git tag -a v1.0.0 -m "Release v1.0.0: Description"

# Push tag (triggers release workflow)
git push origin v1.0.0
```

---

### 3. Build Release Artifacts

#### Manual Build (Local)

```bash
# macOS
npm run build:renderer
cd src-tauri
cargo tauri build

# Copy artifacts to program/
mkdir -p ../program/macOS
cp target/release/bundle/dmg/*.dmg ../program/macOS/
```

#### Automated Build (GitHub Actions)

Create `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: dtolnay/rust-toolchain@stable

      - run: npm install
      - run: npm run build:renderer
      - run: cd src-tauri && cargo tauri build

      - uses: actions/upload-artifact@v4
        with:
          name: macos-dmg
          path: src-tauri/target/release/bundle/dmg/*.dmg

  build-windows:
    runs-on: windows-latest
    steps:
      # Similar steps for Windows
```

---

### 4. Create GitHub Release

```bash
# Using GitHub CLI
gh release create v1.0.0 \
  --title "Garden of Eden V3 v1.0.0" \
  --notes "See CHANGELOG.md for details" \
  program/macOS/*.dmg \
  program/Windows/*.msi
```

**Or use GitHub web interface:**
1. Go to Releases → Draft a new release
2. Choose tag `v1.0.0`
3. Upload binaries from `program/` folder
4. Write release notes
5. Publish release

---

## Distribution

### File Structure

```
program/
├── macOS/
│   └── Garden of Eden V3_1.0.0_aarch64.dmg (7.1MB)
├── Windows/
│   ├── Garden of Eden V3_1.0.0_x64-setup.msi (~15MB)
│   └── Garden of Eden V3_1.0.0_x64.exe
└── checksums/
    └── SHA256SUMS.txt
```

### Generate Checksums

```bash
cd program
shasum -a 256 macOS/*.dmg Windows/*.msi > checksums/SHA256SUMS.txt
```

### Distribution Channels

**Primary:**
- GitHub Releases (recommended)
- Direct download from project website

**Future:**
- Homebrew Cask (macOS)
- Chocolatey (Windows)
- Microsoft Store (Windows)
- Mac App Store (macOS) - requires App Store Connect

---

## Build Sizes

| Platform | Tauri | Notes |
|----------|-------|-------|
| **macOS DMG (ARM64)** | 7.1MB | Apple Silicon optimized |
| **macOS DMG (x64)** | ~8MB | Intel processors |
| **macOS Universal** | ~15MB | Both architectures |
| **Windows MSI** | ~15MB | Installer |
| **Windows EXE** | ~12MB | Portable |

**Note:** AI models (~16.5GB total) are NOT included in binaries and are downloaded during first run:
- phi3:mini: 2.2GB (primary LLM)
- Whisper: 3.1GB (optional, voice input)

---

## Troubleshooting

### macOS Build Issues

**Error: "No signing identity found"**
```bash
# Solution: Disable code signing for development
export CSC_IDENTITY_AUTO_DISCOVERY=false
cargo tauri build
```

**Error: "xcrun: error: unable to find utility"**
```bash
# Solution: Install Xcode Command Line Tools
xcode-select --install
```

### Windows Build Issues

**Error: "NSIS not found"**
```bash
# Solution: Tauri uses WiX for MSI, not NSIS
# Ensure WiX Toolset is installed
# Or use MSI target only in tauri.conf.json
```

### Build Performance

**Slow Rust compilation:**
```bash
# Use faster linker (mold on Linux, lld on Windows/macOS)
cargo install -f cargo-binutils
rustup component add llvm-tools-preview

# Or use sccache for caching
cargo install sccache
export RUSTC_WRAPPER=sccache
```

---

## Best Practices

1. ✅ **Always test builds locally** before releasing
2. ✅ **Update CHANGELOG.md** for every release
3. ✅ **Use semantic versioning** (MAJOR.MINOR.PATCH)
4. ✅ **Sign all production binaries** (macOS and Windows)
5. ✅ **Generate checksums** for all release artifacts
6. ✅ **Test installation** on clean systems
7. ✅ **Keep build dependencies updated** but test thoroughly

---

**Last Updated**: 2025-11-16
**Build System**: Tauri 2.9 + Vite 7.2
**Supported Platforms**: macOS (ARM64, x64), Windows (x64)
