import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import {
  MapPin, ShoppingBag, Star, Heart, MessageCircle, RotateCcw,
  ChefHat, Store, ClipboardList, Users, TrendingUp, Sparkles, Share2,
  CalendarDays, BookOpen, ListChecks, Wand2, Globe,
} from 'lucide-react'

export const metadata = {
  title: 'Features | Mise en Place',
  description: 'Everything Mise en Place offers — for buyers finding a local chef nearby, local chefs starting a storefront, and meal planners organizing family dinners.',
}

type Feature = { icon: React.ReactNode; title: string; description: string }

const buyerFeatures: Feature[] = [
  { icon: <MapPin className="w-5 h-5" />, title: 'Discover chefs nearby', description: 'Browse licensed local chefs in your neighborhood, filtered by cuisine, dietary needs, and availability.' },
  { icon: <ShoppingBag className="w-5 h-5" />, title: 'Order or subscribe', description: 'Place a one-time order for tonight, or subscribe to a weekly menu so it just shows up.' },
  { icon: <RotateCcw className="w-5 h-5" />, title: 'Pickup or delivery', description: "Choose whichever fits your schedule, with the chef's real pickup windows and delivery radius." },
  { icon: <Heart className="w-5 h-5" />, title: 'Favorite your chefs', description: 'Follow the storefronts you love and get back to them in one tap from your buyer dashboard.' },
  { icon: <MessageCircle className="w-5 h-5" />, title: 'WhatsApp menu updates', description: "Get the day's menu from chefs you follow sent straight to WhatsApp — no app-checking required." },
  { icon: <Star className="w-5 h-5" />, title: 'Ratings & reviews', description: 'Read real reviews before you order, and leave your own after every meal.' },
]

const sellerFeatures: Feature[] = [
  { icon: <Store className="w-5 h-5" />, title: 'Branded storefront', description: 'Your own shareable page — mise-en-place.app/your-name — with your story, photos, and menu.' },
  { icon: <CalendarDays className="w-5 h-5" />, title: 'Weekly menu planner', description: 'Lay out what you\'re cooking each day of the week and publish it in one click.' },
  { icon: <Wand2 className="w-5 h-5" />, title: 'AI menu planning help', description: "Short on ideas? Generate a suggested weekly menu from your dish library and let it fill in the gaps." },
  { icon: <ClipboardList className="w-5 h-5" />, title: 'Auto ingredient lists', description: 'Your weekly menu turns into a shopping list automatically — no manual tallying.' },
  { icon: <ShoppingBag className="w-5 h-5" />, title: 'Order management', description: 'Track every order from pending to picked-up or delivered, all from one dashboard.' },
  { icon: <TrendingUp className="w-5 h-5" />, title: 'Earnings dashboard', description: 'See what you\'ve made, order by order, with Stripe-powered payouts under the hood.' },
  { icon: <Users className="w-5 h-5" />, title: 'Employee accounts', description: 'Bring on kitchen help with their own logins, scoped to your storefront.' },
  { icon: <MessageCircle className="w-5 h-5" />, title: 'WhatsApp broadcasts', description: 'Push your daily menu straight to subscribers on WhatsApp — built in, no extra tool needed.' },
  { icon: <Share2 className="w-5 h-5" />, title: 'Social & content tools', description: 'Generate shareable social assets and post articles to keep your community in the loop.' },
]

const plannerFeatures: Feature[] = [
  { icon: <BookOpen className="w-5 h-5" />, title: 'Personal dish library', description: 'Save the meals your family actually eats, so planning is picking, not inventing from scratch.' },
  { icon: <CalendarDays className="w-5 h-5" />, title: 'Weekly meal calendar', description: 'Lay dishes across the week for your household in a simple day-by-day planner.' },
  { icon: <Wand2 className="w-5 h-5" />, title: 'AI meal-plan suggestions', description: 'Get a full week suggested for you based on your household size and cuisine preferences.' },
  { icon: <ListChecks className="w-5 h-5" />, title: 'Auto grocery list', description: "This week's plan becomes a shopping list automatically — nothing to double-check by hand." },
  { icon: <Sparkles className="w-5 h-5" />, title: 'Inspired by local chefs', description: "Pull ideas straight from local storefronts' menus into your own plan when you need inspiration." },
  { icon: <Globe className="w-5 h-5" />, title: 'Optional public profile', description: 'Share your weekly plan on a public page if you want — or keep it just for your household.' },
]

