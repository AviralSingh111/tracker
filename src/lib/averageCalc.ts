import type { DaySummary, TimeEntry } from '../types'
import { todayKey } from './entries'

const MS_PER_HOUR = 1000 * 60 * 60
const WORKDAYS = new Set([1, 2, 3, 4, 5]) // Mon-Fri
const WORKDAYS_PER_WEEK = WORKDAYS.size

/** Sums each entry's duration into per-day totals. Open entries count up to `now`. */
export function summarizeDays(entries: TimeEntry[], now = Date.now()): DaySummary[] {
  const totals = new Map<string, number>()
  for (const entry of entries) {
    const end = entry.clockOut ?? now
    const hours = Math.max(0, end - entry.clockIn) / MS_PER_HOUR
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
  weekWorkdayDates: string[]
  loggedSoFarHours: number
  workdaysRemainingIncludingToday: number
  requiredDailyAverageGoingForward: number
  isBehindTarget: boolean
  isTodayWorkday: boolean
}

/** How much you need to average per remaining workday this week to hit your target. */
export function calculateWeekProgress(
  entries: TimeEntry[],
  targetHours: number,
  now = Date.now(),
): WeekProgress {
  const today = new Date(now)
  const monday = startOfWeek(today)

  const weekWorkdayDates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    if (WORKDAYS.has(d.getDay())) weekWorkdayDates.push(todayKey(d))
  }

  const todayStr = todayKey(today)
  const isTodayWorkday = WORKDAYS.has(today.getDay())

  const daySummaries = summarizeDays(entries, now)
  const hoursByDate = new Map(daySummaries.map((d) => [d.date, d.hours]))

  const loggedSoFarHours = weekWorkdayDates
    .filter((date) => date <= todayStr)
    .reduce((sum, date) => sum + (hoursByDate.get(date) ?? 0), 0)

  const workdaysStrictlyAfterToday = weekWorkdayDates.filter(
    (date) => date > todayStr,
  ).length
  const workdaysRemainingIncludingToday =
    workdaysStrictlyAfterToday + (isTodayWorkday ? 1 : 0)

  const targetWeekTotal = targetHours * WORKDAYS_PER_WEEK
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
  }
}
