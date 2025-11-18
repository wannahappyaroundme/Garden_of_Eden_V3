# Testing Guide for v3.4.0

**Version**: 3.4.0
**Features**: Auto-Updater + Crash Reporting System
**Testing Date**: 2025-11-18
**Status**: Ready for Manual Testing

---

## 🎯 Testing Objectives

This guide provides step-by-step instructions to manually test all v3.4.0 features before release.

---

## 📋 Pre-Test Checklist

- [ ] App is running in development mode (`npm run dev`)
- [ ] No TypeScript compilation errors
- [ ] All changes committed to git
- [ ] Version numbers updated to 3.4.0

---

## 🧪 Test Suite 1: Crash Reporter

### Test 1.1: View Crash Reports Panel
**Path**: Settings → Crash Reports

**Steps**:
1. Launch the app
2. Navigate to Settings
3. Click on "Crash Reports" tab
4. Verify the panel loads

**Expected Results**:
- ✅ Panel displays with proper layout
- ✅ Shows statistics cards (Total Crashes, This Week, This Month, Last 30 Days)
- ✅ Shows empty state if no crashes: "No crash reports found"
- ✅ Loading skeleton appears during data fetch (animated cards)

**Accessibility Check**:
- ✅ Screen reader announces crash count
- ✅ Buttons have proper aria-labels
- ✅ Keyboard navigation works (Tab through controls)

---

### Test 1.2: Loading States
**Path**: Settings → Crash Reports (on first load)

**Steps**:
1. Clear browser cache/restart app
2. Navigate to Crash Reports
3. Observe loading state

**Expected Results**:
- ✅ Shows 3 animated skeleton cards
- ✅ Skeleton matches final layout (icon, title, message areas)
- ✅ Smooth transition from skeleton to content
- ✅ No flash of loading text

---

### Test 1.3: Crash Report Details
**Path**: Settings → Crash Reports → View Report

**Steps**:
1. If crash reports exist, click "View" on any report
2. Verify details modal opens
3. Check all information is displayed

**Expected Results**:
- ✅ Modal shows full error message
- ✅ Stack trace is displayed (if available)
- ✅ Timestamp is formatted correctly
- ✅ Platform info is shown (OS, version)
- ✅ Can copy error details

---

### Test 1.4: Delete Crash Report
**Path**: Settings → Crash Reports → Delete

**Steps**:
1. Click "Delete" on a crash report
2. Confirm deletion in dialog
3. Verify report is removed

**Expected Results**:
- ✅ Confirmation dialog appears
- ✅ Report is deleted from list
- ✅ Statistics update accordingly
- ✅ Toast notification confirms deletion

---

### Test 1.5: Delete All Reports
**Path**: Settings → Crash Reports → Delete All

**Steps**:
1. Click "Delete All Reports" button
2. Confirm in dialog
3. Verify all reports cleared

**Expected Results**:
- ✅ Confirmation dialog with warning
- ✅ All reports removed
- ✅ Empty state appears
- ✅ Statistics reset to 0
- ✅ Toast notification confirms action

---

### Test 1.6: Export Crash Report
**Path**: Settings → Crash Reports → Export

**Steps**:
1. Click "Export" on a crash report
2. Choose save location
3. Verify JSON file created

**Expected Results**:
- ✅ File save dialog opens
- ✅ JSON file contains full crash data
- ✅ File is valid JSON format
- ✅ Toast notification confirms export

---

### Test 1.7: Crash Statistics Accuracy
**Path**: Settings → Crash Reports

**Steps**:
1. Note the statistics values
2. Delete one report
3. Verify statistics decrease
4. Add a simulated crash (if possible)
5. Verify statistics increase

**Expected Results**:
- ✅ Total count is accurate
- ✅ "This Week" only counts last 7 days
- ✅ "This Month" only counts current month
- ✅ "Last 30 Days" counts last 30 days
- ✅ Statistics update in real-time

---

## 🧪 Test Suite 2: Update Notification

### Test 2.1: Manual Update Check
**Path**: Settings → Updates

**Steps**:
1. Navigate to Settings → Updates
2. Click "Check for Updates" button
3. Observe the check process

**Expected Results**:
- ✅ Button shows "Checking..." with spinning icon
- ✅ Button is disabled during check
- ✅ After check, shows result (update available or up to date)
- ✅ Last check time updates

**Accessibility Check**:
- ✅ Button state changes are announced to screen readers
- ✅ aria-label describes current action

---

### Test 2.2: Update Available State
**Path**: Settings → Updates (when update available)

