import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom'; // For extended matchers, Vitest setup should handle this.
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { ReminderNotificationCard } from '@/components/reminders/reminder-notification-card';
import type { ReminderNotificationDetails, VariableCategoryId } from '@/lib/database.types.custom';
import { VARIABLE_CATEGORY_IDS } from '@/lib/constants/variable-categories'; // For mock data
import { UNIT_IDS } from '@/lib/constants/units'; // Import UNIT_IDS

const mockNotification: ReminderNotificationDetails = {
  notificationId: 'notif-test-1',
  scheduleId: 'sched-test-1',
  userVariableId: 'uv-test-1',
  globalVariableId: 'gv-test-1',
  dueAt: new Date().toISOString(),
  variableName: 'Test Variable Name',
  variableCategory: VARIABLE_CATEGORY_IDS.MENTAL_AND_EMOTIONAL_STATE as VariableCategoryId,
  unitId: UNIT_IDS.ONE_TO_FIVE_SCALE,
  unitName: 'rating',
  title: 'Test Notification Title',
  message: 'This is a test notification message.',
  status: 'pending',
  defaultValue: 3,
  emoji: '🤔',
  value: null,
  isEditable: true,
};

describe('ReminderNotificationCard', () => {
  const mockOnLogMeasurement = vi.fn();
  const mockOnSkip = vi.fn();
  const mockOnUndo = vi.fn();
  const mockOnEditReminderSettings = vi.fn();
  const mockOnNavigateToVariableSettings = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render pending notification content correctly', () => {
    render(
      <ReminderNotificationCard
        reminderNotification={mockNotification}
        userTimezone="America/New_York"
        onLogMeasurement={mockOnLogMeasurement}
        onSkip={mockOnSkip}
        onUndoLog={mockOnUndo}
        onEditReminderSettings={mockOnEditReminderSettings}
        onNavigateToVariableSettings={mockOnNavigateToVariableSettings}
      />
    );

    // Check for title and variable name (often combined or variable name is primary)
    expect(screen.getByText(mockNotification.variableName)).toBeInTheDocument();
    if (mockNotification.title) {
      expect(screen.getByText(mockNotification.title)).toBeInTheDocument();
    }
    
    // Check for emoji
    if (mockNotification.emoji) {
      expect(screen.getByText(mockNotification.emoji)).toBeInTheDocument();
    }

    // For a pending 'rating_1_5' input_type, expect rating buttons
    // The default value might be displayed, or interaction elements for it.
    // For rating_1_5, it usually shows buttons "1" through "5" (or icons).
    // Let's check for the presence of rating buttons, e.g., a button with aria-label "Rate 1" or text "1"
    const rateButton1 = screen.getByRole('button', { name: /rate 1/i });
    expect(rateButton1).toBeInTheDocument();
    const rateButton5 = screen.getByRole('button', { name: /rate 5/i });
    expect(rateButton5).toBeInTheDocument();

    // Check for "Skip" button
    expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
  });

  it('should call onLogMeasurement with correct value when a rating button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ReminderNotificationCard
        reminderNotification={mockNotification} // status: 'pending', inputType: 'rating_1_5'
        userTimezone="America/New_York"
        onLogMeasurement={mockOnLogMeasurement}
        onSkip={mockOnSkip}
        onUndoLog={mockOnUndo}
        onEditReminderSettings={mockOnEditReminderSettings}
        onNavigateToVariableSettings={mockOnNavigateToVariableSettings}
      />
    );

    const ratingButton5 = screen.getByRole('button', { name: /rate 5/i });
    await user.click(ratingButton5);

    expect(mockOnLogMeasurement).toHaveBeenCalledTimes(1);
    expect(mockOnLogMeasurement).toHaveBeenCalledWith(mockNotification, 5);
  });

  it('should call onSkip with correct data when skip button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ReminderNotificationCard
        reminderNotification={mockNotification} // status: 'pending'
        userTimezone="America/New_York"
        onLogMeasurement={mockOnLogMeasurement}
        onSkip={mockOnSkip}
        onUndoLog={mockOnUndo}
        onEditReminderSettings={mockOnEditReminderSettings}
        onNavigateToVariableSettings={mockOnNavigateToVariableSettings}
      />
    );

    const skipButton = screen.getByRole('button', { name: /skip/i });
    await user.click(skipButton);

    expect(mockOnSkip).toHaveBeenCalledTimes(1);
    expect(mockOnSkip).toHaveBeenCalledWith(mockNotification);
  });

  it('should render completed notification content correctly', () => {
    const completedNotification: ReminderNotificationDetails = {
      ...mockNotification, // Base it on the pending one
      status: 'completed',
      value: 4, // Example logged value
    };
    const mockLoggedData = { value: 4, unitName: 'rating' }; // loggedData prop for completed cards

    render(
      <ReminderNotificationCard
        reminderNotification={completedNotification}
        userTimezone="America/New_York"
        loggedData={mockLoggedData} // Pass loggedData for completed view
        onLogMeasurement={mockOnLogMeasurement}
        onSkip={mockOnSkip}
        onUndoLog={mockOnUndo} 
        onEditReminderSettings={mockOnEditReminderSettings}
        onNavigateToVariableSettings={mockOnNavigateToVariableSettings}
      />
    );

    // Check for logged value display
    // ReminderNotificationCard shows: `Logged: {displayLoggedValue} {displayLoggedUnit}`
    const loggedTextParagraph = screen.getByText((content, element) => {
      // Ensure we are targeting the <p> element that directly contains "Logged:"
      // and whose full text content, when normalized, matches the expected string.
      if (element && element.tagName.toLowerCase() === 'p' && content.includes('Logged:')) {
        const normalizedText = element.textContent?.replace(/\s+/g, ' ').trim();
        return normalizedText === `Logged: ${mockLoggedData.value} ${mockLoggedData.unitName}`;
      }
      return false;
    });
    expect(loggedTextParagraph).toBeInTheDocument();

    // Check that rating buttons are NOT present
    expect(screen.queryByRole('button', { name: /rate 1/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /rate 5/i })).not.toBeInTheDocument();

    // Check that a generic "Log" button (if applicable for other input types) is NOT present
    // For rating_1_5, specific rating buttons are used, but for numeric, a "Log" button exists.
    // This specific test uses rating_1_5, so the above check for rating buttons is more direct.
    // If testing a numeric input type that becomes completed, you'd check for the absence of its "Log" button.

    // Check that "Skip" button is NOT present
    expect(screen.queryByRole('button', { name: /skip/i })).not.toBeInTheDocument();

    // Check for "Undo" button
    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
  });

  it('should call onUndoLog with correct data when undo button is clicked', async () => {
    const user = userEvent.setup();
    const completedNotification: ReminderNotificationDetails = {
      ...mockNotification,
      status: 'completed',
      value: 4,
    };
    const mockLoggedData = { value: 4, unitName: 'rating' };

    render(
      <ReminderNotificationCard
        reminderNotification={completedNotification}
        userTimezone="America/New_York"
        loggedData={mockLoggedData}
        onLogMeasurement={mockOnLogMeasurement}
        onSkip={mockOnSkip}
        onUndoLog={mockOnUndo}
        onEditReminderSettings={mockOnEditReminderSettings}
        onNavigateToVariableSettings={mockOnNavigateToVariableSettings}
      />
    );

    const undoButton = screen.getByRole('button', { name: /undo/i });
    await user.click(undoButton);

    expect(mockOnUndo).toHaveBeenCalledTimes(1);
    expect(mockOnUndo).toHaveBeenCalledWith(completedNotification);
  });

  it('should render skipped notification content correctly', () => {
    const skippedNotification: ReminderNotificationDetails = {
      ...mockNotification,
      status: 'skipped',
      value: null, // Value should be null for skipped
    };

    render(
      <ReminderNotificationCard
        reminderNotification={skippedNotification}
        userTimezone="America/New_York"
        // loggedData is not typically passed for skipped, value is null
        onLogMeasurement={mockOnLogMeasurement}
        onSkip={mockOnSkip}
        onUndoLog={mockOnUndo}
        onEditReminderSettings={mockOnEditReminderSettings}
        onNavigateToVariableSettings={mockOnNavigateToVariableSettings}
      />
    );

    // Check for "Skipped" text. The component might render this within a specific element or structure.
    // Let's assume it renders the text "Skipped" visibly.
    // A robust way would be to check for an element that contains this text, perhaps with specific styling or role.
    // For now, a simple text check, which might need refinement based on actual component output.
    expect(screen.getByText(/skipped/i)).toBeInTheDocument(); // Case-insensitive search for "skipped"

    // Check that rating buttons (or other input elements for pending) are NOT present
    expect(screen.queryByRole('button', { name: /rate 1/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /skip/i })).not.toBeInTheDocument(); // Skip button itself should not be there

    // Check for "Undo" button (as skipped items can be undone)
    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
  });

  // Add more tests for:
  // - Different input_types (slider, quick_log, boolean_check, etc.)
}); 