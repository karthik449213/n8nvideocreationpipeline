# n8n Video Pipeline - Critical Fixes Required

## 🔧 Issue #1: OpenAI API Method Errors  

### Current Broken Code

**File: `scripts/idea-generator.js` (Lines 14-19)**
```javascript
const response = await client.responses.create({
  model: 'gpt-4o-mini',
  input: prompt,
  max_output_tokens: 500
});
```

**Problem:** `client.responses.create()` does not exist in OpenAI SDK v4+

---

## ✅ FIXES REQUIRED

### Fix #1A: idea-generator.js

**BEFORE:**
```javascript
import dotenv from 'dotenv';
dotenv.config();
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateIdeas() {
  const prompt = `You are a creative writer specializing in short, 3D-style YouTube films in the spirit of Zack D. Films. Provide 10 unique video concepts, each no more than one sentence.`;

  const response = await client.responses.create({
    model: 'gpt-4o-mini',
    input: prompt,
    max_output_tokens: 500
  });

  // simple parse: split by newline
  const text = response.output_text || '';
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  console.log(JSON.stringify(lines, null, 2));
  return lines;
}

if (require.main === module) {
  generateIdeas().catch(err => { console.error(err); process.exit(1); });
}
```

**AFTER:**
```javascript
import dotenv from 'dotenv';
dotenv.config();
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateIdeas() {
  const prompt = `You are a creative writer specializing in short, 3D-style YouTube films in the spirit of Zack D. Films. Provide 10 unique video concepts, each no more than one sentence.`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a creative writer specializing in short, 3D-style YouTube films in the spirit of Zack D. Films.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: 500,
    temperature: 0.7
  });

  // Extract text from response
  const text = response.choices[0]?.message?.content || '';
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  console.log(JSON.stringify(lines, null, 2));
  return lines;
}

if (require.main === module) {
  generateIdeas().catch(err => { console.error(err); process.exit(1); });
}
```

**Key Changes:**
- `client.responses.create()` ➜ `client.chat.completions.create()`
- `input: prompt` ➜ `messages: [{ role: 'system', content: ... }, { role: 'user', content: prompt }]`
- `max_output_tokens` ➜ `max_tokens`
- `response.output_text` ➜ `response.choices[0].message.content`

---

### Fix #1B: prompt-generator.js

**BEFORE:**
```javascript
import dotenv from 'dotenv';
dotenv.config();
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function createPrompts(idea) {
  const prompt = `You are an expert prompt engineer. Given the video concept: "${idea}", generate:
1. A list of 5 descriptive image prompts, each designed to produce a 3D-rendered cinematic still, with lighting, camera angle, and atmosphere.
2. A single concise video prompt that could be fed to an animation system or used as inspiration for transitions.

Return JSON with keys \"images\" (array of strings) and \"video\" (string).`;

  const response = await client.responses.create({
    model: 'gpt-4o-mini',
    input: prompt,
    max_output_tokens: 800
  });

  const text = response.output_text || '';
  try {
    const data = JSON.parse(text);
    console.log(JSON.stringify(data, null, 2));
    return data;
  } catch (e) {
    console.error('Failed to parse JSON from GPT:', text);
    throw e;
  }
}

if (require.main === module) {
  const idea = process.argv[2] || 'A child discovers a miniature dragon in their backyard';
  createPrompts(idea).catch(err => { console.error(err); process.exit(1); });
}
```

**AFTER:**
```javascript
import dotenv from 'dotenv';
dotenv.config();
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function createPrompts(idea) {
  const prompt = `You are an expert prompt engineer. Given the video concept: "${idea}", generate:
1. A list of 5 descriptive image prompts, each designed to produce a 3D-rendered cinematic still, with lighting, camera angle, and atmosphere.
2. A single concise video prompt that could be fed to an animation system or used as inspiration for transitions.

Return ONLY valid JSON with keys "images" (array of strings) and "video" (string). No additional text.`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert prompt engineer. You always return valid JSON without markdown formatting or additional text.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: 800,
    temperature: 0.7
  });

  const text = response.choices[0]?.message?.content || '';
  try {
    const data = JSON.parse(text);
    console.log(JSON.stringify(data, null, 2));
    return data;
  } catch (e) {
    console.error('Failed to parse JSON from GPT:', text);
    throw e;
  }
}

