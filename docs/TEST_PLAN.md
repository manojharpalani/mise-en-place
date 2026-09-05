# Mise en Place — UX Test Plan

This document is the source of truth for manual and automated test coverage
of the app. Every test case here has a matching Playwright spec in
`tests/e2e/` (see the "Automated" column), except where noted as manual-only
(payment/webhooks, email delivery, etc.).

## How to run

```bash
npm install                       # first time only
npx playwright install chromium   # first time only (downloads a browser)
npm run dev                       # in one terminal — app must be running
npm run test:e2e                  # in another terminal
npm run test:e2e -- --ui          # interactive mode
npm run test:e2e -- tests/e2e/buyer.spec.ts   # a single file
```

The suite talks to whatever `DATABASE_URL` your `npm run dev` server is
using. It relies on the seeded demo accounts and demo data below — run
`npm run db:seed` at least once against that database before the first run.
The suite is read-mostly but does create real orders/reviews/menu items as
part of some tests; it does not delete or reset data, so re-running it
repeatedly is safe but will accumulate rows (a seller gets a few more menu
items, a buyer places a few more orders, etc.). If you want a clean slate,
reset the database and re-seed.

## Demo accounts (see `prisma/seed.ts`)

| Role | Email | Notes |
|---|---|---|
| Admin | `admin@miseenplace.local` | platform approvals, orders, metrics |
| Seller | `chef@example.com` | Chef Maya's Kitchen, South Indian, 6 menu items, published weekly menu, 15 orders across every status |
| Buyer | `buyer@example.com` | Alex Chen — has orders in every status, 3 reviews left, an active subscription to Chef Maya |
| Planner | `planner@example.com` | The Sharma Family, household of 4, 6-dish library, published weekly menu |
| Pending seller | `newchef@example.com` | Dana's Bakehouse — `PENDING` permit, shows in the admin approval queue, does NOT show on `/sellers` |
| Other buyers | `priya@`, `james@`, `sofia@`, `kevin@example.com` | used to diversify order history, not used directly by the suite |
| Other sellers | `giulia@` (Nonna's Table, Italian), `mateo@` (Taco Loco, Mexican), `jin@` (Seoul Kitchen, Korean) | approved, visible on `/sellers` |

All sign-in uses a one-time email code. This deployment has no email sender
configured, so `/api/auth/send-otp` returns the code in its JSON response
(`devOtp`) and the verify page auto-fills and auto-submits it — there is no
inbox to check. See `tests/e2e/helpers/auth.ts`.

## Legend

- **Automated**: ✅ spec exists, ⚠️ partially automated (some steps require manual/visual judgment), ❌ manual only (see reason)
- Priority: **P0** blocks core value (would stop a real user from ordering food), **P1** important flow, **P2** nice-to-have polish

---

## A. Public & marketing pages (unauthenticated)

| ID | Title | Priority | Steps | Expected Result | Automated |
|---|---|---|---|---|---|
| PUB-1 | Home page loads | P0 | Visit `/` | Page renders with hero, no console errors, "Get Started" and "Sign In" links visible | ✅ `public.spec.ts` |
| PUB-2 | Find Chefs lists approved sellers | P0 | Visit `/sellers` | Chef Maya's Kitchen, Nonna's Table, Taco Loco, Seoul Kitchen all appear; Dana's Bakehouse (pending) does NOT appear | ✅ `public.spec.ts` |
| PUB-3 | Storefront page renders a seller's menu | P0 | Visit `/chef-maya` | Store name, bio, menu items with prices render; "Add to cart" controls present | ✅ `public.spec.ts` |
| PUB-4 | Storefront tabs switch between menu sections | P1 | On `/chef-maya`, click each tab (e.g. Menu / Weekly Menu / Reviews if present) | Content switches without a full page reload or console error | ⚠️ `public.spec.ts` (existence check only) |
| PUB-5 | Unknown storefront slug 404s gracefully | P1 | Visit `/this-store-does-not-exist` | Next.js not-found page, no unhandled server error | ✅ `public.spec.ts` |
| PUB-6 | About page loads | P2 | Visit `/about` | Page renders, no console errors | ✅ `public.spec.ts` |
| PUB-7 | Planner public profile renders | P1 | Visit `/u/sharma-family` | Displays "The Sharma Family", household size, published weekly menu with dishes per day | ✅ `public.spec.ts` |
| PUB-8 | Unknown planner slug 404s gracefully | P2 | Visit `/u/does-not-exist` | Not-found page, no server error | ✅ `public.spec.ts` |
| PUB-9 | Cart badge and drawer work pre-login | P0 | On `/chef-maya`, add an item to cart | Cart icon shows item count; opening the cart shows the item and a running total | ✅ `public.spec.ts` |
| PUB-10 | Guest checkout redirects to sign-in | P0 | With items in cart, visit `/checkout` while signed out | Redirected to `/auth/signin` with a `callbackUrl` back to `/checkout` (cart contents preserved after sign-in) | ✅ `public.spec.ts` |

## B. Authentication (email OTP)

| ID | Title | Priority | Steps | Expected Result | Automated |
|---|---|---|---|---|---|
| AUTH-1 | Sign in with a valid demo account | P0 | `/auth/signin` → enter `buyer@example.com` → submit | Redirected to `/auth/verify`; code auto-fills and auto-submits; lands on callback URL (default `/`) signed in as Alex Chen | ✅ `auth.spec.ts` |
| AUTH-2 | Demo account quick-select buttons | P1 | `/auth/signin` → click each of the 4 demo account buttons in turn | Each fills the email and submits, landing signed in as that role | ✅ `auth.spec.ts` |
| AUTH-3 | Invalid email format is rejected client-side | P2 | `/auth/signin` → type `not-an-email` → submit | Inline validation error, no request sent | ✅ `auth.spec.ts` |
| AUTH-4 | Wrong/expired OTP is rejected | P1 | `/auth/verify?email=buyer@example.com` with a deliberately wrong 6-digit code | Toast "Invalid or expired code", inputs clear, user stays on verify page | ✅ `auth.spec.ts` |
| AUTH-5 | Resend code issues a new OTP | P2 | On verify page, click "Resend code" | New code appears/auto-fills, success toast | ✅ `auth.spec.ts` |
| AUTH-6 | Sign up creates a new buyer account | P1 | `/auth/signup` → fill new unique email/name → submit → verify | New `BUYER` user created, lands signed in | ✅ `auth.spec.ts` |
| AUTH-7 | Session persists across a reload | P0 | Sign in as buyer → reload `/buyer/orders` | Still signed in, page renders buyer's orders (not bounced to sign-in) | ✅ `auth.spec.ts` |
| AUTH-8 | Sign out clears the session | P1 | Signed in as buyer → sign out (navbar) | Redirected/landed on a public page; visiting `/buyer/orders` afterward redirects to sign-in | ✅ `auth.spec.ts` |

## C. Buyer flows (`buyer@example.com`)

| ID | Title | Priority | Steps | Expected Result | Automated |
|---|---|---|---|---|---|
| BUY-1 | Orders list renders all statuses | P0 | Sign in as buyer → `/buyer/orders` | List renders with no console error; orders in PENDING/PROCESSING/READY/DELIVERED/PICKED_UP/CANCELLED all display with correct status colors | ✅ `buyer.spec.ts` |
| BUY-2 | Order detail page renders | P0 | From `/buyer/orders`, open any order | `/buyer/orders/[id]` shows items, totals, fulfillment info, status, no console error | ✅ `buyer.spec.ts` |
| BUY-3 | Place a pickup order end-to-end | P0 | `/chef-maya` → add item → `/checkout` → choose Pickup, pick a date and window → place order | Order created, redirected to `/buyer/orders`, new order visible at the top with correct total | ✅ `buyer.spec.ts` |
| BUY-4 | Place a delivery order end-to-end | P0 | Same as BUY-3 but choose Delivery and enter an address | Order created with `fulfillmentType: DELIVERY`, delivery fee added to total | ✅ `buyer.spec.ts` |
| BUY-5 | Checkout blocks incomplete submissions | P1 | On `/checkout`, submit with no date selected; then with Delivery chosen and no address | Toast validation errors, no request sent, order not created | ✅ `buyer.spec.ts` |
| BUY-6 | Cancel a cancellable order | P1 | Open a `PENDING` order → cancel | Status becomes `CANCELLED`, reflected immediately in the UI | ✅ `buyer.spec.ts` |
| BUY-7 | Leave a review on a completed order | P1 | Open a `DELIVERED`/`PICKED_UP` order with no review yet → submit rating + comment | Review saved, visible on the order and reflected in the seller's public rating over time | ✅ `buyer.spec.ts` |
| BUY-8 | Favorites list renders and toggling works | P1 | `/buyer/favorites`; also favorite/unfavorite a seller from a storefront page | List reflects current favorites; toggling updates without a full reload | ✅ `buyer.spec.ts` |
| BUY-9 | Subscriptions page renders | P1 | `/buyer/subscriptions` | Shows the buyer's active subscription to Chef Maya's Kitchen with correct status | ✅ `buyer.spec.ts` |
| BUY-10 | Profile page loads and saves | P1 | `/buyer/profile` → edit name/neighborhood → save | Success toast, change persists after reload | ✅ `buyer.spec.ts` |
| BUY-11 | Payment methods UI renders | P2 | `/buyer/profile` (or wherever payment methods live) | Section renders without error | ❌ manual (Stripe elements can't be safely automated without test-mode card data; smoke-test only) |
| BUY-12 | Buyer routes require sign-in | P0 | Signed out, visit `/buyer/orders` directly | Redirected to `/auth/signin?callbackUrl=/buyer/orders` | ✅ `auth.spec.ts` |

## D. Seller flows (`chef@example.com`)

| ID | Title | Priority | Steps | Expected Result | Automated |
|---|---|---|---|---|---|
| SEL-1 | Seller dashboard renders | P0 | Sign in as seller → `/seller/dashboard` | Store metrics, recent orders render, no console error | ✅ `seller.spec.ts` |
| SEL-2 | Menu management lists existing items | P0 | `/seller/menu` | 6 seeded items render with name/price/availability | ✅ `seller.spec.ts` |
| SEL-3 | Create a new menu item | P0 | `/seller/menu` → add item form → fill name/price/description → save | New item appears in the list immediately | ✅ `seller.spec.ts` |
| SEL-4 | Edit an existing menu item | P1 | Open an item → change price → save | Updated price reflected in list and on the public storefront | ✅ `seller.spec.ts` |
| SEL-5 | AI weekly plan generation | P0 | `/seller/menu` (weekly planner) → trigger "AI plan the week" | Request succeeds (no 500), new items/days populate the weekly menu grid | ✅ `seller.spec.ts` — regression test for the `claude-fable-5` bug fixed this session |
| SEL-6 | Recipe inspiration / ingredient suggestions | P1 | Trigger "Get inspiration" and "Suggest ingredients" on a menu item | Both return content without a 500 | ✅ `seller.spec.ts` — same regression class as SEL-5 |
| SEL-7 | Import menu from image | P2 | Upload a dish photo via "Import from image" | Either succeeds or fails gracefully with a user-facing error (never a silent 500) | ❌ manual (requires uploading a real image file) |
| SEL-8 | Orders management — update order status | P0 | `/seller/orders` → advance a `PENDING`/`PROCESSING` order to the next status | Status updates, order moves to the correct column/section | ✅ `seller.spec.ts` |
| SEL-9 | Earnings page renders | P1 | `/seller/earnings` | Chart/table renders with real numbers from seeded orders, no console error | ✅ `seller.spec.ts` |
| SEL-10 | Employees page renders and invites | P2 | `/seller/employees` → invite an employee by email | New pending employee row appears | ✅ `seller.spec.ts` |
| SEL-11 | Settings page loads and saves | P1 | `/seller/settings` → change bio/delivery radius → save | Success toast, change persists after reload | ✅ `seller.spec.ts` |
| SEL-12 | Marketing / content pages render | P2 | `/seller/marketing`, `/seller/content` | Both render without console errors | ✅ `seller.spec.ts` |
| SEL-13 | Seller onboarding flow (new seller) | P2 | Sign up a brand-new account as a seller → `/seller/onboarding` | Wizard completes, creates a `PENDING` `SellerProfile` | ❌ manual (multi-step wizard, low regression risk, time-boxed out) |
| SEL-14 | Seller routes require SELLER/EMPLOYEE/ADMIN role | P0 | Signed in as buyer, visit `/seller/dashboard` | Redirected to `/` (not an auth error) | ✅ `auth.spec.ts` |

## E. Planner flows (`planner@example.com`)

| ID | Title | Priority | Steps | Expected Result | Automated |
|---|---|---|---|---|---|
| PLN-1 | Planner dashboard renders | P0 | Sign in as planner → `/planner/dashboard` | Household info, current week summary render | ✅ `planner.spec.ts` |
| PLN-2 | Dish library lists seeded dishes | P0 | `/planner/dishes` | 6 seeded dishes render | ✅ `planner.spec.ts` |
| PLN-3 | Add a new dish to the library | P1 | `/planner/dishes` → add dish form → save | New dish appears in the list | ✅ `planner.spec.ts` |
| PLN-4 | Weekly menu grid renders and is editable | P0 | `/planner/menu` | Published week (Mon–Sat) renders with assigned dishes; assigning/removing a dish updates the grid | ✅ `planner.spec.ts` |
| PLN-5 | AI weekly plan generation | P0 | `/planner/menu` → trigger "AI plan the week" | Request succeeds (no 500), populates days with new/existing dishes scaled to household size | ✅ `planner.spec.ts` — regression test for the `claude-fable-5` bug fixed this session |
| PLN-6 | Grocery list renders from the weekly menu | P1 | `/planner/grocery` | Aggregated ingredient list renders based on the published weekly menu | ✅ `planner.spec.ts` |
| PLN-7 | Profile / public page settings | P1 | `/planner/profile` → edit bio/cuisine prefs → save | Change persists; reflected on public `/u/sharma-family` page | ✅ `planner.spec.ts` |
| PLN-8 | "Inspired by" / follow-a-seller feature | P2 | On planner dashboard or dish library, follow a seller | Follow state toggles and persists | ✅ `planner.spec.ts` |
| PLN-9 | Planner onboarding flow (new planner) | P2 | Sign up a brand-new account as a planner → `/planner/onboarding` | Wizard completes, creates a `PlannerProfile` | ❌ manual (multi-step wizard, low regression risk, time-boxed out) |
| PLN-10 | Planner routes require PLANNER/ADMIN role | P0 | Signed in as buyer, visit `/planner/dashboard` | Redirected to `/` | ✅ `auth.spec.ts` |

## F. Admin flows (`admin@miseenplace.local`)

| ID | Title | Priority | Steps | Expected Result | Automated |
|---|---|---|---|---|---|
| ADM-1 | Admin dashboard renders platform metrics | P0 | Sign in as admin → `/admin/dashboard` | Totals (sellers/buyers/orders) render, no console error | ✅ `admin.spec.ts` |
| ADM-2 | Seller approval queue shows the pending seller | P0 | `/admin/sellers` | Dana's Bakehouse appears under a pending/awaiting-approval section | ✅ `admin.spec.ts` |
| ADM-3 | Approve a pending seller | P0 | On the pending seller's card, click Approve | Permit status becomes `APPROVED`; seller now appears on `/sellers` | ✅ `admin.spec.ts` |
| ADM-4 | Reject a pending seller | P1 | On the pending seller's card, click Reject | Permit status becomes `REJECTED`, seller disappears from `/sellers` | ✅ `admin.spec.ts` — self-skips with a clear message if ADM-3 already consumed the one seeded PENDING seller in this run; `npm run db:seed` resets it back to PENDING (seed.ts now does this on every run, not just on first insert) |
| ADM-5 | Buyers list renders | P1 | `/admin/buyers` | All seeded buyers render with order counts | ✅ `admin.spec.ts` |
| ADM-6 | All-orders view renders and filters | P1 | `/admin/orders` | All orders across all sellers render; status filter (if present) narrows the list | ✅ `admin.spec.ts` |
| ADM-7 | Content moderation page renders | P2 | `/admin/content` | Page renders without console error | ✅ `admin.spec.ts` |
| ADM-8 | Admin routes require ADMIN role | P0 | Signed in as buyer, visit `/admin/dashboard` | Redirected to `/` | ✅ `auth.spec.ts` |

## G. Cross-cutting

| ID | Title | Priority | Steps | Expected Result | Automated |
|---|---|---|---|---|---|
| CROSS-1 | No client/server console errors on any authenticated landing page | P0 | Visit each role's dashboard once signed in | Zero `console.error` entries and zero failed (5xx) network requests | ✅ folded into each role's spec file via a shared `expectNoConsoleErrors` helper |
| CROSS-2 | React Server Component event-handler regression guard | P0 | Static repo check: no `.tsx` file lacking `'use client'` may pass a raw `on*` handler prop to a plain DOM element | Grep-based check finds zero violations — regression guard for the exact bug fixed this session on `/buyer/orders` | ✅ `tests/e2e/regressions.spec.ts` (static, no browser needed) |
| CROSS-3 | Every Anthropic model reference is a real model ID | P0 | Static repo check: every `model: '...'` string passed to the Anthropic SDK matches the SDK's known model list | Regression guard for the `claude-fable-5` bug fixed this session | ✅ `tests/e2e/regressions.spec.ts` (static, no browser needed) |
| CROSS-4 | Stripe checkout webhook | P2 | Full payment capture via Stripe test mode | Order's payment status updates from the webhook | ❌ manual (needs Stripe CLI + test webhook secret, out of scope for this pass) |

---

## Known gaps (not covered by this pass, tracked for later)

- Visual/pixel regression testing (this suite checks structure and behavior, not pixel-perfect layout).
- Mobile viewport / responsive behavior — the suite runs at desktop viewport only.
- Load/performance testing.
- Payment capture via real Stripe test-mode webhooks (see CROSS-4).
- Multi-step onboarding wizards for brand-new sellers/planners (SEL-13, PLN-9) — low regression risk, time-boxed out of this pass; add if onboarding starts changing frequently.
