import { test, expect } from '@playwright/test';
import { supabase, setupTestDatabase, cleanupTestData } from './setup/test-setup';

test.describe('Demo Login Flow', () => {
  test.beforeAll(async () => {
    await setupTestDatabase();
  });

  test.beforeEach(async () => {
    await cleanupTestData();
  });

  test('should login with demo account and redirect to dashboard', async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', msg => console.log(`Browser console: ${msg.text()}`));
    page.on('pageerror', err => console.error(`Browser error: ${err}`));

    // Start from the login page
    await page.goto('/login');
    console.log('Navigated to login page');
    
    // Wait for the page to be ready
    await page.waitForLoadState('networkidle');
    
    // Click the demo login button
    const demoButton = await page.getByRole('button', { name: /demo/i });
    await expect(demoButton).toBeVisible();
    await demoButton.click();
    console.log('Clicked demo button');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/patient/dashboard', { timeout: 30000 });
    console.log('Redirected to dashboard');
    
    // Verify we're on the dashboard
    expect(page.url()).toContain('/patient/dashboard');
    
    // Verify the demo user was created in the database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'demo-patient@dfda.earth')
      .single();
    
    expect(error).toBeNull();
    expect(profile).toBeTruthy();
    expect(profile.user_type).toBe('patient');
    expect(profile.first_name).toBe('Demo');
    expect(profile.last_name).toBe('Patient');
  });

  test('should handle demo login errors gracefully', async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', msg => console.log(`Browser console: ${msg.text()}`));
    page.on('pageerror', err => console.error(`Browser error: ${err}`));

    // Break the database connection temporarily
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:12345';
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const demoButton = await page.getByRole('button', { name: /demo/i });
    await expect(demoButton).toBeVisible();
    await demoButton.click();
    
    // Should show error message
    await expect(page.getByText(/failed to log in/i)).toBeVisible();
    
    // Restore the connection
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  });

  test.afterAll(async () => {
    await cleanupTestData();
  });
}); 