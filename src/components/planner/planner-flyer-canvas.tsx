import React from 'react'

export interface PlannerFlyerDish {
  name: string
  servings?: number
}

export interface PlannerFlyerDay {
  dayOfWeek: string
  dishes: PlannerFlyerDish[]
}

const DAY_PALETTES = [
  { bg: '#fce4ec', header: '#e8607a', text: '#8b1a2e' },
  { bg: '#f3e5f5', header: '#b967c7', text: '#5e1a72' },
  { bg: '#e8eaf6', header: '#7986cb', text: '#1a237e' },
  { bg: '#e0f7fa', header: '#26c6da', text: '#006064' },
  { bg: '#f1f8e9', header: '#8bc34a', text: '#33691e' },
  { bg: '#fff8e1', header: '#ffca28', text: '#6d4c00' },
]

export const PlannerFlyerCanvas = React.forwardRef<HTMLDivElement, {
  displayName: string
  profileUrl: string
  cuisinePrefs?: string[]
  bio?: string | null
  weekLabel: string
  days: PlannerFlyerDay[]
  householdSize?: number
}>(({ displayName, profileUrl, cuisinePrefs, bio, weekLabel, days, householdSize }, ref) => {
  const visibleDays = days.filter((d) => d.dishes.length > 0).slice(0, 6)
  const tagline = bio ? bio.split('.')[0].trim() : cuisinePrefs?.length ? cuisinePrefs.join(' · ') : 'Weekly meal plan'

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
        background: 'linear-gradient(145deg, #fce8f0 0%, #ede8fc 30%, #e8edfc 55%, #e5f8ee 80%, #fef9e7 100%)',
      }}
    >
      {/* Header */}
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
      }}>
        <div style={{
          fontSize: displayName.length > 20 ? 28 : displayName.length > 14 ? 34 : 40,
          fontWeight: 700,
          color: '#1a1a2e',
          lineHeight: 1.1,
          letterSpacing: '-0.5px',
          marginBottom: 6,
        }}>
          {displayName}
        </div>

        <div style={{
          fontSize: 13,
          fontStyle: 'italic',
          color: '#5a4a6a',
          fontFamily: 'sans-serif',
          marginBottom: 12,
          lineHeight: 1.3,
          maxWidth: 360,
        }}>
          {tagline}
        </div>

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
          <span style={{ fontSize: 11, color: '#7b5ea7', fontFamily: 'sans-serif', fontWeight: 700 }}>📅</span>
          <span style={{ fontSize: 11, color: '#3a2a4a', fontFamily: 'sans-serif', fontWeight: 600 }}>{weekLabel}</span>
          {householdSize && householdSize > 1 && (
            <span style={{ fontSize: 10, color: '#7b5ea7', fontFamily: 'sans-serif' }}>· {householdSize} people</span>
          )}
        </div>
      </div>

      {/* Days Grid */}
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
              <div style={{
                background: palette.header,
                padding: '5px 4px',
                textAlign: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'white', fontFamily: 'sans-serif', letterSpacing: '0.5px' }}>
                  {shortDay}
                </span>
              </div>

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
                    <div style={{
                      fontSize: 8,
                      fontWeight: 700,
                      color: '#1a1a2e',
                      fontFamily: 'sans-serif',
                      lineHeight: 1.2,
                      wordBreak: 'break-word',
                    }}>
                      {dish.name}
                    </div>
                    {dish.servings != null && (
                      <div style={{
                        fontSize: 7,
                        color: palette.text,
                        fontFamily: 'sans-serif',
                        marginTop: 2,
                        fontWeight: 500,
                      }}>
                        {dish.servings} serving{dish.servings !== 1 ? 's' : ''}
                      </div>
                    )}
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

      {/* Footer */}
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
            Planned with metta ✨
          </span>
        </div>
        <div style={{ fontSize: 9, color: '#7a6a8a', fontFamily: 'sans-serif', letterSpacing: '0.3px' }}>
          {profileUrl}
        </div>
      </div>
    </div>
  )
})

PlannerFlyerCanvas.displayName = 'PlannerFlyerCanvas'
