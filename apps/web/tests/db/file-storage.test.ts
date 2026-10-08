import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { adminDb, type DbUser } from '@/lib/db'
import { getServerUser } from '@/lib/server-auth'
import { createUploadUrlAction, recordUploadMetadata } from '@/lib/actions/file-upload-actions'
import {
  MAX_UPLOAD_BYTES,
  deleteStoredFiles,
  ensureBucket,
  getStoredFileInfo,
  uploadUserFile,
  userFileKey,
} from '@/lib/storage'

// Runs against the database from scripts/db-plain-setup.ts and an
// S3-compatible server (S3_ENDPOINT, S3_BUCKET, ...). See `pnpm test:db`.

vi.mock('@/lib/server-auth', () => ({ getServerUser: vi.fn() }))

const userA: DbUser = { id: randomUUID(), email: `storage-a-${Date.now()}@example.com` }
const userB: DbUser = { id: randomUUID(), email: `storage-b-${Date.now()}@example.com` }

function signInAs(user: DbUser | null) {
  vi.mocked(getServerUser).mockResolvedValue(
    user ? ({ id: user.id, email: user.email } as Awaited<ReturnType<typeof getServerUser>>) : null,
  )
}

async function uploadThroughBrowserFlow(content: string, type = 'text/plain') {
  const target = await createUploadUrlAction({ name: 'notes.txt', type, size: content.length })
  if ('error' in target) {
    throw new Error(target.error)
  }
  const response = await fetch(target.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': type },
    body: content,
  })
  return { target, response }
}

beforeAll(async () => {
  await ensureBucket()
  for (const user of [userA, userB]) {
    await adminDb.$executeRaw`
      INSERT INTO auth.users (id, email, raw_user_meta_data)
      VALUES (${user.id}::uuid, ${user.email}, '{"user_type":"patient"}'::jsonb)`
  }
})

beforeEach(() => signInAs(userA))

afterAll(async () => {
  const files = await adminDb.uploaded_files.findMany({
    where: { uploader_user_id: { in: [userA.id, userB.id] } },
    select: { storage_path: true },
  })
  await deleteStoredFiles(files.map((file) => file.storage_path))
  await adminDb.$executeRaw`DELETE FROM auth.users WHERE id IN (${userA.id}::uuid, ${userB.id}::uuid)`
  await adminDb.$disconnect()
})

describe('file storage', () => {
  it('uploads from the browser with a signed URL and records the stored size and type', async () => {
    const { target, response } = await uploadThroughBrowserFlow('hello storage')
    expect(response.ok).toBe(true)
    expect(target.storagePath.startsWith(`${userA.id}/`)).toBe(true)

    const fileId = await recordUploadMetadata({ storage_path: target.storagePath, file_name: 'notes.txt' })
    expect(fileId).not.toBeNull()

    const record = await adminDb.uploaded_files.findUniqueOrThrow({ where: { id: fileId! } })
    expect(record.uploader_user_id).toBe(userA.id)
    expect(Number(record.size_bytes)).toBe('hello storage'.length)
    expect(record.mime_type).toBe('text/plain')
  })

  it("does not record a file in another user's folder", async () => {
    signInAs(userB)
    const { target } = await uploadThroughBrowserFlow('belongs to B')

    signInAs(userA)
    expect(await recordUploadMetadata({ storage_path: target.storagePath, file_name: 'stolen.txt' })).toBeNull()
    expect(await adminDb.uploaded_files.count({ where: { storage_path: target.storagePath } })).toBe(0)
  })

  it('does not record a file that was never uploaded', async () => {
    const key = userFileKey(userA.id, 'missing.txt')
    expect(await recordUploadMetadata({ storage_path: key, file_name: 'missing.txt' })).toBeNull()
  })

  it('refuses upload URLs to visitors who are not signed in and for files that are too large', async () => {
    signInAs(null)
    expect(await createUploadUrlAction({ name: 'a.txt', type: 'text/plain', size: 10 })).toHaveProperty('error')

    signInAs(userA)
    expect(
      await createUploadUrlAction({ name: 'big.bin', type: 'application/octet-stream', size: MAX_UPLOAD_BYTES + 1 }),
    ).toHaveProperty('error')
    expect(await createUploadUrlAction({ name: 'empty.txt', type: 'text/plain', size: 0 })).toHaveProperty('error')
  })

  it('signs the content type into the upload URL and adds no checksum', async () => {
    // The storage service enforces the signature, so a browser cannot upload a
    // different content type. (The test server does not check signatures.)
    const target = await createUploadUrlAction({ name: 'scan.png', type: 'image/png', size: 4 })
    if ('error' in target) throw new Error(target.error)
    const params = new URL(target.uploadUrl).searchParams
    expect(params.get('X-Amz-SignedHeaders')).toBe('content-type;host')
    expect([...params.keys()].some((key) => key.toLowerCase().startsWith('x-amz-checksum'))).toBe(false)
  })

  it('uploads on the server and deletes stored files', async () => {
    const key = await uploadUserFile(userA.id, new File(['image bytes'], 'photo.jpg', { type: 'image/jpeg' }))
    expect(await getStoredFileInfo(key)).toEqual({ size: 'image bytes'.length, contentType: 'image/jpeg' })

    await deleteStoredFiles([key])
    expect(await getStoredFileInfo(key)).toBeNull()
  })
})
