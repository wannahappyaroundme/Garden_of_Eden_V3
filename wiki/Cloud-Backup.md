# Cloud Backup Guide

Complete guide to Google Cloud backup for persona settings.

---

## Overview

Garden of Eden V3 offers **optional Google Drive backup** for your persona settings. This is entirely opt-in and not required for the app to function.

**What's Backed Up**: Only your 10 persona parameter values (formality, verbosity, humor, etc.)

**What's NOT Backed Up**: Conversations, files, screen captures, or any personal data

---

## Why Use Cloud Backup?

### Use Cases

1. **Multi-Device Sync** - Use same persona on multiple Macs
2. **Backup & Restore** - Restore settings after reinstalling
3. **Experimentation** - Try new settings, restore old ones easily
4. **Peace of Mind** - Your preferred settings are safe in the cloud

### Why You Might NOT Use It

- **Maximum Privacy** - Keep everything 100% local
- **Don't Trust Cloud** - Prefer complete offline operation
- **Don't Need It** - Happy with local-only backups

---

## Setting Up Cloud Backup

### Step 1: Enable Google Login

1. Open Garden of Eden V3
2. Click Settings icon (⚙️) → Account
3. Click "Login with Google"
4. Authorize in browser:
   - Grant access to Google Drive
   - Allow file creation
5. You'll be redirected back to the app

### Step 2: Verify Connection

In Settings > Account, you should see:
- ✅ Connected to Google
- Your email address
- "Logout" button

---

## Backing Up Your Persona

### Manual Backup

1. Go to Settings > Persona
2. Adjust your persona settings
3. Click "Save" (saves locally)
4. Click "Backup to Cloud"
5. Wait for confirmation: "Persona backed up to Google Drive!"

### What Gets Uploaded

A JSON file containing:

```json
{
  "persona": {
    "formality": 0.5,
    "verbosity": 0.6,
    "humor": 0.3,
    "emoji_usage": 0.4,
    "proactiveness": 0.5,
    "technical_depth": 0.7,
    "empathy": 0.6,
    "code_examples": 0.8,
    "questioning": 0.5,
    "suggestions": 0.6
  },
  "timestamp": 1705392000000
}
```

**File Size**: < 1KB

**Location**: Google Drive folder: "Garden of Eden Backups" → `eden_backup.json`

---

## Restoring from Cloud

### Step 1: Download Backup

1. Go to Settings > Persona
2. Click "Restore from Cloud"
3. Wait for download
4. Settings are automatically applied

### Step 2: Verify

- Check persona sliders updated
- Click "Preview System Prompt" to see changes
- Test with a new conversation

---

## Managing Backups

### View Backup in Google Drive

