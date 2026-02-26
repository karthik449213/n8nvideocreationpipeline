# n8n Setup Guide - Windows Development (VS Code)

## 📋 Prerequisites

- **Windows 10/11 64-bit**
- **Node.js 18+** (Download from https://nodejs.org/)
- **Visual Studio Code** (Download from https://code.visualstudio.com/)
- **FFmpeg** (For video assembly)
- **Git** (For cloning repositories)

---

## 🚀 Quick Setup (15 minutes)

### Step 1: Install Prerequisites

#### 1.1 Install Node.js
```powershell
# Verify Node.js is installed
node --version    # Should output v18+
npm --version     # Should output 9+
```

#### 1.2 Install FFmpeg (Required for video assembly)
```powershell
# Using Chocolatey (Windows package manager)
# If you don't have Chocolatey, install from: https://chocolatey.org/install

choco install ffmpeg

# Verify installation
ffmpeg -version
```

**Alternative (Manual Installation):**
1. Download from https://ffmpeg.org/download.html
2. Extract to `C:\ffmpeg`
3. Add to PATH: 
   - Open Environment Variables
   - Add `C:\ffmpeg\bin` to System Path
4. Verify: `ffmpeg -version` in new PowerShell window

#### 1.3 Verify Git
```powershell
git --version    # Should output git version 2.x+
```

---

### Step 2: Set Up Project Directory

```powershell
# Navigate to your working directory
cd D:\n8n\n8nvideocreationpipeline

# Install project dependencies
npm install

# Verify installation
npm list openai     # Should show openai@4.x.x
npm list googleapis # Should show googleapis@118.x.x
```

---

### Step 3: Configure Environment Variables

Create a `.env` file in the project root (`D:\n8n\n8nvideocreationpipeline\.env`):

```env
# Required: OpenAI API Key
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Required: Google Cloud Service Account Credentials
GOOGLE_APPLICATION_CREDENTIALS=D:\n8n\n8nvideocreationpipeline\service-account-key.json

# Optional: For image generation services
STABILITY_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
MIDJOURNEY_API_KEY=xxx
ELEVENLABS_API_KEY=xxx

# n8n Configuration
N8N_EDITOR_BASE_URL=http://localhost:5678

# Node.js environment
NODE_ENV=development
```

**How to Get These Keys:**

1. **OPENAI_API_KEY:**
   - Go to https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Copy and paste into .env

2. **GOOGLE_APPLICATION_CREDENTIALS:**
   - Go to https://console.cloud.google.com/
   - Create a new project
   - Enable YouTube API v3
   - Create a Service Account
   - Generate JSON key
   - Download and save to: `D:\n8n\n8nvideocreationpipeline\service-account-key.json`
   - Set path in .env

---

### Step 4: Install n8n

#### Option A: Global Installation (Simplest)
```powershell
npm install -g n8n@latest

# Verify
n8n --version

# Start n8n
n8n start

# Access at http://localhost:5678
```

**Keep terminal running!** n8n will output logs.

---

#### Option B: Local Installation (For Development)
```powershell
cd D:\n8n\n8nvideocreationpipeline

# Install n8n locally
npm install --save-dev n8n

# Create npm script
# Edit package.json and add to "scripts":
# "n8n": "n8n start"

# Start
npm run n8n
```

---

### Step 5: Import Workflow in n8n

1. **Start n8n** (from Step 4)
2. **Open browser:** http://localhost:5678
3. **First-time setup:** Create admin user account
4. **Import workflow:**
   - Click **Menu** → **Workflows** → **Import Workflow**
   - Select: `D:\n8n\n8nvideocreationpipeline\n8n\three_d_pipeline.json`
   - Click Import

---

### Step 6: Configure Credentials in n8n

In n8n UI:

1. **Settings** → **Credentials**
2. **Create New:** 
   - Type: "OpenAI"
   - API Key: (paste from your .env)
3. **Create New:**
   - Type: "Google Cloud"
   - Upload service account JSON

---

### Step 7: Update Workflow Nodes

Each node needs to reference the correct working directory:

#### For Each "Execute Command" Node:
1. Open node settings
2. Update command to include full path:

**Example - Generate Ideas node:**
```
Before: node scripts/idea-generator.js
After:  cd D:\n8n\n8nvideocreationpipeline && node scripts/idea-generator.js
```

---

## 🔍 Running with VS Code Debugging

### Step 1: Open Project in VS Code
```powershell
cd D:\n8n\n8nvideocreationpipeline
code .
```

### Step 2: Create VS Code Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "n8n Development",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/n8n/bin/n8n",
      "args": ["start"],
      "restart": true,
      "console": "integratedTerminal",
      "env": {
        "NODE_ENV": "development",
        "N8N_LOCAL_DIR": "${workspaceFolder}"
      }
    },
    {
      "name": "Test Script: Idea Generator",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/scripts/idea-generator.js",
      "console": "integratedTerminal",
      "env": {
        "OPENAI_API_KEY": "${env:OPENAI_API_KEY}"
      }
    },
    {
      "name": "Test Script: Prompt Generator",
      "type": "node",
      "request": "launch",
      "args": ["A child discovers a dragon"],
      "program": "${workspaceFolder}/scripts/prompt-generator.js",
      "console": "integratedTerminal",
      "env": {
        "OPENAI_API_KEY": "${env:OPENAI_API_KEY}"
      }
    }
  ]
}
```

### Step 3: Start Debugging
1. Press **F5** or **Debug** → **Start Debugging**
2. Select configuration to run
3. Set breakpoints with **Ctrl+K, Ctrl+B**
4. Step through code with **F10** (step over) or **F11** (step into)

---

## 🧪 Testing Each Component Independently

### Test 1: OpenAI Connection
```powershell
$env:OPENAI_API_KEY = "sk-xxxxx"
node scripts/idea-generator.js

