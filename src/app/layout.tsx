import type { Metadata } from 'next'
import { Playfair_Display, Source_Sans_3 } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { Providers } from '@/components/providers'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400', '500', '600', '700'],
})

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '600', '700'],
})

export const metadata: Metadata = {
  title: 'With Metta | Local Home Chefs & Fresh Meals',
  description: 'Discover fresh, home-cooked meals from licensed local chefs in your neighborhood. Order daily or subscribe weekly — made with loving-kindness.',
  openGraph: {
    title: 'With Metta',
    description: 'Fresh meals from local home chefs, made with loving-kindness.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${sourceSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  )
}
