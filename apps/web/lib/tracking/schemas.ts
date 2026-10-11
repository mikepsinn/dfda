import { z } from 'zod/v4'

/**
 * Inputs of the personal tracking operations. The MCP tools, the REST API and
 * its OpenAPI document all use these schemas, so the three cannot drift apart.
 * They use Zod 4 (the `zod/v4` entry of the installed zod), which converts to
 * JSON Schema for the MCP tool list and the OpenAPI document.
 */

const isoDateTime = z.iso.datetime({ offset: true })
const id = z.string().min(1).max(200)
const uuid = z.uuid()

const variableRef = {
  globalVariableId: id.optional().describe('Variable id, from searchVariables.'),
  variableName: z.string().min(1).max(200).optional()
    .describe('Variable name or synonym, matched case-insensitively. Use globalVariableId when you have it.'),
}

const unitRef = {
  unitId: id.optional().describe('Unit id, for example milligram.'),
  unitAbbreviation: z.string().min(1).max(50).optional()
    .describe('Unit abbreviation, for example mg or 0-10. Without a unit, your preferred unit or the variable default is used.'),
}

const limit = (max: number, fallback: number) =>
  z.number().int().min(1).max(max).optional().describe(`Page size. Default ${fallback}, maximum ${max}.`)

export const searchVariablesInput = z.object({
  query: z.string().min(1).max(200).describe('Part of a variable name or synonym, for example "headache" or "vitamin d".'),
  limit: limit(50, 20),
})

export const getVariableInput = z.object({
  globalVariableId: id.describe('Variable id, from searchVariables.'),
})

export const listMeasurementsInput = z.object({
  ...variableRef,
  startTimeAfter: isoDateTime.optional().describe('Only measurements at or after this time.'),
  startTimeBefore: isoDateTime.optional().describe('Only measurements at or before this time.'),
  limit: limit(200, 50),
  cursor: z.string().max(500).optional().describe('nextCursor from the previous page, with the same filters.'),
})

export const recordMeasurementInput = z.object({
  ...variableRef,
  value: z.number().describe('The value in the given unit.'),
  ...unitRef,
  startTime: isoDateTime.optional().describe('When it happened. Default: now.'),
  note: z.string().max(2000).optional(),
})

export const updateMeasurementInput = z.object({
  measurementId: uuid,
  value: z.number().optional(),
  ...unitRef,
  startTime: isoDateTime.optional(),
  note: z.string().max(2000).nullable().optional().describe('A new note, or null to remove it.'),
})

export const measurementIdInput = z.object({ measurementId: uuid })

export const listRemindersInput = z.object({
  includeInactive: z.boolean().optional().describe('Also list paused reminders. Default false.'),
})

export const reminderIdInput = z.object({ trackingReminderId: uuid })

export const upsertReminderInput = z.object({
  trackingReminderId: uuid.optional().describe('Change this reminder. Omit to create a new one.'),
  ...variableRef,
  timeOfDay: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional()
    .describe('Local time of day in HH:mm, for example 08:00. Required for a new reminder.'),
  rrule: z.string().min(1).max(500).optional()
    .describe('Recurrence rule (RFC 5545), for example FREQ=DAILY or FREQ=WEEKLY;BYDAY=MO,TH. Default FREQ=DAILY.'),
  startDate: isoDateTime.optional().describe('First day of the reminder. Default: now.'),
  endDate: isoDateTime.nullable().optional().describe('Last day, or null for no end.'),
  isActive: z.boolean().optional().describe('False pauses the reminder. Default true.'),
  defaultValue: z.number().nullable().optional().describe('The value to record when an answer gives none.'),
})

const notificationStatus = z.enum(['pending', 'completed', 'skipped', 'error'])

export const listNotificationsInput = z.object({
  status: notificationStatus.optional().describe('Only notifications with this status.'),
  triggeredAfter: isoDateTime.optional(),
  triggeredBefore: isoDateTime.optional(),
  limit: limit(200, 50),
})

export const listDueRemindersInput = z.object({
  limit: limit(200, 50),
})

const answer = {
  action: z.enum(['track', 'skip'])
    .describe('track records a measurement and completes the notification; skip marks it skipped.'),
  value: z.number().optional().describe("The value to record. Default: the reminder's default value."),
  note: z.string().max(2000).optional(),
}

export const respondToNotificationInput = z.object({
  notificationId: uuid.describe('A pending notification, from listDueTrackingReminders.'),
  ...answer,
})

export const respondToNotificationsInput = z.object({
  notificationIds: z.array(uuid).min(1).max(200).optional()
    .describe('The pending notifications to answer. Default: every notification that is due now.'),
  ...answer,
})

export type SearchVariablesInput = z.infer<typeof searchVariablesInput>
export type ListMeasurementsInput = z.infer<typeof listMeasurementsInput>
export type RecordMeasurementInput = z.infer<typeof recordMeasurementInput>
export type UpdateMeasurementInput = z.infer<typeof updateMeasurementInput>
export type UpsertReminderInput = z.infer<typeof upsertReminderInput>
export type ListNotificationsInput = z.infer<typeof listNotificationsInput>
export type RespondToNotificationInput = z.infer<typeof respondToNotificationInput>
export type RespondToNotificationsInput = z.infer<typeof respondToNotificationsInput>
