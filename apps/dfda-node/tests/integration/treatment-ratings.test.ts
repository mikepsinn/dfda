import type { Database } from "@/lib/database.types"
import { createClient } from '@supabase/supabase-js'
import { describe, it, expect, afterEach } from '@jest/globals'
import {
  getRatingForPatientTreatmentPatientConditionAction,
  upsertTreatmentRatingAction,
  deleteTreatmentRatingAction,
  type TreatmentRatingUpsertData,
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

  describe('createTreatmentRating', () => {
    it('creates a new treatment rating', async () => {
      const newRating: TreatmentRatingUpsertData = {
        patient_treatment_id: 'mock-patient-treatment-id-1',
        patient_condition_id: 'mock-patient-condition-id-1',
        effectiveness_out_of_ten: 8,
        review: 'Test review create',
      }

      const result = await upsertTreatmentRatingAction(newRating)
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.id).toBeDefined()
      expect(result.data).toMatchObject(newRating)

      const { data: dbRating } = await supabase
        .from('treatment_ratings')
        .select('*')
        .eq('id', result.data!.id)
        .single()

      expect(dbRating).toMatchObject(newRating)
    })

    it('should update an existing rating using upsert', async () => {
      const initialRating: TreatmentRatingUpsertData = {
        patient_treatment_id: 'mock-patient-treatment-id-upsert',
        patient_condition_id: 'mock-patient-condition-id-upsert',
        effectiveness_out_of_ten: 5,
        review: 'Initial review for upsert test',
      }

      const initialResult = await upsertTreatmentRatingAction(initialRating)
      expect(initialResult.success).toBe(true)
      expect(initialResult.data).toBeDefined()
      const ratingId = initialResult.data!.id

      const updatedRatingData: TreatmentRatingUpsertData = {
        patient_treatment_id: 'mock-patient-treatment-id-upsert',
        patient_condition_id: 'mock-patient-condition-id-upsert',
        effectiveness_out_of_ten: 9,
        review: 'Updated review for upsert test',
      }

      const updateResult = await upsertTreatmentRatingAction(updatedRatingData)
      expect(updateResult.success).toBe(true)
      expect(updateResult.data).toBeDefined()
      expect(updateResult.data?.id).toBe(ratingId)
      expect(updateResult.data?.effectiveness_out_of_ten).toBe(9)
      expect(updateResult.data?.review).toBe('Updated review for upsert test')

      const { data: dbRating } = await supabase
        .from('treatment_ratings')
        .select('*')
        .eq('id', ratingId)
        .single()
      expect(dbRating?.effectiveness_out_of_ten).toBe(9)
    })

    it('should delete a rating', async () => {
      const newRating: TreatmentRatingUpsertData = {
        patient_treatment_id: 'mock-patient-treatment-id-1',
        patient_condition_id: 'mock-patient-condition-id-1',
        effectiveness_out_of_ten: 8,
        review: 'Test review create',
      }

      const result = await upsertTreatmentRatingAction(newRating)
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.id).toBeDefined()
      expect(result.data).toMatchObject(newRating)

      const { data: dbRating } = await supabase
        .from('treatment_ratings')
        .select('*')
        .eq('id', result.data!.id)
        .single()

      expect(dbRating).toMatchObject(newRating)

      const deleteResult = await deleteTreatmentRatingAction(result.data!.id)
      expect(deleteResult.success).toBe(true)

      const { data: deletedRating } = await supabase
        .from('treatment_ratings')
        .select('*')
        .eq('id', result.data!.id)
        .single()

      expect(deletedRating).toBeNull()
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