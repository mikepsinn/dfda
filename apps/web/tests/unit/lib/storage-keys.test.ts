import { describe, expect, it } from 'vitest'
import { isUserFileKey, userFileKey } from '@/lib/storage'

const userA = '11111111-1111-4111-8111-111111111111'
const userB = '22222222-2222-4222-8222-222222222222'

describe('storage keys', () => {
  it("puts each file in the user's folder under a random name", () => {
    const key = userFileKey(userA, 'Lab Report.PDF')
    expect(key).toMatch(new RegExp(`^${userA}/[0-9a-f-]{36}\\.pdf$`))
    expect(userFileKey(userA, 'Lab Report.PDF')).not.toBe(key)
  })

  it('uses a safe extension', () => {
    expect(userFileKey(userA, 'photo')).toMatch(/\.bin$/)
    expect(userFileKey(userA, 'x.sh;rm -rf')).toMatch(/\.bin$/)
  })

  it('accepts only keys in the given user folder', () => {
    const key = userFileKey(userA, 'scan.jpg')
    expect(isUserFileKey(userA, key)).toBe(true)
    expect(isUserFileKey(userB, key)).toBe(false)
    expect(isUserFileKey(userA, `${userA}/../${userB}/x.jpg`)).toBe(false)
    expect(isUserFileKey(userA, `${userA}/notes.txt`)).toBe(false)
    expect(isUserFileKey(userA, `${userA}/${userB}/${userB}.jpg`)).toBe(false)
  })
})
