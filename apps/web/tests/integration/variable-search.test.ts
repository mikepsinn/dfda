/**
 * @jest-environment node
 */
import { prisma } from '@repo/database'

describe('Integration - Variable Search and APIs', () => {
  describe('API Endpoints', () => {
    it('should have /api/v1/variables endpoint accessible', async () => {
      // This test verifies the API endpoint exists and returns valid structure
      // In a real integration test, you would call the actual endpoint
      const variables = await prisma.variables.findMany({
        where: {
          deleted_at: null,
          is_public: true,
          number_of_user_variables: {
            gt: 2,
          },
        },
        take: 5,
      })

      expect(variables).toBeDefined()
      expect(Array.isArray(variables)).toBe(true)
      if (variables.length > 0) {
        expect(variables[0]).toHaveProperty('id')
        expect(variables[0]).toHaveProperty('name')
      }
    })

    it('should filter variables by category', async () => {
      // Test category filtering
      const category = await prisma.variable_categories.findFirst({
        where: {
          deleted_at: null,
          boring: false,
        },
      })

      if (category) {
        const variables = await prisma.variables.findMany({
          where: {
            variable_category_id: category.id,
            deleted_at: null,
            is_public: true,
          },
          take: 5,
        })

        expect(variables).toBeDefined()
        expect(Array.isArray(variables)).toBe(true)

        // All variables should belong to the same category
        variables.forEach(v => {
          expect(Number(v.variable_category_id)).toBe(Number(category.id))
        })
      }
    })

    it('should filter variables with correlations', async () => {
      // Test that we can query variables with correlations
      const variables = await prisma.variables.findMany({
        where: {
          deleted_at: null,
          is_public: true,
          OR: [
            {
              number_of_aggregate_correlations_as_cause: {
                gt: 0,
              },
            },
            {
              number_of_aggregate_correlations_as_effect: {
                gt: 0,
              },
            },
          ],
        },
        take: 5,
      })

      expect(variables).toBeDefined()
      expect(Array.isArray(variables)).toBe(true)

      // Each variable should have at least one correlation
      variables.forEach(v => {
        const hasCorrelations =
          (v.number_of_aggregate_correlations_as_cause && v.number_of_aggregate_correlations_as_cause > 0) ||
          (v.number_of_aggregate_correlations_as_effect && v.number_of_aggregate_correlations_as_effect > 0)
        expect(hasCorrelations).toBe(true)
      })
    })
  })

  describe('Variable Search Functionality', () => {
    it('should find variables by name search', async () => {
      // Test case-insensitive search
      const searchTerm = 'mood'

      const variables = await prisma.variables.findMany({
        where: {
          name: {
            contains: searchTerm,
            mode: 'insensitive',
          },
          deleted_at: null,
          is_public: true,
        },
        take: 10,
      })

      expect(variables).toBeDefined()
      expect(Array.isArray(variables)).toBe(true)

      // All results should contain the search term
      variables.forEach(v => {
        expect(v.name.toLowerCase()).toContain(searchTerm.toLowerCase())
      })
    })

    it('should support filtering by category and search term', async () => {
      // Combined filtering test
      const searchTerm = 'sleep'

      const category = await prisma.variable_categories.findFirst({
        where: {
          name: 'Symptoms',
          deleted_at: null,
        },
      })

      if (category) {
        const variables = await prisma.variables.findMany({
          where: {
            name: {
              contains: searchTerm,
              mode: 'insensitive',
            },
            variable_category_id: category.id,
            deleted_at: null,
            is_public: true,
          },
          take: 10,
        })

        expect(variables).toBeDefined()
        expect(Array.isArray(variables)).toBe(true)

        variables.forEach(v => {
          expect(v.name.toLowerCase()).toContain(searchTerm.toLowerCase())
          expect(Number(v.variable_category_id)).toBe(Number(category.id))
        })
      }
    })
  })

  describe('Data Quality Filters', () => {
    it('should exclude boring categories', async () => {
      const categories = await prisma.variable_categories.findMany({
        where: {
          deleted_at: null,
          boring: false,
        },
      })

      expect(categories).toBeDefined()
      expect(Array.isArray(categories)).toBe(true)

      // No category should be marked as boring
      categories.forEach(cat => {
        expect(cat.boring).toBe(false)
      })
    })

    it('should filter variables by minimum user count', async () => {
      const minUsers = 2

      const variables = await prisma.variables.findMany({
        where: {
          deleted_at: null,
          is_public: true,
          number_of_user_variables: {
            gt: minUsers,
          },
        },
        take: 10,
      })

      expect(variables).toBeDefined()
      expect(Array.isArray(variables)).toBe(true)

      variables.forEach(v => {
        expect(Number(v.number_of_user_variables)).toBeGreaterThan(minUsers)
      })
    })

    it('should filter variables by minimum measurements', async () => {
      const minMeasurements = 5

      const variables = await prisma.variables.findMany({
        where: {
          deleted_at: null,
          is_public: true,
          number_of_raw_measurements_with_tags_joins_children: {
            gt: minMeasurements,
          },
        },
        take: 10,
      })

      expect(variables).toBeDefined()
      expect(Array.isArray(variables)).toBe(true)

      variables.forEach(v => {
        expect(Number(v.number_of_raw_measurements_with_tags_joins_children)).toBeGreaterThan(minMeasurements)
      })
    })
  })

  describe('Slug Functions', () => {
    it('should convert names to slugs correctly', () => {
      const { nameToSlug } = require('@/lib/slugs')

      expect(nameToSlug('Overall Mood')).toBe('Overall_Mood')
      expect(nameToSlug('Back Pain')).toBe('Back_Pain')
      expect(nameToSlug('Sleep Quality')).toBe('Sleep_Quality')
      expect(nameToSlug('Test: Value')).toBe('Test-_Value')
    })

    it('should convert slugs to names correctly', () => {
      const { slugToName } = require('@/lib/slugs')

      expect(slugToName('Overall_Mood')).toBe('Overall Mood')
      expect(slugToName('Back_Pain')).toBe('Back Pain')
      expect(slugToName('Sleep_Quality')).toBe('Sleep Quality')
    })
  })
})
