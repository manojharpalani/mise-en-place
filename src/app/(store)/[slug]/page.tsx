export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Navbar } from '@/components/layout/navbar'
import { StorefrontTabs } from '@/components/storefront/storefront-tabs'
import { ContactSidebar } from '@/components/storefront/contact-sidebar'
import { Badge } from '@/components/ui/badge'
import { Star, MapPin, CheckCircle, Clock } from 'lucide-react'
import Image from 'next/image'

export const revalidate = 60

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getSeller(slug: string) {
  return prisma.sellerProfile.findUnique({
    where: { storeSlug: slug, isActive: true },
    include: {
      user: { select: { name: true, email: true, neighborhood: true, zip: true } },
      menuItems: { where: { isActive: true } },
      comboItems: { where: { isActive: true } },
      weeklyMenus: {
        where: { status: 'PUBLISHED' },
        orderBy: { weekStartDate: 'desc' },
        take: 1,
        include: {
          days: {
            include: {
              menuItems: { include: { menuItem: true } },
              comboItems: { include: { comboItem: true } },
            },
            orderBy: { date: 'asc' },
          },
        },
      },
      articles: {
        where: { isPublished: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { author: { select: { name: true } } },
      },
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { buyer: { select: { name: true, image: true } } },
      },
    },
  })
}

export default async function StorefrontPage({ params }: PageProps) {
  const { slug } = await params
  const seller = await getSeller(slug)
  if (!seller) notFound()

  const session = await auth().catch(() => null)

  const isFavorited = session?.user?.id
    ? !!(await prisma.favoriteSeller.findUnique({
        where: { buyerId_sellerId: { buyerId: session.user.id, sellerId: seller.id } },
      }))
    : false

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Store Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Store Photo */}
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[#f7e9de] shrink-0">
              {seller.kitchenPhotos?.[0] ? (
                <Image
                  src={seller.kitchenPhotos[0]}
                  alt={seller.storeName}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
              )}
            </div>

            {/* Store Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{seller.storeName}</h1>
                {seller.permitStatus === 'APPROVED' && (
                  <Badge className="bg-[#f7e9de] text-[#a64f20] border-[#e7ddcb] flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Permitted
                  </Badge>
                )}
              </div>

              {seller.cuisineType && (
                <p className="text-gray-500 mb-2">{seller.cuisineType}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                {seller.ratingAvg && (
                  <span className="flex items-center gap-1 text-amber-500">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <strong>{seller.ratingAvg.toFixed(1)}</strong>
                    <span className="text-gray-400">({seller.reviewCount} reviews)</span>
                  </span>
                )}
                {seller.user.neighborhood && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {seller.user.neighborhood}
                    {seller.user.zip && `, ${seller.user.zip}`}
                  </span>
                )}
                {seller.pickupEnabled && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" /> Pickup available
                  </span>
                )}
                {seller.deliveryEnabled && (
                  <Badge variant="secondary">Delivery up to {seller.deliveryRadiusMiles} mi</Badge>
                )}
              </div>

              {seller.bio && (
                <p className="text-gray-700 mt-3 max-w-2xl">{seller.bio}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            <StorefrontTabs
              seller={seller as any}
              session={session}
              isFavorited={isFavorited}
            />
          </div>
          <div className="lg:w-72 shrink-0">
            <ContactSidebar seller={seller as any} />
          </div>
        </div>
      </div>
    </div>
  )
}
