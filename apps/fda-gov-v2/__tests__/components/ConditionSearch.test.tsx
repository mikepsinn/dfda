import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConditionSearch } from '@/components/ConditionSearch'
import { getConditions } from '@/lib/api/conditions'
import { act } from 'react'

// Mock the getConditions function
jest.mock('@/lib/api/conditions', () => ({
  getConditions: jest.fn()
}))

describe('ConditionSearch', () => {
  const mockOnConditionSelect = jest.fn()
  const mockConditions = [
    { id: '1', name: 'Alzheimer\'s Disease' },
    { id: '2', name: 'Parkinson\'s Disease' }
  ]
  
  const defaultProps = {
    onConditionSelect: mockOnConditionSelect,
    initialSearchTerm: '',
    placeholder: 'Search conditions...',
    initialConditions: mockConditions
  }

  beforeEach(() => {
    mockOnConditionSelect.mockClear();
    (getConditions as jest.Mock).mockResolvedValue(mockConditions)
  })

  it('renders with placeholder text', () => {
    render(<ConditionSearch {...defaultProps} />)
    expect(screen.getByPlaceholderText('Search conditions...')).toBeInTheDocument()
  })

  it('shows suggestions when typing', async () => {
    const user = userEvent.setup()
    render(<ConditionSearch {...defaultProps} />)
    const input = screen.getByRole('searchbox')
    
    await user.type(input, 'Alz')
    
    await waitFor(() => {
      expect(screen.getByText('Alzheimer\'s Disease')).toBeInTheDocument()
      expect(screen.queryByText('Parkinson\'s Disease')).not.toBeInTheDocument()
    })
  })

  it('calls onConditionSelect when a suggestion is clicked', async () => {
    const user = userEvent.setup()
    render(<ConditionSearch {...defaultProps} />)
    const input = screen.getByRole('searchbox')
    
    await user.type(input, 'Alz')
    
    await waitFor(() => {
      expect(screen.getByText('Alzheimer\'s Disease')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Alzheimer\'s Disease'))
    
    expect(mockOnConditionSelect).toHaveBeenCalledWith('Alzheimer\'s Disease')
  })

  it('fetches conditions if no initial conditions provided', async () => {
    render(<ConditionSearch {...defaultProps} initialConditions={[]} />)
    
    expect(getConditions).toHaveBeenCalled()
    
    await waitFor(() => {
      expect(screen.getByText('Loading conditions...')).toBeInTheDocument()
    })
    
    await waitFor(() => {
      expect(screen.queryByText('Loading conditions...')).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })
}) 