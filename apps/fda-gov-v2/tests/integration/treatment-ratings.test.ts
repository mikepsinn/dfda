import { createClient } from '@supabase/supabase-js'
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import {
  getTreatmentRatingsAction,
  getAverageTreatmentRatingAction,
  createTreatmentRatingAction,
} from '@/app/actions/treatment-ratings'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

describe('Treatment Ratings API Integration', () => {
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
          rating: 4,
          review: 'Great treatment',
          user_type: 'patient'
        },
        {
          treatment_id: testTreatmentId,
          condition_id: testConditionId,
          user_id: testUserId + '2',
          rating: 5,
          review: 'Excellent results',
          user_type: 'patient'
        }
      ]

      // Insert test data
      for (const rating of testRatings) {
        await supabase.from('treatment_ratings').insert(rating)
      }

      const ratings = await getTreatmentRatingsAction(testTreatmentId, testConditionId)
      
      expect(ratings).toHaveLength(2)
      expect(ratings[0].rating).toBe(5) // Most recent first
      expect(ratings[1].rating).toBe(4)
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
          rating: 4,
          review: 'Good',
          user_type: 'patient'
        },
        {
          treatment_id: testTreatmentId,
          condition_id: testConditionId,
          user_id: testUserId + '2',
          rating: 5,
          review: 'Excellent',
          user_type: 'patient'
        }
      ]

      // Insert test data
      for (const rating of testRatings) {
        await supabase.from('treatment_ratings').insert(rating)
      }

      const result = await getAverageTreatmentRatingAction(testTreatmentId, testConditionId)
      
      expect(result.average).toBe(4.5)
      expect(result.count).toBe(2)
    })

    it('returns zero for non-existent treatment ratings', async () => {
      const result = await getAverageTreatmentRatingAction('nonexistent-treatment', 'nonexistent-condition')
      expect(result.average).toBe(0)
      expect(result.count).toBe(0)
    })
  })

  describe('createTreatmentRating', () => {
    it('creates a new treatment rating', async () => {
      const newRating = {
        treatment_id: testTreatmentId,
        condition_id: testConditionId,
        user_id: testUserId,
        rating: 5,
        review: 'Excellent treatment',
        user_type: 'patient'
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
        rating: 5,
        review: 'First review',
        user_type: 'patient'
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
}) 