import { auth } from '@/lib/auth'

/**
 * Returns the id of the user with this email, and creates the user with a
 * password when there is none. Creating the user also creates the profile
 * (databaseHooks in lib/auth.ts). An existing user without a password gets
 * this password; an existing password is not changed.
 *
 * Server-side only, for accounts that the app itself manages (the demo
 * accounts and tests). Open sign-up with a password is off.
 */
export async function ensurePasswordUser(email: string, name: string, password: string): Promise<string> {
  const ctx = await auth.$context
  const found = await ctx.internalAdapter.findUserByEmail(email, { includeAccounts: true })
  const user = found?.user ?? (await ctx.internalAdapter.createUser({ email, name, emailVerified: true }, { method: 'admin' }))
  const hasPassword = found?.accounts.some((account) => account.providerId === 'credential') ?? false
  if (!hasPassword) {
    await ctx.internalAdapter.linkAccount({
      userId: user.id,
      providerId: 'credential',
      accountId: user.id,
      password: await ctx.password.hash(password),
    })
  }
  return user.id
}
