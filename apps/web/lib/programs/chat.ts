import Anthropic from '@anthropic-ai/sdk'
import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod'
import * as z from 'zod/v4'
import { ASSISTANT_MODEL } from '@/lib/care-team/ask'
import { adminDb, withUserTransaction, type DbUser } from '@/lib/db'
import { isDemoPatient } from '@/lib/demo/patient'
import { env } from '@/lib/env'
import { afterReminderSaved, upsertReminder } from '@/lib/tracking/reminders'
import { ensureUserVariable } from '@/lib/tracking/variables'
import { SCALE_RANGES, scaleWords } from './config'
import { personalReport, type Program, type ProgramItem } from './data'
import { dayTime, itemValue, ProgramError, recordProgramValues } from './manage'
import { addSideEffect, mySideEffects, sideEffectOptions } from './side-effects'
import { unitChoices } from './units'

/**
 * The check-in chat: a member tells Claude how they are, and Claude records
 * the values, adds side effects and sets reminder times with tools that run
 * here, with the member's own permissions. Server only.
 *
 * Health data goes to the Claude API only under a business associate
 * agreement. Until there is one, the chat is on only for demo patients
 * (lib/demo/patient.ts), whose values are made up.
 */

/** Messages a day for each company: every visitor of a demo shares its patient's account. */
export const CHAT_DAILY_LIMIT = 300
/** Tool rounds of one answer. */
const MAX_ITERATIONS = 6

export type ChatMessage = { role: 'user' | 'assistant'; text: string }
export type ChatReply = { text: string; actions: string[] }

/** Whether the member can use the chat in this program: with an API key, and only as a demo patient for now. */
export async function chatAvailable(user: DbUser, program: Pick<Program, 'instanceId'>, apiKey = env.ANTHROPIC_API_KEY) {
  return Boolean(apiKey) && isDemoPatient(program.instanceId, user.id)
}

/**
 * Counts a message of the chat, unless the company's members sent the daily
 * number already. A lock for the company makes the count and the insert one
 * step, as for the report assistant's questions (lib/care-team/ask.ts).
 */
export async function logChatTurn(user: DbUser, instanceId: string, now = new Date()): Promise<{ limited: boolean }> {
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  return adminDb.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`program-chat:${instanceId}`}))`
    const sent = await tx.program_chat_turns.count({ where: { instance_id: instanceId, created_at: { gte: since } } })
    if (sent >= CHAT_DAILY_LIMIT) return { limited: true }
    await tx.program_chat_turns.create({ data: { instance_id: instanceId, user_id: user.id }, select: { id: true } })
    return { limited: false }
  })
}

const INSTRUCTIONS = `You help a member of a health program check in, in a short chat.
- Ask how they are, and about the items that have no value today, one or two at a time.
- When the member gives a value, record it with record_values, with the item's name from the list. A rating must be on the item's scale; if it is not, ask again. A skipped dose is 0.
- When they tell you about a new symptom, offer to track it as a side effect, and record it with add_side_effect, with today's rating when they give one. Ask whether they want a daily reminder for it.
- When they ask for another reminder time, use set_reminder.
- After a tool, say in a few words what you saved. Keep each answer to two or three short sentences.
- Do not give medical advice or change their treatment. For a serious or sudden symptom, tell them to contact their care team, or emergency services in an emergency.
- Use only the program and values below; do not invent values.`

/** One line about an item for the context: its kind, scale or unit, and how often. */
function itemLine(item: ProgramItem, units: string[] | undefined): string {
  const range = SCALE_RANGES[item.unitId]
  if (item.kind === 'dose') {
    return `${item.name}: dose, ${item.frequency ?? 'daily'}${item.defaultValue !== null ? `, usual amount ${item.defaultValue} ${item.unit}` : `, in ${item.unit}`}.`
  }
  if (range) {
    const words = scaleWords(item.better, range[0])
    return `${item.name}: rating ${range[0]} to ${range[1]}${words ? ` (${range[0]} = ${words[0]}, ${range[1]} = ${words[1]})` : ''}${item.kind === 'lab' ? ', lab result' : `, ${item.frequency ?? 'daily'}`}.`
  }
  const other = units && units.length > 1 ? ` (or ${units.slice(1).join(', ')})` : ''
  return `${item.name}: number in ${item.unit}${other}${item.kind === 'lab' ? ', lab result' : `, ${item.frequency ?? 'daily'}`}.`
}

/** What Claude knows of the member: the program's items and side effects, what they recorded today, and their report. */
async function chatContext(user: DbUser, program: Program, items: ProgramItem[], today: string) {
  const [instance, choices, report] = await Promise.all([
    adminDb.instances.findUnique({ where: { id: program.instanceId }, select: { name: true } }),
    unitChoices(items),
    personalReport(user, program),
  ])
  const recorded = await withUserTransaction(user, (tx) =>
    tx.measurements.findMany({
      where: {
        user_id: user.id,
        deleted_at: null,
        global_variable_id: { in: items.map((item) => item.variableId) },
        start_at: { gte: new Date(`${today}T00:00:00.000Z`), lt: new Date(`${today}T23:59:59.999Z`) },
      },
      select: { global_variable_id: true },
    }),
  )
  const done = new Set(recorded.map((row) => row.global_variable_id))
  const tracked = items.filter((item) => item.id.startsWith('side-effect-'))
  return [
    `Company: ${instance?.name ?? 'the clinic'}. Program: ${program.name}. Today: ${today}.`,
    'Items:',
    ...items.filter((item) => !tracked.includes(item)).map((item) => `- ${itemLine(item, choices.get(item.id)?.map((choice) => choice.unit))}`),
    tracked.length ? `Side effects that they track: ${tracked.map((item) => item.name).join(', ')} (ratings 0 to 10, daily).` : 'Side effects that they track: none.',
    `Recorded today: ${items.filter((item) => done.has(item.variableId)).map((item) => item.name).join(', ') || 'nothing yet'}.`,
    report ? `Their before and after report: ${report.verdict}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

