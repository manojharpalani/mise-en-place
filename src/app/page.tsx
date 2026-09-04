import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { MapPin, ShoppingBag, Star, Users, Utensils, ChefHat } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#FBF6EC' }}>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4" style={{ background: '#FBF6EC' }}>
        {/* Background photo: soft, faded into the page — editorial, not a cutout */}
        <div
          className="hidden lg:block absolute inset-y-0 right-0 w-[42%] pointer-events-none"
          style={{
            maskImage: 'linear-gradient(to right, transparent, black 38%), linear-gradient(to bottom, black 78%, transparent)',
            maskComposite: 'intersect',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 38%), linear-gradient(to bottom, black 78%, transparent)',
            WebkitMaskComposite: 'source-in',
          }}
        >
          <img
            src="/dish-images/matar-paneer.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(251,246,236,0.12), rgba(251,246,236,0.5))' }} />
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-8 border" style={{ background: '#F7E9DE', borderColor: '#E0B49A', color: '#8A4A26' }}>
            Let&apos;s get your meals in place
          </div>

          <h1 className="font-heading text-5xl md:text-7xl font-normal mb-6 leading-tight" style={{ color: '#2A2420' }}>
            Home-cooked, set{' '}
            <span style={{ fontStyle: 'italic', color: '#C1622D' }}>just right.</span>
          </h1>

          <p className="text-xl mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: '#6B625A' }}>
            Discover authentic home-cooked meals from licensed local chefs in your neighborhood.
            Order daily or plan the week ahead — every dish prepped mise en place before it reaches you.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="px-8 text-white border-0 shadow-md hover:shadow-lg transition-shadow" style={{ background: '#C1622D' }}>
              <Link href="/sellers">
                <MapPin className="w-5 h-5 mr-2" />
                Find a Chef Near You
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-8 font-medium" style={{ borderColor: '#2A2420', color: '#2A2420' }}>
              <Link href="/auth/signup?role=seller">
                <ChefHat className="w-5 h-5 mr-2" />
                Start Your Storefront
              </Link>
            </Button>
          </div>

          {/* Social proof */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm" style={{ color: '#8A7A63' }}>
            <span className="flex items-center gap-1"><Star className="w-4 h-4" style={{ color: '#C1622D' }} fill="currentColor" /> 4.9 avg rating</span>
            <span className="w-1 h-1 rounded-full" style={{ background: '#D8CBB4' }} />
            <span>Licensed chefs only</span>
            <span className="w-1 h-1 rounded-full" style={{ background: '#D8CBB4' }} />
            <span>Free for buyers</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4" style={{ background: '#ffffff' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl md:text-4xl font-normal mb-3" style={{ color: '#2A2420' }}>
              How Mise en Place works
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: '#6B625A' }}>
              Simple, warm, and community-first — connecting you to real home kitchens.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <MapPin className="w-7 h-7" style={{ color: '#C1622D' }} />,
                title: 'Discover Local Chefs',
                description: 'Browse licensed home chefs in your neighborhood. Filter by cuisine, dietary preferences, and availability.',
              },
              {
                icon: <ShoppingBag className="w-7 h-7" style={{ color: '#C1622D' }} />,
                title: 'Order or Subscribe',
                description: 'Place one-time daily orders or subscribe to weekly meal plans. Skip days, choose pickup or delivery, pay securely.',
              },
              {
                icon: <Star className="w-7 h-7" style={{ color: '#C1622D' }} />,
                title: 'Build Community',
                description: 'Get updates via WhatsApp, follow your favorite chefs, leave reviews, and be part of a local food community.',
              },
            ].map((f) => (
              <div key={f.title} className="text-center p-8 rounded-2xl border transition-shadow hover:shadow-md" style={{ background: '#FAF3E6', borderColor: '#E7DDCB' }}>
                <div className="flex justify-center mb-5 w-14 h-14 rounded-2xl mx-auto items-center" style={{ background: '#F7E9DE' }}>
                  {f.icon}
                </div>
                <h3 className="font-heading text-xl font-normal mb-3" style={{ color: '#2A2420' }}>{f.title}</h3>
                <p style={{ color: '#6B625A' }}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Sellers */}
      <section className="py-20 px-4 warm-gradient">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium mb-5 border" style={{ background: 'rgba(255,255,255,0.6)', borderColor: '#C1622D', color: '#6B625A' }}>
                For Home Chefs
              </div>
              <h2 className="font-heading text-3xl md:text-4xl font-normal mb-5" style={{ color: '#2A2420' }}>
                Turn your kitchen into a local business
              </h2>
              <p className="text-lg mb-8 leading-relaxed" style={{ color: '#4A4239' }}>
                Whether you hold a home kitchen permit or cook from a licensed facility —
                Mise en Place gives you everything to share your craft and grow your community.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Branded storefront with your own shareable URL',
                  'Weekly menu planner with auto ingredient lists',
                  'WhatsApp daily menu posts — built-in',
                  'Stripe-powered secure payments',
                  'Order management & subscriber newsletters',
                  'Social media asset generator',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm" style={{ color: '#4A4239' }}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: '#C1622D' }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" className="text-white border-0" style={{ background: '#2A2420' }}>
                <Link href="/auth/signup?role=seller">Start Your Storefront</Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Active Chefs', value: '10+', icon: <ChefHat className="w-6 h-6" /> },
                { label: 'Happy Buyers', value: '50+', icon: <Users className="w-6 h-6" /> },
                { label: 'Orders Placed', value: '200+', icon: <ShoppingBag className="w-6 h-6" /> },
                { label: 'Cuisines', value: '12+', icon: <Utensils className="w-6 h-6" /> },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl p-6 text-center border" style={{ background: 'rgba(255,255,255,0.7)', borderColor: 'rgba(193,98,45,0.25)' }}>
                  <div className="flex justify-center mb-2" style={{ color: '#C1622D' }}>{stat.icon}</div>
                  <div className="font-heading text-3xl font-normal" style={{ color: '#2A2420' }}>{stat.value}</div>
                  <div className="text-sm mt-1" style={{ color: '#6B625A' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4" style={{ background: '#FAF3E6' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-normal mb-4" style={{ color: '#2A2420' }}>
            Ready to join the community?
          </h2>
          <p className="text-lg mb-8" style={{ color: '#6B625A' }}>
            Sign up in minutes. Always free for buyers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-white border-0 px-8" style={{ background: '#C1622D' }}>
              <Link href="/auth/signup">Get Started Free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-8" style={{ borderColor: '#E7DDCB', color: '#6B625A' }}>
              <Link href="/sellers">Browse Chefs</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
