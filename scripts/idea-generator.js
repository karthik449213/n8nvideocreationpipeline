// Generates a list of potential video ideas using OpenAI GPT

import dotenv from 'dotenv';
dotenv.config();
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateIdeas() {
  const systemPrompt = `You are a creative writer specializing in short, 3D-style YouTube films in the spirit of Zack D. Films. 
Your videos are mysterious, cinematic, and visually stunning with deep storytelling. 
Each concept should be unique, engaging, and suitable for visual effects and animation.`;

  const userPrompt = `Generate exactly 10 unique video concepts for a 3D-style short film. 
Each concept should be:
- One sentence only
- Mysterious and intriguing
- Visually cinematic
- Suitable for 3D animation/effects

Format as a JSON array with exactly 10 strings. No markdown, no explanation, just the JSON array.`;

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
    max_tokens: 500,
    temperature: 0.7
  });

  // Extract and parse JSON response
  const text = response.choices[0]?.message?.content || '';
  let lines;
  try {
    lines = JSON.parse(text);
    if (!Array.isArray(lines)) throw new Error('Response is not an array');
  } catch (e) {
    const jsonMatch = text.match(/\[\s*[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Could not extract JSON from response: ' + text);
    lines = JSON.parse(jsonMatch[0]);
  }
  console.log(JSON.stringify(lines, null, 2));
  return lines;
}

if (require.main === module) {
  generateIdeas().catch(err => { console.error(err); process.exit(1); });
}
