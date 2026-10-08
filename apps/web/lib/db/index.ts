import { PrismaPg } from '@prisma/adapter-pg'
import { Prisma, PrismaClient } from '@/lib/generated/prisma/client'

export { Prisma }

/**
 * Database access through Prisma.
 *
 * - `adminDb` connects with the full privileges of DATABASE_URL and is not
 *   limited by row-level security. Use it only for server-side work that has
 *   already been authorized (workers, scripts, OAuth token exchange).
 * - `dbAs(user)` returns a client whose every query runs with row-level
 *   security as that user, or as the anonymous role when `user` is null. The
 *   existing policies read the user from `request.jwt.claims` (through
 *   `auth.uid()`), so this client sets that value and switches to the
 *   `authenticated` or `anon` role inside a transaction around each query.
 * - In server components and actions, use `getUserDb()` from `@/lib/db/server`,
 *   which takes the user from the current session.
 */

const globalForDb = globalThis as unknown as { adminDb?: PrismaClient }

function createAdminClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    // Error messages without source code frames; some actions return them to the UI.
    errorFormat: 'minimal',
  })
}

function getAdminClient(): PrismaClient {
  globalForDb.adminDb ??= createAdminClient()
  return globalForDb.adminDb
}

/**
 * Full-access client. Row-level security does not apply. The connection is
 * created on first use, so importing this module does not need a database.
 */
export const adminDb: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getAdminClient()
    const value = Reflect.get(client, property, client)
    return typeof value === 'function' ? value.bind(client) : value
  },
})

/** The signed-in user whose identity row-level security uses. */
export type DbUser = { id: string; email?: string | null }

/** Claims in the same shape as the Supabase JWT that the policies read. */
function claimsFor(user: DbUser | null) {
  return user
    ? { sub: user.id, email: user.email ?? undefined, role: 'authenticated' as const }
    : { role: 'anon' as const }
}

/** Sets the row-level security identity for the rest of the current transaction. */
function setIdentity(client: Prisma.TransactionClient | PrismaClient, user: DbUser | null) {
  const claims = claimsFor(user)
  return client.$executeRaw`SELECT set_config('request.jwt.claims', ${JSON.stringify(claims)}, true), set_config('role', ${claims.role}, true)`
}

function createUserClient(user: DbUser | null) {
  const client = getAdminClient()
  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          const [, result] = await client.$transaction([setIdentity(client, user), query(args)])
          return result
        },
      },
    },
  })
}

/**
 * A client limited by row-level security. Model queries are allowed;
 * raw SQL is not, because it would run without the user's identity.
 */
export type UserDb = Omit<
  ReturnType<typeof createUserClient>,
  '$queryRaw' | '$queryRawUnsafe' | '$executeRaw' | '$executeRawUnsafe' | '$transaction'
>

/**
 * Returns a client whose queries run with row-level security as `user`, or as
 * the anonymous role when `user` is null. Each query is its own transaction;
 * use `withUserTransaction` when several writes must succeed or fail together.
 */
export function dbAs(user: DbUser | null): UserDb {
  return createUserClient(user)
}

/**
 * Runs `fn` in one transaction with row-level security as `user` (or anon).
 * Keep the callback short: it holds a database connection until it returns.
 */
export async function withUserTransaction<T>(
  user: DbUser | null,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return getAdminClient().$transaction(async (tx) => {
    await setIdentity(tx, user)
    return fn(tx)
  })
}

/** True when `error` is Prisma's "record to update/delete was not found". */
export function isRecordNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025'
}

/** True when `error` is a unique constraint violation. */
export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}
