import type { z } from 'zod/v4'
import { withUserTransaction } from '@/lib/db'
import { TRACKING_READ_SCOPE, TRACKING_WRITE_SCOPE, type TrackingScope } from '@/lib/oauth-resources'
import { refreshDueNotifications } from '@/lib/reminders/due'
import { deleteMeasurement, listMeasurements, recordMeasurement, updateMeasurement } from './measurements'
import { listDueNotifications, listNotifications, respondToNotification, respondToNotifications } from './notifications'
import { afterReminderSaved, deleteReminder, getReminder, listReminders, upsertReminder } from './reminders'
import * as schemas from './schemas'
import { getVariable, searchVariables, type TrackingDb } from './variables'

/**
 * The personal tracking operations. Each one is an MCP tool (app/api/mcp) and
 * a REST endpoint (app/api/v1), with one input schema and one implementation.
 * Every operation acts on the signed-in user's own data only, in one
 * transaction with row-level security as that user: it succeeds or fails as a
 * whole.
 */
export type TrackingOperation<Input extends z.ZodObject = z.ZodObject> = {
  name: string
  title: string
  description: string
  scope: TrackingScope
  /** True when the operation removes data. */
  destructive?: boolean
  input: Input
  run: (userId: string, input: z.infer<Input>) => Promise<unknown>
}

function operation<Input extends z.ZodObject>(definition: TrackingOperation<Input>) {
  return definition
}

function inTransaction<T>(userId: string, fn: (tx: TrackingDb) => Promise<T>): Promise<T> {
  return withUserTransaction({ id: userId }, fn)
}

/** Like inTransaction, after it creates the user's due notifications (lib/reminders/due.ts): the worker may not run. */
async function withDueNotifications<T>(userId: string, fn: (tx: TrackingDb) => Promise<T>): Promise<T> {
  await refreshDueNotifications(userId)
  return inTransaction(userId, fn)
}

