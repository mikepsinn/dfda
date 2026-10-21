import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { adminDb } from '@/lib/db'
import { resourceUrl } from '@/lib/oauth-resources'
import * as mcpRoute from '@/app/api/mcp/route'
import * as measurementsRoute from '@/app/api/v1/measurements/route'
import * as measurementRoute from '@/app/api/v1/measurements/[id]/route'
import * as variablesRoute from '@/app/api/v1/variables/route'
import * as remindersRoute from '@/app/api/v1/tracking-reminders/route'
import * as reminderRoute from '@/app/api/v1/tracking-reminders/[id]/route'
import * as dueRoute from '@/app/api/v1/notifications/due/route'
import * as respondRoute from '@/app/api/v1/notifications/respond/route'
import { getAccessToken, registerClient, signedInUser } from './oauth-helpers'

// The MCP server and the REST API with real access tokens from the OAuth flow,
// against the database from scripts/db-plain-setup.ts. See `pnpm test:db`.

const site = 'http://localhost:3000'
const userIds: string[] = []
let alice: { userId: string; cookie: string }
let bob: { userId: string; cookie: string }
let clientId: string
let aliceRest: string
let aliceMcp: string
let bobRest: string

function request(path: string, token: string | null, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (token) headers.set('authorization', `Bearer ${token}`)
  if (init.body) headers.set('content-type', 'application/json')
  return new Request(`${site}${path}`, { ...init, headers })
}

const params = <T>(value: T) => ({ params: Promise.resolve(value) })

beforeAll(async () => {
  const stamp = Date.now()
  alice = await signedInUser(`tracking-alice-${stamp}@example.com`)
  bob = await signedInUser(`tracking-bob-${stamp}@example.com`)
  userIds.push(alice.userId, bob.userId)
  clientId = await registerClient()
  const scope = 'tracking:read tracking:write'
  aliceRest = (await getAccessToken({ cookie: alice.cookie, clientId, resource: resourceUrl('rest'), scope })).access_token
  aliceMcp = (await getAccessToken({ cookie: alice.cookie, clientId, resource: resourceUrl('mcp'), scope })).access_token
  bobRest = (await getAccessToken({ cookie: bob.cookie, clientId, resource: resourceUrl('rest'), scope })).access_token
})

afterAll(async () => {
  await adminDb.users.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.profiles.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.oauth_clients.deleteMany({ where: { clientId } })
  await adminDb.$disconnect()
})

describe('REST API authentication', () => {
  it('asks for a token, and points at the protected-resource metadata', async () => {
    const response = await measurementsRoute.GET(request('/api/v1/measurements', null))
    expect(response.status).toBe(401)
    expect(response.headers.get('www-authenticate')).toContain(
      `resource_metadata="${site}/.well-known/oauth-protected-resource/api/v1"`,
    )
  })

  it('refuses a token for the MCP server, and a token that is not a JWT', async () => {
    for (const token of [aliceMcp, 'not-a-jwt']) {
      const response = await measurementsRoute.GET(request('/api/v1/measurements', token))
      expect(response.status).toBe(401)
      expect(response.headers.get('www-authenticate')).toContain('error="invalid_token"')
    }
  })

  it('refuses a write with a read-only token', async () => {
    const readOnly = (
      await getAccessToken({ cookie: alice.cookie, clientId, resource: resourceUrl('rest'), scope: 'tracking:read' })
    ).access_token
    const response = await measurementsRoute.POST(
      request('/api/v1/measurements', readOnly, { method: 'POST', body: JSON.stringify({ globalVariableId: 'headache', value: 3 }) }),
    )
    expect(response.status).toBe(403)
    expect(response.headers.get('www-authenticate')).toContain('scope="tracking:write"')
  })
})

