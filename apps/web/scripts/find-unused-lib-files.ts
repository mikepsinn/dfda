import fs from 'fs';
import path from 'path';
import glob from 'glob';

interface FileNode {
  path: string;
  imported: boolean;
  importedBy: Set<string>;
}

class DependencyAnalyzer {
  private files: Map<string, FileNode> = new Map();
  private libPath: string;
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.libPath = path.join(projectRoot, 'lib');
  }

  private normalizePath(filePath: string): string {
    return filePath.replace(/\\/g, '/');
  }

  private getAllFiles(): string[] {
    const allFiles = glob.sync('**/*.{ts,tsx,js,jsx}', {
      cwd: this.projectRoot,
      ignore: ['node_modules/**', '.next/**', 'out/**', 'build/**'],
      absolute: true,
    });
    return allFiles.map(file => this.normalizePath(file));
  }

  private initializeLibFiles() {
    const libFiles = glob.sync('**/*.{ts,tsx,js,jsx}', {
      cwd: this.libPath,
      absolute: true,
    });

    libFiles.forEach(file => {
      const normalizedPath = this.normalizePath(file);
      this.files.set(normalizedPath, {
        path: normalizedPath,
        imported: false,
        importedBy: new Set(),
      });
    });
  }

  private findImports(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const importRegex = /from\s+['"](@\/lib\/[^'"]+|\.\.?\/.*?)['"]/g;
    const matches = [...content.matchAll(importRegex)];

    matches.forEach(match => {
      let importPath = match[1];
      if (importPath.startsWith('@/lib/')) {
        importPath = path.join(this.projectRoot, importPath.slice(2));
      } else {
        importPath = path.resolve(path.dirname(filePath), importPath);
      }

      // Handle imports without extensions
      const possibleExtensions = ['.ts', '.tsx', '.js', '.jsx'];
      let resolvedPath = '';

      if (path.extname(importPath)) {
        resolvedPath = this.normalizePath(importPath);
      } else {
        for (const ext of possibleExtensions) {
          const withExt = importPath + ext;
          if (fs.existsSync(withExt)) {
            resolvedPath = this.normalizePath(withExt);
            break;
          }
          // Check for index files
          const indexFile = path.join(importPath, `index${ext}`);
          if (fs.existsSync(indexFile)) {
            resolvedPath = this.normalizePath(indexFile);
            break;
          }
        }
      }

      if (resolvedPath && this.files.has(resolvedPath)) {
        const fileNode = this.files.get(resolvedPath)!;
        fileNode.imported = true;
        fileNode.importedBy.add(filePath);
      }
    });
  }

  public analyze() {
    this.initializeLibFiles();
    const allFiles = this.getAllFiles();

    allFiles.forEach(file => {
      try {
        this.findImports(file);
      } catch (error) {
        console.error(`Error processing ${file}:`, error);
      }
    });

    const unusedFiles: string[] = [];
    this.files.forEach((fileNode, filePath) => {
      if (!fileNode.imported) {
        // Check if it's not an index file or types file
        if (!filePath.endsWith('index.ts') && !filePath.includes('/types/')) {
          unusedFiles.push(filePath);
        }
      }
    });

    return {
      unusedFiles,
      allLibFiles: Array.from(this.files.keys()),
      usedFiles: Array.from(this.files.values()).filter(f => f.imported).map(f => f.path),
    };
  }
}

// Run the analysis
const projectRoot = path.resolve(__dirname, '..');
const analyzer = new DependencyAnalyzer(projectRoot);
const results = analyzer.analyze();

console.log('\nPotentially unused files in lib directory:');
results.unusedFiles.forEach(file => {
  const relativePath = path.relative(projectRoot, file);
  console.log(`- ${relativePath}`);
});

console.log(`\nTotal lib files: ${results.allLibFiles.length}`);
console.log(`Used files: ${results.usedFiles.length}`);
console.log(`Potentially unused files: ${results.unusedFiles.length}`); 