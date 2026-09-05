import { test, expect } from '@playwright/test'
import { DEMO_ACCOUNTS, signIn, signInAs, signOut } from './helpers/auth'

test.describe('Authentication (email OTP)', () => {
  test('AUTH-1: sign in with a valid demo account', async ({ page }) => {
    await signIn(page, DEMO_ACCOUNTS.buyer)
    // Default callbackUrl is '/', so we should land on the signed-in home page.
    await expect(page).toHaveURL('/')
  })

  test('AUTH-2: demo account quick-select buttons sign in as each role', async ({ page }) => {
    for (const [role, email] of Object.entries(DEMO_ACCOUNTS)) {
      await page.goto('/auth/signin')
      await page.getByRole('button', { name: new RegExp(email, 'i') }).click()
      await page.waitForURL('**/auth/verify**')
      expect(new URL(page.url()).searchParams.get('email')).toBe(email)
      // Full verify->landing round trip is covered by AUTH-1 and the role
      // specs; here we only need to confirm each button fills the right email.
      void role
    }
  })

  test('AUTH-3: invalid email format is rejected client-side', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.getByLabel('Email address').fill('not-an-email')
    await page.getByRole('button', { name: /send login code/i }).click()
    await expect(page.getByText(/valid email/i)).toBeVisible()
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('AUTH-4: wrong OTP is rejected', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.getByLabel('Email address').fill(DEMO_ACCOUNTS.buyer)
    await page.getByRole('button', { name: /send login code/i }).click()
    await page.waitForURL('**/auth/verify**')

    const otpInputs = page.locator('input[maxlength="1"]')
    await expect(otpInputs).toHaveCount(6)
    // Deliberately enter an all-zeros code, which will not match the real one.
    for (let i = 0; i < 6; i++) await otpInputs.nth(i).fill('0')

    await expect(page.getByText(/invalid or expired code/i)).toBeVisible()
    await expect(page).toHaveURL(/\/auth\/verify/)
  })

  test('AUTH-5: resend code issues a new OTP', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.getByLabel('Email address').fill(DEMO_ACCOUNTS.buyer)
    await page.getByRole('button', { name: /send login code/i }).click()
    await page.waitForURL('**/auth/verify**')

    await page.getByRole('button', { name: /resend code/i }).click()
    await expect(page.getByText(/new code generated|new code sent/i)).toBeVisible()
  })

  test('AUTH-6: sign up creates a new buyer account', async ({ page }) => {
    const uniqueEmail = `e2e-signup-${Date.now()}@example.com`
    await page.goto('/auth/signup')
    await page.getByLabel(/full name|name/i).fill('E2E Test Buyer')
    await page.getByLabel('Email address').fill(uniqueEmail)
    await page.getByRole('button', { name: /sign up|create account|get started/i }).click()

    await page.waitForURL('**/auth/verify**')
    const otpInputs = page.locator('input[maxlength="1"]')
    const devOtp = new URL(page.url()).searchParams.get('devOtp')
    expect(devOtp, 'expected a devOtp in the redirect URL').toBeTruthy()
    for (let i = 0; i < 6; i++) await otpInputs.nth(i).fill(devOtp![i])

    await page.waitForURL((u) => !u.pathname.startsWith('/auth/verify'), { timeout: 10_000 })
  })

  test('AUTH-7: session persists across a reload', async ({ page }) => {
    await signInAs(page, 'buyer', { callbackUrl: '/buyer/orders' })
    await page.reload()
    await expect(page).toHaveURL('/buyer/orders')
    await expect(page.getByRole('link', { name: /orders/i }).first()).toBeVisible()
  })

  test('AUTH-8: sign out clears the session', async ({ page }) => {
    await signInAs(page, 'buyer', { callbackUrl: '/buyer/orders' })
    await signOut(page)
    await page.goto('/buyer/orders')
    await page.waitForURL('**/auth/signin**')
  })

  test('BUY-12 / SEL-14 / PLN-10 / ADM-8: protected routes redirect or gate correctly', async ({ page }) => {
    // Signed out -> buyer routes require sign-in with callbackUrl preserved.
    await page.goto('/buyer/orders')
    await page.waitForURL('**/auth/signin**')
    expect(new URL(page.url()).searchParams.get('callbackUrl')).toBe('/buyer/orders')

    // Signed in as buyer -> seller/planner/admin routes bounce to '/', not an error page.
    await signInAs(page, 'buyer')
    await page.goto('/seller/dashboard')
    await expect(page).toHaveURL('/')

    await page.goto('/planner/dashboard')
    await expect(page).toHaveURL('/')

    await page.goto('/admin/dashboard')
    await expect(page).toHaveURL('/')
  })
})
