import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { z } from 'zod'
import { generateObject } from 'ai'
import { getModelByName } from '../lib/utils/modelUtils'

// Load environment variables first
const envPath = path.join(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  console.log('Loading environment from .env file...')
  dotenv.config({ path: envPath })
} else {
  console.warn('No .env file found in', process.cwd())
}

interface RouteNode {
  name: string
  path: string
  isDynamic: boolean
  emoji?: string
  description?: string
  displayName?: string
  children: { [key: string]: RouteNode }
}

// Schema for route metadata
const RouteMetadataSchema = z.object({
  routes: z.array(z.object({
    path: z.string().describe("The route path"),
    emoji: z.string().describe("A single emoji that best represents this route's purpose"),
    description: z.string().describe("A brief, clear description of what this route does or shows"),
    displayName: z.string().describe("A user-friendly name for this route, in Title Case")
  })).describe("Array of route metadata")
})

// Extract all paths and existing metadata from the route tree
function getAllPathsAndMetadata(tree: RouteNode): { paths: string[], metadata: Map<string, any> } {
  let paths: string[] = []
  let metadata = new Map<string, any>()
  
  if (tree.path) {
    paths.push(tree.path)
    // Only add metadata if at least one field exists
    if (tree.emoji || tree.description || tree.displayName) {
      const metadataObj: any = {}
      // Only include fields that actually exist
      if (tree.emoji) metadataObj.emoji = tree.emoji
      if (tree.description) metadataObj.description = tree.description
      if (tree.displayName) metadataObj.displayName = tree.displayName
      metadata.set(tree.path, metadataObj)
    }
  }
  
  if (tree.children) {
    Object.values(tree.children).forEach((child) => {
      const { paths: childPaths, metadata: childMetadata } = getAllPathsAndMetadata(child)
      paths = [...paths, ...childPaths]
      childMetadata.forEach((value, key) => {
        // Merge metadata if both exist, otherwise just set
        if (metadata.has(key)) {
          const existing = metadata.get(key)
          metadata.set(key, {
            emoji: existing.emoji || value.emoji,
            description: existing.description || value.description,
            displayName: existing.displayName || value.displayName
          })
        } else {
          metadata.set(key, value)
        }
      })
    })
  }
  
  return { paths, metadata }
}

// Add metadata to the route tree while preserving existing metadata
function addMetadataToTree(tree: RouteNode, metadata: any[], existingMetadata: Map<string, any>): RouteNode {
  const newTree = { ...tree }
  
  // Find metadata for current path
  if (newTree.path) {
    // First, apply any existing metadata from the current tree
    const currentMetadata = {
      emoji: newTree.emoji,
      description: newTree.description,
      displayName: newTree.displayName
    }

    // Then, apply any metadata from the existing metadata map
    const existing = existingMetadata.get(newTree.path)
    if (existing) {
      // Only use existing metadata if it exists and isn't already set in current tree
      if (!currentMetadata.emoji) newTree.emoji = existing.emoji
      if (!currentMetadata.description) newTree.description = existing.description
      if (!currentMetadata.displayName) newTree.displayName = existing.displayName
    }

    // Finally, only apply new metadata if we still have missing fields
    if (!newTree.emoji || !newTree.description || !newTree.displayName) {
      const routeMetadata = metadata.find(m => m.path === newTree.path)
      if (routeMetadata) {
        if (!newTree.emoji) newTree.emoji = routeMetadata.emoji
        if (!newTree.description) newTree.description = routeMetadata.description
        if (!newTree.displayName) newTree.displayName = routeMetadata.displayName
      }
    }
  }
  
  // Recursively process children
  if (newTree.children) {
    newTree.children = Object.entries(newTree.children).reduce((acc, [key, child]) => ({
      ...acc,
      [key]: addMetadataToTree(child, metadata, existingMetadata)
    }), {})
  }
  
  return newTree
}

export function generateRouteTree(dir: string = 'app', parentPath: string = ''): RouteNode {
  const root: RouteNode = {
    name: 'root',
    path: '/',
    isDynamic: false,
    children: {}
  }

  const items = fs.readdirSync(path.join(process.cwd(), dir))

  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory() && !item.startsWith('_') && !item.startsWith('.')) {
      const segmentName = item
      const isDynamic = segmentName.startsWith('[') && segmentName.endsWith(']')
      const cleanName = isDynamic ? segmentName.slice(1, -1) : segmentName
      const routePath = `${parentPath}/${segmentName}`

      // Check if directory contains page.tsx
      const hasPage = fs.existsSync(path.join(fullPath, 'page.tsx'))

      if (hasPage) {
        console.log(`Found page: ${routePath}`)
        const node: RouteNode = {
          name: cleanName,
          path: routePath,
          isDynamic,
          children: {}
        }

        // Recursively process subdirectories
        const subTree = generateRouteTree(fullPath, routePath)
        node.children = subTree.children

        root.children[cleanName] = node
      }
    }
  }

  return root
}

