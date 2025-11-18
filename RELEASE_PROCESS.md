# Release Process for v3.4.0

## 📋 Pre-Release Checklist

- [x] All code changes committed
- [x] Version numbers updated to 3.4.0
  - [x] package.json
  - [x] src-tauri/Cargo.toml
  - [x] src-tauri/tauri.conf.json
- [x] CHANGELOG.md updated
- [x] Release notes prepared (RELEASE_NOTES_V3.4.0.md)
- [x] Testing guide created (TESTING_GUIDE_V3.4.0.md)
- [ ] Manual testing completed
- [ ] Production build completed

---

## 🔨 Build Steps

### 1. Clean Previous Builds

```bash
rm -rf src-tauri/target/release/bundle
```

### 2. Build for macOS (Apple Silicon)

```bash
# Ensure cargo is in PATH
export PATH="$HOME/.cargo/bin:/opt/homebrew/opt/node@20/bin:/usr/bin:/bin:/usr/sbin:/sbin"

# Build
npm run build

# OR use Tauri CLI directly
npx tauri build
```

**Expected Output**:
- `src-tauri/target/release/bundle/dmg/Garden of Eden V3_3.4.0_aarch64.dmg`
- `src-tauri/target/release/bundle/macos/Garden of Eden V3.app`

**Build Time**: ~5-10 minutes

### 3. Build for macOS (Intel) - Optional

```bash
rustup target add x86_64-apple-darwin
npx tauri build --target x86_64-apple-darwin
```

---

## 📦 Prepare Release Artifacts

### 1. Create Program Directory Structure

```bash
mkdir -p program/macOS
mkdir -p program/checksums
```

### 2. Copy Build Artifacts

```bash
# Copy DMG installer
cp "src-tauri/target/release/bundle/dmg/Garden of Eden V3_3.4.0_aarch64.dmg" \
   program/macOS/

# If built for Intel
cp "src-tauri/target/release/bundle/dmg/Garden of Eden V3_3.4.0_x64.dmg" \
   program/macOS/
```

### 3. Generate SHA256 Checksums

```bash
cd program/macOS
shasum -a 256 *.dmg > ../checksums/SHA256SUMS.txt
cd ../..
```

**Verify checksums**:
```bash
cat program/checksums/SHA256SUMS.txt
```

---

## 🚀 Create GitHub Release

### Option 1: Using GitHub CLI (`gh`)

```bash
# Create release
gh release create v3.4.0 \
  --title "v3.4.0 - Auto-Updater & Crash Reporting" \
  --notes-file RELEASE_NOTES_V3.4.0.md \
  "program/macOS/Garden of Eden V3_3.4.0_aarch64.dmg#Garden of Eden V3 - macOS (Apple Silicon)" \
  program/checksums/SHA256SUMS.txt
```

### Option 2: Using GitHub Web UI

1. Go to https://github.com/wannahappyaroundme/Garden_of_Eden_V3/releases/new

2. **Tag version**: `v3.4.0`

3. **Release title**: `v3.4.0 - Auto-Updater & Crash Reporting`

4. **Description**: Copy from `RELEASE_NOTES_V3.4.0.md`

5. **Attach binaries**:
   - `Garden of Eden V3_3.4.0_aarch64.dmg` (from `program/macOS/`)
   - `SHA256SUMS.txt` (from `program/checksums/`)

6. **Optional**: Mark as pre-release if this is a beta

7. Click **Publish release**

---

## 📝 Post-Release Tasks

### 1. Verify Release

- [ ] Check release page: https://github.com/wannahappyaroundme/Garden_of_Eden_V3/releases/tag/v3.4.0
- [ ] Verify downloads work
- [ ] Verify checksums match

### 2. Test Auto-Updater

- [ ] Install previous version (v3.3.0)
- [ ] Open app and go to Settings → Updates
- [ ] Click "Check for Updates"
- [ ] Verify v3.4.0 is detected
- [ ] Verify download and installation works

### 3. Update Documentation

- [ ] Update README.md with latest version
- [ ] Update project status in CLAUDE.md (if needed)
- [ ] Close related issues on GitHub

### 4. Announce Release

- [ ] GitHub Discussions announcement
- [ ] Update project README badges (if any)

---

## 🐛 Troubleshooting

### Build Fails with "cargo not found"

**Solution**:
```bash
# Add cargo to PATH
export PATH="$HOME/.cargo/bin:$PATH"

# Verify cargo is available
cargo --version
```

### Build Fails with Rust Errors

**Solution**:
```bash
# Update Rust
rustup update

# Clean build cache
cargo clean

# Rebuild
npm run build
```

### DMG Not Code Signed

**For testing**: This is okay for local development builds.

**For production**:
1. Get Apple Developer certificate
2. Update `tauri.conf.json`:
   ```json
   "macOS": {
     "signingIdentity": "Your Developer ID"
   }
   ```

### Auto-Updater Not Working

**Requirements**:
1. GitHub release must exist
2. Release must be tagged (e.g., `v3.4.0`)
3. DMG file must be attached to release
4. `tauri.conf.json` updater config must point to correct endpoint

**Verify**:
```bash
curl -L https://github.com/wannahappyaroundme/Garden_of_Eden_V3/releases/latest/download/latest.json
```

---

## 📊 Build Verification Checklist

After building, verify:

- [ ] DMG file exists and is ~7-15 MB in size
- [ ] DMG file opens and shows app installer
- [ ] App launches without errors
- [ ] Version in Settings → About shows 3.4.0
- [ ] All new features work (Auto-Updater, Crash Reporting)
- [ ] No console errors in Developer Tools

---

## 🔐 Security Checklist

- [ ] No secrets in code (API keys, passwords, etc.)
- [ ] No hardcoded credentials
- [ ] Code signed (for production builds)
- [ ] Checksums generated and verified
- [ ] HTTPS-only update endpoints

---

## 📄 Files Generated

After successful release:

```
program/
├── macOS/
│   └── Garden of Eden V3_3.4.0_aarch64.dmg
└── checksums/
    └── SHA256SUMS.txt

RELEASE_NOTES_V3.4.0.md
TESTING_GUIDE_V3.4.0.md
CHANGELOG.md (updated)
```

---

## 🎯 Next Version (v3.5.0)

After v3.4.0 is released, prepare for next version:

1. Create new branch: `git checkout -b feature/v3.5.0`
2. Update version numbers to `3.5.0-dev`
3. Start implementing next features from development plan

---

## 📞 Support

If you encounter issues during release:

1. Check build logs: `cat build.log` or `npm run build 2>&1 | tee build.log`
2. Verify Rust/Node versions
3. Clean and rebuild: `cargo clean && npm run build`
4. Check GitHub Issues for similar problems

---

**Last Updated**: 2025-11-18
**Version**: 3.4.0
**Status**: Ready for Release
