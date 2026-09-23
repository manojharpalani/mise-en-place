import Link from 'next/link'

export function Footer() {
  return (
    <footer className="py-12 px-4 mt-auto border-t" style={{ background: '#12402C', borderColor: '#0D3223' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <img src="/logo-mark-light.svg" alt="" width={38} height={38} className="h-[38px] w-[38px]" />
              <span className="flex flex-col">
                <span className="font-heading font-extrabold text-[22px] leading-none tracking-[-0.03em]" style={{ color: '#FFF9EC' }}>
                  mise en <span style={{ color: '#F5B82E' }}>place</span>
                </span>
                <span className="mt-1.5 text-[10.5px] leading-none font-semibold uppercase tracking-[0.08em]" style={{ color: '#F5B82E' }}>
                  Your AI-enabled chef operating system
                </span>
              </span>
            </div>
            <p className="text-sm max-w-xs" style={{ color: '#CFE0D4' }}>
              Connecting local chefs with food lovers, one dish prepped mise en place at a time.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="https://www.facebook.com/profile.php?id=61584715631470" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-white transition-colors" style={{ color: '#A9C2B1' }}>Facebook</a>
              <span style={{ color: '#2f3a2a' }}>·</span>
              <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-white transition-colors" style={{ color: '#A9C2B1' }}>Instagram</a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <div className="font-semibold mb-3" style={{ color: '#F5B82E' }}>Platform</div>
              <ul className="space-y-2" style={{ color: '#A9C2B1' }}>
                <li><Link href="/sellers" className="hover:text-white transition-colors">Find Chefs</Link></li>
                <li><Link href="/auth/signup?role=seller" className="hover:text-white transition-colors">Sell on Mise en Place</Link></li>
                <li><Link href="/auth/signup?role=planner" className="hover:text-white transition-colors">Plan Family Meals</Link></li>
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/auth/signin" className="hover:text-white transition-colors">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-3" style={{ color: '#F5B82E' }}>Company</div>
              <ul className="space-y-2" style={{ color: '#A9C2B1' }}>
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t mt-8 pt-8 text-sm text-center" style={{ borderColor: '#2A5A44', color: '#8FAE9A' }}>
          © {new Date().getFullYear()} Mise en Place. All rights reserved. Prepped with care.
        </div>
      </div>
    </footer>
  )
}
