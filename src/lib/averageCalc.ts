import type { DaySummary, TimeEntry } from '../types'
import {
  datesBetween,
  monthOf,
  thisMonthKey,
  todayKey,
} from './dates'
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
  /** Total shortfall across the tracked workdays. */
  overallRemainingHours: number
  /** First day logged this month — where the overall figure starts counting. */
  overallSince: string | null
  overallWorkdayCount: number
}

/**
 * Time still owed: for today, and cumulatively since you started logging.
 *
 * The overall figure counts from your FIRST LOGGED DAY of the month, not from
 * the 1st — days before you started tracking were never owed, and counting
 * them makes the number meaningless. It's `target × workdays in that span`
 * minus everything logged, so it's what you'd have to put in to bring your
 * running average back up to the target. It starts fresh each month.
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

  const firstDate =
    days.find((d) => monthOf(d.date) === currentMonth && d.hours > 0)?.date ??
    null

  if (!firstDate) {
    return {
      todayHours,
      todayRemainingHours,
      isTodayWorkday: todayIsWorkday,
      overallRemainingHours: 0,
      overallSince: null,
      overallWorkdayCount: 0,
    }
  }

  const span = datesBetween(firstDate, todayStr)
  const workdays = span.filter(isWorkday)
  // Off-day hours still count as credit, the same as before.
  const loggedHours = span.reduce(
    (sum, date) => sum + (hoursByDate.get(date) ?? 0),
    0,
  )

  return {
    todayHours,
    todayRemainingHours,
    isTodayWorkday: todayIsWorkday,
    overallRemainingHours: Math.max(
      0,
      workdays.length * targetHours - loggedHours,
    ),
    overallSince: firstDate,
    overallWorkdayCount: workdays.length,
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
