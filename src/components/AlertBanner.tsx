import { todayKey } from '../lib/dates'
import { offDayLabel } from '../lib/holidays'

/**
 * A quiet note on weekends and holidays. There's deliberately no "on track" or
 * "behind" message — the countdown reports both, in hours rather than a claim.
 */
export function AlertBanner({ now }: { now: number }) {
  const offReason = offDayLabel(todayKey(new Date(now)))
  if (!offReason) return null

  return (
    <div className="bg-neutral-900 border border-neutral-800 text-neutral-400 rounded-2xl p-4 text-sm">
      {offReason} — no target today.
    </div>
  )
}
