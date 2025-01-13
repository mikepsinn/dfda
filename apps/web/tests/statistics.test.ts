/**
 * @jest-environment node
 */
import { PrismaClient } from "@prisma/client"
import path from 'path'
import fs from 'fs/promises'
import { findStatistics } from '@/lib/agents/researcher/statisticFinder'
import matter from 'gray-matter'

const prisma = new PrismaClient()

describe("Statistics Content Generation Tests", () => {
  jest.setTimeout(6000000) // 100 minutes timeout for long-running tests

  const statsDir = path.join(process.cwd(), 'public/docs/problems/statistics')
  const userId = "test-user"

  const updateStatisticFile = async (filePath: string, findings: any) => {
    // Read the current file
    const fileContent = await fs.readFile(filePath, 'utf8')
    const { data: frontMatter, content } = matter(fileContent)
    
    // Find the most relevant statistic from findings
    const bestMatch = findings.findings.reduce((best: any, current: any) => {
      if (!best || current.confidence > best.confidence) {
        return current
      }
      return best
    }, null)

    if (!bestMatch || bestMatch.confidence < 0.7) {
      console.log(`No reliable statistic found for ${path.basename(filePath)}`)
      return
    }

    // Update frontmatter
    const updatedFrontMatter = {
      ...frontMatter,
      number: bestMatch.number,
      source: {
        url: bestMatch.source.url,
        title: bestMatch.source.title,
        quote: bestMatch.source.quote,
        publishDate: bestMatch.source.publishDate,
        organization: bestMatch.source.organization
      }
    }

    // Create updated content with source information
    const updatedContent = `${bestMatch.context}\n\nMethodology: ${bestMatch.methodology}`

    // Write back to file
    const updatedFileContent = matter.stringify(updatedContent, updatedFrontMatter)
    await fs.writeFile(filePath, updatedFileContent)
  }

  test("should verify and update statistics files with accurate data", async () => {
    const files = await fs.readdir(statsDir)
    const mdFiles = files.filter(f => f.endsWith('.md'))

    for (const file of mdFiles) {
      const filePath = path.join(statsDir, file)
      const fileContent = await fs.readFile(filePath, 'utf8')
      const { data: frontMatter } = matter(fileContent)
      
      // Generate search query based on file content
      const searchQuery = `${frontMatter.description || frontMatter.title} statistics data research`
      
      console.log(`\nVerifying statistics for: ${file}`)
      console.log(`Search query: ${searchQuery}`)

      try {
        const findings = await findStatistics(searchQuery, {
          minConfidence: 0.7,
          requireMethodology: true,
          maxYearsOld: 5
        })

        if (findings.findings.length > 0) {
          await updateStatisticFile(filePath, findings)
          console.log(`✅ Updated ${file} with verified statistics`)
        } else {
          console.log(`❌ No reliable statistics found for ${file}`)
        }
      } catch (error) {
        console.error(`Error processing ${file}:`, error)
      }
    }
  })
})
