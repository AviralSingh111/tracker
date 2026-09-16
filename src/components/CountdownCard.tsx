import type { RemainingWork } from '../lib/averageCalc'
import { formatCountdown, formatDateKey, formatHours } from '../lib/format'

interface CountdownCardProps {
  remaining: RemainingWork
  targetHours: number
  /** True while clocked in — the numbers are ticking down in real time. */
  live: boolean
}

export function CountdownCard({ remaining, targetHours, live }: CountdownCardProps) {
  const {
    todayRemainingHours,
    isTodayWorkday,
    overallRemainingHours,
    overallSince,
    overallWorkdayCount,
  } = remaining

  const todayDone = isTodayWorkday && todayRemainingHours === 0
  const allCaughtUp = overallRemainingHours === 0

  return (
    <div className="bg-neutral-900 rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <p className="text-neutral-400 text-sm">Time left</p>
        <p className="text-neutral-600 text-xs">
          {formatHours(targetHours)}/day target
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <p className="text-neutral-500 text-xs mb-1">Left today</p>
          {!isTodayWorkday ? (
            <p className="text-xl font-semibold text-neutral-500">No target today</p>
          ) : (
            <p
              className={`text-2xl font-semibold tabular-nums ${
                todayDone ? 'text-emerald-400' : 'text-white'
              }`}
            >
              {todayDone
                ? 'Done for today'
                : live
                  ? formatCountdown(todayRemainingHours)
                  : formatHours(todayRemainingHours)}
            </p>
          )}
        </div>

        <div className="border-t border-neutral-800 pt-3">
          <p className="text-neutral-500 text-xs mb-1">Left overall</p>
          <p
            className={`text-2xl font-semibold tabular-nums ${
              allCaughtUp ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {allCaughtUp
              ? 'Fully caught up'
              : live
                ? formatCountdown(overallRemainingHours)
                : formatHours(overallRemainingHours)}
          </p>
          {overallSince && (
            <p className="text-neutral-600 text-xs mt-1">
              To average {formatHours(targetHours)}/day across{' '}
              {overallWorkdayCount} working{' '}
              {overallWorkdayCount === 1 ? 'day' : 'days'} since{' '}
              {formatDateKey(overallSince)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
