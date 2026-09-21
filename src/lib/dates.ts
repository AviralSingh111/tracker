/** The local date of `d` as a "YYYY-MM-DD" key. */
export function todayKey(d = new Date()) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Parses a "YYYY-MM-DD" key as a local date (`new Date(key)` would be UTC). */
export function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** The "YYYY-MM" month a date key belongs to. */
export function monthOf(dateKey: string) {
  return dateKey.slice(0, 7)
}

export function thisMonthKey(d = new Date()) {
  return monthOf(todayKey(d))
}

/** First day of a "YYYY-MM" month, as a date key. */
export function firstDayOfMonth(monthKey: string) {
  return `${monthKey}-01`
}

/** Last day of a "YYYY-MM" month, as a date key. */
export function lastDayOfMonth(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number)
  return todayKey(new Date(year, month, 0)) // day 0 = last day of previous month
}

/** Every date key from `from` to `to` inclusive. */
export function datesBetween(from: string, to: string): string[] {
  const dates: string[] = []
  const cursor = parseDateKey(from)
  const end = parseDateKey(to)
  while (cursor <= end) {
    dates.push(todayKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}
