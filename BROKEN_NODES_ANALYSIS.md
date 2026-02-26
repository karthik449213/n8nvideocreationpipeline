# n8n Workflow - Broken Nodes Analysis & Fixes

## 🔴 Workflow Status Summary

| Node | Type | Status | Issue | Severity |
|------|------|--------|-------|----------|
| 1. Cron | Trigger | ✅ OK | Triggers correctly | N/A |
| 2. Generate Ideas | Execute Cmd | ❌ BROKEN | OpenAI API method error | 🔴 CRITICAL |
| 3. Select Idea | Function | ⚠️ DEPENDS | Works if upstream fixed | 🟡 MEDIUM |
| 4. Create Prompts | Execute Cmd | ❌ BROKEN | OpenAI API method error | 🔴 CRITICAL |
| 5. Generate Images | Function | ❌ BROKEN | Placeholder only | 🔴 CRITICAL |
| 6. Assemble Video | Execute Cmd | ⚠️ CAUTION | Path issues, FFmpeg required | 🟡 MEDIUM |
| 7. Publish | Execute Cmd | ❌ BROKEN | OpenAI API error, Auth missing | 🔴 CRITICAL |

---

## 🔗 Current Workflow Connections (As-Is)

```
┌─────────┐
│  Cron   │ (0:00 daily)
└────┬────┘
     │
     ▼
┌─────────────────────┐
│ Generate Ideas      │ ❌ API method wrong
└────────┬────────────┘
         │
         ▼
┌──────────────┐
│ Select Idea  │ ⚠️ Depends on fix
└────┬─────────┘
     │
     ▼
┌──────────────────┐
│ Create Prompts   │ ❌ API method wrong
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Generate Images  │ ❌ Placeholder only
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Assemble Video   │ ⚠️ Path issues
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Publish to YT    │ ❌ API method wrong
└──────────────────┘
```

---

## 📋 Detailed Node Analysis

### NODE 1: Cron Trigger
**Status:** ✅ **WORKING**

**Configuration:**
```json
{
  "name": "Cron",
  "type": "n8n-nodes-base.cron",
  "parameters": {
    "triggerTimes": {
      "item": [
        {
          "hour": 0,
          "minute": 0
        }
      ]
    }
  },
  "position": [250, 300]
}
```

**Output:** Empty object `{}`

**Notes:** 
- Triggers reliably at specified time
- No configuration needed

---

### NODE 2: Generate Ideas
**Status:** ❌ **BROKEN**

**Current (Broken) Configuration:**
```json
{
  "name": "Generate Ideas",
  "type": "n8n-nodes-base.executeCommand",
  "parameters": {
    "command": "node scripts/idea-generator.js",
    "options": {}
  },
  "position": [450, 300]
}
```

**Broken Script Code (idea-generator.js):**
```javascript
const response = await client.responses.create({  // ❌ WRONG
  model: 'gpt-4o-mini',
  input: prompt,                                   // ❌ WRONG
  max_output_tokens: 500                          // ❌ WRONG
});
const text = response.output_text || '';          // ❌ WRONG
```

**Problems:**
1. `client.responses.create()` doesn't exist
2. Should use `client.chat.completions.create()`
3. Message format is wrong
4. Response parsing is wrong
5. Working directory may be wrong

**Fixed Configuration:**
```json
{
  "name": "Generate Ideas",
  "type": "n8n-nodes-base.executeCommand",
  "parameters": {
    "command": "cd D:\\n8n\\n8nvideocreationpipeline && node scripts/idea-generator.js",
    "options": {}
  },
  "position": [450, 300]
}
```

**Fixed Script (idea-generator.js):**
```javascript
const response = await client.chat.completions.create({  // ✅ CORRECT
  model: 'gpt-4o-mini',
  messages: [                                             // ✅ CORRECT
    {
      role: 'system',
      content: 'You are a creative writer...'
    },
    {
      role: 'user',
      content: prompt
    }
  ],
  max_tokens: 500                                        // ✅ CORRECT
});
const text = response.choices[0]?.message?.content || ''; // ✅ CORRECT
```

**Expected Output:**
```json
{
  "stdout": "[\"Idea 1\", \"Idea 2\", ..., \"Idea 10\"]",
  "stderr": "",
  "return_code": 0
}
```

---

### NODE 3: Select Idea
**Status:** ⚠️ **DEPENDS ON FIX**

