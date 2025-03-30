import { Page } from '@playwright/test'
import { DEMO_ACCOUNTS } from '@/lib/constants/demo-accounts'
import { createLogger } from '@/lib/logger'

const logger = createLogger('e2e-helpers')

export type UserType = 'patient' | 'provider'

export async function loginAsDemoUser(page: Page, userType: UserType) {
  logger.info('Starting demo login flow', { userType })
  
  await page.goto('/login')
  logger.debug('Navigated to login page')
  
  await page.getByRole('button', { name: `Try Demo as ${userType.charAt(0).toUpperCase() + userType.slice(1)}` }).click()
  logger.debug('Clicked demo login button')
  
  await page.waitForURL(userType === 'patient' ? '/patient/dashboard' : '/dashboard')
  logger.debug('Redirected to dashboard')
  
  // Wait for user email to be visible
  await page.getByTestId('user-email').waitFor({ state: 'visible' })
  logger.info('Demo login successful', { email: DEMO_ACCOUNTS[userType].email })
  
  return DEMO_ACCOUNTS[userType].email
}

export async function loginWithCredentials(page: Page, email: string, password: string) {
  logger.info('Starting credential login flow', { email })
  
  await page.goto('/login')
  logger.debug('Navigated to login page')
  
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  logger.debug('Filled login form')
  
  await page.click('button[type="submit"]')
  logger.debug('Submitted login form')
  
  await page.waitForURL('/dashboard')
  logger.info('Credential login successful', { email })
} 