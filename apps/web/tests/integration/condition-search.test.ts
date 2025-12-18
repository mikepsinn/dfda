/**
 * @jest-environment node
 */
import { prisma } from '@repo/database'
import { searchRatedConditions, getConditionByNameWithTreatmentRatings } from '@/lib/dfda/treatments'

describe('Integration - Condition Search (Homepage)', () => {
  describe('Condition Search Functionality', () => {
    it('should search for conditions by partial name', async () => {
      const searchTerm = 'arthritis'
      const results = await searchRatedConditions(searchTerm)

      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)

      // All results should contain the search term
      results.forEach(condition => {
        expect(condition.name.toLowerCase()).toContain(searchTerm.toLowerCase())
      })
    })

    it('should return top 5 results by default', async () => {
      const searchTerm = 'pain'
      const results = await searchRatedConditions(searchTerm)

      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBeLessThanOrEqual(5)
    })

    it('should be case-insensitive', async () => {
      const lowerCase = await searchRatedConditions('depression')
      const upperCase = await searchRatedConditions('DEPRESSION')
      const mixedCase = await searchRatedConditions('DePrEsSiOn')

      // All should return same number of results
      expect(lowerCase.length).toBe(upperCase.length)
      expect(lowerCase.length).toBe(mixedCase.length)
    })
  })

  describe('Condition Treatment Rankings', () => {
    it('should fetch condition with treatment ratings', async () => {
      const conditionName = 'Rheumatoid Arthritis'
      const result = await getConditionByNameWithTreatmentRatings(conditionName)

      expect(result).toBeDefined()

      if (result) {
        expect(result.name).toBe(conditionName)
        expect(result.conditionTreatments).toBeDefined()
        expect(Array.isArray(result.conditionTreatments)).toBe(true)
      }
    })

    it('should return treatments sorted by popularity and effectiveness', async () => {
      const conditionName = 'Depression'
      const result = await getConditionByNameWithTreatmentRatings(conditionName)

      if (result && result.conditionTreatments.length > 1) {
        const treatments = result.conditionTreatments

        // Verify treatments are sorted (descending order)
        for (let i = 0; i < treatments.length - 1; i++) {
          const current = treatments[i]
          const next = treatments[i + 1]

          // Check popularity descending
          if (current.popularity && next.popularity) {
            expect(Number(current.popularity)).toBeGreaterThanOrEqual(Number(next.popularity))
          }
        }
      }
    })

    it('should filter treatments by minimum popularity', async () => {
      const conditionName = 'Anxiety'
      const result = await getConditionByNameWithTreatmentRatings(conditionName)

      if (result) {
        // All treatments should have popularity > 10
        result.conditionTreatments.forEach(ct => {
          if (ct.popularity) {
            expect(Number(ct.popularity)).toBeGreaterThan(10)
          }
        })
      }
    })

    it('should include treatment names', async () => {
      const conditionName = 'Headache'
      const result = await getConditionByNameWithTreatmentRatings(conditionName)

      if (result && result.conditionTreatments.length > 0) {
        result.conditionTreatments.forEach(ct => {
          expect(ct.treatment).toBeDefined()
          expect(ct.treatment.name).toBeDefined()
          expect(typeof ct.treatment.name).toBe('string')
        })
      }
    })

    it('should handle non-existent conditions gracefully', async () => {
      const conditionName = 'NonExistentConditionXYZ123'
      const result = await getConditionByNameWithTreatmentRatings(conditionName)

      expect(result).toBeNull()
    })

    it('should handle case-insensitive condition lookup', async () => {
      const normalCase = await getConditionByNameWithTreatmentRatings('Diabetes')
      const lowerCase = await getConditionByNameWithTreatmentRatings('diabetes')
      const upperCase = await getConditionByNameWithTreatmentRatings('DIABETES')

      // All should return the same result (or all null)
      if (normalCase) {
        expect(normalCase.name).toBe('Diabetes')
      }

      // Case-insensitive search should work
      expect(normalCase?.id).toBe(lowerCase?.id)
      expect(normalCase?.id).toBe(upperCase?.id)
    })
  })

  describe('Database Schema', () => {
    it('should have dfdaCondition table accessible', async () => {
      const conditions = await prisma.dfdaCondition.findMany({
        take: 1,
      })

      expect(conditions).toBeDefined()
      expect(Array.isArray(conditions)).toBe(true)
    })

    it('should have dfdaTreatment table accessible', async () => {
      const treatments = await prisma.dfdaTreatment.findMany({
        take: 1,
      })

      expect(treatments).toBeDefined()
      expect(Array.isArray(treatments)).toBe(true)
    })

    it('should have dfdaConditionTreatment relation working', async () => {
      const conditionTreatments = await prisma.dfdaConditionTreatment.findMany({
        include: {
          treatment: true,
          condition: true,
        },
        take: 1,
      })

      expect(conditionTreatments).toBeDefined()
      expect(Array.isArray(conditionTreatments)).toBe(true)

      if (conditionTreatments.length > 0) {
        expect(conditionTreatments[0].treatment).toBeDefined()
        expect(conditionTreatments[0].condition).toBeDefined()
      }
    })
  })
})
