import type { Metadata } from 'next'
import { Instrument_Serif, Work_Sans } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { Providers } from '@/components/providers'

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400'],
  style: ['normal', 'italic'],
})

const workSans = Work_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700'],
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
