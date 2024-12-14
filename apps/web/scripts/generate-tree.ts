import fs from 'fs';
import path from 'path';

interface TreeNode {
  name: string;
  path?: string;
  children?: TreeNode[];
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

export function generateTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = [];

  // Filter for only page.tsx files and convert to routes
  const routes = paths
    .filter(path => path.endsWith('page.tsx'))
    .map(path => {
      // Remove app/ prefix and page.tsx suffix
      let route = path.replace(/^app\//, '').replace(/\/page\.tsx$/, '');
      
      // Handle route groups (folders starting with parentheses)
      route = route.replace(/\([^)]+\)\//g, '');
      
      // Convert /index to /
      route = route === 'index' ? '' : route;
      
      return {
        originalPath: path,
        route: '/' + route
      };
    });

  // Sort routes by path length to ensure parent routes are created first
  routes.sort((a, b) => a.route.split('/').length - b.route.split('/').length);

  for (const {originalPath, route} of routes) {
    const parts = route.split('/').filter(Boolean);
    let current = root;
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath += '/' + part;
      
      let node = current.find(n => n.name === part);
      if (!node) {
        node = { 
          name: part,
          path: currentPath || '/',
        };
        current.push(node);
      }
      if (!node.children) {
        node.children = [];
      }
      current = node.children;
    }

    // Add the root route if it doesn't exist
    if (route === '/') {
      const homeNode = root.find(n => n.name === 'home');
      if (!homeNode) {
        root.push({
          name: 'home',
          path: '/',
        });
      }
    }
  }

  return root;
}

export function printTree(node: TreeNode, prefix = ''): void {
  const path = node.path ? ` (${node.path})` : '';
  console.log(prefix + '├── ' + node.name + path);
  if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      const isLast = i === node.children.length - 1;
      printTree(node.children[i], prefix + (isLast ? '    ' : '│   '));
    }
  }
}

export function generateSitemap(paths: string[]): void {
  const tree = generateTree(paths);
  console.log('\nSitemap:');
  for (const node of tree) {
    printTree(node);
  }
}

// Main execution block
if (require.main === module) {
  const appDir = path.join(__dirname, '..', 'app');
  const allFiles = getAllFiles(appDir)
    .map(file => path.relative(path.join(__dirname, '..'), file)
    .replace(/\\/g, '/'));
    
  console.log('Generating sitemap from app directory...');
  generateSitemap(allFiles);
} 