import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/layout/navbar'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, MapPin, Utensils } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getSellers() {
  return prisma.sellerProfile.findMany({
    where: { isActive: true, permitStatus: 'APPROVED' },
    include: {
      user: { select: { name: true, neighborhood: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function SellersPage() {
  const sellers = await getSellers()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Find Local Chefs</h1>
          <p className="text-gray-600 mt-2">Discover home-cooked meals from your neighbors</p>
        </div>

        {sellers.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Utensils className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No sellers in your area yet.</p>
            <p className="text-sm mt-2">Be the first to <Link href="/auth/signup?role=seller" className="text-[#c1622d] underline">start selling!</Link></p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sellers.map((seller) => (
              <Link key={seller.id} href={`/${seller.storeSlug}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                  <div className="aspect-video bg-gray-100 relative">
                    {seller.kitchenPhotos?.[0] ? (
                      <Image
                        src={seller.kitchenPhotos[0]}
                        alt={seller.storeName}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Utensils className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{seller.storeName}</h3>
                        {seller.cuisineType && (
                          <p className="text-sm text-gray-500">{seller.cuisineType}</p>
                        )}
                      </div>
                      {seller.ratingAvg && (
                        <div className="flex items-center gap-1 text-sm text-amber-500 shrink-0">
                          <Star className="w-4 h-4 fill-amber-400" />
                          <span className="font-medium">{seller.ratingAvg.toFixed(1)}</span>
                          <span className="text-gray-400">({seller.reviewCount})</span>
                        </div>
                      )}
                    </div>
                    {seller.bio && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{seller.bio}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      {seller.user.neighborhood && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" /> {seller.user.neighborhood}
                        </span>
                      )}
                      {seller.deliveryEnabled && (
                        <Badge variant="secondary" className="text-xs">Delivery</Badge>
                      )}
                      {seller.pickupEnabled && (
                        <Badge variant="outline" className="text-xs">Pickup</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
