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
  let mockSupabase: any
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn(),
      rpc: jest.fn()
    }
    ;(createServerClient as jest.Mock).mockReturnValue(mockSupabase)
    // Mock console.error to keep test output clean
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    // Restore console.error
    consoleErrorSpy.mockRestore()
  })

  describe('getTreatmentRatings', () => {
    it('fetches treatment ratings for a given treatment and condition', async () => {
      const mockRatings = [
        { id: '1', rating: 4, review: 'Great treatment' },
        { id: '2', rating: 5, review: 'Excellent results' }
      ]

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockRatings, error: null })
      }
      mockSupabase.from.mockReturnValue(mockChain)

      const result = await getTreatmentRatings('treatment-1', 'condition-1')
      
      expect(result).toEqual(mockRatings)
      expect(mockSupabase.from).toHaveBeenCalledWith('treatment_ratings')
      expect(mockChain.select).toHaveBeenCalled()
      expect(mockChain.eq).toHaveBeenCalledTimes(2)
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('handles errors gracefully', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Database error' } 
        })
      }
      mockSupabase.from.mockReturnValue(mockChain)

      await expect(getTreatmentRatings('treatment-1', 'condition-1'))
        .rejects.toThrow('Failed to fetch treatment ratings')
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching treatment ratings:',
        { message: 'Database error' }
      )
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
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching average treatment rating:',
        { message: 'Database error' }
      )
    })
  })

  describe('createTreatmentRating', () => {
    it('creates a new treatment rating', async () => {
      const newRating = {
        treatment_id: 'treatment-1',
        condition_id: 'condition-1',
        user_id: 'user-1',
        rating: 5,
        review: 'Excellent treatment',
        user_type: 'patient'
      }

      const mockCreatedRating = { ...newRating, id: '1' }
      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockCreatedRating, error: null })
      }
      mockSupabase.from.mockReturnValue(mockChain)

      const result = await createTreatmentRating(newRating)
      
      expect(result).toEqual(mockCreatedRating)
      expect(mockSupabase.from).toHaveBeenCalledWith('treatment_ratings')
      expect(mockChain.insert).toHaveBeenCalledWith(newRating)
      expect(mockChain.select).toHaveBeenCalled()
      expect(mockChain.single).toHaveBeenCalled()
    })

    it('handles errors gracefully', async () => {
      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Database error' } 
        })
      }
      mockSupabase.from.mockReturnValue(mockChain)

      const newRating = {
        treatment_id: 'treatment-1',
        condition_id: 'condition-1',
        user_id: 'user-1',
        rating: 5,
        review: 'Excellent treatment',
        user_type: 'patient'
      }

      await expect(createTreatmentRating(newRating))
        .rejects.toThrow('Failed to create treatment rating')
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error creating treatment rating:',
        { message: 'Database error' }
      )
    })
  })
}) 