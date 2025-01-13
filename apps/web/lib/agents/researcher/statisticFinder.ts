import { LanguageModelV1 } from "@ai-sdk/provider";
import { generateObject } from "ai";
import { z } from "zod";
import { getSearchResults } from "@/lib/agents/researcher/getSearchResults";
import { generateSearchQueries } from "@/lib/agents/researcher/searchQueryGenerator";
import { DEFAULT_MODEL_NAME, getModelByName, ModelName } from "@/lib/utils/modelUtils";

// Schema for a single statistical finding
const StatisticalFindingSchema = z.object({
  number: z.number().describe("The numerical value found"),
  unit: z.string().describe("The unit of measurement (e.g., USD, years, percentage)"),
  context: z.string().describe("A detailed explanation of what this statistic represents and its significance"),
  methodology: z.string().describe("Information about how this statistic was calculated or measured, if available"),
  confidence: z.number().min(0).max(1).describe("Confidence score from 0-1 in the accuracy and reliability of this finding"),
  year: z.number().optional().describe("The year this statistic is from"),
  source: z.object({
    url: z.string(),
    title: z.string(),
    quote: z.string().describe("The exact quote containing this statistic"),
    publishDate: z.string().optional(),
    organization: z.string().optional().describe("The organization that produced this statistic")
  })
})

// Schema for the complete findings report
const StatisticalFindingsSchema = z.object({
  query: z.string().describe("The original search query"),
  findings: z.array(StatisticalFindingSchema).min(1).describe("Array of statistical findings with sources"),
  summary: z.string().describe("A comprehensive summary of the statistical findings, their ranges, and key insights"),
  relatedQueries: z.array(z.string()).describe("Related queries that might yield more statistics"),
  limitations: z.array(z.string()).describe("Any limitations or caveats about the statistics found")
})

export type StatisticalFinding = z.infer<typeof StatisticalFindingSchema>
export type StatisticalFindings = z.infer<typeof StatisticalFindingsSchema>

export type StatisticFinderOptions = {
  numberOfSearchQueryVariations?: number
  numberOfWebResultsToInclude?: number
  minConfidence?: number
  requireRecentData?: boolean
  maxYearsOld?: number
  modelName?: ModelName
  requireMethodology?: boolean
}

