import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConditionSearchInput as ConditionSearch } from '@/components/ConditionSearchInput'
import { getConditionsAction, searchConditionsAction } from '@/lib/actions/conditions'
import { act } from 'react'
import React from "react"
// No need for Database type here if we define the action return type directly

// Mock the actions
jest.mock('@/lib/actions/conditions', () => ({
  getConditionsAction: jest.fn(),
  searchConditionsAction: jest.fn()
}))

// Define the type returned by the actions based on their select statement
type ConditionActionReturn = {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
};

// Define the simplified type expected by onSelect and selected props
type SimpleCondition = { id: string; name: string };


describe('ConditionSearch', () => {
  const mockOnSelect = jest.fn()
  const mockActionReturnData: ConditionActionReturn[] = [
    { id: "1", name: "Diabetes", description: "A metabolic disease", emoji: "🩸" },
    { id: "2", name: "Hypertension", description: "High blood pressure", emoji: "🩺" },
    { id: "3", name: "Alzheimer's Disease", description: "A progressive disease", emoji: "🧠" },
  ]

  const defaultProps = {
    onSelect: mockOnSelect,
    selected: null as SimpleCondition | null, // Start with null selection
  }

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the initial load action
    (getConditionsAction as jest.Mock).mockResolvedValue(mockActionReturnData);
    // Mock the search action
    (searchConditionsAction as jest.Mock).mockImplementation(async (query: string) => {
      return mockActionReturnData.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
    });
  })

  it('renders with placeholder text', async () => {
    render(<ConditionSearch {...defaultProps} />)
    // Wait for initial load to finish
    await waitFor(() => expect(getConditionsAction).toHaveBeenCalled())
    expect(screen.getByPlaceholderText('Search conditions...')).toBeInTheDocument()
  })

  it('loads initial conditions on mount', async () => {
    render(<ConditionSearch {...defaultProps} />);
    await waitFor(() => {
      expect(getConditionsAction).toHaveBeenCalledTimes(1);
    });
    // Check if an initial condition is visible after loading (assuming suggestions are shown initially or on focus)
    const input = screen.getByRole('searchbox')
    await userEvent.click(input) // Open suggestions
    await waitFor(() => {
       expect(screen.getByText('Diabetes')).toBeInTheDocument()
    })
  })

  it('shows suggestions when typing', async () => {
    const user = userEvent.setup()
    render(<ConditionSearch {...defaultProps} />)
    // Wait for initial load
    await waitFor(() => expect(getConditionsAction).toHaveBeenCalled())

    const input = screen.getByRole('searchbox')
    await user.click(input) // Focus to show initial/potentially empty list first
    await user.type(input, 'Alz')

    await waitFor(() => {
      expect(searchConditionsAction).toHaveBeenCalledWith('Alz')
    })

    await waitFor(() => {
      // Check suggestions based on the new mock data
      expect(screen.getByText("Alzheimer's Disease")).toBeInTheDocument()
      expect(screen.queryByText('Diabetes')).not.toBeInTheDocument() // Should be filtered out
    })
  })

  it('calls onSelect with {id, name} when a suggestion is clicked', async () => {
    const user = userEvent.setup()
    render(<ConditionSearch {...defaultProps} />)
    await waitFor(() => expect(getConditionsAction).toHaveBeenCalled()) // Wait for load

    const input = screen.getByRole('searchbox')
    await user.click(input) // Open suggestions
    await user.type(input, 'Diab') // Search for Diabetes

    await waitFor(() => {
       expect(screen.getByText('Diabetes')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Diabetes'))

    // Check if onSelect was called with the correct simplified object
    expect(mockOnSelect).toHaveBeenCalledWith({ id: "1", name: "Diabetes" })
    expect(mockOnSelect).toHaveBeenCalledTimes(1)

    // Input should be cleared and suggestions hidden after selection
    expect(input).toHaveValue('')
    await waitFor(() => {
      expect(screen.queryByText('Diabetes')).not.toBeInTheDocument()
    })
  })

  it("shows 'No conditions found' when search yields no results", async () => {
    const user = userEvent.setup()
    render(<ConditionSearch {...defaultProps} />)
    await waitFor(() => expect(getConditionsAction).toHaveBeenCalled())

    const input = screen.getByRole('searchbox')
    await user.click(input)
    await user.type(input, 'NonExistentCondition')

    await waitFor(() => {
      expect(searchConditionsAction).toHaveBeenCalledWith('NonExistentCondition')
    })

    await waitFor(() => {
      expect(screen.getByText('No conditions found')).toBeInTheDocument()
    })
  })

  it('displays the selected condition name in the input when passed via props', async () => {
    const selectedProps = {
      ...defaultProps,
      selected: { id: "2", name: "Hypertension" },
    };
    render(<ConditionSearch {...selectedProps} />);
    await waitFor(() => expect(getConditionsAction).toHaveBeenCalled()); // Ensure component loaded

    const input = screen.getByRole('searchbox') as HTMLInputElement;
    // The value should be set via useEffect in the component
    await waitFor(() => {
      expect(input.value).toBe("Hypertension");
    });
  })

}) 