function FeatureSection({
  id, eyebrow, title, description, features, ctaLabel, ctaHref, ctaIcon, align = 'left',
}: {
  id: string
  eyebrow: string
  title: string
  description: string
  features: Feature[]
  ctaLabel: string
  ctaHref: string
  ctaIcon: React.ReactNode
  align?: 'left' | 'right'
}) {
  return (
    <section id={id} className="py-20 px-4 scroll-mt-16" style={{ background: align === 'left' ? '#ffffff' : '#FFF9EC' }}>
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium mb-5 border" style={{ background: '#FFF1D6', borderColor: '#F3D08A', color: '#12402C' }}>
            {eyebrow}
          </div>
          <h2 className="font-heading text-3xl md:text-[40px] leading-[1.05] font-extrabold tracking-[-0.035em] mb-4" style={{ color: '#12402C' }}>{title}</h2>
          <p className="text-lg leading-relaxed" style={{ color: '#4D5747' }}>{description}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {features.map((f) => (
            <div key={f.title} className="p-6 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: '#EFE3C7' }}>
              <div className="flex items-center justify-center w-10 h-10 rounded-xl mb-4" style={{ background: '#FFF1D6', color: '#E2472B' }}>
                {f.icon}
              </div>
              <h3 className="font-semibold mb-1.5" style={{ color: '#12241B' }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#4D5747' }}>{f.description}</p>
            </div>
          ))}
        </div>

        <Button asChild size="lg" className="text-white border-0 px-8" style={{ background: '#E2472B' }}>
          <Link href={ctaHref}>
            {ctaIcon}
            {ctaLabel}
          </Link>
        </Button>
      </div>
    </section>
  )
}

export default function FeaturesPage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#FFFFFF' }}>
      <Navbar />

      {/* Hero */}
      <section className="py-20 px-4" style={{ background: '#FFFFFF' }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-8 border" style={{ background: '#FFF1D6', borderColor: '#F3D08A', color: '#12402C' }}>
            Features
          </div>
          <h1 className="font-heading text-[44px] md:text-[64px] font-extrabold tracking-[-0.04em] mb-6 leading-[0.95]" style={{ color: '#12402C' }}>
            Built for three kinds of{' '}
            <span style={{ color: '#E2472B' }}>people at the table.</span>
          </h1>
          <p className="text-xl leading-relaxed max-w-2xl mx-auto" style={{ color: '#4D5747' }}>
            Whether you&apos;re looking for tonight&apos;s dinner, turning your kitchen into a business,
            or just trying to get your own family fed well every week — here&apos;s everything
            Mise en Place gives you.
          </p>

          {/* Jump links */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
            <a href="#buyers" className="rounded-full px-4 py-2 text-sm font-medium border transition-colors hover:bg-white" style={{ borderColor: '#F3D08A', color: '#12402C' }}>
              🛍️ I want to find a chef
            </a>
            <a href="#sellers" className="rounded-full px-4 py-2 text-sm font-medium border transition-colors hover:bg-white" style={{ borderColor: '#F3D08A', color: '#12402C' }}>
              👩‍🍳 I want to start a storefront
            </a>
            <a href="#planners" className="rounded-full px-4 py-2 text-sm font-medium border transition-colors hover:bg-white" style={{ borderColor: '#F3D08A', color: '#12402C' }}>
              📅 I want to plan family meals
            </a>
          </div>
        </div>
      </section>

      <FeatureSection
        id="buyers"
        eyebrow="For Buyers"
        title="Find a chef near you"
        description="Skip another delivery app. Discover real home cooks in your neighborhood and order meals made the way you'd cook them yourself — if you had the time."
        features={buyerFeatures}
        ctaLabel="Find a Chef Near You"
        ctaHref="/sellers"
        ctaIcon={<MapPin className="w-5 h-5 mr-2" />}
        align="left"
      />

      <FeatureSection
        id="sellers"
        eyebrow="For Local Chefs"
        title="Start your storefront"
        description="Whether you hold a home kitchen permit or cook from a licensed facility, Mise en Place gives you everything to turn your cooking into a real, running business."
        features={sellerFeatures}
        ctaLabel="Start Your Storefront"
        ctaHref="/auth/signup?role=seller"
        ctaIcon={<ChefHat className="w-5 h-5 mr-2" />}
        align="right"
      />

      <FeatureSection
        id="planners"
        eyebrow="For Meal Planners"
        title="Plan family meals, without the mental load"
        description="Not looking to buy or sell — just trying to figure out what your household is eating this week? Mise en Place's planning tools are free to use on their own."
        features={plannerFeatures}
        ctaLabel="Start Planning Meals"
        ctaHref="/auth/signup?role=planner"
        ctaIcon={<CalendarDays className="w-5 h-5 mr-2" />}
        align="left"
      />

      {/* Bottom CTA */}
      <section className="py-20 px-4" style={{ background: '#FFF9EC' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-[40px] leading-[1.05] font-extrabold tracking-[-0.035em] mb-4" style={{ color: '#12402C' }}>
            Not sure where you fit?
          </h2>
          <p className="text-lg mb-8" style={{ color: '#4D5747' }}>
            Sign up free and choose your path — buyer, chef, or planner. You can always add another role later.
          </p>
          <Button asChild size="lg" className="text-white border-0 px-8" style={{ background: '#12241B' }}>
            <Link href="/auth/signup">Get Started Free</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  )
}
