#!/bin/bash

# Generate SHA256 checksums for all release artifacts
# Usage: ./scripts/generate-checksums.sh

set -e

VERSION=$(node -p "require('./package.json').version")

echo "🔐 Generating SHA256 checksums for v${VERSION}..."

# Create checksums file
CHECKSUMS_FILE="SHA256SUMS.txt"
> "$CHECKSUMS_FILE"

echo "Garden of Eden V3 - v${VERSION}" >> "$CHECKSUMS_FILE"
echo "SHA256 Checksums" >> "$CHECKSUMS_FILE"
echo "Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")" >> "$CHECKSUMS_FILE"
echo "" >> "$CHECKSUMS_FILE"

# Function to add checksum
add_checksum() {
    local file=$1
    if [ -f "$file" ]; then
        echo "✓ $(basename "$file")"
        shasum -a 256 "$file" | awk '{print $1 "  " $2}' >> "$CHECKSUMS_FILE"
    fi
}

# macOS DMG
echo ""
echo "🍎 macOS:"
MACOS_DMG=$(find src-tauri/target/universal-apple-darwin/release/bundle/dmg -name "*.dmg" 2>/dev/null | head -1)
add_checksum "$MACOS_DMG"

# Windows NSIS
echo ""
echo "🪟 Windows:"
WINDOWS_NSIS=$(find src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis -name "*-setup.exe" 2>/dev/null | head -1)
add_checksum "$WINDOWS_NSIS"

# Windows MSI
WINDOWS_MSI=$(find src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi -name "*.msi" 2>/dev/null | head -1)
add_checksum "$WINDOWS_MSI"

# Update manifest
echo ""
echo "📋 Manifest:"
add_checksum "latest.json"

echo ""
echo "✅ Checksums generated: $CHECKSUMS_FILE"
echo ""
cat "$CHECKSUMS_FILE"
