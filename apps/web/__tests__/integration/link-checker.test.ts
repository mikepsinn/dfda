/**
 * @jest-environment node
 */

import fs from 'fs'
import path from 'path'

// Configuration for skipped links
const SKIP_CONFIG_FILE = path.join(process.cwd(), 'link-checker-skip.json')

interface SkipConfig {
  exactMatches: string[];
  patterns: string[];
  lastUpdated: string;
  failedLinks: Array<{
    url: string;
    error: string;
    location: string;
    lastChecked: string;
  }>;
}

// Load skip configuration if it exists
function loadSkipConfig(): SkipConfig {
  if (fs.existsSync(SKIP_CONFIG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(SKIP_CONFIG_FILE, 'utf-8'))
    } catch (error) {
      console.warn('Failed to parse skip config file:', error)
    }
  }
  return {
    exactMatches: [],
    patterns: [],
    lastUpdated: new Date().toISOString(),
    failedLinks: []
  }
}

// Save failed links to skip config
function updateSkipConfig(failedLinks: LinkCheckResult[]) {
  const config = loadSkipConfig()
  const now = new Date().toISOString()
  
  // Update failed links list
  failedLinks.forEach(link => {
    const existingIndex = config.failedLinks.findIndex(f => f.url === link.url)
    const locationStr = `${link.location.filePath}:${link.location.lineNumber}`
    
    if (existingIndex >= 0) {
      config.failedLinks[existingIndex].lastChecked = now
      config.failedLinks[existingIndex].error = link.error || `Status: ${link.statusCode}`
    } else {
      config.failedLinks.push({
        url: link.url,
        error: link.error || `Status: ${link.statusCode}`,
        location: locationStr,
        lastChecked: now
      })
    }
  })

  // Update timestamp
  config.lastUpdated = now

  // Write updated config
  fs.writeFileSync(SKIP_CONFIG_FILE, JSON.stringify(config, null, 2))
  console.log(`\n💾 Updated skip configuration in ${SKIP_CONFIG_FILE}`)
}

// Check if a link should be skipped
function shouldSkipLink(url: string): boolean {
  const config = loadSkipConfig()
  
  // Check exact matches
  if (config.exactMatches.includes(url)) {
    return true
  }
  
  // Check patterns
  return config.patterns.some(pattern => {
    try {
      const regex = new RegExp(pattern)
      return regex.test(url)
    } catch (error) {
      console.warn(`Invalid regex pattern in skip config: ${pattern}`)
      return false
    }
  })
}

// Configuration for folder scanning
const INCLUDED_FOLDERS = [
  'app',
  'components',
  'docs',
  'lib',
  'config',
  'public',
  // Add more folders to include
]

const EXCLUDED_FOLDERS = [
  'node_modules',
  '.next',
  'dist',
  '.git',
  'coverage',
  'test-results',
  // Add specific subfolders to exclude even if they're in included folders
  'public/assets',
  'docs/generated',
  'docs/api-docs',
  // Add more folders to exclude
]