async function generateRouteDescriptions(routeTree: RouteNode, existingRouteTree: RouteNode | null = null): Promise<RouteNode> {
  // If we have an existing tree, use it as the source of metadata
  const existingMetadata = new Map<string, any>()
  if (existingRouteTree) {
    const { metadata } = getAllPathsAndMetadata(existingRouteTree)
    metadata.forEach((value, key) => existingMetadata.set(key, value))
  }

  // Get all paths and existing metadata from current tree
  const { paths, metadata: currentMetadata } = getAllPathsAndMetadata(routeTree)
  
  // Merge existing metadata with current metadata
  currentMetadata.forEach((value, key) => {
    if (existingMetadata.has(key)) {
      const existing = existingMetadata.get(key)
      existingMetadata.set(key, {
        emoji: value.emoji || existing.emoji,
        description: value.description || existing.description,
        displayName: value.displayName || existing.displayName
      })
    } else {
      existingMetadata.set(key, value)
    }
  })
  
  // Filter out paths that already have complete metadata
  const pathsNeedingMetadata = paths.filter(path => {
    const existing = existingMetadata.get(path)
    return !existing || !existing.emoji || !existing.description || !existing.displayName
  })
  
  if (pathsNeedingMetadata.length === 0) {
    console.log('✨ All routes already have complete metadata!')
    return addMetadataToTree(routeTree, [], existingMetadata)
  }
  
  // Create a prompt that explains the context
  const prompt = `You are helping to generate metadata for a Next.js application's routes.
For each route path, provide:
1. A single, relevant emoji that best represents the route's purpose
2. A clear, concise description of what the route does
3. A user-friendly display name in Title Case

Consider the path structure and naming to infer the route's purpose.
Dynamic route parameters are shown in square brackets, e.g. [id].

Example good descriptions:
- "/dashboard": "📊 View your personal dashboard with key metrics and recent activity"
- "/users/[id]": "👤 View and manage details for a specific user"
- "/settings": "⚙️ Configure your account and application preferences"

Here are the application routes that need metadata:
${pathsNeedingMetadata.map(p => `- ${p}`).join('\n')}
`

  // Generate metadata only for routes that need it
  console.log(`🤖 Generating metadata for ${pathsNeedingMetadata.length} routes...`)
  const model = getModelByName()
  console.log('🔧 Using model:', model)
  
  const result = await generateObject({
    model,
    schema: RouteMetadataSchema,
    prompt,
  })

  // Add metadata to the route tree while preserving existing metadata
  return addMetadataToTree(routeTree, result.object.routes, existingMetadata)
}

async function main() {
  // First generate the route tree
  console.log('Generating route tree...')
  const routeTree = generateRouteTree()
  console.log('Generated route tree:', JSON.stringify(routeTree, null, 2))

  // Read existing route tree if it exists
  let existingRouteTree: RouteNode | null = null
  const routeTreePath = path.join(process.cwd(), 'config/routeTree.ts')
  if (fs.existsSync(routeTreePath)) {
    try {
      const fileContent = fs.readFileSync(routeTreePath, 'utf8')
      // Extract the route tree object from the file content using regex
      const match = fileContent.match(/export const routeTree = (\{[\s\S]*?\}) as const;/)
      if (match) {
        existingRouteTree = JSON.parse(match[1])
        console.log('Found existing route tree')
      }
    } catch (error) {
      console.warn('Error reading existing route tree:', error)
    }
  }

  // Then enhance it with metadata, using existing metadata if available
  console.log('\nGenerating route descriptions...')
  const enhancedTree = await generateRouteDescriptions(routeTree, existingRouteTree)

  // Save the enhanced route tree
  const output = `// Generated route tree - do not edit manually
// Regenerate with: pnpm generate-routes
export const routeTree = ${JSON.stringify(enhancedTree, null, 2)} as const;

export type RouteNode = {
  name: string;
  path: string;
  isDynamic: boolean;
  emoji?: string;
  description?: string;
  displayName?: string;
  children: { [key: string]: RouteNode };
};
`

  fs.writeFileSync(
    path.join(process.cwd(), 'config/routeTree.ts'),
    output
  )

  console.log('✨ Route tree and descriptions generated successfully!')
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { generateRouteDescriptions } 