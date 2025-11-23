# Crash Reporting Guide (v3.4.0)

**Last Updated**: 2025-01-18
**Status**: ✅ Production Ready

---

## Overview

Garden of Eden V3 features a **privacy-first crash reporting system** that captures crashes with detailed backtraces while respecting user privacy:

- 🔒 **Local-first**: All crashes saved locally by default
- 🎯 **Opt-in Cloud Reporting**: Sentry integration (optional)
- 📝 **Full Backtraces**: Captured automatically with panic handler
- 🗑️ **Auto-cleanup**: Old crash reports deleted after retention period
- 🔍 **User Access**: View and export crash logs in Settings
- 🛡️ **Data Sanitization**: Sensitive data (paths, tokens) automatically redacted

---

## Architecture

### Crash Flow

```
┌──────────────────┐
│  App Panics!     │
└──────────────────┘
         ↓
┌──────────────────┐
│  Panic Handler   │ ← Installed at startup
│  - Capture panic │
│  - Get backtrace │
│  - Extract info  │
└──────────────────┘
         ↓
┌──────────────────┐
│  Sanitize Data   │ ← Remove sensitive info
│  - Redact paths  │
│  - Redact tokens │
│  - Redact PIcontinuationI     │
└──────────────────┘
         ↓
┌──────────────────┐
│  Save Locally    │ ← Always enabled
│  ~/Library/.../  │
│  crashes/        │
│  crash_*.json    │
└──────────────────┘
         ↓
┌──────────────────┐
│  Send to Sentry? │ ← Opt-in only
│  (If enabled)    │
└──────────────────┘
```

---

## Configuration

### Crash Log Directory

**macOS**: `~/Library/Application Support/garden-of-eden-v3/crashes/`
**Windows**: `%APPDATA%\garden-of-eden-v3\crashes\`

### Crash Report Format

```json
{
  "timestamp": 1705582800,
  "error_message": "thread 'main' panicked at 'index out of bounds'",
  "error_type": "Panic",
  "stack_trace": "   0: std::panicking::begin_panic\n   1: app::process\n   2: app::main",
  "app_version": "3.4.0",
  "os_version": "macos",
  "context": "services/ollama.rs:425:18"
}
```

---

## Usage

### For Users

#### Viewing Crash Reports

1. Open **Settings** → **Advanced** → **Crash Reports**
2. See list of all crashes (newest first)
3. Click crash to view details:
   - Timestamp
   - Error message
   - Stack trace
   - App version
   - Location in code

#### Exporting Crash Logs

1. Open **Crash Reports** panel
2. Click **"Export All"**
3. Choose format: JSON or Text
4. Save to file

#### Enabling Cloud Reporting (Sentry)

1. Open **Settings** → **Privacy** → **Crash Reporting**
2. Toggle **"Send crash reports"**
3. (Optional) Toggle **"Include diagnostic data"**
4. Crashes will now be sent to Sentry (after sanitization)

#### Auto-cleanup

- Crashes older than **30 days** are automatically deleted
- Change retention period in Settings
- Manual cleanup: **Settings** → **Advanced** → **Clear Old Crashes**

---

### For Developers

#### Testing Crash Reporting

**Option 1: Intentional Panic**
```rust
// In any Rust service
panic!("Test crash for debugging");
```

**Option 2: Via IPC Command**
```typescript
// In frontend
await invoke('crash_reporter_test');
```

**Option 3: Trigger via UI**
```
Settings → Advanced → Developer Tools → Test Crash Reporter
```

#### Viewing Crash Logs

```bash
# macOS
cat ~/Library/Application\ Support/garden-of-eden-v3/crashes/crash_*.json | jq

# Windows
type %APPDATA%\garden-of-eden-v3\crashes\crash_*.json
```

#### Analyzing Crash Reports

```typescript
// Get all local crash reports
const reports = await invoke<CrashReport[]>('crash_reporter_get_local_reports');

console.log(`Total crashes: ${reports.length}`);
reports.forEach(report => {
  console.log(`[${new Date(report.timestamp * 1000).toISOString()}] ${report.error_type}: ${report.error_message}`);
  console.log(`  Location: ${report.context}`);
  console.log(`  Version: ${report.app_version}`);
});
```

---

## API Reference

### Backend (Rust)

#### Panic Handler Setup

```rust
use crate::services::crash_reporter::CrashReporterService;
use std::sync::{Arc, Mutex};

// Initialize service
let crash_log_dir = app_data_dir.join("crashes");
let service = CrashReporterService::new(crash_log_dir);
let service_arc = Arc::new(Mutex::new(service));