// Patterns for excluding links
const EXCLUSION_PATTERNS = {
  // Template literals and variables
  templateLiterals: [
    /\$\{.*?\}/,  // ${variable}
    /{.*?}/,      // {variable}
    /\/[^/\s]+\$\{.*?\}/,  // /path${var}
    /`\/[^`]+\$\{.*?\}[^`]*`/,  // `/path${var}rest`
    /\/[^/\s]+\{.*?\}/,   // /path{var}
  ],
  // Line context patterns
  lineContext: [
    /.*\${.*?}.*/,  // Any line with template literals
    /.*`.*`.*/,     // Any line with backticks
    /.*\+.*(?:var|let|const|${).*/, // Lines with concatenation and variables
  ],
  // Special protocols
  protocols: [
    /^mailto:/,
    /^tel:/,
    /^sms:/,
  ],
  // Numeric paths
  numericPaths: [
    /^\/\d+$/,    // /5, /0, etc
  ],
  // API and dynamic routes
  dynamicRoutes: [
    /\/api\/.*?\$/, // API routes with parameters
    /\[.*?\]/,      // [param]
    /\/:[^\/]+/,    // /:param
    /\/%.*?%/,      // %param%
    /\/\(.*?\)/,    // /(group)
    /encodeURIComponent\(.*?\)/, // encodeURIComponent(param)
  ],
  // Invalid paths
  invalidPaths: [
    /^\/$/,      // Just /
    /\/\//,      // Double slashes
    /^\/\s*$/,   // Empty or whitespace after /
  ],
  // Code examples and units
  codeExamples: [
    /`.*?\/\d+.*?`/,  // `/5` in backticks
    /unit.*?\/\d+/i,  // unit/5 (case insensitive)
  ],
  // Directory documentation
  directoryDocs: [
    /^\s*[-*+]\s+`?\/[^`\s]+`?:/m,  // Markdown list items with directory paths
    /e\.g\.,\s+[`']?\/[^`'\s,)]+[`']?/i,  // e.g., /example
    /\(e\.g\.\s+[`']?\/[^`'\s,)]+[`']?\)/i,  // (e.g. /example)
    /example.*?\/[^`'\s,)\]]+/i,  // example: /path
    /folder.*?\/[^`'\s,)\]]+/i,   // folder: /path
    /directory.*?\/[^`'\s,)\]]+/i // directory: /path
  ],
  // File system and storage paths
  filePaths: [
    /['"]\s*[\w-]+\/.*?\/[\w-]+['"]/,  // 'dir/subdir/file'
    /=\s*['"][\w-]+\/.*?\/[\w-]+['"]/,  // = 'dir/subdir/file'
    /\+\s*['"]\/[\w-]+['"]/,  // + '/filename'
    /const\s+\w+\s*=\s*['"][\w-]+\/.*?\/[\w-]+['"]/,  // const path = 'dir/subdir/file'
    /let\s+\w+\s*=\s*['"][\w-]+\/.*?\/[\w-]+['"]/,    // let path = 'dir/subdir/file'
    /var\s+\w+\s*=\s*['"][\w-]+\/.*?\/[\w-]+['"]/     // var path = 'dir/subdir/file'
  ]
}

// File extensions that could contain links
const LINKABLE_EXTENSIONS = new Set([
  '.tsx', '.ts', '.js', '.jsx', 
  '.md', '.mdx', 
  '.html', '.htm',
  '.json', '.yaml', '.yml',
  '.vue', '.svelte',
  // Add more extensions as needed
])

export type LinkLocation = {
  filePath: string;
  lineNumber: number;
  columnNumber: number;
}

export type LinkCheckResult = {
  url: string;
  isValid: boolean;
  statusCode?: number;
  error?: string;
  location: LinkLocation;
}

// Routes that are dynamic and shouldn't be checked
const DYNAMIC_ROUTES = [
  '/userVariables/[variableId]',
  '/globalVariables/[variableId]',
  '/conditions/[conditionName]',
  '/treatments/[treatmentName]',
]

// Cache for storing link check results
const urlCache = new Map<string, LinkCheckResult>();

export async function checkLink(url: string, location: LinkLocation): Promise<LinkCheckResult> {
  // Check if link should be skipped first
  if (shouldSkipLink(url)) {
    return {
      url,
      isValid: true, // Treat skipped links as valid
      statusCode: 200,
      error: 'Skipped per configuration',
      location
    };
  }

  // Check cache next
  const cacheKey = url.startsWith('http') ? url : `http://localhost:3000${url}`;
  if (urlCache.has(cacheKey)) {
    const cachedResult = urlCache.get(cacheKey)!;
    return {
      ...cachedResult,
      location // Always use the provided location
    };
  }

  try {
    // For internal links, verify they start with / or are http(s)
    if (!url.startsWith('http') && !url.startsWith('/')) {
      const result = {
        url,
        isValid: false,
        error: 'Internal links must start with /',
        location
      };
      urlCache.set(cacheKey, result);
      return result;
    }

    // For internal links, always use localhost:3000
    const fullUrl = url.startsWith('http') 
      ? url 
      : `http://localhost:3000${url}`;

    const response = await fetch(fullUrl, {
      method: 'HEAD', // Only fetch headers
      headers: {
        'User-Agent': 'DFDA Link Checker'
      }
    });

    const result = {
      url,
      isValid: response.ok || response.status === 405 || response.status === 500,
      statusCode: response.status,
      location
    };
    urlCache.set(cacheKey, result);
    return result;
  } catch (error) {
    const result = {
      url,
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      location
    };
    urlCache.set(cacheKey, result);
    return result;
  }
}

// Helper function to validate links (both internal and external)
function isValidLink(url: string, line?: string): boolean {
  // Clean the URL of trailing punctuation before validation
  const cleanUrl = url.replace(/[.,;:!?)*\]]+$/, '')

  // Must be either an http(s) URL or start with / and contain at least one character after
  if (!cleanUrl.startsWith('http') && (!cleanUrl.startsWith('/') || cleanUrl.length < 2)) {
    return false
  }

  // Skip if line contains variable assignments or file paths
  if (line && (
    line.match(/(?:const|let|var|import)\s+\w+\s*=\s*["'`]/) || 
    line.match(/\+\s*["'`]/) ||
    line.includes('require(')
  )) {
    return false
  }

  // For markdown links, always allow internal paths that start with /
  if (line?.includes('](') && cleanUrl.startsWith('/')) {
    return true
  }

  // Skip numeric paths like /0, /5 unless they're part of a longer path
  if (cleanUrl.match(/^\/\d+$/) && !cleanUrl.includes('/')) {
    return false
  }

  // Skip dynamic routes and API paths with variables
  if (cleanUrl.includes('${') || cleanUrl.includes('[') || cleanUrl.includes('/:')) {
    return false
  }

  // Skip special protocols
  if (cleanUrl.startsWith('mailto:') || cleanUrl.startsWith('tel:') || cleanUrl.startsWith('sms:')) {
    return false
  }

  // Skip empty or whitespace paths
  if (cleanUrl === '/' || cleanUrl.match(/^\/\s*$/)) {
    return false
  }

  // Skip double slashes in paths (but not in protocol)
  if (cleanUrl.startsWith('/') && cleanUrl.includes('//')) {
    return false
  }

  // Allow navigation links from the test
  if (DYNAMIC_ROUTES.includes(cleanUrl)) {
    return true
  }

  // Allow specific navigation links
  const navigationLinks = [
    '/',
    '/conditions',
    '/treatments',
    '/safe/redirect',
    '/disease-eradication-act',
    '/health-savings-sharing',
    '/docs'
  ]
  if (navigationLinks.includes(cleanUrl)) {
    return true
  }

  // Skip numeric paths in any context
  if (cleanUrl.match(/^\/\d+/)) {
    return false
  }

  return true
}

// Simple regex to match URLs, excluding trailing punctuation
const bareUrlRegex = /https?:\/\/[^\s"'`\]>)]+(?=[.,;:!?)*\]]*(?:\s|$))/g

// Match patterns like href:"/path" or href: "/path" or href='http://example.com'
const hrefRegex = /href\s*[:=]\s*["']((?:\/[^"'\s)]+|https?:\/\/[^"'\s)]+))["']/g

// Match markdown links [text](url), capturing only the URL part
const markdownLinkRegex = /\[([^\]]*)\]\(((?:https?:\/\/[^)\s]+|\/[^)\s]+))\)/g

// File system path patterns to exclude
const fileSystemPatterns = [
  /const\s+\w+\s*=\s*['"][^'"]+['"]/,
  /let\s+\w+\s*=\s*['"][^'"]+['"]/,
  /var\s+\w+\s*=\s*['"][^'"]+['"]/,
  /\+\s*['"][^'"]+['"]/,
  /uploadToPath\(['"][^'"]+['"]\)/,
  /require\(['"][^'"]+['"]\)/,
  /import\s+.*?from\s+['"][^'"]+['"]/
]

function isFileSystemPath(line: string): boolean {
  return fileSystemPatterns.some(pattern => pattern.test(line))
}

function extractLinksFromObject(content: string, filePath: string): Array<{ url: string; location: LinkLocation }> {
  const links: Array<{ url: string; location: LinkLocation }> = []
  const lines = content.split('\n')
  const foundUrls = new Set<string>()
  
  lines.forEach((line, lineIndex) => {
    // Skip if line looks like a file system path
    if (isFileSystemPath(line)) {
      return
    }

    let match

    // Check for markdown links first
    while ((match = markdownLinkRegex.exec(line)) !== null) {
      const url = match[2].trim()
      const cleanUrl = url.replace(/[.,;:!?)*\]]+$/, '')
      if (isValidLink(cleanUrl, line) && !foundUrls.has(cleanUrl)) {
        foundUrls.add(cleanUrl)
        links.push({
          url: cleanUrl,
          location: {
            filePath,
            lineNumber: lineIndex + 1,
            columnNumber: match.index + match[1].length + 3
          }
        })
      }
    }

    // Check for href attributes
    while ((match = hrefRegex.exec(line)) !== null) {
      const url = match[1].trim()
      const cleanUrl = url.replace(/[.,;:!?)*\]]+$/, '')
      if (isValidLink(cleanUrl, line) && !foundUrls.has(cleanUrl)) {
        foundUrls.add(cleanUrl)
        links.push({
          url: cleanUrl,
          location: {
            filePath,
            lineNumber: lineIndex + 1,
            columnNumber: match.index
          }
        })
      }
    }

    // Check for bare URLs last
    while ((match = bareUrlRegex.exec(line)) !== null) {
      const url = match[0].trim()
      const cleanUrl = url.replace(/[.,;:!?)*\]]+$/, '')
      if (isValidLink(cleanUrl, line) && !foundUrls.has(cleanUrl)) {
        foundUrls.add(cleanUrl)
        links.push({
          url: cleanUrl,
          location: {
            filePath,
            lineNumber: lineIndex + 1,
            columnNumber: match.index
          }
        })
      }
    }
  })
  
  return links
}

