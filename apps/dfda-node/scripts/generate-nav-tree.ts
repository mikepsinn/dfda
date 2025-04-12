import fs from 'fs';
import path from 'path';

interface NavNode {
  name: string; // User-friendly name
  path: string; // URL path
  children?: NavNode[];
}

const appDirectory = path.resolve(process.cwd(), 'app');
const ignoredSegments = new Set(['lib', 'actions', 'components']); // Add other segments/groups to ignore entirely
const ignoredFiles = new Set(['layout.tsx', 'loading.tsx', 'error.tsx', 'template.tsx', 'not-found.tsx']);

const LOG_PREFIX = '[generate-nav-tree]';

console.log(`${LOG_PREFIX} Starting navigation tree generation from: ${path.relative(process.cwd(), appDirectory)}`);

// Helper to format directory/segment names into titles
function formatSegmentName(segment: string): string {
  if (segment.startsWith('[...') && segment.endsWith(']')) {
    return `Catch-all (${segment.slice(4, -1)})`;
  }
  if (segment.startsWith('[') && segment.endsWith(']')) {
    return `Dynamic (${segment.slice(1, -1)})`;
  }
  // Convert kebab-case or snake_case to Title Case
  return segment
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function generateNavTreeRecursive(dirPath: string, currentPath: string): NavNode | null {
  console.log(`${LOG_PREFIX} Processing directory: ${path.relative(process.cwd(), dirPath)} (Path: ${currentPath || '/'})`);
  try {
    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) {
      console.log(`${LOG_PREFIX}   -> Not a directory, skipping.`);
      return null;
    }

    const children: NavNode[] = [];
    let hasPage = false;
    let currentSegment = path.basename(dirPath);

    if (fs.existsSync(path.join(dirPath, 'page.tsx'))) {
      console.log(`${LOG_PREFIX}   -> Found page.tsx`);
      hasPage = true;
    }

    const entries = fs.readdirSync(dirPath);

    for (const entry of entries) {
      const fullEntryPath = path.join(dirPath, entry);
      const entryStats = fs.statSync(fullEntryPath);

      if (entryStats.isDirectory()) {
        if (ignoredSegments.has(entry)) {
          console.log(`${LOG_PREFIX}   -> Skipping ignored segment: ${entry}`);
          continue;
        }

        if (entry.startsWith('(') && entry.endsWith(')')) {
          console.log(`${LOG_PREFIX}   -> Processing route group: ${entry}`);
          const groupNode = generateNavTreeRecursive(fullEntryPath, currentPath);
          if (groupNode) {
             if (groupNode.path === currentPath) { // Group node itself represents a page
                 console.log(`${LOG_PREFIX}     -> Route group ${entry} contained page.tsx directly.`);
                 hasPage = true; // Mark parent as having a page if group does
             }
             if (groupNode.children) {
                console.log(`${LOG_PREFIX}     -> Merging children from group: ${entry}`);
                children.push(...groupNode.children);
             }
          }
        } else {
          console.log(`${LOG_PREFIX}   -> Recursing into child directory: ${entry}`);
          const nextPath = path.join(currentPath, entry).replace(/\\/g, '/');
          const childNode = generateNavTreeRecursive(fullEntryPath, nextPath);
          if (childNode) {
            children.push(childNode);
          }
        }
      } else if (entry === 'page.tsx' && !hasPage) {
        // This condition should technically not be needed anymore with the check at the start,
        // but we keep the logic just in case.
        hasPage = true;
      }
    }

    if (hasPage || children.length > 0) {
       const nodeNameSegment = (currentSegment.startsWith('(') && currentSegment.endsWith(')'))
         ? path.basename(path.dirname(dirPath))
         : currentSegment;

       // Ensure nodePath always starts with / unless it IS /
       const normalizedPath = currentPath.replace(/\\/g, '/');
       const nodePath = normalizedPath === '' ? '/' : '/' + normalizedPath;
       const nodeName = dirPath === appDirectory ? 'Home' : formatSegmentName(nodeNameSegment);
       console.log(`${LOG_PREFIX}   -> Creating node: Name="${nodeName}", Path="${nodePath}", Children=${children.length > 0}`);

       const node: NavNode = {
           name: nodeName,
           path: nodePath,
       };
       if (children.length > 0) {
           node.children = children.sort((a, b) => a.name.localeCompare(b.name));
       }
       return node;
    } else {
        console.log(`${LOG_PREFIX}   -> Skipping directory: No page.tsx and no navigable children.`);
        return null;
    }

  } catch (error) {
    if (error instanceof Error && 'code' in error && (error.code === 'ENOENT' || error.code === 'EACCES')) {
        console.warn(`${LOG_PREFIX} Skipping inaccessible path ${path.relative(process.cwd(), dirPath)}: ${error.message}`);
        return null;
    }
    console.error(`${LOG_PREFIX} Error processing directory ${path.relative(process.cwd(), dirPath)}:`, error);
    return null;
  }
}