1. Go to [Google Drive](https://drive.google.com)
2. Navigate to folder: "Garden of Eden Backups"
3. Find file: `eden_backup.json`
4. You can:
   - Download it
   - View revision history
   - Delete it
   - Share with other devices

### Last Backup Time

In Settings > Persona, you'll see:
```
Last backup: 2025-01-16 14:30:15
```

This shows when you last uploaded to cloud.

### Multiple Backups

Currently, only **one backup** is supported. Each upload overwrites the previous backup.

**Workaround for Multiple Personas**:
1. Backup current persona
2. Download `eden_backup.json` from Google Drive
3. Rename to `persona_professional.json` (for example)
4. Create new persona
5. Upload (overwrites `eden_backup.json`)
6. Repeat for each persona variant

---

## Security & Privacy

### What Google Can See

When you enable cloud backup, Google can see:
- Your persona settings (10 numbers between 0.0 and 1.0)
- Timestamp of when backup was created
- **Nothing else**

### What Google CANNOT See

- ❌ Your conversations
- ❌ Your files or screen captures
- ❌ Your local database
- ❌ Any messages you send to the AI
- ❌ Any AI responses

### Data Protection

**In Transit**:
- HTTPS encryption during upload/download
- OAuth 2.0 authentication tokens

**At Rest**:
- Stored in your Google Drive (only you have access)
- Google's standard Drive encryption

**Access Control**:
- Only you can access your backup
- Garden of Eden V3 cannot access other users' backups
- OAuth tokens expire after 1 hour (re-login required)

---

## Troubleshooting

### "Failed to authenticate with Google"

**Cause**: OAuth flow interrupted or failed

**Solution**:
1. Ensure you're connected to internet
2. Check browser didn't block popup
3. Try again: Settings > Account > Login with Google
4. Grant all requested permissions

### "Failed to backup to cloud"

**Cause 1**: No internet connection
```bash
# Test internet
ping google.com
```

**Cause 2**: Google Drive quota full
- Check storage at [Google Drive](https://drive.google.com)
- Backup is <1KB, so this is unlikely

**Cause 3**: OAuth token expired
- Solution: Logout and login again

### "No cloud backup found"

**Cause**: You haven't created a backup yet

**Solution**:
1. Go to Settings > Persona
2. Click "Backup to Cloud" first
3. Then "Restore from Cloud" will work

### "Invalid token"

**Cause**: OAuth token expired (1 hour lifetime)

**Solution**:
1. Settings > Account > Logout
2. Login with Google again
3. Try backup/restore again

### Can't find backup in Google Drive

**Location**: Check folder "Garden of Eden Backups" (not root)

**File name**: Exactly `eden_backup.json`

**Visibility**: May be hidden by default, enable "Show hidden files"

---

## Advanced

### Manual Backup Workflow

For maximum control:

1. **Export from App**:
   - Settings > Persona > Backup to Cloud

2. **Download from Google Drive**:
   - Navigate to "Garden of Eden Backups"
   - Download `eden_backup.json`
   - Rename to something meaningful: `persona_2025-01-16.json`

3. **Store Multiple Versions**:
   - Keep a folder of persona backups
   - Restore by manually uploading to Google Drive

4. **Restore Specific Version**:
   - Upload `persona_2025-01-16.json` to Drive
   - Rename to `eden_backup.json`
   - Settings > Persona > Restore from Cloud

### Backup Across Devices

**Device 1 (Setup)**:
1. Configure persona
2. Backup to cloud

**Device 2 (Restore)**:
1. Install Garden of Eden V3
2. Login with same Google account
3. Settings > Persona > Restore from Cloud
4. Your settings are now synced!

### Scripting Backups

For developers, you can script backups:

```bash
# Get OAuth token (manual process)
# Then use Google Drive API

curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://www.googleapis.com/drive/v3/files/FILE_ID?alt=media"
```

See [Google Drive API docs](https://developers.google.com/drive/api/v3/about-sdk) for details.

---

## Comparison with Local Storage

| Feature | Local Only | Cloud Backup |
|---------|-----------|--------------|
| Privacy | 100% local | Settings in Google Drive |
| Internet Required | No | Yes (for backup/restore only) |
| Multi-Device | Manual export/import | Automatic sync |
| Disaster Recovery | Lost if disk fails | Safe in cloud |
| Speed | Instant | 1-2 seconds for upload |
| Setup | None | Google login required |

---

## Disabling Cloud Backup

### Remove Google Connection

1. Settings > Account
2. Click "Logout"
3. Your persona settings remain saved locally
4. Cloud backup is disabled

### Delete Cloud Backup

1. Go to [Google Drive](https://drive.google.com)
2. Find folder "Garden of Eden Backups"
3. Right-click → Delete
4. Empty trash to permanently remove

### Revoke App Access

1. Go to [Google Account > Security](https://myaccount.google.com/security)
2. Click "Third-party apps with account access"
3. Find "Garden of Eden V3"
4. Click "Remove Access"

---

## Best Practices

1. **Backup After Finding Good Settings** - Don't backup constantly
2. **Test Restore Occasionally** - Ensure backup works
3. **Manual Downloads for Safety** - Keep local copies of `eden_backup.json`
4. **Don't Share Backup Files** - They contain your preferences
5. **Logout When Selling/Donating Mac** - Remove Google connection

---

## FAQ

**Q: Is cloud backup required?**
A: No! It's completely optional.

**Q: Can others see my backup?**
A: No, it's in your private Google Drive.

**Q: What if I lose my Google password?**
A: Your persona is still saved locally in the app.

**Q: Can I backup to Dropbox/iCloud instead?**
A: Not currently. Only Google Drive is supported.

**Q: How often should I backup?**
A: Whenever you change persona settings that you want to preserve.

**Q: Does this use a lot of Google Drive storage?**
A: No, the file is <1KB (smaller than an email).

---

**Related Pages**:
- [Persona Customization](Persona-Customization)
- [User Guide](../docs/USER_GUIDE.md)
- [Privacy & Security](Privacy-Security)

---

**Last Updated**: 2025-01-16
**Version**: 3.0.4
