import React from 'react'

export interface FlyerDish {
  name: string
  price: number
  salePrice?: number | null
  quantity?: number
  isCombo?: boolean
}

export interface FlyerDay {
  dayOfWeek: string
  dishes: FlyerDish[]
}

// Brand palette (turmeric / chili / curry-leaf family) — one per day column, cycles if > 6 days
const DAY_PALETTES = [
  { bg: '#fff1d6', header: '#b07d00', text: '#5c430d' },
  { bg: '#fde4de', header: '#e2472b', text: '#7a1e0e' },
  { bg: '#e3efe7', header: '#12402c', text: '#12402c' },
  { bg: '#fff9ec', header: '#d9661f', text: '#7a3a10' },
  { bg: '#eaf2df', header: '#4e7d32', text: '#2f4a1c' },
  { bg: '#f6e6d8', header: '#8a4b22', text: '#4e2a12' },
]

function fmt(price: number) {
  return `$${price.toFixed(2)}`
}

// 540×540 — captured at pixelRatio:2 → 1080×1080
export const FlyerCanvas = React.forwardRef<HTMLDivElement, {
  storeName: string
  storeUrl: string
  cuisineType?: string | null
  bio?: string | null
  weekLabel: string
  days: FlyerDay[]
}>(({ storeName, storeUrl, cuisineType, bio, weekLabel, days }, ref) => {
  const visibleDays = days.filter(d => d.dishes.length > 0).slice(0, 6)
  const tagline = bio ? bio.split('.')[0].trim() : cuisineType ?? 'Homemade with love'

  return (
    <div
      ref={ref}
      style={{
        width: 540,
        height: 540,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "var(--font-heading), 'Bricolage Grotesque', system-ui, sans-serif",
        overflow: 'hidden',
        flexShrink: 0,
        // Warm cream-to-turmeric background
        background: 'linear-gradient(150deg, #fff9ec 0%, #fff1d6 50%, #fde3a7 100%)',
      }}
    >
      {/* ── HEADER ── */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 24,
        paddingBottom: 14,
        paddingLeft: 28,
        paddingRight: 28,
        textAlign: 'center',
        gap: 0,
      }}>
        {/* Store name — the single big brand */}
        <div style={{
          fontSize: storeName.length > 20 ? 28 : storeName.length > 14 ? 34 : 40,
          fontWeight: 700,
          color: '#12402c',
          lineHeight: 1.1,
          letterSpacing: '-0.5px',
          marginBottom: 6,
        }}>
          {storeName}
        </div>

        {/* Tagline */}
        <div style={{
          fontSize: 13,
          fontStyle: 'italic',
          color: '#4d5747',
          fontFamily: "var(--font-sans), 'Onest', system-ui, sans-serif",
          fontWeight: 400,
          marginBottom: 12,
          lineHeight: 1.3,
          maxWidth: 360,
        }}>
          {tagline}
        </div>

        {/* Week pill — nowrap so it never breaks to a second line */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(255,255,255,0.70)',
          borderRadius: 40,
          padding: '5px 16px',
          whiteSpace: 'nowrap',
          border: '1px solid rgba(18,64,44,0.18)',
        }}>
          <span style={{ fontSize: 11, color: '#e2472b', fontFamily: "var(--font-sans), 'Onest', system-ui, sans-serif", fontWeight: 700 }}>
            📅
          </span>
          <span style={{ fontSize: 11, color: '#12241b', fontFamily: "var(--font-sans), 'Onest', system-ui, sans-serif", fontWeight: 600 }}>
            {weekLabel}
          </span>
        </div>
      </div>

      {/* ── DAYS GRID ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        paddingLeft: 12,
        paddingRight: 12,
        paddingBottom: 8,
        gap: 6,
        minHeight: 0,
      }}>
        {visibleDays.length === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6f7768',
            fontFamily: "var(--font-sans), 'Onest', system-ui, sans-serif",
            fontSize: 13,
          }}>
            Add dishes to days to preview the flyer
          </div>
        ) : visibleDays.map((day, di) => {
          const palette = DAY_PALETTES[di % DAY_PALETTES.length]
          const shortDay = day.dayOfWeek.slice(0, 3).toUpperCase()

          return (
            <div
              key={day.dayOfWeek}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                background: palette.bg,
                borderRadius: 12,
                overflow: 'hidden',
                minWidth: 0,
              }}
            >
              {/* Day header */}
              <div style={{
                background: palette.header,
                padding: '5px 4px',
                textAlign: 'center',
                flexShrink: 0,
              }}>
                <span style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: 'white',
                  fontFamily: "var(--font-sans), 'Onest', system-ui, sans-serif",
                  letterSpacing: '0.5px',
                }}>
                  {shortDay}
                </span>
              </div>

              {/* Dish list */}
              <div style={{
                flex: 1,
                padding: '6px 5px',
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                overflow: 'hidden',
              }}>
                {day.dishes.slice(0, 4).map((dish, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(255,255,255,0.65)',
                    borderRadius: 6,
                    padding: '4px 5px',
                    flexShrink: 0,
                  }}>
                    {/* Item name */}
                    <div style={{
                      fontSize: 8,
                      fontWeight: 700,
                      color: '#12402c',
                      fontFamily: "var(--font-sans), 'Onest', system-ui, sans-serif",
                      lineHeight: 1.2,
                      wordBreak: 'break-word',
                    }}>
                      {dish.name}
                      {dish.isCombo && (
                        <span style={{
                          marginLeft: 3,
                          fontSize: 7,
                          fontWeight: 600,
                          color: palette.text,
                          background: palette.bg,
                          borderRadius: 3,
                          padding: '1px 3px',
                        }}>
                          COMBO
                        </span>
                      )}
                    </div>
                    {/* Price + qty row */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 2,
                    }}>
                      <span style={{
                        fontSize: 8,
                        fontWeight: 600,
                        color: palette.text,
                        fontFamily: "var(--font-sans), 'Onest', system-ui, sans-serif",
                      }}>
                        {dish.salePrice
                          ? <>{fmt(dish.salePrice)} <span style={{ textDecoration: 'line-through', opacity: 0.5 }}>{fmt(dish.price)}</span></>
                          : fmt(dish.price)
                        }
                      </span>
                      {dish.quantity != null && (
                        <span style={{
                          fontSize: 7,
                          color: '#4d5747',
                          fontFamily: "var(--font-sans), 'Onest', system-ui, sans-serif",
                          fontWeight: 500,
                        }}>
                          ×{dish.quantity}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {day.dishes.length > 4 && (
                  <div style={{
                    fontSize: 7,
                    color: palette.text,
                    fontFamily: "var(--font-sans), 'Onest', system-ui, sans-serif",
                    textAlign: 'center',
                    opacity: 0.8,
                  }}>
                    +{day.dishes.length - 4} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        flexShrink: 0,
        padding: '6px 20px 14px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.70)',
          borderRadius: 30,
          padding: '6px 22px',
          textAlign: 'center',
          border: '1px solid rgba(18,64,44,0.14)',
          whiteSpace: 'nowrap',
        }}>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#12241b',
            fontFamily: "var(--font-sans), 'Onest', system-ui, sans-serif",
            letterSpacing: '0.2px',
          }}>
            Pre-order 24 hrs before · Prepped with care
          </span>
        </div>
        <div style={{
          fontSize: 9,
          color: '#4d5747',
          fontFamily: "var(--font-sans), 'Onest', system-ui, sans-serif",
          letterSpacing: '0.3px',
        }}>
          {storeUrl}
        </div>
      </div>
    </div>
  )
})

FlyerCanvas.displayName = 'FlyerCanvas'
