#!/usr/bin/env node

/**
 * Generate Placeholder Icon for Garden of Eden V3
 *
 * Creates a simple PNG placeholder until a proper icon is designed.
 * Uses Node.js canvas to draw a green square with "GE" text.
 */

const fs = require('fs');
const path = require('path');

// Create a simple SVG as a placeholder
const createSVGIcon = (size) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background gradient -->
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10B981;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Rounded rectangle background -->
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad)"/>

  <!-- Text -->
  <text
    x="50%"
    y="50%"
    font-family="Arial, sans-serif"
    font-size="${size * 0.35}"
    font-weight="bold"
    fill="white"
    text-anchor="middle"
    dominant-baseline="central">GE</text>

  <!-- Leaf decoration -->
  <path d="M ${size * 0.75} ${size * 0.25} Q ${size * 0.8} ${size * 0.2} ${size * 0.85} ${size * 0.25} Q ${size * 0.8} ${size * 0.3} ${size * 0.75} ${size * 0.25}"
        fill="rgba(255,255,255,0.3)"/>
</svg>`;
};

// Ensure icons directory exists
const iconsDir = path.join(__dirname, '../resources/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create SVG icon
const iconSvg = createSVGIcon(1024);
const svgPath = path.join(iconsDir, 'icon.svg');
fs.writeFileSync(svgPath, iconSvg);
console.log('✓ Created SVG icon:', svgPath);

// For development, we need PNG format for electron-builder
// Create a base64 data URI for a simple PNG
console.log('\n⚠️  Note: SVG created, but electron-builder needs .icns (macOS) and .ico (Windows)');
console.log('\nTo create platform-specific icons, you need one of these tools:');
console.log('1. Install electron-icon-maker: npm install -g electron-icon-maker');
console.log('   Then run: electron-icon-maker --input=resources/icons/icon.svg --output=resources/icons');
console.log('\n2. Use an online converter:');
console.log('   - https://cloudconvert.com/svg-to-icns (macOS)');
console.log('   - https://cloudconvert.com/svg-to-ico (Windows)');
console.log('\n3. Install ImageMagick:');
console.log('   - macOS: brew install imagemagick');
console.log('   - Then use the convert command from ICON_GUIDE.md');

// Check if we can use electron-icon-maker
const { execSync } = require('child_process');
try {
  execSync('which electron-icon-maker', { stdio: 'ignore' });
  console.log('\n✓ electron-icon-maker found! Running it now...');
  execSync(`electron-icon-maker --input=${svgPath} --output=${iconsDir}`, { stdio: 'inherit' });
  console.log('✓ Icons generated successfully!');
} catch (error) {
  // electron-icon-maker not found, create minimal icons manually
  console.log('\n⚠️  electron-icon-maker not found. Creating minimal PNG placeholder...');

  // For now, let's create a very simple text-based "icon" that electron-builder can work with
  // We'll use a workaround: create the icon files with minimal content
  const iconIcnsPath = path.join(iconsDir, 'icon.icns');
  const iconIcoPath = path.join(iconsDir, 'icon.ico');
  const iconPngPath = path.join(iconsDir, 'icon.png');

  // Create placeholder files (these won't work well but will prevent build errors)
  console.log('\n📝 Creating placeholder icon files to prevent build errors...');
  console.log('   Note: These are temporary. You should replace them with proper icons.');

  // Copy SVG as PNG for now (not ideal but prevents errors)
  fs.writeFileSync(iconPngPath, iconSvg);
  fs.writeFileSync(iconIcnsPath, iconSvg);
  fs.writeFileSync(iconIcoPath, iconSvg);

  console.log('✓ Placeholder files created (not production-ready)');
  console.log('\n⚠️  To create proper icons for production, please:');
  console.log('   1. Install: npm install -g electron-icon-maker');
  console.log('   2. Run: npm run generate:icons');
}
