const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');

async function findAppRoot() {
  // Start from current directory and look for package.json
  let currentDir = process.cwd();
  while (currentDir !== path.parse(currentDir).root) {
    try {
      const packagePath = path.join(currentDir, 'package.json');
      await fs.access(packagePath);
      return currentDir;
    } catch {
      currentDir = path.dirname(currentDir);
    }
  }
  // If no package.json found, fallback to cwd
  return process.cwd();
}

async function getAllImages(docsDir) {
  // Find all image files (common web formats)
  const imageFiles = await glob('**/*.{png,jpg,jpeg,gif,webp,svg}', {
    cwd: docsDir,
    absolute: true,
    nodir: true,
    ignore: ['node_modules/**', '.git/**']
  });
  
  return imageFiles;
}

async function findImageReferences(appRoot) {
  // Get all markdown files in the project
  const mdFiles = await glob('**/*.{md,mdx}', {
    cwd: appRoot,
    absolute: true,
    nodir: true,
    ignore: ['node_modules/**', '.git/**', '.next/**', 'dist/**']
  });
  
  const imageRefs = new Set();
  
  for (const mdFile of mdFiles) {
    const content = await fs.readFile(mdFile, 'utf-8');
    
    // Match markdown image syntax: ![alt](path) or <img src="path">
    const markdownImageRegex = /!\[.*?\]\((.*?)\)|<img[^>]+src=["']([^"']+)["']/g;
    let match;
    
    while ((match = markdownImageRegex.exec(content)) !== null) {
      // match[1] is from ![alt](path), match[2] is from <img src="path">
      const imagePath = match[1] || match[2];
      if (imagePath) {
        // Get just the filename
        const filename = path.basename(imagePath);
        imageRefs.add(filename);
      }
    }
  }
  
  return imageRefs;
}

async function main() {
  try {
    const appRoot = await findAppRoot();
    console.log(`Using app root: ${appRoot}`);
    
    const docsDir = path.join(appRoot, 'docs');
    console.log(`Looking for docs in: ${docsDir}`);
    
    // Ensure docs directory exists
    try {
      await fs.access(docsDir);
    } catch {
      console.error('Docs directory not found at:', docsDir);
      process.exit(1);
    }
    
    console.log('Finding all images in docs folder...');
    const imageFiles = await getAllImages(docsDir);
    console.log(`Found ${imageFiles.length} images`);
    
    console.log('Searching for image references in markdown files...');
    const imageRefs = await findImageReferences(appRoot);
    console.log(`Found ${imageRefs.size} unique image references`);
    
    // Find unused images
    const unusedImages = imageFiles.filter(imagePath => {
      const filename = path.basename(imagePath);
      return !imageRefs.has(filename);
    });
    
    if (unusedImages.length === 0) {
      console.log('No unused images found!');
      return;
    }
    
    console.log(`\nFound ${unusedImages.length} unused images:`);
    for (const imagePath of unusedImages) {
      console.log(`- ${path.relative(appRoot, imagePath)}`);
    }
    
    // Confirm before deleting
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      readline.question('\nDo you want to delete these images? (yes/no): ', resolve);
    });
    readline.close();
    
    if (answer.toLowerCase() === 'yes') {
      console.log('\nDeleting unused images...');
      for (const imagePath of unusedImages) {
        await fs.unlink(imagePath);
        console.log(`Deleted: ${path.relative(appRoot, imagePath)}`);
      }
      console.log('Cleanup complete!');
    } else {
      console.log('Operation cancelled.');
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 