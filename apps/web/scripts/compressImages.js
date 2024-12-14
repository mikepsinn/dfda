const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const { glob } = require('glob');

async function findRepoRoot() {
  // Start from current directory and move up until we find .git
  let currentDir = process.cwd();
  while (currentDir !== path.parse(currentDir).root) {
    try {
      await fs.access(path.join(currentDir, '.git'));
      return currentDir;
    } catch {
      currentDir = path.dirname(currentDir);
    }
  }
  // If no .git found, fallback to cwd
  return process.cwd();
}

async function findLargePngFiles(dir) {
  const pngFiles = await glob('**/*.png', { 
    cwd: dir,
    ignore: ['node_modules/**', '.next/**', 'dist/**', '.git/**'],
    absolute: true,
    nodir: true
  });
  
  const largePngs = [];
  
  for (const file of pngFiles) {
    const stats = await fs.stat(file);
    if (stats.size > 500 * 1024) { // > 500kb
      largePngs.push(file);
    }
  }
  
  return largePngs;
}

async function compressAndReplacePng(pngPath) {
  const jpgPath = pngPath.replace(/\.png$/i, '.jpg');
  
  try {
    // Compress PNG to JPG
    await sharp(pngPath)
      .jpeg({
        quality: 80,
        mozjpeg: true
      })
      .toFile(jpgPath);
      
    // Delete original PNG after successful compression
    await fs.unlink(pngPath);
    
    return jpgPath;
  } catch (error) {
    console.error(`Error processing ${pngPath}:`, error);
    throw error;
  }
}

async function updateMarkdownFiles(oldPath, newPath, repoRoot) {
  const mdFiles = await glob('**/*.md', {
    cwd: repoRoot,
    ignore: ['node_modules/**', '.next/**', 'dist/**', '.git/**'],
    absolute: true,
    nodir: true
  });
  
  // Get just the filenames for replacement
  const oldName = path.basename(oldPath);
  const newName = path.basename(newPath);
  
  for (const mdFile of mdFiles) {
    const content = await fs.readFile(mdFile, 'utf-8');
    
    if (content.includes(oldName)) {
      // Replace the old filename with new one, preserving the path structure if any
      const updatedContent = content.replace(
        new RegExp(oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        newName
      );
      
      await fs.writeFile(mdFile, updatedContent, 'utf-8');
      console.log(`Updated references in ${path.relative(repoRoot, mdFile)}`);
    }
  }
}

async function main() {
  try {
    const repoRoot = await findRepoRoot();
    console.log(`Using repository root: ${repoRoot}`);
    
    const largePngs = await findLargePngFiles(repoRoot);
    console.log(`Found ${largePngs.length} PNG files larger than 500KB`);
    
    for (const pngPath of largePngs) {
      const relativePath = path.relative(repoRoot, pngPath);
      console.log(`Processing: ${relativePath}`);
      
      const jpgPath = await compressAndReplacePng(pngPath);
      await updateMarkdownFiles(pngPath, jpgPath, repoRoot);
      
      console.log(`Converted ${path.basename(pngPath)} to ${path.basename(jpgPath)}`);
    }
    
    console.log('Image compression and markdown updates completed!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 