// Install panic handler (call early in main())
CrashReporterService::setup_panic_handler(Arc::clone(&service_arc));
```

#### Manual Error Reporting

```rust
// Report error manually
crash_reporter.report_error(
    "Failed to connect to Ollama",
    Some("services/ollama.rs:connect()")
)?;

// Create crash report
let report = CrashReporterService::create_crash_report(
    "Division by zero",
    "RuntimeError",
    Some(backtrace_string),
    Some("calculators/math.rs:42")
);

// Save to file
crash_reporter.save_crash_report_to_file(&report)?;
```

#### IPC Commands

```rust
// Get all local crash reports
#[tauri::command]
pub async fn crash_reporter_get_local_reports(
    state: State<'_, CrashReporterState>,
) -> Result<Vec<CrashReport>, String>

// Cleanup old reports
#[tauri::command]
pub async fn crash_reporter_cleanup_old_reports(
    state: State<'_, CrashReporterState>,
    retention_days: i64,
) -> Result<usize, String>

// Enable/disable crash reporting
#[tauri::command]
pub async fn crash_reporter_enable(state: State<'_, CrashReporterState>) -> Result<(), String>
#[tauri::command]
pub async fn crash_reporter_disable(state: State<'_, CrashReporterState>) -> Result<(), String>

// Get settings
#[tauri::command]
pub async fn crash_reporter_get_settings(
    state: State<'_, CrashReporterState>,
) -> Result<CrashReportingSettings, String>
```

### Frontend (TypeScript)

#### React Hook Example

```tsx
import { invoke } from '@tauri-apps/api/core';

function CrashReportsPage() {
  const [reports, setReports] = useState<CrashReport[]>([]);

  useEffect(() => {
    loadCrashReports();
  }, []);

  const loadCrashReports = async () => {
    const data = await invoke<CrashReport[]>('crash_reporter_get_local_reports');
    setReports(data);
  };

  const cleanupOldReports = async () => {
    const deleted = await invoke<number>('crash_reporter_cleanup_old_reports', {
      retention_days: 30
    });
    console.log(`Deleted ${deleted} old crash reports`);
    await loadCrashReports();
  };

  return (
    <div>
      <h2>Crash Reports ({reports.length})</h2>
      <button onClick={cleanupOldReports}>Clean Up Old Reports</button>
      {reports.map(report => (
        <CrashReportCard key={report.timestamp} report={report} />
      ))}
    </div>
  );
}
```

---

## Data Sanitization

### Automatic Redaction

The crash reporter automatically sanitizes sensitive data:

#### File Paths

```
Before: /Users/john/secret/api_keys/config.json
After:  $HOME/secret/api_keys/config.json
```

#### User Names

```
Before: User 'john_doe' failed to authenticate
After:  User '$USER' failed to authenticate
```

#### API Keys / Tokens

```
Before: API key: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
After:  API key: [REDACTED]
```

Pattern: Any hex string longer than 32 characters is redacted.

#### Custom Sanitization

```rust
// Add custom sanitization rules
impl CrashReporterService {
    pub fn sanitize_error_message(message: &str) -> String {
        let sanitized = message
            .replace(std::env::var("HOME").unwrap_or_default().as_str(), "$HOME")
            .replace(std::env::var("USER").unwrap_or_default().as_str(), "$USER");

        // Custom: Redact email addresses
        let email_pattern = regex::Regex::new(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b").unwrap();
        email_pattern.replace_all(&sanitized, "[EMAIL_REDACTED]").to_string()
    }
}
```

---

## Integration with Sentry (Optional)

### Setup

```rust
// Initialize Sentry (opt-in only)
let dsn = Some("https://[key]@sentry.io/[project]".to_string());
crash_reporter.initialize(dsn)?;
```

### Captured Data

When Sentry is enabled, the following is sent:
- Sanitized error message
- Sanitized stack trace
- App version
- OS version
- Context (file:line)

**Not sent**:
- User's file paths
- User names
- API keys / tokens
- PII (personally identifiable information)

### Privacy Controls

```typescript
// User can control what's sent
await invoke('crash_reporter_update_settings', {
  settings: {
    enabled: true, // Send to Sentry
    send_diagnostics: false, // Don't send system info
    send_performance_data: false // Don't send performance metrics
  }
});
```

---

## Troubleshooting

### Panic Handler Not Capturing Crashes

**Symptoms**: App crashes but no crash report is saved

**Causes**:
1. Panic handler not installed
2. Crash log directory doesn't exist or is not writable
3. Crash happens before panic handler is set up

**Solutions**:
```rust
// Verify handler is installed (check logs)
// Should see: "✓ Panic handler installed successfully"

// Check crash log directory
let crash_dir = dirs::data_local_dir()
    .unwrap()
    .join("garden-of-eden-v3")
    .join("crashes");
fs::create_dir_all(&crash_dir)?;

// Install panic handler early in main()
fn main() {
    // ... setup logging ...
    CrashReporterService::setup_panic_handler(crash_reporter_arc);
    // ... rest of initialization ...
}
```

---

### Backtrace is Empty

**Symptoms**: Crash report shows `stack_trace: None`

**Cause**: `RUST_BACKTRACE` not set

**Solution**:
```bash
# Development
RUST_BACKTRACE=1 npm run dev

# Production build with backtrace
export RUST_BACKTRACE=1
npm run tauri:build
```

---

### Crash Reports Not Showing in UI

**Symptoms**: Crashes happen but UI shows no reports

**Causes**:
1. IPC command not registered
2. Frontend not calling correct command
3. Wrong crash log directory path

**Solutions**:
```rust
// Verify command is registered (main.rs)
.invoke_handler(tauri::generate_handler![
    commands::crash_reporter::crash_reporter_get_local_reports,
    // ...
])

// Check crash log path
log::info!("Crash log directory: {:?}", crash_log_dir);

// Test IPC command directly
invoke('crash_reporter_get_local_reports')
    .then(console.log)
    .catch(console.error);
```

---

## Best Practices

### For Users

1. **Enable Crash Reporting** if you want to help improve the app
2. **Review crash reports** periodically to check for patterns
3. **Report crashes manually** if you notice frequent issues
4. **Keep crash reports** for at least 7 days before cleanup

### For Developers

1. **Always include context** when manually reporting errors:
   ```rust
   crash_reporter.report_error(
       "Failed to load model",
       Some("services/ollama.rs:load_model():167")
   )?;
   ```

2. **Add panic handlers** in critical paths:
   ```rust
   std::panic::catch_unwind(|| {
       // risky operation
   }).unwrap_or_else(|e| {
       crash_reporter.report_error(&format!("Panic: {:?}", e), Some(context));
   });
   ```

3. **Test crash reporting** after major changes:
   ```bash
   # Trigger intentional crash
   await invoke('crash_reporter_test');

   # Verify crash was captured
   ls ~/Library/Application\ Support/garden-of-eden-v3/crashes/
   ```

4. **Monitor crash rates** in production:
   - Track via Sentry dashboard (if enabled)
   - Set up alerts for crash rate > 1%
   - Investigate crashes within 24 hours

---

## Privacy Guarantee

### What We Collect (Local Only)

- Error message (sanitized)
- Stack trace (sanitized)
- App version
- OS type (e.g., "macos", not full version)
- Crash timestamp
- Code location (file:line)

### What We Never Collect

- User's full name
- File paths
- API keys / passwords
- Email addresses
- IP addresses
- Usage analytics (unless crash reporting is enabled)

### User Control

- **Local storage is always enabled** (required for debugging)
- **Cloud reporting is opt-in only** (disabled by default)
- **User can view all crash data** before sending
- **User can delete crash reports** at any time

---

## Monitoring & Analytics

### Crash Rate Metrics

```typescript
// Calculate crash rate
const totalSessions = await getSessionCount();
const crashCount = reports.length;
const crashRate = (crashCount / totalSessions) * 100;

console.log(`Crash rate: ${crashRate.toFixed(2)}%`);

// Ideal: < 0.1% (1 crash per 1000 sessions)
// Good: < 1%
// Poor: > 5%
```

### Common Crash Patterns

```typescript
// Group crashes by error type
const byType = reports.reduce((acc, report) => {
  acc[report.error_type] = (acc[report.error_type] || 0) + 1;
  return acc;
}, {});

console.log('Crashes by type:', byType);
// Example: { Panic: 10, RuntimeError: 3, OutOfMemory: 1 }
```

---

## Future Enhancements (v3.5.0+)

- [ ] **Crash Analytics Dashboard** in Settings
- [ ] **Crash Grouping** by similarity (stack trace matching)
- [ ] **Automatic Bug Reports** via GitHub Issues
- [ ] **Crash Replay** (capture last 10 actions before crash)
- [ ] **Minidump Support** (Windows-style crash dumps)
- [ ] **Symbolication** (resolve function names from addresses)

---

## References

- [Rust Panic Handling](https://doc.rust-lang.org/std/panic/)
- [Sentry Rust SDK](https://docs.sentry.io/platforms/rust/)
- [Backtrace Crate](https://docs.rs/backtrace/)
- [Privacy-First Error Reporting](https://sentry.io/privacy/)

---

**Status**: ✅ Production Ready (v3.4.0)
**Maintainer**: Garden of Eden Team
**Last Tested**: 2025-01-18
