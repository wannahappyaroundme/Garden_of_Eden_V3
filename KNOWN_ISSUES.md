# Known Issues - Garden of Eden V3

## 🔴 Critical: Electron Entry Point Runtime Error

**Status**: BLOCKED - Requires Architecture Refactor
**Severity**: Critical
**Affects**: Production builds, direct electron execution
**Discovered**: 2025-01-13

### Problem Description

When running the application via `electron .` or `npx electron .`, the app crashes immediately with:

```
TypeError: Cannot read properties of undefined (reading 'on')
    at Object.<anonymous> (dist/main/main/index.js:XX:XX)
```

### Root Cause

Electron has a documented limitation: when a file is specified as the `main` entry point in `package.json`, importing the `electron` module at the top level returns `undefined`. This is because Electron's module loading system hasn't fully initialized the API when the entry point module is parsed.

### What We Tried (All Failed)

1. **Bootstrap Pattern**: Created a separate bootstrap.ts file to delay initialization
   - Result: FAILED - Dynamic imports still resolve at parse time

2. **Event-Based Initialization**: Used `app.on('ready')` instead of `await app.whenReady()`
   - Result: FAILED - `app` is still undefined at module level

3. **Restored Old Working Version**: Reverted to commit 347da2c
   - Result: FAILED - Even "working" commits have the same issue

4. **Dynamic Imports**: Attempted `await import('electron')` inside async functions
   - Result: FAILED - TypeScript compiles to `require()` which fails

### Why This Wasn't Caught Earlier

- Development mode (`npm run dev:electron`) may have worked differently
- Tests were run before the issue manifested
- The app may have been primarily tested through the dev script, not direct electron execution

### Impact

- ❌ Cannot run app with `electron .` command
- ❌ Cannot create production builds with electron-builder
- ❌ Cannot package app for distribution
- ✅ Development mode through Vite may still work (needs verification)

### Proper Solution (Future Work)

This requires a major architectural refactor. Options:

1. **Migrate to electron-forge**
   - Provides proper build tooling
   - Handles entry point correctly
   - Industry standard solution

2. **Use electron-builder with custom main file**
   - Create a minimal JavaScript (not TypeScript) entry point
   - Entry point should NOT import electron at module level
   - Launch actual app logic after electron APIs are ready

3. **Restructure with separate loader**
   - Create `main.js` that only requires the actual app after `app.ready`
   - Keep TypeScript app logic separate

### Temporary Workaround

None available. Distribution is blocked until this is resolved.

### Related Files

- [src/main/index.ts](src/main/index.ts) - Current entry point with the issue
- [package.json](package.json) - Main entry specification
- [electron-builder.yml](electron-builder.yml) - Build configuration

### References

- [Electron Application Architecture](https://www.electronjs.org/docs/latest/tutorial/application-architecture)
- [Electron Main Process](https://www.electronjs.org/docs/latest/tutorial/process-model#the-main-process)

---

**Next Steps**: This issue is marked as BLOCKED. Phase 7 (Distribution) will continue with other tasks while this architectural issue is researched and planned separately.
