const fs = require('fs')
const path = require('path')
const glob = require('glob')

// Components to move (not duplicates)
const componentsToMove: string[] = ['dialog.tsx', 'theme-provider.tsx', 'icons.tsx']

// Components to delete (duplicates)
const componentsToDelete: string[] = [
  'button.tsx', 'switch.tsx', 'checkbox.tsx', 'badge.tsx',
  'select.tsx', 'radio-group.tsx', 'separator.tsx', 'progress.tsx',
  'tabs.tsx', 'textarea.tsx', 'label.tsx', 'input.tsx', 'sheet.tsx',
  'tooltip.tsx', 'card.tsx', 'alert.tsx'
]

function ensureDirectoryExists(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function moveFile(sourcePath: string, destPath: string): void {
  try {
    if (fs.existsSync(sourcePath)) {
      // Create destination directory if it doesn't exist
      const destDir = path.dirname(destPath)
      ensureDirectoryExists(destDir)

      // Check if destination file exists
      if (fs.existsSync(destPath)) {
        const sourceContent: string = fs.readFileSync(sourcePath, 'utf8')
        const destContent: string = fs.readFileSync(destPath, 'utf8')
        
        if (sourceContent === destContent) {
          console.log(`${path.basename(sourcePath)} is identical, removing source`)
          fs.unlinkSync(sourcePath)
        } else {
          console.warn(`Warning: ${path.basename(sourcePath)} differs from destination version, keeping destination version`)
          fs.unlinkSync(sourcePath)
        }
      } else {
        fs.copyFileSync(sourcePath, destPath)
        fs.unlinkSync(sourcePath)
        console.log(`Moved ${path.basename(sourcePath)} to ${path.relative(process.cwd(), destPath)}`)
      }
    }
  } catch (error) {
    console.error(`Error moving file ${sourcePath}:`, error)
    process.exit(1)
  }
}

function updateImports(files: string[]): void {
  files.forEach((file: string) => {
    try {
      const filePath: string = path.join(process.cwd(), file)
      let content: string = fs.readFileSync(filePath, 'utf8')
      let hasChanges: boolean = false

      // Update imports from @/app/components to @/components
      const oldImportPattern: RegExp = /@\/app\/components\//g
      const newImportPath: string = '@/components/'
      
      if (oldImportPattern.test(content)) {
        content = content.replace(oldImportPattern, newImportPath)
        hasChanges = true
        console.log(`Updated imports in ${file} from @/app/components to @/components`)
      }

      if (hasChanges) {
        fs.writeFileSync(filePath, content)
      }
    } catch (error) {
      console.error(`Error updating imports in ${file}:`, error)
      process.exit(1)
    }
  })
}

try {
  const appComponentsDir: string = path.join(process.cwd(), 'app', 'components')
  const componentsDir: string = path.join(process.cwd(), 'components')

  // Ensure the destination directory exists
  ensureDirectoryExists(componentsDir)

  // Get all files in app/components recursively
  const componentFiles: string[] = glob.sync('**/*', {
    cwd: appComponentsDir,
    nodir: true,
    absolute: true
  })

  // Move each file
  componentFiles.forEach((sourcePath: string) => {
    const relativePath: string = path.relative(appComponentsDir, sourcePath)
    const destPath: string = path.join(componentsDir, relativePath)
    moveFile(sourcePath, destPath)
  })

  // Remove empty directories in app/components
  if (fs.existsSync(appComponentsDir)) {
    const removeEmptyDirs = (dir: string) => {
      let files = fs.readdirSync(dir)
      
      for (const file of files) {
        const fullPath = path.join(dir, file)
        if (fs.statSync(fullPath).isDirectory()) {
          removeEmptyDirs(fullPath)
        }
      }
      
      files = fs.readdirSync(dir)
      if (files.length === 0) {
        fs.rmdirSync(dir)
        console.log(`Removed empty directory: ${dir}`)
      }
    }
    
    removeEmptyDirs(appComponentsDir)
  }

  // Update imports in all TypeScript/JavaScript files
  const files: string[] = glob.sync('**/*.{ts,tsx,js,jsx}', {
    ignore: ['node_modules/**', '.next/**', 'scripts/**'],
    cwd: process.cwd()
  })

  updateImports(files)

  console.log('Component migration completed successfully!')
} catch (error) {
  console.error('Migration failed:', error)
  process.exit(1)
} 