import { parseDateKey, todayKey } from './dates'

/**
 * India's three gazetted national holidays. These fall on the same date every
 * year, so they're derived rather than listed per year.
 */
const NATIONAL_HOLIDAYS = [
  { month: 1, day: 26, name: 'Republic Day' },
  { month: 8, day: 15, name: 'Independence Day' },
  { month: 10, day: 2, name: 'Gandhi Jayanti' },
]

/**
 * Festival holidays, keyed by "YYYY-MM-DD". These follow lunar calendars and
 * move every year, so each year's dates have to be added from the office
 * calendar — there's nothing to derive them from.
 */
export const EXTRA_HOLIDAYS: Record<string, string> = {
  '2026-03-04': 'Holi',
  '2026-03-21': 'Eid',
  '2026-10-20': 'Dussehra',
  '2026-11-09': 'Diwali',
}

/** The holiday falling on this date, or null if it isn't one. */
export function holidayName(dateKey: string): string | null {
  const extra = EXTRA_HOLIDAYS[dateKey]
  if (extra) return extra

  const date = parseDateKey(dateKey)
  const match = NATIONAL_HOLIDAYS.find(
    (h) => h.month === date.getMonth() + 1 && h.day === date.getDate(),
  )
  return match?.name ?? null
}

export function isWeekend(dateKey: string) {
  const day = parseDateKey(dateKey).getDay()
  return day === 0 || day === 6 // Sun, Sat
}

export function isHoliday(dateKey: string) {
  return holidayName(dateKey) !== null
}

/** A day you're expected to work: Mon-Fri, minus national/office holidays. */
export function isWorkday(dateKey: string) {
  return !isWeekend(dateKey) && !isHoliday(dateKey)
}

/** Why a day is off, for display next to logged time. Null on a workday. */
export function offDayLabel(dateKey: string): string | null {
  return holidayName(dateKey) ?? (isWeekend(dateKey) ? 'Weekend' : null)
}

export function isTodayWorkday(now = Date.now()) {
  return isWorkday(todayKey(new Date(now)))
}
