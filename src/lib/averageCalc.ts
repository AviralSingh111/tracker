import type { DaySummary, TimeEntry } from '../types'
import { parseDateKey, todayKey } from './dates'
import { isWorkday, offDayLabel } from './holidays'

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

function startOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay() // 0 = Sun
  const diffToMonday = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diffToMonday)
  d.setHours(0, 0, 0, 0)
  return d
}

export interface WeekProgress {
  targetHours: number
  /** Mon-Fri this week, minus national/office holidays. */
  weekWorkdayDates: string[]
  loggedSoFarHours: number
  workdaysRemainingIncludingToday: number
  requiredDailyAverageGoingForward: number
  isBehindTarget: boolean
  isTodayWorkday: boolean
  /** "Weekend", "Republic Day", … when today isn't a workday. */
  todayOffReason: string | null
}

/** How much you need to average per remaining workday this week to hit your target. */
export function calculateWeekProgress(
  entries: TimeEntry[],
  targetHours: number,
  now = Date.now(),
): WeekProgress {
  const today = new Date(now)
  const monday = startOfWeek(today)

  const weekDates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    weekDates.push(todayKey(d))
  }
  const weekWorkdayDates = weekDates.filter(isWorkday)

  const todayStr = todayKey(today)
  const isTodayWorkday = weekWorkdayDates.includes(todayStr)

  const daySummaries = summarizeDays(entries, now, targetHours)
  const hoursByDate = new Map(daySummaries.map((d) => [d.date, d.hours]))

  // Credit every hour logged this week, including any worked on an off day.
  const loggedSoFarHours = weekDates
    .filter((date) => date <= todayStr)
    .reduce((sum, date) => sum + (hoursByDate.get(date) ?? 0), 0)

  const workdaysStrictlyAfterToday = weekWorkdayDates.filter(
    (date) => date > todayStr,
  ).length
  const workdaysRemainingIncludingToday =
    workdaysStrictlyAfterToday + (isTodayWorkday ? 1 : 0)

  const targetWeekTotal = targetHours * weekWorkdayDates.length
  const stillNeeded = targetWeekTotal - loggedSoFarHours

  const requiredDailyAverageGoingForward =
    workdaysRemainingIncludingToday > 0
      ? Math.max(0, stillNeeded / workdaysRemainingIncludingToday)
      : 0

  return {
    targetHours,
    weekWorkdayDates,
    loggedSoFarHours,
    workdaysRemainingIncludingToday,
    requiredDailyAverageGoingForward,
    isBehindTarget: requiredDailyAverageGoingForward > targetHours + 0.01,
    isTodayWorkday,
    todayOffReason: offDayLabel(todayStr),
  }
}

/** Every date key from `from` to `to` inclusive. */
function datesBetween(from: string, to: string): string[] {
  const dates: string[] = []
  const cursor = parseDateKey(from)
  const end = parseDateKey(to)
  while (cursor <= end) {
    dates.push(todayKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

export interface RemainingWork {
  todayHours: number
  /** Hours still owed today to hit the daily target. 0 on an off day. */
  todayRemainingHours: number
  isTodayWorkday: boolean
  /** Total shortfall across every tracked workday, today included. */
  overallRemainingHours: number
  /** First day with a logged entry — where the overall figure starts counting. */
  overallSince: string | null
  overallWorkdayCount: number
}

/**
 * Time still owed: for today, and cumulatively across the tracked history.
 *
 * The overall figure is `target × workdays since your first entry` minus
 * everything logged in that span, so it's what you'd have to put in to bring
 * your running average back up to the target.
 */
export function calculateRemaining(
  entries: TimeEntry[],
  targetHours: number,
  now = Date.now(),
): RemainingWork {
  const todayStr = todayKey(new Date(now))
  const days = summarizeDays(entries, now, targetHours)
  const hoursByDate = new Map(days.map((d) => [d.date, d.hours]))

  const todayHours = hoursByDate.get(todayStr) ?? 0
  const todayIsWorkday = isWorkday(todayStr)
  const todayRemainingHours = todayIsWorkday
    ? Math.max(0, targetHours - todayHours)
    : 0

  const firstDate = days[0]?.date ?? null
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
  // Off-day hours still count as credit, the same as in the weekly view.
  const loggedHours = span.reduce(
    (sum, date) => sum + (hoursByDate.get(date) ?? 0),
    0,
  )
  const expectedHours = workdays.length * targetHours

  return {
    todayHours,
    todayRemainingHours,
    isTodayWorkday: todayIsWorkday,
    overallRemainingHours: Math.max(0, expectedHours - loggedHours),
    overallSince: firstDate,
    overallWorkdayCount: workdays.length,
  }
}
