#!/usr/bin/env node

/**
 * Icon Generation Script
 * Generates app icons for macOS, Windows, and Linux
 *
 * Usage: node scripts/generate-icons.js
 *
 * Requirements:
 * - A source icon file at resources/icons/icon.png (1024x1024 recommended)
 * - ImageMagick or sharp for image conversion
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const ICONS_DIR = path.join(__dirname, '..', 'resources', 'icons');
const SOURCE_ICON = path.join(ICONS_DIR, 'icon-source.png');

// Icon sizes needed
const ICON_SIZES = {
  macOS: [16, 32, 64, 128, 256, 512, 1024],
  windows: [16, 24, 32, 48, 64, 128, 256],
  linux: [16, 32, 48, 64, 128, 256, 512],
};

/**
 * Check if ImageMagick is installed
 */
async function checkImageMagick() {
  try {
    await execAsync('convert --version');
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if source icon exists
 */
function checkSourceIcon() {
  if (!fs.existsSync(SOURCE_ICON)) {
    console.error('❌ Source icon not found at:', SOURCE_ICON);
    console.error('\nPlease create a 1024x1024 PNG icon at:');
    console.error('  resources/icons/icon-source.png');
    console.error('\nRecommended design:');
    console.error('  - Green/nature theme (#10B981)');
    console.error('  - Simple, recognizable shape');
    console.error('  - Works well at small sizes');
    console.error('  - No text (use symbols/shapes)');
    return false;
  }
  return true;
}

/**
 * Generate PNG icons at different sizes
 */
async function generatePNGIcons(sizes, outputDir) {
  console.log(`\n📦 Generating PNG icons for ${outputDir}...`);

  const pngDir = path.join(ICONS_DIR, outputDir);
  if (!fs.existsSync(pngDir)) {
    fs.mkdirSync(pngDir, { recursive: true });
  }

  for (const size of sizes) {
    const outputPath = path.join(pngDir, `icon-${size}x${size}.png`);
    console.log(`  Creating ${size}x${size}...`);

    try {
      await execAsync(
        `convert "${SOURCE_ICON}" -resize ${size}x${size} "${outputPath}"`
      );
    } catch (error) {
      console.error(`  ❌ Failed to create ${size}x${size}:`, error.message);
    }
  }

  console.log(`✅ PNG icons generated in ${pngDir}`);
}

/**
 * Generate macOS .icns file
 */
async function generateMacOSIcon() {
  console.log('\n🍎 Generating macOS .icns icon...');

  const icnsPath = path.join(ICONS_DIR, 'icon.icns');
  const iconsetDir = path.join(ICONS_DIR, 'icon.iconset');

  // Create iconset directory
  if (!fs.existsSync(iconsetDir)) {
    fs.mkdirSync(iconsetDir, { recursive: true });
  }

  // Generate all required sizes for .icns
  const sizes = [
    { size: 16, scale: 1 },
    { size: 16, scale: 2 },
    { size: 32, scale: 1 },
    { size: 32, scale: 2 },
    { size: 128, scale: 1 },
    { size: 128, scale: 2 },
    { size: 256, scale: 1 },
    { size: 256, scale: 2 },
    { size: 512, scale: 1 },
    { size: 512, scale: 2 },
  ];

  for (const { size, scale } of sizes) {
    const actualSize = size * scale;
    const filename = scale === 1 ? `icon_${size}x${size}.png` : `icon_${size}x${size}@${scale}x.png`;
    const outputPath = path.join(iconsetDir, filename);

    console.log(`  Creating ${filename}...`);
    try {
      await execAsync(
        `convert "${SOURCE_ICON}" -resize ${actualSize}x${actualSize} "${outputPath}"`
      );
    } catch (error) {
      console.error(`  ❌ Failed to create ${filename}:`, error.message);
    }
  }

  // Convert iconset to .icns
  console.log('  Converting to .icns...');
  try {
    await execAsync(`iconutil -c icns "${iconsetDir}" -o "${icnsPath}"`);
    console.log(`✅ macOS icon created: ${icnsPath}`);

    // Clean up iconset directory
    fs.rmSync(iconsetDir, { recursive: true, force: true });
  } catch (error) {
    console.error('  ❌ Failed to create .icns:', error.message);
    console.error('  Note: iconutil is only available on macOS');
  }
}

/**
 * Generate Windows .ico file
 */
async function generateWindowsIcon() {
  console.log('\n🪟 Generating Windows .ico icon...');

  const icoPath = path.join(ICONS_DIR, 'icon.ico');
  const sizes = ICON_SIZES.windows;

  // Generate individual PNG files first
  const tempFiles = [];
  for (const size of sizes) {
    const tempPath = path.join(ICONS_DIR, `temp-${size}.png`);
    tempFiles.push(tempPath);
    console.log(`  Creating ${size}x${size}...`);

    try {
      await execAsync(
        `convert "${SOURCE_ICON}" -resize ${size}x${size} "${tempPath}"`
      );
    } catch (error) {
      console.error(`  ❌ Failed to create ${size}x${size}:`, error.message);
    }
  }

  // Combine into .ico
  console.log('  Combining into .ico...');
  try {
    await execAsync(
      `convert ${tempFiles.join(' ')} "${icoPath}"`
    );
    console.log(`✅ Windows icon created: ${icoPath}`);
  } catch (error) {
    console.error('  ❌ Failed to create .ico:', error.message);
  }

  // Clean up temp files
  tempFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });
}

