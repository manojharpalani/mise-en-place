# WithMetta — Product Document

> Living spec. Updated as features ship. See git history for revision trail.

---

## Vision

WithMetta is a web-based local community commerce platform connecting independent licensed home chefs (MEHKO permit holders) with local buyers. Individual seller storefronts — not an aggregated marketplace. WhatsApp is the primary community engagement channel.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js App Router (latest) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js — email OTP + magic links, role-based |
| Storage | AWS S3 / Cloudflare R2 |
| Payments | Stripe (PaymentIntent, SetupIntent, Stripe Link) |
| Messaging | WhatsApp Business API (Meta Cloud API) + Twilio SMS |
| Email | SendGrid |
| AI | Anthropic Claude (Haiku for speed, vision for image tasks) |
| Hosting | Vercel + cron jobs |
| OG images | @vercel/og / Satori |

---

## Roles

| Role | Description |
|---|---|
| `BUYER` | Browse, order, subscribe, review |
| `SELLER` | Run a storefront, manage menu and orders |
| `EMPLOYEE` | Order manager on behalf of a seller |
| `ADMIN` | Platform moderation and approvals |
| `PLANNER` | Personal meal planner with optional public profile; can cross-sell to local home chefs |

---

## Data Model

### User
Fields: id, email (unique), phone (unique), name, image, role, locationLat/Lng, neighborhood, zip, notificationChannel (whatsapp/sms), stripeCustomerId, createdAt

### SellerProfile
Fields: id, userId, storeSlug (unique), storeName, bio, story, cuisineType, kitchenPhotos[], permitDocumentUrl, permitStatus (PENDING/APPROVED/REJECTED), deliveryEnabled, deliveryRadiusMiles, deliveryFee, pickupEnabled, pickupWindows, whatsappGroupId/Link, waPhoneNumberId, waAccessToken, waTemplateLanguage, waMenuTemplate, waArticleTemplate, waMarketingTemplate, waOrderTemplate, socialLinks, ratingAvg, reviewCount, isActive

### MenuItem
Fields: id, sellerId, name, description, price, salePrice, photoUrl, dietaryTags[], allergenTags[], cuisineTags[], availableQuantity, isActive, ingredients (JSON), ingredientsUpdatedAt

### ComboItem
Fields: id, sellerId, name, description, comboPrice, photoUrl, isActive
Relations: menuItems (ComboMenuItem bridge — menuItemId + quantity)

### WeeklyMenu / WeeklyMenuDay / WeeklyMenuDayItem / WeeklyMenuDayComboItem
- WeeklyMenu: sellerId, weekStartDate, weekEndDate, status (DRAFT/PUBLISHED), flyerImageUrl
- WeeklyMenuDay: weeklyMenuId, date (stored noon UTC), dayOfWeek
- WeeklyMenuDayItem: weeklyMenuDayId, menuItemId, quantity (default 10)
- WeeklyMenuDayComboItem: weeklyMenuDayId, comboItemId, quantity (default 10)

### Order
Fields: id, buyerId, sellerId, status (PENDING/PROCESSING/READY/DELIVERED/PICKED_UP/CANCELLED), fulfillmentType (PICKUP/DELIVERY), subtotal, deliveryFee, total, scheduledDate, pickupWindow, deliveryAddress, notes, stripePaymentIntentId
Relations: items (OrderItem — itemName, unitPrice, quantity, itemType)

### Review
Fields: id, orderId, buyerId, sellerId, rating (1–5), comment, createdAt

### Subscription
Fields: buyerId, sellerId, status, fulfillmentType, deliveryAddress, pickupWindow, scheduledDays[]

### Subscriber
Fields: phone, sellerId, channels (whatsapp/sms), status (ACTIVE/UNSUBSCRIBED)

### Article
Fields: sellerId, authorId, title, content, imageUrl, publishedAt

### PlannerProfile
Fields: id, userId, displayName, slug (unique), bio, cuisinePrefs[], householdSize (default 1), isPublic (default false), avatarUrl

