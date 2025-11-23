# Release Workflow Guide

Complete guide for creating and publishing Garden of Eden V3 releases.

## Prerequisites

### Required Tools

1. **Node.js 20+**
   ```bash
   node --version  # Should be v20.x.x
   ```

2. **Rust 1.70+**
   ```bash
   rustc --version  # Should be 1.70+
   ```

3. **Tauri CLI**
   ```bash
   npm install -g @tauri-apps/cli
   ```

4. **GitHub CLI**
   ```bash
   brew install gh
   gh auth login
   ```

5. **Protocol Buffers** (for LanceDB)
   ```bash
   brew install protobuf
   ```

### Rust Targets

For universal macOS builds:
```bash
rustup target add x86_64-apple-darwin
rustup target add aarch64-apple-darwin
```

For Windows builds (on macOS with cross-compilation):
```bash
# Note: Cross-compiling to Windows from macOS is complex
# Recommend building Windows binaries on Windows machine
rustup target add x86_64-pc-windows-msvc
```

## Release Process

### 1. Prepare Release

#### Update Version

Edit `package.json`:
```json
{
  "version": "3.4.0"
}
```

Edit `src-tauri/Cargo.toml`:
```toml
[package]
version = "3.4.0"
```

Edit `src-tauri/tauri.conf.json`:
```json
{
  "version": "3.4.0"
}
```

#### Create Release Notes

Create `RELEASE_NOTES_V{VERSION}.md`:
```bash
cp docs/RELEASE_NOTES_TEMPLATE.md RELEASE_NOTES_V3.4.0.md
# Edit with release details
```

#### Commit Changes

```bash
git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json RELEASE_NOTES_V3.4.0.md
git commit -m "chore: Bump version to 3.4.0"
git push origin main
```

### 2. Build Release Artifacts

#### macOS Universal Binary

```bash
# Build for both Apple Silicon and Intel
npm run tauri:build:mac

# Output: src-tauri/target/universal-apple-darwin/release/bundle/dmg/*.dmg
```

**Build Time:** ~5-10 minutes
**Output Size:** ~200-300 MB

**Note on Code Signing:**
- Default: Ad-hoc signing (`signingIdentity: "-"`)
- For distribution: Requires Apple Developer ID ($99/year)
- Without signing: Users see security warning on first launch

#### Windows Installers

**Option A: Build on Windows**
```bash
npm run tauri:build:win

# Outputs:
# - NSIS: src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/*.exe
# - MSI: src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi/*.msi
```

**Option B: Cross-compile from macOS** (Not Recommended)
- Complex setup required
- May have linking issues
- Recommend using Windows VM or GitHub Actions

**Build Time:** ~5-10 minutes
**Output Size:** ~150-250 MB

**Note on Code Signing:**
- Requires Windows Authenticode certificate
- Without signing: SmartScreen warnings

### 3. Generate Update Manifest

```bash
npm run release:manifest
```

This generates `latest.json`:
```json
{
  "version": "3.4.0",
  "notes": "See release notes: https://github.com/...",
  "pub_date": "2025-11-22T12:00:00.000Z",
  "platforms": {
    "darwin-universal": {
      "signature": "sha256_checksum_here",
      "url": "https://github.com/.../download/v3.4.0/Garden-of-Eden-V3_3.4.0_universal.dmg"
    },
    "windows-x86_64": {
      "signature": "sha256_checksum_here",
      "url": "https://github.com/.../download/v3.4.0/Garden-of-Eden-V3_3.4.0_x64-setup.exe"
    }
  }
}
```

### 4. Generate Checksums

```bash
npm run release:checksums
```

Creates `SHA256SUMS.txt`:
```
Garden of Eden V3 - v3.4.0
SHA256 Checksums
Generated: 2025-11-22 12:00:00 UTC

abc123...  Garden-of-Eden-V3_3.4.0_universal.dmg
def456...  Garden-of-Eden-V3_3.4.0_x64-setup.exe
ghi789...  Garden-of-Eden-V3_3.4.0_x64.msi
jkl012...  latest.json
```

### 5. Create GitHub Release

```bash
npm run release:create
```

This creates a **draft release** with:
- Tag: `v3.4.0`
- Title: "Garden of Eden V3 - v3.4.0"
- Body: Contents of `RELEASE_NOTES_V3.4.0.md`

### 6. Upload Release Assets

```bash
npm run release:upload
```

Uploads:
- macOS DMG
- Windows NSIS installer
- Windows MSI installer
- `latest.json` (updater manifest)
- `SHA256SUMS.txt`

### 7. Publish Release

Review the draft release:
```bash
gh release view v3.4.0 --web
```

Publish when ready:
```bash
gh release edit v3.4.0 --draft=false
```

## Automated Release (All Steps)

Run all steps at once:
```bash
npm run release
```

This executes:
1. `release:manifest` - Generate latest.json
2. `release:checksums` - Generate SHA256SUMS.txt
3. `release:create` - Create draft GitHub release
4. `release:upload` - Upload all assets

