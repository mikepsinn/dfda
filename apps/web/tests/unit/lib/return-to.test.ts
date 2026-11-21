import { describe, expect, it } from 'vitest'
import { returnPath } from '@/lib/patient/return-to'

describe('returnPath', () => {
  it('goes back only to a page of the patient app', () => {
    expect(returnPath('/patient/history?category=x', '/patient')).toBe('/patient/history?category=x')
    expect(returnPath('https://example.com', '/patient')).toBe('/patient')
    expect(returnPath('//example.com/patient', '/patient')).toBe('/patient')
    expect(returnPath('/patients-elsewhere', '/patient')).toBe('/patient')
    expect(returnPath(undefined, '/patient/user-variables')).toBe('/patient/user-variables')
  })
})
