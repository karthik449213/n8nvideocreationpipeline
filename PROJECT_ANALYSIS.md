# n8n Video Creation Pipeline - Comprehensive Analysis

**Date:** February 26, 2026  
**Project:** Automated 3D-Style Short Video Pipeline  
**Platform:** n8n (non-Docker)

---

## 📋 Project Overview

This is an **end-to-end automated video creation pipeline** that orchestrates 7 major stages:
1. Idea Generation (GPT)
2. Prompt Engineering (GPT → Image Prompts)
3. Image Generation (Placeholder - needs implementation)
4. Video Assembly (ffmpeg)
5. Publishing to YouTube (Google APIs)
6. Cron-triggered or Webhook-triggered execution

---

## 🔧 How to Run the Project

### **Option 1: n8n Standalone (Recommended for Non-Docker)**

#### Prerequisites
```bash
# 1. Ensure Node.js 18+ is installed
node --version

# 2. Install n8n globally
npm install -g n8n

# 3. Copy project to a working directory
# The scripts will be referenced from n8n nodes

# 4. Install project dependencies
cd d:\n8n\n8nvideocreationpipeline
npm install
```

#### Starting n8n
```bash
# Start n8n server (default: http://localhost:5678)
n8n start

# Or in foreground for debugging
n8n start --no-daemon
```

#### Import Workflow
1. Open **http://localhost:5678** in your browser
2. Click **Settings** → **Import Workflows**
3. Select file: `n8n/three_d_pipeline.json`
4. Click **Import**

#### Configure Credentials
In n8n UI:
1. Go to **Settings** → **Credentials**
2. Create new credentials for:
   - **OpenAI**: Set `OPENAI_API_KEY`
   - **Google Cloud**: Set `GOOGLE_APPLICATION_CREDENTIALS`
3. Link credentials in each node that requires them

---

### **Option 2: n8n with VS Code (Development Setup)**

#### Setup
```bash
# 1. Clone n8n repository and install
git clone https://github.com/n8n-io/n8n.git
cd n8n
npm install
npm run build

# 2. In separate terminal, run dev mode
npm run dev

# 3. In another terminal, from project directory
cd d:\n8n\n8nvideocreationpipeline
npm install
```

#### Debugging in VS Code
1. Open VS Code at n8n project root
2. Add breakpoint in Custom Function nodes
3. Debug tab → Select "Run n8n dev" configuration
4. Trigger workflow from UI

---

## 🔑 Exact Keys Required

### **Required Environment Variables** (Set in `.env` file)

```env
# OpenAI API
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx

# Google Cloud (For YouTube Upload)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# Optional (for image generation)
IMAGE_API_KEY=your-image-api-key
STABILITY_API_KEY=sk-xxxxxxxxxxxx
MIDJOURNEY_API_KEY=xxxx

# Optional (for TTS)
ELEVENLABS_API_KEY=xxxx
```

### **How to Obtain Keys:**

1. **OpenAI API Key**
   - Go to https://platform.openai.com/api-keys
   - Create new secret key
   - Copy and paste to .env

2. **Google Cloud Credentials**
   - Go to Google Cloud Console
   - Create Service Account with YouTube API v3 access
   - Generate JSON key file
   - Download and set path in .env

3. **Storage Access** (if using Cloud Storage)
   - AWS S3: Access Key ID + Secret Key
   - Google Cloud Storage: Already in service account JSON

---

## ❌ BROKEN NODES & ISSUES FOUND

### **Issue 1: OpenAI API Method Error (ALL SCRIPTS)**
**Location:** `scripts/idea-generator.js`, `scripts/prompt-generator.js`, `scripts/publish-to-youtube.js`

**Problem:**
```javascript
// ❌ WRONG - This method doesn't exist in OpenAI v4
const response = await client.responses.create({
  model: 'gpt-4o-mini',
  input: prompt,
  max_output_tokens: 500
});
```

**Fix Required:**
```javascript
// ✅ CORRECT - Use chat.completions.create()
const response = await client.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: 'You are a creative writer...' },
    { role: 'user', content: prompt }
  ],
  max_tokens: 500,
  temperature: 0.7
});
const text = response.choices[0].message.content;
```

**Scripts Affected:**
- ❌ idea-generator.js (Line 14)
- ❌ prompt-generator.js (Line 14)
- ❌ publish-to-youtube.js (Line 11)

---

### **Issue 2: Import/Require Syntax Mismatch**
**Location:** All script files

