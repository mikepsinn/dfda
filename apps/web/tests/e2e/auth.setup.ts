import { expect, test as setup } from '@playwright/test'
import { COMPANY_STATE, MEMBER_STATE, demo, memberEmail } from './demo'

for (const [name, email, path] of [
  ['company', demo.company.email, COMPANY_STATE],
  ['member', memberEmail(1), MEMBER_STATE],
] as const) {
  setup(`sign in as the demo ${name}`, async ({ request }) => {
    const signIn = () => request.post('/api/auth/sign-in/email', { data: { email, password: demo.password } })
    let response = await signIn()
    // The endpoint allows a few sign-ins per 10 seconds, so a second run soon after the first must wait.
    for (let attempt = 0; response.status() === 429 && attempt < 3; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 5_000))
      response = await signIn()
    }
    expect(response.ok(), `Sign-in as ${email}: HTTP ${response.status()}. Run pnpm db:seed:demo first.`).toBe(true)
    await request.storageState({ path })
  })
}
