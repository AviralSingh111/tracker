import type { DaySummary, TimeEntry } from '../types'
import { monthOf, thisMonthKey, todayKey } from './dates'
import { isWorkday } from './holidays'

const MS_PER_HOUR = 1000 * 60 * 60

/**
 * Sums each entry's duration into per-day totals. Open entries count up to
 * `now`, except one left open past its own day, which is capped at
 * `staleCapHours` — otherwise a forgotten clock-out banks 20+ hours.
 */
export function summarizeDays(
  entries: TimeEntry[],
  now = Date.now(),
  staleCapHours?: number,
): DaySummary[] {
  const totals = new Map<string, number>()
  const today = todayKey(new Date(now))

  for (const entry of entries) {
    const end = entry.clockOut ?? now
    let hours = Math.max(0, end - entry.clockIn) / MS_PER_HOUR
    if (entry.clockOut === null && entry.date < today && staleCapHours !== undefined) {
      hours = Math.min(hours, staleCapHours)
    }
    totals.set(entry.date, (totals.get(entry.date) ?? 0) + hours)
  }

  return [...totals.entries()]
    .map(([date, hours]) => ({ date, hours }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export interface RemainingWork {
  todayHours: number
  /** Hours still owed today to hit the daily target. 0 on an off day. */
  todayRemainingHours: number
  isTodayWorkday: boolean
  /** Total shortfall across the days actually clocked in. */
  overallRemainingHours: number
  /** First day logged this month — where the overall figure starts counting. */
  overallSince: string | null
  /** Working days with time logged — the ones the target is charged against. */
  overallLoggedWorkdays: number
}

/**
 * Time still owed: for today, and cumulatively across the days you logged.
 *
 * Only days you actually clocked in count towards the target. A workday with
 * no entry is treated as leave, not as 8 hours owed — otherwise time off
 * builds a debt you can never pay down. Hours logged on a weekend or holiday
 * are still credited, they just don't add a target of their own.
 *
 * It starts fresh each month.
 */
export function calculateRemaining(
  entries: TimeEntry[],
  targetHours: number,
  now = Date.now(),
): RemainingWork {
  const todayStr = todayKey(new Date(now))
  const currentMonth = thisMonthKey(new Date(now))
  const days = summarizeDays(entries, now, targetHours)
  const hoursByDate = new Map(days.map((d) => [d.date, d.hours]))

  const todayHours = hoursByDate.get(todayStr) ?? 0
  const todayIsWorkday = isWorkday(todayStr)
  const todayRemainingHours = todayIsWorkday
    ? Math.max(0, targetHours - todayHours)
    : 0

  // Only days with time on them. A blank workday is leave, not a debt.
  const loggedDays = days.filter(
    (d) => monthOf(d.date) === currentMonth && d.hours > 0 && d.date <= todayStr,
  )

  // Weekend and holiday hours are credited but carry no target of their own.
  const loggedWorkdays = loggedDays.filter((d) => isWorkday(d.date))
  const loggedHours = loggedDays.reduce((sum, d) => sum + d.hours, 0)

  return {
    todayHours,
    todayRemainingHours,
    isTodayWorkday: todayIsWorkday,
    overallRemainingHours: Math.max(
      0,
      loggedWorkdays.length * targetHours - loggedHours,
    ),
    overallSince: loggedDays[0]?.date ?? null,
    overallLoggedWorkdays: loggedWorkdays.length,
  }
}

export interface MonthSummary {
  /** "YYYY-MM" */
  month: string
  totalHours: number
  /** Days with any time logged — the divisor for the average. */
  loggedDays: number
  averagePerLoggedDay: number
  /** Hours above (positive) or below (negative) target, across logged days. */
  differenceFromTarget: number
  isCurrentMonth: boolean
}

/**
 * Per-month totals and averages, newest first.
 *
 * The average divides by the days actually logged, not by every workday on the
 * calendar — a month with five entries reads as the average of those five days,
 * not five days spread thin over the whole month.
 */
export function summarizeMonths(
  entries: TimeEntry[],
  targetHours: number,
  now = Date.now(),
): MonthSummary[] {
  const currentMonth = thisMonthKey(new Date(now))
  const days = summarizeDays(entries, now, targetHours)

  const months = new Set(days.map((d) => monthOf(d.date)))
  months.add(currentMonth)

  return [...months]
    .sort((a, b) => b.localeCompare(a))
    .map((month) => {
      const monthDays = days.filter(
        (d) => monthOf(d.date) === month && d.hours > 0,
      )
      const totalHours = monthDays.reduce((sum, d) => sum + d.hours, 0)
      const loggedDays = monthDays.length

      return {
        month,
        totalHours,
        loggedDays,
        averagePerLoggedDay: loggedDays > 0 ? totalHours / loggedDays : 0,
        differenceFromTarget: totalHours - loggedDays * targetHours,
        isCurrentMonth: month === currentMonth,
      }
    })
}