### PlannerMenuItem
Fields: id, plannerId, name, description, servings, photoUrl, cuisineTags[], dietaryTags[], ingredients (JSON), isActive
Note: no price — planners track what they cook, not what they sell

### PlannerWeeklyMenu / PlannerWeeklyMenuDay / PlannerWeeklyMenuDayItem
- PlannerWeeklyMenu: plannerId, weekStartDate, weekEndDate, isPublished, flyerImageUrl
- PlannerWeeklyMenuDay: weeklyMenuId, date (noon UTC), dayOfWeek
- PlannerWeeklyMenuDayItem: weeklyMenuDayId, menuItemId, servings (default 1)

### PlannerSubscriber
Fields: plannerId, userId (nullable — can subscribe without account), email, subscribedAt, status (ACTIVE/UNSUBSCRIBED)
Note: reuses SubscriberStatus enum

### Supporting: Employee, CreditBalance, FavoriteSeller, IngredientList, Account, Session, VerificationToken

---

## App Structure

```
/app/(store)/[slug]/        Public storefronts
/app/(seller)/seller/       Seller dashboard
/app/(buyer)/buyer/         Buyer account
/app/(planner)/planner/     Meal planner (Sprint 1 in progress)
/app/(admin)/admin/         Admin panel
/app/api/                   API routes
```

---

## Features — Shipped History

Features are listed in the order they were built, grouped by area.

---

### AUTH

**Email/OTP sign-in and registration**
- `/api/auth/send-otp` — generates and emails a 6-digit OTP
- `/api/auth/register` — creates user with role
- OTP verification page at `/auth/verify`
- Role-based redirects post-login (buyer → /buyer, seller → /seller/dashboard, admin → /admin)

---

### SELLER ONBOARDING

**Two-step onboarding wizard** (`/seller/onboarding`)
- Step 1: storeName, storeSlug (auto-slugified, uniqueness checked)
- Step 2: cuisineType, bio
- Creates SellerProfile with `permitStatus: PENDING`

**Permit upload**
- Seller uploads permit document (PDF/image) to S3 via presigned URL
- `permitDocumentUrl` stored on SellerProfile
- `isActive: false` until admin approves

**Admin approval queue** (`/admin/sellers`)
- ApprovalCard component showing permit status
- `POST /api/sellers/[id]/approve` flips `permitStatus` to APPROVED and `isActive: true`

---

### PUBLIC STOREFRONT

**Storefront page** (`/[slug]`)
- Tabs: Menu, Combos, Weekly Plan, Articles, Reviews, About/Contact
- Cart sheet (quantity controls, persistent across tabs)
- Store header: name, cuisine type, kitchen photos, bio, social links
- Contact sidebar: pickup windows, delivery zone, WhatsApp link

**Open Graph images** (`/api/og/[slug]`)
- Dynamic OG card with store name, cuisine type, avatar

**Seller browse page** (`/sellers`)
- Grid of active seller cards with cuisine type, rating, favorite toggle

**Favorites** (`/buyer/favorites`)
- `POST /api/sellers/[id]/favorite` toggles FavoriteSeller record

---

### MENU ITEMS

**Menu item CRUD**
- `GET|POST /api/menu-items` — list all items for seller; create
- `GET|PATCH|DELETE /api/menu-items/[id]`
- Fields: name, description, price, salePrice, photoUrl, dietaryTags, allergenTags, cuisineTags, isActive
- Note: `availableQuantity` removed from the create form (2026-04-05); quantity is now set per day in the weekly planner

**AI thumbnail suggestion** (`/api/menu-items/suggest`)
- Triggered 800ms after user finishes typing the item name (debounced)
- Queries TheMealDB free API by name, then by individual word, then by seller's cuisine area as fallback
- Returns `description` (first 2 sentences of instructions) and `thumbnailUrl` (150px preview)
- Auto-fills description if field is empty; shows thumbnail preview with × to dismiss
- Thumbnail saved as `photoUrl` when item is created
- `www.themealdb.com` added to Next.js image allowlist

