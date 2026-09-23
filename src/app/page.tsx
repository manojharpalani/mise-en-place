import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { ArrowRight } from 'lucide-react'

// Brand palette — "Market Bowls"
const TURMERIC = '#F5B82E'
const CHILI = '#E2472B'
const LEAF = '#12402C'
const CREAM = '#FFF9EC'
const INK = '#12241B'
const MUTED = '#4D5747'
const LINE = '#EFE3C7'

const IMG = '/images/home-dishes'

// Hero: three dishes resting in "bowls" on a counter line (the logo's prep-bowl idea).
const heroBowls = [
  { src: `${IMG}/pho-bo.jpg`, alt: 'Pho bo', name: 'Pho bo', meta: "Linh's Kitchen", price: '$15' },
  { src: `${IMG}/cheeseburger.jpg`, alt: 'Classic cheeseburger', name: 'Classic cheeseburger', meta: 'Thu pickup 6pm', price: '$14' },
  { src: `${IMG}/tacos-al-pastor.jpg`, alt: 'Tacos al pastor', name: 'Tacos al pastor', meta: '5 left today', price: '$13' },
]

const sanRamonMenu = [
  { src: `${IMG}/brisket-plate.jpg`, name: 'Brisket plate', kitchen: "Big Mike's BBQ", hood: 'Windemere', dist: '0.8 mi', day: 'Mon', price: '$15' },
  { src: `${IMG}/masala-dosa.jpg`, name: 'Masala dosa', kitchen: "Chef Maya's Kitchen", hood: 'Dougherty Valley', dist: '1.2 mi', day: 'Tue', price: '$12' },
  { src: `${IMG}/ghormeh-sabzi.jpg`, name: 'Ghormeh sabzi', kitchen: "Shirin's Table", hood: 'Crow Canyon', dist: '2.1 mi', day: 'Wed', price: '$18' },
  { src: `${IMG}/teriyaki-bowl.jpg`, name: 'Teriyaki bowl', kitchen: "Mei's Kitchen", hood: 'Twin Creeks', dist: '1.6 mi', day: 'Thu', price: '$14' },
  { src: `${IMG}/lasagna.jpg`, name: 'Lasagna', kitchen: "Nonna's Table", hood: 'Bollinger Canyon', dist: '2.4 mi', day: 'Fri', price: '$16' },
  { src: `${IMG}/falafel-bowl.jpg`, name: 'Falafel bowl', kitchen: 'Levant Kitchen', hood: 'Gale Ranch', dist: '0.5 mi', day: 'Sat', price: '$13' },
]

const ways = [
  { k: 'Eat', color: CHILI, text: "Browse licensed chefs nearby. Order today's menu or subscribe to the week.", cta: 'Find a chef', href: '/sellers' },
  { k: 'Cook', color: LEAF, text: 'A branded storefront, weekly menu planner, WhatsApp posts and Stripe payouts.', cta: 'Open a storefront', href: '/auth/signup?role=seller' },
  { k: 'Plan', color: '#B07D00', text: 'Build a weekly plan for your household with an auto-generated grocery list.', cta: 'Plan meals', href: '/auth/signup?role=planner' },
]

const prepList = [
  { done: true, text: "Publish next week's menu" },
  { done: true, text: 'Ingredient list — auto-built from dishes' },
  { done: true, text: "Post today's menu to the WhatsApp group" },
  { done: false, text: 'Confirm 14 orders for Friday pickup' },
  { done: false, text: 'Send subscriber newsletter' },
]

// Wikimedia Commons photos (cropped). Licences require attribution.
const photoCredits = [
  { name: 'Pho bo', by: 'Andy Li', lic: 'CC0', href: 'https://commons.wikimedia.org/wiki/File:Pho_Bo_by_Banh_%26_Mee_in_Kirkgate_Market.jpg' },
  { name: 'Cheeseburger', by: 'Ceeseven', lic: 'CC BY-SA 4.0', href: 'https://commons.wikimedia.org/wiki/File:Cheeseburger_on_Plate.jpg' },
  { name: 'Tacos', by: 'T.Tseng', lic: 'CC BY 2.0', href: 'https://commons.wikimedia.org/wiki/File:Tacos_al_pastor,_taco_de_panza.jpg' },
  { name: 'Brisket', by: 'Gatorfan252525', lic: 'CC BY-SA 4.0', href: 'https://commons.wikimedia.org/wiki/File:Plate_of_brisket,_BBQ_ribs,_pulled_pork,_South_Texas_beans_and_pickled_jalape%C3%B1os_from_the_Pinkerton%27s_BBQ_San_Antonio_location.jpg' },
  { name: 'Masala dosa', by: 'Marajozkee', lic: 'CC BY-SA 4.0', href: 'https://commons.wikimedia.org/wiki/File:Masala_dosa_01.jpg' },
  { name: 'Ghormeh sabzi', by: 'Nizzan Cohen', lic: 'CC BY 4.0', href: 'https://commons.wikimedia.org/wiki/File:Ghormeh_Sabzi_with_rice.jpg' },
  { name: 'Teriyaki bowl', by: 'Wide Awake!', lic: 'CC BY 4.0', href: 'https://commons.wikimedia.org/wiki/File:Teriyaki_Chicken_Rice_Bowl_from_Botejyu_(2024-12-21).jpg' },
  { name: 'Lasagna', by: 'jules / stonesoup', lic: 'CC BY 2.0', href: 'https://commons.wikimedia.org/wiki/File:Lasagne_-_stonesoup.jpg' },
  { name: 'Falafel', by: 'Sharvarism', lic: 'CC BY-SA 4.0', href: 'https://commons.wikimedia.org/wiki/File:Falafel_with_Hummus.jpg' },
]

