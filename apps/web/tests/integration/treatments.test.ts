/**
 * @jest-environment node
 */
import { prisma } from '@/lib/db'

describe('Integration - Treatment Pages', () => {
  describe('Treatment List Page', () => {
    it('should fetch treatments from DfdaTreatment table', async () => {
      const treatments = await prisma.dfdaTreatment.findMany({
        take: 5,
      })

      expect(treatments).toBeDefined()
      expect(Array.isArray(treatments)).toBe(true)

      if (treatments.length > 0) {
        expect(treatments[0]).toHaveProperty('id')
        expect(treatments[0]).toHaveProperty('name')
      }
    })

    it('should include treatment names', async () => {
      const treatments = await prisma.dfdaTreatment.findMany({
        take: 5,
      })

      treatments.forEach(treatment => {
        expect(treatment.name).toBeDefined()
        expect(typeof treatment.name).toBe('string')
        expect(treatment.name.length).toBeGreaterThan(0)
      })
    })

    it('should search treatments by name', async () => {
      const searchTerm = 'vitamin'
      const results = await prisma.dfdaTreatment.findMany({
        where: {
          name: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        take: 10,
      })

      if (results.length > 0) {
        results.forEach(treatment => {
          expect(treatment.name.toLowerCase()).toContain(searchTerm.toLowerCase())
        })
      }
    })
  })

  describe('Treatment Condition Relationships', () => {
    it('should link treatments to conditions', async () => {
      const conditionTreatments = await prisma.dfdaConditionTreatment.findMany({
        include: {
          treatment: true,
          condition: true,
        },
        take: 5,
      })

      expect(conditionTreatments).toBeDefined()
      expect(Array.isArray(conditionTreatments)).toBe(true)

      if (conditionTreatments.length > 0) {
        const ct = conditionTreatments[0]
        expect(ct.treatment).toBeDefined()
        expect(ct.condition).toBeDefined()
        expect(ct.treatment.name).toBeTruthy()
        expect(ct.condition.name).toBeTruthy()
      }
    })

    it('should include popularity scores', async () => {
      const conditionTreatment = await prisma.dfdaConditionTreatment.findFirst({
        where: {
          popularity: { not: null },
        },
      })

      if (conditionTreatment) {
        expect(conditionTreatment.popularity).toBeDefined()
        expect(typeof conditionTreatment.popularity).toBe('number')
        expect(conditionTreatment.popularity).toBeGreaterThan(0)
      }
    })

    it('should include average effect ratings', async () => {
      const conditionTreatment = await prisma.dfdaConditionTreatment.findFirst({
        where: {
          averageEffect: { not: null },
        },
      })

      if (conditionTreatment) {
        expect(conditionTreatment.averageEffect).toBeDefined()
        expect(typeof conditionTreatment.averageEffect).toBe('number')
      }
    })

    it('should order treatments by popularity', async () => {
      const conditionTreatments = await prisma.dfdaConditionTreatment.findMany({
        where: {
          popularity: { not: null },
        },
        orderBy: [{ popularity: 'desc' }],
        take: 10,
      })

      if (conditionTreatments.length > 1) {
        for (let i = 0; i < conditionTreatments.length - 1; i++) {
          const current = conditionTreatments[i].popularity || 0
          const next = conditionTreatments[i + 1].popularity || 0
          expect(current).toBeGreaterThanOrEqual(next)
        }
      }
    })
  })

  describe('Treatment Ratings', () => {
    it('should include major improvement counts', async () => {
      const ct = await prisma.dfdaConditionTreatment.findFirst({
        where: {
          majorImprovement: { gt: 0 },
        },
      })

      if (ct) {
        expect(ct.majorImprovement).toBeDefined()
        expect(ct.majorImprovement).toBeGreaterThan(0)
      }
    })

    it('should include moderate improvement counts', async () => {
      const ct = await prisma.dfdaConditionTreatment.findFirst({
        where: {
          moderateImprovement: { gt: 0 },
        },
      })

      if (ct) {
        expect(ct.moderateImprovement).toBeDefined()
        expect(ct.moderateImprovement).toBeGreaterThan(0)
      }
    })

    it('should include all rating categories', async () => {
      const ct = await prisma.dfdaConditionTreatment.findFirst({
        where: {
          popularity: { gt: 10 },
        },
      })

      if (ct) {
        // Should have fields for all rating categories
        expect(ct).toHaveProperty('majorImprovement')
        expect(ct).toHaveProperty('moderateImprovement')
        expect(ct).toHaveProperty('noEffect')
        expect(ct).toHaveProperty('worse')
        expect(ct).toHaveProperty('muchWorse')
      }
    })
  })

  describe('Treatment Side Effects', () => {
    it('should have side effects table', async () => {
      const sideEffects = await prisma.dfdaTreatmentSideEffect.findMany({
        take: 1,
      })

      expect(sideEffects).toBeDefined()
      expect(Array.isArray(sideEffects)).toBe(true)
    })

    it('should link treatments to side effects', async () => {
      const treatmentSideEffect = await prisma.dfdaTreatmentSideEffect.findFirst({
        include: {
          treatment: true,
          sideEffect: true,
        },
      })

      if (treatmentSideEffect) {
        expect(treatmentSideEffect.treatment).toBeDefined()
        expect(treatmentSideEffect.sideEffect).toBeDefined()
      }
    })
  })

  describe('User Treatment Reports', () => {
    it('should have user treatment reports table', async () => {
      const reports = await prisma.dfdaUserTreatmentReport.findMany({
        take: 1,
      })

      expect(reports).toBeDefined()
      expect(Array.isArray(reports)).toBe(true)
    })

    it('should link reports to users, conditions, and treatments', async () => {
      const report = await prisma.dfdaUserTreatmentReport.findFirst({
        include: {
          condition: true,
          treatment: true,
        },
      })

      if (report) {
        expect(report).toHaveProperty('userId')
        expect(report.condition).toBeDefined()
        expect(report.treatment).toBeDefined()
      }
    })

    it('should include effectiveness ratings', async () => {
      const report = await prisma.dfdaUserTreatmentReport.findFirst({
        where: {
          effectiveness: { not: null },
        },
      })

      if (report) {
        expect(report.effectiveness).toBeDefined()
        expect(typeof report.effectiveness).toBe('string')
      }
    })

    it('should track tried status', async () => {
      const report = await prisma.dfdaUserTreatmentReport.findFirst()

      if (report) {
        expect(report).toHaveProperty('tried')
        expect(typeof report.tried).toBe('boolean')
      }
    })
  })

  describe('Database Schema (PostgreSQL)', () => {
    it('should have DfdaTreatment table accessible', async () => {
      const treatments = await prisma.dfdaTreatment.findMany({
        take: 1,
      })

      expect(treatments).toBeDefined()
      expect(Array.isArray(treatments)).toBe(true)
    })

    it('should have DfdaConditionTreatment relation working', async () => {
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

    it('should have DfdaTreatmentSideEffect table accessible', async () => {
      const sideEffects = await prisma.dfdaTreatmentSideEffect.findMany({
        take: 1,
      })

      expect(sideEffects).toBeDefined()
      expect(Array.isArray(sideEffects)).toBe(true)
    })

    it('should have DfdaUserTreatmentReport table accessible', async () => {
      const reports = await prisma.dfdaUserTreatmentReport.findMany({
        take: 1,
      })

      expect(reports).toBeDefined()
      expect(Array.isArray(reports)).toBe(true)
    })
  })
})
