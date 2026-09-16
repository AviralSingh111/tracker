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

/** "2026-09-16" -> "Wed, 16 Sep" for display. */
export function formatDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}