function generateNavTree(): NavNode[] {
    console.log(`${LOG_PREFIX} Starting navigation tree generation from: ${path.relative(process.cwd(), appDirectory)}`);
    const rootNode = generateNavTreeRecursive(appDirectory, '');
    if (rootNode) {
        if (rootNode.path === '/' && rootNode.children) {
             const topLevelNodes = rootNode.children;
             if (fs.existsSync(path.join(appDirectory, 'page.tsx'))) {
                 console.log(`${LOG_PREFIX} Prepending Home node for root page.tsx`);
                 topLevelNodes.unshift({ name: 'Home', path: '/' });
             }
             return topLevelNodes.sort((a, b) => a.name.localeCompare(b.name));
        } else if (rootNode.path === '/') {
            return [rootNode];
        } else {
             console.warn("${LOG_PREFIX} Root node generation resulted in unexpected structure:", rootNode);
             return [rootNode];
        }
    } else {
        console.log("${LOG_PREFIX} No navigable root node found.");
    }
    return [];
}

// --- New functions for converting array to object ---

// Update interface to use title and href
interface SimpleNavInfo {
  title: string; // User-friendly name (formerly name)
  href: string; // URL path (formerly path)
}

function pathToSnakeCaseKey(navPath: string): string {
  if (navPath === '/') {
    return 'root'; // Special key for the root path
  }
  return navPath
    .replace(/^\//, '') // Remove leading slash
    .replace(/\/$/, '') // Remove trailing slash
    .replace(/[\[\]]/g, '') // Remove brackets from dynamic segments like [id]
    .replace(/[\/\-]/g, '_') // Replace slashes and hyphens with underscores
    .toLowerCase(); // Ensure snake_case
}

function convertTreeToObjectRecursive(
  nodes: NavNode[],
  result: Record<string, SimpleNavInfo>
): void {
  for (const node of nodes) {
    const key = pathToSnakeCaseKey(node.path);
    if (key) {
        if (result[key]) {
             console.warn(`${LOG_PREFIX} Duplicate snake_case key generated: '${key}' for path '${node.path}'. Overwriting.`);
        }
        // Use title and href here
        result[key] = { title: node.name, href: node.path };
    } else {
        console.warn(`${LOG_PREFIX} Could not generate key for path '${node.path}'. Skipping node.`);
    }

    if (node.children) {
      convertTreeToObjectRecursive(node.children, result);
    }
  }
}

// --- Execution & Output ---

const navigationTreeArray = generateNavTree();

console.log(`${LOG_PREFIX} Converting navigation tree array to flat object...`);
const navigationTreeObject: Record<string, SimpleNavInfo> = {};
convertTreeToObjectRecursive(navigationTreeArray, navigationTreeObject);
console.log(`${LOG_PREFIX} Conversion complete. Generated ${Object.keys(navigationTreeObject).length} keys.`);

// --- Generate the specific interface --- START
const generatedKeys = Object.keys(navigationTreeObject);
const interfaceProperties = generatedKeys
  .sort() // Sort keys alphabetically for consistent output
  .map(key => `  readonly '${key}': SimpleNavInfo;`) // Use readonly and quote keys if needed
  .join('\n');
const generatedInterfaceString = `export interface GeneratedNavTree {
${interfaceProperties}
}`;
// --- Generate the specific interface --- END

// Define the output path
const outputPath = path.resolve(process.cwd(), 'lib', 'generated-nav-tree.ts');

// Ensure the output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir, { recursive: true });
}

// Format the output as a TypeScript export of the object
const fileContent = `// This file is auto-generated by scripts/generate-nav-tree.ts
// Do not edit this file directly.

// Maps snake_case path keys to navigation info
// Update interface definition in output file
export interface SimpleNavInfo {
  title: string; // User-friendly name
  href: string; // Original URL path
}

// --- Generated Interface --- START
${generatedInterfaceString}
// --- Generated Interface --- END

export const navigationTreeObject: GeneratedNavTree = ${JSON.stringify(navigationTreeObject, null, 2)};
`;

// Write the content to the file
fs.writeFileSync(outputPath, fileContent, 'utf8');

console.log(`${LOG_PREFIX} Navigation tree generated successfully at ${path.relative(process.cwd(), outputPath)}`);

// Remove the separate NavNode interface generation if not needed elsewhere
// const interfacePath = path.resolve(process.cwd(), 'lib', 'nav-node.ts');
// ... (rest of the old interface file logic can be removed or commented out) 