/** "Nausea 3", "Weight 84 kg", "Semaglutide skipped". */
function savedLine(item: ProgramItem, value: number, unit: string): string {
  if (item.kind === 'dose' && value === 0) return `${item.name} skipped`
  return SCALE_RANGES[item.unitId] ? `${item.name} ${value}` : `${item.name} ${value} ${unit}`
}

const byName = (items: ProgramItem[], name: string) => items.find((item) => item.name.toLowerCase() === name.trim().toLowerCase())

/**
 * The chat's tools, which run with the member's own permissions. Each one
 * adds what it did to `actions`, for the page; a value that cannot be saved
 * comes back to Claude as a message, so that it can ask again.
 */
export function chatTools(user: DbUser, program: Program, today: string, actions: string[]) {
  const loadItems = async () => [...program.items, ...(await mySideEffects(user, program.id))]

  const recordValues = betaZodTool({
    name: 'record_values',
    description:
      "Records the member's values of one day: doses, check-ins, side effects or lab results. Use the item names from the list. A skipped dose is 0.",
    inputSchema: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('The day, YYYY-MM-DD. Default: today.'),
      values: z
        .array(
          z.object({
            item: z.string().describe('The item name, as in the list.'),
            value: z.number(),
            unit: z.string().optional().describe('Only for a value in another unit of the item, such as lb for a weight in kg.'),
          }),
        )
        .min(1),
    }),
    run: async ({ date, values }) => {
      const day = date ?? today
      const items = await loadItems()
      const choices = await unitChoices(items)
      const lines: string[] = []
      const groups = { today: {} as Record<string, string>, lab: {} as Record<string, string> }
      const units: Record<string, string> = {}
      for (const entry of values) {
        const item = byName(items, entry.item)
        if (!item) return `Not saved: there is no item "${entry.item}". The items are: ${items.map((candidate) => candidate.name).join(', ')}.`
        if (entry.unit && entry.unit.toLowerCase() !== item.unit.toLowerCase()) {
          const unit = choices.get(item.id)?.find((choice) => choice.unit.toLowerCase() === entry.unit!.toLowerCase())
          if (!unit) return `Not saved: ${item.name} is in ${item.unit}${choices.get(item.id) ? ` or ${choices.get(item.id)!.slice(1).map((choice) => choice.unit).join(', ')}` : ''}.`
          units[item.id] = unit.id
        }
        groups[item.kind === 'lab' ? 'lab' : 'today'][item.id] = String(entry.value)
        lines.push(savedLine(item, entry.value, units[item.id] ? entry.unit! : item.unit))
      }
      try {
        // Each value is checked before any is saved: the doses and check-ins and the lab results are saved
        // one after the other, so a wrong lab result must not come after saved values that a retry would save again.
        dayTime(day)
        for (const entry of values) itemValue(byName(items, entry.item)!, String(entry.value))
        for (const kind of ['today', 'lab'] as const) {
          if (Object.keys(groups[kind]).length) await recordProgramValues(user, program, kind, day, groups[kind], { items, units })
        }
      } catch (error) {
        if (error instanceof ProgramError) return `Not saved: ${error.message}`
        throw error
      }
      const saved = `Saved ${lines.join(', ')}${day === today ? '' : ` for ${day}`}.`
      actions.push(saved)
      return saved
    },
  })

  const addSideEffectTool = betaZodTool({
    name: 'add_side_effect',
    description: 'Adds a symptom that the member wants to track as a side effect, with today’s rating when they gave one, and a daily reminder when they want one.',
    inputSchema: z.object({
      name: z.string().describe('The symptom, such as headache.'),
      rating: z.number().optional().describe("Today's rating on the symptom's scale, usually 0 to 10."),
      remind_daily: z.boolean().describe('Whether the member wants a daily reminder to rate it.'),
    }),
    run: async ({ name, rating, remind_daily }) => {
      const options = await sideEffectOptions(program)
      const wanted = name.trim().toLowerCase()
      const option = options.find((candidate) => [candidate.name, ...candidate.synonyms].some((label) => label.toLowerCase() === wanted))
      if (!option) {
        const close = options.filter((candidate) => candidate.name.toLowerCase().includes(wanted) || wanted.includes(candidate.name.toLowerCase()))
        return `Not added: "${name}" is not in the list of symptoms.${close.length ? ` Close names: ${close.slice(0, 5).map((candidate) => candidate.name).join(', ')}.` : ''}`
      }
      try {
        const { reminderAdded } = await addSideEffect(user, program, {
          variableId: option.id,
          value: rating === undefined ? '' : String(rating),
          date: today,
          remind: remind_daily,
        })
        const added = `Added ${option.name}${rating === undefined ? '' : `, ${rating} today`}${reminderAdded ? ', with a daily reminder' : ''}.`
        actions.push(added)
        return added
      } catch (error) {
        if (error instanceof ProgramError) return `Not added: ${error.message}`
        throw error
      }
    },
  })

  const setReminder = betaZodTool({
    name: 'set_reminder',
    description: 'Sets the time of the reminder for a dose, a check-in or a side effect, in the member’s time zone.',
    inputSchema: z.object({
      item: z.string().describe('The item name, as in the list.'),
      time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).describe('HH:mm, 24-hour.'),
    }),
    run: async ({ item: name, time }) => {
      const item = byName(await loadItems(), name)
      if (!item || item.kind === 'lab') return `Not set: there is no dose, check-in or side effect "${name}".`
      const { reminder, created } = await withUserTransaction(user, async (tx) => {
        const userVariable = await ensureUserVariable(tx, user.id, item.variableId)
        const active = await tx.reminder_schedules.findFirst({
          where: { user_id: user.id, user_variable_id: userVariable.id, is_active: true },
          select: { id: true },
        })
        return upsertReminder(tx, user.id, active
          ? { trackingReminderId: active.id, timeOfDay: time }
          : { globalVariableId: item.variableId, timeOfDay: time, rrule: item.frequency === 'weekly' ? 'FREQ=WEEKLY' : 'FREQ=DAILY' })
      })
      await afterReminderSaved(user.id, { id: reminder.id, isActive: reminder.isActive }, created)
      const set = `Reminder for ${item.name} at ${time}.`
      actions.push(set)
      return set
    },
  })

  return [recordValues, addSideEffectTool, setReminder] as const
}

