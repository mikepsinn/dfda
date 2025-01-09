#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import ignore from 'ignore';
import { camelCase, snakeCase, kebabCase, pascalCase } from "change-case";

interface CaseVariations {
  titleCase: string;
  camelCase: string;
  snakeCase: string;
  kebabCase: string;
  pascalCase: string;
}

async function readGitignore(rootDir: string): Promise<ReturnType<typeof ignore>> {
  const ig = ignore();
  try {
    const gitignoreContent = await fs.readFile(path.join(rootDir, '.gitignore'), 'utf8');
    ig.add(gitignoreContent);
  } catch (error) {
    console.warn('No .gitignore found, proceeding without ignore rules');
  }
  // Add common ignore patterns
  ig.add(['node_modules', '.git', '.next', 'dist', 'build']);
  return ig;
}

function generateCaseVariations(titleCase: string): CaseVariations {
  // Remove spaces from title case for proper conversion
  const cleanTitle = titleCase.replace(/\s+/g, '');
  return {
    titleCase: titleCase,
    camelCase: camelCase(cleanTitle),
    snakeCase: snakeCase(cleanTitle),
    kebabCase: kebabCase(cleanTitle),
    pascalCase: pascalCase(cleanTitle)
  };
}

async function replaceInFile(filePath: string, oldCases: CaseVariations, newCases: CaseVariations): Promise<void> {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let hasChanges = false;

    // Replace all case variations
    Object.entries(oldCases).forEach(([caseType, oldValue]) => {
      Object.entries(newCases).forEach(([_, newValue]) => {
        if (content.includes(oldValue)) {
          content = content.split(oldValue).join(newValue);
          hasChanges = true;
          console.log(`  - Replaced ${caseType}: "${oldValue}" -> "${newValue}"`);
        }
      });
    });

    if (hasChanges) {
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`Updated content in: ${filePath}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error processing file ${filePath}: ${error.message}`);
    }
  }
}

async function renameFileOrDir(oldPath: string, oldCases: CaseVariations, newCases: CaseVariations): Promise<void> {
  const dir = path.dirname(oldPath);
  const basename = path.basename(oldPath);
  let newBasename = basename;

  // Detect which case variation is used in the filename
  let detectedCase: keyof CaseVariations | null = null;
  Object.entries(oldCases).forEach(([caseType, oldValue]) => {
    if (basename.includes(oldValue)) {
      detectedCase = caseType as keyof CaseVariations;
    }
  });

  // If we found a case variation, replace it with the same case variation of the new name
  if (detectedCase) {
    const oldValue = oldCases[detectedCase];
    const newValue = newCases[detectedCase];
    newBasename = newBasename.split(oldValue).join(newValue);
    console.log(`  - Found ${detectedCase} in filename: "${oldValue}" -> "${newValue}"`);
  }

  if (basename !== newBasename) {
    const newPath = path.join(dir, newBasename);
    try {
      await fs.rename(oldPath, newPath);
      console.log(`Renamed: ${oldPath} -> ${newPath}`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error renaming ${oldPath}: ${error.message}`);
      }
    }
  }
}

async function processPath(
  currentPath: string,
  oldCases: CaseVariations,
  newCases: CaseVariations,
  ig: ReturnType<typeof ignore>
): Promise<void> {
  try {
    const stats = await fs.stat(currentPath);
    const relativePath = path.relative(process.cwd(), currentPath);

    // Skip if path is ignored
    if (relativePath && ig.ignores(relativePath)) {
      console.log(`Skipping ignored path: ${relativePath}`);
      return;
    }

    if (stats.isFile()) {
      const ext = path.extname(currentPath).toLowerCase();
      // Only process text files
      if (['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.mdx', '.txt', '.html', '.css', '.scss', '.yaml', '.yml'].includes(ext)) {
        console.log(`\nProcessing file: ${relativePath}`);
        // Process file content
        await replaceInFile(currentPath, oldCases, newCases);
        // Rename file if needed
        await renameFileOrDir(currentPath, oldCases, newCases);
      }
    } else if (stats.isDirectory()) {
      console.log(`\nEntering directory: ${relativePath || '.'}`);
      // Process directory contents
      const entries = await fs.readdir(currentPath);
      for (const entry of entries) {
        await processPath(path.join(currentPath, entry), oldCases, newCases, ig);
      }
      // Rename directory if needed (after processing contents)
      await renameFileOrDir(currentPath, oldCases, newCases);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error processing path ${currentPath}: ${error.message}`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 2) {
    console.error('Usage: pnpm rename-cases <old-title-case> <new-title-case>');
    console.error('Example: pnpm rename-cases "Disease Eradication Act" "Health Freedom Act"');
    process.exit(1);
  }

  const [oldTitleCase, newTitleCase] = args;
  const rootDir = process.cwd();
  const ig = await readGitignore(rootDir);

  const oldCases = generateCaseVariations(oldTitleCase);
  const newCases = generateCaseVariations(newTitleCase);

  console.log('Will replace the following variations:');
  Object.entries(oldCases).forEach(([caseType, oldValue]) => {
    console.log(`${caseType}: ${oldValue} -> ${newCases[caseType as keyof CaseVariations]}`);
  });

  console.log('\nProcessing files...');
  await processPath(rootDir, oldCases, newCases, ig);
  console.log('\nDone!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 