import { test, expect } from '@playwright/test';
import { DEMO_ACCOUNTS } from '@/lib/constants/demo-accounts';

test.describe('Demo Login', () => {
  test('should allow demo patient login', async ({ page }) => {
    await page.goto('/');
    
    // Click the demo login button
    await page.getByRole('button', { name: /demo patient/i }).click();
    
    // Wait for login to complete and redirect
    await page.waitForURL('/patient/dashboard');
    
    // Verify we're logged in as demo patient
    const userEmail = await page.getByTestId('user-email').textContent();
    expect(userEmail).toBe(DEMO_ACCOUNTS.patient.email);
  });

  test('should allow demo doctor login', async ({ page }) => {
    await page.goto('/');
    
    // Click the demo login button
    await page.getByRole('button', { name: /demo doctor/i }).click();
    
    // Wait for login to complete and redirect
    await page.waitForURL('/dashboard');
    
    // Verify we're logged in as demo doctor
    const userEmail = await page.getByTestId('user-email').textContent();
    expect(userEmail).toBe(DEMO_ACCOUNTS.doctor.email);
  });
}); 