/**
 * The answer to the member's last message, and what the tools did. Claude
 * reads the chat so far; the page keeps it, and nothing of it is stored.
 */
export async function chatReply(
  user: DbUser,
  program: Program,
  messages: ChatMessage[],
  { client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }), today = new Date().toISOString().slice(0, 10) } = {},
): Promise<ChatReply> {
  const items = [...program.items, ...(await mySideEffects(user, program.id))]
  const actions: string[] = []
  const final = await client.beta.messages.toolRunner({
    model: ASSISTANT_MODEL,
    max_tokens: 4000,
    max_iterations: MAX_ITERATIONS,
    output_config: { effort: 'low' },
    system: [
      { type: 'text', text: INSTRUCTIONS },
      { type: 'text', text: await chatContext(user, program, items, today) },
    ],
    tools: [...chatTools(user, program, today, actions)],
    messages: messages.map((message) => ({ role: message.role, content: message.text })),
    // When a safety classifier declines, the API answers with the model it recommends for that case.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
  })
  if (final.stop_reason === 'refusal') {
    return { text: 'I cannot help with that here. Tell me how you are today, or what to record.', actions }
  }
  const text = final.content.flatMap((block) => (block.type === 'text' ? [block.text] : [])).join('').trim()
  return { text: text || (actions.length ? 'Saved.' : 'Tell me how you are today.'), actions }
}
