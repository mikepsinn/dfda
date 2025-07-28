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
    // Ensure the original "Skip notification" button is not present
    expect(screen.queryByRole('button', { name: /skip notification/i })).not.toBeInTheDocument(); 

    // Check for "Undo" button (as skipped items can be undone)
    // The Undo button for skipped items has aria-label="Undo skip"
    expect(screen.getByRole('button', { name: /undo skip/i })).toBeInTheDocument();
  });

  // Add more tests for:
  // - Different input_types (slider, quick_log, boolean_check, etc.)
});

// --- Tests for NUMERIC input type ---
describe('ReminderNotificationCard - Numeric Input', () => {
  const mockNumericNotification: ReminderNotificationDetails = {
    ...mockNotification, // Base on the default mock
    notificationId: 'notif-numeric-1',
    scheduleId: 'sched-numeric-1',
    userVariableId: 'uv-numeric-1',
    globalVariableId: 'gv-numeric-1',
    variableName: 'Blood Glucose',
    unitId: 'unit-mg-dl', // A unit that would resolve to 'numeric' input type
    unitName: 'mg/dL',
    title: 'Log Blood Glucose',
    defaultValue: 100,
    emoji: '🩸',
    // No specific min/max for generic numeric, component might have its own validation
  };

  const mockOnLogMeasurementNumeric = vi.fn();
  const mockOnSkipNumeric = vi.fn();
  const mockOnUndoNumeric = vi.fn();
  const mockOnEditReminderSettingsNumeric = vi.fn();
  const mockOnNavigateToVariableSettingsNumeric = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render pending numeric notification with input and Log button', () => {
    render(
      <ReminderNotificationCard
        reminderNotification={mockNumericNotification}
        userTimezone="America/New_York"
        onLogMeasurement={mockOnLogMeasurementNumeric}
        onSkip={mockOnSkipNumeric}
        onUndoLog={mockOnUndoNumeric}
        onEditReminderSettings={mockOnEditReminderSettingsNumeric}
        onNavigateToVariableSettings={mockOnNavigateToVariableSettingsNumeric}
      />
    );

    // Check for the numeric input field
    const inputField = screen.getByRole('spinbutton', { name: mockNumericNotification.variableName });
    expect(inputField).toBeInTheDocument();
    expect(inputField).toHaveValue(mockNumericNotification.defaultValue);
    expect(inputField).toHaveAttribute('type', 'number');

    // Check for the "Log" button
    expect(screen.getByRole('button', { name: 'Log' })).toBeInTheDocument();

    // Check for "Skip" button
    expect(screen.getByRole('button', { name: /skip notification/i })).toBeInTheDocument();
  });

  it('should call onLogMeasurement with entered value for numeric input', async () => {
    const user = userEvent.setup();
    const numericValueToLog = 120;
    render(
      <ReminderNotificationCard
        reminderNotification={mockNumericNotification}
        userTimezone="America/New_York"
        onLogMeasurement={mockOnLogMeasurementNumeric}
        onSkip={mockOnSkipNumeric}
        onUndoLog={mockOnUndoNumeric}
        onEditReminderSettings={mockOnEditReminderSettingsNumeric}
        onNavigateToVariableSettings={mockOnNavigateToVariableSettingsNumeric}
      />
    );

    const inputField = screen.getByRole('spinbutton', { name: mockNumericNotification.variableName });
    const logButton = screen.getByRole('button', { name: 'Log' });

    // Clear existing default value and type new value
    await user.clear(inputField);
    await user.type(inputField, numericValueToLog.toString());
    await user.click(logButton);

    expect(mockOnLogMeasurementNumeric).toHaveBeenCalledTimes(1);
    expect(mockOnLogMeasurementNumeric).toHaveBeenCalledWith(mockNumericNotification, numericValueToLog);
  });
});

// --- Tests for BOOLEAN input type ---
describe('ReminderNotificationCard - Boolean Input', () => {
  const mockBooleanNotification: ReminderNotificationDetails = {
    ...mockNotification, // Base on the default mock from the first describe block
    notificationId: 'notif-boolean-1',
    scheduleId: 'sched-boolean-1',
    userVariableId: 'uv-boolean-1',
    globalVariableId: 'gv-boolean-1',
    variableName: 'Took Medication?',
    unitId: UNIT_IDS.BOOLEAN_1_YES_TRUE_0_NO_FALSE_, // Specific unit for boolean
    unitName: 'Yes/No',
    title: 'Confirm Medication Intake',
    defaultValue: null, // Boolean usually doesn't have a numeric default in the same way
    emoji: '💊',
  };

  const mockOnLogMeasurementBoolean = vi.fn();
  // Other mocks if needed for skip/undo in boolean context, though primary focus is log
  const mockOnSkipBoolean = vi.fn();
  const mockOnUndoBoolean = vi.fn(); // For completeness, though boolean might not show undo if not logged
  const mockOnEditReminderSettingsBoolean = vi.fn();
  const mockOnNavigateToVariableSettingsBoolean = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render pending boolean notification with Yes and No buttons', () => {
    render(
      <ReminderNotificationCard
        reminderNotification={mockBooleanNotification}
        userTimezone="America/New_York"
        onLogMeasurement={mockOnLogMeasurementBoolean}
        onSkip={mockOnSkipBoolean}
        onUndoLog={mockOnUndoBoolean}
        onEditReminderSettings={mockOnEditReminderSettingsBoolean}
        onNavigateToVariableSettings={mockOnNavigateToVariableSettingsBoolean}
      />
    );

    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
    // Ensure numeric input or rating buttons are not present
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /rate/i })).not.toBeInTheDocument();
  });

  it('should call onLogMeasurement with 1 when Yes button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ReminderNotificationCard
        reminderNotification={mockBooleanNotification}
        userTimezone="America/New_York"
        onLogMeasurement={mockOnLogMeasurementBoolean}
        onSkip={mockOnSkipBoolean}
        onUndoLog={mockOnUndoBoolean}
        onEditReminderSettings={mockOnEditReminderSettingsBoolean}
        onNavigateToVariableSettings={mockOnNavigateToVariableSettingsBoolean}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Yes' }));
    expect(mockOnLogMeasurementBoolean).toHaveBeenCalledTimes(1);
    expect(mockOnLogMeasurementBoolean).toHaveBeenCalledWith(mockBooleanNotification, 1);
  });

  it('should call onLogMeasurement with 0 when No button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ReminderNotificationCard
        reminderNotification={mockBooleanNotification}
        userTimezone="America/New_York"
        onLogMeasurement={mockOnLogMeasurementBoolean}
        onSkip={mockOnSkipBoolean}
        onUndoLog={mockOnUndoBoolean}
        onEditReminderSettings={mockOnEditReminderSettingsBoolean}
        onNavigateToVariableSettings={mockOnNavigateToVariableSettingsBoolean}
      />
    );
    await user.click(screen.getByRole('button', { name: 'No' }));
    expect(mockOnLogMeasurementBoolean).toHaveBeenCalledTimes(1);
    expect(mockOnLogMeasurementBoolean).toHaveBeenCalledWith(mockBooleanNotification, 0);
  });
}); 