**AI dish inspiration** (`/api/menu-items/[id]/inspiration`)
- Dish Inspiration sheet in the weekly planner (click ✦ on any item)
- Claude generates serving ideas, pairing suggestions, and presentation tips

**Ingredient extraction** (`/api/menu-items/[id]/ingredients`)
- Stores structured ingredient list for grocery list generation
- Orange badge on items without ingredients in the planner

---

### COMBO MEALS

**Manual combo creation**
- "New Combo" button in the weekly planner toolbar
- Dialog: name, description, price, checkbox list of existing menu items (min 2)
- `POST /api/combos` creates ComboItem + ComboMenuItem bridge records
- New combos appear immediately in the "Manage Items" day dialog

**Combos on storefront**
- Combo tab on storefront with combo-card component
- Combo items in cart alongside regular items

---

### WEEKLY MENU PLANNER

**Core planner** (`/seller/menu`)
- Week tabs showing date ranges; active week highlighted
- Create plan: date range picker (Monday–Saturday default)
- Edit dates, delete plan
- Calendar grid: one card per day showing all items assigned

**Adding items to days**
- "+ Add item" button on each day card
- "Manage Items" dialog with two sections: Menu Items + Combos
- Toggle Add/Remove per item (shows as highlighted if already added)
- Default quantity: 10 per item when added

**Per-day quantity controls**
- −/N/+ controls on each item chip in the day card
- PATCH call updates quantity immediately

**Remove items from day**
- Trash icon on each item chip
- "Remove" button in Manage Items dialog

**Clear day / Clear week**
- Trash icon in day card header (visible when day has items) — clears that day after confirm
- "Clear Week" button in toolbar — clears all days after confirm
- `DELETE /api/menu/[id]/days/[dayId]/items` with `clearAll: true`
- `DELETE /api/menu/[id]/clear` — week-level clear

**Timezone fix (UTC)**
- Dates stored at noon UTC to avoid local-midnight timezone drift
- Day names derived from `date.getUTCDay()` not the stored `dayOfWeek` string (fixes Friday→Thursday bug for UTC+ timezones)

**Grocery list** (GroceryList component)
- Auto-generates ingredient shopping list from menu items
- Highlights items missing ingredient data

**Flyer generation**
- FlyerCanvas component (hidden off-screen, always in DOM)
- html-to-image captures it as PNG
- Flyer modal: download button + "Share on WhatsApp" deeplink

**Publish & Notify**
- `POST /api/menu/[id]/publish` sets status to PUBLISHED
- Sends WhatsApp message to subscribers:
  - Uses approved Meta template if `seller.waMenuTemplate` is configured
  - Falls back to free-form text message

**AI Plan Week**
- "AI Plan Week" button (Wand icon) in toolbar
- Dialog inputs:
  - Free-text inspiration prompt (optional)
  - Reference image upload (optional) — resized client-side to max 1024px JPEG
  - Items per day: 1 / 2 / 3
  - Include combos: Yes / No
  - Combo size: 2-item / 3-item (shown when combos enabled)
- `POST /api/menu/[id]/ai-plan`:
  - Loads seller's existing catalog (menu items + combos) and cuisine type
  - Checks last 4 weeks of menus to avoid repeating dishes
  - Passes image as Claude vision block if provided (with note that it could be handwritten menu, food photo, or reference)
  - Claude (Haiku) generates a day-by-day plan using `existing:ID` refs or `new:tempId` refs
  - Creates new menu items and combos in DB as needed
  - Adds everything to the correct days (skips duplicates)
  - Returns updated menu + toast summary

