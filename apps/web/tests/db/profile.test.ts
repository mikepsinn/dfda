import { randomUUID } from 'node:crypto'
import { afterAll, describe, expect, it, vi } from 'vitest'
import type { User } from '@supabase/supabase-js'
import { adminDb } from '@/lib/db'
import { fetchUserProfile } from '@/lib/profile'

// Runs against the database from scripts/db-plain-setup.ts. See `pnpm test:db`.

vi.mock('@/lib/server-auth', () => ({ getServerUser: vi.fn() }))

const authUser = (id: string, email?: string) => ({ id, email }) as Pick<User, 'id' | 'email'> as User

const withoutProfile = authUser(randomUUID(), `profile-new-${Date.now()}@example.com`)
const withProfile = authUser(randomUUID(), `profile-old-${Date.now()}@example.com`)

afterAll(async () => {
  await adminDb.profiles.deleteMany({ where: { id: withoutProfile.id } })
  await adminDb.$executeRaw`DELETE FROM auth.users WHERE id = ${withProfile.id}::uuid`
  await adminDb.$disconnect()
})

describe('fetchUserProfile', () => {
  it('creates the profile of a signed-in user who has none', async () => {
    // No auth.users row, as on a database that Supabase Auth does not share.
    const profile = await fetchUserProfile(withoutProfile)

    expect(profile).toMatchObject({ id: withoutProfile.id, email: withoutProfile.email, user_type: null })
    expect(await adminDb.profiles.count({ where: { id: withoutProfile.id } })).toBe(1)
  })

  it('returns an existing profile with its role', async () => {
    await adminDb.$executeRaw`
      INSERT INTO auth.users (id, email) VALUES (${withProfile.id}::uuid, ${withProfile.email})`
    await adminDb.profiles.update({ where: { id: withProfile.id }, data: { user_type: 'patient' } })

    const profile = await fetchUserProfile(withProfile)

    expect(profile).toMatchObject({ id: withProfile.id, user_type: 'patient' })
  })

  it('returns null for a user without an email', async () => {
    expect(await fetchUserProfile(authUser(randomUUID()))).toBeNull()
  })
})
