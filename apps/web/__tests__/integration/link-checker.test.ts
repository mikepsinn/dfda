/**
 * @jest-environment node
 */
import { checkLink, extractLinksFromJsx } from '@/lib/utils/link-checker'
import fs from 'fs'
import path from 'path'

describe('Integration - Link Checker', () => {
  const MAX_CONCURRENT_CHECKS = 5 // Limit concurrent requests

  async function getAllTsxFiles(dir: string): Promise<string[]> {
    const files: string[] = []
    const items = fs.readdirSync(dir)
    
    for (const item of items) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        files.push(...await getAllTsxFiles(fullPath))
      } else if (item.endsWith('.tsx')) {
        files.push(fullPath)
      }
    }
    
    return files
  }

  async function checkLinksInBatches(links: Array<{ url: string; location: { filePath: string; lineNumber: number; columnNumber: number } }>): Promise<{ valid: string[], invalid: Array<{ url: string; error: string; location: { filePath: string; lineNumber: number; columnNumber: number } }> }> {
    const results = {
      valid: [] as string[],
      invalid: [] as Array<{ url: string; error: string; location: { filePath: string; lineNumber: number; columnNumber: number } }>
    }

    // Process links in batches
    for (let i = 0; i < links.length; i += MAX_CONCURRENT_CHECKS) {
      const batch = links.slice(i, i + MAX_CONCURRENT_CHECKS)
      const checkResults = await Promise.all(
        batch.map(({ url, location }) => checkLink(url, location))
      )
      
      checkResults.forEach(result => {
        if (result.isValid) {
          results.valid.push(result.url)
        } else {
          results.invalid.push({
            url: result.url,
            error: result.error || `Status: ${result.statusCode}`,
            location: result.location!
          })
        }
      })
    }

    return results
  }

  function formatTable(brokenLinks: Array<{ url: string; error: string; location: { filePath: string; lineNumber: number; columnNumber: number } }>) {
    if (brokenLinks.length === 0) return ''

    // Calculate column widths
    const urlWidth = Math.max(15, ...brokenLinks.map(link => link.url.length))
    const locationWidth = Math.max(20, ...brokenLinks.map(link => {
      const relativePath = path.relative(process.cwd(), link.location.filePath)
      return `${relativePath}:${link.location.lineNumber}`.length
    }))
    const errorWidth = Math.max(15, ...brokenLinks.map(link => link.error.length))

    // Create header
    const header = [
      'URL'.padEnd(urlWidth),
      'Location'.padEnd(locationWidth),
      'Error'.padEnd(errorWidth)
    ].join(' | ')

    // Create separator
    const separator = [
      '-'.repeat(urlWidth),
      '-'.repeat(locationWidth),
      '-'.repeat(errorWidth)
    ].join(' | ')

    // Create rows
    const rows = brokenLinks.map(link => {
      const relativePath = path.relative(process.cwd(), link.location.filePath)
      return [
        link.url.padEnd(urlWidth),
        `${relativePath}:${link.location.lineNumber}`.padEnd(locationWidth),
        link.error.padEnd(errorWidth)
      ].join(' | ')
    })

    return '\nBroken Links Report:\n' + [header, separator, ...rows].join('\n') + '\n'
  }

  it('should validate all links in the codebase', async () => {
    // Get all TSX files from app and components directories
    const tsxFiles = [
      ...await getAllTsxFiles(path.join(process.cwd(), 'app')),
      ...await getAllTsxFiles(path.join(process.cwd(), 'components'))
    ]

    // Extract links from all files with their locations
    const allLinks: Array<{ url: string; location: { filePath: string; lineNumber: number; columnNumber: number } }> = []
    for (const file of tsxFiles) {
      const content = fs.readFileSync(file, 'utf-8')
      const fileLinks = extractLinksFromJsx(content, file)
      allLinks.push(...fileLinks)
    }

    // Check all links
    const results = await checkLinksInBatches(allLinks)

    // Format and display results
    if (results.invalid.length > 0) {
      const table = formatTable(results.invalid)
      console.log(table)
    } else {
      console.log('\n✅ All links are valid!\n')
    }

    // Assert all links are valid
    expect(results.invalid).toHaveLength(0)
  }, 60000) // Increased timeout for integration test
}) 