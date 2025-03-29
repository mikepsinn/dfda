import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConditionSearch } from '@/components/ConditionSearch'
import { getConditionsAction, searchConditionsAction } from '@/app/actions/conditions'
import { act } from 'react'
import type { Database } from "@/lib/database.types"

// Mock the getConditionsAction function
jest.mock('@/app/actions/conditions', () => ({
  getConditionsAction: jest.fn(),
  searchConditionsAction: jest.fn()
}))

// Use the database view type directly
type ConditionView = Database["public"]["Views"]["patient_conditions_view"]["Row"]

describe('ConditionSearch', () => {
  const mockOnConditionSelect = jest.fn()
  const mockConditions: ConditionView[] = [
    {
      condition_id: "1",
      condition_name: "Diabetes",
      description: "A metabolic disease",
      icd_code: "E11",
      id: "101",
      patient_id: null,
      diagnosed_at: null,
      severity: null,
      status: null,
      notes: null,
      measurement_count: null
    },
    {
      condition_id: "2",
      condition_name: "Hypertension",
      description: "High blood pressure",
      icd_code: "I10",
      id: "102",
      patient_id: null,
      diagnosed_at: null,
      severity: null,
      status: null,
      notes: null,
      measurement_count: null
    },
  ]
  
  const defaultProps = {
    onSelect: mockOnConditionSelect,
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

  it("renders correctly", () => {
    render(<ConditionSearch {...defaultProps} />)
    expect(screen.getByLabelText(/search conditions/i)).toBeInTheDocument()
  })

  it("shows suggestions when typing search term", async () => {
    render(<ConditionSearch {...defaultProps} />)
    
    const searchInput = screen.getByLabelText(/search conditions/i)
    fireEvent.focus(searchInput)
    fireEvent.change(searchInput, { target: { value: "diab" } })
    
    // Wait for the suggestions to appear
    await waitFor(() => {
      expect(searchConditionsAction).toHaveBeenCalledWith("diab")
      expect(screen.getByText("Diabetes")).toBeInTheDocument()
    })
  })

  it("calls onSelect when a suggestion is clicked", async () => {
    render(<ConditionSearch {...defaultProps} />)
    
    const searchInput = screen.getByLabelText(/search conditions/i)
    fireEvent.focus(searchInput)
    fireEvent.change(searchInput, { target: { value: "diab" } })
    
    await waitFor(() => {
      expect(screen.getByText("Diabetes")).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText("Diabetes"))
    expect(defaultProps.onSelect).toHaveBeenCalledWith(mockConditions[0])
  })

  it("handles empty initial conditions", () => {
    render(<ConditionSearch {...defaultProps} initialConditions={[]} />)
    expect(screen.getByLabelText(/search conditions/i)).toBeInTheDocument()
  })
}) 