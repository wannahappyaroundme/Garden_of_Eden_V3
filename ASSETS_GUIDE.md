# 📸 Assets Creation Guide

> **Purpose**: This document provides specifications for creating marketing assets, screenshots, and graphics for Garden of Eden V3. These assets will be used in the landing page, README, and promotional materials.

---

## 📋 Table of Contents

1. [Screenshots](#-screenshots)
2. [Demo Video](#-demo-video)
3. [Logo & Icons](#-logo--icons)
4. [Social Media Graphics](#-social-media-graphics)
5. [Promotional Materials](#-promotional-materials)
6. [Technical Specifications](#-technical-specifications)

---

## 📷 Screenshots

### Priority 1: Core Interface Screenshots

#### 1.1 Hero Screenshot (Main Chat Interface)
**Filename**: `hero-chat-interface.png`

**What to Capture**:
- Full chat interface showing Garden of Eden V3 in action
- KakaoTalk-style chat bubbles with streaming AI response
- Dark mode enabled (more visually striking)
- At least 3-4 message exchanges showing AI's personality
- Sidebar visible showing conversation history
- Bottom input bar with voice button visible

**Composition**:
- Window size: 1400x900px
- Capture entire window including macOS title bar
- Ensure no personal/sensitive information visible
- Show timestamp on messages
- Include typing indicator animation (if possible)

**Context for Chat**:
- User: "Analyze this React component and suggest improvements"
- AI: [Streaming response with code analysis]
- Show markdown rendering with syntax highlighting

**Post-Processing**:
- Add subtle drop shadow to window
- Slightly blur desktop background if visible
- Crop to 16:9 aspect ratio (1920x1080px)

---

#### 1.2 Settings Page (Persona Customization)
**Filename**: `settings-persona.png`

**What to Capture**:
- Settings page with all 28 persona parameter sliders visible
- Show at least 8-10 parameters clearly
- Preset selection dropdown (showing all 6 presets)
- Dark mode toggle
- Language selection (Korean + English)
- "Save" and "Export Persona" buttons

**Composition**:
- Window size: 1400x900px
- Scroll to show most important parameters at top:
  - Formality
  - Humor
  - Verbosity
  - Emoji Usage
  - Technical Depth
  - Empathy
- Ensure sliders are at interesting positions (not all at default)

**Post-Processing**:
- Highlight one slider with subtle glow (e.g., "Humor" slider)
- Add annotation arrow pointing to "Learning from feedback: 47 interactions"

---

#### 1.3 Onboarding Experience
**Filename**: `onboarding-wizard.png`

**What to Capture**:
- Onboarding wizard showing Step 4/7 (Persona Setup)
- Progress indicator at top (4 filled circles, 3 empty)
- Welcome message
- Preset selection cards (6 presets with icons)
- "Next" and "Back" buttons

**Composition**:
- Window size: 1000x700px (smaller, centered)
- Modern wizard UI with clean design
- Show all 6 preset cards in a grid layout

**Post-Processing**:
- Add soft gradient background
- Subtle animation arrows showing progression

---

#### 1.4 Model Download Progress
**Filename**: `model-download.png`

**What to Capture**:
- Model downloader UI showing progress for 3 models
- Llama 3.1 8B: 100% complete (green checkmark)
- Whisper Large V3: 67% downloading (progress bar)
- LLaVA 7B: Queued (gray icon)
- Overall progress: 2/3 models complete
- Download speed, ETA, and total size visible

**Composition**:
- Window size: 800x600px
- Clean, minimal interface
- Progress bars prominent

**Post-Processing**:
- None needed (functional screenshot)

---

### Priority 2: Feature-Specific Screenshots

#### 2.1 Voice Input in Action
**Filename**: `voice-input.png`

**What to Capture**:
- Chat interface with microphone button activated (pulsing red)
- Waveform visualization showing audio input
- Transcription appearing in real-time
- "Listening..." indicator

**Composition**:
- Focus on bottom input area and last 2-3 messages
- Show clear visual feedback for voice input

---

#### 2.2 Screen Context Analysis
**Filename**: `screen-context-levels.png`

**What to Capture**:
- Settings > Screen Tracking section
- 3 context levels clearly labeled:
  - Level 1: Current Window (Fast)
  - Level 2: Recent Work (Balanced)
  - Level 3: Full Project (Deep)
- Radio button selection on Level 2
- Capture interval slider (10 minutes)
- Privacy controls: "Blur sensitive areas" checkbox enabled

**Composition**:
- Window size: 1200x800px
- Clear hierarchy showing all options

---

#### 2.3 RAG Memory Search
**Filename**: `rag-memory.png`

**What to Capture**:
- Chat interface showing AI recalling past conversation
- User: "What did we discuss about React performance last week?"
- AI response showing retrieved memories with timestamps
- Highlighted text showing semantic search matches

**Composition**:
- Show 2-3 retrieved memory snippets
- Timestamps visible (e.g., "From conversation on Jan 6, 2025")

---

#### 2.4 Markdown Rendering & Code Highlighting
**Filename**: `markdown-code.png`

**What to Capture**:
- Chat bubble showing AI response with:
  - Markdown headings (## and ###)
  - Bold and italic text
  - Bullet point list
  - Code block with syntax highlighting (TypeScript or Python)
  - Inline code snippets

**Composition**:
- Single large message bubble
- Dark theme for better code contrast
- Show highlight.js syntax highlighting in action

---

#### 2.5 Conversation History Sidebar
**Filename**: `conversation-history.png`

**What to Capture**:
- Sidebar expanded showing 8-10 conversations
- Date grouping: "Today", "Yesterday", "Last Week"
- Active conversation highlighted
- Search bar at top of sidebar
- Hover state on one conversation showing delete icon

**Composition**:
- Full window with sidebar prominent
- Show variety of conversation titles

---

#### 2.6 Dynamic Island Notification
**Filename**: `dynamic-island.png`

**What to Capture**:
- macOS desktop with Garden of Eden minimized
- Dynamic Island notification appearing at top-center
- Message preview: "Garden of Eden: New insight available"
- Animation frame (if possible) showing slide-in effect

**Composition**:
- Full macOS desktop (1920x1080px)
- Dynamic Island clearly visible at top

---

### Priority 3: Comparison & Workflow Screenshots

#### 3.1 Git Integration
**Filename**: `git-operations.png`

**What to Capture**:
- User: "Git status"
- AI response showing formatted Git status:
  - Modified files in red
  - Untracked files in yellow
  - Branch information
- Followed by user: "Commit these changes"
- AI preparing commit with suggested message

**Composition**:
- 4-5 message bubbles showing workflow
- Color-coded Git output

---

#### 3.2 File System Operations
**Filename**: `file-operations.png`

**What to Capture**:
- User: "Read my package.json and summarize dependencies"
- AI response with analyzed dependencies:
  - Production dependencies list
  - Dev dependencies list
  - Suggestions for updates

**Composition**:
- Show file path clearly
- Formatted list output

---

#### 3.3 Multi-Language Support
**Filename**: `bilingual-interface.png`

**What to Capture**:
- Split screen or before/after showing:
  - Left: Korean UI (한국어)
  - Right: English UI
- Same screen (Settings page) in both languages

**Composition**:
- Side-by-side comparison
- 1920x1080px total

---

## 🎬 Demo Video

### Video 1: 60-Second Feature Showcase
**Filename**: `garden-of-eden-demo-60s.mp4`

**Script & Scenes**:

1. **0:00-0:05** - Opening shot
   - Garden of Eden logo animation
   - Text overlay: "Your Private AI Assistant"

2. **0:05-0:15** - Privacy Message
   - Fade to black with text:
     - "100% Local"
     - "100% Private"
     - "0% Cloud"
     - "0% Subscriptions"
   - Fast cuts with dramatic music

3. **0:15-0:25** - Chat Interface
   - Screen recording of chat interface
   - Type question: "Help me debug this React error"
   - Show streaming AI response (sped up 2x)
   - Highlight markdown rendering

4. **0:25-0:35** - Voice Input
   - Click microphone button
   - Speak: "What's my schedule today?"
   - Show waveform visualization
   - AI responds with calendar events

5. **0:35-0:45** - Persona Customization
   - Quick tour of settings page
   - Adjust 3-4 sliders rapidly
   - Switch between presets (Default → Professional → Friendly)
   - Show personality change in chat

6. **0:45-0:55** - System Integration
   - Fast montage:
     - File reading (package.json)
     - Git status command
     - Screen capture analysis
     - Calendar event creation
   - Quick cuts, ~2s each

7. **0:55-1:00** - Call to Action
   - Fade to black
   - Text: "Download Free at github.com/[repo]"
   - Garden of Eden logo

**Technical Specs**:
- Resolution: 1920x1080px (1080p)
- Frame rate: 60fps
- Format: MP4 (H.264 codec)
- File size: <50MB
- Audio: Background music (royalty-free, upbeat)
- Voiceover: Optional (or text overlays only)

---

### Video 2: 3-Minute Deep Dive
**Filename**: `garden-of-eden-deepdive-3min.mp4`

**Structure**:
1. **0:00-0:30** - Introduction & Problem Statement
2. **0:30-1:00** - Privacy Explanation (show architecture diagram)
3. **1:00-1:30** - AI Models & Performance (show model downloads, benchmarks)
4. **1:30-2:00** - Persona Learning System (show gradient descent working)
5. **2:00-2:30** - Use Cases (developer workflow, student research)
6. **2:30-3:00** - Call to Action & Community

**Technical Specs**: Same as Video 1 but 3 minutes

---

### Video 3: Installation & Setup Tutorial
**Filename**: `garden-of-eden-setup-tutorial.mp4`

**Content**:
- Full walkthrough from download to first conversation
- Show model download progress (timelapse)
- Onboarding wizard steps
- First chat interaction

**Length**: 5-7 minutes
**Format**: Screen recording with voiceover

---

## 🎨 Logo & Icons

### App Logo
**Filename**: `garden-of-eden-logo.svg` and `garden-of-eden-logo.png`

**Design Concept**:
- **Symbol**: Stylized tree (representing Garden of Eden) with circuit board branches (representing AI)
- **Color Palette**:
  - Primary: #667eea (purple gradient start)
  - Secondary: #764ba2 (purple gradient end)
  - Accent: #10b981 (green for "garden" theme)
- **Typography**: Modern sans-serif, clean, tech-forward
- **Variations Needed**:
  - Full logo with text (horizontal layout)
  - Icon only (square, for app icon)
  - Monochrome version (white on transparent)

**Sizes**:
- SVG (vector, scalable)
- PNG: 512x512px, 1024x1024px, 2048x2048px

---

### App Icons (macOS)
**Filenames**: `icon.icns` (generated from icon.png)

**Sizes Needed** (macOS .icns includes all):
- 16x16px
- 32x32px
- 64x64px
- 128x128px
- 256x256px
- 512x512px
- 1024x1024px (Retina)

**Design**:
- Use logo icon (square version)
- Add subtle gradient background
- Rounded corners (macOS Big Sur style)

**Generation**:
- Use existing `scripts/generate-icons.sh` (ImageMagick)
- Source: 1024x1024px PNG with transparency

---

### App Icons (Windows)
**Filenames**: `icon.ico`

**Sizes Needed**:
- 16x16px
- 32x32px
- 48x48px
- 256x256px

**Design**: Same as macOS but Windows style (no rounded corners)

---

### Feature Icons (for Landing Page)
**Filenames**: `icon-[feature].svg`

Create SVG icons for:
1. `icon-privacy.svg` - Padlock with shield
2. `icon-local-ai.svg` - Brain with circuit
3. `icon-persona.svg` - Multiple faces/masks
4. `icon-screen-context.svg` - Monitor with eye
5. `icon-integration.svg` - Puzzle pieces connecting
6. `icon-voice.svg` - Microphone with waveform
7. `icon-learning.svg` - Graph trending upward
8. `icon-offline.svg` - Cloud with slash through it

**Style**:
- Line icons, 2px stroke
- Color: Same purple gradient (#667eea → #764ba2)
- Size: 64x64px canvas, scalable SVG

---

## 📱 Social Media Graphics

### Open Graph Image (for GitHub, social shares)
**Filename**: `og-image.png`

**Specifications**:
- Size: 1200x630px
- Format: PNG
- File size: <1MB

**Content**:
- Background: Purple gradient (#667eea → #764ba2)
- Logo: Top-left corner (200px wide)
- Main Text:
  - "Garden of Eden V3" (large, bold, white)
  - "Your Private AI Assistant" (subtitle, white)
- Feature badges:
  - "100% Local" badge
  - "Free Forever" badge
  - "Works Offline" badge
- Screenshot: Small preview of chat interface (bottom-right, 30% opacity overlay)

---

### Twitter/X Card
**Filename**: `twitter-card.png`

**Specifications**:
- Size: 1200x675px (16:9)
- Format: PNG

**Content**: Same as Open Graph but optimized for Twitter layout

---

### GitHub Social Preview
**Filename**: `github-social-preview.png`

**Specifications**:
- Size: 1280x640px
- Format: PNG

**Content**: Similar to OG image but GitHub-optimized

---

### ProductHunt Graphics
**Filename**: `producthunt-[type].png`

**Types Needed**:
1. **Thumbnail** (240x240px) - Logo icon only
2. **Gallery Images** (1270x760px) - 4-5 screenshots with captions
3. **Cover Image** (1270x760px) - Hero screenshot with overlay text

---

## 📄 Promotional Materials

### One-Pager (PDF)
**Filename**: `garden-of-eden-onepager.pdf`

**Content**:
- Page 1:
  - Hero section with logo
  - "What is Garden of Eden V3?" (2-3 sentences)
  - Key features (6 bullet points with icons)
  - Comparison table (vs ChatGPT/Claude)
  - Technical specs
  - Download QR code
  - GitHub stars badge

**Design**:
- Professional, clean layout
- Purple gradient accents
- Print-ready (8.5x11" or A4)
- Export as PDF (high resolution, 300dpi)

---

### Slide Deck (for presentations)
**Filename**: `garden-of-eden-deck.pptx` or `.pdf`

**Slides**:
1. Title slide (logo, tagline)
2. The Problem (cloud AI concerns)
3. The Solution (Garden of Eden overview)
4. Architecture (technical diagram)
5. Key Features (6 slides, one per feature category)
6. Demo (screenshots or video embed)
7. Roadmap & Community
8. Call to Action (download, GitHub, community)

**Design**:
- Consistent branding (purple gradient theme)
- High-quality screenshots
- Minimal text, strong visuals
- Speaker notes included

---

## 🔧 Technical Specifications

### Color Palette

**Primary Colors**:
- Purple Gradient Start: `#667eea` (RGB: 102, 126, 234)
- Purple Gradient End: `#764ba2` (RGB: 118, 75, 162)
- Green Accent: `#10b981` (RGB: 16, 185, 129)

**Secondary Colors**:
- Dark Background: `#1a202c` (RGB: 26, 32, 44)
- Light Background: `#f5f7fa` (RGB: 245, 247, 250)
- Text Dark: `#2d3748` (RGB: 45, 55, 72)
- Text Light: `#ffffff` (RGB: 255, 255, 255)

**Status Colors**:
- Success: `#10b981` (green)
- Warning: `#f59e0b` (orange)
- Error: `#ef4444` (red)
- Info: `#3b82f6` (blue)

---

### Typography

**Primary Font**: Inter or SF Pro (system font)
- Headings: Bold (700 weight)
- Body: Regular (400 weight)
- UI Elements: Medium (500 weight)

**Fallback Stack**:
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
```

---

### Screenshot Guidelines

**Best Practices**:
1. **Consistency**:
   - All screenshots use dark mode
   - Window size consistent (1400x900px default)
   - Same macOS version (Big Sur or later)
   - Hide desktop icons/clutter

2. **Privacy**:
   - No real personal information
   - Use example/dummy data
   - Blur sensitive areas if needed
   - No real GitHub tokens/API keys visible

3. **Quality**:
   - Retina resolution (2x or 3x)
   - PNG format (lossless)
   - Compress with tools like TinyPNG
   - File size <2MB per image

4. **Context**:
   - Show realistic use cases
   - Use proper lighting/contrast
   - Ensure text is readable
   - Avoid empty states (show populated data)

---

### Image Optimization

**Tools to Use**:
- **TinyPNG** - Compress PNG screenshots (lossy compression)
- **ImageOptim** (macOS) - Lossless optimization
- **SVGO** - Optimize SVG icons
- **FFmpeg** - Compress demo videos

**Target Sizes**:
- Screenshots: <1MB each
- OG images: <500KB
- Icons: <100KB
- Demo video (60s): <30MB
- Tutorial video (5min): <100MB

---

## 📦 Asset Delivery

### Folder Structure
```
assets/
├── screenshots/
│   ├── hero-chat-interface.png
│   ├── settings-persona.png
│   ├── onboarding-wizard.png
│   ├── model-download.png
│   ├── voice-input.png
│   ├── screen-context-levels.png
│   ├── rag-memory.png
│   ├── markdown-code.png
│   ├── conversation-history.png
│   ├── dynamic-island.png
│   ├── git-operations.png
│   ├── file-operations.png
│   └── bilingual-interface.png
│
├── videos/
│   ├── garden-of-eden-demo-60s.mp4
│   ├── garden-of-eden-deepdive-3min.mp4
│   └── garden-of-eden-setup-tutorial.mp4
│
├── logos/
│   ├── garden-of-eden-logo.svg
│   ├── garden-of-eden-logo.png (1024x1024)
│   ├── garden-of-eden-logo@2x.png (2048x2048)
│   └── icon/ (generated by scripts/generate-icons.sh)
│
├── icons/
│   ├── icon-privacy.svg
│   ├── icon-local-ai.svg
│   ├── icon-persona.svg
│   ├── icon-screen-context.svg
│   ├── icon-integration.svg
│   ├── icon-voice.svg
│   ├── icon-learning.svg
│   └── icon-offline.svg
│
├── social/
│   ├── og-image.png (1200x630)
│   ├── twitter-card.png (1200x675)
│   ├── github-social-preview.png (1280x640)
│   └── producthunt/
│       ├── thumbnail.png (240x240)
│       ├── gallery-1.png (1270x760)
│       ├── gallery-2.png
│       ├── gallery-3.png
│       ├── gallery-4.png
│       └── cover.png (1270x760)
│
└── promotional/
    ├── garden-of-eden-onepager.pdf
    └── garden-of-eden-deck.pdf
```

---

## ✅ Asset Creation Checklist

### Phase 1: Essential Screenshots (Priority 1)
- [ ] Hero chat interface screenshot
- [ ] Settings page (persona customization)
- [ ] Onboarding wizard
- [ ] Model download progress

### Phase 2: Feature Screenshots (Priority 2)
- [ ] Voice input in action
- [ ] Screen context levels
- [ ] RAG memory search
- [ ] Markdown & code highlighting
- [ ] Conversation history sidebar
- [ ] Dynamic Island notification

### Phase 3: Workflow Screenshots (Priority 3)
- [ ] Git integration
- [ ] File system operations
- [ ] Bilingual interface comparison

### Phase 4: Videos
- [ ] 60-second feature showcase
- [ ] 3-minute deep dive
- [ ] Installation & setup tutorial

### Phase 5: Logos & Icons
- [ ] Main logo (SVG + PNG variants)
- [ ] App icons (macOS .icns)
- [ ] App icons (Windows .ico)
- [ ] Feature icons (8 SVG icons)

### Phase 6: Social Media Graphics
- [ ] Open Graph image
- [ ] Twitter card
- [ ] GitHub social preview
- [ ] ProductHunt graphics (thumbnail + gallery)

### Phase 7: Promotional Materials
- [ ] One-pager PDF
- [ ] Slide deck presentation

---

## 🎯 Priority Order for Launch

**Must-Have (v1.0.0 Launch)**:
1. Hero chat interface screenshot (for README)
2. 60-second demo video (for social media)
3. Logo & app icons (for GitHub, downloads)
4. Open Graph image (for social shares)

**Nice-to-Have (v1.0.1 Update)**:
5. All feature screenshots
6. 3-minute deep dive video
7. Social media graphics
8. One-pager PDF

**Future (v1.1+)**:
9. Setup tutorial video
10. Slide deck presentation
11. Advanced promotional materials

---

## 📝 Notes for Asset Creator

### Screenshot Capture Tools (macOS)
- **Built-in**: `Cmd+Shift+4` → Space → Click window (captures window with shadow)
- **CleanShot X** - Professional screenshot tool with annotations
- **Skitch** - Quick annotations and arrows
- **Figma** - Design mockups if needed

### Video Recording Tools
- **OBS Studio** - Free, open-source screen recording
- **ScreenFlow** (macOS) - Professional screen recording & editing
- **Loom** - Quick screen recordings with webcam overlay

### Design Tools
- **Figma** - UI design, mockups, social graphics
- **Canva** - Quick social media graphics
- **Adobe Illustrator** - Logo & icon creation
- **Inkscape** - Free vector graphics (SVG)

### Video Editing Tools
- **Final Cut Pro** (macOS) - Professional video editing
- **DaVinci Resolve** - Free, powerful video editor
- **iMovie** (macOS) - Simple video editing
- **Kdenlive** - Free, open-source video editor

---

## 🚀 Asset Integration Plan

### README.md
```markdown
![Garden of Eden V3](assets/screenshots/hero-chat-interface.png)

### Features

![Settings](assets/screenshots/settings-persona.png)
![Voice Input](assets/screenshots/voice-input.png)
```

### LANDING_PAGE.md
```html
<div align="center">
  <img src="assets/logos/garden-of-eden-logo.png" width="200" alt="Garden of Eden V3">
</div>

<!-- Hero screenshot -->
<img src="assets/screenshots/hero-chat-interface.png" alt="Chat Interface" style="border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
```

### GitHub Repository Settings
- **Social preview**: Upload `assets/social/github-social-preview.png`
- **README**: Embed hero screenshot at top
- **Releases**: Include demo video in release notes

---

**Last Updated**: 2025-01-13
**Status**: Ready for Asset Creation
**Estimated Time**: 8-12 hours for all assets
