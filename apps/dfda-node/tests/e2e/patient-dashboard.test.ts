import { test, expect } from '@playwright/test'
import { loginAsDemoUser } from './helpers'

test.describe('Patient Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemoUser(page, 'patient')
  })

  test('should add a condition through the UI', async ({ page }) => {
    // Click add condition button
    await page.click('button:has-text("Add Condition")')
    
    // Wait for dialog to appear
    await page.waitForSelector('[role="dialog"]')
    
    // Type in search and wait for results
    await page.fill('[placeholder*="Search"]', 'diabetes')
    await page.waitForTimeout(500) // Wait for search results
    
    // Click the first condition result
    await page.click('[role="option"]:first-child')
    
    // Verify condition was added (toast should appear)
    await expect(page.getByText('Condition added successfully')).toBeVisible()
    
    // Verify condition appears in list
    await expect(page.getByText('Type 2 Diabetes')).toBeVisible()
  })

  test('should add a treatment rating through the UI', async ({ page }) => {
    // First ensure we have a condition
    await test.step('Add condition if not exists', async () => {
      const hasCondition = await page.getByText('Type 2 Diabetes').isVisible()
      if (!hasCondition) {
        await page.click('button:has-text("Add Condition")')
        await page.waitForSelector('[role="dialog"]')
        await page.fill('[placeholder*="Search"]', 'diabetes')
        await page.waitForTimeout(500)
        await page.click('[role="option"]:first-child')
        await page.waitForTimeout(500)
      }
    })

    // Click add treatment button
    await page.click('button:has-text("Add Treatment")')
    
    // Wait for dialog to appear
    await page.waitForSelector('[role="dialog"]')
    
    // Select condition from dropdown
    await page.click('select[name="condition_id"]')
    await page.selectOption('select[name="condition_id"]', 'type-2-diabetes')
    
    // Search for treatment
    await page.fill('[placeholder*="Search treatment"]', 'metformin')
    await page.waitForTimeout(500)
    await page.click('[role="option"]:has-text("Metformin")')
    
    // Set effectiveness rating
    await page.click('[role="slider"]')
    await page.keyboard.press('ArrowRight') // Move slider to 8
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    
    // Add review
    await page.fill('textarea[name="review"]', 'Test treatment review')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Verify treatment was added
    await expect(page.getByText('Treatment rating added')).toBeVisible()
    await expect(page.getByText('Metformin')).toBeVisible()
  })
}) 