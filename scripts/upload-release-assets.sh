#!/bin/bash

# Upload release assets to GitHub Release
# Usage: ./scripts/upload-release-assets.sh

set -e

VERSION=$(node -p "require('./package.json').version")
TAG="v${VERSION}"
REPO="wannahappyaroundme/Garden_of_Eden_V3"

echo "📦 Uploading release assets for ${TAG}..."

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ Error: GitHub CLI (gh) is not installed"
    exit 1
fi

# Function to upload file if it exists
upload_if_exists() {
    local file=$1
    local label=$2

    if [ -f "$file" ]; then
        echo "⬆️  Uploading: $(basename "$file")"
        gh release upload "${TAG}" "$file" --repo "${REPO}" --clobber
        echo "   ✓ Uploaded with label: $label"
    else
        echo "⚠️  Not found: $file"
    fi
}

# macOS DMG
echo ""
echo "🍎 macOS Artifacts:"
MACOS_DMG=$(find src-tauri/target/universal-apple-darwin/release/bundle/dmg -name "*.dmg" 2>/dev/null | head -1)
if [ -n "$MACOS_DMG" ]; then
    upload_if_exists "$MACOS_DMG" "Garden of Eden V3 - macOS (Universal)"
fi

# Windows NSIS
echo ""
echo "🪟 Windows Artifacts:"
WINDOWS_NSIS=$(find src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis -name "*-setup.exe" 2>/dev/null | head -1)
if [ -n "$WINDOWS_NSIS" ]; then
    upload_if_exists "$WINDOWS_NSIS" "Garden of Eden V3 - Windows (NSIS Installer)"
fi

# Windows MSI
WINDOWS_MSI=$(find src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi -name "*.msi" 2>/dev/null | head -1)
if [ -n "$WINDOWS_MSI" ]; then
    upload_if_exists "$WINDOWS_MSI" "Garden of Eden V3 - Windows (MSI Installer)"
fi

# Update manifest
echo ""
echo "📋 Update Manifest:"
upload_if_exists "latest.json" "Tauri Updater Manifest"

# Checksums
echo ""
echo "🔐 Checksums:"
if [ -f "SHA256SUMS.txt" ]; then
    upload_if_exists "SHA256SUMS.txt" "SHA256 Checksums"
else
    echo "⚠️  SHA256SUMS.txt not found - generating..."
    ./scripts/generate-checksums.sh
    upload_if_exists "SHA256SUMS.txt" "SHA256 Checksums"
fi

echo ""
echo "✅ All assets uploaded successfully!"
echo ""
echo "🎯 Next steps:"
echo "   1. Review the release at: https://github.com/${REPO}/releases/tag/${TAG}"
echo "   2. Publish the release: gh release edit ${TAG} --repo ${REPO} --draft=false"
echo ""
