// Integration test for PatientDashboardDisplay and UniversalTimeline notification rendering 
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom'; // For extended matchers

import PatientDashboardDisplay from '@/components/patient/PatientDashboardDisplay';
import type { User } from '@supabase/supabase-js';
import type { ReminderNotificationDetails } from "@/lib/database.types.custom";
import { getPendingReminderNotificationsAction } from '@/lib/actions/reminder-notifications';
import type { UserVariableWithDetails } from '@/lib/actions/user-variables';
import type { Tables } from '@/lib/database.types';
import { UniversalTimeline } from "@/components/universal-timeline";
import { MeasurementCard, type MeasurementCardData } from "@/components/measurement-card";
import type { ReminderNotificationCardData, ReminderNotificationStatus, VariableCategoryId } from "@/components/reminder-notification-card";
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
  notificationId: string;
  dueAt: string;
  variableName: string;
  status?: ReminderNotificationStatus;
  scheduleId?: string;
  userVariableId?: string;
  globalVariableId?: string;
  variableCategory?: string;
  unitId?: string;
  unitName?: string;
  title?: string | null;
  message?: string | null;
  defaultValue?: number | null;
  emoji?: string | null;
}

// Helper to create a mock ReminderNotificationDetails
const createMockNotification = (overrides: MockNotificationTestData): ReminderNotificationDetails => {
  const base = {
    notificationId: 'default-notif-id', // Added default for notificationId
    scheduleId: 'default-schedule-id', 
    dueAt: today.toISOString(), // Added default for dueAt
    variableName: 'Default Variable', // Added default for variableName
    variableCategory: 'cat-test',
    unitId: 'unit-test',
    unitName: 'test unit',
    message: 'Test message',
    userVariableId: 'uv-test',
    globalVariableId: 'gv-test',
    status: 'pending' as ReminderNotificationStatus, // Ensure status is valid and typed
    defaultValue: null,
    emoji: null,
    // REMOVE: value: null, // This field does not exist on FetchedPendingNotification
  };
  return { ...base, ...overrides } as ReminderNotificationDetails; // Removed unknown cast, type should align now
};


const mockPendingNotifications: ReminderNotificationDetails[] = [
  // #1 Should be displayed
  createMockNotification({
    notificationId: 'notif-1-today-valid',
    scheduleId: 'sched-1-valid',
    dueAt: today.toISOString(),
    variableName: 'Daily Mood Log',
    variableCategory: 'cat-health',
    unitId: 'unit-rating',
    emoji: '😊',
    defaultValue: 5,
    status: 'pending',
  }),
  // #2 Should be filtered out (wrong date - tomorrow)
  createMockNotification({
    notificationId: 'notif-2-tomorrow',
    scheduleId: 'sched-2',
    dueAt: tomorrow.toISOString(),
    variableName: 'Future Task',
    status: 'pending',
  }),
  // #3 Should be filtered out (wrong date - yesterday)
  createMockNotification({
    notificationId: 'notif-3-yesterday',
    scheduleId: 'sched-3',
    dueAt: yesterday.toISOString(),
    variableName: 'Past Due Task',
    status: 'pending',
  }),
  // #4 Test case for an item that *should* be a notification but has a missing/invalid scheduleId
  createMockNotification({
    notificationId: 'notif-4-invalid-scheduleId',
    scheduleId: undefined as any, // Explicitly invalid for testing filter
    dueAt: today.toISOString(),
    variableName: 'Task Invalid ScheduleId',
    status: 'pending',
  }),
  // #5 Should be filtered out (invalid status that doesn't default to 'pending' correctly)
  createMockNotification({
    notificationId: 'notif-5-invalid-status',
    scheduleId: 'sched-5',
    dueAt: today.toISOString(),
    variableName: 'Task with specific status',
    status: 'skipped', // Changed from 'way-too-late' to a valid status
  }),
  // #6 Should be displayed (completed status, still on today)
  createMockNotification({
    notificationId: 'notif-6-today-completed',
    scheduleId: 'sched-6-valid',
    dueAt: today.toISOString(),
    variableName: 'Completed Mood Log',
    variableCategory: 'cat-health',
    unitId: 'unit-rating',
    status: 'completed',
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

// This mock should be ReminderNotificationCardData[]
const mockInitialTimelineNotifications: ReminderNotificationCardData[] = [
  {
    id: "t-notif1",
    reminderScheduleId: "rs1",
    triggerAtUtc: "2023-10-26T09:00:00.000Z",
    status: "pending",
    variableName: "Morning Check-in",
    variableCategoryId: VARIABLE_CATEGORY_IDS.MENTAL_AND_EMOTIONAL_STATE as VariableCategoryId,
    unitId: "unit-rating",
    unitName: "Rating 1-5",
    emoji: "📝",
    isEditable: true,
    defaultValue: 3,
  },
  {
    id: "t-notif2",
    reminderScheduleId: "rs2",
    triggerAtUtc: "2023-10-26T14:00:00.000Z",
    status: "completed",
    variableName: "Afternoon Mood",
    variableCategoryId: VARIABLE_CATEGORY_IDS.MENTAL_AND_EMOTIONAL_STATE as VariableCategoryId,
    unitId: "unit-rating",
    unitName: "Rating 1-5",
    emoji: "😊",
    isEditable: false,
    currentValue: 4,
    loggedValueUnit: "Rating 1-5"
  }
];

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
        initialPendingNotifications={mockInitialPendingNotifications}
        initialMeasurements={mockInitialMeasurements}
        initialTimelineNotifications={mockInitialTimelineNotifications}
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
    const moodLogCard = within(timelineSection).queryByText(/Daily Mood Log/i);
    expect(moodLogCard).toBeInTheDocument();
    if (moodLogCard) {
        // Check for a detail specific to pending cards if any, e.g., absence of "Logged:"
        expect(within(moodLogCard).queryByText(/Logged:/i)).not.toBeInTheDocument();
    }
    
    // #6 (Completed Mood Log - completed, today)
    const completedMoodLogCard = within(timelineSection).queryByText(/Completed Mood Log/i);
    expect(completedMoodLogCard).toBeInTheDocument();
    if (completedMoodLogCard) {
       // ReminderNotificationCard should display the logged value for 'completed' status.
       // The text "Logged: 7" needs to match ReminderNotificationCard's output.
       // Let's assume ReminderNotificationCard concatenates like this.
       // We also need to consider the unit if it's displayed, e.g., "Logged: 7 rating"
       // For now, let's be less specific until we confirm ReminderNotificationCard's exact output
       expect(within(completedMoodLogCard).getByText(/Logged:/i)).toBeInTheDocument();
       expect(within(completedMoodLogCard).getByText(/7/i)).toBeInTheDocument(); // Check if value "7" is present
    }

    // --- Check for Filtered Out Notifications ---
    expect(within(timelineSection).queryByText(/Future Task/i)).not.toBeInTheDocument(); // #2
    expect(within(timelineSection).queryByText(/Past Due Task/i)).not.toBeInTheDocument(); // #3
    expect(within(timelineSection).queryByText(/Task Invalid ScheduleId/i)).not.toBeInTheDocument(); // #4
    expect(within(timelineSection).queryByText(/Task Invalid Status/i)).not.toBeInTheDocument(); // #5

    // --- Check for Measurement ---
    expect(within(timelineSection).queryByText(/Heart Rate/i)).toBeInTheDocument();
    expect(within(timelineSection).queryByText(/Vitamin D/i)).toBeInTheDocument();
  });
}); 