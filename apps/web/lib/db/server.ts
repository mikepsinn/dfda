import { cache } from 'react'
import { getServerUser } from '@/lib/server-auth'
import { dbAs, type UserDb } from '@/lib/db'

/**
 * Returns a database client limited by row-level security as the user of the
 * current request (or the anonymous role when nobody is signed in).
 *
 * The identity always comes from the session, never from function input, so
 * the policies keep enforcing who may read and write each row.
 */
export const getUserDb = cache(async (): Promise<UserDb> => {
  const user = await getServerUser()
  return dbAs(user ? { id: user.id, email: user.email } : null)
})
