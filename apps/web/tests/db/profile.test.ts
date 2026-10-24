import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type { AuthUser } from '@/lib/auth'
import { updateProfileAction, type ProfileFormUpdate } from '@/lib/actions/profiles'
import { ensurePasswordUser } from '@/lib/auth-users'
import { adminDb, dbAs } from '@/lib/db'
import { fetchUserProfile } from '@/lib/profile'
import { getServerUser } from '@/lib/server-auth'

// Runs against the database from scripts/db-plain-setup.ts. See `pnpm test:db`.

vi.mock('@/lib/server-auth', () => ({ getServerUser: vi.fn() }))

const authUser = (id: string, email?: string) => ({ id, email }) as AuthUser

const withoutProfile = authUser(randomUUID(), `profile-new-${Date.now()}@example.com`)
const withProfile = authUser(randomUUID(), `profile-old-${Date.now()}@example.com`)
const editorEmail = `profile-editor-${Date.now()}@example.com`
let editor: { id: string }

beforeAll(async () => {
  editor = { id: await ensurePasswordUser(editorEmail, 'Profile Editor', 'correct horse battery staple') }
})

afterAll(async () => {
  await adminDb.profiles.deleteMany({ where: { id: { in: [withoutProfile.id, withProfile.id] } } })
  await adminDb.users.deleteMany({ where: { id: editor.id } })
  await adminDb.profiles.deleteMany({ where: { id: editor.id } })
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

// db/migrations/20261024040000_alter_profiles_user_updates.sql
describe("what a user can change in their own profile", () => {
  const profile = () => adminDb.profiles.findUniqueOrThrow({ where: { id: editor.id } })
  const update = (data: Parameters<ReturnType<typeof dbAs>['profiles']['update']>[0]['data']) =>
    dbAs(editor).profiles.update({ where: { id: editor.id }, data, select: { id: true } })

  it('changes their name and time zone', async () => {
    await update({ first_name: 'Ada', last_name: 'Lovelace', timezone: 'Europe/London', updated_at: new Date() })
    expect(await profile()).toMatchObject({ first_name: 'Ada', last_name: 'Lovelace', timezone: 'Europe/London' })
  })

  it('cannot change the email or the dates of the account', async () => {
    await expect(update({ email: `someone-else-${Date.now()}@example.com` })).rejects.toThrow(/permission denied/)
    await expect(update({ deleted_at: new Date() })).rejects.toThrow(/permission denied/)
    await expect(update({ created_at: new Date(0) })).rejects.toThrow(/permission denied/)
    expect(await profile()).toMatchObject({ email: editorEmail, deleted_at: null })
  })

  it('chooses a role once, and never the admin role', async () => {
    await expect(update({ user_type: 'admin' })).rejects.toThrow(/role once/)
    await update({ user_type: 'patient' })
    await expect(update({ user_type: 'provider' })).rejects.toThrow(/role once/)
    await expect(update({ user_type: null })).rejects.toThrow(/role once/)
    expect((await profile()).user_type).toBe('patient')
    // The server's admin client can still change it.
    await adminDb.profiles.update({ where: { id: editor.id }, data: { user_type: 'provider' }, select: { id: true } })
    expect((await profile()).user_type).toBe('provider')
  })

  it('saves only the fields of the profile form, for the signed-in user', async () => {
    vi.mocked(getServerUser).mockResolvedValue({ id: editor.id, email: editorEmail } as AuthUser)
    // A client can send any keys; the action keeps the name and the time zone.
    const sent = { first_name: ' Grace ', last_name: '', timezone: 'UTC', email: 'x@example.com', user_type: 'admin' } as ProfileFormUpdate
    await updateProfileAction(sent)
    expect(await profile()).toMatchObject({ first_name: 'Grace', last_name: null, timezone: 'UTC', email: editorEmail, user_type: 'provider' })
  })
})
