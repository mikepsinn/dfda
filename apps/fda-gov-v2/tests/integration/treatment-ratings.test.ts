import type { Database } from "@/lib/database.types"
import { createClient } from '@supabase/supabase-js'
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import {
  getTreatmentRatingsAction,
  getAverageTreatmentRatingAction,
  createTreatmentRatingAction,
} from '@/app/actions/treatment-ratings'

type TreatmentRating = Database["public"]["Tables"]["treatment_ratings"]["Row"]
type TreatmentStats = {
  avg_effectiveness: number
  avg_side_effects: number
  total_ratings: number
}

// Create test client
const createTestClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

describe('Treatment Ratings API Integration', () => {
  const supabase = createTestClient()
  const testTreatmentId = 'test-treatment-1'
  const testConditionId = 'test-condition-1'
  const testUserId = 'test-user-1'

  // Clean up test data after each test
  afterEach(async () => {
    await supabase
      .from('treatment_ratings')
      .delete()
      .eq('treatment_id', testTreatmentId)
  })

  describe('getTreatmentRatings', () => {
    it('fetches treatment ratings for a given treatment and condition', async () => {
      // Create test ratings
      const testRatings = [
        { 
          treatment_id: testTreatmentId,
          condition_id: testConditionId,
          user_id: testUserId,
          effectiveness_out_of_ten: 4,
          review: 'Great treatment',
          unit_id: 'test-unit-1'
        },
        {
          treatment_id: testTreatmentId,
          condition_id: testConditionId,
          user_id: testUserId + '2',
          effectiveness_out_of_ten: 5,
          review: 'Excellent results',
          unit_id: 'test-unit-1'
        }
      ]

      // Insert test data
      for (const rating of testRatings) {
        await supabase.from('treatment_ratings').insert(rating)
      }

      const ratings = await getTreatmentRatingsAction(testTreatmentId, testConditionId)
      
      expect(ratings).toHaveLength(2)
      expect((ratings as TreatmentRating[])[0].effectiveness_out_of_ten).toBe(5) // Most recent first
      expect((ratings as TreatmentRating[])[1].effectiveness_out_of_ten).toBe(4)
    })

    it('returns empty array when no ratings exist', async () => {
      const ratings = await getTreatmentRatingsAction('nonexistent-treatment', 'nonexistent-condition')
      expect(ratings).toEqual([])
    })
  })

  describe('getTreatmentAverageRating', () => {
    it('calculates average rating correctly', async () => {
      // Create test ratings
      const testRatings = [
        { 
          treatment_id: testTreatmentId,
          condition_id: testConditionId,
          user_id: testUserId,
          effectiveness_out_of_ten: 4,
          review: 'Good',
          unit_id: 'test-unit-1'
        },
        {
          treatment_id: testTreatmentId,
          condition_id: testConditionId,
          user_id: testUserId + '2',
          effectiveness_out_of_ten: 5,
          review: 'Excellent',
          unit_id: 'test-unit-1'
        }
      ]

      // Insert test data
      for (const rating of testRatings) {
        await supabase.from('treatment_ratings').insert(rating)
      }

      const result = await getAverageTreatmentRatingAction(testTreatmentId, testConditionId)
      
      expect(result.avg_effectiveness).toBe(4.5)
      expect(result.total_ratings).toBe(2)
    })

    it('returns zero for non-existent treatment ratings', async () => {
      const result = await getAverageTreatmentRatingAction('nonexistent-treatment', 'nonexistent-condition')
      expect(result.avg_effectiveness).toBe(0)
      expect(result.total_ratings).toBe(0)
    })
  })

  describe('createTreatmentRating', () => {
    it('creates a new treatment rating', async () => {
      const newRating = {
        treatment_id: testTreatmentId,
        condition_id: testConditionId,
        user_id: testUserId,
        effectiveness_out_of_ten: 5,
        review: 'Excellent treatment',
        unit_id: 'test-unit-1'
      }

      const result = await createTreatmentRatingAction(newRating)
      
      expect(result).toMatchObject(newRating)
      expect(result.id).toBeDefined()

      // Verify it was actually created in the database
      const { data } = await supabase
        .from('treatment_ratings')
        .select()
        .eq('id', result.id)
        .single()

      expect(data).toMatchObject(newRating)
    })

    it('prevents duplicate ratings from same user for same treatment/condition', async () => {
      const rating = {
        treatment_id: testTreatmentId,
        condition_id: testConditionId,
        user_id: testUserId,
        effectiveness_out_of_ten: 5,
        review: 'First review',
        unit_id: 'test-unit-1'
      }

      // Create first rating
      await createTreatmentRatingAction(rating)

      // Attempt to create duplicate rating
      await expect(createTreatmentRatingAction({
        ...rating,
        review: 'Second review'
      })).rejects.toThrow()
    })
  })

  it("should get ratings sorted by date", async () => {
    const { data: ratings } = await supabase
      .from("treatment_ratings")
      .select()
      .order("created_at", { ascending: false })

    expect(ratings).toBeDefined()
    expect(ratings).toHaveLength(2)
    expect((ratings as TreatmentRating[])[0].effectiveness_out_of_ten).toBe(5) // Most recent first
    expect((ratings as TreatmentRating[])[1].effectiveness_out_of_ten).toBe(4)
  })

  it("should calculate average rating", async () => {
    const { data: result } = await supabase
      .rpc("get_treatment_stats", { treatment_id: "test-treatment" })

    expect(result).toBeDefined()
    const stats = result as TreatmentStats
    expect(stats.avg_effectiveness).toBe(4.5)
    expect(stats.total_ratings).toBe(2)
  })

  it("should handle no ratings", async () => {
    const { data: result } = await supabase
      .rpc("get_treatment_stats", { treatment_id: "non-existent" })

    expect(result).toBeDefined()
    const stats = result as TreatmentStats
    expect(stats.avg_effectiveness).toBe(0)
    expect(stats.total_ratings).toBe(0)
  })
}) 