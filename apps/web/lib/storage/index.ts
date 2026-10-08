import { randomUUID } from 'node:crypto'
import {
  CreateBucketCommand,
  DeleteObjectsCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { logger } from '@/lib/logger'

/**
 * File storage in a private S3-compatible bucket: AWS S3, Cloudflare R2,
 * Google Cloud Storage (S3 interoperability), MinIO, or the S3 endpoint of
 * Supabase Storage.
 *
 * Each user's files are stored under "<userId>/". The bucket has no per-user
 * rules, so server code must pass the session user's ID and check the prefix
 * (isUserFileKey) before it records or deletes a file for a user.
 *
 * Settings: S3_BUCKET (required), S3_REGION, S3_ENDPOINT, S3_ACCESS_KEY_ID,
 * S3_SECRET_ACCESS_KEY and S3_FORCE_PATH_STYLE. Without access keys the AWS
 * default credential chain is used.
 */

/** Largest file a browser may upload through createUserUploadUrl. */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024

/** How long a signed upload URL stays valid. */
const UPLOAD_URL_TTL_SECONDS = 5 * 60

type Storage = { client: S3Client; bucket: string }

const globalForStorage = globalThis as unknown as { storage?: Storage }

function createStorage(): Storage {
  const bucket = process.env.S3_BUCKET
  if (!bucket) {
    throw new Error('S3_BUCKET is not set')
  }
  const accessKeyId = process.env.S3_ACCESS_KEY_ID
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY
  const client = new S3Client({
    region: process.env.S3_REGION || 'us-east-1',
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
    // Only send checksums when an operation requires them. The default adds a
    // checksum to signed upload URLs that browser uploads cannot match, and
    // several S3-compatible services reject the extra headers.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  })
  return { client, bucket }
}

function getStorage(): Storage {
  globalForStorage.storage ??= createStorage()
  return globalForStorage.storage
}

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
const USER_FILE_KEY = new RegExp(`^(${UUID})/${UUID}\\.[a-z0-9]{1,10}$`)

/** A new storage key for a file of `userId`: "<userId>/<random uuid>.<extension>". */
export function userFileKey(userId: string, fileName: string): string {
  const extension = fileName.includes('.') ? fileName.split('.').pop()!.toLowerCase() : ''
  const safeExtension = /^[a-z0-9]{1,10}$/.test(extension) ? extension : 'bin'
  return `${userId}/${randomUUID()}.${safeExtension}`
}

/** True when `key` is a key that userFileKey made for `userId`. */
export function isUserFileKey(userId: string, key: string): boolean {
  const match = USER_FILE_KEY.exec(key)
  return match !== null && match[1] === userId.toLowerCase()
}

/** Uploads a file into the user's folder and returns its storage key. */
export async function uploadUserFile(userId: string, file: File): Promise<string> {
  const { client, bucket } = getStorage()
  const key = userFileKey(userId, file.name)
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type || 'application/octet-stream',
    }),
  )
  logger.info('File uploaded to storage', { userId, key })
  return key
}

/**
 * Returns a signed URL that lets the browser PUT one file into the user's
 * folder. The Content-Type header is part of the signature, so the browser
 * must send the same value.
 */
export async function createUserUploadUrl(
  userId: string,
  file: { name: string; type: string },
): Promise<{ key: string; url: string }> {
  const { client, bucket } = getStorage()
  const key = userFileKey(userId, file.name)
  const url = await getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: file.type || 'application/octet-stream' }),
    { expiresIn: UPLOAD_URL_TTL_SECONDS, signableHeaders: new Set(['content-type']) },
  )
  return { key, url }
}

/** Size and content type of a stored file, or null when it does not exist. */
export async function getStoredFileInfo(key: string): Promise<{ size: number; contentType: string } | null> {
  const { client, bucket } = getStorage()
  try {
    const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    return { size: head.ContentLength ?? 0, contentType: head.ContentType ?? 'application/octet-stream' }
  } catch (error) {
    if (error instanceof NotFound || (error instanceof S3ServiceException && error.$metadata.httpStatusCode === 404)) {
      return null
    }
    throw error
  }
}

/**
 * Deletes stored files. Failures are logged, not thrown, because callers use
 * this to clean up after another error.
 */
export async function deleteStoredFiles(keys: string[]): Promise<void> {
  if (keys.length === 0) {
    return
  }
  try {
    const { client, bucket } = getStorage()
    const result = await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
      }),
    )
    if (result.Errors?.length) {
      logger.error('Failed to delete some stored files', { keys, errors: result.Errors })
    } else {
      logger.info('Deleted stored files', { keys })
    }
  } catch (error) {
    logger.error('Failed to delete stored files', { keys, error })
  }
}

/** Creates the bucket when it does not exist. For setup scripts and tests. */
export async function ensureBucket(): Promise<void> {
  const { client, bucket } = getStorage()
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }))
  } catch (error) {
    if (!(error instanceof NotFound || (error instanceof S3ServiceException && error.$metadata.httpStatusCode === 404))) {
      throw error
    }
    await client.send(new CreateBucketCommand({ Bucket: bucket }))
    logger.info('Created storage bucket', { bucket })
  }
}
