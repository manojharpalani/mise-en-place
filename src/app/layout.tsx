import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { Providers } from '@/components/providers'

// Self-hosted (not next/font/google): these ship as local files so builds and
// dev servers never depend on reaching fonts.googleapis.com over the network.
const bricolage = localFont({
  src: [
    // Variable font: weight 200–800 and optical size 12–96 in one file.
    { path: '../fonts/bricolage-grotesque/bricolage-grotesque-latin-standard-normal.woff2', weight: '200 800', style: 'normal' },
  ],
  variable: '--font-heading',
  display: 'swap',
})

const onest = localFont({
  src: [
    { path: '../fonts/onest/onest-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/onest/onest-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/onest/onest-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/onest/onest-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Mise en Place | Your AI-enabled chef operating system',
  description: 'Discover fresh, home-cooked meals from licensed local chefs in your neighborhood. Order daily or subscribe weekly — every dish prepped with care.',
  openGraph: {
    title: 'Mise en Place | Your AI-enabled chef operating system',
    description: 'Fresh meals from local chefs, prepped with care.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${bricolage.variable} ${onest.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  )
}
