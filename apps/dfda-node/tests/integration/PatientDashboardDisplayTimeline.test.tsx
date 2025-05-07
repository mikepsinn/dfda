// Integration test for PatientDashboardDisplay and UniversalTimeline notification rendering 
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom'; // For extended matchers
import userEvent from '@testing-library/user-event';

import PatientDashboardDisplay from '@/components/patient/PatientDashboardDisplay';
import type { User } from '@supabase/supabase-js';
import type { ReminderNotificationDetails, ReminderNotificationStatus, VariableCategoryId } from "@/lib/database.types.custom";
import { getPendingReminderNotificationsAction } from '@/lib/actions/reminder-notifications';
import type { UserVariableWithDetails } from '@/lib/actions/user-variables';
import type { Tables } from '@/lib/database.types';
import { UniversalTimeline } from "@/components/universal-timeline";
import { MeasurementCard, type MeasurementCardData } from "@/components/measurement-card";
import { VARIABLE_CATEGORY_IDS } from "@/lib/constants/variable-categories";

// Mock dependencies using Jest
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
    push: jest.fn(),
  }),
  // redirect: jest.fn(), // Add if PatientDashboardDisplay can call redirect
}));

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock actions from reminder-notifications
jest.mock('@/lib/actions/reminder-notifications', () => ({
  // getPendingReminderNotificationsAction: jest.fn(), // Already mocked if needed elsewhere, or add if not
  logMeasurementFromNotificationAction: jest.fn(),
  setNotificationStatusAction: jest.fn(),
}));

// Mock child components to isolate testing to PatientDashboardDisplay and UniversalTimeline's rendering logic
jest.mock('@/components/patient/TrackingInbox', () => ({
  __esModule: true, // This is important for ES6 modules
  TrackingInbox: () => <div data-testid="mock-tracking-inbox">Tracking Inbox</div>,
}));
jest.mock('@/components/shared/ImageAnalysisCapture', () => ({
  __esModule: true,
  ImageAnalysisCapture: () => <div data-testid="mock-image-analysis">Image Analysis</div>,
}));
jest.mock('@/components/patient/MeasurementAddDialog', () => ({
  __esModule: true,
  MeasurementAddDialog: () => <div data-testid="mock-measurement-add-dialog">Add Dialog</div>,
}));

const mockUser: User = {
  id: 'test-user-id',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { name: 'Test User', profileData: { timezone: 'America/New_York' } }, // Adjusted based on potential structure
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'test@example.com',
  phone: '',
  email_confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  role: 'authenticated',
  updated_at: new Date().toISOString(),
  // Fill in any other mandatory User fields if TS complains
  identities: [], 
};

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

// Define a more complete interface for our mock notifications for testing purposes
interface MockNotificationTestData extends Partial<ReminderNotificationDetails> {
  notificationId: string; // Already in ReminderNotificationDetails, but good for overrides
  dueAt: string;          // Already in ReminderNotificationDetails
  variableName: string;   // Already in ReminderNotificationDetails
  scheduleId: string;     // Already in ReminderNotificationDetails
  userVariableId: string; // Now required in ReminderNotificationDetails
  globalVariableId: string; // Now required in ReminderNotificationDetails
  variableCategory: VariableCategoryId; // Already in ReminderNotificationDetails
  unitId: string;         // Already in ReminderNotificationDetails
  unitName: string;       // Already in ReminderNotificationDetails
  status?: ReminderNotificationStatus; // Already in ReminderNotificationDetails
  // title?: string | null; // In ReminderNotificationDetails
  // message?: string | null; // In ReminderNotificationDetails
  // defaultValue?: number | null; // In ReminderNotificationDetails
  // emoji?: string | null; // In ReminderNotificationDetails
  // value?: number | null; // In ReminderNotificationDetails (for completed items)
  // isEditable?: boolean | null; // In ReminderNotificationDetails
}

// Helper to create a mock ReminderNotificationDetails
const createMockNotification = (overrides: Partial<ReminderNotificationDetails & {notificationId: string}>): ReminderNotificationDetails => {
  const base: ReminderNotificationDetails = {
    notificationId: overrides.notificationId || 'default-notif-id',
    scheduleId: 'default-schedule-id',
    userVariableId: 'default-uv-id',     // Provide default
    globalVariableId: 'default-gv-id', // Provide default
    dueAt: today.toISOString(),
    variableName: 'Default Variable',
    variableCategory: 'cat-test' as VariableCategoryId, // Cast for test purposes
    unitId: 'unit-test',
    unitName: 'test unit',
    title: 'Test Title',
    message: 'Test message',
    status: 'pending', // Default status
    defaultValue: null,
    emoji: null,
    value: null, // For completed items
    isEditable: true, // Default for testing
  };
  return { ...base, ...overrides };
};


