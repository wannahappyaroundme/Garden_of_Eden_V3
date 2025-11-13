# Garden of Eden V3 - Application Icons Guide

## Required Icons

### macOS (.icns)
**File**: `icon.icns`
**Location**: `resources/icons/icon.icns`

The `.icns` file must contain the following sizes:
- 16x16
- 32x32
- 64x64
- 128x128
- 256x256
- 512x512
- 1024x1024 (Retina displays)

### Windows (.ico)
**File**: `icon.ico`
**Location**: `resources/icons/icon.ico`

The `.ico` file must contain the following sizes:
- 16x16
- 32x32
- 48x48
- 64x64
- 128x128
- 256x256

### Linux (.png)
**File**: `icon.png`
**Location**: `resources/icons/icon.png`

A single high-resolution PNG file:
- 512x512 or 1024x1024

## Design Guidelines

### Theme
- **Concept**: Garden of Eden - Nature meets AI/Technology
- **Colors**:
  - Primary: Green (#10B981 - emerald-500)
  - Accent: Purple/Blue (#8B5CF6 - violet-500)
  - Background: Dark green or gradient

### Icon Elements
Consider including:
- 🌿 Nature elements (leaves, trees, garden motifs)
- 🤖 AI/Tech elements (circuit patterns, neural network shapes)
- 💚 Heart or connection symbol (representing companionship)
- ✨ Sparkle/glow effect (representing intelligence)

### Style
- **Modern, minimal, flat design** (works well at small sizes)
- **High contrast** for visibility on light and dark backgrounds
- **Rounded corners** (friendly, approachable feel)
- **Avoid fine details** that disappear at 16x16

## How to Create

### Option 1: Using Design Tools
1. Create a 1024x1024 PNG in Figma/Sketch/Illustrator
2. Use [iConvert Icons](https://iconverticons.com/online/) to convert PNG → ICNS/ICO
3. Or use ImageMagick:
   ```bash
   # macOS ICNS
   iconutil -c icns icon.iconset

   # Windows ICO
   convert icon-256.png icon-128.png icon-64.png icon-32.png icon-16.png icon.ico
   ```

### Option 2: Using Electron-Icon Tool
```bash
npm install -g electron-icon-maker
electron-icon-maker --input=icon-1024.png --output=resources/icons
```

### Option 3: Online Tools
- [IconKitchen](https://icon.kitchen/) - Free icon generator
- [AppIcon](https://www.appicon.co/) - macOS/iOS icon generator
- [RealFaviconGenerator](https://realfavicongenerator.net/) - Multi-platform

## Temporary Placeholder

Until custom icons are created, you can use:
```bash
# Generate a simple colored square as placeholder
convert -size 1024x1024 xc:#10B981 -fill white -font Arial -pointsize 200 \
  -gravity center -annotate +0+0 "GE" placeholder.png
```

## Testing Icons

After creating icons, test them:
```bash
# Build the app with icons
npm run build:electron

# Check the .app bundle (macOS)
open release/mac/Garden\ of\ Eden\ V3.app

# Check installer (Windows)
release/Garden\ of\ Eden\ V3\ Setup.exe
```

## Current Status
- [ ] icon.icns (macOS)
- [ ] icon.ico (Windows)
- [ ] icon.png (Linux)

**Priority**: High - Required for production builds and App Store submission

---

**Last Updated**: 2025-01-13
