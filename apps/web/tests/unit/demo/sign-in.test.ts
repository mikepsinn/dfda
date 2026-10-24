// @vitest-environment node
import { describe, expect, it } from 'vitest'
import demo from '@/scripts/demo-data.json'
import { demoButtonsFor } from '@/lib/demo/sign-in'

describe('demoButtonsFor', () => {
  it("shows every demo account on the network's site, the demo clinic's roles on its own site, and none on a real company's site", () => {
    expect(demoButtonsFor(null)).toBe('network')
    expect(demoButtonsFor({ id: demo.instance.id, demoEnabled: false })).toBe('clinic')
    expect(demoButtonsFor({ id: '00000000-0000-4000-8000-000000000001', demoEnabled: false })).toBeNull()
  })

  it("shows a company site's own demo when its owner turned it on", () => {
    expect(demoButtonsFor({ id: '00000000-0000-4000-8000-000000000001', demoEnabled: true })).toBe('site')
  })
})
