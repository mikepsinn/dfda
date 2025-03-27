import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Check if we have the main heading
    const heading = await page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    
    // Check if we have the search input
    const searchInput = await page.getByPlaceholder('Search conditions...');
    await expect(searchInput).toBeVisible();
  });

  test('should allow condition search', async ({ page }) => {
    await page.goto('/');
    
    // Type into the search input
    const searchInput = await page.getByPlaceholder('Search conditions...');
    await searchInput.click();
    await searchInput.type('diabetes');
    
    // Wait for suggestions to appear
    await page.waitForTimeout(500); // Wait for debounce
    
    // Check if we get search results
    const suggestions = await page.getByRole('listbox').getByRole('option');
    await expect(suggestions).toHaveCount(1);
  });
}); 