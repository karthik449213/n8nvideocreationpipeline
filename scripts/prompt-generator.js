// Transforms a selected idea into image and video prompts using GPT

import dotenv from 'dotenv';
dotenv.config();
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function createPrompts(idea) {
  const systemPrompt = `You are an expert prompt engineer specializing in 3D animation and cinematic visuals.
Your job is to create detailed, descriptive prompts for image generation software.
Every prompt should be specific about:
- Camera angle and perspective
- Lighting quality and mood
- 3D render style and quality
- Atmosphere and composition
Return ONLY valid JSON. No markdown formatting, no backticks, no extra text.`;

  const userPrompt = `For this video concept: "${idea}"

Generate two things:

1. An array called "images" with exactly 5 detailed image prompts. Each prompt should describe a specific camera shot/scene in cinematic detail, including:
   - What is shown (subject, environment, objects)
   - Camera angle (wide, closeup, overhead, etc.)
   - Lighting (moody, bright, shadows, color palette)
   - Style (photorealistic, 3D rendered, cinematic)
   - Mood and atmosphere

2. A string called "video" with a single comprehensive prompt that could guide the overall video editing, transitions, and motion graphics.

Return ONLY this JSON format:
{
  "images": ["prompt 1", "prompt 2", "prompt 3", "prompt 4", "prompt 5"],
  "video": "overall video direction and transitions"
}

No markdown, no extra text, just the JSON object.`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: userPrompt
      }
    ],
    max_tokens: 1000,
    temperature: 0.7
  });

  const text = response.choices[0]?.message?.content || '';
  let data;
  try {
    data = JSON.parse(text);
  } catch (parseError) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    data = JSON.parse(jsonMatch[0]);
  }
  
  if (!data.images || !Array.isArray(data.images) || data.images.length === 0) {
    throw new Error('Response missing valid "images" array');
  }
  if (!data.video || typeof data.video !== 'string') {
    throw new Error('Response missing valid "video" string');
  }
  
  console.log(JSON.stringify(data, null, 2));
  return data;
}

if (require.main === module) {
  const idea = process.argv[2] || 'A child discovers a miniature dragon in their backyard';
  createPrompts(idea).catch(err => { console.error(err); process.exit(1); });
}
