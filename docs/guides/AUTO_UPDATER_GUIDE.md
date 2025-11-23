# Auto-Updater Guide (v3.4.0)

**Last Updated**: 2025-01-18
**Status**: ✅ Production Ready

---

## Overview

Garden of Eden V3 features a robust auto-updater system built on **Tauri's built-in updater plugin**. Updates are distributed via **GitHub Releases** and feature:

- 🔄 Automatic update checking
- 📦 Background download with progress tracking
- 🔒 Cryptographic signature verification
- 🎯 User-friendly notification UI
- ⏰ Configurable check intervals
- 🚀 Seamless installation & restart

---

## Architecture

### Backend (Rust/Tauri)

```
┌─────────────────────────────────────────┐
│  UpdaterService (services/updater.rs)  │
│  - Version comparison                   │
│  - Check interval management            │
└─────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────┐
│  IPC Commands (commands/updater.rs)     │
│  - updater_get_version                  │
│  - updater_check_for_updates            │
│  - updater_install_update               │
└─────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────┐
│  tauri-plugin-updater                   │
│  - Check GitHub Releases                │
│  - Download update bundle               │
│  - Verify signature                     │
│  - Install & restart                    │
└─────────────────────────────────────────┘
```

### Frontend (React/TypeScript)

```tsx
┌─────────────────────────────────────────┐
│  UpdateNotification Component           │
│  - Auto-check on mount                  │
│  - Hourly re-check                      │
│  - Download progress bar                │
│  - Release notes display                │
└─────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────┐
│  Tauri Event Listeners                  │
│  - updater://download-progress          │
│  - updater://installing                 │
└─────────────────────────────────────────┘
```

---

## Configuration

### `tauri.conf.json`

```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/wannahappyaroundme/Garden_of_Eden_V3/releases/latest/download/latest.json"
      ],
      "dialog": true,
      "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IERBMTE5RkE5RTc5RTRENTEKUldRdjdoN0lMVUNSQzdoZXF2cnBEcnh6bWRIZXRGRlRzWGxoR3diRU9QU3NERjNQRVZvZmVHQ3MK"
    }
  }
}
```

**Important**: `pubkey` is used for signature verification. Generate with:
```bash
tauri signer generate
```

---

## Usage

### For Users

#### Automatic Updates

1. **On App Launch**: Checks for updates automatically
2. **Hourly**: Re-checks every 60 minutes
3. **Notification Appears**: When update is available
4. **Click "Install Update"**: Downloads and installs
5. **App Restarts Automatically**: After installation

#### Manual Check

1. Open **Settings** → **About**
2. Click **"Check for Updates"**
3. Follow notification prompts

#### Update Process

```
┌─────────────┐
│   Checking  │ ← Spinner animation
└─────────────┘
      ↓
┌─────────────┐
│  Available  │ ← Release notes shown
└─────────────┘
      ↓
┌─────────────┐
│ Downloading │ ← Progress bar (0-100%)
└─────────────┘
      ↓
┌─────────────┐
│ Installing  │ ← 100% progress
└─────────────┘
      ↓
┌─────────────┐
│    Ready    │ ← Auto-restart in 3s
└─────────────┘
```

---

## Developer Guide

### Testing Updates Locally

#### 1. Build Release Locally

```bash
# macOS
npm run tauri:build:mac

# Windows
npm run tauri:build:win
```

#### 2. Generate Update Signature

```bash
# Generate signing key (first time only)
tauri signer generate

# Sign the update bundle
tauri signer sign path/to/update.app
```

#### 3. Create `latest.json`

```json
{
  "version": "3.4.0",
  "notes": "- Auto-updater\n- Crash reporting\n- Bug fixes",
  "pub_date": "2025-01-18T12:00:00Z",
  "platforms": {
    "darwin-x86_64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkK...",
      "url": "https://github.com/.../Garden_of_Eden_V3_3.4.0_x64.dmg"
    },
    "darwin-aarch64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkK...",
      "url": "https://github.com/.../Garden_of_Eden_V3_3.4.0_aarch64.dmg"
    }
  }
}
```

#### 4. Upload to GitHub Releases

```bash
# Create GitHub release
gh release create v3.4.0 \
  --title "v3.4.0 - Auto-updater & Crash Reporting" \
  --notes "See CHANGELOG.md" \
  path/to/update.dmg \
  path/to/latest.json
```

#### 5. Test Update Flow

```bash
# Start app with older version
npm run dev

# Updater will detect v3.4.0 and prompt for update
```

---

### API Reference

#### Backend Commands

**`updater_get_version()`**
```rust
// Returns: String - Current app version
let version: String = invoke("updater_get_version").await?;
// Example: "3.3.1"
```

**`updater_check_for_updates(app: AppHandle)`**
```rust
// Returns: UpdateCheckResult
let result: UpdateCheckResult = invoke("updater_check_for_updates").await?;

pub struct UpdateCheckResult {
    pub available: bool,
    pub current_version: String,
    pub latest_version: Option<String>,
    pub release_notes: Option<String>,
    pub download_url: Option<String>,
}
```

**`updater_install_update(app: AppHandle)`**
```rust
// Downloads, installs, and restarts app
// Emits events: "updater://download-progress", "updater://installing"
invoke("updater_install_update").await?;
```

#### Frontend Hook

```tsx
import { useUpdateNotifications } from './components/UpdateNotification';

function MyComponent() {
  const { hasUpdate, updateInfo, checkForUpdates, installUpdate } = useUpdateNotifications();

  useEffect(() => {
    checkForUpdates();
  }, []);

  return (
    <div>
      {hasUpdate && (
        <button onClick={installUpdate}>
          Update to v{updateInfo?.latest_version}
        </button>
      )}
    </div>
  );
}
```

