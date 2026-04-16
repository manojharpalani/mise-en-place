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

// Pastel palette — one per day column, cycles if > 6 days
const DAY_PALETTES = [
  { bg: '#fce4ec', header: '#e8607a', text: '#8b1a2e' },
  { bg: '#f3e5f5', header: '#b967c7', text: '#5e1a72' },
  { bg: '#e8eaf6', header: '#7986cb', text: '#1a237e' },
  { bg: '#e0f7fa', header: '#26c6da', text: '#006064' },
  { bg: '#f1f8e9', header: '#8bc34a', text: '#33691e' },
  { bg: '#fff8e1', header: '#ffca28', text: '#6d4c00' },
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
        fontFamily: "'Georgia', 'Times New Roman', serif",
        overflow: 'hidden',
        flexShrink: 0,
        // Pastel diagonal gradient background
        background: 'linear-gradient(145deg, #fce8f0 0%, #ede8fc 30%, #e8edfc 55%, #e5f8ee 80%, #fef9e7 100%)',
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
          color: '#1a1a2e',
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
          color: '#5a4a6a',
          fontFamily: 'sans-serif',
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
          border: '1px solid rgba(180,130,200,0.25)',
        }}>
          <span style={{ fontSize: 11, color: '#7b5ea7', fontFamily: 'sans-serif', fontWeight: 700 }}>
            📅
          </span>
          <span style={{ fontSize: 11, color: '#3a2a4a', fontFamily: 'sans-serif', fontWeight: 600 }}>
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
            color: '#9e8faf',
            fontFamily: 'sans-serif',
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
                  fontFamily: 'sans-serif',
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
                      color: '#1a1a2e',
                      fontFamily: 'sans-serif',
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
                        fontFamily: 'sans-serif',
                      }}>
                        {dish.salePrice
                          ? <>{fmt(dish.salePrice)} <span style={{ textDecoration: 'line-through', opacity: 0.5 }}>{fmt(dish.price)}</span></>
                          : fmt(dish.price)
                        }
                      </span>
                      {dish.quantity != null && (
                        <span style={{
                          fontSize: 7,
                          color: '#5a5a7a',
                          fontFamily: 'sans-serif',
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
                    fontFamily: 'sans-serif',
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
          border: '1px solid rgba(180,130,200,0.20)',
          whiteSpace: 'nowrap',
        }}>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#3a2a4a',
            fontFamily: 'sans-serif',
            letterSpacing: '0.2px',
          }}>
            Pre-order 24 hrs before · Made with metta
          </span>
        </div>
        <div style={{
          fontSize: 9,
          color: '#7a6a8a',
          fontFamily: 'sans-serif',
          letterSpacing: '0.3px',
        }}>
          {storeUrl}
        </div>
      </div>
    </div>
  )
})

FlyerCanvas.displayName = 'FlyerCanvas'
