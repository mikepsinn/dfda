import Anthropic from '@anthropic-ai/sdk'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ensurePasswordUser } from '@/lib/auth-users'
import { adminDb, dbAs } from '@/lib/db'
import { CHAT_DAILY_LIMIT, chatAvailable, chatReply, chatTools, logChatTurn } from '@/lib/programs/chat'
import { PROGRAM_TEMPLATES, programInputSchema } from '@/lib/programs/config'
import { findProgram, type Program } from '@/lib/programs/data'
import { joinProgram, saveProgram } from '@/lib/programs/manage'
import { timeOfDayToString } from '@/lib/time-of-day'

// The check-in chat (lib/programs/chat.ts): who can use it, its daily limit,
// its tools, and one answer with a fake Claude API. See `pnpm test:db`.

const stamp = Date.now()
const slug = `chat-${stamp}`
const password = 'correct horse battery staple'
const userIds: string[] = []
let patient: { id: string }
let member: { id: string }
let program: Program
let instanceId: string

const today = new Date().toISOString().slice(0, 10)
const glp1 = PROGRAM_TEMPLATES.find((template) => template.key === 'glp-1')!
const values = (variableId: string) =>
  adminDb.measurements.findMany({ where: { user_id: patient.id, global_variable_id: variableId }, select: { value: true, unit_id: true } })

/** A Claude API that answers with `replies` in turn, and keeps the requests. */
function fakeClient(replies: Anthropic.Beta.BetaContentBlock[][]) {
  const requests: { url: string; body: Record<string, unknown> }[] = []
  const client = new Anthropic({
    apiKey: 'test-key',
    fetch: async (url, init) => {
      requests.push({ url: String(url), body: JSON.parse(String(init?.body)) })
      const content = replies[requests.length - 1]
      const message = {
        id: `msg_${requests.length}`,
        type: 'message',
        role: 'assistant',
        model: 'claude-opus-5-5',
        content,
        stop_reason: content.some((block) => block.type === 'tool_use') ? 'tool_use' : 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 1, output_tokens: 1 },
      }
      return new Response(JSON.stringify(message), { status: 200, headers: { 'content-type': 'application/json' } })
    },
  })
  return { client, requests }
}

beforeAll(async () => {
  const owner = { id: await ensurePasswordUser(`chat-owner-${stamp}@example.com`, 'Owner', password) }
  patient = { id: await ensurePasswordUser(`chat-patient-${stamp}@example.com`, 'Demo Patient', password) }
  member = { id: await ensurePasswordUser(`chat-member-${stamp}@example.com`, 'Member', password) }
  userIds.push(owner.id, patient.id, member.id)
  instanceId = (await dbAs(owner).instances.create({ data: { slug, name: 'Chat Clinic', owner_id: owner.id }, select: { id: true } })).id
  await saveProgram(
    owner,
    slug,
    programInputSchema.parse({ name: 'GLP-1', slug: 'glp-1', summary: '', followUpWeeks: '12', items: JSON.stringify(glp1.items) }),
  )
  program = (await findProgram(slug, 'glp-1'))!
  await joinProgram(patient, program, { scheduleNotifications: false })
  await joinProgram(member, program, { scheduleNotifications: false })
  // The site's demo patient (lib/demo/instance.ts).
  await adminDb.instance_demo_accounts.create({ data: { instance_id: instanceId, user_id: patient.id, role: 'patient' } })
})

afterAll(async () => {
  await adminDb.measurements.deleteMany({ where: { user_id: { in: userIds } } })
  await adminDb.instances.deleteMany({ where: { slug } })
  await adminDb.users.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.profiles.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.$disconnect()
})

describe('the check-in chat', () => {
  it('is on only for a demo patient, with an API key, until there is a business associate agreement', async () => {
    expect(await chatAvailable(patient, program, 'a-key')).toBe(true)
    expect(await chatAvailable(patient, program, undefined)).toBe(false)
    expect(await chatAvailable(member, program, 'a-key')).toBe(false)
  })

  it("stops at the company's daily number of messages", async () => {
    expect(await logChatTurn(patient, instanceId)).toEqual({ limited: false })
    await adminDb.program_chat_turns.createMany({
      data: Array.from({ length: CHAT_DAILY_LIMIT - 1 }, () => ({ instance_id: instanceId, user_id: patient.id })),
    })
    expect(await logChatTurn(patient, instanceId)).toEqual({ limited: true })
    // A day later, there is room again.
    expect(await logChatTurn(patient, instanceId, new Date(Date.now() + 25 * 60 * 60 * 1000))).toEqual({ limited: false })
    await adminDb.program_chat_turns.deleteMany({ where: { instance_id: instanceId } })
  })
})

