import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { adminDb, dbAs, type DbUser } from '@/lib/db'
import { getServerUser } from '@/lib/server-auth'
import { saveVariableMeasurementsFromImageAction } from '@/lib/actions/save-variable-measurements-from-image'
import { deleteStoredFiles, ensureBucket } from '@/lib/storage'

// The photo import on the patient dashboard (components/shared/ImageAnalysisCapture.tsx)
// adds catalog rows as the signed-in user. Runs against the database from
// scripts/db-plain-setup.ts and an S3-compatible server. See `pnpm test:db`.

vi.mock('@/lib/server-auth', () => ({ getServerUser: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const user: DbUser = { id: randomUUID(), email: `photo-import-${Date.now()}@example.com` }
const treatmentName = `Photo import test tablet ${Date.now()}`
let treatmentId: string | undefined

function treatmentPhoto(brand: string) {
  const form = new FormData()
  form.set('userId', user.id)
  form.set('type', 'treatment')
  form.set('name', treatmentName)
  form.set('brand', brand)
  form.set('dosage_form', 'Tablet')
  form.set('image_primary', new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'front.png', { type: 'image/png' }))
  return form
}

/** The treatment that the first test saved. Without it, a filter on `undefined` would match every row. */
function savedTreatmentId() {
  if (!treatmentId) throw new Error('The photo import did not save the treatment.')
  return treatmentId
}

async function saveTreatmentPhoto(brand: string) {
  const result = await saveVariableMeasurementsFromImageAction(treatmentPhoto(brand))
  if (!result.success) throw new Error(result.error)
  treatmentId = result.data.globalVariableId
  return result.data
}

beforeAll(async () => {
  await ensureBucket()
  await adminDb.$executeRaw`
    INSERT INTO auth.users (id, email, raw_user_meta_data)
    VALUES (${user.id}::uuid, ${user.email}, '{"user_type":"patient"}'::jsonb)`
})

beforeEach(() => {
  vi.mocked(getServerUser).mockResolvedValue({ id: user.id, email: user.email } as Awaited<ReturnType<typeof getServerUser>>)
})

afterAll(async () => {
  const files = await adminDb.uploaded_files.findMany({ where: { uploader_user_id: user.id }, select: { storage_path: true } })
  await deleteStoredFiles(files.map((file) => file.storage_path))
  await adminDb.patient_treatments.deleteMany({ where: { patient_id: user.id } })
  await adminDb.$executeRaw`DELETE FROM auth.users WHERE id = ${user.id}::uuid`
  if (treatmentId) {
    await adminDb.products.deleteMany({ where: { global_variable_id: treatmentId } })
    await adminDb.global_treatments.deleteMany({ where: { id: treatmentId } })
    await adminDb.global_variable_synonyms.deleteMany({ where: { global_variable_id: treatmentId } })
    await adminDb.global_variables.deleteMany({ where: { id: treatmentId } })
  }
  await adminDb.$disconnect()
})

describe('the photo import of a treatment', () => {
  it('adds the treatment, its details and the patient treatment', async () => {
    const saved = await saveTreatmentPhoto('Example Pharma')

    expect(await adminDb.global_treatments.findUniqueOrThrow({ where: { id: saved.globalVariableId } })).toMatchObject({
      treatment_type: 'medication',
      manufacturer: 'Example Pharma',
      dosage_form: 'Tablet',
    })
    expect(await adminDb.patient_treatments.count({ where: { patient_id: user.id, treatment_id: saved.globalVariableId } })).toBe(1)
  })

  it('changes the details from a later photo of a treatment that the user tracks', async () => {
    const saved = await saveTreatmentPhoto('Example Pharma Ltd')

    expect(await adminDb.global_treatments.findUniqueOrThrow({ where: { id: saved.globalVariableId } })).toMatchObject({
      manufacturer: 'Example Pharma Ltd',
    })
  })

  it('does not let the user delete the treatment details', async () => {
    const id = savedTreatmentId()
    expect((await dbAs(user).global_treatments.deleteMany({ where: { id } })).count).toBe(0)
    expect(await adminDb.global_treatments.count({ where: { id } })).toBe(1)
  })
})
