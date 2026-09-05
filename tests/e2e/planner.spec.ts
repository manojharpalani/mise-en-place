import { test, expect } from '@playwright/test'
import { signInAs, trackConsoleErrors } from './helpers/auth'

test.describe('Planner flows (planner@example.com)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAs(page, 'planner', { callbackUrl: '/planner/dashboard' })
  })

  test('PLN-1: planner dashboard renders', async ({ page }) => {
    const console_ = trackConsoleErrors(page)
    await expect(page).toHaveURL('/planner/dashboard')
    console_.assertNone()
  })

  test('PLN-2: dish library lists seeded dishes', async ({ page }) => {
    const console_ = trackConsoleErrors(page)
    await page.goto('/planner/dishes')
    await expect(page.getByText('Masala Dosa')).toBeVisible()
    await expect(page.getByText('Greek Salad')).toBeVisible()
    console_.assertNone()
  })

  test('PLN-3: add a new dish to the library', async ({ page }) => {
    await page.goto('/planner/dishes')
    await page.getByRole('button', { name: /add dish/i }).first().click()

    const dialog = page.getByRole('dialog')
    const dishName = `E2E Test Dish ${Date.now()}`
    await dialog.getByPlaceholder(/dal tadka/i).fill(dishName)
    await dialog.getByRole('button', { name: /^add dish$/i }).click()

    await expect(page.getByText(dishName)).toBeVisible()
  })

  test('PLN-4: weekly menu grid renders assigned dishes', async ({ page }) => {
    const console_ = trackConsoleErrors(page)
    await page.goto('/planner/menu')
    await expect(page.getByRole('heading', { name: 'Meal Plan' })).toBeVisible()
    await expect(page.getByText('Masala Dosa').first()).toBeVisible()
    console_.assertNone()
  })

  test('PLN-5: AI weekly plan generation succeeds (regression: claude-fable-5)', async ({ page }) => {
    test.setTimeout(60_000)
    await page.goto('/planner/menu')
    await page.getByRole('button', { name: /^ai plan$/i }).click()
    await expect(page.getByRole('dialog').getByText('AI Plan Week')).toBeVisible()

    await page.getByRole('button', { name: /generate plan/i }).click()
    await expect(page.getByText(/ai plan applied/i)).toBeVisible({ timeout: 45_000 })
  })

  test('PLN-6: grocery list renders from the weekly menu', async ({ page }) => {
    const console_ = trackConsoleErrors(page)
    await page.goto('/planner/grocery')
    await expect(page.getByRole('heading', { name: 'Grocery List' })).toBeVisible()
    console_.assertNone()
  })

  test('PLN-7: profile settings load and save', async ({ page }) => {
    const console_ = trackConsoleErrors(page)
    await page.goto('/planner/profile')
    await expect(page.getByRole('heading', { name: 'Profile Settings' })).toBeVisible()
    await page.getByPlaceholder(/e.g. indian, mexican, italian/i).fill('South Indian, Mediterranean, Mexican')
    await page.getByRole('button', { name: /save changes/i }).click()
    await expect(page.getByText(/profile updated/i)).toBeVisible()
    console_.assertNone()
  })

  test('PLN-8: a buyer can follow a planner from their public profile', async ({ page }) => {
    await signInAs(page, 'buyer')
    await page.goto('/u/sharma-family')
    const followButton = page.getByRole('button', { name: /^follow$|^following$/i })
    await expect(followButton).toBeVisible()
    await followButton.click()
    await expect(page.getByText(/following!|unfollowed/i)).toBeVisible()
  })
})
