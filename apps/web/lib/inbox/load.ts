import { withUserTransaction } from '@/lib/db'
import { refreshDueNotifications } from '@/lib/reminders/due'
import { zoneOf } from '@/lib/reminders/schedule'
import { dueNotificationsWhere } from '@/lib/tracking/notifications'
import { getVariableInputType, type VariableInputType } from '@/lib/variable-helpers'
import { inboxTitle, presetValues } from './view'

/** How many due notifications the inbox shows. QuantiModo showed the 20 most recent. */
const INBOX_LIMIT = 100
/** How many of a person's latest measurements give the recent-value buttons. */
const RECENT_MEASUREMENTS = 400

const unitSelect = { select: { id: true, abbreviated_name: true } } as const
const variableSelect = {
  select: {
    id: true,
    global_variable_id: true,
    is_favorite: true,
    units: unitSelect,
    global_variables: {
      select: {
        name: true,
        emoji: true,
        image_url: true,
        units: unitSelect,
        global_symptoms: { select: { id: true } },
      },
    },
  },
} as const

type Unit = { id: string; abbreviatedName: string }

/** What a card needs to record a value for one variable. */
export type InboxVariable = {
  userVariableId: string
  globalVariableId: string
  name: string
  emoji: string | null
  imageUrl: string | null
  unit: Unit
  inputType: VariableInputType
  /** True when a higher rating is worse (symptoms), so the faces run from happy to sad. */
  higherIsWorse: boolean
  isFavorite: boolean
  defaultValue: number | null
  presets: number[]
}

export type InboxItem = InboxVariable & {
  notificationId: string
  scheduleId: string
  title: string
  dueAt: string
}

export type Inbox = { timezone: string; items: InboxItem[]; favorites: InboxVariable[] }

type UserVariableRow = {
  id: string
  global_variable_id: string
  is_favorite: boolean
  units: { id: string; abbreviated_name: string } | null
  global_variables: {
    name: string
    emoji: string | null
    image_url: string | null
    units: { id: string; abbreviated_name: string }
    global_symptoms: { id: string } | null
  }
}

function toVariable(row: UserVariableRow, defaultValue: number | null, recent: Map<string, number[]>): InboxVariable {
  const unitRow = row.units ?? row.global_variables.units
  const unit = { id: unitRow.id, abbreviatedName: unitRow.abbreviated_name }
  return {
    userVariableId: row.id,
    globalVariableId: row.global_variable_id,
    name: row.global_variables.name,
    emoji: row.global_variables.emoji,
    imageUrl: row.global_variables.image_url,
    unit,
    inputType: getVariableInputType({ unitId: unit.id, variableCategory: null }),
    higherIsWorse: row.global_variables.global_symptoms !== null,
    isFavorite: row.is_favorite,
    defaultValue,
    presets: presetValues(defaultValue, recent.get(`${row.global_variable_id}|${unit.id}`) ?? []),
  }
}

/**
 * The signed-in person's inbox: their due, unsnoozed notifications, newest
 * first, and their favorite variables, each with the values to offer as
 * one-tap buttons. Server only.
 */
export async function loadInbox(userId: string, now = new Date()): Promise<Inbox> {
  await refreshDueNotifications(userId, now)
  return withUserTransaction({ id: userId }, async (tx) => {
    const [profile, notifications, favorites] = await Promise.all([
      tx.profiles.findUnique({ where: { id: userId }, select: { timezone: true } }),
      tx.reminder_notifications.findMany({
        where: dueNotificationsWhere(userId, now),
        orderBy: { notification_trigger_at: 'desc' },
        take: INBOX_LIMIT,
        select: {
          id: true,
          notification_trigger_at: true,
          reminder_schedules: {
            select: {
              id: true,
              default_value: true,
              notification_title_template: true,
              user_variables: variableSelect,
            },
          },
        },
      }),
      tx.user_variables.findMany({
        where: { user_id: userId, is_favorite: true, deleted_at: null },
        select: { ...variableSelect.select, reminder_schedules: { where: { is_active: true }, select: { default_value: true }, take: 1 } },
        orderBy: { created_at: 'asc' },
      }),
    ])

    const variableIds = [
      ...new Set([
        ...notifications.map((n) => n.reminder_schedules.user_variables.global_variable_id),
        ...favorites.map((f) => f.global_variable_id),
      ]),
    ]
    const measurements = variableIds.length
      ? await tx.measurements.findMany({
          where: { user_id: userId, deleted_at: null, global_variable_id: { in: variableIds } },
          orderBy: { start_at: 'desc' },
          take: RECENT_MEASUREMENTS,
          select: { global_variable_id: true, unit_id: true, value: true },
        })
      : []
    // Recent values per variable and unit, newest first; other units are left out.
    const recent = new Map<string, number[]>()
    for (const m of measurements) {
      const key = `${m.global_variable_id}|${m.unit_id}`
      recent.set(key, [...(recent.get(key) ?? []), Number(m.value)])
    }

    const items = notifications.map((n): InboxItem => {
      const schedule = n.reminder_schedules
      const variable = toVariable(schedule.user_variables, schedule.default_value, recent)
      return {
        ...variable,
        notificationId: n.id,
        scheduleId: schedule.id,
        title: inboxTitle(variable.name, variable.inputType.startsWith('rating'), schedule.notification_title_template),
        dueAt: n.notification_trigger_at.toISOString(),
      }
    })
    return {
      timezone: zoneOf(profile?.timezone),
      items,
      favorites: favorites.map((f) => toVariable(f, f.reminder_schedules[0]?.default_value ?? null, recent)),
    }
  })
}
