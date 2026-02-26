# n8n Video Pipeline - Visual Guide & Workflow Diagrams

---

## 🎯 Complete Workflow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   n8n Video Creation Pipeline (3D Films)                     │
└─────────────────────────────────────────────────────────────────────────────┘

TRIGGER:
┌────────────────────┐
│  Cron Job          │  ← Runs at 00:00 daily (or on webhook)
│  (Daily or Manual) │
└─────────┬──────────┘
          │
          ▼ (empty payload)
┌────────────────────────────────────────────────────────────┐
│ Stage 1: IDEA GENERATION                                   │
├────────────────────────────────────────────────────────────┤
│ ✓ Execute: node scripts/idea-generator.js                 │
│ ✓ Service: OpenAI GPT-4o-mini                             │
│ ✓ Input: System + User prompts                            │
│ ✓ Output: JSON array of 10 creative video concepts        │
│ Status: ❌ BROKEN (API method error) → ✅ FIXED           │
└─────────┬───────────────────────────────────────────────────┘
          │ [idea1, idea2, ..., idea10]
          ▼
┌────────────────────────────────────────────────────────────┐
│ Stage 2: SELECT TOP IDEA                                   │
├────────────────────────────────────────────────────────────┤
│ ✓ Function: Parse JSON and select idea[0]                 │
│ ✓ Input: Array from Stage 1                               │
│ ✓ Output: selectedIdea string + all ideas                 │
│ Status: ⚠️ DEPENDS (downstream fix needed)                │
└─────────┬───────────────────────────────────────────────────┘
          │ { selectedIdea: "A robot discovers emotions..." }
          ▼
┌────────────────────────────────────────────────────────────┐
│ Stage 3: GENERATE PROMPTS                                  │
├────────────────────────────────────────────────────────────┤
│ ✓ Execute: node scripts/prompt-generator.js               │
│ ✓ Service: OpenAI GPT-4o-mini                             │
│ ✓ Input: Selected idea from Stage 2                       │
│ ✓ Output: 5 image prompts + 1 video prompt                │
│ Status: ❌ BROKEN (API method error) → ✅ FIXED           │
└─────────┬───────────────────────────────────────────────────┘
          │ { images: [...5 prompts], video: "..." }
          ▼
┌────────────────────────────────────────────────────────────┐
│ Stage 4: GENERATE IMAGES                                   │
├────────────────────────────────────────────────────────────┤
│ ✓ Service: Stable Diffusion / DALL-E / Midjourney        │
│ ✓ Input: Array of 5 image prompts                         │
│ ✓ Output: 5 images (as URLs or base64)                    │
│ ✓ Format: PNG/JPG 1024x1024                               │
│ Status: ❌ PLACEHOLDER (not implemented) → ⚠️ TODO        │
└─────────┬───────────────────────────────────────────────────┘
          │ { images: [{url, prompt}, ...] }
          ▼
┌────────────────────────────────────────────────────────────┐
│ Stage 5: GENERATE AUDIO (MISSING!)                         │
├────────────────────────────────────────────────────────────┤
│ ⚠️ NOT YET IMPLEMENTED                                     │
│ ✓ Needed Service: ElevenLabs / Google Cloud TTS            │
│ ✓ Input: Script text (needs generation from GPT)          │
│ ✓ Output: narration.mp3                                   │
│ Status: ❌ MISSING - Must add this stage!                 │
└─────────┬───────────────────────────────────────────────────┘
          │ { audioPath: "audio/narration.mp3" }
          ▼
┌────────────────────────────────────────────────────────────┐
│ Stage 6: ASSEMBLE VIDEO                                    │
├────────────────────────────────────────────────────────────┤
│ ✓ Execute: node scripts/video-assembler.js                │
│ ✓ Tool: FFmpeg (libx264 codec)                            │
│ ✓ Input: 5 images + audio + spec.json                     │
│ ✓ Output: output.mp4 (with transitions & effects)         │
│ ✓ Duration: ~2-3 minutes per image                        │
│ Status: ⚠️ CAUTION (paths + FFmpeg dependency)            │
└─────────┬───────────────────────────────────────────────────┘
          │ output.mp4 (64-256 MB)
          ▼
