import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { generateObject, NoObjectGeneratedError } from 'ai';
import dotenv from 'dotenv';
import { type NavItem } from '../lib/types/navigation'; // Import only the final type
import { googleAI, defaultGoogleModel } from '../lib/ai/google'; // Import shared client and model
import { logger } from '@/lib/logger'; // Use logger

// Load environment variables (.env file in the root)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const aiModel = defaultGoogleModel; // Use the imported default model

// Internal script interface for directory scanning
interface NavNode {
  name: string; // Original formatted name from directory/segment
  path: string; // URL path (/a/b/c)
  children?: NavNode[];
}

// --- Define Zod Schema for the AI's expected *array* output --- START
const SingleAISuggestionSchema = z.object({
  originalPath: z.string().describe("The original URL path this suggestion corresponds to (e.g., '/patient/conditions'). Crucial for mapping."),
  title: z.string().max(30, "Title too long").describe("Generate a concise, user-friendly title (max 4 words, Title Case) based on the original path."),
  description: z.string().max(150, "Description too long").optional().describe("Generate a brief (1-2 sentence) description of the page's purpose suitable for tooltips. Infer from the path."),
  emoji: z.string().optional().describe("Generate a single relevant emoji (can be multi-character like 🧑‍💻) based on the title/path.")
});

const AIResponseSchema = z.array(SingleAISuggestionSchema);

type AISuggestion = z.infer<typeof SingleAISuggestionSchema>;
// --- Define Zod Schema --- END

const appDirectory = path.resolve(process.cwd(), 'app');
const ignoredSegments = new Set(['lib', 'actions', 'components']);
const ignoredFiles = new Set(['layout.tsx', 'loading.tsx', 'error.tsx', 'template.tsx', 'not-found.tsx']);

const LOG_PREFIX = '[generate-nav-tree]';