describe("the chat's tools", () => {
  const tools = (actions: string[] = []) => {
    const [recordValues, addSideEffect, setReminder] = chatTools(patient, program, today, actions)
    return { recordValues, addSideEffect, setReminder, actions }
  }

  it('record values by item name, in another unit, and a skipped dose as 0', async () => {
    const { recordValues, actions } = tools()
    const result = await recordValues.run({
      values: [
        { item: 'nausea', value: 3 },
        { item: 'Weight', value: 200, unit: 'lb' },
        { item: 'Semaglutide', value: 0 },
      ],
    })
    expect(result).toBe('Saved Nausea 3, Weight 200 lb, Semaglutide skipped.')
    expect(actions).toEqual([result])
    expect(await values('nausea')).toEqual([{ value: 3, unit_id: 'zero-to-ten-scale' }])
    expect(await values('weight')).toEqual([{ value: 200, unit_id: 'pound' }])
    expect(await values('semaglutide')).toEqual([expect.objectContaining({ value: 0 })])
  })

  it('save nothing and say why for an unknown item, another unit or a rating off the scale', async () => {
    const { recordValues, actions } = tools()
    expect(await recordValues.run({ values: [{ item: 'Mood', value: 5 }] })).toMatch(/^Not saved: there is no item "Mood"\. The items are: Semaglutide, /)
    expect(await recordValues.run({ values: [{ item: 'Weight', value: 80, unit: 'mg' }] })).toBe('Not saved: Weight is in kg or lb.')
    expect(await recordValues.run({ values: [{ item: 'Energy', value: 11 }] })).toBe('Not saved: Energy: enter a number from 0 to 10.')
    expect(actions).toEqual([])
    expect(await values('energy-level')).toEqual([])
  })

  it('add a side effect from the list with its rating and a reminder, and say the close names of an unknown one', async () => {
    const { addSideEffect, actions } = tools()
    expect(await addSideEffect.run({ name: 'headache', rating: 4, remind_daily: true })).toBe('Added Headache, 4 today, with a daily reminder.')
    expect(actions).toEqual(['Added Headache, 4 today, with a daily reminder.'])
    expect(await values('headache')).toEqual([{ value: 4, unit_id: 'zero-to-ten-scale' }])
    expect(await addSideEffect.run({ name: 'pain', remind_daily: false })).toBe('Added Pain.')
    expect(await addSideEffect.run({ name: 'a strange feeling', remind_daily: false })).toBe('Not added: "a strange feeling" is not in the list of symptoms.')
  })

  it('set the time of a reminder', async () => {
    const { setReminder, actions } = tools()
    expect(await setReminder.run({ item: 'Nausea', time: '21:30' })).toBe('Reminder for Nausea at 21:30.')
    expect(actions).toEqual(['Reminder for Nausea at 21:30.'])
    const reminder = await adminDb.reminder_schedules.findFirstOrThrow({
      where: { user_id: patient.id, is_active: true, user_variables: { global_variable_id: 'nausea' } },
      select: { time_of_day: true },
    })
    expect(timeOfDayToString(reminder.time_of_day).slice(0, 5)).toBe('21:30')
    expect(await setReminder.run({ item: 'HbA1c', time: '09:00' })).toBe('Not set: there is no dose, check-in or side effect "HbA1c".')
  })
})

describe("the chat's answer", () => {
  it('sends the program and the day to Claude, runs its tool calls, and returns the answer and what was saved', async () => {
    const { client, requests } = fakeClient([
      [{ type: 'tool_use', id: 'toolu_1', name: 'record_values', input: { values: [{ item: 'Energy', value: 7 }] }, caller: { type: 'direct' } }] as never,
      [{ type: 'text', text: 'Saved your energy, 7.', citations: null }] as never,
    ])
    const reply = await chatReply(patient, program, [{ role: 'user', text: 'Energy is a 7 today' }], { client, today })
    expect(reply).toEqual({ text: 'Saved your energy, 7.', actions: ['Saved Energy 7.'] })
    expect(await values('energy-level')).toEqual([{ value: 7, unit_id: 'zero-to-ten-scale' }])

    const [first, second] = requests
    expect(first.body).toMatchObject({ model: 'claude-opus-5-5', output_config: { effort: 'low' }, fallbacks: 'default' })
    const system = (first.body.system as { text: string }[]).map((block) => block.text).join('\n')
    expect(system).toContain(`Company: Chat Clinic. Program: GLP-1. Today: ${today}.`)
    expect(system).toContain('- Energy: rating 0 to 10 (0 = Very low, 10 = Very high), daily.')
    expect(system).toContain('- Weight: number in kg (or lb), weekly.')
    expect((first.body.tools as { name: string }[]).map((tool) => tool.name)).toEqual(['record_values', 'add_side_effect', 'set_reminder'])
    // The tool's result goes back to Claude.
    expect(JSON.stringify(second.body.messages)).toContain('"tool_result"')
    expect(JSON.stringify(second.body.messages)).toContain('Saved Energy 7.')
  })
})
