import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Heart, Handshake, Sprout, MapPin, ChefHat } from 'lucide-react'

export const metadata = {
  title: 'Our Story | Mise en Place',
  description: 'Why we built Mise en Place: a platform that puts local home chefs and small business owners first.',
}

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#FBF6EC' }}>
      <Navbar />

      {/* Hero */}
      <section className="py-20 px-4" style={{ background: '#FBF6EC' }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-8 border" style={{ background: '#F7E9DE', borderColor: '#E0B49A', color: '#8A4A26' }}>
            Our Story
          </div>
          <h1 className="font-heading text-4xl md:text-6xl font-normal mb-6 leading-tight" style={{ color: '#2A2420' }}>
            Everything in its place —{' '}
            <span style={{ fontStyle: 'italic', color: '#C1622D' }}>starting with who cooks it.</span>
          </h1>
          <p className="text-xl leading-relaxed max-w-2xl mx-auto" style={{ color: '#6B625A' }}>
            Mise en Place exists because we believe a neighborhood is better fed by the people in it —
            and that the cooks, growers, and small business owners who show up for their communities
            deserve a real shot at building something of their own.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 px-4" style={{ background: '#ffffff' }}>
        <div className="max-w-2xl mx-auto space-y-6 text-lg leading-relaxed" style={{ color: '#4A4239' }}>
          <p>
            It started with a simple observation: some of the best food in any neighborhood never
            makes it past a home kitchen. A licensed home chef with a family recipe, a full-time job,
            and no easy way to reach the people nearby who&apos;d happily pay for a home-cooked meal instead
            of another delivery app.
          </p>
          <p>
            At the same time, small business ownership has gotten harder, not easier — buried under
            fees, algorithms, and platforms built for scale rather than for the person actually doing
            the cooking. We wanted to build something different: a place where a home chef could open a
            storefront in an afternoon, keep more of what they earn, and grow a real following in their
            own neighborhood.
          </p>
          <p>
            The name comes from a kitchen term every cook knows — <em style={{ fontStyle: 'italic' }}>mise en place</em>,
            &quot;everything in its place.&quot; Before the first dish goes out, the ingredients are prepped,
            the station is set, and the work is set up to succeed. That&apos;s what we want this platform to be
            for the people who use it: the prep work of running a food business, already done, so chefs
            can focus on what they&apos;re actually good at.
          </p>
          <p>
            We&apos;re building this for the home kitchen permit holders turning their kitchen into a livelihood,
            the meal planners quietly feeding their own households well and sharing what they learn, and
            the neighbors who&apos;d rather know the person who cooked their dinner. Local commerce, run by
            local people — with the tools to make that sustainable.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4" style={{ background: '#FBF6EC' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl md:text-4xl font-normal mb-3" style={{ color: '#2A2420' }}>
              What we believe
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: '#6B625A' }}>
              A few principles guide every decision we make about this platform.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <ChefHat className="w-7 h-7" style={{ color: '#C1622D' }} />,
                title: 'Chefs come first',
                description: 'Every feature starts from the same question: does this make it easier for a home chef to run a real business?',
              },
              {
                icon: <Handshake className="w-7 h-7" style={{ color: '#C1622D' }} />,
                title: 'Fair, not extractive',
                description: 'Small business owners keep the value they create. We’d rather grow slowly with people than take a bigger cut of them.',
              },
              {
                icon: <MapPin className="w-7 h-7" style={{ color: '#C1622D' }} />,
                title: 'Community over scale',
                description: 'This is built neighborhood by neighborhood — real storefronts, real relationships, not an anonymous marketplace.',
              },
            ].map((v) => (
              <div key={v.title} className="text-center p-8 rounded-2xl border transition-shadow hover:shadow-md" style={{ background: '#FAF3E6', borderColor: '#E7DDCB' }}>
                <div className="flex justify-center mb-5 w-14 h-14 rounded-2xl mx-auto items-center" style={{ background: '#F7E9DE' }}>
                  {v.icon}
                </div>
                <h3 className="font-heading text-xl font-normal mb-3" style={{ color: '#2A2420' }}>{v.title}</h3>
                <p style={{ color: '#6B625A' }}>{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4" style={{ background: '#ffffff' }}>
        <div className="max-w-2xl mx-auto text-center">
          <Sprout className="w-8 h-8 mx-auto mb-5" style={{ color: '#C1622D' }} />
          <h2 className="font-heading text-3xl md:text-4xl font-normal mb-4" style={{ color: '#2A2420' }}>
            Be part of the neighborhood
          </h2>
          <p className="text-lg mb-8" style={{ color: '#6B625A' }}>
            Whether you cook, plan, or just want a better meal tonight — there&apos;s a place for you here.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-white border-0 px-8" style={{ background: '#C1622D' }}>
              <Link href="/sellers">
                <Heart className="w-5 h-5 mr-2" />
                Find a Chef Near You
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-8 font-medium" style={{ borderColor: '#2A2420', color: '#2A2420' }}>
              <Link href="/auth/signup?role=seller">Start Your Storefront</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
