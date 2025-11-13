# 🐛 Debugging Notes - Build Issues & Solutions

이 문서는 Garden of Eden V3 빌드 과정에서 발생한 이슈와 해결 방법을 기록합니다.

---

## 📋 Table of Contents

1. [Native Module Compatibility Issue](#native-module-compatibility-issue)
2. [TypeScript Type Errors](#typescript-type-errors)
3. [Windows Cross-Compilation Limitation](#windows-cross-compilation-limitation)
4. [Solutions Applied](#solutions-applied)

---

## 🔧 Native Module Compatibility Issue

### Problem

**Error Message:**
```
error: no member named 'GetIsolate' in 'v8::Context'
v8::Isolate* isolate = context->GetIsolate();
                       ~~~~~~~~~^
```

### Root Cause

- **better-sqlite3** (version 11.7.0 → 12.4.1) is incompatible with **Electron 39.1.2**
- Electron 39 uses a newer version of V8 engine with breaking API changes
- The V8 API `context->GetIsolate()` was deprecated and removed in V8 version used by Electron 39

### Attempted Solutions

#### ❌ Solution 1: Upgrade better-sqlite3
```bash
npm install better-sqlite3@latest --save
npm rebuild better-sqlite3
```

**Result:** Failed. better-sqlite3 12.4.1 still uses the deprecated V8 API.

#### ✅ Solution 2: Downgrade Electron (SUCCESSFUL)
```bash
npm install electron@28.0.0 --save-dev
npm rebuild better-sqlite3
npm run build:electron
npx electron-builder --mac
```

**Result:** Success! Electron 28.0.0 uses an older V8 version compatible with better-sqlite3.

### Why Electron 28.0.0?

| Version | V8 Engine | better-sqlite3 Compatible? |
|---------|-----------|---------------------------|
| Electron 39.1.2 | V8 13.0+ | ❌ No |
| Electron 28.0.0 | V8 11.8 | ✅ Yes |
| Electron 30.x | V8 12.4 | ⚠️ Untested |

---

## 📝 TypeScript Type Errors

### Problem

11 TypeScript errors across renderer files due to strict type checking.

### Errors Fixed

#### 1. **App.tsx** (Line 20)
**Error:** `'settings' is of type 'unknown'`

**Fix:**
```typescript
// Before
const settings = await window.api.getSettings();

// After
const settings = await window.api.getSettings() as { theme: string };
```

#### 2. **Settings.tsx** (Line 51)
**Error:** `'settings' is of type 'unknown'`

**Fix:**
```typescript
const settings = await window.api.getSettings() as { persona: PersonaSettings; theme: string };
```

#### 3. **Chat.tsx** (Line 93)
**Error:** `'loadedMessages' is of type 'unknown'`

**Fix:**
```typescript
const loadedMessages = await window.api.messageGetByConversation({
  conversationId,
  limit: 100,
}) as any[];
```

---

## 🪟 Windows Cross-Compilation Limitation

### Problem

Cannot build Windows binaries from macOS due to native module dependencies.

**Error:**
```
⨯ cannot build native dependency
  reason=prebuild-install failed with error and build from sources
         not possible because platform or arch not compatible
```

### Solution

**Windows builds MUST be done on a Windows machine:**

```bash
# On Windows 10/11
git clone <repository>
npm install
npm run build:electron
npx electron-builder --win
```

---

## ✅ Solutions Applied

### Summary of Changes

| Issue | Solution | Status |
|-------|----------|--------|
| Electron 39 + better-sqlite3 incompatibility | Downgrade to Electron 28.0.0 | ✅ Fixed |
| TypeScript type errors (11 errors) | Add type assertions | ✅ Fixed |
| Windows cross-compilation | Document limitation, use Windows machine | ⚠️ Manual |

### Build Results

#### macOS ✅
- **DMG**: `Garden of Eden V3-1.0.0-arm64.dmg` (285MB)
- **ZIP**: `Garden of Eden V3-1.0.0-arm64-mac.zip` (276MB)
- **Auto-update**: `latest-mac.yml`
- **Checksums**: SHA256 generated

#### Windows ⏳
- Requires Windows machine for native module compilation
- Build instructions documented in `program/README.md`

---

**Last Updated**: 2025-01-13
**Electron Version**: 28.0.0
**Build Status**: macOS ✅ | Windows ⏳
