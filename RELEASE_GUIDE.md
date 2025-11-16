# 🚀 Release Guide - Garden of Eden V3

This guide explains how to create releases for Garden of Eden V3 using GitHub Actions for automated builds on Windows and macOS.

---

## 📋 Prerequisites

Before creating a release, ensure you have:

### Required
- [ ] **Git tags** - Ability to create and push tags to the repository
- [ ] **GitHub repository** - With Actions enabled
- [ ] **Version updated** - Update version in `src-tauri/tauri.conf.json` and `package.json`
- [ ] **CHANGELOG updated** - Document all changes in `CHANGELOG.md`
- [ ] **Tests passing** - All unit, integration, and E2E tests green

### Optional (for Code Signing)
- [ ] **Apple Developer Account** - For macOS code signing and notarization
- [ ] **Windows Code Signing Certificate** - For Windows Authenticode signing
- [ ] **GitHub Secrets configured** - See [Code Signing Setup](#code-signing-setup) below

---

## 🔄 Release Process

### 1. Prepare the Release

#### Update Version Numbers

```bash
# Update version in package.json
npm version <major|minor|patch> --no-git-tag-version

# Manually update version in src-tauri/tauri.conf.json
# Line 3: "version": "X.Y.Z"
```

#### Update CHANGELOG.md

Add a new section for the release:

```markdown
## [X.Y.Z] - 2025-01-XX

### Added
- New feature descriptions

### Changed
- Modifications to existing features

### Fixed
- Bug fixes

### Security
- Security improvements
```

#### Commit Version Changes

```bash
git add package.json src-tauri/tauri.conf.json CHANGELOG.md
git commit -m "chore: Bump version to X.Y.Z"
git push origin main
```

### 2. Create and Push Git Tag

```bash
# Create an annotated tag
git tag -a v1.0.0 -m "Release v1.0.0: <brief description>"

# Push the tag to GitHub (this triggers the release workflow)
git push origin v1.0.0
```

### 3. Monitor GitHub Actions

1. Go to your repository on GitHub
2. Click on **Actions** tab
3. Watch the **Release** workflow run
4. The workflow will:
   - Build for macOS (Apple Silicon)
   - Build for macOS (Intel)
   - Build for Windows (x86_64)
   - Create artifacts for each platform
   - Generate a draft GitHub Release

### 4. Review and Publish Release

1. Go to **Releases** page on GitHub
2. Find your draft release (created by the workflow)
3. Review the generated release notes
4. Test download links (artifacts should be attached)
5. Edit release notes if needed
6. Click **Publish release**

---

## 📦 Build Artifacts

The GitHub Actions workflow produces the following artifacts:

### macOS (Apple Silicon)
- `Garden-of-Eden-*-aarch64-apple-darwin.dmg` - DMG installer for M1/M2/M3/M4 Macs
- `Garden-of-Eden-*-aarch64-apple-darwin.app.tar.gz` - App bundle (for manual installation)

### macOS (Intel)
- `Garden-of-Eden-*-x86_64-apple-darwin.dmg` - DMG installer for Intel Macs
- `Garden-of-Eden-*-x86_64-apple-darwin.app.tar.gz` - App bundle (for manual installation)

### Windows
- `Garden-of-Eden-*-setup.exe` - NSIS installer (recommended for most users)
- `Garden-of-Eden-*.msi` - MSI installer (for enterprise/group policy deployment)

---

## 🔐 Code Signing Setup

Code signing is **optional** but highly recommended for production releases to avoid security warnings.

### macOS Code Signing

#### Required Certificates
1. **Developer ID Application Certificate** - For code signing
2. **Developer ID Installer Certificate** - For notarization

#### Setup Steps

1. **Export your certificates as .p12 files** from Keychain Access
2. **Encode certificates to base64**:
   ```bash
   base64 -i Developer_ID_Application.p12 | pbcopy
   ```
3. **Add GitHub Secrets** (Settings → Secrets → Actions):
   - `APPLE_CERTIFICATE` - Base64-encoded certificate
   - `APPLE_CERTIFICATE_PASSWORD` - Certificate password
   - `APPLE_SIGNING_IDENTITY` - Your Developer ID (e.g., "Developer ID Application: Your Name (TEAM_ID)")
   - `APPLE_ID` - Your Apple ID email
   - `APPLE_PASSWORD` - App-specific password (generate at appleid.apple.com)
   - `APPLE_TEAM_ID` - Your Team ID (10-character code)

### Windows Code Signing

#### Required Certificate
- **Code Signing Certificate** - From a trusted CA (DigiCert, GlobalSign, etc.)

#### Setup Steps

1. **Export certificate as .pfx/.p12 file**
2. **Encode certificate to base64**:
   ```powershell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("certificate.pfx")) | clip
   ```
3. **Add GitHub Secrets**:
   - `WINDOWS_CERTIFICATE` - Base64-encoded certificate
   - `WINDOWS_CERTIFICATE_PASSWORD` - Certificate password

### Tauri Update Signing (Optional)

For secure auto-updates:

1. **Generate Tauri signing keys**:
   ```bash
   npm run tauri signer generate -- -w ~/.tauri/myapp.key
   ```
2. **Add GitHub Secrets**:
   - `TAURI_PRIVATE_KEY` - Content of the private key file
   - `TAURI_KEY_PASSWORD` - Password used during key generation

---

## 🛠️ Manual Local Build (Testing)

To test the build process locally before creating a release:

### macOS

```bash
# Install dependencies
npm ci

# Build for current architecture
npm run tauri build

# Build for specific target
npm run tauri build -- --target aarch64-apple-darwin
npm run tauri build -- --target x86_64-apple-darwin

# Artifacts will be in:
# src-tauri/target/release/bundle/dmg/
# src-tauri/target/release/bundle/macos/
```

### Windows

```powershell
# Install dependencies
npm ci

# Build for Windows
npm run tauri build

# Artifacts will be in:
# src-tauri\target\release\bundle\msi\
# src-tauri\target\release\bundle\nsis\
```

---

## 🐛 Troubleshooting

### Build Fails on GitHub Actions

**Issue**: Rust build errors or dependency issues

**Solution**:
1. Check the Actions logs for specific error messages
2. Ensure `src-tauri/Cargo.lock` is committed to the repository
3. Verify `src-tauri/tauri.conf.json` is valid JSON
4. Test the build locally first

### macOS Code Signing Fails

**Issue**: `errSecInternalComponent` or notarization errors

**Solution**:
1. Verify your Apple Developer account is active
2. Ensure certificates are not expired
3. Check that `APPLE_SIGNING_IDENTITY` exactly matches your certificate name
4. Verify App-specific password is correct (not your Apple ID password)

### Windows SmartScreen Warning

**Issue**: Users see "Windows protected your PC" warning

**Solution**:
- This is expected for unsigned binaries
- Users can click "More info" → "Run anyway"
- To remove the warning, purchase a code signing certificate from a trusted CA

### Build Artifacts Not Found

**Issue**: `if-no-files-found: error` in GitHub Actions

**Solution**:
1. Check the build output paths in `.github/workflows/release.yml`
2. Tauri bundle paths changed? Update the workflow file
3. Ensure the build actually succeeded before artifact upload

---

## 📊 Release Checklist

Use this checklist before creating a release:

### Pre-Release
- [ ] All tests passing (`npm test`)
- [ ] Version bumped in `package.json` and `src-tauri/tauri.conf.json`
- [ ] CHANGELOG.md updated with all changes
- [ ] README.md updated if needed
- [ ] No uncommitted changes (`git status` clean)
- [ ] Main branch is up to date (`git pull origin main`)

### Release
- [ ] Git tag created with semantic version (`v1.0.0`)
- [ ] Tag pushed to GitHub (`git push origin v1.0.0`)
- [ ] GitHub Actions workflow triggered and successful
- [ ] All build artifacts generated (3 platforms)

### Post-Release
- [ ] Draft release reviewed on GitHub
- [ ] Release notes accurate and complete
- [ ] Download links tested
- [ ] Release published (not draft anymore)
- [ ] Announcement posted (optional: Discord, Reddit, Twitter)
- [ ] Issues labeled with milestone closed

---

## 🔄 Hotfix Release Process

For urgent bug fixes:

```bash
# 1. Create hotfix branch from the release tag
git checkout -b hotfix/1.0.1 v1.0.0

# 2. Fix the bug and commit
git commit -m "fix: Critical bug description"

# 3. Update version to 1.0.1
npm version patch --no-git-tag-version
# Also update src-tauri/tauri.conf.json

# 4. Commit version bump
git commit -am "chore: Bump version to 1.0.1"

# 5. Merge to main
git checkout main
git merge --no-ff hotfix/1.0.1

# 6. Create and push tag
git tag -a v1.0.1 -m "Hotfix v1.0.1: <description>"
git push origin main v1.0.1

# 7. Merge back to develop (if using gitflow)
git checkout develop
git merge --no-ff hotfix/1.0.1
git push origin develop

# 8. Delete hotfix branch
git branch -d hotfix/1.0.1
```

---

## 📖 Additional Resources

- [Tauri Build Documentation](https://tauri.app/v1/guides/building/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Apple Notarization Guide](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [Windows Code Signing Guide](https://docs.microsoft.com/en-us/windows-hardware/drivers/dashboard/code-signing-cert-manage)
- [Semantic Versioning](https://semver.org/)

---

## ❓ FAQ

### Q: Do I need code signing certificates?

**A**: No, they're optional. Unsigned builds will work but show security warnings to users. For public releases, code signing is highly recommended.

### Q: Can I test the release workflow without creating a tag?

**A**: Yes! Use the `workflow_dispatch` trigger:
1. Go to Actions → Release workflow
2. Click "Run workflow"
3. Select branch and click "Run workflow"

### Q: How do I delete a failed release?

**A**:
```bash
# Delete remote tag
git push --delete origin v1.0.0

# Delete local tag
git tag -d v1.0.0

# Delete the GitHub release (via web UI)
```

### Q: Can I build for Linux?

**A**: Yes, but it's not included in the current workflow. Add a Linux runner to `.github/workflows/release.yml` and build `.deb` and `.AppImage` bundles.

---

**Last Updated**: 2025-01-16
**Workflow Version**: 1.0.0
**Status**: ✅ Production Ready
