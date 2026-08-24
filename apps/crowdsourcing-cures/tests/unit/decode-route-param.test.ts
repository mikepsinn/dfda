import { decodeRouteParam } from '@/lib/decode-route-param'

describe('decodeRouteParam', () => {
  it('decodes valid route parameters', () => {
    expect(decodeRouteParam('Overall%20Mood')).toBe('Overall Mood')
  })

  it.each(['%', '%2', '%ZZ'])('rejects malformed encoding in %s', (value) => {
    expect(decodeRouteParam(value)).toBeNull()
  })
})
