import demo from '@/scripts/demo-data.json'

/** The demo buttons that a sign-in page shows. */
export type DemoButtons = 'network' | 'clinic' | null

/**
 * The demo buttons of the sign-in page on a site: all demo accounts on the
 * network's own site, and the demo clinic's roles on the demo clinic's own
 * site, so that a visitor of the demo clinic can switch roles there. A real
 * company's site has none: its people would see the accounts of another
 * company.
 */
export function demoButtonsFor(instance: { id: string } | null): DemoButtons {
  if (!instance) return 'network'
  return instance.id === demo.instance.id ? 'clinic' : null
}
