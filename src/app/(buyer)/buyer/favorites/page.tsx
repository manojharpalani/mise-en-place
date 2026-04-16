export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, Star, Utensils } from 'lucide-react'
import { Button } from '@/components/ui/button'

async function getFavorites(userId: string) {
  return prisma.favoriteSeller.findMany({
    where: { buyerId: userId },
    include: {
      seller: {
        include: { user: { select: { neighborhood: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function FavoritesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  const favorites = await getFavorites(session.user.id)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Favorite Sellers</h1>

      {favorites.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Heart className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No favorites yet</p>
          <p className="text-sm mt-2 mb-6">Heart a seller on their storefront to save them here</p>
          <Button asChild className="bg-[#d4a5a5] hover:bg-[#c49090]">
            <Link href="/sellers">Browse Sellers</Link>
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {favorites.map(({ seller }) => (
            <Link key={seller.id} href={`/${seller.storeSlug}`}>
              <Card className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-video bg-gray-100 relative">
                  {seller.kitchenPhotos?.[0] ? (
                    <Image src={seller.kitchenPhotos[0]} alt={seller.storeName} fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Utensils className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900">{seller.storeName}</h3>
                  {seller.cuisineType && <p className="text-sm text-gray-500">{seller.cuisineType}</p>}
                  <div className="flex items-center gap-3 mt-2">
                    {seller.ratingAvg && (
                      <span className="flex items-center gap-1 text-sm text-amber-500">
                        <Star className="w-4 h-4 fill-amber-400" />
                        {seller.ratingAvg.toFixed(1)}
                      </span>
                    )}
                    {seller.user.neighborhood && (
                      <Badge variant="secondary" className="text-xs">{seller.user.neighborhood}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
