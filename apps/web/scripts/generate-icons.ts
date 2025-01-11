import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

const ICONS = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
  { name: 'mstile-150x150.png', size: 150 }
];

async function generateIcons() {
  const inputFile = path.join(process.cwd(), 'public', 'img', 'dfda-icon.svg');
  
  try {
    // Ensure input file exists
    await fs.access(inputFile);
    
    // Generate each icon
    for (const icon of ICONS) {
      const outputFile = path.join(process.cwd(), 'public', icon.name);
      
      await sharp(inputFile)
        .resize(icon.size, icon.size)
        .png()
        .toFile(outputFile);
      
      console.log(`Generated ${icon.name}`);
    }
    
    console.log('All icons generated successfully!');
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'ENOENT') {
        console.error('Error: dfda-icon.svg not found in public directory');
      } else {
        console.error('Error generating icons:', error);
      }
    } else {
      console.error('Error generating icons:', error);
    }
    process.exit(1);
  }
}

generateIcons(); 