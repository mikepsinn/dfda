/**
 * @jest-environment node
 */
import { generateRouteTree } from '@/scripts/generateRouteTree'
import { routeTree } from '@/config/routeTree'

// Helper function to strip metadata from a route tree node
function stripMetadata(node: any): any {
  const { emoji, description, displayName, ...strippedNode } = node
  
  if (strippedNode.children) {
    strippedNode.children = Object.entries(strippedNode.children).reduce((acc, [key, child]) => ({
      ...acc,
      [key]: stripMetadata(child)
    }), {})
  }
  
  return strippedNode
}

describe('Integration - Route Tree', () => {
  it('should have an up-to-date route tree structure', async () => {
    // Generate a fresh route tree
    const freshRouteTree = generateRouteTree()
    
    // Strip metadata from both trees before comparing
    const strippedCurrentTree = stripMetadata(routeTree)
    const strippedFreshTree = stripMetadata(freshRouteTree)
    
    // Compare the stripped trees
    const currentTreeString = JSON.stringify(strippedCurrentTree, null, 2)
    const freshTreeString = JSON.stringify(strippedFreshTree, null, 2)

    if (currentTreeString !== freshTreeString) {
      console.log('\nRoute tree structure is out of date! Please run:')
      console.log('pnpm generate-routes\n')
      console.log('Changes needed:')
      
      // Parse both trees to compare them
      const currentTree = JSON.parse(currentTreeString)
      const freshTree = JSON.parse(freshTreeString)
      
      // Find missing routes
      const currentPaths = getAllPaths(currentTree)
      const freshPaths = getAllPaths(freshTree)
      
      const missingPaths = freshPaths.filter(path => !currentPaths.includes(path))
      const removedPaths = currentPaths.filter(path => !freshPaths.includes(path))
      
      if (missingPaths.length > 0) {
        console.log('\nNew routes that need to be added:')
        missingPaths.forEach(path => console.log(`+ ${path}`))
      }
      
      if (removedPaths.length > 0) {
        console.log('\nOld routes that should be removed:')
        removedPaths.forEach(path => console.log(`- ${path}`))
      }
      
      console.log('\n')
    }

    expect(currentTreeString).toBe(freshTreeString)
  })
})

// Helper function to get all paths from a route tree
function getAllPaths(tree: any, basePath: string = ''): string[] {
  let paths: string[] = []
  
  if (tree.path) {
    paths.push(tree.path)
  }
  
  if (tree.children) {
    Object.values(tree.children).forEach((child: any) => {
      paths = [...paths, ...getAllPaths(child, tree.path)]
    })
  }
  
  return paths
} 