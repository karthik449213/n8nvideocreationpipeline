// Generates a list of potential video ideas using OpenAI GPT

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