if (require.main === module) {
  const idea = process.argv[2] || 'A child discovers a miniature dragon in their backyard';
  createPrompts(idea).catch(err => { console.error(err); process.exit(1); });
}
```

---

### Fix #1C: publish-to-youtube.js

**BEFORE:**
```javascript
import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import { google } from 'googleapis';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateMetadata(idea) {
  const prompt = `Create a compelling YouTube title, description, and 10 tags for a short video about "${idea}" in the style of Zack D. Films.`;
  const resp = await client.responses.create({
    model: 'gpt-4o-mini',
    input: prompt,
    max_output_tokens: 300
  });
  const text = resp.output_text || '';
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('metadata parse failed:', text);
    throw e;
  }
}

async function upload(videoPath, idea) {
  // authenticate via GOOGLE_APPLICATION_CREDENTIALS environment variable
  const auth = new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/youtube.upload'] });
  const youtube = google.youtube({ version: 'v3', auth });

  const metadata = await generateMetadata(idea);

  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags || []
      },
      status: {
        privacyStatus: 'public'
      }
    },
    media: {
      body: fs.createReadStream(videoPath)
    }
  });

  console.log('Uploaded video id', res.data.id);
  return res.data;
}

if (require.main === module) {
  const video = process.argv[2] || 'output.mp4';
  const idea = process.argv[3] || 'a mysterious forest adventure';
  upload(video, idea).catch(err => { console.error(err); process.exit(1); });
}
```

**AFTER:**
```javascript
import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import { google } from 'googleapis';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateMetadata(idea) {
  const prompt = `Create a compelling YouTube title (max 100 chars), description (2-3 sentences), and 10 tags for a short video about "${idea}" in the style of Zack D. Films. Return ONLY valid JSON with keys: "title", "description", "tags" (array of strings).`;
  
  const resp = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a YouTube content expert. Return only valid JSON without markdown or extra text.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: 300,
    temperature: 0.7
  });

  const text = resp.choices[0]?.message?.content || '';
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('metadata parse failed:', text);
    throw e;
  }
}

async function upload(videoPath, idea) {
  // Validate video file exists
  if (!fs.existsSync(videoPath)) {
    throw new Error(`Video file not found: ${videoPath}`);
  }

  // authenticate via GOOGLE_APPLICATION_CREDENTIALS environment variable
  const auth = new google.auth.GoogleAuth({ 
    scopes: ['https://www.googleapis.com/auth/youtube.upload'] 
  });
  const youtube = google.youtube({ version: 'v3', auth });

  const metadata = await generateMetadata(idea);

  try {
    const res = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: metadata.title,
          description: metadata.description,
          tags: metadata.tags || [],
          categoryId: '24' // Entertainment category
        },
        status: {
          privacyStatus: 'public'
        }
      },
      media: {
        body: fs.createReadStream(videoPath)
      }
    });

    console.log(JSON.stringify({ videoId: res.data.id, title: metadata.title }));
    return res.data;
  } catch (err) {
    console.error('YouTube upload failed:', err.message);
    throw err;
  }
}

if (require.main === module) {
  const video = process.argv[2] || 'output.mp4';
  const idea = process.argv[3] || 'a mysterious forest adventure';
  upload(video, idea).catch(err => { console.error(err); process.exit(1); });
}
```

---

## 🔧 Issue #2: Import/Module System Mismatch

**BEFORE (package.json):**
```json
{
  "name": "video-creation-pipeline",
  "version": "1.0.0",
  "description": "Automated pipeline for generating 3D-style short videos",
  "main": "index.js",
  "scripts": {
    "idea": "node scripts/idea-generator.js",
    "prompts": "node scripts/prompt-generator.js",
    "assemble": "node scripts/video-assembler.js",
    "publish": "node scripts/publish-to-youtube.js"
  },
  "dependencies": {
    "openai": "^4.0.0",
    "axios": "^1.0.0",
    "fluent-ffmpeg": "^2.1.2",
    "googleapis": "^118.0.0",
    "dotenv": "^16.0.0"
  }
}
```

**AFTER (package.json):**
```json
{
  "name": "video-creation-pipeline",
  "version": "1.0.0",
  "description": "Automated pipeline for generating 3D-style short videos",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "idea": "node scripts/idea-generator.js",
    "prompts": "node scripts/prompt-generator.js",
    "assemble": "node scripts/video-assembler.js",
    "publish": "node scripts/publish-to-youtube.js"
  },
  "dependencies": {
    "openai": "^4.0.0",
    "axios": "^1.0.0",
    "fluent-ffmpeg": "^2.1.2",
    "googleapis": "^118.0.0",
    "dotenv": "^16.0.0"
  }
}
```

**Key Change:** Added `"type": "module"` to enable ES6 imports

---

## 🖼️ Issue #3: Image Generation Placeholder

**File: n8n Workflow "Generate Images" Node**

**Current Broken Code:**
```javascript
// placeholder for image downloads or API calls
return items;
```

**Solution A: Using Stable Diffusion (Free/Cheap)**
```javascript
const axios = require('axios');

