import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';
import fs from 'fs';
import path from 'path';

async function generateImages(prompts) {
  const apiKey = process.env.STABILITY_API_KEY;
  
  if (!apiKey) {
    console.error('Warning: STABILITY_API_KEY not set. Using placeholder images.');
    // Return placeholder images for testing
    const images = prompts.map((prompt, i) => ({
      url: `https://via.placeholder.com/1024x1024?text=${encodeURIComponent(prompt.substring(0, 30))}`,
      prompt: prompt,
      index: i
    }));
    console.log(JSON.stringify({ images, count: images.length }, null, 2));
    return images;
  }

  const images = [];
  
  for (const prompt of prompts) {
    try {
      console.error(`Generating image for: ${prompt.substring(0, 50)}...`);
      
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
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.artifacts && response.data.artifacts.length > 0) {
        const base64Image = response.data.artifacts[0].base64;
        const fileName = `frame_${images.length + 1}.png`;
        const framesDir = path.join(process.cwd(), 'frames');
        
        // Create frames directory if it doesn't exist
        if (!fs.existsSync(framesDir)) {
          fs.mkdirSync(framesDir, { recursive: true });
        }
        
        const filePath = path.join(framesDir, fileName);
        const imageBuffer = Buffer.from(base64Image, 'base64');
        fs.writeFileSync(filePath, imageBuffer);
        
        images.push({
          path: filePath,
          url: `file://${filePath}`,
          prompt: prompt,
          index: images.length
        });
        
        console.error(`✓ Saved: ${filePath}`);
      }
    } catch (error) {
      console.error(`Failed to generate image for prompt "${prompt}":`, error.message);
      // Continue with next prompt instead of failing
    }
  }
  
  console.log(JSON.stringify({
    images: images,
    count: images.length,
    prompts: prompts
  }, null, 2));
  
  return images;
}

if (require.main === module) {
  // Parse command line arguments - if passed as JSON string
  const argsString = process.argv[2];
  let prompts = [];
  
  try {
    if (argsString) {
      prompts = JSON.parse(argsString);
    }
  } catch (e) {
    // If not JSON, use as single prompt
    prompts = [argsString || 'A futuristic landscape with mountains'];
  }

  if (!Array.isArray(prompts)) {
    prompts = [prompts];
  }

  generateImages(prompts).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export { generateImages };