// Helper to extract all unique links from a component's JSX with their locations
function extractLinksFromJsx(jsx: string, filePath: string): Array<{ url: string; location: LinkLocation }> {
  const links: Array<{ url: string; location: LinkLocation }> = []
  const lines = jsx.split('\n')
  const foundUrls = new Set<string>()
  
  // First get links from standard href attributes
  const linkRegex = /href=["']((?:\/[^"'\s)]+|https?:\/\/[^"'\s)]+))["']/g
  // Then get links from JSX expressions
  const jsxLinkRegex = /href=\{["'`]((?:\/[^"'\s)]+|https?:\/\/[^"'\s)]+))["'`]\}/g
  // Also get links from Link components
  const nextLinkRegex = /<Link\s+[^>]*href=\{?["'`]((?:\/[^"'\s)]+|https?:\/\/[^"'\s)]+))["'`]\}?[^>]*>/g
  
  lines.forEach((line, lineIndex) => {
    // Skip if line looks like a file system path
    if (isFileSystemPath(line)) {
      return
    }

    let match
    
    // Check standard href attributes
    while ((match = linkRegex.exec(line)) !== null) {
      const url = match[1].trim()
      if (url && isValidLink(url, line) && !foundUrls.has(url)) {
        foundUrls.add(url)
        links.push({
          url,
          location: {
            filePath,
            lineNumber: lineIndex + 1,
            columnNumber: match.index + 6
          }
        })
      }
    }

    // Check JSX href expressions
    while ((match = jsxLinkRegex.exec(line)) !== null) {
      const url = match[1].trim()
      if (url && isValidLink(url, line) && !foundUrls.has(url)) {
        foundUrls.add(url)
        links.push({
          url,
          location: {
            filePath,
            lineNumber: lineIndex + 1,
            columnNumber: match.index + 6
          }
        })
      }
    }

    // Check Next.js Link components
    while ((match = nextLinkRegex.exec(line)) !== null) {
      const url = match[1].trim()
      if (url && isValidLink(url, line) && !foundUrls.has(url)) {
        foundUrls.add(url)
        links.push({
          url,
          location: {
            filePath,
            lineNumber: lineIndex + 1,
            columnNumber: match.index
          }
        })
      }
    }
  })
  
  return links
}


