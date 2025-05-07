import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom'; // For extended matchers, Vitest setup should handle this.
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { ReminderNotificationCard } from '@/components/reminders/reminder-notification-card';
import type { ReminderNotificationDetails, VariableCategoryId } from '@/lib/database.types.custom';
import { VARIABLE_CATEGORY_IDS } from '@/lib/constants/variable-categories'; // For mock data

const mockNotification: ReminderNotificationDetails = {
  notificationId: 'notif-test-1',
  scheduleId: 'sched-test-1',
  userVariableId: 'uv-test-1',
  globalVariableId: 'gv-test-1',
  dueAt: new Date().toISOString(),
  variableName: 'Test Variable Name',
  variableCategory: VARIABLE_CATEGORY_IDS.MENTAL_AND_EMOTIONAL_STATE as VariableCategoryId,
  unitId: 'unit-test-id',
  unitName: 'test unit',
  title: 'Test Notification Title',
  message: 'This is a test notification message.',
  status: 'pending',
  defaultValue: 3,
  emoji: '🤔',
  value: null,
  isEditable: true,
  // Add any other required fields from ReminderNotificationDetails with sensible defaults
  action_type: 'log',
  measurement_type: 'value',
  primary_color: '#FFFFFF',
  secondary_color: '#000000',
  input_type: 'rating_1_5', // Example, adjust based on what you want to test
  min_value: 1,
  max_value: 5,
  text_options: null,
  currentValue: null, // for pending status
  loggedValueUnit: null, // for pending status
};

describe('ReminderNotificationCard', () => {
  const mockOnLogMeasurement = vi.fn();
  const mockOnSetStatus = vi.fn();
  const mockOnUndo = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render pending notification content correctly', () => {
    render(
      <ReminderNotificationCard
        reminder={mockNotification}
        onLogMeasurement={mockOnLogMeasurement}
        onSetNotificationStatus={mockOnSetStatus}
        onUndoNotification={mockOnUndo}
        currentUserId="test-user-id"
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

  // Add more tests for:
  // - Rendering 'completed' status
  // - Rendering 'skipped' status
  // - Interaction with "Log" button (e.g., rating button click)
  // - Interaction with "Skip" button
  // - Interaction with "Undo" button (for completed/skipped items)
  // - Different input_types (slider, quick_log, boolean_check, etc.)
}); 