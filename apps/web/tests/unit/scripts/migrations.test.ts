// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { skipMigrationsOnBuild } from '@/scripts/lib/migrations'

describe('migrations in the build', () => {
  it('run on a production build on Vercel', () => {
    expect(skipMigrationsOnBuild({ VERCEL_ENV: 'production' })).toBeNull()
  })

  it('run on a preview build only when each preview has its own database branch', () => {
    expect(skipMigrationsOnBuild({ VERCEL_ENV: 'preview' })).toMatch(/production database/)
    expect(skipMigrationsOnBuild({ VERCEL_ENV: 'preview', MIGRATE_PREVIEW_DATABASE: '1' })).toBeNull()
  })

  it('skip development, CI and local builds, with the reason', () => {
    expect(skipMigrationsOnBuild({ VERCEL_ENV: 'development' })).toMatch(/development build/)
    expect(skipMigrationsOnBuild({ CI: 'true' })).toMatch(/not a Vercel build/)
    expect(skipMigrationsOnBuild({})).toMatch(/not a Vercel build/)
  })

  it('skip any build when SKIP_DB_MIGRATIONS=1 is set', () => {
    expect(skipMigrationsOnBuild({ VERCEL_ENV: 'production', SKIP_DB_MIGRATIONS: '1' })).toMatch(/SKIP_DB_MIGRATIONS/)
  })
})
