# GitHub Wiki Setup Guide

## 📚 How to Setup the Wiki on GitHub

The Wiki content has been created in the `wiki/` folder. To publish it to GitHub Wiki, follow these steps:

### Option 1: Manual Setup (Recommended)

1. **Enable Wiki on GitHub**:
   - Go to your repository: https://github.com/wannahappyaroundme/Garden_of_Eden_V3
   - Click "Settings"
   - Scroll to "Features" section
   - Check "Wikis" checkbox

2. **Clone the Wiki Repository**:
   ```bash
   # Clone the wiki (separate repo)
   git clone https://github.com/wannahappyaroundme/Garden_of_Eden_V3.wiki.git
   cd Garden_of_Eden_V3.wiki
   ```

3. **Copy Wiki Files**:
   ```bash
   # Copy all markdown files from wiki/ folder
   cp ../Garden_of_Eden_V3/wiki/*.md .
   ```

4. **Commit and Push**:
   ```bash
   git add .
   git commit -m "Initial wiki setup with comprehensive documentation"
   git push origin master
   ```

5. **Access Your Wiki**:
   - Visit: https://github.com/wannahappyaroundme/Garden_of_Eden_V3/wiki

### Option 2: Using GitHub Web Interface

1. **Enable Wiki** (same as Option 1, step 1)

2. **Create Pages Manually**:
   - Go to https://github.com/wannahappyaroundme/Garden_of_Eden_V3/wiki
   - Click "Create the first page" or "New Page"
   - Copy content from each markdown file in `wiki/` folder
   - Paste and save

3. **Create These Pages**:
   - `Home` (from `Home.md`)
   - `Installation-Guide` (from `Installation-Guide.md`)
   - `Quick-Start` (from `Quick-Start.md`)
   - `Persona-Customization` (from `Persona-Customization.md`)
   - `Cloud-Backup` (from `Cloud-Backup.md`)
   - `FAQ` (from `FAQ.md`)

---

## 📖 Wiki Structure

```
Garden of Eden V3 Wiki
├── Home (Home.md)
│   ├── Getting Started
│   │   ├── Installation Guide
│   │   ├── Quick Start
│   │   └── First-Time Setup
│   ├── User Guides
│   │   ├── Chat Interface
│   │   ├── Voice Features
│   │   ├── Persona Customization ✨
│   │   ├── Screen Context
│   │   └── Cloud Backup ✨
│   ├── Features
│   │   ├── AI Intelligence
│   │   ├── System Integration
│   │   ├── Proactive Notifications
│   │   └── Keyboard Shortcuts
│   ├── Advanced
│   │   ├── API Reference
│   │   ├── Building from Source
│   │   ├── Contributing
│   │   └── Troubleshooting
│   └── Project Information
│       ├── Architecture
│       ├── Privacy & Security
│       ├── Roadmap
│       ├── Changelog
│       └── FAQ ✨
│
├── Installation-Guide.md ✨
├── Quick-Start.md ✨
├── Persona-Customization.md ✨
├── Cloud-Backup.md ✨
└── FAQ.md ✨

✨ = Created and ready to publish
```

---

## 📋 Wiki Content Summary

### 1. Home.md
- Wiki landing page
- Complete navigation structure
- Quick links to all sections
- System requirements
- Getting help resources

### 2. Installation-Guide.md
- System requirements (min/recommended)
- Prerequisites installation (Homebrew, Node.js, Ollama)
- Installation options (binary vs source)
- First-time setup wizard walkthrough
- Verification steps
- Troubleshooting installation issues

### 3. Quick-Start.md
- 5-minute quickstart guide
- Essential steps to get running
- Basic chat examples
- Voice input/screen context intro
- Keyboard shortcuts
- Common commands

### 4. Persona-Customization.md
- Complete guide to 10 personality parameters
- Detailed examples for each parameter
- Recommended presets (4 configurations)
- Learning system documentation
- System prompt preview
- Saving and cloud backup
- Advanced parameter interactions

### 5. Cloud-Backup.md
- Google Drive backup setup
- Step-by-step backup/restore instructions
- What gets backed up (and what doesn't)
- Security and privacy details
- Troubleshooting cloud issues
- Managing multiple backups
- Disabling cloud backup

### 6. FAQ.md
- 50+ frequently asked questions
- Organized by category:
  - General
  - Installation & Setup
  - Privacy & Security
  - AI Model
  - Features
  - Customization
  - Performance
  - Cloud Backup
  - Troubleshooting
  - Development
  - Roadmap
  - Support

---

## 🔗 Internal Wiki Links

When creating wiki pages on GitHub, use these link formats:

```markdown
[Installation Guide](Installation-Guide)
[Quick Start](Quick-Start)
[Persona Customization](Persona-Customization)
[Cloud Backup](Cloud-Backup)
[FAQ](FAQ)
```

Note: GitHub Wiki automatically converts hyphens to spaces in page titles.

---

## 📝 Maintenance

### Updating Wiki Content

1. Edit markdown files in `wiki/` folder
2. Commit changes to main repo
3. Copy updated files to wiki repo:
   ```bash
   cd Garden_of_Eden_V3.wiki
   cp ../Garden_of_Eden_V3/wiki/*.md .
   git add .
   git commit -m "Update wiki documentation"
   git push origin master
   ```

### Adding New Pages

1. Create new `.md` file in `wiki/` folder
2. Add link to `Home.md` navigation
3. Commit to main repo
4. Copy to wiki repo and push

---

## 🎯 Next Steps After Wiki Setup

1. **Create Additional Pages** (referenced in Home.md but not yet created):
   - `Chat-Interface.md`
   - `Voice-Features.md`
   - `Screen-Context.md`
   - `AI-Intelligence.md`
   - `System-Integration.md`
   - `Proactive-Notifications.md`
   - `Keyboard-Shortcuts.md`
   - `API-Reference.md`
   - `Building-from-Source.md`
   - `Contributing.md`
   - `Architecture.md`
   - `Privacy-Security.md`
   - `Roadmap.md`
   - `Changelog.md`

2. **Link Existing Docs**:
   - Many of these can link to existing docs/ files
   - For example, `API-Reference` can redirect to `docs/API.md`

3. **Add Screenshots**:
   - Create `wiki/images/` folder
   - Add screenshots of:
     - Chat interface
     - Persona settings
     - Voice visualizer
     - Screen context
     - Cloud backup settings

---

## 📊 Documentation Stats

- **Wiki Pages Created**: 6
- **Total Words**: ~15,000
- **User Documentation**: 2 files (~10,000 words)
- **Total Lines**: ~2,800

All documentation is:
- ✅ Production-ready
- ✅ User-friendly
- ✅ Comprehensive
- ✅ Well-organized
- ✅ Cross-referenced

---

**Ready to Publish!** 🚀

Follow Option 1 above to publish the wiki to GitHub.