// --- Directory Scanning Logic (generateNavTreeRecursive, generateNavTree) --- START
// (Keep existing recursive logic - no changes needed here, it builds the raw tree)
function formatSegmentName(segment: string): string {
  if (segment.startsWith('[...') && segment.endsWith(']')) {
    return `Catch-all (${segment.slice(4, -1)})`;
  }
  if (segment.startsWith('[') && segment.endsWith(']')) {
    return `Dynamic (${segment.slice(1, -1)})`;
  }
  return segment
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function generateNavTreeRecursive(dirPath: string, currentPath: string): NavNode | null {
  logger.debug(`${LOG_PREFIX} Processing directory: ${path.relative(process.cwd(), dirPath)} (Path: ${currentPath || '/'})`);
  try {
    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) {
      logger.debug(`${LOG_PREFIX}   -> Not a directory, skipping.`);
      return null;
    }

    const children: NavNode[] = [];
    let hasPage = false;
    let currentSegment = path.basename(dirPath);

    // Check for page.tsx at the current level
    if (fs.existsSync(path.join(dirPath, 'page.tsx'))) {
      logger.debug(`${LOG_PREFIX}   -> Found page.tsx`);
      hasPage = true;
    }

    const entries = fs.readdirSync(dirPath);

    for (const entry of entries) {
      const fullEntryPath = path.join(dirPath, entry);
      const entryStats = fs.statSync(fullEntryPath);

      if (entryStats.isDirectory()) {
        if (ignoredSegments.has(entry)) {
          logger.debug(`${LOG_PREFIX}   -> Skipping ignored segment: ${entry}`);
          continue;
        }

        if (entry.startsWith('(') && entry.endsWith(')')) {
          logger.debug(`${LOG_PREFIX}   -> Processing route group: ${entry}`);
          // Check if the group itself contains a page.tsx ONLY if parent doesn't already have one
          if (!hasPage && fs.existsSync(path.join(fullEntryPath, 'page.tsx'))) {
              logger.debug(`${LOG_PREFIX}     -> Route group ${entry} provides page for parent.`);
              hasPage = true; // Mark parent as having a page if group does
          }
          // Recursively process the group to find its children
          const groupNode = generateNavTreeRecursive(fullEntryPath, currentPath);
          if (groupNode && groupNode.children) {
             logger.debug(`${LOG_PREFIX}     -> Merging children from group: ${entry}`);
             children.push(...groupNode.children);
          }
        } else {
          logger.debug(`${LOG_PREFIX}   -> Recursing into child directory: ${entry}`);
          const nextSegment = entry;
          const nextPath = currentPath === '' ? nextSegment : `${currentPath}/${nextSegment}`;
          const childNode = generateNavTreeRecursive(fullEntryPath, nextPath);
          if (childNode) {
            // If the childNode itself represents a page, add it directly
            if (childNode.name !== '__GROUP__') {
                children.push(childNode);
            } else if (childNode.children) {
                // If child was a group placeholder, merge its children
                logger.debug(`${LOG_PREFIX}     -> Merging children from group placeholder: ${entry}`);
                children.push(...childNode.children);
            }
          }
        }
      } else if (entry === 'page.tsx' && !hasPage) {
         // This case handles finding page.tsx after processing subdirs/groups
        logger.debug(`${LOG_PREFIX}   -> Found page.tsx (after subdir processing)`);
        hasPage = true;
      }
    }

    // Create a node ONLY if it has a page.tsx OR if it has children that will have pages
    if (hasPage || children.length > 0) {
       const nodeNameSegment = (currentSegment.startsWith('(') && currentSegment.endsWith(')'))
         ? path.basename(path.dirname(dirPath)) // Use parent dir name for groups when creating the node
         : currentSegment;

       const normalizedPath = currentPath.replace(/\\/g, '/');
       const nodePath = normalizedPath === '' ? '/' : `/${normalizedPath}`;
       // Use Home for the absolute root, otherwise format the segment
       const nodeName = dirPath === appDirectory ? 'Home' : formatSegmentName(nodeNameSegment);
       logger.debug(`${LOG_PREFIX}   -> Creating node: Name="${nodeName}", Path="${nodePath}", HasPage=${hasPage}, Children=${children.length}`);

       const node: NavNode = {
           name: nodeName,
           path: nodePath,
           children: children.length > 0 ? children.sort((a, b) => a.path.localeCompare(b.path)) : undefined,
       };

       // If this level itself doesn't have a page, but has children,
       // return a group placeholder containing the children.
       if (!hasPage && children.length > 0) {
           logger.debug(`${LOG_PREFIX}     -> Level has no page, returning group placeholder for children.`);
           return { name: '__GROUP__', path: '__GROUP__', children: node.children };
       }

       // Otherwise, return the node (it has a page)
       return node;
    }

    logger.debug(`${LOG_PREFIX}   -> Skipping directory: No page.tsx and no viable children.`);
    return null;

  } catch (error) {
    // ... (error handling) ...
    if (error instanceof Error && 'code' in error && (error.code === 'ENOENT' || error.code === 'EACCES')) {
        logger.warn(`${LOG_PREFIX} Skipping inaccessible path ${path.relative(process.cwd(), dirPath)}: ${error.message}`);
        return null;
    }
    logger.error(`${LOG_PREFIX} Error processing directory ${path.relative(process.cwd(), dirPath)}:`, error);
    return null;
  }
}

// Flattens the tree and removes group placeholders
function flattenTreeAndFilterGroups(nodes: NavNode[]): { name: string, path: string }[] {
    let flatList: { name: string, path: string }[] = [];
    for (const node of nodes) {
        if (node.name !== '__GROUP__' && node.path !== '__GROUP__') {
            // Add the node itself if it's not a group placeholder
            flatList.push({ name: node.name, path: node.path });
        }
        if (node.children) {
            // Recursively flatten children
            flatList = flatList.concat(flattenTreeAndFilterGroups(node.children));
        }
    }
    return flatList;
}


