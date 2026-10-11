import { expect, test as setup } from '@playwright/test'
import { COMPANY_STATE, MEMBER_STATE, demo, memberEmail } from './demo'

for (const [name, email, path] of [
  ['company', demo.company.email, COMPANY_STATE],
  ['member', memberEmail(1), MEMBER_STATE],
] as const) {
  setup(`sign in as the demo ${name}`, async ({ request }) => {
    const response = await request.post('/api/auth/sign-in/email', { data: { email, password: demo.password } })
    expect(response.ok(), `Sign-in as ${email}: HTTP ${response.status()}. Run pnpm db:seed:demo first.`).toBe(true)
    await request.storageState({ path })
  })
}
