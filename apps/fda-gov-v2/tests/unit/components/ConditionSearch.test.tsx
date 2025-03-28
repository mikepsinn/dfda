import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConditionSearch } from '@/components/ConditionSearch'
import { getConditionsAction } from '@/app/actions/conditions'
import { act } from 'react'

// Mock the getConditionsAction function
jest.mock('@/app/actions/conditions', () => ({
  getConditionsAction: jest.fn(),
  searchConditionsAction: jest.fn()
}))

describe('ConditionSearch', () => {
  const mockOnConditionSelect = jest.fn()
  const mockConditions = [
    { 
      id: '1', 
      name: 'Alzheimer\'s Disease',
      description: 'A progressive neurologic disorder that causes the brain to shrink and brain cells to die.',
      icd_code: 'G30',
      global_variable_id: null,
      created_at: '2024-03-01T00:00:00.000Z',
      updated_at: '2024-03-01T00:00:00.000Z',
      deleted_at: null
    },
    { 
      id: '2', 
      name: 'Parkinson\'s Disease',
      description: 'A brain disorder that leads to shaking, stiffness, and difficulty with walking, balance, and coordination.',
      icd_code: 'G20',
      global_variable_id: null,
      created_at: '2024-03-01T00:00:00.000Z',
      updated_at: '2024-03-01T00:00:00.000Z',
      deleted_at: null
    }
  ]
  
  const defaultProps = {
    onConditionSelect: mockOnConditionSelect,
    initialSearchTerm: '',
    placeholder: 'Search conditions...',
    initialConditions: mockConditions
  }

  beforeEach(() => {
    mockOnConditionSelect.mockClear();
    (getConditionsAction as jest.Mock).mockResolvedValue(mockConditions)
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
    
    expect(getConditionsAction).toHaveBeenCalled()
    
    await waitFor(() => {
      expect(screen.getByText('Loading conditions...')).toBeInTheDocument()
    })
    
    await waitFor(() => {
      expect(screen.queryByText('Loading conditions...')).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })
}) 