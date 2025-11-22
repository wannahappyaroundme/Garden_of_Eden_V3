#!/usr/bin/env node

/**
 * Generate Tauri updater manifest (latest.json)
 *
 * This script generates the update manifest file that the Tauri updater
 * uses to check for new versions and download updates.
 *
 * Usage:
 *   node scripts/generate-update-manifest.js
 *
 * Requirements:
 *   - Build artifacts must exist in src-tauri/target/
 *   - package.json version must be up to date
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const VERSION = require('../package.json').version;
const GITHUB_REPO = 'wannahappyaroundme/Garden_of_Eden_V3';
const RELEASE_TAG = `v${VERSION}`;

/**
 * Calculate SHA256 checksum of a file
 */
function calculateSha256(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

/**
 * Get file size in bytes
 */
function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size;
}

/**
 * Find build artifacts
 */
function findBuildArtifacts() {
  const targetDir = path.join(__dirname, '../src-tauri/target');
  const artifacts = {
    darwin: null,
    windows: null,
  };

  // macOS Universal DMG
  const darwinPath = path.join(
    targetDir,
    'universal-apple-darwin/release/bundle/dmg'
  );

  if (fs.existsSync(darwinPath)) {
    const dmgFiles = fs.readdirSync(darwinPath).filter(f => f.endsWith('.dmg'));
    if (dmgFiles.length > 0) {
      artifacts.darwin = path.join(darwinPath, dmgFiles[0]);
    }
  }

  // Windows NSIS installer
  const windowsPath = path.join(
    targetDir,
    'x86_64-pc-windows-msvc/release/bundle/nsis'
  );

  if (fs.existsSync(windowsPath)) {
    const exeFiles = fs.readdirSync(windowsPath).filter(f => f.endsWith('.exe'));
    if (exeFiles.length > 0) {
      artifacts.windows = path.join(windowsPath, exeFiles[0]);
    }
  }

  return artifacts;
}

/**
 * Generate update manifest
 */
function generateManifest() {
  console.log('🔍 Finding build artifacts...\n');

  const artifacts = findBuildArtifacts();

  if (!artifacts.darwin && !artifacts.windows) {
    console.error('❌ No build artifacts found!');
    console.error('   Please run: npm run tauri:build:mac or npm run tauri:build:win');
    process.exit(1);
  }

  const platforms = {};

  // macOS platform
  if (artifacts.darwin) {
    console.log('✓ Found macOS artifact:', path.basename(artifacts.darwin));
    const signature = calculateSha256(artifacts.darwin);
    const size = getFileSize(artifacts.darwin);

    platforms['darwin-universal'] = {
      signature,
      url: `https://github.com/${GITHUB_REPO}/releases/download/${RELEASE_TAG}/${path.basename(artifacts.darwin)}`,
    };

    console.log(`  Size: ${(size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  SHA256: ${signature.substring(0, 16)}...`);
  }

  // Windows platform
  if (artifacts.windows) {
    console.log('\n✓ Found Windows artifact:', path.basename(artifacts.windows));
    const signature = calculateSha256(artifacts.windows);
    const size = getFileSize(artifacts.windows);

    platforms['windows-x86_64'] = {
      signature,
      url: `https://github.com/${GITHUB_REPO}/releases/download/${RELEASE_TAG}/${path.basename(artifacts.windows)}`,
    };

    console.log(`  Size: ${(size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  SHA256: ${signature.substring(0, 16)}...`);
  }

  const manifest = {
    version: VERSION,
    notes: `See release notes: https://github.com/${GITHUB_REPO}/releases/tag/${RELEASE_TAG}`,
    pub_date: new Date().toISOString(),
    platforms,
  };

  // Write manifest
  const manifestPath = path.join(__dirname, '../latest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log('\n✅ Update manifest generated successfully!');
  console.log(`   Output: ${manifestPath}`);
  console.log(`\n📋 Manifest contents:\n`);
  console.log(JSON.stringify(manifest, null, 2));

  return manifest;
}

// Run if called directly
if (require.main === module) {
  try {
    generateManifest();
  } catch (error) {
    console.error('\n❌ Error generating manifest:', error.message);
    process.exit(1);
  }
}

module.exports = { generateManifest };
