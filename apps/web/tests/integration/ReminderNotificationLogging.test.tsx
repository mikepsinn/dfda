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

import type { User } from '@supabase/supabase-js';
import { adminDb } from '@/lib/db';

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

// The server action reads the database as the session user; run it as the test user
vi.mock('@/lib/db/server', async () => {
  const { dbAs } = await vi.importActual<typeof import('@/lib/db')>('@/lib/db');
  return {
    getUserDb: vi.fn(async () => dbAs({ id: 'test-integration-user-id' })),
  };
});


describe('Integration: ReminderNotificationCard - Database Logging', () => {
  let testUserVariableId: string | null = null;

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
    // For actions that require a user_variable, create one here
    // This ensures the action can find it via findUserVariableId or create it idempotently
    const userVariable = await adminDb.user_variables.upsert({
      where: {
        user_id_global_variable_id: {
          user_id: mockTestUser.id,
          global_variable_id: baseMockNotification.globalVariableId,
        },
      },
      create: {
        user_id: mockTestUser.id,
        global_variable_id: baseMockNotification.globalVariableId,
      },
      update: {},
      select: { id: true },
    });
    testUserVariableId = userVariable.id;
  });

  afterAll(async () => {
    // Clean up: delete the created user_variable if it was specifically created for the test run
    // and not part of a shared seed. Consider if this cleanup is always desired.
    if (testUserVariableId) {
      // await adminDb.user_variables.delete({ where: { id: testUserVariableId } });
      // Decide on cleanup strategy for user_variables if tests create them directly.
    }
  });

  beforeEach(async () => {
    if (!testUserVariableId) throw new Error('testUserVariableId not set in beforeAll');
    // Clean measurements and notification status before each test for this specific notification
    await adminDb.measurements.deleteMany({ where: { user_variable_id: testUserVariableId } });
    await adminDb.reminder_notifications.deleteMany({ where: { id: baseMockNotification.notificationId } });
    
    await adminDb.reminder_notifications.create({
      data: {
        id: baseMockNotification.notificationId,
        user_id: mockTestUser.id,
        reminder_schedule_id: baseMockNotification.scheduleId,
        notification_trigger_at: new Date(baseMockNotification.dueAt),
        status: 'pending',
      },
    });
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
      const measurements = await adminDb.measurements.findMany({
        where: { user_variable_id: testUserVariableId!, value: loggedValue },
      });

      expect(measurements).toHaveLength(1);
      const [measurement] = measurements;
      expect(measurement.value).toBe(loggedValue);
      expect(measurement.unit_id).toBe(notificationToTest.unitId);
      expect(measurement.user_id).toBe(mockTestUser.id);
    }, { timeout: 5000 });

    await waitFor(async () => {
        const notification = await adminDb.reminder_notifications.findUnique({
            where: { id: notificationToTest.notificationId },
            select: { status: true },
        });
        expect(notification).not.toBeNull();
        expect(notification?.status).toBe('completed');
    }, { timeout: 5000 });
  });
}); 