describe('REST API measurements', () => {
  let measurementId: string

  it('searches variables', async () => {
    const response = await variablesRoute.GET(request('/api/v1/variables?query=headache&limit=5', aliceRest))
    expect(response.status).toBe(200)
    const { variables } = await response.json()
    expect(variables[0]).toMatchObject({ id: 'headache', defaultUnit: { abbreviation: '0-10' } })
  })

  it('records a measurement by variable name, in the default unit', async () => {
    const response = await measurementsRoute.POST(
      request('/api/v1/measurements', aliceRest, {
        method: 'POST',
        body: JSON.stringify({ variableName: 'headache', value: 6, startTime: '2026-10-01T08:00:00Z', note: 'after lunch' }),
      }),
    )
    expect(response.status).toBe(201)
    const { measurement } = await response.json()
    expect(measurement).toMatchObject({
      variable: { id: 'headache' },
      value: 6,
      unit: { id: 'zero-to-ten-scale' },
      startTime: '2026-10-01T08:00:00.000Z',
      note: 'after lunch',
    })
    measurementId = measurement.id
  })

  it('refuses a unit of another kind, and invalid input', async () => {
    const wrongUnit = await measurementsRoute.POST(
      request('/api/v1/measurements', aliceRest, { method: 'POST', body: JSON.stringify({ globalVariableId: 'metformin', value: 5, unitAbbreviation: 'km' }) }),
    )
    expect(wrongUnit.status).toBe(400)
    const noValue = await measurementsRoute.POST(
      request('/api/v1/measurements', aliceRest, { method: 'POST', body: JSON.stringify({ globalVariableId: 'headache' }) }),
    )
    expect(noValue.status).toBe(400)
    expect((await noValue.json()).error.code).toBe('INVALID_ARGUMENT')
  })

  it('records in another unit of the same kind', async () => {
    const response = await measurementsRoute.POST(
      request('/api/v1/measurements', aliceRest, { method: 'POST', body: JSON.stringify({ globalVariableId: 'metformin', value: 0.5, unitAbbreviation: 'g' }) }),
    )
    expect(response.status).toBe(201)
    expect((await response.json()).measurement.unit).toEqual({ id: 'gram', name: expect.any(String), abbreviation: 'g' })
  })

  it('lists only the user’s own measurements, in pages', async () => {
    const page1 = await (await measurementsRoute.GET(request('/api/v1/measurements?limit=1', aliceRest))).json()
    expect(page1.measurements).toHaveLength(1)
    expect(page1.nextCursor).toEqual(expect.any(String))
    const page2 = await (
      await measurementsRoute.GET(request(`/api/v1/measurements?limit=1&cursor=${page1.nextCursor}`, aliceRest))
    ).json()
    expect(page2.measurements[0].id).toBe(measurementId)
    expect(page2.nextCursor).toBeNull()

    const bobs = await (await measurementsRoute.GET(request('/api/v1/measurements', bobRest))).json()
    expect(bobs.measurements).toEqual([])
  })

  it('does not let another user change or delete a measurement', async () => {
    const patch = await measurementRoute.PATCH(
      request(`/api/v1/measurements/${measurementId}`, bobRest, { method: 'PATCH', body: JSON.stringify({ value: 1 }) }),
      params({ id: measurementId }),
    )
    expect(patch.status).toBe(404)
    const del = await measurementRoute.DELETE(request(`/api/v1/measurements/${measurementId}`, bobRest, { method: 'DELETE' }), params({ id: measurementId }))
    expect(del.status).toBe(404)
  })

  it('corrects and deletes the user’s own measurement', async () => {
    const patch = await measurementRoute.PATCH(
      request(`/api/v1/measurements/${measurementId}`, aliceRest, { method: 'PATCH', body: JSON.stringify({ value: 4, note: null }) }),
      params({ id: measurementId }),
    )
    expect(patch.status).toBe(200)
    expect((await patch.json()).measurement).toMatchObject({ value: 4, note: null })

    const del = await measurementRoute.DELETE(request(`/api/v1/measurements/${measurementId}`, aliceRest, { method: 'DELETE' }), params({ id: measurementId }))
    expect(del.status).toBe(200)
    const row = await adminDb.measurements.findUnique({ where: { id: measurementId }, select: { deleted_at: true } })
    expect(row?.deleted_at).toBeInstanceOf(Date)
  })

  it('records a lab value as amount per volume only for a test with a molar mass', async () => {
    const record = (globalVariableId: string, value: number, unitAbbreviation: string) =>
      measurementsRoute.POST(
        request('/api/v1/measurements', aliceRest, { method: 'POST', body: JSON.stringify({ globalVariableId, value, unitAbbreviation }) }),
      )
    // Glucose (default mg/dL) has a molar mass, so mmol/L converts.
    const glucose = await record('fasting-blood-glucose', 5.4, 'mmol/L')
    expect(glucose.status).toBe(201)
    expect((await glucose.json()).measurement.unit).toMatchObject({ id: 'millimoles-per-liter' })
    // ApoB (mg/dL) has none: mmol/L would need one, g/L is a mass like mg/dL.
    expect((await record('apolipoprotein-b', 1, 'mmol/L')).status).toBe(400)
    expect((await record('apolipoprotein-b', 0.9, 'g/L')).status).toBe(201)
  })
})