**Current Configuration:**
```json
{
  "name": "Select Idea",
  "type": "n8n-nodes-base.function",
  "parameters": {
    "functionCode": "// choose first idea\nconst ideas = JSON.parse(items[0].json.stdout);\nreturn [{ json: { idea: ideas[0] } }];"
  },
  "position": [650, 300]
}
```

**Problems:**
1. Assumes `items[0].json.stdout` exists (may be different)
2. No error handling for parse failures
3. Selects first idea (OK for demo, but could use scoring)

**Fixed Configuration:**
```json
{
  "name": "Select Idea",
  "type": "n8n-nodes-base.function",
  "parameters": {
    "functionCode": "// Parse and select first idea\ntry {\n  let ideas;\n  if (items[0].json.stdout) {\n    ideas = JSON.parse(items[0].json.stdout);\n  } else if (items[0].json.output) {\n    ideas = JSON.parse(items[0].json.output);\n  } else {\n    throw new Error('No output found from ideas generator');\n  }\n  \n  if (!Array.isArray(ideas) || ideas.length === 0) {\n    throw new Error('Ideas array is empty');\n  }\n  \n  return [{ json: { selectedIdea: ideas[0] } }];\n} catch (error) {\n  return [{ json: { error: error.message } }];\n}"
  },
  "position": [650, 300]
}
```

**Expected Output:**
```json
{
  "selectedIdea": "A mysterious robot discovers emotions in a robot graveyard"
}
```

---

### NODE 4: Create Prompts
**Status:** ❌ **BROKEN**

**Current (Broken) Configuration:**
```json
{
  "name": "Create Prompts",
  "type": "n8n-nodes-base.executeCommand",
  "parameters": {
    "command": "node scripts/prompt-generator.js \"{{$json[\"idea\"]}}\"",
    "options": {}
  },
  "position": [850, 300]
}
```

**Issues:**
1. Variable reference might be wrong: `$json["idea"]` vs `$json["selectedIdea"]`
2. Script has broken OpenAI API call
3. Working directory not set

**Fixed Configuration:**
```json
{
  "name": "Create Prompts",
  "type": "n8n-nodes-base.executeCommand",
  "parameters": {
    "command": "cd D:\\n8n\\n8nvideocreationpipeline && node scripts/prompt-generator.js \"{{ $json.selectedIdea }}\"",
    "options": {}
  },
  "position": [850, 300]
}
```

**Expected Output:**
```json
{
  "stdout": "{\"images\": [\"A robot in a graveyard...\", ...], \"video\": \"Smooth pan across...\"}",
  "stderr": "",
  "return_code": 0
}
```

---

### NODE 5: Generate Images
**Status:** ❌ **PLACEHOLDER - NEEDS IMPLEMENTATION**

**Current (Broken) Configuration:**
```json
{
  "name": "Generate Images",
  "type": "n8n-nodes-base.function",
  "parameters": {
    "functionCode": "// placeholder for image downloads or API calls\nreturn items;"
  },
  "position": [1050, 300]
}
```

**Problems:**
1. Does absolutely nothing
2. Workflow can continue, but no images are generated
3. This is the critical missing piece

**Fixed Configuration (Option A - Stable Diffusion):**
```json
{
  "name": "Generate Images",
  "type": "n8n-nodes-base.function",
  "parameters": {
    "functionCode": "const axios = require('axios');\n\n// Extract prompts from upstream\nlet prompts = [];\nif (items[0].json.stdout) {\n  try {\n    const parsed = JSON.parse(items[0].json.stdout);\n    prompts = parsed.images || [];\n  } catch (e) {\n    console.log('Could not parse prompts, using mock');\n  }\n}\n\nconst apiKey = process.env.STABILITY_API_KEY;\nif (!apiKey) {\n  throw new Error('STABILITY_API_KEY not set');\n}\n\nconst images = [];\nfor (const prompt of prompts) {\n  try {\n    const response = await axios.post(\n      'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',\n      {\n        text_prompts: [{ text: prompt, weight: 1 }],\n        steps: 30,\n        width: 1024,\n        height: 1024,\n        samples: 1,\n        cfg_scale: 7,\n        sampler_id: 'k_dpmpp_2m'\n      },\n      {\n        headers: {\n          'Authorization': `Bearer ${apiKey}`,\n          'Content-Type': 'application/json'\n        }\n      }\n    );\n    \n    const base64 = response.data.artifacts[0].base64;\n    images.push({\n      base64: base64,\n      prompt: prompt\n    });\n  } catch (error) {\n    console.error(`Failed to generate image for prompt: ${prompt}`, error.message);\n    images.push({ error: error.message });\n  }\n}\n\nreturn [{ json: { images: images, count: images.length } }];"
  },
  "position": [1050, 300]
}
```