**Steps**:
1. Mock an update being available (if testing environment supports)
2. Click "Check for Updates"
3. Verify update notification appears

**Expected Results**:
- ✅ Green border card shows "Update Available"
- ✅ Shows current version → latest version
- ✅ Release notes are displayed
- ✅ "Install Update" button appears
- ✅ Download icon is visible

---

### Test 2.3: Update Download Progress
**Path**: Update Notification (during download)

**Steps**:
1. Click "Install Update" (if update available)
2. Observe download progress
3. Monitor progress bar

**Expected Results**:
- ✅ Progress bar appears
- ✅ Percentage updates in real-time
- ✅ Status message shows "Downloading update... X%"
- ✅ Download icon animates (pulse)
- ✅ Cannot dismiss during download

**Accessibility Check**:
- ✅ Progress bar has role="progressbar"
- ✅ aria-valuenow updates with percentage
- ✅ Screen reader text announces progress

---

### Test 2.4: Update Installation
**Path**: Update Notification (during install)

**Steps**:
1. Wait for download to complete
2. Observe installation phase
3. Verify app restart prompt

**Expected Results**:
- ✅ Status changes to "Installing update..."
- ✅ Progress bar shows 100%
- ✅ Spinning icon appears
- ✅ "Update installed! App will restart." message
- ✅ "Restart Now" button appears

---

### Test 2.5: No Update Available
**Path**: Settings → Updates (when up to date)

**Steps**:
1. Click "Check for Updates" when already on latest
2. Verify "no update" state

**Expected Results**:
- ✅ Blue border card shows "You are up to date!"
- ✅ Shows current version
- ✅ Toast notification: "No Updates - You are running the latest version"
- ✅ "Check Again" button available

---

### Test 2.6: Update Notification Popup
**Path**: Main window (on app startup if enabled)

**Steps**:
1. Enable "Auto-Check" in Settings → Updates
2. Restart app
3. Observe automatic update check

**Expected Results**:
- ✅ Notification appears in top-right corner
- ✅ Blue border with backdrop blur
- ✅ Shows app icon and version info
- ✅ Can dismiss with X button
- ✅ Auto-hides after 3s if no update

**Accessibility Check**:
- ✅ role="alert" for notification
- ✅ aria-live="polite" for screen readers
- ✅ aria-atomic="true" for complete reading
- ✅ Dismiss button has aria-label

---

### Test 2.7: Update Settings Configuration
**Path**: Settings → Updates → Auto-Update Settings

**Steps**:
1. Toggle "Enable Auto-Check"
2. Change check interval
3. Verify settings persist

**Expected Results**:
- ✅ Switch toggles properly
- ✅ Interval dropdown updates
- ✅ Interval is disabled when auto-check off
- ✅ Settings saved to storage
- ✅ Settings persist after restart

---

### Test 2.8: Error Handling
**Path**: Settings → Updates (network error scenario)

**Steps**:
1. Disconnect internet
2. Click "Check for Updates"
3. Observe error handling

**Expected Results**:
- ✅ Error state appears
- ✅ Red alert icon shows
- ✅ Error message is user-friendly
- ✅ "Retry" button available
- ✅ Toast error notification
- ✅ Auto-hides after 5s

---

## 🧪 Test Suite 3: Accessibility

### Test 3.1: Keyboard Navigation
**Path**: All Settings panels

**Steps**:
1. Use only keyboard (no mouse)
2. Tab through all controls
3. Use Enter/Space to activate buttons
4. Use Arrow keys in dropdowns

**Expected Results**:
- ✅ All interactive elements focusable
- ✅ Focus indicator visible
- ✅ Logical tab order
- ✅ Can activate all buttons with keyboard
- ✅ Can operate all switches and dropdowns

---

### Test 3.2: Screen Reader Support
**Path**: Update Notification + Crash Reports

**Steps**:
1. Enable macOS VoiceOver (Cmd+F5)
2. Navigate update notification
3. Navigate crash reports panel
4. Verify all announcements

**Expected Results**:
- ✅ All buttons announced with labels
- ✅ Update status announced
- ✅ Progress updates announced
- ✅ Statistics announced correctly
- ✅ Error messages announced
- ✅ Icons have screen reader text

---

### Test 3.3: Color Contrast
**Path**: All new UI components

**Steps**:
1. Check light mode contrast
2. Check dark mode contrast
3. Use browser color picker to verify

**Expected Results**:
- ✅ Text meets WCAG AA (4.5:1 for normal text)
- ✅ Icons/buttons meet WCAG AA (3:1 for large text/UI)
- ✅ Focus indicators clearly visible
- ✅ Both light and dark modes accessible

