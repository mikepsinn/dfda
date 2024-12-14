import { readdir, readFile } from 'fs/promises'
import { join, relative } from 'path'
import * as fs from 'fs/promises'

interface ComponentUsage {
  name: string
  path: string
  usedIn: string[]
  isUnused: boolean
}

async function getAllComponents(baseDir: string): Promise<string[]> {
  const componentDirs = ['components', 'app']
  let componentFiles: string[] = []

  for (const dir of componentDirs) {
    const fullPath = join(baseDir, dir)
    try {
      const files = await readdir(fullPath, { recursive: true })
      const tsxFiles = files
        .filter(file => file.endsWith('.tsx'))
        .map(file => join(dir, file))
      componentFiles = [...componentFiles, ...tsxFiles]
    } catch (error) {
      console.warn(`Could not read directory ${dir}:`, error)
    }
  }

  return componentFiles
}

async function extractComponentName(filePath: string): Promise<string> {
  const content = await readFile(filePath, 'utf-8')
  const exportMatch = content.match(/export\s+(?:default\s+)?(?:function|const)\s+(\w+)/)
  if (exportMatch) {
    return exportMatch[1]
  }
  // Fallback to file name
  const fileName = filePath.split('/').pop()?.replace('.tsx', '') || ''
  return fileName
}

async function findComponentUsage(componentName: string, searchDirs: string[]): Promise<string[]> {
  const usedIn: string[] = []

  for (const dir of searchDirs) {
    try {
      const files = await readdir(dir, { recursive: true })
      for (const file of files) {
        if (file.endsWith('.tsx') || file.endsWith('.ts')) {
          const filePath = join(dir, file)
          const content = await readFile(filePath, 'utf-8')
          if (content.includes(componentName)) {
            usedIn.push(relative(process.cwd(), filePath))
          }
        }
      }
    } catch (error) {
      console.warn(`Error searching directory ${dir}:`, error)
    }
  }

  return usedIn
}

async function analyzeComponents() {
  const baseDir = process.cwd()
  const componentFiles = await getAllComponents(baseDir)
  const results: ComponentUsage[] = []

  for (const componentFile of componentFiles) {
    const fullPath = join(baseDir, componentFile)
    const componentName = await extractComponentName(fullPath)
    const usedIn = await findComponentUsage(
      componentName,
      ['app', 'components', 'pages', 'lib']
    )

    // Remove self-reference from usedIn
    const usedInOthers = usedIn.filter(path => path !== componentFile)

    results.push({
      name: componentName,
      path: componentFile,
      usedIn: usedInOthers,
      isUnused: usedInOthers.length === 0
    })
  }

  // Print results
  console.log('\nPotentially unused components:')
  const unusedComponents = results.filter(r => r.isUnused)
  
  if (unusedComponents.length === 0) {
    console.log('No unused components found!')
  } else {
    unusedComponents.forEach(component => {
      console.log(`\n${component.name}`)
      console.log(`Path: ${component.path}`)
    })
  }

  // Print summary
  console.log(`\nSummary:`)
  console.log(`Total components: ${results.length}`)
  console.log(`Unused components: ${unusedComponents.length}`)

  // Write results to file
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalComponents: results.length,
      unusedComponents: unusedComponents.length
    },
    unusedComponents: unusedComponents,
    allComponents: results
  }

  await fs.writeFile(
    'unused-components-report.json',
    JSON.stringify(report, null, 2)
  )
  console.log('\nDetailed report written to unused-components-report.json')
}

// Run the analysis
analyzeComponents().catch(console.error) 