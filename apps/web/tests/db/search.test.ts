import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { adminDb, type DbUser } from '@/lib/db'
import { getServerUser } from '@/lib/server-auth'
import { searchVariablesAction } from '@/lib/actions/search'

// The site search links each result to a page that exists. Runs against the
// database from scripts/db-plain-setup.ts. See `pnpm test:db`.

vi.mock('@/lib/server-auth', () => ({ getServerUser: vi.fn() }))

const user: DbUser = { id: randomUUID(), email: `search-${Date.now()}@example.com` }

let condition: { id: string; name: string }
let treatment: { id: string; name: string }
let plain: { id: string; name: string }

function signInAs(person: DbUser | null) {
  vi.mocked(getServerUser).mockResolvedValue(
    person ? ({ id: person.id, email: person.email } as Awaited<ReturnType<typeof getServerUser>>) : null,
  )
}

beforeAll(async () => {
  await adminDb.$executeRaw`
    INSERT INTO auth.users (id, email, raw_user_meta_data)
    VALUES (${user.id}::uuid, ${user.email}, '{"user_type":"patient"}'::jsonb)`
  const select = { id: true, name: true } as const
  condition = await adminDb.global_variables.findFirstOrThrow({ where: { global_conditions: { isNot: null } }, select, orderBy: { id: 'asc' } })
  treatment = await adminDb.global_variables.findFirstOrThrow({ where: { global_treatments: { isNot: null } }, select, orderBy: { id: 'asc' } })
  // A variable that is neither a condition nor a treatment has no public page.
  plain = await adminDb.global_variables.findFirstOrThrow({
    where: { global_conditions: { is: null }, global_treatments: { is: null }, deleted_at: null },
    select,
    orderBy: { id: 'asc' },
  })
})

afterAll(async () => {
  await adminDb.$executeRaw`DELETE FROM auth.users WHERE id = ${user.id}::uuid`
  await adminDb.$disconnect()
})

describe('site search', () => {
  it("links a condition to its trials page and a treatment to its page", async () => {
    signInAs(null)
    expect(await searchVariablesAction(condition.name)).toContainEqual(
      expect.objectContaining({ id: condition.id, kind: 'condition', href: `/conditions/${encodeURIComponent(condition.id)}/trials` }),
    )
    expect(await searchVariablesAction(treatment.name)).toContainEqual(
      expect.objectContaining({ id: treatment.id, kind: 'treatment', href: `/treatments/${encodeURIComponent(treatment.id)}` }),
    )
  })

  it('leaves out variables that have no page, unless they are the signed-in person’s own', async () => {
    signInAs(null)
    expect((await searchVariablesAction(plain.name)).map((result) => result.id)).not.toContain(plain.id)

    signInAs(user)
    const userVariable = await adminDb.user_variables.create({
      data: { user_id: user.id, global_variable_id: plain.id },
      select: { id: true },
    })
    expect(await searchVariablesAction(plain.name, user.id)).toContainEqual(
      expect.objectContaining({ id: plain.id, category: 'My Variables', href: `/patient/user-variables/${userVariable.id}` }),
    )
  })
})
