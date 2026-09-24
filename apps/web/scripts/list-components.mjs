import fs from 'fs/promises';
import path from 'path';

const rootDir = process.cwd();
const componentsDir = path.join(rootDir, 'components');
const appDir = path.join(rootDir, 'app');
const outputFile = path.join(rootDir, 'components.md');

const componentPaths = [];

async function findComponents(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Recurse into subdirectories
        // Check if directory is named 'components' OR if it's the root components dir
        if (entry.name === 'components' || fullPath === componentsDir) {
           await findComponentFiles(fullPath); // Scan this components dir
        } else {
           await findComponents(fullPath); // Continue searching other dirs
        }
      }
    }
  } catch (err) {
    // Ignore errors like permission denied for simplicity
    if (err.code !== 'EACCES' && err.code !== 'ENOENT') {
        console.error(`Error reading directory ${dir}:`, err);
    }
  }
}

async function findComponentFiles(componentDir) {
   try {
     const entries = await fs.readdir(componentDir, { withFileTypes: true });
     for (const entry of entries) {
        const fullPath = path.join(componentDir, entry.name);
        if (entry.isDirectory()) {
           await findComponentFiles(fullPath); // Also check subfolders within a components dir
        } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
           // Get relative path for cleaner output
           const relativePath = path.relative(rootDir, fullPath).replace(/\\\\/g, '/');
           componentPaths.push(relativePath);
        }
     }
   } catch (err) {
      if (err.code !== 'EACCES' && err.code !== 'ENOENT') {
         console.error(`Error reading component directory ${componentDir}:`, err);
      }
   }
}


async function generateMarkdown() {
  console.log('Scanning for component files...');
  // Scan root components dir first
  await findComponentFiles(componentsDir);
  // Scan app dir for nested components dirs
  await findComponents(appDir);

  componentPaths.sort(); // Sort alphabetically

  console.log(`Found ${componentPaths.length} component files.`);

  let markdownContent = `# Project Components\n\n`;
  markdownContent += `This file lists all identified *.tsx component files found in the root \`/components\` directory or nested \`components\` subdirectories within \`/app\`.\n\n`;
  markdownContent += `_Generated on: ${new Date().toISOString()}_\n\n`;

  markdownContent += `## Components List\n\n`;
  componentPaths.forEach(filePath => {
    markdownContent += `- \`${filePath}\`\n`;
  });

  try {
    await fs.writeFile(outputFile, markdownContent);
    console.log(`Successfully generated ${outputFile}`);
  } catch (err) {
    console.error(`Error writing ${outputFile}:`, err);
  }
}

generateMarkdown();
