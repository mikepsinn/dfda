import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterAll, beforeAll } from 'vitest';
import '@testing-library/jest-dom';

import { ReminderNotificationCard } from '@/components/reminders/reminder-notification-card';
import type { ReminderNotificationDetails, VariableCategoryId } from '@/lib/database.types.custom';
import { VARIABLE_CATEGORY_IDS } from '@/lib/constants/variable-categories';
import { UNIT_IDS } from '@/lib/constants/units';
import { createMeasurementAndCompleteNotificationAction } from '@/lib/actions/reminder-notifications';

// Using createClient from supabase-js directly for test client
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { Database, Tables } from '@/lib/database.types'; // Import Database type

// Mock user for the test session
const mockTestUser: User = {
  id: 'test-integration-user-id',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { name: 'Integration Test User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'integration@test.com',
  phone: '',
  email_confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  role: 'authenticated',
  updated_at: new Date().toISOString(),
  identities: [], 
};

// Mock the Supabase SSR clients used by the server action
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-integration-user-id' } }, error: null }),
    },
    from: vi.fn().mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }), // Default mock for .single()
      // Add other methods if chained and needed
    })),
    // Add other Supabase client methods if needed by the action
  }),
}));


describe('Integration: ReminderNotificationCard - Database Logging', () => {
  let supabaseTestClient: SupabaseClient<Database>;
  let testUserVariableId: string | null = null;

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'; // Common default local anon key

  // Base mock notification for these tests
  const baseMockNotification: ReminderNotificationDetails = {
    notificationId: 'notif-int-test-rating',
    scheduleId: 'sched-int-test-rating',
    userVariableId: '', // Will be set dynamically in tests after user_variable creation
    globalVariableId: 'gv-mood', 
    dueAt: new Date().toISOString(),
    variableName: 'Mood Rating (Integration)',
    variableCategory: VARIABLE_CATEGORY_IDS.MENTAL_AND_EMOTIONAL_STATE as VariableCategoryId,
    unitId: UNIT_IDS.ONE_TO_FIVE_SCALE,
    unitName: 'rating',
    title: 'Rate your mood',
    message: 'Please log your current mood.',
    status: 'pending',
    defaultValue: 3,
    emoji: '😊',
    value: null,
    isEditable: true,
  };

  beforeAll(async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase URL or Anon Key is missing. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set for integration tests, or adjust hardcoded defaults.');
    }
    supabaseTestClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // For actions that require a user_variable, create one here
    // This ensures the action can find it via findUserVariableId or create it idempotently
    const { data: userVariable, error: uvError } = await supabaseTestClient
      .from('user_variables')
      .upsert({
        user_id: mockTestUser.id,
        global_variable_id: baseMockNotification.globalVariableId,
        // Add other required fields or ensure they have defaults in DB schema
      })
      .select('id')
      .single();

    if (uvError || !userVariable) {
      console.error('Failed to create/upsert user_variable for testing:', uvError);
      throw new Error('Test setup failed: Could not create/upsert user_variable.');
    }
    testUserVariableId = userVariable.id;
  });

  afterAll(async () => {
    // Clean up: delete the created user_variable if it was specifically created for the test run
    // and not part of a shared seed. Consider if this cleanup is always desired.
    if (testUserVariableId) {
      // await supabaseTestClient.from('user_variables').delete().match({ id: testUserVariableId });
      // Decide on cleanup strategy for user_variables if tests create them directly.
    }
  });

  beforeEach(async () => {
    if (!testUserVariableId) throw new Error('testUserVariableId not set in beforeAll');
    // Clean measurements and notification status before each test for this specific notification
    await supabaseTestClient.from('measurements').delete().match({ user_variable_id: testUserVariableId });
    await supabaseTestClient.from('reminder_notifications').delete().match({ id: baseMockNotification.notificationId });
    
    const { error: notifError } = await supabaseTestClient.from('reminder_notifications').insert({
        id: baseMockNotification.notificationId,
        user_id: mockTestUser.id,
        reminder_schedule_id: baseMockNotification.scheduleId,
        user_variable_id: testUserVariableId, 
        notification_trigger_at: baseMockNotification.dueAt,
        status: 'pending',
    });
    if (notifError) {
        console.error('Failed to insert test notification:', notifError);
        throw new Error('Test setup failed: Could not insert notification.');
    }
  });

  it('should log a measurement to the database when a rating button is clicked', async () => {
    const user = userEvent.setup();
    // Important: Assign the dynamically created testUserVariableId to the notification being tested
    const notificationToTest = { ...baseMockNotification, userVariableId: testUserVariableId! };
    const loggedValue = 5;

    const handleLogMeasurement = async (notification: ReminderNotificationDetails, value: number) => {
      const globalId: string = notification.globalVariableId as string; // Use type assertion
      const result = await createMeasurementAndCompleteNotificationAction({
        userId: mockTestUser.id,
        globalVariableId: globalId,
        value: value,
        unitId: notification.unitId,
        notificationId: notification.notificationId,
        scheduleId: notification.scheduleId, 
      });
      if (result?.error) {
        throw new Error(result.error);
      }
    };

    render(
      <ReminderNotificationCard
        reminderNotification={notificationToTest}
        userTimezone="America/New_York"
        onLogMeasurement={handleLogMeasurement}
        onSkip={vi.fn()}
        onUndoLog={vi.fn()}
        onEditReminderSettings={vi.fn()}
        onNavigateToVariableSettings={vi.fn()}
      />
    );

    const ratingButton = screen.getByRole('button', { name: `Rate ${loggedValue}` });
    await user.click(ratingButton);

    await waitFor(async () => {
      const { data: measurements, error } = await supabaseTestClient
        .from('measurements')
        .select('*')
        .eq('user_variable_id', testUserVariableId!)
        .eq('value', loggedValue)
        .single();

      expect(error).toBeNull();
      expect(measurements).not.toBeNull();
      if (measurements) {
        expect(measurements.value).toBe(loggedValue);
        expect(measurements.unit_id).toBe(notificationToTest.unitId);
        expect(measurements.user_id).toBe(mockTestUser.id);
      }
    }, { timeout: 5000 });

    await waitFor(async () => {
        const { data: notification, error: notifError } = await supabaseTestClient
            .from('reminder_notifications')
            .select('status')
            .eq('id', notificationToTest.notificationId)
            .single();
        expect(notifError).toBeNull();
        expect(notification?.status).toBe('completed');
    }, { timeout: 5000 });
  });
}); 