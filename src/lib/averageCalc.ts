import type { DaySummary, TimeEntry } from '../types'
import {
  monthOf,
  startOfWeek,
  thisMonthKey,
  thisWeekKey,
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

export interface ScopeShortfall {
  /** Hours still owed across the days actually clocked in. */
  remainingHours: number
  /** Working days with time logged — the ones the target is charged against. */
  loggedWorkdays: number
  /** First day logged in the scope, or null if nothing is logged yet. */
  since: string | null
}

export interface RemainingWork {
  todayHours: number
  /** Hours still owed today to hit the daily target. 0 on an off day. */
  todayRemainingHours: number
  isTodayWorkday: boolean
  week: ScopeShortfall
  month: ScopeShortfall
}

/**
 * Shortfall over a set of days: `target × logged workdays` minus everything
 * logged. Days with no entry never enter it — they're leave, not debt.
 */
function shortfall(
  days: DaySummary[],
  targetHours: number,
  inScope: (dateKey: string) => boolean,
): ScopeShortfall {
  const logged = days.filter((d) => d.hours > 0 && inScope(d.date))
  // Weekend and holiday hours are credited but carry no target of their own.
  const loggedWorkdays = logged.filter((d) => isWorkday(d.date)).length
  const totalHours = logged.reduce((sum, d) => sum + d.hours, 0)

  return {
    remainingHours: Math.max(0, loggedWorkdays * targetHours - totalHours),
    loggedWorkdays,
    since: logged[0]?.date ?? null,
  }
}

/**
 * Time still owed today, this week, and this month.
 *
 * Only days you actually clocked in count towards the target. A workday with
 * no entry is treated as leave, not as 8 hours owed — otherwise time off
 * builds a debt you can never pay down. Each scope starts fresh: the week on
 * Monday, the month on the 1st.
 */
export function calculateRemaining(
  entries: TimeEntry[],
  targetHours: number,
  now = Date.now(),
): RemainingWork {
  const todayStr = todayKey(new Date(now))
  const currentWeek = thisWeekKey(new Date(now))
  const currentMonth = thisMonthKey(new Date(now))
  const days = summarizeDays(entries, now, targetHours).filter(
    (d) => d.date <= todayStr,
  )

  const todayHours = days.find((d) => d.date === todayStr)?.hours ?? 0
  const todayIsWorkday = isWorkday(todayStr)

  return {
    todayHours,
    todayRemainingHours: todayIsWorkday
      ? Math.max(0, targetHours - todayHours)
      : 0,
    isTodayWorkday: todayIsWorkday,
    week: shortfall(days, targetHours, (d) => startOfWeek(d) === currentWeek),
    month: shortfall(days, targetHours, (d) => monthOf(d) === currentMonth),
  }
}

export interface PeriodSummary {
  /** "YYYY-MM" for a month, or the week's Monday date key. */
  key: string
  totalHours: number
  /** Days with any time logged — the divisor for the average. */
  loggedDays: number
  averagePerLoggedDay: number
  /** Hours above (positive) or below (negative) target for the period. */
  differenceFromTarget: number
  /** True for the period in progress, whose figures include today. */
  isCurrent: boolean
}

/**
 * Groups logged days into periods, newest first.
 *
 * The average divides by the days actually logged, not by every workday on the
 * calendar — a period with five entries reads as the average of those five
 * days. The current period includes today, open session and all, so early in
 * the day it reads low.
 */
function summarizePeriods(
  days: DaySummary[],
  targetHours: number,
  keyOf: (dateKey: string) => string,
  currentKey: string,
): PeriodSummary[] {
  const logged = days.filter((d) => d.hours > 0)
  const keys = new Set(logged.map((d) => keyOf(d.date)))
  keys.add(currentKey)

  return [...keys]
    .sort((a, b) => b.localeCompare(a))
    .map((key) => {
      const periodDays = logged.filter((d) => keyOf(d.date) === key)
      const totalHours = periodDays.reduce((sum, d) => sum + d.hours, 0)
      const loggedDays = periodDays.length
      const loggedWorkdays = periodDays.filter((d) => isWorkday(d.date)).length

      return {
        key,
        totalHours,
        loggedDays,
        averagePerLoggedDay: loggedDays > 0 ? totalHours / loggedDays : 0,
        differenceFromTarget: totalHours - loggedWorkdays * targetHours,
        isCurrent: key === currentKey,
      }
    })
}

export function summarizeWeeks(
  entries: TimeEntry[],
  targetHours: number,
  now = Date.now(),
): PeriodSummary[] {
  const todayStr = todayKey(new Date(now))
  const days = summarizeDays(entries, now, targetHours).filter(
    (d) => d.date <= todayStr,
  )
  return summarizePeriods(days, targetHours, startOfWeek, thisWeekKey(new Date(now)))
}

export function summarizeMonths(
  entries: TimeEntry[],
  targetHours: number,
  now = Date.now(),
): PeriodSummary[] {
  const todayStr = todayKey(new Date(now))
  const days = summarizeDays(entries, now, targetHours).filter(
    (d) => d.date <= todayStr,
  )
  return summarizePeriods(days, targetHours, monthOf, thisMonthKey(new Date(now)))
}
