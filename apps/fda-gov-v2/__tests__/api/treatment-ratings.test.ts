import { createServerClient } from '@/lib/supabase'
import {
  getTreatmentRatings,
  getTreatmentAverageRating,
  createTreatmentRating,
} from '@/lib/api/treatment-ratings'

// Mock the supabase client and cookies
jest.mock('@/lib/supabase', () => ({
  createServerClient: jest.fn()
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    getAll: jest.fn()
  }))
}))

describe('Treatment Ratings API', () => {
  const mockSupabase = {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn()
    })),
    rpc: jest.fn()
  }
  
  beforeEach(() => {
    jest.clearAllMocks();
    (createServerClient as jest.Mock).mockReturnValue(mockSupabase)
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
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_average_treatment_rating', {
        p_treatment_id: 'treatment-1',
        p_condition_id: 'condition-1'
      })
    })

    it('handles errors gracefully', async () => {
      mockSupabase.rpc.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      })

      await expect(getTreatmentAverageRating('treatment-1', 'condition-1'))
        .rejects.toThrow('Failed to fetch average treatment rating')
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

      const mockCreatedRating = { ...newRating, id: '1' }
      mockSupabase.from().insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockCreatedRating, error: null })
        })
      })

      const result = await createTreatmentRating(newRating)
      
      expect(result).toEqual(mockCreatedRating)
      expect(mockSupabase.from).toHaveBeenCalledWith('treatment_ratings')
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(newRating)
    })

    it('handles errors gracefully', async () => {
      mockSupabase.from().insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'Database error' } 
          })
        })
      })

      const newRating = {
        treatment_id: 'treatment-1',
        condition_id: 'condition-1',
        user_id: 'user-1',
        rating: 5,
        review: 'Excellent treatment'
      }

      await expect(createTreatmentRating(newRating))
        .rejects.toThrow('Failed to create treatment rating')
    })
  })
}) 