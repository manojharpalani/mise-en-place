import { test, expect } from '@playwright/test'
import { signInAs, trackConsoleErrors } from './helpers/auth'

test.describe('Seller flows (chef@example.com)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAs(page, 'seller', { callbackUrl: '/seller/dashboard' })
  })

  test('SEL-1: seller dashboard renders', async ({ page }) => {
    const console_ = trackConsoleErrors(page)
    await expect(page).toHaveURL('/seller/dashboard')
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    console_.assertNone()
  })

  test('SEL-2: menu management lists existing items', async ({ page }) => {
    const console_ = trackConsoleErrors(page)
    await page.goto('/seller/menu')
    await expect(page.getByRole('heading', { name: 'Weekly Menu Planner' })).toBeVisible()
    await expect(page.getByText('Masala Dosa').first()).toBeVisible()
    await expect(page.getByText('Chole Bhature').first()).toBeVisible()
    console_.assertNone()
  })

  test('SEL-3: create a new menu item', async ({ page }) => {
    await page.goto('/seller/menu')
    await page.getByRole('button', { name: /new item/i }).click()

    const dialog = page.getByRole('dialog')
    const itemName = `E2E Test Dish ${Date.now()}`
    await dialog.getByPlaceholder(/homemade biryani/i).fill(itemName)
    await dialog.getByPlaceholder('12.99').fill('9.99')
    await dialog.getByRole('button', { name: /create item/i }).click()

    await expect(page.getByText(/menu item created/i)).toBeVisible()
    await expect(page.getByText(itemName)).toBeVisible()
  })

  test('SEL-5: AI weekly plan generation succeeds (regression: claude-fable-5)', async ({ page }) => {
    test.setTimeout(60_000)
    await page.goto('/seller/menu')
    await page.getByRole('button', { name: /ai plan week/i }).click()
    await expect(page.getByRole('dialog').getByText('AI Plan This Week')).toBeVisible()

    await page.getByRole('button', { name: /generate plan/i }).click()
    // Real call to the Anthropic API — give it real time, and assert we get
    // a real result rather than the 500 this regresses to when the model id
    // is wrong.
    await expect(page.getByText(/plan applied|days planned/i)).toBeVisible({ timeout: 45_000 })
  })

  test('SEL-6: recipe inspiration for a menu item does not 500 (same regression class as SEL-5)', async ({ page }) => {
    test.setTimeout(60_000)
    await page.goto('/seller/menu')

    // Clicking an already-assigned menu item's name in the weekly grid opens
    // the "Dish Inspiration" sheet, which fetches inspiration automatically.
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/inspiration'), { timeout: 30_000 }),
      page.getByTitle('Get recipe inspiration').first().click(),
    ])
    expect(response.status()).toBeLessThan(500)
  })

  test('SEL-8: advance a PENDING order to Processing', async ({ page }) => {
    await page.goto('/seller/orders')
    await page.getByRole('button', { name: 'PENDING' }).click()
    await page.getByRole('button', { name: /start processing/i }).first().click()
    await expect(page.getByText(/order updated to processing/i)).toBeVisible()
  })

  test('SEL-9: earnings page renders', async ({ page }) => {
    const console_ = trackConsoleErrors(page)
    await page.goto('/seller/earnings')
    await expect(page.getByRole('heading', { name: 'Earnings' })).toBeVisible()
    console_.assertNone()
  })

  test('SEL-10: employees page renders and invites', async ({ page }) => {
    const console_ = trackConsoleErrors(page)
    await page.goto('/seller/employees')
    const uniqueEmail = `e2e-employee-${Date.now()}@example.com`
    await page.getByPlaceholder('employee@example.com').fill(uniqueEmail)
    await page.getByPlaceholder('employee@example.com').press('Enter')
    await expect(page.getByText(uniqueEmail)).toBeVisible()
    console_.assertNone()
  })

  test('SEL-11: settings page loads and saves', async ({ page }) => {
    const console_ = trackConsoleErrors(page)
    await page.goto('/seller/settings')
    await expect(page.getByRole('heading', { name: 'Store Settings' })).toBeVisible()
    await page.getByPlaceholder(/tell customers about your food/i).fill(
      'E2E test bio — updated ' + Date.now()
    )
    await page.getByRole('button', { name: /save settings/i }).click()
    await expect(page.getByText(/updated|saved/i).first()).toBeVisible()
    console_.assertNone()
  })

  test('SEL-12: marketing and content pages render', async ({ page }) => {
    const console_ = trackConsoleErrors(page)
    await page.goto('/seller/marketing')
    await page.goto('/seller/content')
    console_.assertNone()
  })
})