**Fixed Configuration (Option B - DALL-E 3):**
```json
{
  "name": "Generate Images",
  "type": "n8n-nodes-base.http",
  "parameters": {
    "method": "POST",
    "url": "https://api.openai.com/v1/images/generations",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "openAiApi",
    "sendQuery": false,
    "sendBody": true,
    "bodyParametersUi": "json",
    "bodyParameters": "{\"model\": \"dall-e-3\", \"prompt\": \"{{ $json.images[0] }}\", \"n\": 1, \"size\": \"1024x1024\"}"
  },
  "position": [1050, 300]
}
```

**For Development (Mock Images):**
```json
{
  "name": "Generate Images",
  "type": "n8n-nodes-base.function",
  "parameters": {
    "functionCode": "// Parse prompts from upstream\nlet imagePrompts = [];\nif (items[0].json.stdout) {\n  try {\n    const parsed = JSON.parse(items[0].json.stdout);\n    imagePrompts = parsed.images || [];\n  } catch (e) {\n    imagePrompts = ['A futuristic scene'];\n  }\n}\n\n// For development, return placeholder URLs\nconst images = imagePrompts.map((prompt, i) => ({\n  url: `https://via.placeholder.com/1024x1024?text=${encodeURIComponent(prompt.substring(0, 30))}`,\n  prompt: prompt,\n  index: i\n}));\n\nreturn [{ json: { images: images, count: images.length } }];"
  },
  "position": [1050, 300]
}
```

**Expected Output:**
```json
{
  "images": [
    {
      "url": "https://example.com/image1.png",
      "prompt": "A robot in a graveyard with glowing eyes"
    },
    {
      "url": "https://example.com/image2.png",
      "prompt": "Close-up of robot face"
    }
  ],
  "count": 5
}
```

---

### NODE 6: Assemble Video
**Status:** ⚠️ **CAUTION - PATH ISSUES**

**Current Configuration:**
```json
{
  "name": "Assemble Video",
  "type": "n8n-nodes-base.executeCommand",
  "parameters": {
    "command": "node scripts/video-assembler.js spec.json",
    "options": {}
  },
  "position": [1250, 300]
}
```

**Issues:**
1. Works directory unclear
2. `spec.json` path is relative
3. FFmpeg must be installed
4. Generated images must exist
5. Audio file must exist (not generated by pipeline yet)

**Fixed Configuration:**
```json
{
  "name": "Assemble Video",
  "type": "n8n-nodes-base.executeCommand",
  "parameters": {
    "command": "cd D:\\n8n\\n8nvideocreationpipeline && node scripts/video-assembler.js spec.json",
    "options": {}
  },
  "position": [1250, 300]
}
```

**Prerequisites:**
1. FFmpeg installed: `ffmpeg -version`
2. spec.json exists in project root
3. Frame images in `/frames/` directory
4. Audio file at `/audio/narration.mp3`

**spec.json Example:**
```json
{
  "images": [
    "frames/frame1.png",
    "frames/frame2.png",
    "frames/frame3.png",
    "frames/frame4.png",
    "frames/frame5.png"
  ],
  "audio": "audio/narration.mp3",
  "output": "output.mp4"
}
```

**Expected Output:**
```
video assembled to output.mp4
```

---

### NODE 7: Publish to YouTube
**Status:** ❌ **BROKEN - API & AUTH ISSUES**

**Current (Broken) Configuration:**
```json
{
  "name": "Publish",
  "type": "n8n-nodes-base.executeCommand",
  "parameters": {
    "command": "node scripts/publish-to-youtube.js output.mp4 \"{{$json[\"idea\"]}}\"",
    "options": {}
  },
  "position": [1450, 300]
}
```

**Issues:**
1. Variable reference wrong: should be `selectedIdea`
2. Script has broken OpenAI API call
3. Google authentication not set up
4. Working directory not set
5. Environment variables not passed

**Fixed Configuration:**
```json
{
  "name": "Publish",
  "type": "n8n-nodes-base.executeCommand",
  "parameters": {
    "command": "cd D:\\n8n\\n8nvideocreationpipeline && set OPENAI_API_KEY=%OPENAI_API_KEY% && set GOOGLE_APPLICATION_CREDENTIALS=%GOOGLE_APPLICATION_CREDENTIALS% && node scripts/publish-to-youtube.js output.mp4 \"{{ $json.selectedIdea }}\"",
    "options": {}
  },
  "position": [1450, 300]
}
```

**Prerequisites:**
1. `.env` file with credentials
2. `service-account-key.json` downloaded
3. YouTube API v3 enabled
4. Service account has uploader role
5. `output.mp4` exists from previous node

**Expected Output:**
```json
{
  "videoId": "dQw4w9WgXcQ",
  "title": "A Robot's Journey Through Time"
}
```

---

## 🔄 Fixed Workflow Connections (Recommended)

```
┌─────────────────────┐
│  Cron | Daily 0:00  │
└──────────┬──────────┘
           │
           ▼
    ┌──────────────────┐
    │ Generate Ideas   │ ✅ Fixed API call
    │ [Script Fixed]   │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Select Idea      │ ✅ Better error handling
    │ [Function]       │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Create Prompts   │ ✅ Fixed API call
    │ [Script Fixed]   │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Generate Images  │ ✅ Real API or Stable Diffusion
    │ [Implemented]    │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Assemble Video   │ ⚠️ Needs audio generation step
    │ [Paths Fixed]    │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Generate Audio   │ 🆕 MISSING STEP - Needs TTS
    │ [NEW NODE]       │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Publish to YT    │ ✅ Fixed API call & auth
    │ [Script Fixed]   │
    └──────────────────┘
             │
             ▼
        Success! ✅