**Import from Image**
- "Import from Image" button in toolbar
- Two-step dialog:
  - Step 1: upload image (JPG/PNG/WEBP, resized client-side to max 1024px)
  - "Analyze Menu" → `POST /api/menu/[id]/import-image` with `action: 'analyze'`
  - Claude vision extracts day-by-day dish names, prices if visible, combo detection
  - Step 2: review extracted plan — checkboxes on every item (all checked by default)
  - Combos show "Combo" badge and component names
  - "← Re-upload" to go back
  - "Import to Week" → `POST /api/menu/[id]/import-image` with `action: 'apply'`
  - Apply logic: name-matches against existing items (case-insensitive), creates new items/combos only if not found
  - Skips items already assigned to that day
  - Returns updated menu + refreshed catalogs + summary toast

---

### ORDERS

**Checkout flow**
- Cart → checkout page
- Fulfillment type selection (pickup/delivery)
- Scheduled date + pickup window or delivery address
- Order notes
- `POST /api/checkout` creates Stripe PaymentIntent
- Stripe Elements card form + Stripe Link
- On success: creates Order + OrderItems

**Buyer order list** (`/buyer/orders`)
- All orders, sorted newest first
- Each card shows: store name, status badge, date, items, total, fulfillment type
- Cards are clickable — navigate to detail page
- Action buttons (review, cancel) use stopPropagation to not trigger navigation

**Buyer order detail** (`/buyer/orders/[id]`)
- Full receipt: order ID (last 8 chars), status badge, status message
- Sections: store/date/fulfillment details, items with unit prices, subtotal/delivery fee/total
- Review section (stars or ReviewButton) for completed orders
- Cancel button for PENDING orders

**Seller order management** (`/seller/orders`)
- Filter tabs: ALL / PENDING / PROCESSING / READY / DELIVERED / PICKED_UP / CANCELLED
- Status progression buttons: Start Processing → Mark Ready → Mark Delivered / Mark Picked Up
- Order cards: buyer name/phone, fulfillment details, scheduled date, item list, total
- Cancel modal with reason picker (5 options + Other free-text)
  - Reason required for PROCESSING orders, optional for PENDING

**Order status API** (`PATCH /api/orders/[id]/status`)
- Validates transition rules
- Triggers WhatsApp notification to buyer on status change (if buyer has phone + seller has WA configured)

**Order cancellation** (`POST /api/orders/[id]/cancel`)
- Buyers: PENDING orders only
- Sellers/Admin: PENDING or PROCESSING (reason required for PROCESSING)
- Stripe refund triggered automatically if `stripePaymentIntentId` exists and payment `status === 'succeeded'`
- WhatsApp notification to the other party:
  - Buyer cancels → notifies seller
  - Seller cancels → notifies buyer with reason + refund info

---

### REVIEWS

**Submit review** (`POST /api/reviews`)
- Only allowed on DELIVERED or PICKED_UP orders
- One review per order
- Fields: rating (1–5 stars), comment (optional)

**ReviewDialog component**
- 5-star picker with hover state
- Optional comment textarea
- OrderReviewButton wrapper opens dialog

**Review display (buyer)**
- StarDisplay component on order cards and detail pages
- Shows "Your review" label with star rating

**Seller dashboard ratings**
- Avg Rating + Total Reviews stat cards
- "Recent Reviews" card (last 5): stars, comment, buyer name, date
- `ratingAvg` and `reviewCount` recomputed from actual reviews on seed

---

### BUYER PROFILE

**Profile page** (`/buyer/profile`)
- Name, email display
- Phone (required field) with uniqueness check (409 if taken)
- Notification channel toggle: WhatsApp / SMS
- `PUT /api/profile` handles phone + notificationChannel updates

**Payment methods** (`/api/profile/payment-methods`)
- GET: lists saved cards via Stripe Customer
- POST: creates Stripe Customer if needed, returns SetupIntent clientSecret
- DELETE: verifies ownership, detaches payment method
- PaymentMethods component with SetupForm using Stripe PaymentElement (supports Stripe Link automatically)
- Shows card brand, last 4, expiry; Link badge for Link-saved cards

---

### STOREFRONT SUBSCRIBE FORM

- Phone (required) + channel selection: WhatsApp (default checked) / SMS only
- Email channel removed (2026-03-28)
- Subscribes to seller's notification list for menu updates