const mockPendingNotifications: ReminderNotificationDetails[] = [
  // #1 Should be displayed
  createMockNotification({
    notificationId: 'notif-1-today-valid',
    scheduleId: 'sched-1-valid',
    userVariableId: 'uv-mood-log',
    globalVariableId: 'gv-mood-log',
    dueAt: today.toISOString(),
    variableName: 'Daily Mood Log',
    variableCategory: VARIABLE_CATEGORY_IDS.MENTAL_AND_EMOTIONAL_STATE as VariableCategoryId,
    unitId: 'unit-rating-1-5',
    unitName: 'rating',
    emoji: '😊',
    defaultValue: 3,
    status: 'pending',
  }),
  // #2 Should be filtered out (wrong date - tomorrow)
  createMockNotification({
    notificationId: 'notif-2-tomorrow',
    scheduleId: 'sched-2',
    userVariableId: 'uv-future',
    globalVariableId: 'gv-future',
    dueAt: tomorrow.toISOString(),
    variableName: 'Future Task',
    status: 'pending',
  }),
  // #3 Should be filtered out (wrong date - yesterday)
  createMockNotification({
    notificationId: 'notif-3-yesterday',
    scheduleId: 'sched-3',
    userVariableId: 'uv-past',
    globalVariableId: 'gv-past',
    dueAt: yesterday.toISOString(),
    variableName: 'Past Due Task',
    status: 'pending',
  }),
  // #4 Test case for an item that *should* be a notification but has a missing/invalid scheduleId (will be filtered by UniversalTimeline's mapping)
  createMockNotification({
    notificationId: 'notif-4-invalid-scheduleId',
    scheduleId: undefined as any, // Explicitly invalid for testing filter
    userVariableId: 'uv-invalid-sched',
    globalVariableId: 'gv-invalid-sched',
    dueAt: today.toISOString(),
    variableName: 'Task Invalid ScheduleId',
    status: 'pending',
  }),
  // #5 Should be filtered out (invalid status that doesn't default to 'pending' correctly if not a valid enum)
  // UniversalTimeline mapping will default to 'pending' if item.status is falsy, but not if it's an invalid string.
  // For testing this, we'll use a valid status that is not 'pending' or 'completed' for initial display, e.g. 'skipped'.
  createMockNotification({
    notificationId: 'notif-5-skipped-status',
    scheduleId: 'sched-5',
    userVariableId: 'uv-skipped',
    globalVariableId: 'gv-skipped',
    dueAt: today.toISOString(),
    variableName: 'Task with Skipped Status',
    status: 'skipped',
  }),
  // #6 Should be displayed (completed status, still on today)
  createMockNotification({
    notificationId: 'notif-6-today-completed',
    scheduleId: 'sched-6-valid',
    userVariableId: 'uv-completed-mood',
    globalVariableId: 'gv-completed-mood',
    dueAt: today.toISOString(),
    variableName: 'Completed Mood Log',
    variableCategory: VARIABLE_CATEGORY_IDS.MENTAL_AND_EMOTIONAL_STATE as VariableCategoryId,
    unitId: 'unit-rating-1-5',
    unitName: 'rating',
    status: 'completed',
    value: 4, // Logged value
    emoji: '👍',
  }),
];

const mockInitialMeasurements: MeasurementCardData[] = [
  {
    id: "meas1",
    globalVariableId: "gvar1",
    userVariableId: "uvar1",
    variableCategoryId: VARIABLE_CATEGORY_IDS.HEALTH_AND_PHYSIOLOGY as VariableCategoryId,
    name: "Heart Rate",
    start_at: "2023-10-26T10:00:00.000Z",
    value: 75,
    unit: "bpm",
    unitId: "unit-bpm",
    unitName: "bpm",
    emoji: "❤️",
    isEditable: true,
  },
  {
    id: "meas2",
    globalVariableId: "gvar2",
    userVariableId: "uvar2",
    variableCategoryId: VARIABLE_CATEGORY_IDS.INTAKE_AND_INTERVENTIONS as VariableCategoryId,
    name: "Vitamin D",
    start_at: "2023-10-26T12:00:00.000Z",
    value: 1,
    unit: "capsule",
    unitId: "unit-capsule",
    unitName: "capsule",
    emoji: "💊",
    isEditable: false,
  },
];
const mockInitialUserVariables: UserVariableWithDetails[] = [];
// Ensure mockInitialConditions aligns with Tables<'patient_conditions_view'>
const mockInitialConditions: Array<Tables<'patient_conditions_view'>> = [
    { 
        condition_id: 'cond-1', 
        condition_name: 'Test Condition 1',
        // Add all other non-optional fields from PatientConditionRow or cast to `any` if too complex for this test's focus
        description: null, diagnosed_at: null, emoji: null, icd_code: null, id: 'pcv-1', measurement_count: 0, notes: null, patient_id: mockUser.id, severity: null, status: null, user_variable_id: null
    }
];

