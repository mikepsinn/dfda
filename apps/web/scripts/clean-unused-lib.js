const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);

// Helper function to extract all exports from a file
async function extractExports(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    const names = new Set();

    // Match various export patterns
    const patterns = [
      // Named exports
      /export\s+(?:const|function|class|interface|type|let|var)\s+([a-zA-Z0-9_$]+)/g,
      // Default exports
      /export\s+default\s+(?:const|function|class|interface|type)?\s*([a-zA-Z0-9_$]+)/g,
      // Direct exports
      /export\s+{\s*([^}]+)\s*}/g,
      // Type exports
      /export\s+type\s+([a-zA-Z0-9_$]+)/g,
      // Interface exports
      /export\s+interface\s+([a-zA-Z0-9_$]+)/g
    ];

    for (const pattern of patterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          // Handle multiple exports in a single statement (e.g., export { A, B, C })
          const exports = match[1].split(',').map(e => e.trim().split(' as ')[0]);
          exports.forEach(exp => names.add(exp));
        }
      }
    }

    return Array.from(names);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return [];
  }
}

// Find all files in lib directory
async function findAllLibFiles() {
  const libFiles = glob.sync('lib/**/*.{ts,tsx,js,jsx}', {
    ignore: [
      '**/*.test.{ts,tsx,js,jsx}',
      '**/*.spec.{ts,tsx,js,jsx}',
      '**/tests/**',
      '**/node_modules/**'
    ]
  });
  
  const files = new Map(); // Map of file paths to their exports
  
  for (const file of libFiles) {
    const exports = await extractExports(file);
    files.set(file, exports);
  }
  
  return files;
}

// Check if a file or its exports are used anywhere in the project
async function findFileUsage(filePath, exports) {
  const allFiles = glob.sync('{app,components,lib,pages,src}/**/*.{ts,tsx,jsx,js}', {
    ignore: [
      '**/*.test.{ts,tsx,js,jsx}',
      '**/*.spec.{ts,tsx,js,jsx}',
      '**/tests/**',
      '**/node_modules/**',
      filePath // Ignore the file itself
    ]
  });

  // Convert file path to potential import paths
  const filePathWithoutExt = filePath.replace(/\.[^/.]+$/, '');
  const possibleImports = [
    filePath,
    filePathWithoutExt,
    '@/' + filePath,
    '@/' + filePathWithoutExt,
    '../' + filePath,
    '../' + filePathWithoutExt,
    './' + filePath,
    './' + filePathWithoutExt
  ];

  for (const file of allFiles) {
    try {
      const content = await readFile(file, 'utf8');

      // Check for direct file imports
      for (const importPath of possibleImports) {
        if (content.includes(importPath)) {
          return false; // File is used
        }
      }

      // Check for usage of exports
      for (const exportName of exports) {
        const regex = new RegExp(`\\b${exportName}\\b`);
        if (regex.test(content)) {
          return false; // Export is used
        }
      }
    } catch (error) {
      console.error(`Error reading file ${file}:`, error);
    }
  }
  
  return true; // File appears to be unused
}

// Helper function to check if directory is empty
function isDirectoryEmpty(dirPath) {
  try {
    const files = fs.readdirSync(dirPath);
    // Filter out .DS_Store files on macOS and Thumbs.db on Windows
    const realFiles = files.filter(file => !/(^|\/)\.[^\/\.]/g.test(file) && file !== 'Thumbs.db');
    return realFiles.length === 0;
  } catch (error) {
    console.error(`Error checking directory ${dirPath}:`, error.message);
    return false;
  }
}

// Helper function to delete empty directories recursively
function deleteEmptyDirs(dirPath) {
  let deletedCount = 0;
  
  function deleteRecursively(dir) {
    if (!fs.existsSync(dir)) return;
    
    // Get all items in directory
    let items;
    try {
      items = fs.readdirSync(dir);
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error.message);
      return;
    }
    
    // Recursively process subdirectories
    for (const item of items) {
      const fullPath = path.join(dir, item);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          deleteRecursively(fullPath);
        }
      } catch (error) {
        console.error(`Error processing ${fullPath}:`, error.message);
      }
    }
    
    // Check if directory is empty after processing subdirectories
    if (isDirectoryEmpty(dir)) {
      try {
        fs.rmdirSync(dir);
        console.log(`✓ Deleted empty directory: ${dir}`);
        deletedCount++;
      } catch (error) {
        console.error(`✗ Error deleting directory ${dir}:`, error.message);
      }
    }
  }
  
  deleteRecursively(dirPath);
  return deletedCount;
}

async function main() {
  console.log('Finding unused files in lib directory...\n');
  console.log('Note: This tool looks for files that are not imported or whose exports are not used anywhere.');
  console.log('Please review the results carefully before deleting any files.\n');
  
  const files = await findAllLibFiles();
  const unusedFiles = new Map();
  let current = 0;
  const total = files.size;
  
  for (const [file, exports] of files) {
    current++;
    process.stdout.write(`Checking files: ${current}/${total}\r`);
    
    const isUnused = await findFileUsage(file, exports);
    if (isUnused) {
      unusedFiles.set(file, exports);
    }
  }
  
  console.log('\n'); // Clear the progress line
  
  // Add statistics
  console.log('Statistics:');
  console.log(`Total files scanned: ${total}`);
  console.log(`Unused files found: ${unusedFiles.size}`);
  console.log(`Usage percentage: ${((total - unusedFiles.size) / total * 100).toFixed(2)}%\n`);
  
  if (unusedFiles.size === 0) {
    console.log('No unused files found!');
    return;
  }
  
  console.log('Potentially unused files:');
  let totalSize = 0;
  for (const [file] of unusedFiles) {
    try {
      const stats = fs.statSync(file);
      const sizeKB = (stats.size / 1024).toFixed(2);
      totalSize += stats.size;
      console.log(`- ${file} (${sizeKB} KB)`);
    } catch (error) {
      console.log(`- ${file} (size unknown)`);
    }
  }
  console.log(`\nTotal space taken by unused files: ${(totalSize / 1024).toFixed(2)} KB`);
  
  console.log('\nWARNING: These files appear to be unused in the codebase.');
  console.log('Please review before deleting as they might be:');
  console.log('1. Used via dynamic imports');
  console.log('2. Part of the public API');
  console.log('3. Used in configuration files');
  console.log('4. Used in markdown/MDX files');
  console.log('5. Referenced by external tools or scripts');
  
  console.log('\nAre you sure you want to delete these files and empty folders? (y/N)');
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  
  process.stdin.once('data', function (text) {
    if (text.trim().toLowerCase() === 'y') {
      console.log('\nDeleting unused files...');
      let deletedCount = 0;
      let errorCount = 0;
      for (const [file] of unusedFiles) {
        try {
          fs.unlinkSync(file);
          console.log(`✓ Deleted: ${file}`);
          deletedCount++;
        } catch (error) {
          console.error(`✗ Error deleting ${file}:`, error.message);
          errorCount++;
        }
      }
      console.log(`\nFile deletion complete: ${deletedCount} files deleted, ${errorCount} errors`);
      
      // After deleting files, clean up empty directories
      console.log('\nCleaning up empty directories...');
      const deletedDirs = deleteEmptyDirs('lib');
      console.log(`Directory cleanup complete: ${deletedDirs} empty directories removed`);
      
      console.log('\nAll cleanup operations completed!');
    } else {
      console.log('Deletion cancelled.');
    }
    process.exit();
  });
}

main().catch(console.error); 