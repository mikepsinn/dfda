import { test, expect } from '@playwright/test'

test.describe('CSS Loading Tests', () => {
  test('should load CSS styles on home page', async ({ page }) => {
    await page.goto('/')
    
    // Check if basic styles are applied
    const body = await page.locator('body')
    const bodyStyles = await body.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return {
        margin: styles.margin,
        backgroundColor: styles.backgroundColor,
        fontFamily: styles.fontFamily
      }
    })
    
    expect(bodyStyles.margin).not.toBe('0px')
    expect(bodyStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
    expect(bodyStyles.fontFamily).not.toBe('')

    // Check if Tailwind classes are working
    const button = await page.locator('button').first()
    const buttonStyles = await button.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return {
        padding: styles.padding,
        borderRadius: styles.borderRadius,
        backgroundColor: styles.backgroundColor
      }
    })

    expect(buttonStyles.padding).not.toBe('0px')
    expect(buttonStyles.borderRadius).not.toBe('0px')
  })

  test('should load CSS styles on login page', async ({ page }) => {
    await page.goto('/login')
    
    // Check if form elements have proper styling
    const form = await page.locator('form')
    const formStyles = await form.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return {
        display: styles.display,
        gap: styles.gap
      }
    })
    
    expect(formStyles.display).toBe('flex')
    expect(formStyles.gap).not.toBe('0px')

    // Take a screenshot for visual comparison
    await page.screenshot({ path: 'tests/screenshots/login-page.png' })
  })
}) 