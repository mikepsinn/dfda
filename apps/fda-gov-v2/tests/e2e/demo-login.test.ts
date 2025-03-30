import { test, expect } from '@playwright/test';
import { DEMO_ACCOUNTS } from '@/lib/constants/demo-accounts';
import { loginAsDemoUser } from './helpers';

test.describe('Demo Login', () => {
  test('should allow demo patient login', async ({ page }) => {
    const userEmail = await loginAsDemoUser(page, 'patient');
    const displayedEmail = await page.getByTestId('user-email').textContent();
    expect(displayedEmail).toBe(userEmail);
  });

  test('should allow demo provider login', async ({ page }) => {
    const userEmail = await loginAsDemoUser(page, 'provider');
    const displayedEmail = await page.getByTestId('user-email').textContent();
    expect(displayedEmail).toBe(userEmail);
  });
}); 