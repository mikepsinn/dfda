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

  let usageCount = 0;
  const componentFile = path.resolve(componentPath);
  
  for (const file of allFiles) {
    // Skip checking the component's own file
    if (path.resolve(file) === componentFile) {
      continue;
    }

    try {
      const content = await readFile(file, 'utf8');
      
      // Check for various import patterns
      const importPatterns = [
        // Named imports
        new RegExp(`import\\s+{[^}]*\\b${componentName}\\b[^}]*}\\s+from`, 'g'),
        // Default imports
        new RegExp(`import\\s+${componentName}\\s+from`, 'g'),
        // Namespace imports
        new RegExp(`import\\s+\\*\\s+as\\s+${componentName}\\s+from`, 'g'),
        // Dynamic imports
        new RegExp(`import\\s*\\(\\s*['"\`][^'"\`]*['"\`]\\s*\\)\\s*\\.\\s*then\\s*\\(\\s*${componentName}\\s*=>`, 'g'),
        // Type imports
        new RegExp(`import\\s+type\\s+{[^}]*\\b${componentName}\\b[^}]*}\\s+from`, 'g'),
      ];

      // Check for JSX/TSX usage patterns
      const jsxPatterns = [
        // Standard JSX usage
        new RegExp(`<${componentName}[\\s/>]`, 'g'),
        // Dynamic component usage
        new RegExp(`component\\s*=\\s*{\\s*${componentName}\\s*}`, 'g'),
        // Spread props usage
        new RegExp(`<\\s*\\.\\.\\.${componentName}\\s*>`, 'g'),
      ];
      
      // Check for code reference patterns
      const referencePatterns = [
        // Function calls
        new RegExp(`\\b${componentName}\\s*\\(`, 'g'),
        // Object property access
        new RegExp(`\\b${componentName}\\.`, 'g'),
        // Object destructuring
        new RegExp(`(?:const|let|var)\\s*{[^}]*\\b${componentName}\\b[^}]*}\\s*=`, 'g'),
        // Array destructuring
        new RegExp(`(?:const|let|var)\\s*\\[[^\\]]*\\b${componentName}\\b[^\\]]*\\]\\s*=`, 'g'),
        // Type usage in TypeScript
        new RegExp(`:\\s*${componentName}\\b`, 'g'),
        // Object property shorthand
        new RegExp(`({|,)\\s*${componentName}\\b`, 'g'),
      ];

      // Check all patterns
      const allPatterns = [...importPatterns, ...jsxPatterns, ...referencePatterns];
      
      for (const pattern of allPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          usageCount += matches.length;
          if (usageCount > 0) {
            return false; // Component is used
          }
        }
      }
    } catch (error) {
      console.error(`Error reading file ${file}:`, error);
    }
  }
  
  return usageCount === 0; // Return true if component is unused
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

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const confirmDelete = () => {
    return new Promise((resolve) => {
      readline.question(`\nDelete all ${unusedComponents.size} unused components? (y/N) `, (answer) => {
        resolve(answer.trim().toLowerCase() === 'y');
      });
    });
  };

  // Use async IIFE to handle async/await in the deletion process
  await (async () => {
    const shouldDelete = await confirmDelete();
    if (shouldDelete) {
      console.log('\nDeleting unused components...');
      for (const [name, file] of unusedComponents) {
        try {
          fs.unlinkSync(file);
          console.log(`✓ Deleted: ${file}`);
        } catch (error) {
          console.error(`✗ Error deleting ${file}:`, error);
        }
      }
    } else {
      console.log('Deletion cancelled.');
    }
    readline.close();
  })();
}

main().catch(console.error); 