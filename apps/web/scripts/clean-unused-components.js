const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);

async function extractComponentNames(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    const names = new Set();

    // Match export patterns
    const patterns = [
      // Named exports
      /export\s+(?:const|function|class|interface|type)\s+([A-Z][a-zA-Z0-9]*)/g,
      // Default exports
      /export\s+default\s+(?:const|function|class|interface|type)?\s*([A-Z][a-zA-Z0-9]*)/g,
      // Direct exports of functions/components
      /export\s+{\s*([A-Z][a-zA-Z0-9]*(?:\s*,\s*[A-Z][a-zA-Z0-9]*)*)\s*}/g,
      // Function components
      /(?:const|let|var)\s+([A-Z][a-zA-Z0-9]*)\s*=\s*(?:\([^)]*\)|async)?\s*(?:=>|\{)/g,
      // Class components
      /class\s+([A-Z][a-zA-Z0-9]*)\s+extends\s+(?:React\.)?Component/g,
      // forwardRef components
      /(?:const|let|var)\s+([A-Z][a-zA-Z0-9]*)\s*=\s*(?:React\.)?forwardRef/g,
      // memo components
      /(?:const|let|var)\s+([A-Z][a-zA-Z0-9]*)\s*=\s*(?:React\.)?memo/g
    ];

    for (const pattern of patterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        // Handle multiple exports in a single statement (e.g., export { A, B, C })
        const components = match[1].split(',').map(c => c.trim());
        components.forEach(component => {
          if (component.match(/^[A-Z]/)) { // Only add if it starts with capital letter (component convention)
            names.add(component);
          }
        });
      }
    }

    return Array.from(names);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return [];
  }
}

async function findAllComponents() {
  const componentFiles = glob.sync('{app,components}/**/*.{tsx,jsx}', {
    ignore: [
      '**/*.test.{tsx,jsx}',
      '**/*.spec.{tsx,jsx}',
      '**/page.tsx',
      '**/layout.tsx',
      '**/loading.tsx',
      '**/error.tsx',
      '**/not-found.tsx',
      '**/template.tsx',
      '**/default.tsx'
    ]
  });
  
  const components = new Map(); // Map of component names to their file paths
  
  for (const file of componentFiles) {
    const componentNames = await extractComponentNames(file);
    for (const name of componentNames) {
      components.set(name, file);
    }
  }
  
  return components;
}

async function findComponentUsage(componentName, componentPath) {
  const allFiles = glob.sync('{app,components,lib,pages}/**/*.{ts,tsx,jsx,js}', {
    ignore: ['**/*.test.{ts,tsx,js,jsx}', '**/*.spec.{ts,tsx,js,jsx}']
  });

  let occurrences = 0;
  
  for (const file of allFiles) {
    try {
      const content = await readFile(file, 'utf8');
      // Count how many times the component name appears in other files
      const matches = content.match(new RegExp(componentName, 'g')) || [];
      occurrences += matches.length;
      
      // If we find more than one occurrence, the component is being used
      if (occurrences > 1) {
        return false; // Not unused
      }
    } catch (error) {
      console.error(`Error reading file ${file}:`, error);
    }
  }
  
  // If we only found one or zero occurrences, the component is unused
  // (one occurrence would be the definition itself)
  return occurrences <= 1;
}

async function main() {
  console.log('Finding unused components...\n');
  console.log('Note: This tool looks for components that are defined but not referenced anywhere else.');
  console.log('Please review the results carefully before deleting any files.\n');
  
  const components = await findAllComponents();
  const unusedComponents = new Map();
  let current = 0;
  const total = components.size;
  
  for (const [name, file] of components) {
    current++;
    process.stdout.write(`Checking components: ${current}/${total}\r`);
    
    const isUnused = await findComponentUsage(name, file);
    if (isUnused) {
      unusedComponents.set(name, file);
    }
  }
  
  console.log('\n'); // Clear the progress line
  
  if (unusedComponents.size === 0) {
    console.log('No unused components found!');
    return;
  }
  
  console.log('\nPotentially unused components:');
  for (const [name, file] of unusedComponents) {
    console.log(`- ${name} (${file})`);
  }
  
  console.log('\nWARNING: These components appear only once in the codebase (their definition).');
  console.log('Please review before deleting as they might be:');
  console.log('1. Used via dynamic imports');
  console.log('2. Part of the public API');
  console.log('3. Used in markdown/MDX files');
  console.log('\nTo delete after review, run: pnpm clean:unused --delete');
  
  if (process.argv.includes('--delete')) {
    console.log('\nAre you sure you want to delete these files? (y/N)');
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    process.stdin.once('data', function (text) {
      if (text.trim().toLowerCase() === 'y') {
        console.log('\nDeleting unused components...');
        for (const [name, file] of unusedComponents) {
          try {
            fs.unlinkSync(file);
            console.log(`Deleted: ${file} (${name})`);
          } catch (error) {
            console.error(`Error deleting ${file}:`, error);
          }
        }
      } else {
        console.log('Deletion cancelled.');
      }
      process.exit();
    });
  }
}

main().catch(console.error); 