#!/usr/bin/env node

/*
  Usage:
    node scripts/rename-cases.js "Old Name" "New Name"
  
  Example:
    node scripts/rename-cases.js "Disease Eradication Act" "Disease Eradication Act"

  This script:
  1. Reads the old and new names from the command line.
  2. Generates case variants (Title, Pascal, camel, snake, kebab, ALL CAPS).
  3. Recursively searches for text files in the current directory (skips .git and node_modules).
  4. Replaces each old variant with its corresponding new variant in file contents.
  5. Renames files and directories containing old variants.
  6. Renames deeper paths first to avoid conflicts.
  7. Does not depend on Git.

  Use at your own risk. Always back up your code before running.
*/

const fs = require('fs');
const path = require('path');

// Utility functions
function toTitleCase(str) {
  return str
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(' ');
}

function toPascalCase(str) {
  return str
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join('');
}

function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toSnakeCase(str) {
  return str.trim().replace(/\s+/g, '_').toLowerCase();
}

function toKebabCase(str) {
  return str.trim().replace(/\s+/g, '-').toLowerCase();
}

function toUpperCaseAll(str) {
  return str.toUpperCase();
}

// Get arguments
const [oldName, newName] = process.argv.slice(2);
if (!oldName || !newName) {
  console.error('Please provide both the old name and the new name in quotes.');
  process.exit(1);
}

// Build all variants
const oldVariants = {
  title: toTitleCase(oldName),
  pascal: toPascalCase(oldName),
  camel: toCamelCase(oldName),
  snake: toSnakeCase(oldName),
  kebab: toKebabCase(oldName),
  upper: toUpperCaseAll(oldName),
};

const newVariants = {
  title: toTitleCase(newName),
  pascal: toPascalCase(newName),
  camel: toCamelCase(newName),
  snake: toSnakeCase(newName),
  kebab: toKebabCase(newName),
  upper: toUpperCaseAll(newName),
};

// Collect all files (not depending on Git)
function isDirectory(filePath) {
  return fs.statSync(filePath).isDirectory();
}

function shouldSkipDir(dirName) {
  // Skip .git and node_modules by default
  return dirName === '.git' || dirName === 'node_modules';
}

// Collect all files and directories
function getAllPaths(dirPath, fileArray = [], dirArray = []) {
  const entries = fs.readdirSync(dirPath);
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    if (shouldSkipDir(entry) && isDirectory(fullPath)) {
      continue;
    }
    if (isDirectory(fullPath)) {
      dirArray.push(fullPath);
      getAllPaths(fullPath, fileArray, dirArray);
    } else {
      fileArray.push(fullPath);
    }
  }
  return { files: fileArray, directories: dirArray };
}

const { files: allFiles, directories: allDirs } = getAllPaths(process.cwd());

// Filter to text-like files
const textExtensions = /\.(txt|md|js|ts|jsx|tsx|json|html|css|scss|yml|yaml)$/i;
const textFiles = allFiles.filter(filePath => textExtensions.test(filePath));

// 1. Replace content in text files
textFiles.forEach(filePath => {
  let contents = fs.readFileSync(filePath, 'utf8');
  let updated = contents;

  Object.keys(oldVariants).forEach(k => {
    const oldVal = oldVariants[k];
    const newVal = newVariants[k];
    // Escape special regex chars
    const escaped = oldVal.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    // Replace all occurrences
    const regex = new RegExp(escaped, 'g');
    updated = updated.replace(regex, newVal);
  });

  if (updated !== contents) {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`Updated content in: ${filePath}`);
  }
});

// 2. Rename files and directories
// Sort paths by depth (deeper first) to avoid conflicts
const sortedDirs = [...allDirs].sort((a, b) => {
  return b.split(path.sep).length - a.split(path.sep).length;
});

const sortedFiles = [...allFiles].sort((a, b) => {
  return b.split(path.sep).length - a.split(path.sep).length;
});

// First rename directories (deeper first)
sortedDirs.forEach(oldFullPath => {
  const dirname = path.dirname(oldFullPath);
  const basename = path.basename(oldFullPath);

  let newBasename = basename;
  Object.keys(oldVariants).forEach(k => {
    const oldVal = oldVariants[k];
    const newVal = newVariants[k];
    newBasename = newBasename.replace(oldVal, newVal);
  });

  if (newBasename !== basename) {
    const newFullPath = path.join(dirname, newBasename);
    if (!fs.existsSync(newFullPath)) {
      fs.renameSync(oldFullPath, newFullPath);
      console.log(`Renamed directory: ${oldFullPath} -> ${newFullPath}`);
    } else {
      console.warn(`Skipping directory rename (target exists): ${oldFullPath} -> ${newFullPath}`);
    }
  }
});

// Then rename files
sortedFiles.forEach(oldFullPath => {
  const dirname = path.dirname(oldFullPath);
  const basename = path.basename(oldFullPath);

  let newBasename = basename;
  Object.keys(oldVariants).forEach(k => {
    const oldVal = oldVariants[k];
    const newVal = newVariants[k];
    newBasename = newBasename.replace(oldVal, newVal);
  });

  if (newBasename !== basename) {
    const newFullPath = path.join(dirname, newBasename);
    if (!fs.existsSync(newFullPath)) {
      fs.renameSync(oldFullPath, newFullPath);
      console.log(`Renamed file: ${oldFullPath} -> ${newFullPath}`);
    } else {
      console.warn(`Skipping file rename (target exists): ${oldFullPath} -> ${newFullPath}`);
    }
  }
});

console.log('Done.');
