import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { Providers } from '@/components/providers'

// Self-hosted (not next/font/google): these ship as local files so builds and
// dev servers never depend on reaching fonts.googleapis.com over the network.
const instrumentSerif = localFont({
  src: [
    { path: '../fonts/instrument-serif/instrument-serif-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/instrument-serif/instrument-serif-400-italic.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--font-heading',
  display: 'swap',
})

const workSans = localFont({
  src: [
    { path: '../fonts/work-sans/work-sans-300.woff2', weight: '300', style: 'normal' },
    { path: '../fonts/work-sans/work-sans-400.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/work-sans/work-sans-500.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/work-sans/work-sans-600.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/work-sans/work-sans-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Mise en Place | Local Home Chefs & Fresh Meals',
  description: 'Discover fresh, home-cooked meals from licensed local chefs in your neighborhood. Order daily or subscribe weekly — every dish prepped with care.',
  openGraph: {
    title: 'Mise en Place',
    description: 'Fresh meals from local home chefs, prepped with care.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${workSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  )
}
