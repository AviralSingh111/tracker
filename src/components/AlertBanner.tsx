import type { WeekProgress } from '../lib/averageCalc'
import { formatHours } from '../lib/format'

export function AlertBanner({ progress }: { progress: WeekProgress }) {
  if (!progress.isTodayWorkday) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 text-neutral-400 rounded-2xl p-4 text-sm">
        {progress.todayOffReason ?? 'Day off'} — no target today.
      </div>
    )
  }

  if (progress.workdaysRemainingIncludingToday === 0) return null

  // Being behind is reported by the countdown card instead — it already shows
  // exactly how much extra there is to work.
  if (progress.isBehindTarget) return null

  return (
    <div className="bg-emerald-950 border border-emerald-800 text-emerald-300 rounded-2xl p-4 text-sm">
      You're on track for your {formatHours(progress.targetHours)}/day average
      this week.
    </div>
  )
}
