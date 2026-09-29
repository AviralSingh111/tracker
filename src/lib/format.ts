import { parseDateKey } from './dates'

/** Renders a decimal hour count as "7h 30m" (or "45m" under an hour). */
export function formatHours(hours: number) {
  const totalMinutes = Math.max(0, Math.round(hours * 60))
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}m`
  return `${h}h ${String(m).padStart(2, '0')}m`
}

/** Same as `formatHours`, with seconds — for a live ticking countdown. */
export function formatCountdown(hours: number) {
  const totalSeconds = Math.max(0, Math.round(hours * 3600))
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  if (h === 0) return `${m}m ${pad(s)}s`
  return `${h}h ${pad(m)}m ${pad(s)}s`
}

/** An epoch time as "HH:MM" for an `<input type="time">`. */
export function toTimeInput(ms: number) {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function nowTimeString() {
  return toTimeInput(Date.now())
}

/** A week's Monday key -> "22 – 28 Sep" (or "29 Sep – 5 Oct" across months). */
export function formatWeekRange(weekStartKey: string) {
  const start = parseDateKey(weekStartKey)
  const end = parseDateKey(weekStartKey)
  end.setDate(end.getDate() + 6)

  // Within one month the month name is stated once: "Sep 21 – 27".
  const sameMonth = start.getMonth() === end.getMonth()
  const startLabel = start.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  })
  const endLabel = end.toLocaleDateString(undefined, {
    day: 'numeric',
    ...(sameMonth ? {} : { month: 'short' }),
  })
  return `${startLabel} – ${endLabel}`
}

/** "2026-09" -> "September 2026". */
export function formatMonthKey(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
}

/** "2026-09" -> "September". */
export function formatMonthName(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
  })
}

/** "2026-09-16" -> "Wed, 16 Sep" for display. */
export function formatDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}
