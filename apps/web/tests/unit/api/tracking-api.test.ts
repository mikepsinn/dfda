// @vitest-environment node
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { describe, expect, it, vi } from 'vitest'
import { authenticateRequest } from '@/lib/api/resource-auth'
import { openApiDocument } from '@/lib/api/openapi'
import { createTrackingMcpServer } from '@/lib/mcp/server'
import { protectedResourceMetadata } from '@/lib/oauth-resources'
import { buildRruleString } from '@/lib/reminders/schedule'
import { trackingOperations } from '@/lib/tracking/operations'
import { GET as mcpMetadata } from '@/app/.well-known/oauth-protected-resource/api/mcp/route'

vi.mock('@/lib/db', () => ({ adminDb: {}, withUserTransaction: vi.fn() }))

describe('protected-resource metadata', () => {
  it('names the API, this app as the authorization server, and the tracking scopes', async () => {
    expect(await (await mcpMetadata(new Request('http://localhost:3000/.well-known/oauth-protected-resource/api/mcp'))).json()).toEqual({
      resource: 'http://localhost:3000/api/mcp',
      authorization_servers: ['http://localhost:3000/api/auth'],
      scopes_supported: ['tracking:read', 'tracking:write'],
      bearer_methods_supported: ['header'],
      resource_name: 'MCP server for personal tracking',
      resource_documentation: 'http://localhost:3000/developers',
    })
    expect(protectedResourceMetadata('rest').resource).toBe('http://localhost:3000/api/v1')
  })

  it('answers a request without a token with 401 and the metadata URL', async () => {
    const response = await authenticateRequest(new Request('http://localhost:3000/api/mcp', { method: 'POST' }), 'mcp')
    expect(response).toBeInstanceOf(Response)
    expect((response as Response).status).toBe(401)
    expect((response as Response).headers.get('www-authenticate')).toBe(
      'Bearer resource_metadata="http://localhost:3000/.well-known/oauth-protected-resource/api/mcp"',
    )
  })
})

describe('MCP tools', () => {
  async function toolNames(scopes: string[]) {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
    await createTrackingMcpServer('user-1', scopes).connect(serverTransport)
    const client = new Client({ name: 'test', version: '1.0.0' })
    await client.connect(clientTransport)
    const { tools } = await client.listTools()
    await client.close()
    return tools
  }

  it('offers one tool per operation that the scopes allow', async () => {
    const all = await toolNames(['tracking:read', 'tracking:write'])
    expect(all.map((tool) => tool.name).sort()).toEqual(Object.keys(trackingOperations).sort())

    const readOnly = await toolNames(['tracking:read'])
    expect(readOnly.length).toBeGreaterThan(0)
    for (const tool of readOnly) {
      expect(tool.annotations?.readOnlyHint).toBe(true)
    }
    expect(readOnly.map((tool) => tool.name)).not.toContain('recordMeasurement')
  })

  it('describes each tool input with its schema', async () => {
    const record = (await toolNames(['tracking:write'])).find((tool) => tool.name === 'recordMeasurement')!
    expect(record.inputSchema.required).toEqual(['value'])
    expect(Object.keys(record.inputSchema.properties ?? {})).toEqual(
      expect.arrayContaining(['globalVariableId', 'variableName', 'value', 'unitAbbreviation', 'startTime']),
    )
  })
})

describe('OpenAPI document', () => {
  it('describes every operation, with OAuth and the resource parameter', () => {
    const document = openApiDocument()
    const operationIds = Object.values(document.paths).flatMap((methods) =>
      Object.values(methods).map((operation) => (operation as { operationId: string }).operationId),
    )
    for (const name of Object.keys(trackingOperations).filter((name) => name !== 'respondToTrackingReminderNotifications')) {
      expect(operationIds).toContain(name)
    }
    expect(document.servers).toEqual([{ url: 'http://localhost:3000/api/v1' }])
    expect(document.components.securitySchemes.oauth2.flows.authorizationCode.tokenUrl).toBe(
      'http://localhost:3000/api/auth/oauth2/token',
    )
    expect(document.info.description).toContain('resource parameter')
  })

  it('takes path parameters out of the request body', () => {
    const patch = document().paths['/measurements/{id}'].patch as {
      parameters: { name: string }[]
      requestBody: { content: { 'application/json': { schema: { properties: Record<string, unknown> } } } }
    }
    expect(patch.parameters.map((parameter) => parameter.name)).toEqual(['id'])
    expect(patch.requestBody.content['application/json'].schema.properties).not.toHaveProperty('measurementId')
  })

  it('is served at /api/openapi as well as /api/v1/openapi.json', async () => {
    const { GET: oldAddress } = await import('@/app/api/openapi/route')
    const { GET: v1Address } = await import('@/app/api/v1/openapi.json/route')
    const [old, v1] = [oldAddress(), v1Address()]
    expect([old.status, v1.status]).toEqual([200, 200])
    expect(await old.json()).toEqual(await v1.json())
  })
})

function document() {
  return openApiDocument() as unknown as { paths: Record<string, Record<string, unknown>> }
}

describe('buildRruleString', () => {
  it('stores the rule as the reminder editor does, with the start and time zone', () => {
    const rule = buildRruleString('FREQ=WEEKLY;BYDAY=MO,TH', new Date('2026-10-12T00:00:00Z'), 'Europe/Berlin')
    expect(rule).toContain('DTSTART;TZID=Europe/Berlin:')
    expect(rule).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,TH')
  })

  it('refuses a rule with its own DTSTART or without FREQ', () => {
    expect(() => buildRruleString('DTSTART:20260101T000000Z\nRRULE:FREQ=DAILY', new Date(), 'UTC')).toThrow()
    expect(() => buildRruleString('BYDAY=MO', new Date(), 'UTC')).toThrow('FREQ')
  })
})