---

### WHATSAPP BUSINESS INTEGRATION

**Free-form messages** (`sendWhatsAppMessage` in lib/whatsapp.ts)
- Used for order status updates, cancellation notices when no template configured
- Requires waPhoneNumberId + waAccessToken on SellerProfile

**Template messages** (`sendWhatsAppTemplate`)
- Used for weekly menu publish, article shares, marketing broadcasts
- Sends `type: 'template'` with body parameters (positional `{{1}}` … `{{N}}`)

**Template configuration** (Seller Settings → WhatsApp → Message Templates)
- 4 template name inputs: Weekly Menu, Article, Marketing, Order Update
- Template language field
- Amber info box explaining Meta approval requirement (~1 week review)
- Template names to create in Meta Business Manager:
  - `metta_weekly_menu` — params: store_name, week_dates, menu_summary, store_url
  - `metta_article` — params: store_name, article_title, article_excerpt, article_url
  - `metta_marketing` — params: store_name, message_body, cta_url
  - `metta_order_update` — params: customer_name, order_id, new_status, store_url

---

### SELLER SETTINGS

**Settings page** (`/seller/settings`)
- Store info: name, slug, bio, story, cuisineType
- Delivery: enabled toggle, radius (miles), fee ($)
- Pickup: enabled toggle, pickup windows (JSON)
- Kitchen photos: upload/manage
- WhatsApp Integration section:
  - Phone Number ID, Access Token
  - Group ID + Group Link
  - Message Templates (4 template name inputs + language)
- Social links

---

### SELLER CONTENT (ARTICLES)

**Article management** (`/seller/content`)
- Create/edit/delete articles with title, body, image
- `POST /api/marketing/send` broadcasts article via WhatsApp template to subscribers

---

### SELLER EARNINGS

**Earnings page** (`/seller/earnings`)
- Revenue breakdown by period
- Note: Stripe payouts to sellers are V2 (V1 holds funds on platform)

---

### ADMIN PANEL

**Dashboard** (`/admin/dashboard`)
- Platform metrics: total users, revenue, orders, active sellers

**Seller approvals** (`/admin/sellers`)
- SellersClient component with ApprovalCard
- Approve / Reject with permitStatus update + isActive toggle

**Buyers, Orders, Content**
- List views for support and moderation

---

### SEED DATA

`prisma/seed.ts` creates:
- 1 seller (seller@example.com) with South Indian cuisine, approved profile
- 6 menu items (Chicken Biryani, Masala Dosa, Paneer Butter Masala, Veg Pulao, Sambar Rice, Curd Rice)
- 1 published weekly menu with items on each day
- 5 buyers (buyer@example.com through buyer5@example.com)
- 16 orders spread over 4 weeks across multiple buyers
- 8 reviews with real comments
- ratingAvg + reviewCount computed from actual reviews

---

## Pages Index

| Path | Description |
|---|---|
| `/` | Landing page |
| `/sellers` | Browse active sellers |
| `/[slug]` | Public storefront |
| `/auth/signin` | Sign in |
| `/auth/signup` | Register |
| `/auth/verify` | OTP verification |
| `/checkout` | Cart → payment |
| `/buyer/orders` | Order history |
| `/buyer/orders/[id]` | Order receipt / detail |
| `/buyer/subscriptions` | Weekly subscriptions |
| `/buyer/favorites` | Saved sellers |
| `/buyer/profile` | Profile + payment methods |
| `/seller/dashboard` | KPIs + recent reviews |
| `/seller/menu` | Weekly planner + AI plan |
| `/seller/content` | Articles / WhatsApp posts |
| `/seller/orders` | Order management |
| `/seller/marketing` | Subscriber list + broadcasts |
| `/seller/employees` | Team management |
| `/seller/settings` | Store settings + WA config |
| `/seller/earnings` | Revenue analytics |
| `/seller/onboarding` | Setup wizard |
| `/admin/dashboard` | Platform metrics |
| `/admin/sellers` | Approval queue |
| `/admin/buyers` | Buyer list |
| `/admin/orders` | Order monitoring |
| `/admin/content` | Content moderation |
| `/planner/dashboard` | Planner home — stats, quick actions, public profile link |
| `/planner/menu` | Weekly meal planner (PlannerWeeklyPlanner) |
| `/planner/grocery` | Grocery list scaled by household size |
| `/planner/profile` | Edit planner settings |
| `/planner/onboarding` | Planner setup wizard |
| `/u/[slug]` | Public planner profile — bio, published menus, follow button, Inspired By |