┌────────────────────────────────────────────────────────────┐
│ Stage 7: PUBLISH TO YOUTUBE                                │
├────────────────────────────────────────────────────────────┤
│ ✓ Execute: node scripts/publish-to-youtube.js             │
│ ✓ Service: Google YouTube API v3                          │
│ ✓ Auth: Service account JSON credentials                  │
│ ✓ Input: output.mp4 + idea for metadata                   │
│ ✓ Output: Video ID + URL                                  │
│ Status: ❌ BROKEN (API method + auth errors)→ ✅ FIXED    │
└─────────┬───────────────────────────────────────────────────┘
          │ { videoId: "xyz...", url: "youtube.com/watch..." }
          ▼
     🎉 SUCCESS!
     Video published to YouTube
```

---

## 🔑 Data Flow Through Pipeline

```
STAGE 1          STAGE 2           STAGE 3         STAGE 4
─────────        ──────────        ──────────      ────────────
[Ideas:10]  →  [Selected]  →  [Prompts]  →  [Images:5]
                    ↓              ↓              ↓
               Idea text    5 + 1 Prompts   URLs/base64
                            ...

STAGE 5          STAGE 6           STAGE 7
───────────      ──────────        ──────────
[Audio.mp3] →  [MP4 Video]  →  [YouTube]
    ↓              ↓               ↓
3 MB audio   120-256 MB    Public URL
```

---

## 🗂️ File & Directory Structure

```
D:\n8n\n8nvideocreationpipeline\
│
├── 📄 README.md                          ← Project overview
├── 📄 PIPELINE.md                        ← Architecture details
├── 📄 spec.json                          ← Video assembly config
├── 📄 package.json                       ← Dependencies (NEEDS FIX: add "type": "module")
│
├── 📁 n8n\
│   └── 📄 three_d_pipeline.json          ← Workflow file (NEEDS PATH FIXES)
│
├── 📁 scripts\
│   ├── 📄 idea-generator.js              ← ❌ BROKEN - API method (FIXED AVAILABLE)
│   ├── 📄 prompt-generator.js            ← ❌ BROKEN - API method (FIXED AVAILABLE)
│   ├── 📄 video-assembler.js             ← ✅ OK (needs FFmpeg)
│   └── 📄 publish-to-youtube.js          ← ❌ BROKEN - API method (FIXED AVAILABLE)
│
├── 💾 .env                               ← Create this! (API keys)
├── 💾 service-account-key.json           ← Create this! (Google credentials)
│
├── 📚 DOCUMENTATION (NEW - I created these):
│   ├── 📕 PROJECT_ANALYSIS.md            ← Complete project analysis
│   ├── 📕 SETUP_GUIDE_WINDOWS_VSCODE.md  ← Step-by-step install guide
│   ├── 📕 CRITICAL_FIXES.md              ← Exact code fixes needed
│   ├── 📕 BROKEN_NODES_ANALYSIS.md       ← Node-by-node breakdown
│   ├── 📕 EXECUTIVE_SUMMARY.md           ← Quick overview
│   ├── 📕 FIXED_CODE_READY.md            ← Production-ready code
│   └── 📕 VISUAL_GUIDE.md                ← This file!
│
└── 📁 node_modules\                      ← Create with: npm install
    └── (all dependencies)
```

---

## 🔴 Issues Severity Map

```
CRITICAL (Must Fix Before Running):
┌─────────────────────────────────────────┐
│ 1. OpenAI API methods wrong (3 files)   │ 🔴 30 min fix
│ 2. Image generation not implemented     │ 🔴 1-2 hr fix
│ 3. Module system config missing         │ 🔴 5 min fix
└─────────────────────────────────────────┘

