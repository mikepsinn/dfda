import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import * as authServerRoute from '@/app/.well-known/oauth-authorization-server/api/auth/route'
import * as mcpMetadataRoute from '@/app/.well-known/oauth-protected-resource/api/mcp/route'
import * as authRoute from '@/app/api/auth/[...all]/route'
import * as mcpRoute from '@/app/api/mcp/route'
import { ensurePasswordUser } from '@/lib/auth-users'
import { adminDb, dbAs } from '@/lib/db'
import { resourceUrl } from '@/lib/oauth-resources'
import { getAccessToken, registerClient, signedInUser, siteOrigin } from './oauth-helpers'

// The MCP server and its OAuth sign-in on a company's own address
// (lib/instance/oauth.ts): the metadata, the issuer and the endpoints are on
// the company's address, and a token works only on the address that it was
// issued for. See `pnpm test:db`.

const stamp = Date.now()
const company = `https://mcp-${stamp}.example.test`
const companyMcp = `${company}/api/mcp`
const userIds: string[] = []
let clientIds: string[] = []
let member: { userId: string; cookie: string }

async function rpc(origin: string, token: string | null) {
  const headers: Record<string, string> = { accept: 'application/json, text/event-stream', 'content-type': 'application/json' }
  if (token) headers.authorization = `Bearer ${token}`
  return mcpRoute.POST(
    new Request(`${origin}/api/mcp`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1.0.0' } },
      }),
    }),
  )
}

beforeAll(async () => {
  const ownerId = await ensurePasswordUser(`company-mcp-owner-${stamp}@example.com`, 'Owner', 'correct horse battery staple')
  userIds.push(ownerId)
  await dbAs({ id: ownerId }).instances.create({
    data: { slug: `company-mcp-${stamp}`, name: 'Acme Clinic', owner_id: ownerId, custom_domain: new URL(company).host },
  })
  member = await signedInUser(`company-mcp-member-${stamp}@example.com`, company)
  userIds.push(member.userId)
  clientIds = [await registerClient(company)]
})

afterAll(async () => {
  await adminDb.instances.deleteMany({ where: { slug: `company-mcp-${stamp}` } })
  await adminDb.oauth_resources.deleteMany({ where: { identifier: { startsWith: company } } })
  await adminDb.oauth_clients.deleteMany({ where: { clientId: { in: clientIds } } })
  await adminDb.users.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.profiles.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.$disconnect()
})

describe("the MCP server on a company's address", () => {
  it('asks for a token, with the metadata on the same address', async () => {
    const response = await rpc(company, null)
    expect(response.status).toBe(401)
    expect(response.headers.get('www-authenticate')).toContain(`resource_metadata="${company}/.well-known/oauth-protected-resource/api/mcp"`)

    const metadata = await (await mcpMetadataRoute.GET(new Request(`${company}/.well-known/oauth-protected-resource/api/mcp`))).json()
    expect(metadata).toMatchObject({ resource: companyMcp, authorization_servers: [`${company}/api/auth`] })
    // The documentation is a page of the main site.
    expect(metadata.resource_documentation).toBeUndefined()
    // The company's APIs are OAuth resources of their own.
    const resources = await adminDb.oauth_resources.findMany({ where: { identifier: { startsWith: company } }, select: { identifier: true } })
    expect(resources.map((row) => row.identifier).sort()).toEqual([companyMcp, `${company}/api/v1`])
  })

  it("has the OAuth server's issuer and endpoints on the company's address", async () => {
    const metadata = await (await authServerRoute.GET(new Request(`${company}/.well-known/oauth-authorization-server/api/auth`))).json()
    expect(metadata).toMatchObject({
      issuer: `${company}/api/auth`,
      authorization_endpoint: `${company}/api/auth/oauth2/authorize`,
      token_endpoint: `${company}/api/auth/oauth2/token`,
      registration_endpoint: `${company}/api/auth/oauth2/register`,
    })
    expect(JSON.stringify(metadata)).not.toContain(siteOrigin)

    // The main site's metadata is unchanged.
    const site = await (await authServerRoute.GET(new Request(`${siteOrigin}/.well-known/oauth-authorization-server/api/auth`))).json()
    expect(site.issuer).toBe(`${siteOrigin}/api/auth`)
  })

  it("sends a member who is not signed in to the company's sign-in page, and errors to its address", async () => {
    const authorize = (clientId: string) =>
      authRoute.GET(
        new Request(
          `${company}/api/auth/oauth2/authorize?${new URLSearchParams({
            response_type: 'code',
            client_id: clientId,
            redirect_uri: 'https://client.example.com/callback',
            scope: 'tracking:read',
            code_challenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
            code_challenge_method: 'S256',
            resource: companyMcp,
          })}`,
          { redirect: 'manual' },
        ),
      )
    // A relative path, so on the address of the request: the company's sign-in page.
    expect((await authorize(clientIds[0])).headers.get('location')).toMatch(/^\/login\?/)
    // An unknown client gets the error page, on the company's address too.
    const error = (await authorize('no-such-client')).headers.get('location') ?? ''
    expect(error.startsWith(`${company}/`) || error.startsWith('/')).toBe(true)
  })

  it('gives a member a token on the company address, with its issuer, that works only there', async () => {
    const token = await getAccessToken({
      origin: company,
      cookie: member.cookie,
      clientId: clientIds[0],
      resource: companyMcp,
      scope: 'tracking:read tracking:write',
    })
    expect(token.iss).toBe(`${company}/api/auth`)

    expect((await rpc(company, token.access_token)).status).toBe(200)
    // Not on the main site's address.
    expect((await rpc(siteOrigin, token.access_token)).status).toBe(401)

    // A token of the main site does not work on the company's address.
    const site = await signedInUser(`company-mcp-site-${stamp}@example.com`)
    userIds.push(site.userId)
    const siteClient = await registerClient()
    clientIds = [...clientIds, siteClient]
    const siteToken = await getAccessToken({ cookie: site.cookie, clientId: siteClient, resource: resourceUrl('mcp'), scope: 'tracking:read' })
    expect(siteToken.iss).toBe(`${siteOrigin}/api/auth`)
    expect((await rpc(siteOrigin, siteToken.access_token)).status).toBe(200)
    expect((await rpc(company, siteToken.access_token)).status).toBe(401)
  })
})