# Expected output: JSON array of 10 ideas
```

### Test 2: Prompt Generation
```powershell
$env:OPENAI_API_KEY = "sk-xxxxx"
node scripts/prompt-generator.js "A robot discovers emotions"

# Expected output: JSON with "images" array and "video" string
```

### Test 3: FFmpeg Installation
```powershell
ffmpeg -version

# Expected: FFmpeg version info
```

### Test 4: Video Assembly
```powershell
# Create test spec.json first
@{
  images = @("frame1.png", "frame2.png")
  audio = "narration.mp3"
  output = "output.mp4"
} | ConvertTo-Json | Out-File spec.json

# Then run assembler
node scripts/video-assembler.js spec.json
```

### Test 5: YouTube Upload (Optional)
```powershell
$env:OPENAI_API_KEY = "sk-xxxxx"
$env:GOOGLE_APPLICATION_CREDENTIALS = "D:\n8n\n8nvideocreationpipeline\service-account-key.json"
node scripts/publish-to-youtube.js output.mp4 "Test Video"

# Expected: Video ID and title in JSON format
```

---

## 📊 Directory Structure After Setup

```
D:\n8n\
  n8nvideocreationpipeline/
    ├── .env                           # Environment variables (CREATE THIS)
    ├── .vscode/
    │   └── launch.json               # VS Code debug config (CREATE THIS)
    ├── node_modules/                 # Dependencies (created by npm install)
    ├── n8n/
    │   └── three_d_pipeline.json     # Workflow file
    ├── scripts/
    │   ├── idea-generator.js         # NEEDS FIX
    │   ├── prompt-generator.js       # NEEDS FIX
    │   ├── video-assembler.js        # OK (needs ffmpeg)
    │   └── publish-to-youtube.js     # NEEDS FIX
    ├── service-account-key.json      # Google credentials (CREATE THIS)
    ├── spec.json                     # Video spec template
    ├── package.json                  # NEEDS UPDATE ("type": "module")
    ├── README.md
    ├── PIPELINE.md
    ├── PROJECT_ANALYSIS.md           # This analysis
    └── CRITICAL_FIXES.md             # Detailed fixes
```

---

## ⚠️ Common Issues & Solutions

### Issue: "command not found: ffmpeg"
**Solution:**
```powershell
# Verify FFmpeg is in PATH
$env:Path -split ';' | Select-String ffmpeg

# If not found, reinstall and add to PATH
# Or run full path:
C:\ffmpeg\bin\ffmpeg -version
```

### Issue: "Cannot find module 'openai'"
**Solution:**
```powershell
cd D:\n8n\n8nvideocreationpipeline
npm install
npm list openai    # Verify it's installed
```

### Issue: "OPENAI_API_KEY is not defined"
**Solution:**
```powershell
# Set environment variable
$env:OPENAI_API_KEY = "sk-xxxxx"

