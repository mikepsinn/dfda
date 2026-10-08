import { CreateBucketCommand, NotFound, S3Client } from '@aws-sdk/client-s3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ensureBucket must send the region when it creates a bucket on AWS outside
// us-east-1, or AWS refuses the request.

async function createdBucketInput(env: Record<string, string | undefined>) {
  vi.resetModules()
  delete (globalThis as { storage?: unknown }).storage
  for (const [name, value] of Object.entries(env)) {
    vi.stubEnv(name, value)
  }
  const send = vi.spyOn(S3Client.prototype, 'send').mockImplementation(async (command) => {
    if (command instanceof CreateBucketCommand) {
      return {}
    }
    throw new NotFound({ message: 'Not Found', $metadata: { httpStatusCode: 404 } })
  })
  const { ensureBucket } = await import('@/lib/storage')
  await ensureBucket()
  const create = send.mock.calls.map(([command]) => command).find((command) => command instanceof CreateBucketCommand)
  return (create as CreateBucketCommand).input
}

describe('ensureBucket', () => {
  beforeEach(() => vi.stubEnv('S3_BUCKET', 'test-bucket'))
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    delete (globalThis as { storage?: unknown }).storage
  })

  it('sends the region for an AWS bucket outside us-east-1', async () => {
    const input = await createdBucketInput({ S3_REGION: 'eu-west-1', S3_ENDPOINT: '' })
    expect(input.CreateBucketConfiguration).toEqual({ LocationConstraint: 'eu-west-1' })
  })

  it('sends no region for us-east-1 or for other S3-compatible services', async () => {
    expect((await createdBucketInput({ S3_REGION: 'us-east-1', S3_ENDPOINT: '' })).CreateBucketConfiguration).toBeUndefined()
    expect(
      (await createdBucketInput({ S3_REGION: 'auto', S3_ENDPOINT: 'https://example.r2.cloudflarestorage.com' }))
        .CreateBucketConfiguration,
    ).toBeUndefined()
  })
})
