import type { WeekProgress } from '../lib/averageCalc'

export function AlertBanner({ progress }: { progress: WeekProgress }) {
  if (!progress.isTodayWorkday || progress.workdaysRemainingIncludingToday === 0) {
    return null
  }

  const required = progress.requiredDailyAverageGoingForward

  if (!progress.isBehindTarget) {
    return (
      <div className="bg-emerald-950 border border-emerald-800 text-emerald-300 rounded-2xl p-4 text-sm">
        You're on track for your {progress.targetHours}h/day average this week.
      </div>
    )
  }

  const extra = required - progress.targetHours

  return (
    <div className="bg-amber-950 border border-amber-800 text-amber-300 rounded-2xl p-4 text-sm">
      You're behind your {progress.targetHours}h/day average. Average{' '}
      <strong>{required.toFixed(1)}h/day</strong> ({extra.toFixed(1)}h more
      than your target) for the rest of the week to catch up.
    </div>
  )
}
