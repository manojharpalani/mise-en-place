import { test, expect } from '@playwright/test'
import { signInAs, trackConsoleErrors } from './helpers/auth'

test.describe('Buyer flows (buyer@example.com)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAs(page, 'buyer', { callbackUrl: '/buyer/orders' })
  })

  test('BUY-1: orders list renders all statuses', async ({ page }) => {
    const console_ = trackConsoleErrors(page)
    await expect(page).toHaveURL('/buyer/orders')
    await expect(page.getByRole('heading', { name: 'My Orders' })).toBeVisible()
    // Seeded orders for this buyer span every OrderStatus value.
    for (const status of ['PENDING', 'PROCESSING', 'READY', 'DELIVERED', 'PICKED_UP', 'CANCELLED']) {
      await expect(page.getByText(status, { exact: true }).first()).toBeVisible()
    }
    console_.assertNone()
  })

  test('BUY-2: order detail page renders', async ({ page }) => {
    const console_ = trackConsoleErrors(page)
    // Each order card is a Link to its detail page, except the seller-name
    // span inside it (that one navigates to the storefront instead) — click
    // the card's link wrapper directly rather than any text inside it.
    await page.locator('a[href^="/buyer/orders/"]').first().click()
    await expect(page).toHaveURL(/\/buyer\/orders\/.+/)
    console_.assertNone()
  })

  test('BUY-3 & BUY-5: place a pickup order end-to-end, with validation', async ({ page }) => {
    await page.goto('/chef-maya')
    await page.getByRole('button', { name: /add to cart/i }).first().click()
    await page.goto('/checkout')

    await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible()

    // BUY-5: submitting with no date selected is rejected client-side.
    await page.getByRole('button', { name: /place order/i }).click()
    await expect(page.getByText(/select a pickup\/delivery date/i)).toBeVisible()

    await page.getByPlaceholder(/12:00 PM - 2:00 PM/i).fill('5:00 PM - 6:00 PM')
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split('T')[0]
    await page.locator('input[type="date"]').fill(tomorrow)

    await page.getByRole('button', { name: /place order/i }).click()
    await page.waitForURL('**/buyer/orders')
    await expect(page.getByRole('heading', { name: 'My Orders' })).toBeVisible()
  })

  test('BUY-4: place a delivery order end-to-end', async ({ page }) => {
    await page.goto('/chef-maya')
    await page.getByRole('button', { name: /add to cart/i }).first().click()
    await page.goto('/checkout')

    await page.getByText('Delivery', { exact: true }).click()
    await page.getByPlaceholder(/123 Main St/i).fill('123 Test St, San Francisco, CA 94110')
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split('T')[0]
    await page.locator('input[type="date"]').fill(tomorrow)

    await page.getByRole('button', { name: /place order/i }).click()
    await page.waitForURL('**/buyer/orders')
  })

  test('BUY-6: cancel a PENDING order', async ({ page }) => {
    // The seeded PENDING order for this buyer is the one from "0 days ago,
    // 1 hour ago" — it's the only one with a visible "Cancel Order" action.
    const cancelButton = page.getByRole('button', { name: /cancel order/i }).first()
    await expect(cancelButton).toBeVisible()
    await cancelButton.click()
    await page.getByRole('button', { name: /yes, cancel/i }).click()
    await expect(page.getByText(/order cancelled/i)).toBeVisible()
  })

  test('BUY-7: leave a review on a completed order with no review yet', async ({ page }) => {
    const reviewButton = page.getByRole('button', { name: /rate & review/i }).first()
    await expect(reviewButton).toBeVisible()
    await reviewButton.click()

    const dialog = page.getByRole('dialog')
    // 5 unlabeled star buttons come first in the dialog; rate 5 stars.
    await dialog.locator('button').nth(4).click()
    await dialog.getByPlaceholder(/what did you love/i).fill('E2E test review — great food!')
    await dialog.getByRole('button', { name: /submit review/i }).click()

    await expect(page.getByText(/review submitted/i)).toBeVisible()
  })

  test('BUY-8: favorites list renders seeded favorites', async ({ page }) => {
    const console_ = trackConsoleErrors(page)
    await page.goto('/buyer/favorites')
    await expect(page.getByRole('heading', { name: 'Favorite Sellers' })).toBeVisible()
    await expect(page.getByText("Chef Maya's Kitchen")).toBeVisible()
    await expect(page.getByText("Nonna's Table")).toBeVisible()
    console_.assertNone()
  })

  test('BUY-8b: toggle favorite from a storefront page', async ({ page }) => {
    await page.goto('/taco-loco')
    const saveButton = page.getByRole('button', { name: /^save$|^saved$/i })
    const wasSaved = (await saveButton.textContent())?.trim().toLowerCase() === 'saved'
    await saveButton.click()
    await expect(page.getByText(wasSaved ? /removed from favorites/i : /added to favorites/i)).toBeVisible()
  })

  test('BUY-9: subscriptions page shows the seeded subscription', async ({ page }) => {
    const console_ = trackConsoleErrors(page)
    await page.goto('/buyer/subscriptions')
    await expect(page.getByRole('heading', { name: 'My Subscriptions' })).toBeVisible()
    await expect(page.getByText("Chef Maya's Kitchen")).toBeVisible()
    console_.assertNone()
  })

  test('BUY-10: profile page loads and saves', async ({ page }) => {
    const console_ = trackConsoleErrors(page)
    await page.goto('/buyer/profile')
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible()

    // phone is a required field on this form; buyer@example.com has none
    // seeded, so fill it alongside the field we're actually testing.
    await page.getByPlaceholder('+1 (555) 000-0000').fill('+14155551234')
    await page.getByPlaceholder('e.g. Mission District').fill('Test Neighborhood ' + Date.now())
    await page.getByRole('button', { name: /save changes/i }).click()
    await expect(page.getByText(/profile updated/i)).toBeVisible()
    console_.assertNone()
  })
})
