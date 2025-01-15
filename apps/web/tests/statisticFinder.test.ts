/**
 * @jest-environment node
 */
import { findStatistics, StatisticFinderOptions, StatisticalFindings, formatNumber, extractNumbers } from '@/lib/agents/researcher/statisticFinder'
import { expect } from '@jest/globals'

// Shared test configuration to reduce API calls
const defaultOptions: StatisticFinderOptions = {
  numberOfSearchQueryVariations: 1, // Reduced from 2
  numberOfWebResultsToInclude: 10, // Reduced from 15
  minConfidence: 0.7,
  requireMethodology: true,
  maxYearsOld: 10 // Added to be more lenient with data age
}

describe("Statistic Finder Tests", () => {
  jest.setTimeout(6000000) // 100 minutes timeout

  // Cache for expensive operations
  let drugDevelopmentFindings: StatisticalFindings | null = null

  it("Finds statistics about drug development costs", async () => {
    drugDevelopmentFindings = await findStatistics(
      "What is the average cost to develop a new pharmaceutical drug from research through FDA approval?", 
      defaultOptions
    )

    // Basic validation
    expect(drugDevelopmentFindings.findings.length).toBeGreaterThan(0)
    expect(drugDevelopmentFindings.summary.length).toBeGreaterThan(0)
    expect(drugDevelopmentFindings.relatedQueries.length).toBeGreaterThan(0)
    expect(drugDevelopmentFindings.limitations.length).toBeGreaterThan(0)

    // Validate each finding
    drugDevelopmentFindings.findings.forEach(finding => {
      expect(finding.number).toBeGreaterThan(0)
      expect(finding.unit.toLowerCase()).toContain('usd')
      expect(finding.confidence).toBeGreaterThanOrEqual(0.7)
      expect(finding.confidence).toBeLessThanOrEqual(1)
      expect(finding.context.length).toBeGreaterThan(100) // Ensure detailed context
      expect(finding.methodology.length).toBeGreaterThan(0)
      expect(finding.source.quote.length).toBeGreaterThan(0)
      expect(finding.source.url).toMatch(/^https?:\/\//)
    })

    console.log("Drug Development Cost Statistics:", 
      drugDevelopmentFindings.findings.map(f => ({
        cost: f.number !== undefined ? formatNumber(f.number, f.unit) : 'N/A',
        year: f.year,
        confidence: f.confidence,
        methodology: f.methodology?.slice(0, 100) + '...' // Truncate for cleaner logs
      }))
    )
  })

  it("Finds statistics about clinical trial participant costs", async () => {
    const findings = await findStatistics(
      "What is the average cost per participant in phase 3 clinical trials for pharmaceutical drugs?", 
      defaultOptions
    )

    expect(findings.findings.length).toBeGreaterThan(0)
    findings.findings.forEach(finding => {
      expect(finding.number).toBeGreaterThan(0)
      expect(finding.unit.toLowerCase()).toContain('usd')
      expect(finding.confidence).toBeGreaterThanOrEqual(0.7)
      expect(finding.methodology.length).toBeGreaterThan(0)
      if (finding.source.organization) {
        expect(finding.source.organization.length).toBeGreaterThan(0)
      }
    })

    console.log("Clinical Trial Participant Cost Statistics:", 
      findings.findings.map(f => ({
        cost: f.number !== undefined ? formatNumber(f.number, f.unit) : 'N/A',
        year: f.year,
        confidence: f.confidence,
        methodology: f.methodology?.slice(0, 100) + '...',
        organization: f.source.organization
      }))
    )
  })

  // Combine success rate test with previous findings
  it("Finds statistics about clinical trial success rates", async () => {
    const findings = await findStatistics(
      "What percentage of clinical trials successfully complete and get FDA approval?", 
      defaultOptions
    )

    expect(findings.findings.length).toBeGreaterThan(0)
    findings.findings.forEach(finding => {
      expect(finding.number).toBeLessThanOrEqual(100)
      expect(finding.unit.toLowerCase()).toContain('percent')
      expect(finding.confidence).toBeGreaterThanOrEqual(0.7)
      expect(finding.methodology.length).toBeGreaterThan(0)
    })

    // Verify we have statistics broken down by phase
    const hasPhaseBreakdown = findings.findings.some(f => 
      f.context.toLowerCase().includes('phase') && 
      f.methodology.toLowerCase().includes('phase')
    )
    expect(hasPhaseBreakdown).toBeTruthy()

    console.log("Clinical Trial Success Rate Statistics:", 
      findings.findings.map(f => ({
        rate: f.number !== undefined ? formatNumber(f.number, f.unit) : 'N/A',
        year: f.year,
        confidence: f.confidence,
        methodology: f.methodology?.slice(0, 100) + '...'
      }))
    )
  })

  // Fast synchronous tests
  describe("Utility Functions", () => {
    it("Formats numbers correctly", () => {
      expect(formatNumber(1234567, 'USD')).toBe('$1,234,567.00')
      expect(formatNumber(0.156, 'percent')).toBe('15.60%')
      expect(formatNumber(1000000)).toBe('1,000,000.00')
    })

    it("Extracts numbers from text with various formats", () => {
      const text = `The costs range from $1,234.56 to $5M, with some estimates at $10B. 
                   About 15.7% showed improvement. The study needed £2.5k participants.`
      const numbers = extractNumbers(text)
      expect(numbers).toContain(1234.56)
      expect(numbers).toContain(5000000) // $5M
      expect(numbers).toContain(10000000000) // $10B
      expect(numbers).toContain(15.7)
      expect(numbers).toContain(2500) // £2.5k
    })
  })
}) 