const heading = 'font-heading font-extrabold tracking-[-0.035em]'

function Bowl({ src, alt, className }: { src: string; alt: string; className: string }) {
  return (
    <div
      className={`absolute rounded-full overflow-hidden ${className}`}
      style={{ border: '6px solid #fff', boxShadow: `0 0 0 3px ${CHILI}, 0 18px 30px -18px rgba(18,64,44,.6)` }}
    >
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    </div>
  )
}

function Tag({ name, meta, price, className }: { name: string; meta: string; price: string; className: string }) {
  return (
    <div
      className={`absolute bg-white rounded-xl px-3 py-2 text-[12.5px] leading-snug whitespace-nowrap ${className}`}
      style={{ border: `1px solid ${LINE}`, boxShadow: '0 8px 20px -12px rgba(0,0,0,.25)' }}
    >
      <b className="block font-heading font-bold text-[15px]" style={{ color: INK }}>{name}</b>
      <span style={{ color: MUTED }}>{meta} · </span>
      <span className="font-bold" style={{ color: CHILI }}>{price}</span>
    </div>
  )
}

export default function HomePage() {
  const [pho, burger, tacos] = heroBowls

  return (
    <div className="flex flex-col min-h-screen bg-white" style={{ color: INK }}>
      <Navbar />

      {/* Hero */}
      <section className="px-4">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.05fr_1fr] gap-10 items-center py-12 lg:py-16">
          <div>
            <div className="flex items-center gap-2 text-[13px] font-semibold tracking-wide mb-5" style={{ color: LEAF }}>
              <span className="w-2 h-2 rounded-full" style={{ background: CHILI }} />
              Let&apos;s get your meals in place
            </div>
            <h1 className={`${heading} text-[44px] sm:text-6xl lg:text-[76px] leading-[0.92] mb-6`} style={{ color: LEAF }}>
              Plan dinner with your <span style={{ color: CHILI }}>local community.</span>
            </h1>
            <p className="text-lg max-w-[44ch] mb-8 leading-relaxed" style={{ color: MUTED }}>
              Order home-cooked meals from permitted chefs a few streets away — daily, or plan the whole week. Pickup or delivery.
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link
                href="/sellers"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 font-semibold text-white shadow-sm hover:shadow-md transition-shadow"
                style={{ background: CHILI }}
              >
                Find a chef near you <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/auth/signup?role=seller" className="font-semibold pb-0.5" style={{ color: INK, borderBottom: `2px solid ${CHILI}` }}>
                I cook — open a storefront
              </Link>
            </div>
            <p className="text-sm mt-6" style={{ color: MUTED }}>
              Just planning family dinners?{' '}
              <Link href="/auth/signup?role=planner" className="font-semibold underline underline-offset-2" style={{ color: LEAF }}>
                Try the free meal planner
              </Link>
            </p>
          </div>

          {/* Bowls on the counter */}
          <div className="relative h-[330px] sm:h-[380px]" aria-label="Dishes cooking this week">
            <div className="absolute rounded-full w-[220px] h-[220px] sm:w-[260px] sm:h-[260px] left-[22%] bottom-[10px]" style={{ background: TURMERIC }} />
            <div className="absolute left-0 right-0 bottom-[44px] h-[3px] rounded" style={{ background: LEAF }} />
            <Bowl src={pho.src} alt={pho.alt} className="w-[110px] h-[110px] sm:w-[150px] sm:h-[150px] left-[2%] bottom-[50px]" />
            <Bowl src={burger.src} alt={burger.alt} className="w-[140px] h-[140px] sm:w-[190px] sm:h-[190px] left-[30%] sm:left-[32%] bottom-[50px]" />
            <Bowl src={tacos.src} alt={tacos.alt} className="w-[100px] h-[100px] sm:w-[140px] sm:h-[140px] right-[4%] bottom-[50px]" />
            <Tag {...pho} className="left-0 top-[40px]" />
            <Tag {...burger} className="hidden sm:block left-[36%] top-0" />
            <Tag {...tacos} className="right-0 top-[70px]" />
          </div>
        </div>
      </section>

      {/* On the menu in San Ramon */}
      <section className="px-4 py-10" style={{ background: TURMERIC }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
            <div>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider mb-2.5"
                style={{ background: CREAM, color: LEAF }}
              >
                <span className="w-[7px] h-[7px] rounded-full" style={{ background: CHILI }} />
                San Ramon, CA · 94582
              </span>
              <h2 className={`${heading} text-3xl md:text-[38px] leading-[1.05]`} style={{ color: LEAF }}>
                On the menu in San Ramon
              </h2>
            </div>
            <Link href="/sellers" className="text-sm font-semibold" style={{ color: LEAF }}>
              See all 23 kitchens →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {sanRamonMenu.map((d) => (
              <Link key={d.name} href="/sellers" className="flex flex-col gap-2.5 rounded-2xl p-3.5 transition-transform hover:-translate-y-0.5" style={{ background: CREAM }}>
                <img src={d.src} alt={d.name} className="w-[76px] h-[76px] rounded-full object-cover" />
                <div>
                  <b className="block font-heading font-bold text-base leading-tight" style={{ color: INK }}>{d.name}</b>
                  <small className="block text-[12.5px]" style={{ color: MUTED }}>{d.kitchen}</small>
                  <small className="block text-[12.5px] font-medium mt-0.5" style={{ color: LEAF }}>
                    {d.hood} <span className="whitespace-nowrap">· {d.dist}</span>
                  </small>
                </div>
                <div className="mt-auto flex justify-between text-[13px] font-semibold">
                  <span style={{ color: CHILI }}>{d.day}</span>
                  <span>{d.price}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Three ways in */}
      <section className="px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-[1fr_2fr] gap-10 py-16">
          <h2 className={`${heading} text-3xl md:text-[38px] leading-[1.05]`} style={{ color: LEAF }}>
            Three ways to pull up a chair
          </h2>
          <div>
            {ways.map((w, i) => (
              <div
                key={w.k}
                className="grid sm:grid-cols-[120px_1fr_auto] gap-2 sm:gap-5 items-baseline py-5"
                style={{ borderTop: `1px solid ${LINE}`, borderBottom: i === ways.length - 1 ? `1px solid ${LINE}` : undefined }}
              >
                <span className={`${heading} text-[28px]`} style={{ color: w.color }}>{w.k}</span>
                <p className="text-[15px]" style={{ color: MUTED }}>{w.text}</p>
                <Link href={w.href} className="text-sm font-semibold whitespace-nowrap" style={{ color: w.color }}>
                  {w.cta} →
                </Link>
              </div>
            ))}
            <p className="text-sm mt-6" style={{ color: MUTED }}>
              <Link href="/features" className="font-semibold hover:underline" style={{ color: LEAF }}>
                See the full feature list for each →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* For chefs */}
      <section className="px-4 py-16" style={{ background: LEAF, color: CREAM }}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className={`${heading} text-3xl md:text-[38px] leading-[1.05] mb-4`} style={{ color: CREAM }}>
              Your kitchen, <span style={{ color: TURMERIC }}>already in place.</span>
            </h2>
            <p className="text-lg leading-relaxed mb-7" style={{ color: '#CFE0D4' }}>
              Whether you hold a MEHKO permit or cook from a commercial kitchen, Mise en Place handles the prep work around the cooking — so Sunday night isn&apos;t spreadsheets.
            </p>
            <Link
              href="/auth/signup?role=seller"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 font-semibold"
              style={{ background: TURMERIC, color: INK }}
            >
              Start your storefront
            </Link>
          </div>
          <div className="rounded-2xl px-6 py-5" style={{ background: '#0D3223' }}>
            <h3 className="font-mono text-xs uppercase tracking-[0.08em] mb-3" style={{ color: TURMERIC }}>
              Tonight&apos;s prep list
            </h3>
            <ul>
              {prepList.map((item, i) => (
                <li
                  key={item.text}
                  className="flex items-center gap-3 py-2.5"
                  style={{ borderBottom: i === prepList.length - 1 ? undefined : '1px dashed #2A5A44' }}
                >
                  <span
                    aria-hidden
                    className="w-[17px] h-[17px] rounded-[4px] flex items-center justify-center text-[11px] font-bold shrink-0"
                    style={item.done ? { background: TURMERIC, color: INK } : { border: `1.5px solid ${CREAM}` }}
                  >
                    {item.done ? '✓' : ''}
                  </span>
                  <span className={item.done ? '' : 'opacity-90'}>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-5 py-12">
          <h2 className={`${heading} text-3xl md:text-[38px] leading-[1.05]`} style={{ color: LEAF }}>
            Hungry, cooking, or planning?
          </h2>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/auth/signup" className="rounded-xl px-5 py-3 font-semibold text-white" style={{ background: CHILI }}>
              Get started free
            </Link>
            <Link href="/sellers" className="font-semibold pb-0.5" style={{ color: INK, borderBottom: `2px solid ${CHILI}` }}>
              Browse chefs
            </Link>
          </div>
        </div>
        <p className="max-w-6xl mx-auto pb-8 text-[11px] leading-relaxed" style={{ color: '#8A917F' }}>
          Food photos via Wikimedia Commons, cropped:{' '}
          {photoCredits.map((c, i) => (
            <span key={c.name}>
              <a href={c.href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{c.name}</a> by {c.by} ({c.lic})
              {i < photoCredits.length - 1 ? ' · ' : '.'}
            </span>
          ))}
        </p>
      </section>

      <Footer />
    </div>
  )
}
