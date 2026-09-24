// Pickup-window helpers: turn a seller's pickup windows into bookable
// time ranges for a given date (e.g. "5:00 PM – 5:30 PM").

export type PickupWindow = { day: string; startTime: string; endTime: string }

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

/** "5:00 PM" / "17:00" / "5pm" → minutes after midnight, or null. */
export function parseTime(t: string): number | null {
  const m = t.trim().toUpperCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/)
  if (!m) return null
  let h = Number(m[1])
  const min = Number(m[2] ?? 0)
  if (m[3] === 'PM' && h !== 12) h += 12
  if (m[3] === 'AM' && h === 12) h = 0
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

export function formatTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

/** Does a window's day label ("MON-SAT", "Monday", "Weekdays", "Daily") cover this weekday (0=Sun)? */
export function dayMatches(label: string, weekday: number): boolean {
  const l = label.trim().toUpperCase()
  if (!l || ['DAILY', 'EVERYDAY', 'EVERY DAY', 'ALL'].includes(l)) return true
  if (l === 'WEEKDAYS') return weekday >= 1 && weekday <= 5
  if (l === 'WEEKENDS') return weekday === 0 || weekday === 6
  const idx = (s: string) => DAYS.indexOf(s.trim().slice(0, 3))
  return l.split(/[,/]/).some((part) => {
    const [a, b] = part.split(/[-–]/)
    const from = idx(a)
    if (from < 0) return false
    if (!b) return from === weekday
    const to = idx(b)
    if (to < 0) return false
    return from <= to ? weekday >= from && weekday <= to : weekday >= from || weekday <= to
  })
}

/** Normalise the stored JSON (array of windows, or { day: "5 PM" } map). */
export function normaliseWindows(raw: unknown): PickupWindow[] {
  if (Array.isArray(raw)) {
    return raw.filter((w): w is PickupWindow => !!w && typeof w === 'object' && 'startTime' in w)
  }
  if (raw && typeof raw === 'object') {
    return Object.entries(raw as Record<string, string>).map(([day, time]) => {
      const [startTime, endTime = ''] = String(time).split(/\s*[-–]\s*/)
      return { day, startTime, endTime }
    })
  }
  return []
}

const DEFAULT_WINDOW: PickupWindow = { day: 'DAILY', startTime: '11:00 AM', endTime: '8:00 PM' }

/**
 * Bookable ranges for a date (YYYY-MM-DD). Uses the seller's windows when they
 * have any; otherwise a standard 11 AM – 8 PM day.
 */
export function pickupSlotsFor(dateStr: string, raw: unknown, stepMinutes = 30): string[] {
  if (!dateStr) return []
  const weekday = new Date(`${dateStr}T12:00:00`).getDay()
  const windows = normaliseWindows(raw)
  const source = windows.length > 0 ? windows : [DEFAULT_WINDOW]
  const slots: string[] = []
  for (const w of source) {
    if (!dayMatches(w.day, weekday)) continue
    const start = parseTime(w.startTime)
    const end = w.endTime ? parseTime(w.endTime) : start !== null ? start + 60 : null
    if (start === null || end === null || end <= start) continue
    for (let t = start; t + stepMinutes <= end; t += stepMinutes) {
      slots.push(`${formatTime(t)} – ${formatTime(t + stepMinutes)}`)
    }
  }
  return [...new Set(slots)]
}