# Or create .env file (recommended)
# And use: npm install -g dotenv
```

### Issue: "GOOGLE_APPLICATION_CREDENTIALS file not found"
**Solution:**
```powershell
# Download service account JSON from Google Cloud Console
# Save to exact path: D:\n8n\n8nvideocreationpipeline\service-account-key.json

# Verify file exists
Test-Path "D:\n8n\n8nvideocreationpipeline\service-account-key.json"
```

### Issue: n8n Port 5678 Already in Use
**Solution:**
```powershell
# Find process using port 5678
netstat -ano | findstr :5678

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# Or use different port
n8n start --listen 0.0.0.0 --port 5679
```

### Issue: "ES6 import not supported"
**Solution:**
```json
// Ensure package.json has:
{
  "type": "module"
}
```

---

## 📋 Workflow Execution Flow (Detailed)

### 1. **Cron Trigger** (Daily at 00:00)
```
Activates daily at midnight → Passes empty data to next node
```

### 2. **Generate Ideas Node**
```
✓ Runs: node scripts/idea-generator.js
✓ Sends request to OpenAI GPT-4o-mini
✓ Receives: Array of 10 video concepts
✓ Output saved in: items[0].json.stdout
```

### 3. **Select Idea Node**
```
✓ Parses JSON from stdout
✓ Extracts first (best) idea
✓ Passes to next node: { selectedIdea: "..." }
```

### 4. **Create Prompts Node**
```
✓ Runs: node scripts/prompt-generator.js "idea text"
✓ Sends to GPT-4o-mini
✓ Receives: { images: [...], video: "..." }
✓ 5-8 image prompts generated
```

### 5. **Generate Images Node** (PLACEHOLDER)
```
✓ Currently returns items unchanged
❌ NEEDS IMPLEMENTATION to call:
  - Stable Diffusion API, or
  - DALL-E API, or
  - Midjourney API
✓ Should produce: URLs or base64 images
```

### 6. **Assemble Video Node**
```
✓ Runs: node scripts/video-assembler.js spec.json
✓ Reads spec.json (must exist in working dir)
✓ Uses ffmpeg to create video
✓ Applies transitions and audio
✓ Output: output.mp4
```

### 7. **Publish Node**
```
✓ Runs: node scripts/publish-to-youtube.js output.mp4 idea
✓ Generates title/description via GPT
✓ Authenticates to YouTube API
✓ Uploads video
✓ Returns: Video ID
```

---

## 🎯 Success Criteria

Your setup is complete when:

- [ ] `npm install` completes without errors
- [ ] `node scripts/idea-generator.js` outputs JSON array
- [ ] `ffmpeg -version` shows FFmpeg is installed
- [ ] n8n starts and opens at http://localhost:5678
- [ ] Workflow imports successfully
- [ ] Cron trigger is active (scheduled)
- [ ] Each node has correct working directory path
- [ ] You can see logs in n8n UI when nodes execute
- [ ] Test execution completes all 7 nodes

---

## 🔒 Security Best Practices

1. **Never commit .env file** (add to .gitignore)
   ```
   echo ".env" >> .gitignore
   ```

2. **Rotate API keys regularly**
   - Update OPENAI_API_KEY monthly
   - Regenerate Google service account keys annually

3. **Use service account** (not personal Google account)
   - Create dedicated YouTube channel for automation
   - Use separate Google Cloud project

4. **Monitor execution**
   - Enable n8n logging to file
   - Set up failure notifications (email/Slack)
   - Archive workflow executions

---

## 📞 Quick Reference

| Task | Command |
|------|---------|
| Start n8n | `npm install -g n8n && n8n start` |
| Test idea generator | `$env:OPENAI_API_KEY='sk-xxx'; node scripts/idea-generator.js` |
| Check FFmpeg | `ffmpeg -version` |
| View processes | `netstat -ano` |
| Kill port 5678 | `netstat -ano \| findstr :5678` → `taskkill /PID <PID> /F` |
| List npm packages | `npm list` |
| Update packages | `npm update` |

---

## ✅ Next Steps After Setup

1. **Fix the 3 broken scripts** (see CRITICAL_FIXES.md)
2. **Implement image generation** in the "Generate Images" node
3. **Test each node individually** with sample data
4. **Configure error handling** (add error notification nodes)
5. **Set up monitoring** (Google Sheets logging)
6. **Enable scheduled execution** (test with cron)
7. **Review YouTube channel** (verify videos upload correctly)

