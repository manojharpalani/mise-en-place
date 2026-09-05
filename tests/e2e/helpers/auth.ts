import { Page, expect } from '@playwright/test'

export const DEMO_ACCOUNTS = {
  admin: 'admin@miseenplace.local',
  seller: 'chef@example.com',
  buyer: 'buyer@example.com',
  planner: 'planner@example.com',
} as const

export type DemoRole = keyof typeof DEMO_ACCOUNTS

/**
 * Signs in via the app's real email-OTP flow. This deployment has no email
 * sender configured, so /api/auth/send-otp returns the code directly in its
 * JSON response and the client puts it in the verify page's `devOtp` query
 * param. We read that param and type the 6 digits into the OTP boxes
 * ourselves (rather than relying on the page's own auto-fill effect, which
 * only pre-fills the boxes and does not auto-submit) so the same real
 * onChange/auto-verify-on-complete code path a human uses is exercised.
 */
export async function signIn(page: Page, email: string, opts: { callbackUrl?: string } = {}) {
  const url = new URL('/auth/signin', 'http://placeholder')
  if (opts.callbackUrl) url.searchParams.set('callbackUrl', opts.callbackUrl)
  await page.goto(url.pathname + url.search)

  await page.getByLabel('Email address').fill(email)
  await page.getByRole('button', { name: /send login code/i }).click()

  await page.waitForURL('**/auth/verify**')
  const verifyUrl = new URL(page.url())
  const devOtp = verifyUrl.searchParams.get('devOtp')
  if (!devOtp || devOtp.length !== 6) {
    throw new Error(
      `Expected a 6-digit devOtp in the verify URL (no email sender is configured in this deployment) but got: ${devOtp}. ` +
      `URL was ${page.url()}`
    )
  }

  const otpInputs = page.locator('input[maxlength="1"]')
  await expect(otpInputs).toHaveCount(6)
  for (let i = 0; i < 6; i++) {
    await otpInputs.nth(i).fill(devOtp[i])
  }

  // handleVerify fires as soon as the 6th box is filled; wait for the app to
  // navigate away from the verify page to the signed-in destination.
  await page.waitForURL((u: URL) => !u.pathname.startsWith('/auth/verify'), { timeout: 10_000 })
}

export async function signInAs(page: Page, role: DemoRole, opts: { callbackUrl?: string } = {}) {
  await signIn(page, DEMO_ACCOUNTS[role], opts)
}

export async function signOut(page: Page) {
  // The navbar exposes sign-out via next-auth's client signOut(); simplest
  // robust path for a test is to hit the same session endpoint the app uses.
  await page.evaluate(async () => {
    await fetch('/api/auth/signout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'csrfToken=' + encodeURIComponent(
        (await (await fetch('/api/auth/csrf')).json()).csrfToken
      ),
    })
  })
}

/**
 * Attaches console/page-error listeners and returns a live list plus an
 * assertion helper. Filters out a small allowlist of known-benign noise
 * (browser extension warnings, favicon 404s) so the check stays meaningful.
 */
export function trackConsoleErrors(page: Page) {
  const errors: string[] = []
  const ignore = [/favicon/i, /Download the React DevTools/i, /chrome-extension:/i]

  page.on('console', (msg: import('@playwright/test').ConsoleMessage) => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    if (ignore.some((re) => re.test(text))) return
    errors.push(text)
  })
  page.on('pageerror', (err: Error) => {
    errors.push(err.message)
  })

  return {
    errors,
    assertNone() {
      expect(errors, `Unexpected console/page errors:\n${errors.join('\n')}`).toEqual([])
    },
  }
}
