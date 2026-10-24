import { expect, test } from '@playwright/test'
import { MEMBER_STATE, demo, onInstance } from './demo'

// The check-in chat (lib/programs/chat.ts) on the demo clinic, with the mock
// Claude API (tests/e2e/mock-claude.mjs): it calls record_values for the
// program's first rating, with 3, and then answers.

test('the demo patient checks in by chat, and the chat saves the value', async ({ page }) => {
  await page.goto(onInstance('/login'))
  await page.getByRole('button', { name: 'Demo clinic patient' }).click()
  await expect(page).toHaveURL(new RegExp(`/programs/${demo.program.template}/me$`))

  const chat = page.getByRole('region', { name: 'Check in by chat' })
  await chat.getByRole('button', { name: 'My energy is a 6 today' }).click()
  const log = chat.getByRole('log', { name: 'Chat' })
  await expect(log).toContainText('You: My energy is a 6 today')
  await expect(log.getByText('Saved Energy 3.')).toBeVisible()
  await expect(log).toContainText('Chat: Thank you. I saved it for today.')

  // Typed, with the Enter key, once the chat can take the next message.
  await chat.getByRole('textbox', { name: 'Message' }).fill('And nausea is a 3')
  await expect(chat.getByRole('button', { name: 'Send' })).toBeEnabled()
  await chat.getByRole('textbox', { name: 'Message' }).press('Enter')
  await expect(chat.getByRole('textbox', { name: 'Message' })).toHaveValue('')
  await expect(log.getByText('Saved Energy 3.')).toHaveCount(2)
})

test('a member who is not a demo patient has no chat: their health data does not go to the Claude API', async ({ browser }) => {
  const page = await (await browser.newContext({ storageState: MEMBER_STATE })).newPage()
  await page.goto(onInstance(`/programs/${demo.program.template}/me`))
  await expect(page.getByRole('heading', { name: 'Record a day' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Check in by chat' })).toHaveCount(0)
})
