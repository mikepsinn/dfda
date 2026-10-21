import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { adminDb, dbAs } from '@/lib/db'
import { trustedOriginsFor } from '@/lib/auth'
import { ensurePasswordUser } from '@/lib/auth-users'

// Company instances: row-level security, and how a request finds its instance.
// Runs against the database from scripts/db-plain-setup.ts. See `pnpm test:db`.

// Set before the modules load: lib/env reads it once.
const request = vi.hoisted(() => {
  process.env.INSTANCE_ROOT_DOMAIN = 'brands.example.org'
  return { host: '', cookie: undefined as string | undefined }
})
vi.mock('next/headers', () => ({
  headers: async () => new Headers(request.host ? { host: request.host } : {}),
  cookies: async () => ({ get: () => (request.cookie ? { value: request.cookie } : undefined) }),
}))
const stamp = Date.now()
const slug = `acme-${stamp}`
const domain = `track-${stamp}.acme.example.com`
const userIds: string[] = []
let owner: { id: string }
let other: { id: string }

beforeAll(async () => {
  owner = { id: await ensurePasswordUser(`instance-owner-${stamp}@example.com`, 'Owner', 'correct horse battery staple') }
  other = { id: await ensurePasswordUser(`instance-other-${stamp}@example.com`, 'Other', 'correct horse battery staple') }
  userIds.push(owner.id, other.id)
})

afterAll(async () => {
  await adminDb.instances.deleteMany({ where: { owner_id: { in: userIds } } })
  await adminDb.users.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.profiles.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.$disconnect()
})

describe('instances table', () => {
  it('lets a user create an instance that they own, and anyone read it', async () => {
    await dbAs(owner).instances.create({
      data: { slug, name: 'Acme Proteomics', primary_color: '#0f766e', products: ['BPC-157'], custom_domain: domain, owner_id: owner.id },
      select: { id: true },
    })
    expect(await dbAs(null).instances.findUnique({ where: { slug }, select: { name: true } })).toEqual({ name: 'Acme Proteomics' })
  })

  it('does not let another user create an instance for the owner, or change or delete it', async () => {
    await expect(
      dbAs(other).instances.create({ data: { slug: `${slug}-x`, name: 'Fake', owner_id: owner.id }, select: { id: true } }),
    ).rejects.toThrow()
    const { count: changed } = await dbAs(other).instances.updateMany({ where: { slug }, data: { name: 'Taken over' } })
    const { count: deleted } = await dbAs(other).instances.deleteMany({ where: { slug } })
    expect([changed, deleted]).toEqual([0, 0])
    expect((await adminDb.instances.findUnique({ where: { slug } }))?.name).toBe('Acme Proteomics')
  })

  it('refuses an address, color, font or corner size in the wrong form', async () => {
    for (const data of [
      { slug: 'Not Valid' },
      { slug: `${slug}-c`, primary_color: 'teal' },
      { slug: `${slug}-b`, background_color: 'white' },
      { slug: `${slug}-f`, font: 'comic-sans' },
      { slug: `${slug}-r`, corner_radius: 'huge' },
    ]) {
      await expect(
        dbAs(owner).instances.create({ data: { name: 'Acme', owner_id: owner.id, ...data }, select: { id: true } }),
      ).rejects.toThrow()
    }
  })
})

describe('resolveInstance', () => {
  async function resolve(host: string, cookie?: string) {
    Object.assign(request, { host, cookie })
    vi.resetModules()
    const { resolveInstance } = await import('@/lib/instance/resolve')
    return resolveInstance()
  }

  it('finds the instance by its own domain, its subdomain or the preview cookie', async () => {
    expect(await resolve(domain)).toMatchObject({
      slug,
      via: 'domain',
      name: 'Acme Proteomics',
      products: ['BPC-157'],
      // The theme's defaults: the standard look.
      backgroundColor: '#ffffff',
      font: 'inter',
      cornerRadius: 'medium',
    })
    expect(await resolve(`${slug}.brands.example.org`)).toMatchObject({ slug, via: 'subdomain' })
    expect(await resolve('localhost:3000', slug)).toMatchObject({ slug, via: 'preview' })
  })

  it('shows the main site for other hosts and unknown slugs', async () => {
    expect(await resolve('localhost:3000')).toBeNull()
    expect(await resolve('unknown.brands.example.org', 'no-such-instance')).toBeNull()
  })
})

describe('preview link', () => {
  it('sets the preview cookie and opens the home page', async () => {
    const { GET } = await import('@/app/i/[slug]/route')
    const response = await GET(new Request(`http://localhost:3000/i/${slug}`), { params: Promise.resolve({ slug }) })
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/')
    expect(response.headers.get('set-cookie')).toContain(`instance_preview=${slug}`)
  })

  it('opens only paths on this site', async () => {
    const { GET } = await import('@/app/i/[slug]/route')
    const response = await GET(new Request(`http://localhost:3000/i/${slug}?next=//evil.example.com`), { params: Promise.resolve({ slug }) })
    expect(response.headers.get('location')).toBe('http://localhost:3000/')
  })
})

describe('trusted origins for sign-in', () => {
  // Better Auth checks origins only outside tests, so this tests the list it would check against.
  const originsFor = (host: string) =>
    trustedOriginsFor(new Request(`http://${host}/api/auth/sign-out`, { method: 'POST', headers: { 'x-forwarded-host': host } }))

  it('trusts an instance domain or subdomain for requests on it', async () => {
    expect(await originsFor(domain)).toContain(`http://${domain}`)
    expect(await originsFor(`${slug}.brands.example.org`)).toContain(`http://${slug}.brands.example.org`)
  })

  it('does not trust other hosts, and adds nothing on the main site', async () => {
    expect(await originsFor('not-an-instance.example.com')).not.toContain('http://not-an-instance.example.com')
    const main = await originsFor('localhost:3000')
    expect(main.some((origin) => origin.includes(domain))).toBe(false)
  })
})