describe('REST API reminders and notifications', () => {
  let reminderId: string

  it('creates and changes a reminder', async () => {
    const created = await remindersRoute.POST(
      request('/api/v1/tracking-reminders', aliceRest, {
        method: 'POST',
        body: JSON.stringify({ globalVariableId: 'headache', timeOfDay: '08:30', rrule: 'FREQ=WEEKLY;BYDAY=MO,TH', defaultValue: 2 }),
      }),
    )
    expect(created.status).toBe(201)
    const { reminder } = await created.json()
    expect(reminder).toMatchObject({ variable: { id: 'headache' }, timeOfDay: '08:30', isActive: true, defaultValue: 2 })
    expect(reminder.rrule).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,TH')
    expect(reminder.nextTriggerAt).toEqual(expect.any(String))
    reminderId = reminder.id

    const changed = await reminderRoute.PATCH(
      request(`/api/v1/tracking-reminders/${reminderId}`, aliceRest, { method: 'PATCH', body: JSON.stringify({ isActive: false }) }),
      params({ id: reminderId }),
    )
    expect(changed.status).toBe(200)
    expect((await changed.json()).reminder).toMatchObject({ isActive: false, nextTriggerAt: null, timeOfDay: '08:30' })

    const bobs = await reminderRoute.GET(request(`/api/v1/tracking-reminders/${reminderId}`, bobRest), params({ id: reminderId }))
    expect(bobs.status).toBe(404)
  })

  it('answers a due notification with the default value, once', async () => {
    // The worker makes notifications; here the test inserts one that is due.
    const notification = await adminDb.reminder_notifications.create({
      data: { reminder_schedule_id: reminderId, user_id: alice.userId, notification_trigger_at: new Date(Date.now() - 60_000) },
      select: { id: true },
    })

    const due = await (await dueRoute.GET(request('/api/v1/notifications/due', aliceRest))).json()
    expect(due.notifications.map((item: { id: string }) => item.id)).toContain(notification.id)
    expect((await (await dueRoute.GET(request('/api/v1/notifications/due', bobRest))).json()).notifications).toEqual([])

    const answer = await respondRoute.POST(
      request('/api/v1/notifications/respond', aliceRest, { method: 'POST', body: JSON.stringify({ notificationId: notification.id, action: 'track' }) }),
    )
    expect(answer.status).toBe(200)
    const { notification: answered } = await answer.json()
    expect(answered).toMatchObject({ status: 'completed', value: 2, measurementId: expect.any(String) })
    const measurement = await adminDb.measurements.findUnique({ where: { id: answered.measurementId }, select: { value: true, user_id: true } })
    expect(measurement).toEqual({ value: 2, user_id: alice.userId })

    const again = await respondRoute.POST(
      request('/api/v1/notifications/respond', aliceRest, { method: 'POST', body: JSON.stringify({ notificationId: notification.id, action: 'skip' }) }),
    )
    expect(again.status).toBe(404)
  })

  it('deletes a reminder', async () => {
    const response = await reminderRoute.DELETE(request(`/api/v1/tracking-reminders/${reminderId}`, aliceRest, { method: 'DELETE' }), params({ id: reminderId }))
    expect(response.status).toBe(200)
    expect(await adminDb.reminder_schedules.findUnique({ where: { id: reminderId } })).toBeNull()
  })
})

describe('MCP server', () => {
  async function rpc(method: string, rpcParams: Record<string, unknown>, token = aliceMcp) {
    const response = await mcpRoute.POST(
      request('/api/mcp', token, {
        method: 'POST',
        headers: { accept: 'application/json, text/event-stream', 'mcp-protocol-version': '2025-06-18' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params: rpcParams }),
      }),
    )
    return { status: response.status, body: response.status === 200 ? await response.json() : null }
  }

  it('initializes', async () => {
    const { status, body } = await rpc('initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'test', version: '1.0.0' },
    })
    expect(status).toBe(200)
    expect(body.result.serverInfo.name).toBe('tracking')
  })

  it('lists the tools, and calls one', async () => {
    const list = await rpc('tools/list', {})
    const names = list.body.result.tools.map((tool: { name: string }) => tool.name)
    expect(names).toEqual(expect.arrayContaining(['recordMeasurement', 'listMeasurements', 'respondToTrackingReminder']))

    const call = await rpc('tools/call', { name: 'recordMeasurement', arguments: { globalVariableId: 'nausea', value: 3 } })
    expect(call.body.result.isError).toBeUndefined()
    const { measurement } = JSON.parse(call.body.result.content[0].text)
    expect(measurement).toMatchObject({ variable: { id: 'nausea' }, value: 3 })
    const row = await adminDb.measurements.findUnique({ where: { id: measurement.id }, select: { user_id: true } })
    expect(row?.user_id).toBe(alice.userId)
  })

  it('reports an unknown variable as a tool error', async () => {
    const call = await rpc('tools/call', { name: 'recordMeasurement', arguments: { variableName: 'no such variable', value: 1 } })
    expect(call.body.result.isError).toBe(true)
    expect(JSON.parse(call.body.result.content[0].text).error.code).toBe('NOT_FOUND')
  })

  it('refuses a token without a tracking scope', async () => {
    const noTracking = (
      await getAccessToken({ cookie: alice.cookie, clientId, resource: resourceUrl('mcp'), scope: 'offline_access' })
    ).access_token
    const { status } = await rpc('tools/list', {}, noTracking)
    expect(status).toBe(403)
  })

  it('refuses a token for the REST API', async () => {
    expect((await rpc('tools/list', {}, aliceRest)).status).toBe(401)
  })

  it('stops accepting a token when its sign-in session ends', async () => {
    await adminDb.sessions.deleteMany({ where: { userId: alice.userId } })
    expect((await rpc('tools/list', {})).status).toBe(401)
  })
})