/**
 * Generate Linux icons
 */
async function generateLinuxIcons() {
  await generatePNGIcons(ICON_SIZES.linux, 'linux');
}

/**
 * Create a placeholder icon if source doesn't exist
 */
async function createPlaceholderIcon() {
  console.log('\n🎨 Creating placeholder icon...');

  const placeholderPath = path.join(ICONS_DIR, 'icon-placeholder.png');

  // Create a simple 1024x1024 green circle with "E" text
  const svgContent = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#10B981" rx="230"/>
  <text x="512" y="700" font-family="Arial, sans-serif" font-size="600" font-weight="bold"
        text-anchor="middle" fill="white">E</text>
</svg>
  `.trim();

  const svgPath = path.join(ICONS_DIR, 'temp-icon.svg');
  fs.writeFileSync(svgPath, svgContent);

  try {
    await execAsync(`convert "${svgPath}" "${placeholderPath}"`);
    console.log(`✅ Placeholder icon created: ${placeholderPath}`);
    console.log('\nYou can now use this as your source icon:');
    console.log(`  cp ${placeholderPath} ${SOURCE_ICON}`);
  } catch (error) {
    console.error('❌ Failed to create placeholder:', error.message);
  } finally {
    if (fs.existsSync(svgPath)) {
      fs.unlinkSync(svgPath);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🎨 Garden of Eden V3 - Icon Generator\n');
  console.log('═'.repeat(50));

  // Check for ImageMagick
  const hasImageMagick = await checkImageMagick();
  if (!hasImageMagick) {
    console.error('\n❌ ImageMagick not found!');
    console.error('\nPlease install ImageMagick:');
    console.error('  macOS: brew install imagemagick');
    console.error('  Windows: Download from https://imagemagick.org/');
    console.error('  Linux: sudo apt install imagemagick');
    process.exit(1);
  }

  console.log('✅ ImageMagick detected\n');

  // Create icons directory if it doesn't exist
  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
  }

  // Check for source icon
  const hasSource = checkSourceIcon();

  if (!hasSource) {
    console.log('\n💡 Tip: Run with --placeholder to create a temporary icon:');
    console.log('  node scripts/generate-icons.js --placeholder');

    if (process.argv.includes('--placeholder')) {
      await createPlaceholderIcon();
    }
    return;
  }

  // Generate all icon formats
  try {
    await generatePNGIcons(ICON_SIZES.linux, 'linux');

    if (process.platform === 'darwin') {
      await generateMacOSIcon();
    } else {
      console.log('\n⚠️  Skipping .icns generation (requires macOS)');
    }

    await generateWindowsIcon();

    console.log('\n' + '═'.repeat(50));
    console.log('✅ Icon generation complete!');
    console.log('\nGenerated files:');
    console.log('  • resources/icons/icon.icns (macOS)');
    console.log('  • resources/icons/icon.ico (Windows)');
    console.log('  • resources/icons/linux/*.png (Linux)');
    console.log('\nNext steps:');
    console.log('  1. Review the generated icons');
    console.log('  2. Test the app with new icons: npm run dev');
    console.log('  3. Build the app: npm run build');
  } catch (error) {
    console.error('\n❌ Error during icon generation:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