**Problem:**
```javascript
// Scripts use ES6 imports but don't have "type": "module" in package.json
import dotenv from 'dotenv';
import OpenAI from 'openai';
```

**Fix Required:**
Add to `package.json`:
```json
{
  "type": "module",
  ...
}
```

---

### **Issue 3: Generate Images Node is a Placeholder**
**Location:** n8n workflow → "Generate Images" node

**Current State:**
```javascript
// ❌ PLACEHOLDER - Does nothing
functionCode: "return items;"
```

**What's Missing:**
- No actual image generation API calls
- No integration with Stable Diffusion, DALL·E, or Midjourney
- Hard to continue workflow without actual images

**Solution Required:**
Implement one of these:
```javascript
// Option A: Stable Diffusion API
async function generateImages(prompts) {
  const images = [];
  for (const prompt of prompts) {
    const response = await fetch('https://api.stability.ai/v1/generate', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.STABILITY_API_KEY}` },
      body: JSON.stringify({ prompt, samples: 1, steps: 30 })
    });
    const data = await response.json();
    images.push(data.artifacts[0].base64);
  }
  return images;
}

// Option B: DALL·E API
async function generateImages(prompts) {
  const images = [];
  for (const prompt of prompts) {
    const image = await client.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024'
    });
    images.push(image.data[0].url);
  }
  return images;
}
```

---

### **Issue 4: Data Flow/Parsing Issues**
**Location:** Multiple nodes

| Node | Issue | Fix |
|------|-------|-----|
| **Generate Ideas** | Script outputs JSON to stdout; node may not capture properly | Wrap command: `node scripts/idea-generator.js 2>&1` |
| **Select Idea** | Assumes `items[0].json.stdout` exists; may be `items[0].json.output` | Fix data extraction: `${$json.stdout}` or check executeCommand output format |
| **Create Prompts** | Passes idea from upstream; template syntax correct but needs validation | Validate the variable is extracted: `"{{$json['idea']}}"`  |
| **Assemble Video** | References `spec.json` with relative path; working directory unknown | Use absolute path or ensure spec.json is in n8n working directory |
| **Publish** | `output.mp4` also relative path | Ensure video is created in correct directory |

---

### **Issue 5: Missing Error Handling**
**Problem:** No error nodes or error handlers in workflow

**Consequence:** If any step fails, the entire workflow stops without retry or notification

**Solution:** Add error handling nodes in n8n:
1. Insert **Error Trigger** nodes after critical steps
2. Add **Notification** node (Email, Slack) to alert on failure
3. Add **Log** nodes to track execution

---

### **Issue 6: FFmpeg Dependency**
**Location:** `scripts/video-assembler.js`

**Requirement:** FFmpeg must be installed on the machine running n8n

**Installation:**
```bash
# Windows (using Chocolatey)
choco install ffmpeg

# Windows (manual)
# Download from https://ffmpeg.org/download.html
# Add to PATH

# Verify installation
ffmpeg -version
```

If not installed, the "Assemble Video" node will fail with `ffmpeg command not found` error.

---

### **Issue 7: Google Cloud Authentication**
**Location:** `scripts/publish-to-youtube.js` Line 27

**Problem:** Relies on `GOOGLE_APPLICATION_CREDENTIALS` environment variable pointing to service account JSON

**What Can Go Wrong:**
- Path doesn't exist → Authentication fails
- Service account doesn't have YouTube API v3 enabled → Permission denied
- Key is expired/revoked → Authentication fails

**Verification:**
```bash
# Check if file exists
Test-Path "C:\path\to\service-account-key.json"