---

## API Routes Index

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/send-otp` | Send OTP email |
| POST | `/api/auth/register` | Register new user |
| GET/POST | `/api/sellers` | List / create seller |
| GET/PUT/DELETE | `/api/sellers/[id]` | Seller CRUD |
| POST | `/api/sellers/[id]/approve` | Admin approve seller |
| POST | `/api/sellers/[id]/favorite` | Toggle favorite |
| GET/POST | `/api/menu-items` | List / create menu item |
| GET/PATCH/DELETE | `/api/menu-items/[id]` | Menu item CRUD |
| POST | `/api/menu-items/[id]/ingredients` | Save ingredients |
| GET | `/api/menu-items/[id]/inspiration` | AI dish inspiration |
| GET | `/api/menu-items/suggest` | Auto-suggest thumbnail + description |
| POST | `/api/combos` | Create combo meal |
| GET/POST | `/api/menu` | List / create weekly menu |
| GET/PATCH/DELETE | `/api/menu/[id]` | Menu CRUD |
| POST | `/api/menu/[id]/publish` | Publish menu + notify |
| DELETE | `/api/menu/[id]/clear` | Clear all items from week |
| POST | `/api/menu/[id]/ai-plan` | Generate AI meal plan (text + vision) |
| POST | `/api/menu/[id]/import-image` | Import plan from image (analyze + apply) |
| POST | `/api/menu/[id]/flyer` | Generate flyer image |
| POST | `/api/menu/[id]/days/[dayId]/items` | Add item to day |
| PATCH | `/api/menu/[id]/days/[dayId]/items` | Update item quantity |
| DELETE | `/api/menu/[id]/days/[dayId]/items` | Remove item (or clearAll) from day |
| GET/POST | `/api/orders` | List / create order |
| GET/PUT | `/api/orders/[id]` | Order detail / update |
| PATCH | `/api/orders/[id]/status` | Update order status |
| POST | `/api/orders/[id]/cancel` | Cancel order + refund |
| POST | `/api/checkout` | Create Stripe PaymentIntent |
| GET/POST | `/api/subscriptions` | List / create subscription |
| POST | `/api/subscriptions/[id]/skip` | Skip subscription day |
| POST | `/api/reviews` | Submit review |
| GET/POST | `/api/articles` | List / create article |
| GET/PUT/DELETE | `/api/articles/[id]` | Article CRUD |
| POST | `/api/marketing/send` | WhatsApp broadcast |
| GET/POST | `/api/subscribers` | Manage subscribers |
| GET/PUT | `/api/profile` | User profile |
| GET/POST/DELETE | `/api/profile/payment-methods` | Stripe payment methods |
| GET/POST | `/api/employees` | List / invite employee |
| GET/PUT/DELETE | `/api/employees/[id]` | Employee CRUD |
| POST | `/api/upload` | S3 presigned URL |
| POST | `/api/webhooks/stripe` | Stripe webhook handler |
| GET | `/api/storefront/[slug]` | Public storefront data |
| GET | `/api/og/[slug]` | OG image |
| POST | `/api/cron/daily-menu` | Cron: daily WA menu post |
| GET/POST/PATCH | `/api/planner/profile` | Planner profile CRUD |
| GET/POST | `/api/planner/menu-items` | Planner dish library |
| PATCH/DELETE | `/api/planner/menu-items/[id]` | Update/soft-delete dish |
| GET/POST | `/api/planner/menu` | List/create planner weekly menus |
| DELETE/PATCH | `/api/planner/menu/[id]` | Delete / update dates / toggle publish |
| POST/PATCH/DELETE | `/api/planner/menu/[id]/days/[dayId]/items` | Add/update/remove day items |
| DELETE | `/api/planner/menu/[id]/clear` | Clear all items from week |
| POST | `/api/planner/menu/[id]/ai-plan` | AI meal plan (text + vision) |
| GET | `/api/planner/ingredients` | Grocery list for planner menu |
| POST/DELETE | `/api/planner/[slug]/subscribe` | Follow/unfollow planner |
| GET | `/api/planner/inspired-by` | Fuzzy-match dishes to local seller items |

---

### PLANNER PIVOT — Sprint 1 (schema shipped 2026-04-16, UI in progress)

**Goal:** Support individual/family meal planners and food influencers who want to plan meals privately or share publicly, with optional pathway to start ordering from or selling to local home chefs.

**Schema additions (migration: `20260416173126_add_planner_role`)**
- `UserRole.PLANNER` added to enum
- `PlannerProfile` — slug, displayName, bio, cuisinePrefs, householdSize, isPublic
- `PlannerMenuItem` — personal dish library (no price); servings-based
- `PlannerWeeklyMenu` + `PlannerWeeklyMenuDay` + `PlannerWeeklyMenuDayItem` — mirrors seller weekly menu structure
- `PlannerSubscriber` — follows/subscribers for public planners

**Roadmap — Sprint 1 remaining:**
- Add "Plan Meals" option to signup page (`/auth/signup`)
- Create `/planner/onboarding` wizard
- Create `POST/GET/PATCH /api/planner/profile`
- Create `PlannerMenuItem` CRUD APIs
- Create planner weekly menu APIs (mirror seller menu APIs)
- Mount `WeeklyMenuPlanner` in `mode: 'planner'` on `/planner/menu` (hides price/combos/publish; shows servings)
- Scale grocery list quantities by `householdSize`
- Create `/planner` dashboard

**Sprint 2 — Public profiles & social sharing (shipped 2026-04-16):**
- `/u/[slug]` — public planner profile page: bio, cuisine prefs, published weekly menus with dish pills, follower count
- `POST/DELETE /api/planner/[slug]/subscribe` — follow/unfollow; logged-in users follow instantly, guests enter email
- `PlannerFollowButton` — follow/unfollow button with email dialog for guests
- Publish toggle on planner toolbar — marks `isPublished: true`, visible on public profile
- Planner flyer canvas (`PlannerFlyerCanvas`) — pastel gradient, servings labels, "Planned with metta" footer
- Share to WhatsApp — deeplink with week summary text + profile URL
- Flyer dialog — download PNG + WhatsApp share

**Sprint 3 — "Inspired by" cross-sell (shipped 2026-04-16):**
- `GET /api/planner/inspired-by?names=...` — fuzzy-matches planner dish names against active seller `MenuItem` catalog; returns top 3 seller matches per dish with price, location-weighted score
- `InspiredBy` component — rendered on public profile page below published menus; fetches matches client-side, shows seller cards with name/price/cuisine linking to storefront

---

## Known Constraints & Decisions

- **Stripe payouts to sellers are V2** — V1 holds funds on the platform
- **WhatsApp templates need Meta approval** (~1 week) before use; free-form fallback used until approved
- **MEHKO permit verification** is manual (admin reviews uploaded document)
- **Dates stored at noon UTC** to avoid timezone drift for UTC+ clients
- **Day names derived from `date.getUTCDay()`** not the stored `dayOfWeek` string — fixes timezone bug for existing data without a migration
- **TheMealDB** used for free dish thumbnails (no API key required); covers ~25 cuisine areas
- **Image payloads** resized client-side to max 1024px JPEG before sending to API (keeps base64 body under Next.js 4MB limit)
- **Stripe Link** built into PaymentElement automatically when SetupIntent includes `link` payment method type
