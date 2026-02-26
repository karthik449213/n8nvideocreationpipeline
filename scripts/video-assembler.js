// Assemble images and audio into a final MP4 using ffmpeg

import dotenv from 'dotenv';
dotenv.config();
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';

// expects a JSON file describing assets { images: [...], audio: "path/to/file.mp3", output: "out.mp4" }
async function assemble(specPath) {
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
  const { images, audio, output } = spec;

  if (!images.length || !audio || !output) {
    throw new Error('invalid spec');
  }

  // build an ffmpeg command: each image shown for 3 seconds with simple fade
  let command = ffmpeg();
  images.forEach(img => command = command.input(img));
  command.input(audio);

  // filter complex to create slideshow
  const filter = [];
  images.forEach((img, i) => {
    filter.push(`[${i}:v]fade=t=in:st=0:d=1,fade=t=out:st=2:d=1[v${i}]`);
  });
  const concat = images.map((_, i) => `[v${i}]`).join('') + `concat=n=${images.length}:v=1:a=0[outv]`;
  filter.push(concat);

  command
    .complexFilter(filter)
    .outputOptions('-map [outv]', '-map ' + images.length + ':a')
    .videoCodec('libx264')
    .audioCodec('aac')
    .save(output)
    .on('end', () => console.log('video assembled to', output))
    .on('error', err => console.error('ffmpeg error', err));
}

if (require.main === module) {
  const spec = process.argv[2] || 'spec.json';
  assemble(spec).catch(e => { console.error(e); process.exit(1); });
}