## Code Signing

### macOS

#### Without Code Signing (Default)
- Build works immediately
- Users see: "App from unidentified developer"
- Users must: Right-click → Open → Confirm

#### With Apple Developer ID
1. **Obtain Certificate:**
   - Join Apple Developer Program ($99/year)
   - Create Developer ID Application certificate
   - Download and install in Keychain

2. **Configure Signing:**
   Edit `src-tauri/tauri.conf.json`:
   ```json
   {
     "bundle": {
       "macOS": {
         "signingIdentity": "Developer ID Application: Your Name (TEAM_ID)"
       }
     }
   }
   ```

3. **Notarize:**
   ```bash
   xcrun notarytool submit "app.dmg" \
     --apple-id "your@email.com" \
     --team-id "TEAM_ID" \
     --password "app-specific-password" \
     --wait
   ```

### Windows

#### Without Code Signing (Default)
- Build works immediately
- SmartScreen shows warning
- Users must click "More info" → "Run anyway"

#### With Authenticode Certificate
1. **Obtain Certificate:**
   - Purchase from DigiCert, Sectigo, etc. ($200-400/year)
   - Or use self-signed (not recommended for distribution)

2. **Configure Signing:**
   Edit `src-tauri/tauri.conf.json`:
   ```json
   {
     "bundle": {
       "windows": {
         "certificateThumbprint": "YOUR_CERT_THUMBPRINT",
         "digestAlgorithm": "sha256",
         "timestampUrl": "http://timestamp.digicert.com"
       }
     }
   }
   ```

## Auto-Updater

### How It Works

1. **App Launch:**
   - Checks `endpoints` in tauri.conf.json
   - Fetches `latest.json`
   - Compares version

2. **Update Available:**
   - Shows notification to user
   - Downloads update in background
   - Verifies SHA256 signature
   - Prompts user to install

3. **Update Installation:**
   - Quits app
   - Installs new version
   - Relaunches app

### Configuration

`src-tauri/tauri.conf.json`:
```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/YOUR_ORG/YOUR_REPO/releases/latest/download/latest.json"
      ],
      "dialog": true,
      "pubkey": "YOUR_PUBLIC_KEY"
    }
  }
}
```

### Testing Auto-Updater

1. **Install Previous Version:**
   ```bash
   # Install v3.3.0
   open "Garden-of-Eden-V3_3.3.0_universal.dmg"
   ```

2. **Publish New Release:**
   ```bash
   # Create v3.4.0 release
   npm run release
   gh release edit v3.4.0 --draft=false
   ```

3. **Launch App:**
   - App checks for updates
   - Should detect v3.4.0
   - Prompts to download and install

## Troubleshooting

### Build Errors

**Error: `protoc` not found**
```bash
brew install protobuf
```

**Error: Target not installed**
```bash
rustup target add x86_64-apple-darwin
```

**Error: Linking failed**
```bash
# Clean build
rm -rf src-tauri/target
npm run tauri:build:mac
```

### Release Errors

**Error: `gh` not authenticated**
```bash
gh auth login
```

**Error: Release already exists**
```bash
# Delete existing release
gh release delete v3.4.0 --yes
# Recreate
npm run release:create
```

**Error: Asset upload failed**
```bash
# Upload manually
gh release upload v3.4.0 path/to/artifact.dmg --clobber
```

### Auto-Updater Issues

**Update not detected**
- Check `latest.json` is accessible
- Verify version number is higher
- Check app permissions

**Download fails**
- Verify SHA256 signature matches
- Check file permissions
- Try manual download

**Installation fails**
- Check disk space
- Verify app permissions
- Try manual installation

## Release Checklist

- [ ] Update version in package.json, Cargo.toml, tauri.conf.json
- [ ] Create release notes (RELEASE_NOTES_V{VERSION}.md)
- [ ] Commit and push version bump
- [ ] Build macOS universal binary
- [ ] Build Windows installers (NSIS + MSI)
- [ ] Generate update manifest (latest.json)
- [ ] Generate checksums (SHA256SUMS.txt)
- [ ] Create draft GitHub release
- [ ] Upload all assets
- [ ] Verify downloads work
- [ ] Test auto-updater
- [ ] Publish release
- [ ] Announce on social media / discussions

## Best Practices

1. **Versioning:** Follow semantic versioning (MAJOR.MINOR.PATCH)
2. **Release Notes:** Detailed, user-friendly, with examples
3. **Testing:** Test builds on clean machines before publishing
4. **Signing:** Use code signing for production releases
5. **Automation:** Use GitHub Actions for consistent builds
6. **Rollback:** Keep previous versions available for rollback

## Resources

- [Tauri Release Documentation](https://tauri.app/v1/guides/distribution/windows)
- [GitHub Releases Guide](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [Apple Code Signing](https://developer.apple.com/support/code-signing/)
- [Windows Code Signing](https://docs.microsoft.com/en-us/windows/win32/seccrypto/signing-code)
