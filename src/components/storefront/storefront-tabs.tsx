'use client'

import { useState, useMemo, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ItemCard } from './item-card'
import { ComboCard } from './combo-card'
import { CartSheet } from './cart'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Star, Heart, CheckCircle, Calendar } from 'lucide-react'
import Image from 'next/image'
import { formatDate, formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import type { Session } from 'next-auth'

interface StorefrontTabsProps {
  seller: {
    id: string
    storeName: string
    storeSlug: string
    bio?: string | null
    story?: string | null
    cuisineType?: string | null
    kitchenPhotos?: string[]
    permitStatus: string
    deliveryEnabled: boolean
    deliveryFee?: number | null
    pickupEnabled: boolean
    pickupWindows?: Record<string, string[]> | null
    menuItems: Array<{
      id: number
      name: string
      description?: string | null
      price: number
      salePrice?: number | null
      photoUrl?: string | null
      dietaryTags?: string[]
    }>
    comboItems: Array<{
      id: string
      name: string
      description?: string | null
      comboPrice: number
      photoUrl?: string | null
    }>
    weeklyMenus: Array<{
      id: string
      weekStartDate: Date
      days: Array<{
        id: string
        date: Date
        dayOfWeek: string
        menuItems: Array<{ menuItem: { id: number; name: string; price: number; salePrice?: number | null; photoUrl?: string | null; description?: string | null } }>
        comboItems: Array<{ comboItem: { id: string; name: string; comboPrice: number; photoUrl?: string | null } }>
      }>
    }>
    articles: Array<{
      id: string
      title: string
      body: string
      imageUrl?: string | null
      createdAt: Date
      author: { name?: string | null }
    }>
    reviews: Array<{
      id: string
      rating: number
      comment?: string | null
      createdAt: Date
      buyer: { name?: string | null; image?: string | null }
    }>
    user: { neighborhood?: string | null; zip?: string | null; name?: string | null; email?: string | null; [key: string]: unknown }
  }
  session: Session | null
  isFavorited: boolean
}

export function StorefrontTabs({ seller, session, isFavorited }: StorefrontTabsProps) {
  const [favorited, setFavorited] = useState(isFavorited)

  const toggleFavorite = async () => {
    if (!session) {
      toast.error('Sign in to save favorites')
      return
    }
    try {
      const res = await fetch(`/api/sellers/${seller.id}/favorite`, {
        method: favorited ? 'DELETE' : 'POST',
      })
      if (!res.ok) throw new Error()
      setFavorited(!favorited)
      toast.success(favorited ? 'Removed from favorites' : 'Added to favorites')
    } catch {
      toast.error('Failed to update favorite')
    }
  }

  // todayStr must be set client-side only — computing new Date() during SSR and again
  // during hydration gives different timestamps, causing a tree mismatch warning.
  const [todayStr, setTodayStr] = useState<string | null>(null)
  useEffect(() => { setTodayStr(new Date().toDateString()) }, [])

  const todayMenu = useMemo(() => {
    if (!todayStr) return undefined
    return seller.weeklyMenus[0]?.days.find(
      (d) => new Date(d.date).toDateString() === todayStr
    )
  }, [seller.weeklyMenus, todayStr])

  const ratingStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
      />
    ))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CartSheet />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleFavorite}
          className={favorited ? 'border-red-300 text-red-500' : ''}
        >
          <Heart className={`w-4 h-4 mr-2 ${favorited ? 'fill-red-500 text-red-500' : ''}`} />
          {favorited ? 'Saved' : 'Save'}
        </Button>
      </div>

      <Tabs defaultValue="latest">
        <TabsList className="mb-6">
          <TabsTrigger value="latest">What&apos;s Latest</TabsTrigger>
          <TabsTrigger value="store">View Store</TabsTrigger>
          <TabsTrigger value="about">About Us</TabsTrigger>
          <TabsTrigger value="story">Stories</TabsTrigger>
        </TabsList>

        {/* Latest — today's menu */}
        <TabsContent value="latest">
          <div className="space-y-6">
            {todayMenu ? (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Today&apos;s Menu — {new Date(todayMenu.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {todayMenu.menuItems.map((mi) => (
                    <ItemCard key={mi.menuItem.id} item={mi.menuItem} sellerId={seller.id} sellerName={seller.storeName} />
                  ))}
                  {todayMenu.comboItems.map((ci) => (
                    <ComboCard key={ci.comboItem.id} combo={ci.comboItem} sellerId={seller.id} sellerName={seller.storeName} />
                  ))}
                </div>
                {todayMenu.menuItems.length === 0 && todayMenu.comboItems.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No items scheduled for today.</p>
                )}
              </>
            ) : (
              <>
                <p className="text-muted-foreground mb-4">No menu scheduled for today. Browse the full store below.</p>
                {seller.menuItems.length > 0 && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {seller.menuItems.slice(0, 6).map((item) => (
                      <ItemCard key={item.id} item={item} sellerId={seller.id} sellerName={seller.storeName} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>

        {/* Full weekly menu */}
        <TabsContent value="store">
          {seller.weeklyMenus[0] ? (
            <div className="space-y-8">
              <div className="text-sm text-muted-foreground">
                Week of {formatDate(seller.weeklyMenus[0].weekStartDate)}
              </div>
              {seller.weeklyMenus[0].days.map((day) => (
                <div key={day.id}>
                  <h3 className="font-semibold text-lg text-foreground mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#c1622d]" />
                    {day.dayOfWeek} — {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </h3>
                  {day.menuItems.length === 0 && day.comboItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No items scheduled</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {day.menuItems.map((mi) => (
                        <ItemCard key={mi.menuItem.id} item={mi.menuItem} sellerId={seller.id} sellerName={seller.storeName} />
                      ))}
                      {day.comboItems.map((ci) => (
                        <ComboCard key={ci.comboItem.id} combo={ci.comboItem} sellerId={seller.id} sellerName={seller.storeName} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div>
              <p className="text-muted-foreground mb-6">All available items:</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {seller.menuItems.map((item) => (
                  <ItemCard key={item.id} item={item} sellerId={seller.id} sellerName={seller.storeName} />
                ))}
                {seller.comboItems.map((combo) => (
                  <ComboCard key={combo.id} combo={combo} sellerId={seller.id} sellerName={seller.storeName} />
                ))}
              </div>
              {seller.menuItems.length === 0 && seller.comboItems.length === 0 && (
                <p className="text-muted-foreground text-center py-12">No menu items yet.</p>
              )}
            </div>
          )}
        </TabsContent>

        {/* About */}
        <TabsContent value="about">
          <div className="space-y-6 max-w-2xl">
            {seller.story && (
              <div>
                <h3 className="font-semibold text-foreground mb-2">Our Story</h3>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{seller.story}</p>
              </div>
            )}
            {seller.bio && !seller.story && (
              <p className="text-foreground leading-relaxed">{seller.bio}</p>
            )}

            <div>
              <h3 className="font-semibold text-foreground mb-3">Details</h3>
              <dl className="space-y-2 text-sm">
                {seller.cuisineType && (
                  <div className="flex gap-3">
                    <dt className="text-muted-foreground w-28 shrink-0">Cuisine</dt>
                    <dd className="text-foreground">{seller.cuisineType}</dd>
                  </div>
                )}
                {seller.user.neighborhood && (
                  <div className="flex gap-3">
                    <dt className="text-muted-foreground w-28 shrink-0">Location</dt>
                    <dd className="text-foreground">{seller.user.neighborhood}{seller.user.zip && `, ${seller.user.zip}`}</dd>
                  </div>
                )}
                <div className="flex gap-3">
                  <dt className="text-muted-foreground w-28 shrink-0">Permit</dt>
                  <dd>
                    {seller.permitStatus === 'APPROVED' ? (
                      <Badge className="bg-[#f7e9de] text-[#a64f20] flex items-center gap-1 w-fit">
                        <CheckCircle className="w-3 h-3" /> Verified & Permitted
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Pending verification</Badge>
                    )}
                  </dd>
                </div>
                {seller.pickupEnabled && seller.pickupWindows && (
                  <div className="flex gap-3">
                    <dt className="text-muted-foreground w-28 shrink-0">Pickup</dt>
                    <dd className="text-foreground">
                      {(Array.isArray(seller.pickupWindows)
                        ? seller.pickupWindows as Array<{ day: string; startTime: string; endTime: string }>
                        : Object.entries(seller.pickupWindows as unknown as Record<string, string>).map(([day, time]) => ({ day, startTime: time, endTime: '' }))
                      ).map((w, i) => (
                        <div key={i}>{w.day}: {w.startTime}{w.endTime ? ` – ${w.endTime}` : ''}</div>
                      ))}
                    </dd>
                  </div>
                )}
                {seller.deliveryEnabled && (
                  <div className="flex gap-3">
                    <dt className="text-muted-foreground w-28 shrink-0">Delivery</dt>
                    <dd className="text-foreground">
                      Available{seller.deliveryFee ? ` — ${formatCurrency(seller.deliveryFee)} fee` : ''}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Kitchen Photos */}
            {seller.kitchenPhotos && seller.kitchenPhotos.length > 1 && (
              <div>
                <h3 className="font-semibold text-foreground mb-3">Kitchen Photos</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {seller.kitchenPhotos.map((photo, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden">
                      <Image src={photo} alt={`Kitchen photo ${i + 1}`} width={200} height={200} className="object-cover w-full h-full" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Reviews ({seller.reviews.length})</h3>
              {seller.reviews.length === 0 ? (
                <p className="text-muted-foreground text-sm">No reviews yet. Be the first!</p>
              ) : (
                <div className="space-y-4">
                  {seller.reviews.map((review) => (
                    <div key={review.id} className="border rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={review.buyer.image ?? ''} />
                          <AvatarFallback>{review.buyer.name?.[0]?.toUpperCase() ?? 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{review.buyer.name || 'Anonymous'}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
                        </div>
                        <div className="flex ml-auto">{ratingStars(review.rating)}</div>
                      </div>
                      {review.comment && <p className="text-sm text-foreground">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Stories / Articles */}
        <TabsContent value="story">
          <div className="space-y-6">
            {seller.articles.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">No posts yet.</p>
            ) : (
              seller.articles.map((article) => (
                <article key={article.id} className="bg-white rounded-xl border p-6">
                  {article.imageUrl && (
                    <div className="aspect-video rounded-lg overflow-hidden mb-4 relative">
                      <Image src={article.imageUrl} alt={article.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 66vw" />
                    </div>
                  )}
                  <h2 className="text-xl font-semibold text-foreground mb-2">{article.title}</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <span>{article.author.name || 'Author'}</span>
                    <span>·</span>
                    <span>{formatDate(article.createdAt)}</span>
                  </div>
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">{article.body}</p>
                </article>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
