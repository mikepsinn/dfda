import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the sign-in page before each test
    await page.goto('/signin');
  });

  test('should show sign-in page', async ({ page }) => {
    // Verify the page title
    await expect(page).toHaveTitle('Sign In');

    // Verify welcome text
    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.getByText('Enter your email to sign in to your account')).toBeVisible();
  });

  test('should show email sign-in form', async ({ page }) => {
    // Check if email input exists
    const emailInput = page.getByPlaceholder('name@example.com');
    await expect(emailInput).toBeVisible();
    
    // Check if sign-in button exists
    const signInButton = page.getByRole('button', { name: 'Sign In with Email' });
    await expect(signInButton).toBeVisible();
  });

  test('should show OAuth providers', async ({ page }) => {
    // Check if GitHub sign-in button exists
    const githubButton = page.getByRole('button', { name: 'GitHub' });
    await expect(githubButton).toBeVisible();

    // Check if Google sign-in button exists
    const googleButton = page.getByRole('button', { name: 'Google' });
    await expect(googleButton).toBeVisible();
  });

  test('should handle email submission', async ({ page }) => {
    // Fill in the email
    const emailInput = page.getByPlaceholder('name@example.com');
    await emailInput.fill('test@example.com');

    // Click the sign-in button
    const signInButton = page.getByRole('button', { name: 'Sign In with Email' });
    await signInButton.click();

    // Check for success toast
    await expect(page.getByText('Check your email')).toBeVisible();
    await expect(page.getByText('We sent you a login link. Be sure to check your spam too.')).toBeVisible();
  });

  test('should handle invalid email submission', async ({ page }) => {
    // Fill in an invalid email
    const emailInput = page.getByPlaceholder('name@example.com');
    await emailInput.fill('invalid-email');

    // Click the sign-in button
    const signInButton = page.getByRole('button', { name: 'Sign In with Email' });
    await signInButton.click();

    // The browser's built-in validation should prevent submission
    // We can check if the form wasn't submitted by verifying the URL hasn't changed
    await expect(page).toHaveURL('/signin');
  });

  test('should have working back to home link', async ({ page }) => {
    // Click the "Back to home" link
    await page.getByRole('link', { name: 'Back to home' }).click();

    // Verify we're redirected to the home page
    await expect(page).toHaveURL('/');
  });
}); 