```

---

## ⚠️ Critical Missing Step: TTS (Text-to-Speech)

**Current Issue:** Workflow goes from "Create Prompts" to "Assembly", but there's no audio narration generated!

**Solution: Add Audio Generation Node**

**New Node: Generate Audio**
```json
{
  "name": "Generate Audio",
  "type": "n8n-nodes-base.executeCommand",
  "parameters": {
    "command": "cd D:\\n8n\\n8nvideocreationpipeline && node scripts/audio-generator.js",
    "options": {}
  },
  "position": [1150, 300]
}
```

**New Script: scripts/audio-generator.js**
```javascript
import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';
import fs from 'fs';
import path from 'path';

async function generateAudio(text) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY not set');
  }

  const response = await axios.post(
    'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM',
    {
      text: text,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    },
    {
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer'
    }
  );

  const outputPath = path.join(process.cwd(), 'audio', 'narration.mp3');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, response.data);
  
  console.log(JSON.stringify({ audioPath: outputPath }));
}

if (require.main === module) {
  const script = process.argv[2] || 'Imagine a world where robots feel emotion...';
  generateAudio(script).catch(err => { console.error(err); process.exit(1); });
}
```

---

## 📊 Broken Nodes Quick Fix Checklist

- [ ] **Script #1: idea-generator.js**
  - Replace `client.responses.create()` with `client.chat.completions.create()`
  - Update message format
  - Fix response parsing

- [ ] **Script #2: prompt-generator.js**
  - Replace `client.responses.create()` with `client.chat.completions.create()`
  - Update message format
  - Fix response parsing

- [ ] **Script #3: publish-to-youtube.js**
  - Replace `client.responses.create()` with `client.chat.completions.create()`
  - Update message format
  - Fix response parsing
  - Fix video path validation

- [ ] **package.json**
  - Add `"type": "module"`

- [ ] **n8n Workflow (three_d_pipeline.json)**
  - Update all `executeCommand` nodes with `cd D:\n8n\...` prefix
  - Update variable references: `{{$json.selectedIdea}}`
  - Add error handling nodes
  - Implement "Generate Images" function

- [ ] **Missing: TTS Node**
  - Add "Generate Audio" node between "Create Prompts" and "Assemble Video"
  - Create script: scripts/audio-generator.js

---

## ✅ Validation Test

Run this PowerShell script to validate fixes:

```powershell
# Test 1: Check Node.js
node --version

# Test 2: Check npm packages
npm list openai

# Test 3: Check FFmpeg
ffmpeg -version

# Test 4: Test idea generator
$env:OPENAI_API_KEY = "sk-xxxx"
node scripts/idea-generator.js

# Test 5: Test prompt generator
node scripts/prompt-generator.js "A robot discovers emotions"

# Test 6: Check n8n
npm install -g n8n
n8n --version

# Test 7: Start n8n and import workflow
n8n start
# Then open http://localhost:5678 and import workflow
```

