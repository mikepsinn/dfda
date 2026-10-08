import { afterAll, describe, expect, it } from 'vitest'
import { auth } from '@/lib/auth'
import { ensurePasswordUser } from '@/lib/auth-users'
import { adminDb, withUserTransaction } from '@/lib/db'

// Runs against the database from scripts/db-plain-setup.ts. See `pnpm test:db`.

const email = `auth-${Date.now()}@example.com`
const password = 'correct horse battery staple'
const createdUserIds: string[] = []

async function createUser() {
  const id = await ensurePasswordUser(email, 'Test User', password)
  createdUserIds.push(id)
  return id
}

afterAll(async () => {
  await adminDb.users.deleteMany({ where: { id: { in: createdUserIds } } })
  await adminDb.$disconnect()
})

describe('Better Auth users', () => {
  it('creates the profile with the user, with the same id', async () => {
    const userId = await createUser()

    expect(await adminDb.users.findUnique({ where: { id: userId }, select: { email: true } })).toEqual({ email })
    expect(await adminDb.profiles.findUnique({ where: { id: userId }, select: { email: true, user_type: true } }))
      .toEqual({ email, user_type: null })
  })

  it('signs in with the password and reads the session from the cookie', async () => {
    const { headers } = await auth.api.signInEmail({
      body: { email, password },
      returnHeaders: true,
    })
    const cookie = headers.get('set-cookie')
    expect(cookie).toContain('better-auth.session_token=')

    const session = await auth.api.getSession({
      headers: new Headers({ cookie: cookie!.split(';')[0] }),
    })
    expect(session?.user.email).toBe(email)
  })

  it('refuses a wrong password', async () => {
    await expect(auth.api.signInEmail({ body: { email, password: 'wrong password' } })).rejects.toThrow()
  })

  it('does not allow open sign-up with a password', async () => {
    await expect(
      auth.api.signUpEmail({ body: { email: `signup-${Date.now()}@example.com`, password, name: 'Someone' } }),
    ).rejects.toThrow()
  })

  it('keeps the auth tables away from the anon and authenticated roles', async () => {
    const userId = await createUser()
    for (const user of [null, { id: userId, email }]) {
      await expect(
        withUserTransaction(user, (tx) => tx.$queryRaw`SELECT "password" FROM public.accounts LIMIT 1`),
      ).rejects.toThrow(/permission denied/)
      await expect(
        withUserTransaction(user, (tx) => tx.$queryRaw`SELECT "token" FROM public.sessions LIMIT 1`),
      ).rejects.toThrow(/permission denied/)
    }
  })

  it('deletes the profile when the user is deleted', async () => {
    const userId = await createUser()
    await adminDb.users.delete({ where: { id: userId } })

    expect(await adminDb.profiles.count({ where: { id: userId } })).toBe(0)
  })
})
