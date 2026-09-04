import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { subDays, subHours, addDays } from 'date-fns'

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/miseenplace'
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter } as any)

const now = new Date()

async function main() {
  // ── Admin ──────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@miseenplace.local' },
    update: {},
    create: {
      email: 'admin@miseenplace.local',
      name: 'Platform Admin',
      role: 'ADMIN',
      emailVerified: now,
    },
  })
  console.log('✓ Admin:', admin.email)

  // ── Seller ─────────────────────────────────────────────────────
  const sellerUser = await prisma.user.upsert({
    where: { email: 'chef@example.com' },
    update: {},
    create: {
      email: 'chef@example.com',
      name: 'Chef Maya',
      role: 'SELLER',
      emailVerified: now,
      neighborhood: 'Mission District',
      zip: '94110',
    },
  })

  const seller = await prisma.sellerProfile.upsert({
    where: { userId: sellerUser.id },
    update: { ratingAvg: 4.7, reviewCount: 8, storeSlug: 'chef-maya', kitchenPhotos: ['/seller-covers/chef-maya.jpg'] },
    create: {
      userId: sellerUser.id,
      storeSlug: 'chef-maya',
      storeName: "Chef Maya's Kitchen",
      kitchenPhotos: ['/seller-covers/chef-maya.jpg'],
      bio: 'Home cook with 15 years of experience, specializing in South Indian cuisine. MEHKO certified.',
      story: 'I started cooking professionally after years of feeding my neighbors. Every dish is made with love and the freshest local ingredients.',
      cuisineType: 'South Indian',
      permitStatus: 'APPROVED',
      isActive: true,
      deliveryEnabled: true,
      deliveryRadiusMiles: 5,
      deliveryFee: 3,
      pickupEnabled: true,
      pickupWindows: [{ day: 'MON-SAT', startTime: '5:00 PM', endTime: '7:00 PM' }],
      socialLinks: { instagram: 'https://instagram.com/chefmaya', email: 'chef@example.com' },
      ratingAvg: 4.7,
      reviewCount: 8,
    },
  })
  console.log('✓ Seller:', seller.storeName)

  // ── Menu Items ─────────────────────────────────────────────────
  const [masalaDosa, choleBhature, sambarRice, idliSambar, paneerButter, chickenBiryani] = await Promise.all([
    prisma.menuItem.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1, sellerId: seller.id,
        name: 'Masala Dosa', price: 12, salePrice: 10,
        description: 'Crispy rice crepe stuffed with spiced potato filling. Served with sambar and chutneys.',
        dietaryTags: ['vegan', 'gluten-free'], cuisineTags: ['South Indian'], availableQuantity: 20,
      },
    }),
    prisma.menuItem.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2, sellerId: seller.id,
        name: 'Chole Bhature', price: 14,
        description: 'Spiced chickpea curry served with fluffy deep-fried bread. A Punjabi classic.',
        dietaryTags: ['vegetarian'], cuisineTags: ['North Indian'], availableQuantity: 15,
      },
    }),
    prisma.menuItem.upsert({
      where: { id: 3 },
      update: {},
      create: {
        id: 3, sellerId: seller.id,
        name: 'Sambar Rice', price: 10,
        description: 'Comforting lentil and vegetable stew served over steamed rice.',
        dietaryTags: ['vegan'], cuisineTags: ['South Indian'], availableQuantity: 25,
      },
    }),
    prisma.menuItem.upsert({
      where: { id: 4 },
      update: {},
      create: {
        id: 4, sellerId: seller.id,
        name: 'Idli Sambar', price: 9,
        description: 'Steamed rice cakes served with sambar and coconut chutney.',
        dietaryTags: ['vegan', 'gluten-free'], cuisineTags: ['South Indian'], availableQuantity: 30,
      },
    }),
    prisma.menuItem.upsert({
      where: { id: 5 },
      update: {},
      create: {
        id: 5, sellerId: seller.id,
        name: 'Paneer Butter Masala', price: 15,
        description: 'Soft paneer cubes in a rich, creamy tomato-butter sauce.',
        dietaryTags: ['vegetarian'], cuisineTags: ['North Indian'], availableQuantity: 20,
      },
    }),
    prisma.menuItem.upsert({
      where: { id: 6 },
      update: {},
      create: {
        id: 6, sellerId: seller.id,
        name: 'Chicken Biryani', price: 18,
        description: 'Fragrant basmati rice layered with spiced chicken, fried onions, and saffron.',
        dietaryTags: [], cuisineTags: ['Hyderabadi'], availableQuantity: 15,
      },
    }),
  ])
  console.log('✓ 6 menu items')

  // ── Weekly Menu (current week Mon–Fri) ─────────────────────────
  const monday = (() => {
    const d = new Date(now)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    d.setUTCHours(12, 0, 0, 0)
    return d
  })()

  const existingMenu = await prisma.weeklyMenu.findFirst({ where: { sellerId: seller.id } })
  if (!existingMenu) {
    const menu = await prisma.weeklyMenu.create({
      data: {
        sellerId: seller.id,
        weekStartDate: monday,
        weekEndDate: addDays(monday, 4),
        status: 'PUBLISHED',
        days: {
          create: [
            { date: monday, dayOfWeek: 'Monday' },
            { date: addDays(monday, 1), dayOfWeek: 'Tuesday' },
            { date: addDays(monday, 2), dayOfWeek: 'Wednesday' },
            { date: addDays(monday, 3), dayOfWeek: 'Thursday' },
            { date: addDays(monday, 4), dayOfWeek: 'Friday' },
          ],
        },
      },
      include: { days: true },
    })

    const [mon, tue, wed, thu, fri] = menu.days
    await Promise.all([
      prisma.weeklyMenuDayItem.create({ data: { weeklyMenuDayId: mon.id, menuItemId: masalaDosa.id, quantity: 20 } }),
      prisma.weeklyMenuDayItem.create({ data: { weeklyMenuDayId: mon.id, menuItemId: sambarRice.id, quantity: 25 } }),
      prisma.weeklyMenuDayItem.create({ data: { weeklyMenuDayId: tue.id, menuItemId: choleBhature.id, quantity: 15 } }),
      prisma.weeklyMenuDayItem.create({ data: { weeklyMenuDayId: tue.id, menuItemId: paneerButter.id, quantity: 20 } }),
      prisma.weeklyMenuDayItem.create({ data: { weeklyMenuDayId: wed.id, menuItemId: idliSambar.id, quantity: 30 } }),
      prisma.weeklyMenuDayItem.create({ data: { weeklyMenuDayId: thu.id, menuItemId: chickenBiryani.id, quantity: 15 } }),
      prisma.weeklyMenuDayItem.create({ data: { weeklyMenuDayId: thu.id, menuItemId: masalaDosa.id, quantity: 20 } }),
      prisma.weeklyMenuDayItem.create({ data: { weeklyMenuDayId: fri.id, menuItemId: paneerButter.id, quantity: 15 } }),
      prisma.weeklyMenuDayItem.create({ data: { weeklyMenuDayId: fri.id, menuItemId: sambarRice.id, quantity: 25 } }),
    ])
    console.log('✓ Weekly menu with items')
  } else {
    console.log('~ Weekly menu already exists, skipping')
  }


  // ── Additional Sellers (populated Find Chefs marketplace for demo) ──
  const sellerSeeds = [
    {
      email: 'giulia@example.com', name: 'Giulia Romano', neighborhood: 'North Beach', zip: '94133',
      storeSlug: 'nonnas-table', storeName: "Nonna's Table",
      bio: 'Handmade pasta and Sunday-gravy classics, just like my grandmother taught me in Bologna.',
      story: "I grew up rolling pasta dough on my nonna's kitchen table. Now I bring that same recipe box to San Francisco, one tray at a time.",
      cuisineType: 'Italian', ratingAvg: 4.8, reviewCount: 21, coverPhoto: '/seller-covers/nonnas-table.jpg',
      deliveryEnabled: true, deliveryRadiusMiles: 4, deliveryFee: 4, pickupEnabled: true,
      items: [
        { name: 'Cacio e Pepe', price: 16, description: 'Fresh tonnarelli tossed in Pecorino Romano and cracked black pepper.', dietaryTags: ['vegetarian'], cuisineTags: ['Italian'] },
        { name: 'Lasagna alla Bolognese', price: 18, description: 'Layered pasta with slow-simmered beef ragù and béchamel.', dietaryTags: [], cuisineTags: ['Italian'] },
        { name: 'Margherita Panzanella', price: 12, description: 'Tuscan bread salad with heirloom tomatoes, basil, and fresh mozzarella.', dietaryTags: ['vegetarian'], cuisineTags: ['Italian'] },
        { name: 'Tiramisu', price: 8, description: 'Espresso-soaked ladyfingers layered with mascarpone cream.', dietaryTags: ['vegetarian'], cuisineTags: ['Italian'] },
      ],
    },
    {
      email: 'mateo@example.com', name: 'Mateo Reyes', neighborhood: 'Excelsior', zip: '94112',
      storeSlug: 'taco-loco', storeName: 'Taco Loco',
      bio: 'Street-style tacos and salsas made fresh daily — the flavors of Jalisco, right in your neighborhood.',
      story: 'My family ran a taco stand back home for three generations. Taco Loco is my way of keeping that tradition alive.',
      cuisineType: 'Mexican', ratingAvg: 4.6, reviewCount: 34, coverPhoto: '/seller-covers/taco-loco.jpg',
      deliveryEnabled: true, deliveryRadiusMiles: 6, deliveryFee: 3, pickupEnabled: true,
      items: [
        { name: 'Tacos al Pastor (3)', price: 11, description: 'Marinated pork, pineapple, onion, and cilantro on corn tortillas.', dietaryTags: [], cuisineTags: ['Mexican'] },
        { name: 'Birria Tacos (3)', price: 14, description: 'Slow-braised beef tacos served with consommé for dipping.', dietaryTags: [], cuisineTags: ['Mexican'] },
        { name: 'Elote', price: 6, description: 'Grilled corn with crema, cotija, chili powder, and lime.', dietaryTags: ['vegetarian', 'gluten-free'], cuisineTags: ['Mexican'] },
        { name: 'Vegan Jackfruit Tacos (3)', price: 12, description: 'Slow-cooked jackfruit carnitas with pickled onion and salsa verde.', dietaryTags: ['vegan'], cuisineTags: ['Mexican'] },
      ],
    },
    {
      email: 'jin@example.com', name: 'Jin Park', neighborhood: 'Richmond District', zip: '94121',
      storeSlug: 'seoul-kitchen', storeName: 'Seoul Kitchen',
      bio: 'Home-style Korean banchan, bibimbap, and kimchi fermented in small batches.',
      story: 'I started fermenting kimchi in my apartment during the pandemic and never stopped. Now the whole neighborhood gets a jar.',
      cuisineType: 'Korean', ratingAvg: 4.9, reviewCount: 15, coverPhoto: '/seller-covers/seoul-kitchen.jpg',
      deliveryEnabled: false, deliveryRadiusMiles: null, deliveryFee: null, pickupEnabled: true,
      items: [
        { name: 'Bibimbap', price: 15, description: 'Mixed rice bowl with seasonal vegetables, gochujang, and a fried egg.', dietaryTags: ['vegetarian'], cuisineTags: ['Korean'] },
        { name: 'Kimchi Jjigae', price: 13, description: 'Bubbling kimchi stew with tofu and pork belly.', dietaryTags: [], cuisineTags: ['Korean'] },
        { name: 'Japchae', price: 12, description: 'Stir-fried glass noodles with vegetables and sesame oil.', dietaryTags: ['vegan'], cuisineTags: ['Korean'] },
        { name: 'House Kimchi (16oz jar)', price: 9, description: 'Small-batch fermented napa cabbage kimchi.', dietaryTags: ['vegan', 'gluten-free'], cuisineTags: ['Korean'] },
      ],
    },
  ]

  let nextMenuItemId = 7
  for (const s of sellerSeeds) {
    const sUser = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: { email: s.email, name: s.name, role: 'SELLER', emailVerified: now, neighborhood: s.neighborhood, zip: s.zip },
    })

    const sProfile = await prisma.sellerProfile.upsert({
      where: { userId: sUser.id },
      update: { ratingAvg: s.ratingAvg, reviewCount: s.reviewCount, kitchenPhotos: [s.coverPhoto] },
      create: {
        userId: sUser.id, storeSlug: s.storeSlug, storeName: s.storeName, bio: s.bio, story: s.story,
        cuisineType: s.cuisineType, permitStatus: 'APPROVED', isActive: true,
        deliveryEnabled: s.deliveryEnabled, deliveryRadiusMiles: s.deliveryRadiusMiles, deliveryFee: s.deliveryFee,
        pickupEnabled: s.pickupEnabled, pickupWindows: [{ day: 'MON-SAT', startTime: '5:00 PM', endTime: '7:00 PM' }],
        socialLinks: { email: s.email }, ratingAvg: s.ratingAvg, reviewCount: s.reviewCount,
        kitchenPhotos: [s.coverPhoto],
      },
    })

    for (const item of s.items) {
      const id = nextMenuItemId++
      await prisma.menuItem.upsert({
        where: { id },
        update: {},
        create: { id, sellerId: sProfile.id, name: item.name, price: item.price, description: item.description, dietaryTags: item.dietaryTags, cuisineTags: item.cuisineTags, availableQuantity: 20 },
      })
    }
    console.log(`✓ Seller: ${sProfile.storeName} (${s.items.length} items)`)
  }

  // ── A seller awaiting approval (demonstrates the admin approval queue) ──
  const pendingUser = await prisma.user.upsert({
    where: { email: 'newchef@example.com' },
    update: {},
    create: { email: 'newchef@example.com', name: 'Dana Kowalski', role: 'SELLER', emailVerified: now, neighborhood: 'Outer Sunset', zip: '94122' },
  })
  await prisma.sellerProfile.upsert({
    where: { userId: pendingUser.id },
    update: {},
    create: {
      userId: pendingUser.id, storeSlug: 'danas-bakehouse', storeName: "Dana's Bakehouse",
      bio: 'Sourdough loaves and laminated pastries baked fresh every morning.',
      cuisineType: 'Bakery', permitStatus: 'PENDING', isActive: false, pickupEnabled: true,
    },
  })
  console.log("✓ Pending seller: Dana's Bakehouse (awaiting admin approval — won't show on Find Chefs yet)")

  // ── Buyers ─────────────────────────────────────────────────────
  const buyerData = [
    { email: 'buyer@example.com', name: 'Alex Chen', neighborhood: 'Mission District', zip: '94110' },
    { email: 'priya@example.com', name: 'Priya Sharma', neighborhood: 'Castro', zip: '94114' },
    { email: 'james@example.com', name: 'James Okafor', neighborhood: 'Noe Valley', zip: '94131' },
    { email: 'sofia@example.com', name: 'Sofia Martinez', neighborhood: 'Bernal Heights', zip: '94110' },
    { email: 'kevin@example.com', name: 'Kevin Wu', neighborhood: 'Glen Park', zip: '94131' },
  ]

  const buyers = await Promise.all(
    buyerData.map(b =>
      prisma.user.upsert({
        where: { email: b.email },
        update: {},
        create: { ...b, role: 'BUYER', emailVerified: now },
      })
    )
  )
  console.log(`✓ ${buyers.length} buyers`)

  // ── Subscribers ────────────────────────────────────────────────
  for (const buyer of buyers.slice(0, 3)) {
    await prisma.subscriber.upsert({
      where: { id: `sub-${buyer.id}-${seller.id}`.slice(0, 25) },
      update: {},
      create: {
        id: `sub-${buyer.id}-${seller.id}`.slice(0, 25),
        buyerId: buyer.id,
        sellerId: seller.id,
        channels: ['whatsapp'],
        phone: '+14155550100',
        status: 'ACTIVE',
      },
    }).catch(() => {/* ignore dup */})
  }

  // ── Orders ─────────────────────────────────────────────────────
  // Skip if orders already exist for this seller
  const existingOrderCount = await prisma.order.count({ where: { sellerId: seller.id } })
  const skipOrders = existingOrderCount > 0
  if (skipOrders) {
    console.log(`~ ${existingOrderCount} orders already exist, skipping order/review seed`)
  }

  const orderTemplates: Array<{
    buyer: typeof buyers[0]
    daysAgo: number
    hoursAgo?: number
    status: 'PENDING' | 'PROCESSING' | 'READY' | 'DELIVERED' | 'PICKED_UP' | 'CANCELLED'
    fulfillment: 'PICKUP' | 'DELIVERY'
    items: Array<{ item: typeof masalaDosa; qty: number }>
    review?: { rating: number; comment?: string }
  }> = [
    // Week 1 (28–22 days ago) — completed, all reviewed
    {
      buyer: buyers[0], daysAgo: 28, status: 'DELIVERED', fulfillment: 'DELIVERY',
      items: [{ item: masalaDosa, qty: 2 }, { item: sambarRice, qty: 1 }],
      review: { rating: 5, comment: 'Absolutely delicious! The dosa was perfectly crispy and the sambar was so flavorful. Will definitely order again.' },
    },
    {
      buyer: buyers[1], daysAgo: 26, status: 'PICKED_UP', fulfillment: 'PICKUP',
      items: [{ item: choleBhature, qty: 2 }],
      review: { rating: 5, comment: 'Best chole bhature I\'ve had outside of Delhi. Fresh, hot, and perfectly portioned.' },
    },
    {
      buyer: buyers[2], daysAgo: 24, status: 'DELIVERED', fulfillment: 'DELIVERY',
      items: [{ item: paneerButter, qty: 1 }, { item: sambarRice, qty: 2 }],
      review: { rating: 4, comment: 'Really good paneer butter masala. The rice was a bit plain but overall a great meal.' },
    },

    // Week 2 (21–15 days ago) — mix of reviewed and not
    {
      buyer: buyers[3], daysAgo: 21, status: 'DELIVERED', fulfillment: 'DELIVERY',
      items: [{ item: chickenBiryani, qty: 1 }],
      review: { rating: 5, comment: 'The biryani was incredible — layers of flavor and perfectly cooked chicken. Felt like home cooking.' },
    },
    {
      buyer: buyers[4], daysAgo: 19, status: 'PICKED_UP', fulfillment: 'PICKUP',
      items: [{ item: idliSambar, qty: 3 }],
      review: { rating: 4, comment: 'Soft idlis and great sambar. A bit more chutney would have been perfect!' },
    },
    {
      buyer: buyers[0], daysAgo: 17, status: 'DELIVERED', fulfillment: 'DELIVERY',
      items: [{ item: masalaDosa, qty: 1 }, { item: idliSambar, qty: 2 }],
      review: { rating: 5, comment: 'Consistent quality every time. Maya\'s food never disappoints.' },
    },
    {
      buyer: buyers[2], daysAgo: 15, status: 'CANCELLED', fulfillment: 'PICKUP',
      items: [{ item: choleBhature, qty: 2 }],
    },

    // Week 3 (14–8 days ago)
    {
      buyer: buyers[1], daysAgo: 14, status: 'DELIVERED', fulfillment: 'DELIVERY',
      items: [{ item: paneerButter, qty: 2 }, { item: masalaDosa, qty: 1 }],
      review: { rating: 4, comment: 'Loved it. Paneer was so soft and the dosa arrived still crispy. Great packaging!' },
    },
    {
      buyer: buyers[3], daysAgo: 12, status: 'PICKED_UP', fulfillment: 'PICKUP',
      items: [{ item: sambarRice, qty: 2 }, { item: idliSambar, qty: 2 }],
      review: { rating: 5, comment: 'Pure comfort food. Exactly what I needed after a long day.' },
    },
    {
      buyer: buyers[4], daysAgo: 10, status: 'DELIVERED', fulfillment: 'DELIVERY',
      items: [{ item: chickenBiryani, qty: 2 }],
      // no review yet
    },
    {
      buyer: buyers[0], daysAgo: 8, status: 'DELIVERED', fulfillment: 'DELIVERY',
      items: [{ item: choleBhature, qty: 1 }, { item: sambarRice, qty: 1 }],
      // no review yet
    },

    // This week — recent / active
    {
      buyer: buyers[1], daysAgo: 5, status: 'PICKED_UP', fulfillment: 'PICKUP',
      items: [{ item: masalaDosa, qty: 2 }],
    },
    {
      buyer: buyers[2], daysAgo: 3, status: 'DELIVERED', fulfillment: 'DELIVERY',
      items: [{ item: paneerButter, qty: 1 }, { item: chickenBiryani, qty: 1 }],
    },
    {
      buyer: buyers[3], daysAgo: 1, status: 'READY', fulfillment: 'PICKUP',
      items: [{ item: idliSambar, qty: 3 }, { item: sambarRice, qty: 1 }],
    },
    {
      buyer: buyers[4], daysAgo: 0, hoursAgo: 3, status: 'PROCESSING', fulfillment: 'DELIVERY',
      items: [{ item: masalaDosa, qty: 2 }, { item: idliSambar, qty: 1 }],
    },
    {
      buyer: buyers[0], daysAgo: 0, hoursAgo: 1, status: 'PENDING', fulfillment: 'PICKUP',
      items: [{ item: choleBhature, qty: 2 }],
    },
  ]

  if (!skipOrders) {
    for (const t of orderTemplates) {
      const createdAt = subHours(subDays(now, t.daysAgo), t.hoursAgo ?? 0)
      const subtotal = t.items.reduce((s, { item, qty }) => s + item.price * qty, 0)
      const deliveryFee = t.fulfillment === 'DELIVERY' ? 3 : 0
      const total = subtotal + deliveryFee

      const order = await prisma.order.create({
        data: {
          buyerId: t.buyer.id,
          sellerId: seller.id,
          status: t.status,
          fulfillmentType: t.fulfillment,
          subtotal,
          deliveryFee,
          total,
          scheduledDate: addDays(createdAt, 1),
          pickupWindow: t.fulfillment === 'PICKUP' ? '5:00 PM – 6:00 PM' : null,
          deliveryAddress: t.fulfillment === 'DELIVERY' ? `${Math.floor(Math.random() * 900) + 100} Valencia St, San Francisco CA` : null,
          createdAt,
          updatedAt: createdAt,
          items: {
            create: t.items.map(({ item, qty }) => ({
              menuItemId: item.id,
              quantity: qty,
              unitPrice: item.price,
              itemType: 'ITEM',
              itemName: item.name,
            })),
          },
        },
      })

      if (t.review && ['DELIVERED', 'PICKED_UP'].includes(t.status)) {
        await prisma.review.create({
          data: {
            orderId: order.id,
            buyerId: t.buyer.id,
            sellerId: seller.id,
            rating: t.review.rating,
            comment: t.review.comment,
            createdAt: addDays(createdAt, 1),
          },
        })
      }
    }

    // Recompute ratingAvg and reviewCount from actual reviews
    const allReviews = await prisma.review.findMany({ where: { sellerId: seller.id } })
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
    await prisma.sellerProfile.update({
      where: { id: seller.id },
      data: { ratingAvg: Math.round(avg * 10) / 10, reviewCount: allReviews.length },
    })

    console.log(`✓ ${orderTemplates.length} orders, ${allReviews.length} reviews (avg: ${avg.toFixed(1)})`)
  }

  // ── Planner ────────────────────────────────────────────────────
  const plannerUser = await prisma.user.upsert({
    where: { email: 'planner@example.com' },
    update: {},
    create: {
      email: 'planner@example.com',
      name: 'The Sharma Family',
      role: 'PLANNER',
      emailVerified: now,
      neighborhood: 'Sunnyvale',
      zip: '94086',
    },
  })

  const plannerProfile = await prisma.plannerProfile.upsert({
    where: { userId: plannerUser.id },
    update: {},
    create: {
      userId: plannerUser.id,
      displayName: 'The Sharma Family',
      slug: 'sharma-family',
      bio: 'A family of four planning healthy, home-cooked meals every week. South Indian roots with a love for fusion.',
      cuisinePrefs: ['South Indian', 'Mediterranean', 'Mexican'],
      householdSize: 4,
      isPublic: true,
    },
  })

  // Planner dish library
  const plannerDishes = await Promise.all([
    prisma.plannerMenuItem.upsert({
      where: { id: 1 },
      update: {},
      create: { plannerId: plannerProfile.id, name: 'Masala Dosa', description: 'Crispy rice crepe with spiced potato filling', cuisineTags: ['South Indian'], dietaryTags: ['vegetarian'] },
    }),
    prisma.plannerMenuItem.upsert({
      where: { id: 2 },
      update: {},
      create: { plannerId: plannerProfile.id, name: 'Chicken Biryani', description: 'Fragrant basmati rice with spiced chicken', cuisineTags: ['South Indian'], dietaryTags: [] },
    }),
    prisma.plannerMenuItem.upsert({
      where: { id: 3 },
      update: {},
      create: { plannerId: plannerProfile.id, name: 'Greek Salad', description: 'Fresh cucumber, tomato, olives and feta', cuisineTags: ['Mediterranean'], dietaryTags: ['vegetarian', 'gluten-free'] },
    }),
    prisma.plannerMenuItem.upsert({
      where: { id: 4 },
      update: {},
      create: { plannerId: plannerProfile.id, name: 'Paneer Tikka', description: 'Marinated and grilled cottage cheese', cuisineTags: ['North Indian'], dietaryTags: ['vegetarian'] },
    }),
    prisma.plannerMenuItem.upsert({
      where: { id: 5 },
      update: {},
      create: { plannerId: plannerProfile.id, name: 'Tacos al Pastor', description: 'Marinated pork tacos with pineapple', cuisineTags: ['Mexican'], dietaryTags: [] },
    }),
    prisma.plannerMenuItem.upsert({
      where: { id: 6 },
      update: {},
      create: { plannerId: plannerProfile.id, name: 'Idli Sambar', description: 'Steamed rice cakes with lentil soup', cuisineTags: ['South Indian'], dietaryTags: ['vegetarian', 'gluten-free'] },
    }),
  ])

  // Published weekly menu — this week (Mon–Sat)
  const plannerMonday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - now.getUTCDay() + 1, 12))
  const plannerSaturday = new Date(Date.UTC(plannerMonday.getUTCFullYear(), plannerMonday.getUTCMonth(), plannerMonday.getUTCDate() + 5, 12))
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const plannerExistingMenu = await prisma.plannerWeeklyMenu.findFirst({
    where: { plannerId: plannerProfile.id },
  })

  if (!plannerExistingMenu) {
    const weekMenu = await prisma.plannerWeeklyMenu.create({
      data: {
        plannerId: plannerProfile.id,
        weekStartDate: plannerMonday,
        weekEndDate: plannerSaturday,
        isPublished: true,
        days: {
          create: Array.from({ length: 6 }, (_, i) => ({
            date: new Date(Date.UTC(plannerMonday.getUTCFullYear(), plannerMonday.getUTCMonth(), plannerMonday.getUTCDate() + i, 12)),
            dayOfWeek: dayNames[new Date(Date.UTC(plannerMonday.getUTCFullYear(), plannerMonday.getUTCMonth(), plannerMonday.getUTCDate() + i, 12)).getUTCDay()],
          })),
        },
      },
      include: { days: { orderBy: { date: 'asc' } } },
    })

    // Assign dishes: 2 dishes per day cycling through the library
    const assignments = [
      [plannerDishes[0], plannerDishes[2]], // Mon: Masala Dosa, Greek Salad
      [plannerDishes[1], plannerDishes[3]], // Tue: Chicken Biryani, Paneer Tikka
      [plannerDishes[4], plannerDishes[2]], // Wed: Tacos, Greek Salad
      [plannerDishes[5], plannerDishes[3]], // Thu: Idli Sambar, Paneer Tikka
      [plannerDishes[0], plannerDishes[1]], // Fri: Masala Dosa, Chicken Biryani
      [plannerDishes[4], plannerDishes[5]], // Sat: Tacos, Idli Sambar
    ]

    for (let i = 0; i < weekMenu.days.length; i++) {
      const day = weekMenu.days[i]
      for (const dish of assignments[i]) {
        await prisma.plannerWeeklyMenuDayItem.create({
          data: { weeklyMenuDayId: day.id, menuItemId: dish.id, servings: 4 },
        })
      }
    }
    console.log('✓ Planner weekly menu created and published')
  }

  console.log('✓ Planner:', plannerUser.email)

  // Keep the autoincrement sequences ahead of any explicitly-assigned seed ids
  // above, so the app's own inserts (e.g. a seller adding a new menu item)
  // never collide with a seeded id.
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"MenuItem"', 'id'), COALESCE((SELECT MAX(id) FROM "MenuItem"), 1))`
  )
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"PlannerMenuItem"', 'id'), COALESCE((SELECT MAX(id) FROM "PlannerMenuItem"), 1))`
  )

  console.log('\n🎉 Seed complete!')
  console.log('   Admin:   admin@miseenplace.local            → /admin/dashboard')
  console.log('   Seller:  chef@example.com                   → /seller/dashboard')
  console.log('   Buyer:   buyer@example.com                  → /buyer/orders')
  console.log('   Planner: planner@example.com                → /planner/dashboard')
  console.log('   Find Chefs: http://localhost:3000/sellers   (5 approved sellers, 1 pending admin approval)')
  console.log('   Store:      http://localhost:3000/chef-maya')
  console.log('   Profile:    http://localhost:3000/u/sharma-family')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
