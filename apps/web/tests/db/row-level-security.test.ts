import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { adminDb, dbAs, withUserTransaction, type DbUser } from '@/lib/db'
import { timeOfDayFromString, timeOfDayToString } from '@/lib/time-of-day'

// Runs against a database built by scripts/db-plain-setup.ts (see `pnpm test:db`).

const userA: DbUser = { id: randomUUID(), email: `rls-a-${Date.now()}@example.com` }
const userB: DbUser = { id: randomUUID(), email: `rls-b-${Date.now()}@example.com` }

let globalVariableId: string
let unitId: string

async function createAuthUser(user: DbUser) {
  // The on_auth_user_created trigger creates the profile and patient rows.
  await adminDb.$executeRaw`
    INSERT INTO auth.users (id, email, raw_user_meta_data)
    VALUES (${user.id}::uuid, ${user.email}, '{"user_type":"patient"}'::jsonb)`
}

async function createMeasurement(user: DbUser) {
  return dbAs(user).measurements.create({
    data: {
      user_id: user.id,
      global_variable_id: globalVariableId,
      unit_id: unitId,
      value: 4,
      start_at: new Date(),
    },
  })
}

beforeAll(async () => {
  const variable = await adminDb.global_variables.findFirstOrThrow({
    where: { deleted_at: null },
    select: { id: true, default_unit_id: true },
    orderBy: { id: 'asc' },
  })
  globalVariableId = variable.id
  unitId = variable.default_unit_id
  await createAuthUser(userA)
  await createAuthUser(userB)
})

afterAll(async () => {
  // Deleting the auth users deletes their profiles and, by cascade, their rows.
  await adminDb.$executeRaw`DELETE FROM auth.users WHERE id IN (${userA.id}::uuid, ${userB.id}::uuid)`
  await adminDb.$disconnect()
})

describe('row-level security through lib/db', () => {
  it('creates a profile and patient record for a new auth user', async () => {
    const profile = await adminDb.profiles.findUnique({ where: { id: userA.id } })
    expect(profile?.email).toBe(userA.email)
    expect(await adminDb.patients.count({ where: { id: userA.id } })).toBe(1)
  })

  it('shows a user only their own measurements', async () => {
    const measurement = await createMeasurement(userA)

    expect(await dbAs(userA).measurements.count({ where: { id: measurement.id } })).toBe(1)
    expect(await dbAs(userB).measurements.count({ where: { id: measurement.id } })).toBe(0)
    expect(await dbAs(null).measurements.count({ where: { id: measurement.id } })).toBe(0)
    expect(await adminDb.measurements.count({ where: { id: measurement.id } })).toBe(1)
  })

  it('rejects a measurement written for another user', async () => {
    await expect(
      dbAs(userB).measurements.create({
        data: {
          user_id: userA.id,
          global_variable_id: globalVariableId,
          unit_id: unitId,
          value: 1,
          start_at: new Date(),
        },
      }),
    ).rejects.toThrow()
  })

  it("does not change another user's profile", async () => {
    const result = await dbAs(userB).profiles.updateMany({
      where: { id: userA.id },
      data: { first_name: 'Changed' },
    })
    expect(result.count).toBe(0)
    const profile = await adminDb.profiles.findUniqueOrThrow({ where: { id: userA.id } })
    expect(profile.first_name).not.toBe('Changed')
  })

  it('lets anonymous visitors read public reference data', async () => {
    expect(await dbAs(null).global_variables.count()).toBeGreaterThan(0)
    expect(await dbAs(null).units.count()).toBeGreaterThan(0)
  })

  it('keeps the identity inside a transaction and resets it afterwards', async () => {
    const identity = await withUserTransaction(userA, async (tx) => {
      const rows = await tx.$queryRaw<{ uid: string | null; role: string }[]>`
        SELECT auth.uid()::text AS uid, current_user AS role`
      return rows[0]
    })
    expect(identity).toEqual({ uid: userA.id, role: 'authenticated' })

    await dbAs(userA).measurements.count()
    const after = await adminDb.$queryRaw<{ claims: string | null; role: string }[]>`
      SELECT nullif(current_setting('request.jwt.claims', true), '') AS claims, current_user AS role`
    expect(after[0].claims).toBeNull()
    expect(after[0].role).not.toBe('authenticated')
  })

  it('stores reminder times of day without a time zone shift', async () => {
    const userVariable = await dbAs(userA).user_variables.create({
      data: { user_id: userA.id, global_variable_id: globalVariableId },
    })
    const schedule = await dbAs(userA).reminder_schedules.create({
      data: {
        user_id: userA.id,
        user_variable_id: userVariable.id,
        rrule: 'FREQ=DAILY',
        time_of_day: timeOfDayFromString('08:30'),
        start_date: new Date(),
      },
    })
    const stored = await dbAs(userA).reminder_schedules.findUniqueOrThrow({ where: { id: schedule.id } })
    expect(timeOfDayToString(stored.time_of_day)).toBe('08:30:00')
    expect(await dbAs(userB).reminder_schedules.count({ where: { id: schedule.id } })).toBe(0)
  })

  it("hides a patient's conditions from other users in patient_conditions_view", async () => {
    const condition = await adminDb.global_conditions.findFirstOrThrow({
      where: { deleted_at: null },
      select: { id: true },
      orderBy: { id: 'asc' },
    })
    const userVariable = await dbAs(userA).user_variables.upsert({
      where: { user_id_global_variable_id: { user_id: userA.id, global_variable_id: condition.id } },
      create: { user_id: userA.id, global_variable_id: condition.id },
      update: {},
    })
    const patientCondition = await dbAs(userA).patient_conditions.create({
      data: { patient_id: userA.id, condition_id: condition.id, user_variable_id: userVariable.id },
    })

    expect(await dbAs(userA).patient_conditions_view.count({ where: { id: patientCondition.id } })).toBe(1)
    expect(await dbAs(userB).patient_conditions_view.count({ where: { id: patientCondition.id } })).toBe(0)
    expect(await dbAs(null).patient_conditions_view.count({ where: { id: patientCondition.id } })).toBe(0)
  })

  it('deletes the profile when the auth user is deleted', async () => {
    const temporary: DbUser = { id: randomUUID(), email: `rls-temp-${Date.now()}@example.com` }
    await createAuthUser(temporary)
    await adminDb.$executeRaw`DELETE FROM auth.users WHERE id = ${temporary.id}::uuid`
    expect(await adminDb.profiles.count({ where: { id: temporary.id } })).toBe(0)
  })
})