export async function findStatistics(
  topic: string,
  options: StatisticFinderOptions = {}
): Promise<StatisticalFindings> {
  const {
    numberOfSearchQueryVariations = 2,
    numberOfWebResultsToInclude = 15,
    minConfidence = 0.7,
    requireRecentData = true,
    maxYearsOld = 5,
    modelName = DEFAULT_MODEL_NAME,
    requireMethodology = false
  } = options

  console.log(`🔍 Starting Statistics Search:
• Topic: "${topic}"
• Min Confidence: ${minConfidence}
• Max Years Old: ${maxYearsOld}
• Require Methodology: ${requireMethodology}`)

  // Generate search queries focused on finding statistics
  const baseQueries = await generateSearchQueries(topic, numberOfSearchQueryVariations)
  const statisticsQueries = baseQueries.map(q => 
    q.toLowerCase().includes('cost') ? 
      `${q} average median statistics research data methodology` :
      `${q} statistics research data methodology findings`
  )

  // Add topic-specific queries
  if (topic.toLowerCase().includes('clinical trial')) {
    statisticsQueries.push(
      'clinical trial statistics methodology findings research',
      'clinical research statistical analysis methodology data'
    )
  }

  // Get search results with expanded scope
  const searchResults = await getSearchResults(statisticsQueries, {
    numResults: numberOfWebResultsToInclude,
    useAutoprompt: true
  })

  // Pre-filter search results to only include those with numbers
  const resultsWithNumbers = searchResults.filter(result => {
    // Check both the main text and highlights for numbers
    const textNumbers = extractNumbers(result.text)
    const highlightNumbers = (result as any).highlights?.map(
      (quote: string) => extractNumbers(quote)
    ).flat() || []
    
    // Get unique numbers using Array.from for better compatibility
    const uniqueNumbers = Array.from(new Set([...textNumbers, ...highlightNumbers]))
    
    // Log numbers found in this result
    if (uniqueNumbers.length > 0) {
      console.log(`📊 Statistics in "${result.title?.slice(0, 100) || 'Untitled'}...":
• Unique Numbers: ${uniqueNumbers.map((n: number) => formatNumber(n)).join(', ')}`)
    }
    
    // Keep results that have at least one number and aren't just years
    const hasRelevantNumbers = uniqueNumbers.length > 0 && uniqueNumbers.some(n => n < 1900 || n > 2100)
    if (!hasRelevantNumbers && uniqueNumbers.length > 0) {
      console.log(`⚠️ Skipping result - only contains years: ${uniqueNumbers.map((n: number) => formatNumber(n)).join(', ')}`)
    }
    return hasRelevantNumbers
  })

  console.log(`📊 Search Results Analysis:
• Total Results: ${searchResults.length}
• Results with Statistics: ${resultsWithNumbers.length}
• Filtering Rate: ${((1 - resultsWithNumbers.length / searchResults.length) * 100).toFixed(1)}%
• Search Queries: ${statisticsQueries.map(q => `"${q}"`).join('\n  ')}`)

  // If no results with numbers, return early
  if (resultsWithNumbers.length === 0) {
    console.log('❌ No statistical data found in search results')
    throw new Error('No statistical data found in search results')
  }

  // Log summary of numbers found
  const allNumbers = resultsWithNumbers.flatMap(result => {
    const textNumbers = extractNumbers(result.text)
    const highlightNumbers = (result as any).highlights?.map(
      (quote: string) => extractNumbers(quote)
    ).flat() || []
    return Array.from(new Set([...textNumbers, ...highlightNumbers]))
  })

  if (allNumbers.length === 0) {
    console.log('❌ No valid numbers found in filtered results')
    throw new Error('No valid numbers found in filtered results')
  }

  console.log(`📈 Statistics Summary:
• Total Unique Values: ${allNumbers.length}
• Range: ${Math.min(...allNumbers)} - ${Math.max(...allNumbers)}
• Distribution:
  - Small (<1000): ${allNumbers.filter(n => n < 1000).length}
  - Medium (1000-1M): ${allNumbers.filter(n => n >= 1000 && n < 1000000).length}
  - Large (>1M): ${allNumbers.filter(n => n >= 1000000).length}`)

  // Prepare the search content for analysis
  const searchContent = resultsWithNumbers
    .map(
      (item) => `
--START SOURCE--
URL: ${item.url}
TITLE: ${item.title}
DATE: ${item.publishedDate || 'Unknown'}
CONTENT: ${item.text}
RELEVANT QUOTES:
${(item as any).highlights?.map((quote: string, i: number) => 
    `${i + 1}. "${quote}" (Score: ${(item as any).highlightScores?.[i] || 'N/A'})`
).join('\n') || 'No relevant quotes found'}
--END SOURCE--
`
    )
    .join("\n\n")

  const prompt = `
Find ALL statistical findings related to "${topic}" from the provided sources.

Requirements:
1. Each finding must include a specific statistic with its proper context and methodology
2. Only include findings with confidence score >= ${minConfidence}
3. ${requireRecentData ? `Prioritize data from the last ${maxYearsOld} years, but include older data if relevant` : 'Include data regardless of age'}
4. Extract the exact quote containing each statistic
5. Convert all numbers to a standardized format (e.g., percentages as decimals, currencies in USD)
6. Include the source URL, context, and methodology for each finding
7. If you find conflicting statistics, include all of them with appropriate context
8. ${requireMethodology ? 'Only include statistics where the methodology is explained' : 'Include methodology information when available'}

Source Content:
${searchContent}
`

  const model: LanguageModelV1 = getModelByName(modelName)

  console.log("Analyzing sources for statistical findings...")

  const result = await generateObject({
    model,
    schema: StatisticalFindingsSchema,
    prompt,
  })

  const findings = result.object as StatisticalFindings

  // Filter findings based on confidence, methodology requirements, and number validation
  findings.findings = findings.findings.filter(finding => {
    // Check confidence threshold
    if (finding.confidence < minConfidence) return false
    
    // Check methodology requirement
    if (requireMethodology && !finding.methodology) return false
    
    // Validate number exists in allNumbers (within 20% tolerance)
    const tolerance = 0.2
    const numberExists = allNumbers.some(n => {
      const min = n * (1 - tolerance)
      const max = n * (1 + tolerance)
      return finding.number >= min && finding.number <= max
    })
    
    if (!numberExists) {
      console.log(`⚠️ Filtering out finding with number ${finding.number} - not found in source text`)
      return false
    }
    
    return true
  })

  // Sort findings by confidence and year
  findings.findings.sort((a, b) => {
    // First by confidence
    const confidenceDiff = b.confidence - a.confidence
    if (confidenceDiff !== 0) return confidenceDiff
    // Then by year (more recent first)
    return (b.year || 0) - (a.year || 0)
  })

  console.log(`✅ Analysis Complete:
• Findings: ${findings.findings.length}
• Confidence Range: ${Math.min(...findings.findings.map(f => f.confidence))} - ${Math.max(...findings.findings.map(f => f.confidence))}
• Years: ${findings.findings.filter(f => f.year).map(f => f.year).join(', ')}
• With Methodology: ${findings.findings.filter(f => f.methodology).length}`)

  return findings
}

// Utility functions
export function formatNumber(num: number, unit: string = ''): string {
  if (unit?.toLowerCase() === 'usd' || unit?.toLowerCase() === 'dollars') {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(num)
  }
  
  if (unit?.toLowerCase() === 'percent' || unit?.toLowerCase() === '%') {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      maximumFractionDigits: 1
    }).format(num / 100)
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num)
}

export function extractNumbers(text: string): number[] {
  // First pass: Find all potential number strings
  const numberRegex = /(?:[\$£€])?(?:\d{1,3}(?:,\d{3})*|\d+)(?:\.\d+)?(?:\s*(?:K|k|M|m|B|b|T|t|thousand|million|billion|trillion))?/gi
  const matches = text.match(numberRegex) || []
  
  return matches.map(match => {
    try {
      // Remove currency symbols and commas
      let cleanMatch = match.replace(/[\$£€,]/g, '').toLowerCase().trim()
      
      // Split into number and suffix if present
      // Use positive lookbehind to keep the decimal part with the number
      const parts = cleanMatch.split(/(?<=[0-9])(?=[kmbt]|thousand|million|billion|trillion)/i)
      const numberPart = parts[0].trim()
      const suffixPart = (parts[1] || '').trim()
      
      // Parse the base number
      const baseNumber = parseFloat(numberPart)
      if (isNaN(baseNumber)) return NaN
      
      // Handle suffixes
      const multipliers: { [key: string]: number } = {
        'k': 1000,
        'thousand': 1000,
        'm': 1000000,
        'million': 1000000,
        'b': 1000000000,
        'billion': 1000000000,
        't': 1000000000000,
        'trillion': 1000000000000
      }
      
      const multiplier = multipliers[suffixPart] || 1
      return baseNumber * multiplier
    } catch (e) {
      return NaN
    }
  }).filter(num => !isNaN(num))
} 