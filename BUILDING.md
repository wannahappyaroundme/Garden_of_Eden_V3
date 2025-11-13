# Building Garden of Eden V3

## Prerequisites

- Node.js 20+ (recommended: use Homebrew on macOS)
- Rust toolchain (for native modules)
- Python 3.8+ (for AI model dependencies)
- macOS: Xcode Command Line Tools
- Windows: Visual Studio Build Tools

## Development

```bash
# Install dependencies
npm install

# Start development mode (hot reload)
npm run dev:electron

# Type checking
npm run type-check

# Run tests
npm test
```

## Building for Distribution

### macOS (.dmg and .zip)

The project is configured for arm64 (Apple Silicon) builds. To build:

```bash
# Build app
npm run build:electron

# Create installer (requires icon files and optional code signing)
npm run build:mac
```

**Note**: To create signed installers, you need:
1. Apple Developer account ($99/year)
2. Developer ID Application certificate
3. Icon files in `resources/icons/icon.icns`
4. Entitlements file in `resources/entitlements.mac.plist`

For unsigned development builds, set `CSC_IDENTITY_AUTO_DISCOVERY=false`:

```bash
export CSC_IDENTITY_AUTO_DISCOVERY=false
npx electron-builder --mac --arm64 --dir
```

This creates an unpacked `.app` in `release/mac-arm64/`.

### Windows (.exe and portable)

```bash
npm run build:electron
npm run build:win
```

Requires Windows or cross-compilation setup. For signed builds, you need an Authenticode certificate.

## Known Issues

### Electron Import Error

The main process entry point ([src/main/index.ts:17](src/main/index.ts#L17)) has a known runtime issue where `electron` module imports resolve to undefined when the file is used as the entry point. This is documented in the codebase and requires architectural restructuring.

**Workaround**: Use dynamic imports or wait for full implementation of Phase 7 (Distribution).

### Icon Generation

electron-builder requires icon files for full installer builds:
- macOS: `resources/icons/icon.icns` (512x512 ICNS format)
- Windows: `resources/icons/icon.ico` (256x256 ICO format)
- Linux: `resources/icons/icon.png` (512x512 PNG)

You can generate these using:
```bash
# macOS (using electron-icon-builder or manual sips conversion)
npm install -g electron-icon-builder
electron-icon-builder --input=logo.png --output=resources/icons
```

## Installer Configuration

See [electron-builder.yml](electron-builder.yml) for full configuration.

### Key Settings

- **Code Signing**: Disabled by default (`identity: null`)
- **Compression**: Normal (balance between size and speed)
- **ASAR**: Enabled (packages app into single archive)
- **Extra Resources**: AI models (~12GB) are packaged separately

## Testing the Build

After building, test the packaged app:

```bash
# macOS
open release/mac-arm64/Garden\ of\ Eden\ V3.app

# Windows
release\win-unpacked\Garden of Eden V3.exe
```

## Distribution Checklist

Before releasing to users:

- [ ] Update version in `package.json`
- [ ] Create icon files (512x512 base image)
- [ ] Test on clean machine (no dev environment)
- [ ] Verify AI models download correctly
- [ ] Test auto-updater (if configured)
- [ ] Create GitHub release with binaries
- [ ] Update CHANGELOG.md

## File Size

Expected installer sizes:
- macOS .dmg: ~150MB (without models)
- Windows installer: ~120MB (without models)
- AI models (separate download): ~12GB

Users will need to download models separately on first run using the built-in downloader.

## Resources

- [electron-builder docs](https://www.electron.build/)
- [Code Signing Guide](https://www.electron.build/code-signing)
- [Auto Update](https://www.electron.build/auto-update)
