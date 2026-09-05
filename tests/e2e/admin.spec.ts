import { test, expect } from '@playwright/test'
import { signInAs, trackConsoleErrors } from './helpers/auth'

test.describe('Admin flows (admin@miseenplace.local)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAs(page, 'admin', { callbackUrl: '/admin/dashboard' })
  })

  test('ADM-1: admin dashboard renders platform metrics', async ({ page }) => {
    const console_ = trackConsoleErrors(page)
    await expect(page).toHaveURL('/admin/dashboard')
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible()
    await expect(page.getByText('Recent Orders')).toBeVisible()
    console_.assertNone()
  })

  test('ADM-2: seller approval queue shows the pending seller', async ({ page }) => {
    const console_ = trackConsoleErrors(page)
    await page.goto('/admin/sellers')
    await expect(page.getByText("Dana's Bakehouse")).toBeVisible()
    console_.assertNone()
  })

  // Once approved or rejected, Dana's Bakehouse (the seed's one PENDING
  // seller) has no "back to pending" control in the admin UI — only
  // `npm run db:seed` resets it (see prisma/seed.ts). So these two tests
  // each check the button they need is still there before acting, and skip
  // with a clear message instead of failing if a prior run already resolved
  // it. Run them against a freshly-seeded database to exercise both.
  const pendingCard = (page: import('@playwright/test').Page) =>
    page.locator('div.bg-white.border.rounded-xl').filter({ hasText: "Dana's Bakehouse" })

  test('ADM-3: approve a pending seller', async ({ page }) => {
    await page.goto('/admin/sellers')
    const approveButton = pendingCard(page).getByRole('button', { name: /approve/i })
    test.skip(
      !(await approveButton.isVisible().catch(() => false)),
      "Dana's Bakehouse is no longer PENDING (a prior run already resolved it) — run `npm run db:seed` to restore it."
    )

    await approveButton.click()
    await expect(page.getByText(/approved!/i)).toBeVisible()

    await page.goto('/sellers')
    await expect(page.getByText("Dana's Bakehouse")).toBeVisible()
  })

  test('ADM-4: reject a pending seller', async ({ page }) => {
    await page.goto('/admin/sellers')
    const rejectButton = pendingCard(page).getByRole('button', { name: /reject/i })
    test.skip(
      !(await rejectButton.isVisible().catch(() => false)),
      "Dana's Bakehouse is no longer PENDING (a prior run already resolved it) — run `npm run db:seed` to restore it."
    )

    await rejectButton.click()
    await expect(page.getByText(/rejected/i)).toBeVisible()

    await page.goto('/sellers')
    await expect(page.getByText("Dana's Bakehouse")).toHaveCount(0)
  })

  test('ADM-5: buyers list renders', async ({ page }) => {
    const console_ = trackConsoleErrors(page)
    await page.goto('/admin/buyers')
    await expect(page.getByRole('heading', { name: /^buyers/i })).toBeVisible()
    console_.assertNone()
  })

  test('ADM-6: all-orders view renders', async ({ page }) => {
    const console_ = trackConsoleErrors(page)
    await page.goto('/admin/orders')
    await expect(page.getByRole('heading', { name: 'All Orders' })).toBeVisible()
    console_.assertNone()
  })

  test('ADM-7: content moderation page renders', async ({ page }) => {
    const console_ = trackConsoleErrors(page)
    await page.goto('/admin/content')
    console_.assertNone()
  })
})
