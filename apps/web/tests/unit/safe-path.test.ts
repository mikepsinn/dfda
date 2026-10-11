// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { safeLocalPath } from '@/lib/safe-path'

describe('safeLocalPath', () => {
  it.each(['/programs/glp-1', '/programs/glp-1/me?joined=1', '/'])('keeps the path %s', (path) => {
    expect(safeLocalPath(path)).toBe(path)
  })

  it.each(['//evil.example.com', '/\\evil.example.com', 'https://evil.example.com', 'programs', '', null, '/\u0000x'])(
    'refuses %s',
    (path) => {
      expect(safeLocalPath(path)).toBeNull()
    },
  )
})