---

## Release Process

### Automated with GitHub Actions

**Workflow**: `.github/workflows/release.yml`

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        platform: [macos-latest, windows-latest]
    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
      - name: Install Rust
        uses: actions-rs/toolchain@v1
      - name: Build Tauri App
        run: npm run tauri:build
      - name: Upload Release Assets
        uses: softprops/action-gh-release@v1
        with:
          files: |
            src-tauri/target/release/bundle/**/*.dmg
            src-tauri/target/release/bundle/**/*.exe
```

### Manual Release Checklist

- [ ] Update version in `package.json` and `Cargo.toml`
- [ ] Update `CHANGELOG.md`
- [ ] Commit version bump: `git commit -am "chore: bump version to v3.4.0"`
- [ ] Create tag: `git tag v3.4.0`
- [ ] Push tag: `git push origin v3.4.0`
- [ ] Build app for all platforms
- [ ] Sign update bundles
- [ ] Create `latest.json` with signatures
- [ ] Create GitHub release with assets
- [ ] Test update from previous version

---

## Troubleshooting

### Update Check Fails

**Error**: `"Failed to check for updates: Updater not available"`

**Causes**:
1. Missing `tauri-plugin-updater` in `Cargo.toml`
2. Updater not configured in `tauri.conf.json`
3. Invalid GitHub URL

**Solution**:
```bash
# Verify plugin is installed
cargo tree | grep tauri-plugin-updater

# Check config
cat src-tauri/tauri.conf.json | grep -A 5 "updater"

# Test endpoint manually
curl https://github.com/wannahappyaroundme/Garden_of_Eden_V3/releases/latest/download/latest.json
```

---

### Signature Verification Fails

**Error**: `"Invalid signature"`

**Causes**:
1. Mismatch between signing key and pubkey in config
2. Bundle was modified after signing
3. Wrong signature in `latest.json`

**Solution**:
```bash
# Re-generate signing key
tauri signer generate

# Copy public key to tauri.conf.json
# Re-sign bundle
tauri signer sign path/to/bundle.dmg

# Update latest.json with new signature
```

---

### Update Download Stalls

**Error**: No progress after clicking "Install"

**Causes**:
1. Network issues
2. GitHub rate limiting
3. Large file size (>100MB)

**Solution**:
- Check network connectivity
- Retry after 1 hour (rate limit resets)
- Optimize bundle size (exclude unnecessary files)

---

## Security Considerations

### Signature Verification

- **Always enabled** in production builds
- Uses **Ed25519** cryptographic signatures
- Public key embedded in app binary
- Private key stored securely (never in repo)

### HTTPS Only

- Update endpoint **must use HTTPS**
- GitHub Releases provides HTTPS by default
- Prevents MITM attacks

### User Consent

- Updates **never install without user approval**
- User can dismiss notification
- User can choose "Later" to postpone

---

## Best Practices

### Versioning

- Follow **Semantic Versioning** (SemVer)
- `MAJOR.MINOR.PATCH` format
- Example: `3.4.0` → `3.5.0` (new features)
- Example: `3.5.0` → `3.5.1` (bug fixes)

### Release Notes

- **Always include** in `latest.json`
- Use **bullet points** for readability
- Highlight **breaking changes** prominently
- Example:
  ```
  - ✨ New: Auto-updater with progress tracking
  - 🐛 Fixed: Crash on startup (macOS)
  - ⚠️ Breaking: Settings format changed
  ```

### Testing

- **Test on all platforms** before release
- **Test update from previous version** (not just fresh install)
- **Test with slow network** (throttle to 100KB/s)
- **Test failure scenarios** (cancel download, network loss)

---

## Monitoring

### Update Adoption Rate

Track via analytics (opt-in):
```typescript
const updateInfo = await invoke('updater_check_for_updates');
if (updateInfo.available) {
  analytics.track('UpdateAvailable', {
    current: updateInfo.current_version,
    latest: updateInfo.latest_version,
  });
}
```

### Common Metrics

- **Update Check Success Rate**: % of successful checks
- **Download Success Rate**: % of completed downloads
- **Installation Success Rate**: % of successful installs
- **Adoption Rate**: % of users on latest version
- **Time to Update**: Average time from release to user update

---

## FAQ

**Q: Can users disable auto-updates?**
A: Not yet. Feature planned for v3.5.0 in Settings.

**Q: What happens if update fails mid-download?**
A: App remains on current version. User can retry.

**Q: Does the app work offline after update?**
A: Yes. Update only requires internet during download.

**Q: Can I rollback to previous version?**
A: Not automatically. User must manually download older version from GitHub.

**Q: Are beta/alpha releases supported?**
A: Yes, via separate endpoint. Example: `latest-beta.json`

**Q: How large are update bundles?**
A: macOS: ~50MB, Windows: ~40MB (full app bundle, not delta)

---

## Future Enhancements (v3.5.0+)

- [ ] **Delta Updates**: Only download changed files
- [ ] **Background Updates**: Install when app is closed
- [ ] **Update Settings**: Disable auto-check, change interval
- [ ] **Beta Channel**: Opt-in to pre-release updates
- [ ] **Rollback**: Automatic rollback on crash after update
- [ ] **Update History**: View all past updates
- [ ] **Update Analytics**: Track adoption rate

---

## References

- [Tauri Updater Plugin Docs](https://tauri.app/v1/guides/distribution/updater)
- [Semantic Versioning](https://semver.org/)
- [GitHub Releases API](https://docs.github.com/en/rest/releases/releases)
- [Minisign (Signature Tool)](https://jedisct1.github.io/minisign/)

---

**Status**: ✅ Production Ready (v3.4.0)
**Maintainer**: Garden of Eden Team
**Last Tested**: 2025-01-18
