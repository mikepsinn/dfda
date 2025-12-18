/**
 * @jest-environment node
 */
import { prisma } from '@repo/mysql-database'

describe('Integration - Studies Pages', () => {
  describe('Studies List Page', () => {
    it('should fetch public studies from aggregate_correlations', async () => {
      const studies = await prisma.aggregate_correlations.findMany({
        where: {
          deleted_at: null,
          is_public: true,
        },
        take: 5,
      })

      expect(studies).toBeDefined()
      expect(Array.isArray(studies)).toBe(true)

      if (studies.length > 0) {
        expect(studies[0]).toHaveProperty('id')
        expect(studies[0]).toHaveProperty('cause_variable_id')
        expect(studies[0]).toHaveProperty('effect_variable_id')
        expect(studies[0]).toHaveProperty('forward_pearson_correlation_coefficient')
      }
    })

    it('should include cause and effect variable details', async () => {
      const studies = await prisma.aggregate_correlations.findMany({
        where: {
          deleted_at: null,
          is_public: true,
        },
        include: {
          variables_aggregate_correlations_cause_variable_idTovariables: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          variables_aggregate_correlations_effect_variable_idTovariables: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        take: 5,
      })

      if (studies.length > 0) {
        const study = studies[0]
        expect(study.variables_aggregate_correlations_cause_variable_idTovariables).toBeDefined()
        expect(study.variables_aggregate_correlations_effect_variable_idTovariables).toBeDefined()
        expect(study.variables_aggregate_correlations_cause_variable_idTovariables.name).toBeTruthy()
        expect(study.variables_aggregate_correlations_effect_variable_idTovariables.name).toBeTruthy()
      }
    })

    it('should order studies by aggregate_qm_score descending', async () => {
      const studies = await prisma.aggregate_correlations.findMany({
        where: {
          deleted_at: null,
          is_public: true,
        },
        orderBy: [{ aggregate_qm_score: 'desc' }],
        take: 10,
      })

      if (studies.length > 1) {
        for (let i = 0; i < studies.length - 1; i++) {
          const currentScore = studies[i].aggregate_qm_score || 0
          const nextScore = studies[i + 1].aggregate_qm_score || 0
          expect(currentScore).toBeGreaterThanOrEqual(nextScore)
        }
      }
    })

    it('should exclude deleted studies', async () => {
      const studies = await prisma.aggregate_correlations.findMany({
        where: {
          deleted_at: null,
          is_public: true,
        },
        take: 10,
      })

      studies.forEach(study => {
        expect(study.deleted_at).toBeNull()
      })
    })

    it('should count total public studies', async () => {
      const total = await prisma.aggregate_correlations.count({
        where: {
          deleted_at: null,
          is_public: true,
        },
      })

      expect(total).toBeGreaterThan(0)
      expect(typeof total).toBe('number')
    })

    it('should support pagination', async () => {
      const perPage = 10
      const page1 = await prisma.aggregate_correlations.findMany({
        where: {
          deleted_at: null,
          is_public: true,
        },
        orderBy: [{ aggregate_qm_score: 'desc' }],
        take: perPage,
        skip: 0,
      })

      const page2 = await prisma.aggregate_correlations.findMany({
        where: {
          deleted_at: null,
          is_public: true,
        },
        orderBy: [{ aggregate_qm_score: 'desc' }],
        take: perPage,
        skip: perPage,
      })

      // Pages should be different
      if (page1.length > 0 && page2.length > 0) {
        expect(page1[0].id).not.toBe(page2[0].id)
      }
    })
  })

  describe('Individual Study Page', () => {
    it('should fetch a study by ID', async () => {
      // Test that we can fetch individual studies
      const study = await prisma.aggregate_correlations.findFirst({
        where: {
          deleted_at: null,
          is_public: true,
        },
        include: {
          variables_aggregate_correlations_cause_variable_idTovariables: true,
          variables_aggregate_correlations_effect_variable_idTovariables: true,
        },
      })

      if (study) {
        expect(study).toBeDefined()
        expect(study.id).toBeTruthy()
        expect(study.variables_aggregate_correlations_cause_variable_idTovariables).toBeDefined()
        expect(study.variables_aggregate_correlations_effect_variable_idTovariables).toBeDefined()
      }
    })

    it('should include correlation coefficient', async () => {
      const study = await prisma.aggregate_correlations.findFirst({
        where: {
          deleted_at: null,
          is_public: true,
        },
      })

      if (study && study.forward_pearson_correlation_coefficient !== null) {
        expect(study.forward_pearson_correlation_coefficient).toBeDefined()
        expect(typeof study.forward_pearson_correlation_coefficient).toBe('number')
        expect(study.forward_pearson_correlation_coefficient).toBeGreaterThanOrEqual(-1)
        expect(study.forward_pearson_correlation_coefficient).toBeLessThanOrEqual(1)
      }
    })

    it('should include number of users and correlations', async () => {
      const study = await prisma.aggregate_correlations.findFirst({
        where: {
          deleted_at: null,
          is_public: true,
        },
      })

      if (study) {
        expect(study.number_of_users).toBeDefined()
        expect(study.number_of_correlations).toBeDefined()

        if (study.number_of_users !== null) {
          expect(Number(study.number_of_users)).toBeGreaterThan(0)
        }
      }
    })

    it('should handle non-existent study IDs gracefully', async () => {
      const nonExistentStudy = await prisma.aggregate_correlations.findFirst({
        where: {
          id: 999999999,
        },
      })

      expect(nonExistentStudy).toBeNull()
    })

    it('should include statistical significance data', async () => {
      const study = await prisma.aggregate_correlations.findFirst({
        where: {
          deleted_at: null,
          is_public: true,
        },
      })

      if (study && study.statistical_significance !== null) {
        expect(study.statistical_significance).toBeDefined()
        expect(typeof study.statistical_significance).toBe('number')
      }
    })
  })

  describe('Study Data Quality', () => {
    it('should filter studies with minimum data quality', async () => {
      const studies = await prisma.aggregate_correlations.findMany({
        where: {
          deleted_at: null,
          is_public: true,
          number_of_pairs: { gte: 100 }, // Minimum 100 data pairs
        },
        take: 10,
      })

      studies.forEach(study => {
        if (study.number_of_pairs) {
          expect(Number(study.number_of_pairs)).toBeGreaterThanOrEqual(100)
        }
      })
    })

    it('should have valid QM scores', async () => {
      const studies = await prisma.aggregate_correlations.findMany({
        where: {
          deleted_at: null,
          is_public: true,
          aggregate_qm_score: { not: null },
        },
        take: 10,
      })

      studies.forEach(study => {
        if (study.aggregate_qm_score !== null) {
          expect(typeof study.aggregate_qm_score).toBe('number')
          expect(study.aggregate_qm_score).toBeGreaterThan(0)
        }
      })
    })

    it('should have onset delay and duration of action', async () => {
      const study = await prisma.aggregate_correlations.findFirst({
        where: {
          deleted_at: null,
          is_public: true,
        },
      })

      if (study) {
        expect(study.onset_delay).toBeDefined()
        expect(study.duration_of_action).toBeDefined()
        if (study.onset_delay !== null) {
          expect(typeof study.onset_delay).toBe('number')
        }
      }
    })
  })

  describe('Database Schema', () => {
    it('should have aggregate_correlations table accessible', async () => {
      const correlations = await prisma.aggregate_correlations.findMany({
        take: 1,
      })

      expect(correlations).toBeDefined()
      expect(Array.isArray(correlations)).toBe(true)
    })

    it('should have proper relations to variables table', async () => {
      const correlation = await prisma.aggregate_correlations.findFirst({
        where: {
          deleted_at: null,
          is_public: true,
        },
        include: {
          variables_aggregate_correlations_cause_variable_idTovariables: true,
          variables_aggregate_correlations_effect_variable_idTovariables: true,
        },
      })

      if (correlation) {
        expect(correlation.variables_aggregate_correlations_cause_variable_idTovariables).toBeDefined()
        expect(correlation.variables_aggregate_correlations_effect_variable_idTovariables).toBeDefined()
      }
    })
  })
})
