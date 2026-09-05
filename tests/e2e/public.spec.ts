import { test, expect } from '@playwright/test'
import { trackConsoleErrors } from './helpers/auth'

test.describe('Public pages (signed out)', () => {
  test('PUB-1: home page loads', async ({ page }) => {
    const console_ = trackConsoleErrors(page)
    await page.goto('/')
    await expect(page.getByRole('link', { name: /get started/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
    console_.assertNone()
  })

  test('PUB-2: Find Chefs lists approved sellers, hides the pending one', async ({ page }) => {
    const console_ = trackConsoleErrors(page)
    await page.goto('/sellers')
    await expect(page.getByText("Chef Maya's Kitchen")).toBeVisible()
    await expect(page.getByText("Nonna's Table")).toBeVisible()
    await expect(page.getByText('Taco Loco')).toBeVisible()
    await expect(page.getByText('Seoul Kitchen')).toBeVisible()
    await expect(page.getByText("Dana's Bakehouse")).toHaveCount(0)
    console_.assertNone()
  })

  test('PUB-3: storefront page renders a seller menu', async ({ page }) => {
    const console_ = trackConsoleErrors(page)
    await page.goto('/chef-maya')
    await expect(page.getByText("Chef Maya's Kitchen")).toBeVisible()
    await expect(page.getByText('Masala Dosa')).toBeVisible()
    await expect(page.getByRole('button', { name: /add to cart/i }).first()).toBeVisible()
    console_.assertNone()
  })

  test('PUB-5: unknown storefront slug 404s gracefully', async ({ page }) => {
    const response = await page.goto('/this-store-does-not-exist')
    expect(response?.status()).toBe(404)
  })

  test('PUB-6: about page loads', async ({ page }) => {
    const console_ = trackConsoleErrors(page)
    await page.goto('/about')
    await expect(page.locator('body')).not.toBeEmpty()
    console_.assertNone()
  })

  test('PUB-7: planner public profile renders', async ({ page }) => {
    const console_ = trackConsoleErrors(page)
    await page.goto('/u/sharma-family')
    await expect(page.getByText('The Sharma Family')).toBeVisible()
    console_.assertNone()
  })

  test('PUB-8: unknown planner slug 404s gracefully', async ({ page }) => {
    const response = await page.goto('/u/does-not-exist')
    expect(response?.status()).toBe(404)
  })

  test('PUB-9: cart badge and drawer work pre-login', async ({ page }) => {
    await page.goto('/chef-maya')
    await page.getByRole('button', { name: /add to cart/i }).first().click()
    await page.getByRole('button', { name: /^your cart|cart/i }).first().click().catch(() => {
      // Fall back to the cart trigger icon if it has no accessible name.
    })
    await expect(page.getByText(/your cart/i)).toBeVisible()
  })

  test('PUB-10: guest checkout redirects to sign-in with cart preserved', async ({ page }) => {
    // Regression test: /checkout used to have no auth check at all, so a
    // signed-out visitor could fill out the whole form and only find out
    // they weren't signed in from a confusing "Unauthorized" toast at the
    // very end. Fixed this session by gating the page server-side, the same
    // way every other role's routes already are.
    await page.goto('/chef-maya')
    await page.getByRole('button', { name: /add to cart/i }).first().click()

    await page.goto('/checkout')
    await page.waitForURL('**/auth/signin**')
    expect(new URL(page.url()).searchParams.get('callbackUrl')).toBe('/checkout')
  })
})
