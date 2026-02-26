import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

async function generateAudio(text, voiceId = '21m00Tcm4TlvDq8ikWAM') {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    console.error('Warning: ELEVENLABS_API_KEY not set. Creating test audio with ffmpeg.');
    
    // Create a silent audio file for testing
    const audioDir = path.join(process.cwd(), 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }
    
    const audioPath = path.join(audioDir, 'narration.mp3');
    
    try {
      // Create 30 seconds of silence as placeholder
      execSync(`ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 30 -q:a 9 -acodec libmp3lame "${audioPath}" -y`, {
        stdio: 'pipe'
      });
      
      console.error(`✓ Created placeholder audio: ${audioPath}`);
      console.log(JSON.stringify({
        audioPath: audioPath,
        duration: 30,
        format: 'mp3',
        size: fs.statSync(audioPath).size
      }, null, 2));
      
      return { audioPath, duration: 30 };
    } catch (error) {
      console.error('Failed to create placeholder audio. Make sure FFmpeg is installed.');
      console.error('Error:', error.message);
      process.exit(1);
    }
  }

  try {
    console.error(`Generating audio with ElevenLabs API (${text.length} characters)...`);
    
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
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

    // Save audio file
    const audioDir = path.join(process.cwd(), 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const audioPath = path.join(audioDir, 'narration.mp3');
    fs.writeFileSync(audioPath, response.data);
    
    const stats = fs.statSync(audioPath);
    console.error(`✓ Audio saved: ${audioPath} (${(stats.size / 1024).toFixed(2)} KB)`);
    
    console.log(JSON.stringify({
      audioPath: audioPath,
      size: stats.size,
      format: 'mp3'
    }, null, 2));
    
    return { audioPath };

  } catch (error) {
    console.error('Error generating audio:', error.message);
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.statusText);
    }
    process.exit(1);
  }
}

async function generateScript(idea) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not set');
  }

  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey });

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a screenwriter for short cinematic films. Write engaging, poetic narration scripts.'
      },
      {
        role: 'user',
        content: `Write a short narration script (2-3 minutes of spoken audio, about 300-400 words) for a 3D-style cinematic short film about: "${idea}". 
        
The script should:
- Be engaging and mysterious
- Sound natural when spoken
- Include vivid imagery descriptions
- Be suitable for text-to-speech narration
- Have natural pacing and pauses

Write ONLY the script text, no stage directions or extra formatting.`
      }
    ],
    max_tokens: 500,
    temperature: 0.7
  });

  const script = response.choices[0]?.message?.content || '';
  console.error('✓ Generated script:', script.substring(0, 100) + '...');
  return script;
}

if (require.main === module) {
  const idea = process.argv[2] || 'A mysterious journey through a hidden realm';
  
  (async () => {
    try {
      console.error(`Generating audio for idea: "${idea}"`);
      console.error('Step 1: Generating script from idea...');
      const script = await generateScript(idea);
      
      console.error('Step 2: Converting script to audio...');
      await generateAudio(script);
      
    } catch (error) {
      console.error('Fatal error:', error.message);
      process.exit(1);
    }
  })();
}

export { generateAudio, generateScript };