const mockInitialPendingNotifications: ReminderNotificationDetails[] = [
  // ... existing mock data ...
];

// This mock should be ReminderNotificationDetails[]
const mockInitialTimelineNotifications: ReminderNotificationDetails[] = mockPendingNotifications; // Use the same data for simplicity in this test.
                                                                                                // PatientDashboardDisplay expects ReminderNotificationDetails[]

describe('PatientDashboardDisplay - UniversalTimeline Notification Rendering', () => {
  // Set the current date for UniversalTimeline to "today" for consistent filtering
  // UniversalTimeline defaults to `new Date()` for its `selectedDate` if `date` prop isn't passed.
  // PatientDashboardDisplay passes `new Date()` as the date prop to UniversalTimeline.
  // To make tests deterministic, we can mock `new Date()` or ensure our `dueAt` fields align.
  // For this test, `today.toISOString()` aligns with the default.

  it('should display notifications and measurements correctly based on date and properties', () => {
    render(
      <PatientDashboardDisplay
        initialUser={mockUser}
        initialPendingNotifications={[]} // Assuming these are handled by TrackingInbox, keep timeline focused
        initialMeasurements={mockInitialMeasurements}
        initialTimelineNotifications={mockInitialTimelineNotifications} // This is ReminderNotificationDetails[]
        initialUserVariables={mockInitialUserVariables}
        initialConditions={mockInitialConditions}
        initialDateForTimeline={today.toISOString()}
      />
    );

    const timelineSection = screen.getByRole('heading', { name: /Daily Timeline/i }).closest('section');
    expect(timelineSection).toBeInTheDocument();
    if (!timelineSection) return; // Guard for TypeScript

    // --- Check for Expected Notifications ---
    // #1 (Daily Mood Log - pending, today)
    const moodLogCardTextElement = within(timelineSection).getByText((content, element) => {
      return element?.textContent?.includes('Daily Mood Log') === true;
    });
    expect(moodLogCardTextElement).toBeInTheDocument();
    
    // Find the closest ancestor that represents the card for scoping the button search
    const moodLogCard = moodLogCardTextElement.closest('[class*="bg-card"]'); // Use a more flexible selector for the card background

    expect(moodLogCard).toBeInTheDocument();
    if (moodLogCard && moodLogCard instanceof HTMLElement) {
        // Check for a detail specific to pending cards - e.g., presence of Log button or default value display
        // ReminderNotificationCard shows default value for pending: `${reminder.defaultValue} ${reminder.unitName || ''}`
        // For notif-1, defaultValue is 3, unitName is 'rating'
        expect(within(moodLogCard).getByText(/3 rating/i)).toBeInTheDocument();
        // It should not show "Logged:" text
        expect(within(moodLogCard).queryByText(/Logged:/i)).not.toBeInTheDocument();
    }
    
    // #6 (Completed Mood Log - completed, today)
    const completedMoodLogCardTextElement = within(timelineSection).queryByText((content, element) => {
        return element?.textContent?.includes('Completed Mood Log') === true;
    });
    expect(completedMoodLogCardTextElement).toBeInTheDocument();
    const completedMoodLogCard = completedMoodLogCardTextElement?.closest('[class*="bg-card"]');

    expect(completedMoodLogCard).toBeInTheDocument();
    if (completedMoodLogCard && completedMoodLogCard instanceof HTMLElement) {
       // ReminderNotificationCard shows: `${reminder.currentValue} ${reminder.loggedValueUnit || reminder.unitName || ''}`
       // For notif-6, value is 4 (maps to currentValue), unitName is 'rating' (maps to loggedValueUnit)
       // And it prepends "Logged: " via renderStatusIconAndText
       expect(within(completedMoodLogCard).getByText(/Logged: 4 rating/i)).toBeInTheDocument();
    }

    // --- Check for Filtered Out Notifications ---
    expect(within(timelineSection).queryByText(/Future Task/i)).not.toBeInTheDocument(); // #2
    expect(within(timelineSection).queryByText(/Past Due Task/i)).not.toBeInTheDocument(); // #3
    
    // #4 (Task Invalid ScheduleId) should be filtered out by the mapping logic in UniversalTimeline
    // because scheduleId is required for ReminderNotificationCardData.
    expect(within(timelineSection).queryByText(/Task Invalid ScheduleId/i)).not.toBeInTheDocument(); 
    
    // #5 (Task with Skipped Status) - should be displayed but with "Skipped" text
    const skippedTaskCard = within(timelineSection).queryByText((content, element) => {
        return element?.textContent?.includes('Task with Skipped Status') === true;
    });
    expect(skippedTaskCard).toBeInTheDocument();
    if (skippedTaskCard) {
        expect(within(skippedTaskCard).getByText(/Skipped/i)).toBeInTheDocument();
    }


    // --- Check for Measurement ---
    expect(within(timelineSection).queryByText(/Heart Rate/i)).toBeInTheDocument();
    expect(within(timelineSection).queryByText(/Vitamin D/i)).toBeInTheDocument();
  });

  it('should allow logging a measurement for a pending notification via ReminderNotificationCard', async () => {
    const mockLogAction = jest.requireMock('@/lib/actions/reminder-notifications').logMeasurementFromNotificationAction;
    const mockToast = jest.fn();
    const mockRouterRefresh = jest.fn();

    jest.mocked(jest.requireMock('@/components/ui/use-toast').useToast).mockReturnValue({ toast: mockToast });
    jest.mocked(jest.requireMock('next/navigation').useRouter).mockReturnValue({
        refresh: mockRouterRefresh,
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        prefetch: jest.fn(),
        pathname: '/',
        query: {},
        asPath: '/',
        events: {
            on: jest.fn(),
            off: jest.fn(),
            emit: jest.fn(),
        }
    });

    mockLogAction.mockResolvedValue({ success: true }); // Simulate successful action

    // Find the specific pending notification to interact with
    const dailyMoodLogNotification = mockInitialTimelineNotifications.find(n => n.notificationId === 'notif-1-today-valid');
    expect(dailyMoodLogNotification).toBeDefined();
    if (!dailyMoodLogNotification) return;

    render(
      <PatientDashboardDisplay
        initialUser={mockUser}
        initialPendingNotifications={[]} 
        initialMeasurements={mockInitialMeasurements}
        initialTimelineNotifications={mockInitialTimelineNotifications} 
        initialUserVariables={mockInitialUserVariables}
        initialConditions={mockInitialConditions}
        initialDateForTimeline={today.toISOString()}
      />
    );

    const timelineSection = screen.getByRole('heading', { name: /Daily Timeline/i }).closest('section');
    expect(timelineSection).toBeInTheDocument();
    if (!timelineSection) return;

    const moodLogCardTextElementForInteraction = within(timelineSection).getByText((content, element) => {
      return element?.textContent?.includes('Daily Mood Log') === true;
    });
    expect(moodLogCardTextElementForInteraction).toBeInTheDocument();
    
    const moodLogCardForInteraction = moodLogCardTextElementForInteraction.closest('[class*="bg-card"]');

    expect(moodLogCardForInteraction).toBeInTheDocument();
    expect(moodLogCardForInteraction).toBeInstanceOf(HTMLElement);
    if (!moodLogCardForInteraction || !(moodLogCardForInteraction instanceof HTMLElement)) return; // Guard and type check

    // "Daily Mood Log" is a rating_1_5 type. Buttons are labeled "Rate X" or just "X"
    // For notif-1 (Daily Mood Log), unitId is 'unit-rating-1-5', which results in rating_1_5 inputType
    // ReminderNotificationCard creates buttons with aria-label="Rate X" or just X as text
    // Let's try to click the button for rating "5"
    // The rating buttons are rendered with text content of the rating number if no specific face is used for that number.
    // For a 1-5 scale, the button for "5" will have text "5" or a specific Smile icon.
    // Based on ReminderNotificationCard: for rating_1_5, it renders <Smile className="h-5 w-5 text-green-500" /> for 5.
    // It will have an aria-label of "Rate 5".

    const ratingButton5 = within(moodLogCardForInteraction).getByRole('button', { name: /rate 5/i });
    expect(ratingButton5).toBeInTheDocument();

    await userEvent.click(ratingButton5);

    // Check if the action was called correctly
    expect(mockLogAction).toHaveBeenCalledTimes(1);
    expect(mockLogAction).toHaveBeenCalledWith({
      notificationId: dailyMoodLogNotification.notificationId,
      scheduleId: dailyMoodLogNotification.scheduleId,
      userId: mockUser.id,
      value: 5, // The value we clicked
      unitId: dailyMoodLogNotification.unitId,
    });

    // Check for router refresh and toast
    expect(mockRouterRefresh).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Logged',
      description: `${dailyMoodLogNotification.variableName} recorded as 5.`,
      variant: 'default',
    });
  });
}); 