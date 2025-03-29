import { Page } from '@playwright/test'
import { DEMO_ACCOUNTS } from '@/lib/constants/demo-accounts'

export type UserType = 'patient' | 'doctor'

export async function loginAsDemoUser(page: Page, userType: UserType) {
  await page.goto('/')
  await page.getByRole('button', { name: new RegExp(`demo ${userType}`, 'i') }).click()
  await page.waitForURL(userType === 'patient' ? '/patient/dashboard' : '/dashboard')
  return DEMO_ACCOUNTS[userType].email
}

export async function loginWithCredentials(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')
} 