IMPORTANT (Affects Functionality):
┌─────────────────────────────────────────┐
│ 4. FFmpeg not installed                 │ 🟡 5 min fix
│ 5. Audio generation missing             │ 🟡 2-3 hr fix
│ 6. Workflow paths relative              │ 🟡 10 min fix
└─────────────────────────────────────────┘

MEDIUM (Nice to Have):
┌─────────────────────────────────────────┐
│ 7. No error handling in workflow        │ 🟠 1 hr add
│ 8. No monitoring/logging system         │ 🟠 1-2 hr add
└─────────────────────────────────────────┘
```

---

## 📋 Implementation Checklist

### Phase 1: Environment (15 min)
- [ ] Install Node.js 18+: `node --version`
- [ ] Install FFmpeg: `choco install ffmpeg`
- [ ] Install n8n: `npm install -g n8n`
- [ ] Clone/setup project directory

### Phase 2: Configuration (20 min)
- [ ] Create `.env` file with keys
  ```env
  OPENAI_API_KEY=sk-...
  GOOGLE_APPLICATION_CREDENTIALS=/path/to/creds.json
  ```
- [ ] Download Google service account JSON
- [ ] Verify all keys are valid

### Phase 3: Dependencies (10 min)
- [ ] Run `npm install`
- [ ] Verify packages: `npm list openai`

### Phase 4: Fix Code (40 min)
- [ ] Apply fixes to 3 scripts from FIXED_CODE_READY.md
- [ ] Update package.json ("type": "module")
- [ ] Test scripts manually

### Phase 5: Setup n8n (30 min)
- [ ] Start n8n: `n8n start`
- [ ] Import workflow via UI
- [ ] Add credential configs
- [ ] Update node paths

### Phase 6: Implement Features (3-4 hours)
- [ ] Choose & implement image generation API
- [ ] Add audio/TTS generation script
- [ ] Add error handling nodes
- [ ] Set up logging

### Phase 7: Testing (1-2 hours)
- [ ] Test each node individually
- [ ] Run full pipeline manually
- [ ] Verify video quality
- [ ] Verify YouTube upload

---

## 🚀 Quick Start (5 Steps)

### 1. Install Basics (5 min)
```powershell
choco install ffmpeg
npm install -g n8n
cd D:\n8n\n8nvideocreationpipeline
npm install
```

### 2. Create .env (5 min)
```powershell
# Create .env file with your API keys
# See SETUP_GUIDE_WINDOWS_VSCODE.md for details
```

### 3. Fix Scripts (20 min)
```powershell
# Copy fixed code from FIXED_CODE_READY.md
# Replace 3 broken scripts
# Update package.json
npm install
```

### 4. Start n8n (5 min)
```powershell
n8n start
# Opens at http://localhost:5678
```

### 5. Import & Run (10 min)
```
1. Import n8n/three_d_pipeline.json
2. Configure credentials in UI
3. Trigger workflow manually
4. Check logs
```

---

## 🔧 Troubleshooting Map

```
Problem: "ffmpeg: command not found"
→ Solution: choco install ffmpeg
→ Time: 5 min
→ Guide: SETUP_GUIDE_WINDOWS_VSCODE.md #1.2

Problem: "Cannot find module 'openai'"
→ Solution: npm install
→ Time: 5 min
→ Guide: SETUP_GUIDE_WINDOWS_VSCODE.md #2

Problem: "OPENAI_API_KEY not set"
→ Solution: Create .env file with key
→ Time: 5 min
→ Guide: SETUP_GUIDE_WINDOWS_VSCODE.md #3

Problem: "API call fails: 404 responses.create"
→ Solution: Apply FIXED_CODE_READY.md fixes
→ Time: 20 min
→ Guide: CRITICAL_FIXES.md or FIXED_CODE_READY.md

Problem: "Can't find spec.json"
→ Solution: Use absolute paths in commands
→ Time: 5 min
→ Guide: BROKEN_NODES_ANALYSIS.md #6

Problem: "Generate Images returns nothing"
→ Solution: Implement image generation (TODO)
→ Time: 1-2 hours
→ Guide: CRITICAL_FIXES.md #3

