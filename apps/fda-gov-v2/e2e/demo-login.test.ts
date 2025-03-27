import { test, expect } from '@playwright/test';
import { supabase, setupTestDatabase, cleanupTestData } from './setup/test-setup';

// Helper function to log to both console and terminal
function log(...args: any[]) {
  console.log('[TEST]', ...args);
}

test.describe('Demo Login Flow', () => {
  test.beforeAll(async () => {
    log('Setting up test database...');
    await setupTestDatabase();
  });

  test.beforeEach(async () => {
    log('Cleaning up test data...');
    await cleanupTestData();
  });

  test('should login with demo account and redirect to dashboard', async ({ page }) => {
    // Enable verbose logging
    page.on('console', msg => {
      const text = msg.text();
      // Filter out noisy messages
      if (!text.includes('Download the React DevTools') && !text.includes('[Fast Refresh]')) {
        log('Browser console:', text);
      }
    });
    
    page.on('pageerror', err => {
      log('Browser error:', err);
      console.error('Browser error:', err);
    });
    
    // Log network requests
    page.on('request', request => {
      if (request.url().includes('supabase')) {
        log(`Request: ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', async response => {
      if (response.url().includes('supabase')) {
        const status = response.status();
        const url = response.url();
        log(`Response: ${status} ${url}`);
        
        // Log response body for non-200 responses
        if (status !== 200) {
          try {
            const body = await response.json();
            log('Response body:', body);
          } catch (e) {
            log('Could not parse response body');
          }
        }
      }
    });

    // Start from the login page
    log('Navigating to login page...');
    await page.goto('/login');
    
    // Wait for the page to be ready
    await page.waitForLoadState('networkidle');
    log('Page loaded');
    
    // Find and verify the demo button exists
    const demoButton = page.getByRole('button', { name: /demo/i });
    await expect(demoButton).toBeVisible({ timeout: 10000 });
    log('Demo button is visible');

    // Click the demo button
    await demoButton.click();
    log('Clicked demo button');

    // Wait for auth request to complete
    await page.waitForResponse(
      response => response.url().includes('supabase') && response.url().includes('auth'),
      { timeout: 10000 }
    );
    log('Auth request completed');

    // Check if we're still on the login page
    if (page.url().includes('/login')) {
      // Log any error messages that might be visible
      const errorText = await page.evaluate(() => document.body.innerText);
      log('Current page content:', errorText);
    }

    // Wait for redirect with increased timeout
    try {
      log('Waiting for redirect to dashboard...');
      await page.waitForURL(url => url.pathname === '/patient/dashboard', { 
        timeout: 60000,
        waitUntil: 'networkidle'
      });
      log('Successfully redirected to dashboard');
    } catch (error) {
      log('Redirect failed:', error);
      // Log the current URL
      log('Current URL:', page.url());
      // Take a screenshot
      const screenshotPath = 'redirect-failed.png';
      await page.screenshot({ path: screenshotPath });
      log('Screenshot saved to:', screenshotPath);
      throw error;
    }
    
    // Verify we're on the dashboard
    expect(page.url()).toContain('/patient/dashboard');
    
    // Verify the demo user was created in the database
    log('Verifying user in database...');
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'demo-patient@dfda.earth')
      .single();
    
    if (error) {
      log('Database error:', error);
    } else {
      log('Found user profile:', profile);
    }
    
    expect(error).toBeNull();
    expect(profile).toBeTruthy();
    expect(profile.user_type).toBe('patient');
    expect(profile.first_name).toBe('Demo');
    expect(profile.last_name).toBe('Patient');
    log('Test completed successfully');
  });

  test('should handle demo login errors gracefully', async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', msg => {
      const text = msg.text();
      if (!text.includes('Download the React DevTools') && !text.includes('[Fast Refresh]')) {
        log('Browser console:', text);
      }
    });
    
    page.on('pageerror', err => {
      log('Browser error:', err);
      console.error('Browser error:', err);
    });

    // Break the database connection temporarily
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    log('Setting invalid Supabase URL for error test');
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:12345';
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    log('Page loaded');
    
    const demoButton = await page.getByRole('button', { name: /demo/i });
    await expect(demoButton).toBeVisible();
    log('Demo button is visible');
    
    await demoButton.click();
    log('Clicked demo button');
    
    // Should show error message
    await expect(page.getByText(/failed to log in/i)).toBeVisible({ timeout: 10000 });
    log('Error message displayed as expected');
    
    // Restore the connection
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    log('Restored original Supabase URL');
  });

  test.afterAll(async () => {
    log('Final cleanup...');
    await cleanupTestData();
    log('Test suite completed');
  });
}); 