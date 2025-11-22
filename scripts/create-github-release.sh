#!/bin/bash

# Create GitHub Release for Garden of Eden V3
# Usage: ./scripts/create-github-release.sh

set -e

VERSION=$(node -p "require('./package.json').version")
TAG="v${VERSION}"
REPO="wannahappyaroundme/Garden_of_Eden_V3"

echo "🚀 Creating GitHub Release ${TAG}..."

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ Error: GitHub CLI (gh) is not installed"
    echo "   Install it with: brew install gh"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Error: Not authenticated with GitHub"
    echo "   Run: gh auth login"
    exit 1
fi

# Check if release notes exist
if [ ! -f "RELEASE_NOTES_V${VERSION}.md" ]; then
    echo "❌ Error: RELEASE_NOTES_V${VERSION}.md not found"
    exit 1
fi

# Create release
echo "📝 Creating release with notes from RELEASE_NOTES_V${VERSION}.md..."

gh release create "${TAG}" \
    --repo "${REPO}" \
    --title "Garden of Eden V3 - v${VERSION}" \
    --notes-file "RELEASE_NOTES_V${VERSION}.md" \
    --draft

echo "✅ Draft release created successfully!"
echo ""
echo "📦 Next steps:"
echo "   1. Upload build artifacts:"
echo "      - macOS: src-tauri/target/universal-apple-darwin/release/bundle/dmg/*.dmg"
echo "      - Windows: src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/*.exe"
echo "      - Windows MSI: src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi/*.msi"
echo "   2. Upload latest.json (update manifest)"
echo "   3. Upload SHA256SUMS.txt"
echo "   4. Publish the release"
echo ""
echo "Run: ./scripts/upload-release-assets.sh"
