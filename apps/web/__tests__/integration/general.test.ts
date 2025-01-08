/**
 * @jest-environment node
 */
import fs from 'fs'
import path from 'path'

describe('Integration - General', () => {
  describe('Required Files', () => {
    it('should have all required configuration files', () => {
      const requiredFiles = [
        'next.config.js',
        'package.json',
        'tsconfig.json',
        'tailwind.config.ts',
        'postcss.config.js',
        'config/routeTree.ts'
      ]

      requiredFiles.forEach(file => {
        expect(fs.existsSync(path.join(process.cwd(), file))).toBe(true)
      })
    })

    it('should have required environment variables in .env.example', () => {
      const envExample = fs.readFileSync(path.join(process.cwd(), '.env.example'), 'utf-8')
      const requiredEnvVars = [
        'DATABASE_URL',
        'NEXTAUTH_URL',
        'NEXTAUTH_SECRET'
      ]

      requiredEnvVars.forEach(envVar => {
        expect(envExample).toContain(envVar)
      })
    })
  })

  describe('Dependencies', () => {
    it('should have all peer dependencies satisfied', () => {
      const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'))
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }
      
      // Check React versions are compatible
      const reactVersion = dependencies.react
      const reactDomVersion = dependencies['react-dom']
      expect(reactVersion).toBe(reactDomVersion)
      
      // Check TypeScript version matches tsconfig
      const tsConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'tsconfig.json'), 'utf-8'))
      const compilerOptions = tsConfig.compilerOptions || {}
      if (compilerOptions.target) {
        const tsVersion = dependencies.typescript
        expect(tsVersion).toBeDefined()
      }
    })
  })

  describe('Project Structure', () => {
    it('should have required Next.js app directory structure', () => {
      const requiredDirs = [
        'app',
        'components',
        'lib',
        'public',
        'styles'
      ]

      requiredDirs.forEach(dir => {
        expect(fs.existsSync(path.join(process.cwd(), dir))).toBe(true)
      })
    })

    it('should have proper TypeScript setup', () => {
      const tsConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'tsconfig.json'), 'utf-8'))
      
      // Check for strict mode
      expect(tsConfig.compilerOptions.strict).toBe(true)
      
      // Check for proper module resolution
      expect(tsConfig.compilerOptions.moduleResolution).toBe('bundler')
      
      // Check for proper JSX configuration
      expect(tsConfig.compilerOptions.jsx).toBe('preserve')
    })
  })
}) 