---

## 🧪 Test Suite 4: Performance

### Test 4.1: Loading Performance
**Path**: Settings → Crash Reports

**Steps**:
1. Open DevTools Performance tab
2. Navigate to Crash Reports
3. Measure load time

**Expected Results**:
- ✅ Panel loads in < 300ms
- ✅ Skeleton appears in < 100ms
- ✅ No layout shift
- ✅ Smooth transitions

---

### Test 4.2: Update Check Performance
**Path**: Settings → Updates

**Steps**:
1. Click "Check for Updates"
2. Time the response
3. Monitor network tab

**Expected Results**:
- ✅ Response in < 5s (network dependent)
- ✅ UI remains responsive during check
- ✅ No blocking operations
- ✅ Proper error timeout (30s)

---

## 🧪 Test Suite 5: Integration

### Test 5.1: Cross-Panel Navigation
**Path**: Settings → Multiple Panels

**Steps**:
1. Navigate Settings → Updates
2. Switch to Crash Reports
3. Switch back to Updates
4. Verify state preservation

**Expected Results**:
- ✅ Update check state preserved
- ✅ Crash report filters preserved
- ✅ No unnecessary re-fetching
- ✅ Smooth transitions

---

### Test 5.2: Toast Notifications
**Path**: All Settings actions

**Steps**:
1. Trigger various actions (delete, export, update)
2. Observe toast notifications
3. Verify timing and content

**Expected Results**:
- ✅ Toasts appear in consistent location
- ✅ Success toasts are green
- ✅ Error toasts are red
- ✅ Info toasts are blue
- ✅ Auto-dismiss after 3-5s
- ✅ Can manually dismiss

---

## 🧪 Test Suite 6: Edge Cases

### Test 6.1: Empty States
**Steps**:
1. Delete all crash reports
2. Verify empty state
3. Navigate away and back

**Expected Results**:
- ✅ Empty state illustration/message
- ✅ No errors in console
- ✅ Statistics show 0
- ✅ State persists correctly

---

### Test 6.2: Network Interruption
**Steps**:
1. Start update download
2. Disconnect internet mid-download
3. Observe error handling

**Expected Results**:
- ✅ Error message appears
- ✅ Can retry download
- ✅ No corrupt state
- ✅ App remains functional

---

### Test 6.3: Rapid Actions
**Steps**:
1. Rapidly click "Check for Updates" multiple times
2. Verify no duplicate requests
3. Check console for errors

**Expected Results**:
- ✅ Button disabled during check
- ✅ Only one request sent
- ✅ No race conditions
- ✅ No console errors

---

## 📝 Testing Checklist

### Functionality
- [ ] All crash report CRUD operations work
- [ ] Update checking works
- [ ] Update downloading works
- [ ] Update installation works
- [ ] Statistics calculate correctly
- [ ] Export functionality works
- [ ] Auto-check interval works

### UI/UX
- [ ] Loading skeletons display properly
- [ ] All animations smooth (60fps)
- [ ] Dark mode works correctly
- [ ] Responsive layout (window resize)
- [ ] No visual glitches
- [ ] Consistent spacing/typography

### Accessibility
- [ ] Keyboard navigation complete
- [ ] Screen reader support complete
- [ ] ARIA labels present
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible

### Performance
- [ ] No memory leaks
- [ ] Fast initial load (< 2s)
- [ ] Smooth interactions (< 16ms frames)
- [ ] Efficient re-renders

### Error Handling
- [ ] Network errors handled gracefully
- [ ] Invalid data handled
- [ ] User-friendly error messages
- [ ] No crashes on edge cases

---

## 🐛 Bug Report Template

If you find any issues during testing:

```markdown
**Bug Title**: [Brief description]

**Severity**: Critical / High / Medium / Low

**Steps to Reproduce**:
1.
2.
3.

**Expected Behavior**:


**Actual Behavior**:


**Screenshots**: [If applicable]

**Environment**:
- OS:
- Version: 3.4.0
- Node:
- Browser DevTools console errors:
```

---

## ✅ Sign-Off

After completing all tests:

- [ ] All critical tests passed
- [ ] No blocking bugs found
- [ ] Performance acceptable
- [ ] Accessibility verified
- [ ] Ready for production release

**Tested By**: _______________
**Date**: _______________
**Approval**: ✅ / ❌

---

**Next Steps After Testing**:
1. Fix any bugs found
2. Run final TypeScript build check
3. Create GitHub Release (v3.4.0)
4. Update CHANGELOG.md
5. Build production binaries
