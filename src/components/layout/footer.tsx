import Link from 'next/link'

export function Footer() {
  return (
    <footer className="py-12 px-4 mt-auto border-t" style={{ background: '#2A2420', borderColor: '#3A332C' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <img src="/logo-mark.svg" alt="" width={40} height={24} className="h-6 w-auto" />
              <span className="font-heading italic text-xl" style={{ color: '#FBF6EC' }}>mise en place</span>
            </div>
            <p className="text-sm max-w-xs" style={{ color: '#C9BEAF' }}>
              Local community commerce — connecting home chefs with food lovers, one dish prepped mise en place at a time.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="https://www.facebook.com/profile.php?id=61584715631470" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-white transition-colors" style={{ color: '#A79582' }}>Facebook</a>
              <span style={{ color: '#4a4239' }}>·</span>
              <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-white transition-colors" style={{ color: '#A79582' }}>Instagram</a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <div className="font-semibold mb-3" style={{ color: '#E7DDCB' }}>Platform</div>
              <ul className="space-y-2" style={{ color: '#A79582' }}>
                <li><Link href="/sellers" className="hover:text-white transition-colors">Find Chefs</Link></li>
                <li><Link href="/auth/signup?role=seller" className="hover:text-white transition-colors">Sell on Mise en Place</Link></li>
                <li><Link href="/auth/signin" className="hover:text-white transition-colors">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-3" style={{ color: '#E7DDCB' }}>Company</div>
              <ul className="space-y-2" style={{ color: '#A79582' }}>
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t mt-8 pt-8 text-sm text-center" style={{ borderColor: '#3A332C', color: '#8A7A63' }}>
          © {new Date().getFullYear()} Mise en Place. All rights reserved. Prepped with care.
        </div>
      </div>
    </footer>
  )
}
