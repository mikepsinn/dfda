#!/usr/bin/env node

/*
  Usage:
    node rename-cases.js "Old Name" "New Name"
  
  Example:
    node rename-cases.js "Disease Eradication Act" "Disease Eradication Act"

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

function getAllFiles(dirPath, fileArray = []) {
  const entries = fs.readdirSync(dirPath);
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    if (shouldSkipDir(entry) && isDirectory(fullPath)) {
      continue;
    }
    if (isDirectory(fullPath)) {
      getAllFiles(fullPath, fileArray);
    } else {
      fileArray.push(fullPath);
    }
  }
  return fileArray;
}

const allFiles = getAllFiles(process.cwd());

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
// We'll rename only those that exist in our allFiles list (files).
// Then do a separate pass for directories by walking again.
const sortedPaths = [...allFiles].sort((a, b) => {
  // Deeper paths first
  return b.split(path.sep).length - a.split(path.sep).length;
});

sortedPaths.forEach(oldFullPath => {
  const dirname = path.dirname(oldFullPath);
  const basename = path.basename(oldFullPath);

  let newBasename = basename;
  Object.keys(oldVariants).forEach(k => {
    const oldVal = oldVariants[k];
    const newVal = newVariants[k];
    // Replace once per variant
    newBasename = newBasename.replace(oldVal, newVal);
  });

  if (newBasename !== basename) {
    const newFullPath = path.join(dirname, newBasename);
    if (!fs.existsSync(newFullPath)) {
      fs.renameSync(oldFullPath, newFullPath);
      console.log(`Renamed: ${oldFullPath} -> ${newFullPath}`);
    } else {
      console.warn(`Skipping rename (target exists): ${oldFullPath} -> ${newFullPath}`);
    }
  }
});

console.log('Done.');