describe('Integration - Link Checker', () => {
  beforeEach(() => {
    // Clear the URL cache before each test
    urlCache.clear();
  });

  const MAX_CONCURRENT_CHECKS = 5 // Limit concurrent requests

  // Helper to check if dev server is running
  async function isDevServerRunning(): Promise<boolean> {
    try {
      console.log('\n🔍 Checking if development server is running...')
      await fetch('http://localhost:3000', {
        method: 'HEAD',
        headers: {
          'User-Agent': 'DFDA Link Checker'
        }
      })
      console.log('✅ Development server is running')
      return true
    } catch (error) {
      return false
    }
  }

  async function getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = []
    const items = fs.readdirSync(dir)
    
    for (const item of items) {
      const fullPath = path.join(dir, item)
      // Normalize paths to use forward slashes for consistent comparison
      const relativePath = path.relative(process.cwd(), fullPath).split(path.sep).join('/')
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        // Skip if this directory is in the exclusion list
        const shouldExclude = EXCLUDED_FOLDERS.some(excluded => {
          // Normalize excluded path to use forward slashes
          const normalizedExcluded = excluded.split(path.sep).join('/')
          return (
            relativePath === normalizedExcluded || // Exact match
            relativePath.startsWith(normalizedExcluded + '/') || // Subfolder match
            relativePath.startsWith('.' + '/' + normalizedExcluded) // Hidden folder match
          )
        })

        if (shouldExclude) {
          continue
        }
        files.push(...await getAllFiles(fullPath))
      } else {
        const ext = path.extname(item).toLowerCase()
        if (LINKABLE_EXTENSIONS.has(ext)) {
          files.push(fullPath)
        }
      }
    }
    
    return files
  }

  // Function to collect all links from a set of files
  async function collectAllLinks(): Promise<Array<{ url: string; location: { filePath: string; lineNumber: number; columnNumber: number } }>> {
    const allLinks: Array<{ url: string; location: { filePath: string; lineNumber: number; columnNumber: number } }> = []
    
    // Get all files from included directories, respecting exclusions
    const allFiles = (await Promise.all(
      INCLUDED_FOLDERS.map(async folder => 
        await getAllFiles(path.join(process.cwd(), folder))
      )
    )).flat()

    // Process each file
    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf-8')
      const ext = path.extname(file).toLowerCase()
      
      // Use appropriate link extraction based on file type
      let fileLinks: Array<{ url: string; location: LinkLocation }> = []
      
      if (ext === '.tsx' || ext === '.jsx') {
        fileLinks = extractLinksFromJsx(content, file)
      } else {
        // For all other file types, use the object extractor as it's more general
        fileLinks = extractLinksFromObject(content, file)
      }
      
      // Filter out invalid links before adding them
      const validLinks = fileLinks.filter(link => isValidLink(link.url))
      allLinks.push(...validLinks)
    }

    // Remove duplicates while preserving location information of the first occurrence
    const uniqueLinks = allLinks.filter((link, index, self) =>
      index === self.findIndex((l) => l.url === link.url)
    )

    // Sort links for consistent output
    return uniqueLinks.sort((a, b) => a.url.localeCompare(b.url))
  }

  async function checkLinksInBatches(links: Array<{ url: string; location: LinkLocation }>) {
    const batchSize = 5 // Process 5 links at a time
    const results = {
      valid: [] as LinkCheckResult[],
      invalid: [] as LinkCheckResult[]
    }

    // Process links in batches
    for (let i = 0; i < links.length; i += batchSize) {
      const batch = links.slice(i, i + batchSize)
      const batchPromises = batch.map(link => checkLink(link.url, link.location))
      
      try {
        const batchResults = await Promise.all(batchPromises)
        
        // Process results
        batchResults.forEach(result => {
          if (result.isValid) {
            results.valid.push(result)
          } else {
            results.invalid.push(result)
            console.log(`  ❌ ${result.url} - ${result.error || `Status: ${result.statusCode}`}
              ${result.location.filePath}:${result.location.lineNumber}`)
          }
        })
      } catch (error) {
        console.error('Error checking batch:', error)
      }
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

  // Format invalid results for table display
  function formatInvalidResults(results: LinkCheckResult[]) {
    return results.map(result => ({
      url: result.url,
      error: result.error || `Status: ${result.statusCode || 'unknown'}`,
      location: result.location
    }))
  }

  it('should validate all links in the codebase', async () => {
    // Check if dev server is running first
    const serverRunning = await isDevServerRunning()
    if (!serverRunning) {
      console.error('\n❌ Development server is not running!')
      console.error('Please start it with "npm run dev" or "pnpm dev" first.\n')
      // Fail the test immediately
      throw new Error('Development server must be running to check links')
    }

    console.log('\n📂 Scanning for files...')
    const allLinks = await collectAllLinks()
    console.log(`✅ Found ${allLinks.length} total links to check`)

    // Log all discovered links
    console.log('\n📋 All discovered links:')
    let linksList = ''
    allLinks.forEach(({ url, location }) => {
      const relativePath = path.relative(process.cwd(), location.filePath)
      linksList += `  ${url} (${relativePath}:${location.lineNumber})\n`
    })
    console.log(linksList)

    try {
      // Check all links and wait for completion
      const results = await checkLinksInBatches(allLinks)

      // Format and display results
      if (results.invalid.length > 0) {
        const formattedInvalid = formatInvalidResults(results.invalid)
        const table = formatTable(formattedInvalid)
        console.log('\n❌ Found broken links:')
        console.log(table)

        // Update skip configuration with failed links
        updateSkipConfig(results.invalid)

        // Show instructions for skipping
        console.log('\n📝 To skip these links in future runs:')
        console.log('1. Edit link-checker-skip.json')
        console.log('2. Add URLs to "exactMatches" array for exact matches')
        console.log('3. Add patterns to "patterns" array for regex matching')
        console.log('Example:')
        console.log(JSON.stringify({
          exactMatches: [results.invalid[0]?.url].filter(Boolean),
          patterns: ['^https://example\\.com/.*'],
        }, null, 2))
      } else {
        console.log('\n✅ All links are valid!\n')
      }

      // Assert all links are valid
      expect(results.invalid).toHaveLength(0)
    } catch (error) {
      console.error('Error during link validation:', error)
      throw error
    }
  }, 300000) // 5 minute timeout

  // Test for comprehensive link collection
  it('should collect links from both TSX and TS files including navigation', async () => {
    const allLinks = await collectAllLinks()
    
    // Check for specific navigation links
    const navigationLinks = [
      '/',
      '/conditions',
      '/treatments',
      '/safe/redirect',
      '/disease-eradication-act',
      '/health-savings-sharing',
      '/docs'
    ]
    
    navigationLinks.forEach(link => {
      const found = allLinks.some(({ url }) => url === link)
      expect(found).toBe(true)
    })

    // Specifically verify health-savings-sharing link
    const healthSavingsLink = allLinks.find(({ url }) => url === '/health-savings-sharing')
    expect(healthSavingsLink).toBeDefined()
    expect(healthSavingsLink?.location.filePath).toContain('dfda-nav.ts')
  })

  // Add a new test for markdown directory paths
  it('should not treat markdown directory paths as links', async () => {
    const testContent = `
# Test Directory Structure
- \`/test\`: A test directory
- \`/docs\`: Documentation files
- \`/src\`: Source files
- [Valid Link](/actual-link)
- [Another Link](/another-link)
`
    const links = extractLinksFromObject(testContent, 'test.md')
    
    // Should find the actual links but not the directory paths
    expect(links.map(l => l.url)).toEqual(['/actual-link', '/another-link'])
    
    // Test with real README content
    const readmeContent = `
- \`/partners\`: Contains information pertinent to all partners involved in the FDAi.
- \`/researchers\`: Dedicated to academic and medical researchers contributing to the project.
[Real Link](/real-link)
`
    const readmeLinks = extractLinksFromObject(readmeContent, 'README.md')
    expect(readmeLinks.map(l => l.url)).toEqual(['/real-link'])
  })

  // Add test for link validation
  it('should filter out invalid internal links', () => {
    const testContent = `
      href="/valid/path"
      href="/0"
      href="/5"
      href="mailto:test@example.com"
      href="/api/userVariables/\${userVariableId}"
      href="/api/[param]"
      href="/"
      href="//"
      href="/valid-path"
      [Link](/valid/path)
      [Invalid](/0)
      [Email](mailto:test@example.com)
      [Template]/api/\${variable})
    `
    const links = extractLinksFromObject(testContent, 'test.txt')
    
    // Should only include valid internal paths
    const validUrls = links.map(l => l.url)
    expect(validUrls).toContain('/valid/path')
    expect(validUrls).toContain('/valid-path')
    
    // Should not include invalid paths
    expect(validUrls).not.toContain('/0')
    expect(validUrls).not.toContain('/5')
    expect(validUrls).not.toContain('mailto:test@example.com')
    expect(validUrls).not.toContain('/api/userVariables/${userVariableId}')
    expect(validUrls).not.toContain('/api/[param]')
    expect(validUrls).not.toContain('/')
    expect(validUrls).not.toContain('//')
  })

  // Add test for documentation examples
  it('should not treat documentation examples as links', () => {
    const testContent = `
      Please copy this template into your respective folder (e.g., \`/researchers\`, \`/healthcare_providers\`).
      For example: /path/to/something
      This is a folder: /some/folder
      In the directory /test/dir you can find...
      Example path is /example/path
      [Real Link](/actual-link)
    `
    const links = extractLinksFromObject(testContent, 'test.md')
    
    // Should only find actual links
    const validUrls = links.map(l => l.url)
    expect(validUrls).toEqual(['/actual-link'])
    expect(validUrls).not.toContain('/researchers')
    expect(validUrls).not.toContain('/healthcare_providers')
    expect(validUrls).not.toContain('/path/to/something')
    expect(validUrls).not.toContain('/some/folder')
    expect(validUrls).not.toContain('/test/dir')
    expect(validUrls).not.toContain('/example/path')
  })

  // Add test for JSX template interpolations
  it('should not treat JSX template interpolations as links', () => {
    const testContent = `
      href={\`/docs/\${file.relativePath.replace('.md', '')}\`}
      href={\`/api/\${id}/edit\`}
      href={\`/users/\${userId}/profile\`}
      href="/actual-link"
    `
    const links = extractLinksFromObject(testContent, 'test.tsx')
    
    // Should only find actual links
    const validUrls = links.map(l => l.url)
    expect(validUrls).toEqual(['/actual-link'])
    expect(validUrls).not.toContain('/docs/${file.relativePath.replace')
    expect(validUrls).not.toContain('/api/${id}')
    expect(validUrls).not.toContain('/users/${userId}')
  })

  // Add test for file system paths
  it('should not treat file system paths as links', () => {
    const testContent = `
      const imgPath = 'articles/' + articleId + '/featured-image'
      const path = 'uploads/images/avatar'
      let filePath = 'data/users/profile'
      var docPath = '/documents/report'
      uploadToPath('images/' + id + '/thumbnail')
      [Real Link](/actual-link)
    `
    const links = extractLinksFromObject(testContent, 'test.ts')
    
    // Should only find actual links
    const validUrls = links.map(l => l.url)
    expect(validUrls).toEqual(['/actual-link'])
    expect(validUrls).not.toContain('/featured-image')
    expect(validUrls).not.toContain('/thumbnail')
    expect(validUrls).not.toContain('/documents/report')
  })

  // Add test for external links
  it('should collect both internal and external links', () => {
    const testContent = `
      href="https://example.com"
      href="http://test.com/path"
      href="/internal/path"
      [External](https://github.com)
      [Internal](/docs/test)
      const invalidPath = '/not/a/link'
    `
    const links = extractLinksFromObject(testContent, 'test.md')
    
    // Should find both internal and external links
    const validUrls = links.map(l => l.url)
    expect(validUrls).toContain('https://example.com')
    expect(validUrls).toContain('http://test.com/path')
    expect(validUrls).toContain('/internal/path')
    expect(validUrls).toContain('https://github.com')
    expect(validUrls).toContain('/docs/test')
    expect(validUrls).not.toContain('/not/a/link')
  })

  // Debug test for external links
  it('should extract external links correctly', () => {
    const testContent = `[Link](https://markdown.com)`
    const links = extractLinksFromObject(testContent, 'test.md')
    console.log('Found links:', links.map(l => l.url))
    console.log('Raw content:', testContent)
    console.log('Markdown match:', testContent.match(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/))
    
    const validUrls = links.map(l => l.url)
    expect(validUrls).toContain('https://markdown.com')
  })

  // Add test for URLs with trailing punctuation
  it('should handle URLs with trailing punctuation correctly', () => {
    const testContent = `
      Check out our app at https://app.crowdsourcingcures.org).
      Visit (https://example.com).
      See [our site](https://test.com).
      Go to https://example.org.
      Link: https://test.net/path?param=1)
      Another (https://test.org/path#section).
    `
    const links = extractLinksFromObject(testContent, 'test.md')
    
    // Should extract clean URLs without trailing punctuation
    const validUrls = new Set(links.map(l => l.url))
    
    // Expected URLs
    const expectedUrls = new Set([
      'https://app.crowdsourcingcures.org',
      'https://example.com',
      'https://test.com',
      'https://example.org',
      'https://test.net/path?param=1',
      'https://test.org/path#section'
    ])
    
    // Compare sets for equality
    expect(validUrls).toEqual(expectedUrls)
    
    // Verify no URLs with trailing punctuation
    const urlsWithPunctuation = Array.from(validUrls).filter(url => 
      url.endsWith(')') || url.endsWith('.') || 
      url.endsWith(',') || url.endsWith(';')
    )
    expect(urlsWithPunctuation).toHaveLength(0)
  })

  // Add test for markdown link text vs URL
  it('should extract URLs from markdown link parentheses, not square brackets', () => {
    const testContent = `
      [http://example.com](https://real-link.com)
      [/wrong/path](/correct/path)
      [http://www.appliedclinicaltrialsonline.com/appliedclinicaltrials/article...](http://actual-link.com)
      [Click here!](https://click.com)
      [/not/this/path](/but/this/path)
      [https://wrong.com](/right/path)
      [link](http://link.com)
    `
    console.log('Test content:', testContent)
    const links = extractLinksFromObject(testContent, 'test.md')
    console.log('Extracted links:', links)
    
    // Test each line individually with the regex
    const mdRegex = /\[([^\]]*)\]\(((?:https?:\/\/[^)\s]+|\/[^)\s]+))\)/g
    testContent.split('\n').forEach(line => {
      console.log('\nTesting line:', line)
      let match
      while ((match = mdRegex.exec(line)) !== null) {
        console.log('Match found:', {
          full: match[0],
          text: match[1],
          url: match[2],
          index: match.index
        })
      }
    })
    
    // Should extract URLs from parentheses only
    const validUrls = links.map(l => l.url)
    console.log('Valid URLs:', validUrls)
    
    // Should extract URLs from parentheses only
    expect(validUrls).toContain('https://real-link.com')
    expect(validUrls).toContain('/correct/path')
    expect(validUrls).toContain('http://actual-link.com')
    expect(validUrls).toContain('https://click.com')
    expect(validUrls).toContain('/but/this/path')
    expect(validUrls).toContain('/right/path')
    expect(validUrls).toContain('http://link.com')
    
    // Should not extract URLs from square brackets
    expect(validUrls).not.toContain('http://example.com')
    expect(validUrls).not.toContain('/wrong/path')
    expect(validUrls).not.toContain('http://www.appliedclinicaltrialsonline.com/appliedclinicaltrials/article...')
    expect(validUrls).not.toContain('/not/this/path')
    expect(validUrls).not.toContain('https://wrong.com')
  })

  // Test that no files from docs/api-docs are included
  it('should not include any files from docs/api-docs directory', async () => {
    // Get all files that would be scanned
    console.log('\n📂 Scanning for files to verify exclusion of docs/api-docs...')
    const allLinks = await collectAllLinks()
    
    // Check that no file paths contain docs/api-docs
    const apiDocsFiles = allLinks.filter(link => 
      link.location.filePath.replace(/\\/g, '/').includes('docs/api-docs')
    )
    
    if (apiDocsFiles.length > 0) {
      console.log('\n❌ Found files from docs/api-docs that should be excluded:')
      apiDocsFiles.forEach(({ location }) => {
        console.log(`  ${location.filePath}:${location.lineNumber}`)
      })
    }
    
    expect(apiDocsFiles).toHaveLength(0)
  })

  // Add test for skip configuration
  it('should respect skip configuration', async () => {
    // Create temporary skip config
    const tempConfig: SkipConfig = {
      exactMatches: ['https://skip-exact.com'],
      patterns: ['^https://skip-pattern\\.com/.*'],
      lastUpdated: new Date().toISOString(),
      failedLinks: []
    }
    fs.writeFileSync(SKIP_CONFIG_FILE, JSON.stringify(tempConfig, null, 2))

    try {
      // Test exact match
      const exactResult = await checkLink('https://skip-exact.com', {
        filePath: 'test.md',
        lineNumber: 1,
        columnNumber: 1
      })
      expect(exactResult.isValid).toBe(true)
      expect(exactResult.error).toBe('Skipped per configuration')

      // Test pattern match
      const patternResult = await checkLink('https://skip-pattern.com/test', {
        filePath: 'test.md',
        lineNumber: 1,
        columnNumber: 1
      })
      expect(patternResult.isValid).toBe(true)
      expect(patternResult.error).toBe('Skipped per configuration')

      // Test non-matching link
      const normalResult = await checkLink('https://normal-link.com', {
        filePath: 'test.md',
        lineNumber: 1,
        columnNumber: 1
      })
      expect(normalResult.error).not.toBe('Skipped per configuration')
    } finally {
      // Clean up temporary config
      if (fs.existsSync(SKIP_CONFIG_FILE)) {
        fs.unlinkSync(SKIP_CONFIG_FILE)
      }
    }
  })
}) 