export const trackingOperations = {
  searchVariables: operation({
    name: 'searchVariables',
    title: 'Search variables',
    description:
      'Find the variables that can be tracked (symptoms, treatments, foods, moods, vital signs and more) by name or synonym. Returns each variable id and its default unit.',
    scope: TRACKING_READ_SCOPE,
    input: schemas.searchVariablesInput,
    run: (userId, input) => inTransaction(userId, (tx) => searchVariables(tx, input)),
  }),
  getVariable: operation({
    name: 'getVariable',
    title: 'Get a variable',
    description: 'Get one variable by id, with its category and default unit.',
    scope: TRACKING_READ_SCOPE,
    input: schemas.getVariableInput,
    run: (userId, input) => inTransaction(userId, (tx) => getVariable(tx, input.globalVariableId)),
  }),
  listMeasurements: operation({
    name: 'listMeasurements',
    title: 'List measurements',
    description:
      'List your recorded measurements, newest first. Filter by variable and time. When nextCursor is not null, call again with it and the same filters for the next page.',
    scope: TRACKING_READ_SCOPE,
    input: schemas.listMeasurementsInput,
    run: (userId, input) => inTransaction(userId, (tx) => listMeasurements(tx, userId, input)),
  }),
  recordMeasurement: operation({
    name: 'recordMeasurement',
    title: 'Record a measurement',
    description:
      'Record a measurement, for example a symptom rating, a dose or a food. To answer a reminder, use respondToTrackingReminder instead, which also completes the notification.',
    scope: TRACKING_WRITE_SCOPE,
    input: schemas.recordMeasurementInput,
    run: async (userId, input) => ({ measurement: await inTransaction(userId, (tx) => recordMeasurement(tx, userId, input)) }),
  }),
  updateMeasurement: operation({
    name: 'updateMeasurement',
    title: 'Correct a measurement',
    description: 'Change the value, unit, time or note of one of your measurements. Get the id from listMeasurements.',
    scope: TRACKING_WRITE_SCOPE,
    input: schemas.updateMeasurementInput,
    run: async (userId, input) => ({ measurement: await inTransaction(userId, (tx) => updateMeasurement(tx, userId, input)) }),
  }),
  deleteMeasurement: operation({
    name: 'deleteMeasurement',
    title: 'Delete a measurement',
    description: 'Delete one of your measurements. Get the id from listMeasurements.',
    scope: TRACKING_WRITE_SCOPE,
    destructive: true,
    input: schemas.measurementIdInput,
    run: async (userId, input) => ({
      measurement: await inTransaction(userId, (tx) => deleteMeasurement(tx, userId, input.measurementId)),
    }),
  }),
  listTrackingReminders: operation({
    name: 'listTrackingReminders',
    title: 'List reminders',
    description: 'List your tracking reminders: what to record, when, and how often.',
    scope: TRACKING_READ_SCOPE,
    input: schemas.listRemindersInput,
    run: (userId, input) => inTransaction(userId, (tx) => listReminders(tx, userId, input)),
  }),
  getTrackingReminder: operation({
    name: 'getTrackingReminder',
    title: 'Get a reminder',
    description: 'Get one of your tracking reminders by id.',
    scope: TRACKING_READ_SCOPE,
    input: schemas.reminderIdInput,
    run: async (userId, input) => ({ reminder: await inTransaction(userId, (tx) => getReminder(tx, userId, input.trackingReminderId)) }),
  }),
  upsertTrackingReminder: operation({
    name: 'upsertTrackingReminder',
    title: 'Create or change a reminder',
    description:
      'Create a tracking reminder for a variable at a local time of day, daily by default. To change a reminder, give trackingReminderId and only the fields to change. Times use the time zone in your profile.',
    scope: TRACKING_WRITE_SCOPE,
    input: schemas.upsertReminderInput,
    run: async (userId, input) => {
      const result = await inTransaction(userId, (tx) => upsertReminder(tx, userId, input))
      await afterReminderSaved(userId, result.reminder, result.created)
      return result
    },
  }),
  deleteTrackingReminder: operation({
    name: 'deleteTrackingReminder',
    title: 'Delete a reminder',
    description: 'Delete one of your tracking reminders and its notifications. Recorded measurements stay.',
    scope: TRACKING_WRITE_SCOPE,
    destructive: true,
    input: schemas.reminderIdInput,
    run: (userId, input) => inTransaction(userId, (tx) => deleteReminder(tx, userId, input.trackingReminderId)),
  }),
  listTrackingReminderNotifications: operation({
    name: 'listTrackingReminderNotifications',
    title: 'List reminder notifications',
    description: 'List the notifications of your reminders, newest first, with their status and answers.',
    scope: TRACKING_READ_SCOPE,
    input: schemas.listNotificationsInput,
    run: (userId, input) => withDueNotifications(userId, (tx) => listNotifications(tx, userId, input)),
  }),
  listDueTrackingReminders: operation({
    name: 'listDueTrackingReminders',
    title: 'List due reminders',
    description: 'List the reminder notifications that are due now and not answered yet, oldest first.',
    scope: TRACKING_READ_SCOPE,
    input: schemas.listDueRemindersInput,
    run: (userId, input) => withDueNotifications(userId, (tx) => listDueNotifications(tx, userId, input)),
  }),
  respondToTrackingReminder: operation({
    name: 'respondToTrackingReminder',
    title: 'Answer a reminder',
    description:
      "Answer one due notification. track records the value (or the reminder's default value) as a measurement; skip records nothing.",
    scope: TRACKING_WRITE_SCOPE,
    input: schemas.respondToNotificationInput,
    run: (userId, input) => inTransaction(userId, (tx) => respondToNotification(tx, userId, input)),
  }),
  respondToTrackingReminderNotifications: operation({
    name: 'respondToTrackingReminderNotifications',
    title: 'Answer several reminders',
    description:
      'Answer several notifications the same way, by default all that are due now. Either all are answered or none.',
    scope: TRACKING_WRITE_SCOPE,
    input: schemas.respondToNotificationsInput,
    run: (userId, input) => withDueNotifications(userId, (tx) => respondToNotifications(tx, userId, input)),
  }),
} satisfies Record<string, TrackingOperation>

export type TrackingOperationName = keyof typeof trackingOperations