async function generateImages(prompts) {
  const apiKey = process.env.STABILITY_API_KEY;
  const images = [];
  
  for (const prompt of prompts) {
    try {
      const response = await axios.post(
        'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
        {
          text_prompts: [{ text: prompt, weight: 1 }],
          steps: 30,
          width: 1024,
          height: 1024,
          samples: 1,
          cfg_scale: 7,
          sampler_id: 'k_dpmpp_2m'
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const base64Image = response.data.artifacts[0].base64;
      images.push({
        data: base64Image,
        prompt: prompt
      });
    } catch (error) {
      console.error(`Failed to generate image for prompt "${prompt}":`, error.message);
    }
  }
  
  return images;
}
```

**Solution B: Using DALL·E (Via OpenAI)**
```javascript
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateImages(prompts) {
  const images = [];
  
  for (const prompt of prompts) {
    try {
      const response = await client.images.generate({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard'
      });
      
      images.push({
        url: response.data[0].url,
        prompt: prompt
      });
    } catch (error) {
      console.error(`Failed to generate image for "${prompt}":`, error.message);
    }
  }
  
  return images;
}
```

**Solution C: Using Midjourney (via API)**
```javascript
import axios from 'axios';

async function generateImages(prompts) {
  const apiKey = process.env.MIDJOURNEY_API_KEY;
  const images = [];
  
  for (const prompt of prompts) {
    try {
      const response = await axios.post(
        'https://api.midjourney.com/v1/imagine',
        { prompt },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      images.push({
        url: response.data.url,
        prompt: prompt
      });
    } catch (error) {
      console.error(`Failed to generate image for "${prompt}":`, error.message);
    }
  }
  
  return images;
}
```

**For n8n Workflow: Replace Function Node with:**
```javascript
// In n8n function node, access the prompts from upstream node
const prompts = $json.images; // Array from prompt-generator

const images = [];
for (const prompt of prompts) {
  // Call your image generation API
  // For now, return placeholder
  images.push({
    url: 'https://via.placeholder.com/1024x1024?text=' + encodeURI(prompt),
    prompt: prompt
  });
}

return [{ json: { images } }];
```

---

## 🎬 Issue #4: Video Assembly Working Directory

**File: n8n Workflow "Assemble Video" Node**

**Current Issue:**
```
Command: node scripts/video-assembler.js spec.json
Problem: spec.json path is relative; working directory unknown
```

**Fix Option A: Use Absolute Path**
```
Command: node scripts/video-assembler.js "d:\n8n\n8nvideocreationpipeline\spec.json"
```

**Fix Option B: Set Working Directory First**
In n8n, before the executeCommand node, add a **Function** node:
```javascript
return [{ json: { 
  workingDir: process.cwd(),
  specPath: './spec.json'
} }];
```

Then use in executeCommand:
```
Command: cd "d:\n8n\n8nvideocreationpipeline" && node scripts/video-assembler.js spec.json
```

---

## 📊 n8n Workflow Node Configuration Checklist

### Node 1: Cron Trigger ✅
```json
{
  "parameters": {
    "triggerTimes": {
      "item": [{ "hour": 0, "minute": 0 }]
    }
  },
  "name": "Cron",
  "type": "n8n-nodes-base.cron",
  "position": [250, 300]
}
```
**Status:** OK - No changes needed

---

### Node 2: Generate Ideas ✅ (After Script Fix)
```json
{
  "parameters": {
    "command": "cd d:\\n8n\\n8nvideocreationpipeline && node scripts/idea-generator.js",
    "options": {}
  },
  "name": "Generate Ideas",
  "type": "n8n-nodes-base.executeCommand",
  "position": [450, 300]
}
```
**Changes:**
- Add full path: `cd d:\\n8n\\n8nvideocreationpipeline && `
- Fix script (use corrected idea-generator.js)

---

### Node 3: Select Idea ✅
```javascript
// Improved function node
const ideas = JSON.parse(items[0].json.stdout || items[0].json.output || '[]');
if (!Array.isArray(ideas) || ideas.length === 0) {
  throw new Error('No ideas generated');
}
return [{ json: { selectedIdea: ideas[0] } }];
```

---

### Node 4: Create Prompts ✅ (After Script Fix)
```json
{
  "parameters": {
    "command": "cd d:\\n8n\\n8nvideocreationpipeline && node scripts/prompt-generator.js \"{{ $json.selectedIdea }}\"",
    "options": {}
  },
  "name": "Create Prompts",
  "type": "n8n-nodes-base.executeCommand",
  "position": [850, 300]
}
```

---

### Node 5: Generate Images ✅ (Implement Real API)
```javascript
// Use one of the solutions above
const prompts = $json.images || [];
const images = [];

for (const prompt of prompts) {
  // Implement actual API call to Stable Diffusion, DALL-E, or Midjourney
  images.push({
    url: 'https://via.placeholder.com/1024x1024',
    prompt: prompt
  });
}

return [{ json: { images, prompts } }];
```

---

### Node 6: Assemble Video ✅
```json
{
  "parameters": {
    "command": "cd d:\\n8n\\n8nvideocreationpipeline && node scripts/video-assembler.js spec.json",
    "options": {}
  },
  "name": "Assemble Video",
  "type": "n8n-nodes-base.executeCommand",
  "position": [1250, 300]
}
```

---

### Node 7: Publish ✅ (After Script Fix)
```json
{
  "parameters": {
    "command": "cd d:\\n8n\\n8nvideocreationpipeline && OPENAI_API_KEY=$OPENAI_API_KEY GOOGLE_APPLICATION_CREDENTIALS=$GOOGLE_APPLICATION_CREDENTIALS node scripts/publish-to-youtube.js output.mp4 \"{{ $json.selectedIdea }}\"",
    "options": {}
  },
  "name": "Publish",
  "type": "n8n-nodes-base.executeCommand",
  "position": [1450, 300]
}
```

---

## 🧪 Testing Each Fix

### Step 1: Test Idea Generator
```bash
cd d:\n8n\n8nvideocreationpipeline
npm install
set OPENAI_API_KEY=sk-xxxxx
node scripts/idea-generator.js
```
**Expected Output:**
```json
[
  "A mysterious robot discovers...",
  "An underwater kingdom...",
  ...
]
```

### Step 2: Test Prompt Generator
```bash
set OPENAI_API_KEY=sk-xxxxx
node scripts/prompt-generator.js "A mysterious robot discovers emotions"
```
**Expected Output:**
```json
{
  "images": [
    "A futuristic robot with glowing eyes...",
    ...
  ],
  "video": "Smooth pan across a dystopian landscape..."
}
```

### Step 3: Test Video Assembler
```bash
node scripts/video-assembler.js spec.json
```
**Expected Output:**
```
video assembled to output.mp4
```

### Step 4: Test YouTube Upload
```bash
set OPENAI_API_KEY=sk-xxxxx
set GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
node scripts/publish-to-youtube.js output.mp4 "Test video"
```

---

## 📝 Summary of Changes

| File | Change | Priority |
|------|--------|----------|
| scripts/idea-generator.js | Fix API method | 🔴 CRITICAL |
| scripts/prompt-generator.js | Fix API method | 🔴 CRITICAL |
| scripts/publish-to-youtube.js | Fix API method | 🔴 CRITICAL |
| package.json | Add "type": "module" | 🔴 CRITICAL |
| scripts/video-assembler.js | Implement image generation | 🔴 CRITICAL |
| n8n workflow | Update paths & node configs | 🟡 IMPORTANT |

