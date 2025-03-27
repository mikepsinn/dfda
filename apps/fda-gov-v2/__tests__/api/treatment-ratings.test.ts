import { createClient } from '@/lib/supabase'
import {
  getTreatmentRatings,
  getTreatmentAverageRating,
  createTreatmentRating,
} from '@/lib/api/treatment-ratings'

jest.mock('@/lib/supabase')

describe('Treatment Ratings API', () => {
  const mockSupabase = createClient()
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getTreatmentRatings', () => {
    it('fetches treatment ratings for a given treatment and condition', async () => {
      const mockRatings = [
        { id: '1', rating: 4, review: 'Great treatment' },
        { id: '2', rating: 5, review: 'Excellent results' }
      ]

      mockSupabase.from().select.mockResolvedValue({ data: mockRatings, error: null })

      const result = await getTreatmentRatings('treatment-1', 'condition-1')
      
      expect(result).toEqual(mockRatings)
      expect(mockSupabase.from).toHaveBeenCalledWith('treatment_ratings')
      expect(mockSupabase.from().select).toHaveBeenCalled()
    })

    it('handles errors gracefully', async () => {
      mockSupabase.from().select.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      })

      await expect(getTreatmentRatings('treatment-1', 'condition-1'))
        .rejects.toThrow('Failed to fetch treatment ratings')
    })
  })

  describe('getTreatmentAverageRating', () => {
    it('fetches average rating for a treatment', async () => {
      const mockAverage = { average: 4.5, count: 10 }
      
      mockSupabase.rpc.mockResolvedValue({ data: [mockAverage], error: null })

      const result = await getTreatmentAverageRating('treatment-1', 'condition-1')
      
      expect(result).toEqual(mockAverage)
    })
  })

  describe('createTreatmentRating', () => {
    it('creates a new treatment rating', async () => {
      const newRating = {
        treatment_id: 'treatment-1',
        condition_id: 'condition-1',
        user_id: 'user-1',
        rating: 5,
        review: 'Excellent treatment'
      }

      mockSupabase.from().insert.mockResolvedValue({ 
        data: [{ ...newRating, id: '1' }],
        error: null 
      })

      const result = await createTreatmentRating(newRating)
      
      expect(result).toHaveProperty('id')
      expect(mockSupabase.from).toHaveBeenCalledWith('treatment_ratings')
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(newRating)
    })
  })
}) 