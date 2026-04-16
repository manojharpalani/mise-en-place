import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/layout/navbar'
import { MapPin, ShoppingBag, Star, Users, Utensils, ChefHat } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#fffcf5' }}>
      <Navbar />

      {/* Hero */}
      <section className="relative py-24 px-4 overflow-hidden" style={{ background: 'linear-gradient(135deg, #fffcf5 0%, #fdf0ee 50%, #fff7f0 100%)' }}>
        {/* Soft decorative blob */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #e28a93, transparent)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #d4a5a5, transparent)' }} />

        <div className="max-w-6xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-8 border" style={{ background: '#fdf0ee', borderColor: '#e8d5d0', color: '#78716c' }}>
            ✦ Bay Area&apos;s home for local home chefs
          </div>

          <h1 className="font-heading text-5xl md:text-7xl font-semibold mb-6 leading-tight" style={{ color: '#292524' }}>
            Fresh meals, made{' '}
            <span className="text-gradient">with loving-kindness</span>
          </h1>

          <p className="text-xl mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: '#78716c' }}>
            Discover authentic home-cooked meals from licensed local chefs in your neighborhood.
            Order daily or subscribe weekly — every dish crafted with care and community in mind.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="px-8 text-white border-0 shadow-md hover:shadow-lg transition-shadow" style={{ background: 'linear-gradient(135deg, #d4a5a5, #e28a93)' }}>
              <Link href="/sellers">
                <MapPin className="w-5 h-5 mr-2" />
                Find a Chef Near You
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-8 font-medium" style={{ borderColor: '#d4a5a5', color: '#78716c' }}>
              <Link href="/auth/signup?role=seller">
                <ChefHat className="w-5 h-5 mr-2" />
                Start Your Storefront
              </Link>
            </Button>
          </div>

          {/* Social proof */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm" style={{ color: '#a8a29e' }}>
            <span className="flex items-center gap-1"><Star className="w-4 h-4" style={{ color: '#e28a93' }} fill="currentColor" /> 4.9 avg rating</span>
            <span className="w-1 h-1 rounded-full" style={{ background: '#d6d3d1' }} />
            <span>Licensed MEHKO chefs only</span>
            <span className="w-1 h-1 rounded-full" style={{ background: '#d6d3d1' }} />
            <span>Free for buyers</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4" style={{ background: '#ffffff' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl md:text-4xl font-semibold mb-3" style={{ color: '#292524' }}>
              How With Metta works
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: '#78716c' }}>
              Simple, warm, and community-first — connecting you to real home kitchens.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <MapPin className="w-7 h-7" style={{ color: '#e28a93' }} />,
                title: 'Discover Local Chefs',
                description: 'Browse licensed home chefs in your neighborhood. Filter by cuisine, dietary preferences, and availability.',
              },
              {
                icon: <ShoppingBag className="w-7 h-7" style={{ color: '#e28a93' }} />,
                title: 'Order or Subscribe',
                description: 'Place one-time daily orders or subscribe to weekly meal plans. Skip days, choose pickup or delivery, pay securely.',
              },
              {
                icon: <Star className="w-7 h-7" style={{ color: '#e28a93' }} />,
                title: 'Build Community',
                description: 'Get updates via WhatsApp, follow your favorite chefs, leave reviews, and be part of a local food community.',
              },
            ].map((f) => (
              <div key={f.title} className="text-center p-8 rounded-2xl border transition-shadow hover:shadow-md" style={{ background: '#fafaf9', borderColor: '#e7e5e4' }}>
                <div className="flex justify-center mb-5 w-14 h-14 rounded-2xl mx-auto items-center" style={{ background: '#fdf0ee' }}>
                  {f.icon}
                </div>
                <h3 className="font-heading text-xl font-semibold mb-3" style={{ color: '#292524' }}>{f.title}</h3>
                <p style={{ color: '#78716c' }}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Sellers */}
      <section className="py-20 px-4" style={{ background: 'linear-gradient(135deg, #e8d5d0 0%, #f0e0db 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium mb-5 border" style={{ background: 'rgba(255,255,255,0.5)', borderColor: '#d4a5a5', color: '#78716c' }}>
                For Home Chefs
              </div>
              <h2 className="font-heading text-3xl md:text-4xl font-semibold mb-5" style={{ color: '#292524' }}>
                Turn your kitchen into a local business
              </h2>
              <p className="text-lg mb-8 leading-relaxed" style={{ color: '#57534e' }}>
                Whether you hold a MEHKO permit or cook from a licensed facility —
                With Metta gives you everything to share your craft and grow your community.
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
                  <li key={item} className="flex items-center gap-3 text-sm" style={{ color: '#57534e' }}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: '#d4a5a5' }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" className="text-white border-0" style={{ background: '#292524' }}>
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
                <div key={stat.label} className="rounded-2xl p-6 text-center border" style={{ background: 'rgba(255,255,255,0.6)', borderColor: 'rgba(212,165,165,0.3)' }}>
                  <div className="flex justify-center mb-2" style={{ color: '#d4a5a5' }}>{stat.icon}</div>
                  <div className="font-heading text-3xl font-semibold" style={{ color: '#292524' }}>{stat.value}</div>
                  <div className="text-sm mt-1" style={{ color: '#78716c' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4" style={{ background: '#fafaf9' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold mb-4" style={{ color: '#292524' }}>
            Ready to join the community?
          </h2>
          <p className="text-lg mb-8" style={{ color: '#78716c' }}>
            Sign up in minutes. Always free for buyers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-white border-0 px-8" style={{ background: 'linear-gradient(135deg, #d4a5a5, #e28a93)' }}>
              <Link href="/auth/signup">Get Started Free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-8" style={{ borderColor: '#d6d3d1', color: '#78716c' }}>
              <Link href="/sellers">Browse Chefs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 mt-auto border-t" style={{ background: '#292524', borderColor: '#3d3936' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div>
              <Image src="/logo-2.png" alt="With Metta" width={130} height={36} className="object-contain h-8 w-auto mb-3 brightness-0 invert opacity-80" />
              <p className="text-sm max-w-xs" style={{ color: '#a8a29e' }}>
                Local community commerce — connecting home chefs with food lovers, made with loving-kindness.
              </p>
              <div className="flex gap-3 mt-4">
                <a href="https://www.facebook.com/profile.php?id=61584715631470" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-white transition-colors" style={{ color: '#78716c' }}>Facebook</a>
                <span style={{ color: '#57534e' }}>·</span>
                <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-white transition-colors" style={{ color: '#78716c' }}>Instagram</a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 text-sm">
              <div>
                <div className="font-semibold mb-3" style={{ color: '#e7e5e4' }}>Platform</div>
                <ul className="space-y-2" style={{ color: '#78716c' }}>
                  <li><Link href="/sellers" className="hover:text-white transition-colors">Find Chefs</Link></li>
                  <li><Link href="/auth/signup?role=seller" className="hover:text-white transition-colors">Sell on With Metta</Link></li>
                  <li><Link href="/auth/signin" className="hover:text-white transition-colors">Sign In</Link></li>
                </ul>
              </div>
              <div>
                <div className="font-semibold mb-3" style={{ color: '#e7e5e4' }}>Company</div>
                <ul className="space-y-2" style={{ color: '#78716c' }}>
                  <li><a href="https://www.withmetta.love" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">About</a></li>
                  <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                  <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-sm text-center" style={{ borderColor: '#3d3936', color: '#57534e' }}>
            © {new Date().getFullYear()} With Metta. All rights reserved. Made with loving-kindness.
          </div>
        </div>
      </footer>
    </div>
  )
}
