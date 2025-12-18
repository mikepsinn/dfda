/**
 * @jest-environment node
 */
import fs from 'fs'
import path from 'path'

describe('Integration - Static Pages', () => {
  describe('Page Files Exist', () => {
    it('should have privacy policy page', () => {
      const privacyPath = path.join(process.cwd(), 'app', '(frontpage)', 'privacy', 'page.tsx')
      expect(fs.existsSync(privacyPath)).toBe(true)
    })

    it('should have contact us page', () => {
      const contactPath = path.join(process.cwd(), 'app', '(frontpage)', 'contact-us', 'page.tsx')
      expect(fs.existsSync(contactPath)).toBe(true)
    })

    it('should have help page', () => {
      const helpPath = path.join(process.cwd(), 'app', '(frontpage)', 'help', 'page.tsx')
      expect(fs.existsSync(helpPath)).toBe(true)
    })

    it('should have homepage', () => {
      const homePath = path.join(process.cwd(), 'app', '(frontpage)', 'page.tsx')
      expect(fs.existsSync(homePath)).toBe(true)
    })
  })

  describe('Page Content Validation', () => {
    it('privacy page should export default component', () => {
      const privacyPath = path.join(process.cwd(), 'app', '(frontpage)', 'privacy', 'page.tsx')
      const content = fs.readFileSync(privacyPath, 'utf-8')

      expect(content).toContain('export default')
      expect(content.toLowerCase()).toContain('privacy')
    })

    it('contact page should export default component', () => {
      const contactPath = path.join(process.cwd(), 'app', '(frontpage)', 'contact-us', 'page.tsx')
      const content = fs.readFileSync(contactPath, 'utf-8')

      expect(content).toContain('export default')
    })

    it('homepage should include condition search functionality', () => {
      const homePath = path.join(process.cwd(), 'app', '(frontpage)', 'page.tsx')
      const content = fs.readFileSync(homePath, 'utf-8')

      expect(content).toContain('export default')
      // Should import DFDAHomePage or similar
      expect(content).toMatch(/import.*DFDAHomePage|import.*HowItWorksSection/i)
    })
  })

  describe('Required App Pages', () => {
    it('should have 404 not-found page', () => {
      const notFoundPath = path.join(process.cwd(), 'app', 'not-found.tsx')
      expect(fs.existsSync(notFoundPath)).toBe(true)
    })

    it('should have error boundary', () => {
      const errorPath = path.join(process.cwd(), 'app', 'error.tsx')
      expect(fs.existsSync(errorPath)).toBe(true)
    })

    it('should have root layout', () => {
      const layoutPath = path.join(process.cwd(), 'app', 'layout.tsx')
      expect(fs.existsSync(layoutPath)).toBe(true)
    })
  })

  describe('Auth Pages', () => {
    it('should have signin page', () => {
      const signinPath = path.join(process.cwd(), 'app', '(auth)', 'signin', 'page.tsx')
      expect(fs.existsSync(signinPath)).toBe(true)
    })

    it('should have signup page', () => {
      const signupPath = path.join(process.cwd(), 'app', '(auth)', 'signup', 'page.tsx')
      expect(fs.existsSync(signupPath)).toBe(true)
    })

    it('should have auth error page', () => {
      const authErrorPath = path.join(process.cwd(), 'app', 'auth', 'error', 'page.tsx')
      expect(fs.existsSync(authErrorPath)).toBe(true)
    })
  })

  describe('Documentation Pages', () => {
    it('should have docs directory', () => {
      const docsPath = path.join(process.cwd(), 'app', 'docs')
      expect(fs.existsSync(docsPath)).toBe(true)
      expect(fs.statSync(docsPath).isDirectory()).toBe(true)
    })

    it('should have docs index page', () => {
      const docsIndexPath = path.join(process.cwd(), 'app', 'docs', 'page.tsx')
      expect(fs.existsSync(docsIndexPath)).toBe(true)
    })

    it('should have dynamic docs pages', () => {
      const dynamicDocsPath = path.join(process.cwd(), 'app', 'docs', '[...filename]', 'page.tsx')
      expect(fs.existsSync(dynamicDocsPath)).toBe(true)
    })
  })

  describe('User Dashboard', () => {
    it('should have dashboard page', () => {
      const dashboardPath = path.join(process.cwd(), 'app', 'dashboard', 'page.tsx')
      expect(fs.existsSync(dashboardPath)).toBe(true)
    })

    it('should have settings page', () => {
      const settingsPath = path.join(process.cwd(), 'app', 'settings', 'page.tsx')
      expect(fs.existsSync(settingsPath)).toBe(true)
    })

    it('should have measurements pages', () => {
      const measurementsPath = path.join(process.cwd(), 'app', 'measurements', 'page.tsx')
      expect(fs.existsSync(measurementsPath)).toBe(true)
    })
  })

  describe('Data Pages', () => {
    it('should have variables list page', () => {
      const variablesPath = path.join(process.cwd(), 'app', 'variables', 'page.tsx')
      expect(fs.existsSync(variablesPath)).toBe(true)
    })

    it('should have variable categories page', () => {
      const categoriesPath = path.join(process.cwd(), 'app', 'variable-categories', 'page.tsx')
      expect(fs.existsSync(categoriesPath)).toBe(true)
    })

    it('should have studies page', () => {
      const studiesPath = path.join(process.cwd(), 'app', 'studies', 'page.tsx')
      expect(fs.existsSync(studiesPath)).toBe(true)
    })

    it('should have conditions page', () => {
      const conditionsPath = path.join(process.cwd(), 'app', 'conditions', 'page.tsx')
      expect(fs.existsSync(conditionsPath)).toBe(true)
    })

    it('should have treatments page', () => {
      const treatmentsPath = path.join(process.cwd(), 'app', 'treatments', 'page.tsx')
      expect(fs.existsSync(treatmentsPath)).toBe(true)
    })
  })
})
