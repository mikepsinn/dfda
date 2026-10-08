import { randomUUID } from 'node:crypto'
import { afterAll, describe, expect, it, vi } from 'vitest'
import type { AuthUser } from '@/lib/auth'
import { adminDb } from '@/lib/db'
import { fetchUserProfile } from '@/lib/profile'

// Runs against the database from scripts/db-plain-setup.ts. See `pnpm test:db`.

vi.mock('@/lib/server-auth', () => ({ getServerUser: vi.fn() }))

const authUser = (id: string, email?: string) => ({ id, email }) as AuthUser

const withoutProfile = authUser(randomUUID(), `profile-new-${Date.now()}@example.com`)
const withProfile = authUser(randomUUID(), `profile-old-${Date.now()}@example.com`)

afterAll(async () => {
  await adminDb.profiles.deleteMany({ where: { id: { in: [withoutProfile.id, withProfile.id] } } })
  await adminDb.$disconnect()
})

describe('fetchUserProfile', () => {
  it('creates the profile of a signed-in user who has none', async () => {
    // No users row, as for a user from before Better Auth created profiles.
    const profile = await fetchUserProfile(withoutProfile)

    expect(profile).toMatchObject({ id: withoutProfile.id, email: withoutProfile.email, user_type: null })
    expect(await adminDb.profiles.count({ where: { id: withoutProfile.id } })).toBe(1)
  })

  it('returns an existing profile with its role', async () => {
    await adminDb.profiles.create({ data: { id: withProfile.id, email: withProfile.email, user_type: 'patient' } })

    const profile = await fetchUserProfile(withProfile)

    expect(profile).toMatchObject({ id: withProfile.id, user_type: 'patient' })
  })

  it('returns null for a user without an email', async () => {
    expect(await fetchUserProfile(authUser(randomUUID()))).toBeNull()
  })
})