Problem: "YouTube upload fails"
→ Solution: Fix API + check credentials
→ Time: 15 min
→ Guide: CRITICAL_FIXES.md #1C

Problem: "No audio in final video"
→ Solution: Add audio generation stage (MISSING)
→ Time: 2-3 hours
→ Guide: BROKEN_NODES_ANALYSIS.md (footnote)
```

---

## 📚 Documentation Map

When you need help with...

| Topic | Document | Section |
|-------|----------|---------|
| **Project overview** | PROJECT_ANALYSIS.md | Overview |
| **Installation steps** | SETUP_GUIDE_WINDOWS_VSCODE.md | Full guide |
| **Code fixes** | FIXED_CODE_READY.md | All scripts |
| **API methods** | CRITICAL_FIXES.md | Issue #1 |
| **Image generation** | CRITICAL_FIXES.md | Issue #3 |
| **Node configs** | BROKEN_NODES_ANALYSIS.md | Detailed |
| **Quick summary** | EXECUTIVE_SUMMARY.md | Full |
| **Workflow data** | BROKEN_NODES_ANALYSIS.md | Flow |
| **Credentials** | SETUP_GUIDE_WINDOWS_VSCODE.md | Section #3 |
| **Testing** | SETUP_GUIDE_WINDOWS_VSCODE.md | Section #8 |

---

## ✅ Success Indicators

### Stage 1: Environment Ready
```
✓ ffmpeg -version shows ffmpeg
✓ node --version shows v18+
✓ npm list openai shows openai@4.x
✓ .env file exists with keys
```

### Stage 2: Scripts Working
```
✓ node scripts/idea-generator.js outputs JSON array
✓ node scripts/prompt-generator.js outputs { images: [...], video: "..." }
✓ spec.json exists in project root
```

### Stage 3: n8n Running
```
✓ n8n start completes without errors
✓ http://localhost:5678 loads in browser
✓ Workflow imports successfully
✓ Nodes show no error indicators
```

### Stage 4: Workflow Executing
```
✓ Cron trigger activates
✓ "Generate Ideas" node succeeds
✓ Data flows to next node
✓ Logs show no critical errors
```

### Stage 5: Full Pipeline
```
✓ Ideas generated ✓
✓ Prompts created ✓
✓ Images generated ✓
✓ Audio created ✓
✓ Video assembled ✓
✓ Video uploaded to YouTube ✓
```

---

## 💡 Pro Tips

1. **Test independently first**
   ```powershell
   # Before running in n8n, test the script
   node scripts/idea-generator.js
   ```

2. **Monitor token usage**
   - Each run: ~500 tokens = $0.01
   - Calculate costs before scheduling daily

3. **Use mocks in development**
   - Replace API calls with mock data
   - Test workflow logic without using APIs

4. **Enable debugging in n8n**
   - Right-click node → "Execute node"
   - View detailed logs and data

5. **Keep API keys safe**
   - Never commit .env to git
   - Use GitHub secrets for CI/CD
   - Rotate keys regularly

---

## 🎯 Next Action

**👉 Start here:** [SETUP_GUIDE_WINDOWS_VSCODE.md](SETUP_GUIDE_WINDOWS_VSCODE.md)

This will:
1. Walk you through installation
2. Configure environment variables
3. Get n8n running locally
4. Import the workflow
5. Identify remaining issues

Then use **[FIXED_CODE_READY.md](FIXED_CODE_READY.md)** to apply code fixes.

---

## 📞 Quick Commands Reference

```powershell
# Installation
choco install ffmpeg
npm install -g n8n
npm install

# Testing
node scripts/idea-generator.js
$env:OPENAI_API_KEY = 'sk-xxx'; node scripts/prompt-generator.js "test"
ffmpeg -version

# Running n8n
n8n start                    # Starts at http://localhost:5678
n8n start --port 5679        # Different port if 5678 in use

# Troubleshooting
npm list                     # Show installed packages
npm list openai              # Check openai version
npm update                   # Update packages
Test-Path .env              # Check if .env exists
```

