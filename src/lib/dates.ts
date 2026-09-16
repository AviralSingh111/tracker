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