# Check if credentials are valid
node -e "const creds = require('./service-account-key.json'); console.log(creds.project_id);"
```

---

### **Issue 8: Shell Command Execution Nodes**
**Location:** All `executeCommand` nodes (Generate Ideas, Create Prompts, Assemble Video, Publish)

**Potential Issues:**
- Working directory may not be set to project root
- Scripts can't find `spec.json` or other relative references
- Command shell (PowerShell vs CMD) may affect path handling on Windows

**Solution:**
Before each executeCommand node, use a **Set** node to establish context:
```json
{
  "WORKING_DIR": "d:/n8n/n8nvideocreationpipeline",
  "NODE_PATH": "d:/n8n/n8nvideocreationpipeline/node_modules"
}
```

Or modify executeCommand to use full paths:
```
cd d:\n8n\n8nvideocreationpipeline && node scripts/idea-generator.js
```

---

## 📋 Node Workflow Status

| Node | Type | Status | Issue |
|------|------|--------|-------|
| **Cron** | Cron Trigger | ✅ OK | Triggers daily at 00:00 |
| **Generate Ideas** | Execute Command | ❌ BROKEN | API method wrong; stdout parsing unsafe |
| **Select Idea** | Function | ⚠️ CAUTION | Depends on upstream fix |
| **Create Prompts** | Execute Command | ❌ BROKEN | API method wrong |
| **Generate Images** | Function | ❌ BROKEN | Placeholder - not implemented |
| **Assemble Video** | Execute Command | ⚠️ CAUTION | FFmpeg dependency + path issues |
| **Publish** | Execute Command | ❌ BROKEN | API method wrong; auth issues |

---

## 🚀 Step-by-Step Execution Plan

### **Phase 1: Environment Setup**
- [ ] Install Node.js 18+
- [ ] Install n8n globally: `npm install -g n8n`
- [ ] Install FFmpeg on system
- [ ] Create `.env` file with API keys
- [ ] Run `npm install` in project directory

### **Phase 2: Fix Broken Scripts**
- [ ] Fix OpenAI API calls in all scripts (use `chat.completions.create()`)
- [ ] Add `"type": "module"` to package.json
- [ ] Implement actual image generation in "Generate Images" node
- [ ] Test each script independently:
  ```bash
  OPENAI_API_KEY=sk-xxxx npm run idea
  OPENAI_API_KEY=sk-xxxx npm run prompts
  npm run assemble
  ```

### **Phase 3: Set Up n8n Workflow**
- [ ] Start n8n: `n8n start`
- [ ] Import workflow: `n8n/three_d_pipeline.json`
- [ ] Add error handling nodes and notifications
- [ ] Configure credentials in n8n UI
- [ ] Set working directory context in initial nodes

### **Phase 4: Test Each Node**
- [ ] Trigger manually in n8n UI and check logs
- [ ] Verify data flows correctly between nodes
- [ ] Check file outputs in expected locations
- [ ] Monitor console for errors

### **Phase 5: Production Deployment**
- [ ] Set up YouTube channel and link service account
- [ ] Configure notification system (Slack/Email on errors)
- [ ] Set up log storage (database or Google Sheets)
- [ ] Enable scheduled execution

---

## 📁 Critical File Locations

- **Workflow Definition:** [n8n/three_d_pipeline.json](n8n/three_d_pipeline.json)
- **Scripts Directory:** [scripts/](scripts/)
- **Config File:** [spec.json](spec.json) (must be in project root)
- **Dependencies:** [package.json](package.json)
- **Environment:** `.env` (create manually in project root)

---

## 🔍 Testing Commands

```bash
# Test idea generation
OPENAI_API_KEY=sk-xxxx node scripts/idea-generator.js

# Test prompt generation
OPENAI_API_KEY=sk-xxxx node scripts/prompt-generator.js "A child discovers a dragon"

# Test video assembly (with valid spec.json)
node scripts/video-assembler.js spec.json

# Test YouTube upload
OPENAI_API_KEY=sk-xxxx GOOGLE_APPLICATION_CREDENTIALS=./creds.json node scripts/publish-to-youtube.js output.mp4 "Test idea"
```

---

## ⚠️ Summary of Issues

| Priority | Issue | Impact | Status |
|----------|-------|--------|--------|
| 🔴 HIGH | OpenAI API method wrong | All GPT nodes fail | Must fix before running |
| 🔴 HIGH | Image generation placeholder | Workflow incomplete | Must implement |
| 🟡 MEDIUM | Missing FFmpeg | Video assembly fails | Install system dependency |
| 🟡 MEDIUM | Import/require syntax | Scripts won't run | Add "type": "module" |
| 🟡 MEDIUM | Data flow parsing issues | Nodes can't communicate | Fix node configuration |
| 🟠 LOW | Missing error handling | Silent failures | Add error nodes |
| 🟠 LOW | Path issues | Files not found | Use absolute paths |

---

## 💡 Next Steps

1. **Fix the three script files** with correct OpenAI API syntax
2. **Implement image generation** in the Generate Images node
3. **Install FFmpeg** and test video assembly
4. **Set up n8n locally** and import the workflow
5. **Configure credentials** and run a test execution
6. **Add monitoring and error handling** for production use

