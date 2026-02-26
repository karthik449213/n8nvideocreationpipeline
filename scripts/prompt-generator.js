// Transforms a selected idea into image and video prompts using GPT

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
