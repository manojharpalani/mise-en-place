import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { searchParams } = new URL(req.url)
  const itemId = searchParams.get('itemId')

  const seller = await (prisma as any).sellerProfile.findUnique({
    where: { storeSlug: slug },
    select: { storeName: true, cuisineType: true },
  })

  let itemName = 'Today\'s Special'
  let itemPrice = ''
  let itemSalePrice = ''
  let itemPhoto = null

  if (itemId) {
    const item = await (prisma as any).menuItem.findUnique({
      where: { id: Number(itemId) },
      select: { name: true, price: true, salePrice: true, photoUrl: true },
    })
    if (item) {
      itemName = item.name
      itemPrice = `$${item.price.toFixed(2)}`
      itemSalePrice = item.salePrice ? `$${item.salePrice.toFixed(2)}` : ''
      itemPhoto = item.photoUrl
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decoration */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(22, 163, 74, 0.1)',
          }}
        />

        <div style={{ display: 'flex', flex: 1, padding: '60px' }}>
          {/* Left content */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  background: '#16a34a',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                }}
              >
                🍽️
              </div>
              <span style={{ fontSize: '24px', fontWeight: 600, color: '#166534' }}>
                {seller?.storeName || slug}
              </span>
            </div>

            <h1 style={{ fontSize: '56px', fontWeight: 800, color: '#14532d', margin: '0 0 16px 0', lineHeight: 1.1 }}>
              {itemName}
            </h1>

            {seller?.cuisineType && (
              <p style={{ fontSize: '24px', color: '#16a34a', margin: '0 0 24px 0' }}>
                {seller.cuisineType}
              </p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {itemSalePrice ? (
                <>
                  <span
                    style={{
                      fontSize: '48px',
                      fontWeight: 800,
                      color: '#dc2626',
                    }}
                  >
                    {itemSalePrice}
                  </span>
                  <span
                    style={{
                      fontSize: '32px',
                      color: '#9ca3af',
                      textDecoration: 'line-through',
                    }}
                  >
                    {itemPrice}
                  </span>
                  <div
                    style={{
                      background: '#dc2626',
                      color: 'white',
                      padding: '6px 16px',
                      borderRadius: '20px',
                      fontSize: '18px',
                      fontWeight: 700,
                    }}
                  >
                    SALE
                  </div>
                </>
              ) : (
                <span style={{ fontSize: '48px', fontWeight: 800, color: '#16a34a' }}>
                  {itemPrice}
                </span>
              )}
            </div>

            <div
              style={{
                marginTop: '32px',
                padding: '16px 24px',
                background: '#16a34a',
                color: 'white',
                borderRadius: '12px',
                fontSize: '20px',
                fontWeight: 600,
                display: 'inline-flex',
                width: 'fit-content',
              }}
            >
              Order on WithMetta →
            </div>
          </div>

          {/* Right image */}
          {itemPhoto && (
            <div
              style={{
                width: '400px',
                height: '400px',
                borderRadius: '24px',
                overflow: 'hidden',
                marginLeft: '40px',
                alignSelf: 'center',
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={itemPhoto} alt={itemName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