function generateNavTree(): { name: string, path: string }[] {
    logger.info(`${LOG_PREFIX} Starting navigation tree generation from: ${path.relative(process.cwd(), appDirectory)}`);
    const rootNode = generateNavTreeRecursive(appDirectory, '');
    let treeNodes: NavNode[] = [];
    if (rootNode) {
        // Add root node if it's a real node (not just a group placeholder)
        if (rootNode.name !== '__GROUP__') {
             treeNodes.push(rootNode);
        } else if (rootNode.children) {
             // If root was a group placeholder, use its children directly
             treeNodes = rootNode.children;
        }
    } else {
        logger.info("${LOG_PREFIX} No navigable root node found initially.");
    }

    // Flatten the potentially nested structure and remove any remaining group placeholders
    const flatNodes = flattenTreeAndFilterGroups(treeNodes);

    // Sort the final flat list
    return flatNodes.sort((a, b) => {
        if (a.path === '/') return -1; // Keep root first
        if (b.path === '/') return 1;
        return a.path.localeCompare(b.path);
    });
}
// --- Directory Scanning Logic --- END

// --- Conversion and AI Enhancement --- START
function pathToSnakeCaseKey(navPath: string): string {
  if (navPath === '/') {
    return 'root';
  }
  return navPath
    .replace(/^\//, '')
    .replace(/\/$/, '')
    .replace(/\[\.\.\./g, 'catchall_')
    .replace(/\[/g, '')
    .replace(/\]/g, '')
    .replace(/[-\/]/g, '_')
    .toLowerCase();
}

async function getAiSuggestions(nodes: { name: string, path: string }[]): Promise<Map<string, AISuggestion>> {
  const suggestionsMap = new Map<string, AISuggestion>();
  if (!aiModel) {
    logger.warn(`${LOG_PREFIX} AI model not configured. Skipping AI suggestions.`);
    return suggestionsMap;
  }
  if (nodes.length === 0) {
    logger.info('No navigable nodes found to send to AI.');
    return suggestionsMap;
  }

  // Prepare input for AI
  const inputList = nodes.map(n => ({ path: n.path, name: n.name }));
  const prompt = `Generate navigation properties (title, description, emoji) for the following list of URL paths and their original names. Return the result as a JSON array matching the schema, ensuring each object includes the 'originalPath'.

Input List:
${JSON.stringify(inputList, null, 2)}`;

  logger.info(`${LOG_PREFIX} Attempting single AI generation (Google) for ${nodes.length} paths...`);

  try {
    const { object: aiSuggestionsArray } = await generateObject({
      model: aiModel,
      schema: AIResponseSchema, // Expect an array
      prompt: prompt,
      mode: "json", // Explicitly request JSON mode
      maxRetries: 1,
    });

    // Populate the map for easy lookup
    for (const suggestion of aiSuggestionsArray) {
      if (suggestion.originalPath && nodes.some(n => n.path === suggestion.originalPath)) { // Verify path exists
        suggestionsMap.set(suggestion.originalPath, suggestion);
      } else {
        logger.warn(`${LOG_PREFIX} AI returned suggestion for unknown path: ${suggestion.originalPath}`);
      }
    }
    logger.info(`${LOG_PREFIX} AI successfully generated suggestions for ${suggestionsMap.size} paths.`);

  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      logger.error(`${LOG_PREFIX} AI failed to generate valid object array:`, { message: error.message, cause: error.cause, text: error.text });
    } else {
      logger.error(`${LOG_PREFIX} Single AI generation call failed:`, { error });
    }
    logger.warn(`${LOG_PREFIX} Falling back to default values due to AI failure.`);
    return new Map<string, AISuggestion>(); // Return empty map on failure
  }

  return suggestionsMap;
}

async function generateFinalNavObject(nodes: { name: string, path: string }[], suggestionsMap: Map<string, AISuggestion>): Promise<Record<string, NavItem>> {
    const result: Record<string, NavItem> = {};

    for (const node of nodes) {
        const key = pathToSnakeCaseKey(node.path);
        if (!key) {
            logger.warn(`${LOG_PREFIX} Could not generate key for path '${node.path}'. Skipping node.`);
            continue;
        }

        const suggestion = suggestionsMap.get(node.path);

        // --- Start Override Logic ---
        let finalTitle = suggestion?.title ?? node.name; // Default to AI suggestion or original name
        if (node.path === '/patient') {
            logger.info(`${LOG_PREFIX} Applying manual title override for path: ${node.path}`);
            finalTitle = 'Dashboard'; // Override title
        }
        // --- End Override Logic ---

        const finalNavItem: NavItem = {
            title: finalTitle, // Use the potentially overridden title
            href: node.path,
            description: suggestion?.description, // Keep AI description even if title is overridden
            emoji: suggestion?.emoji, // Keep AI emoji
            // Other fields like icon, hideInNav, roles are not AI-generated
        };

        if (result[key]) {
            logger.warn(`${LOG_PREFIX} Duplicate snake_case key generated: '${key}' for path '${node.path}'. Overwriting node with original name '${node.name}'. Previous title was '${result[key].title}'.`);
        }
        result[key] = finalNavItem;
    }
    return result;
}

// --- Conversion and AI Enhancement --- END

// --- Execution & Output --- START
async function main() {
    const navigationTreeNodes = generateNavTree(); // Gets the flat list of { name, path }
    logger.info(`${LOG_PREFIX} Discovered ${navigationTreeNodes.length} navigable paths from directory structure.`);

    if (navigationTreeNodes.length === 0) {
        logger.warn('No navigable paths found. Output file will be empty or may error if interface expects keys.');
        // Decide how to handle - write empty object? Error out?
        // For now, let it proceed, it might write an empty object/interface.
    }

    // Get AI suggestions in a single batch
    const suggestionsMap = await getAiSuggestions(navigationTreeNodes);

    // Generate the final object using the nodes and suggestions
    const navigationTreeObject = await generateFinalNavObject(navigationTreeNodes, suggestionsMap);
    logger.info(`${LOG_PREFIX} Final navigation object constructed with ${Object.keys(navigationTreeObject).length} keys.`);

    // --- Generate Interface and Write File ---
    const generatedKeys = Object.keys(navigationTreeObject).sort();
    const interfaceProperties = generatedKeys
      .map(key => `  readonly '${key}': NavItem;`)
      .join('\n');
    // Handle case where there are no keys - create an empty interface
    const generatedInterfaceString = `export interface GeneratedNavTree {
${interfaceProperties.length > 0 ? interfaceProperties : '  // No keys generated'}
}`;

    const outputPath = path.resolve(process.cwd(), 'lib', 'generated-nav-tree.ts');
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)){
        logger.debug(`Creating output directory: ${outputDir}`);
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileContent = `// This file is auto-generated by scripts/generate-nav-tree.ts
// Do not edit this file directly.

import type { NavItem } from './types/navigation';

// --- Generated Interface --- START
${generatedInterfaceString}
// --- Generated Interface --- END

// Maps snake_case path keys to navigation info
export const navigationTreeObject: GeneratedNavTree = ${JSON.stringify(navigationTreeObject, null, 2)};
`;

    fs.writeFileSync(outputPath, fileContent, 'utf8');
    logger.info(`${LOG_PREFIX} Navigation tree generated successfully at ${path.relative(process.cwd(), outputPath)}`);

    // Note: NavNode interface is still used internally by scanning logic, so lib/nav-node.ts is NOT removed.
}

main().catch(error => {
  // Use logger for the final error
  logger.error(`${LOG_PREFIX} Critical error during navigation tree generation:`, { error });
  process.exit(1);
});
// --- Execution & Output --- END
