import type { PeriodSummary } from '../lib/averageCalc'
import { formatHours } from '../lib/format'
import { Delta, MiniBar } from './ui'

interface PeriodRowProps {
  label: string
  period: PeriodSummary
  targetHours: number
  /** Present when the row drills into a shorter period. */
  onClick?: () => void
}

/**
 * One period — a week or a month — in two lines: what you averaged, and how
 * that sat against the target. Shared by the dashboard and the archive so a
 * month reads identically wherever it appears.
 */
export function PeriodRow({
  label,
  period,
  targetHours,
  onClick,
}: PeriodRowProps) {
  const empty = period.loggedDays === 0

  const body = (
    <>
      <div className="flex justify-between items-baseline gap-3">
        <span className="text-sm text-ink truncate">
          {label}
          {period.isCurrent && (
            <span className="text-ink-3 text-xs font-normal"> · so far</span>
          )}
        </span>
        <span className="text-sm font-semibold text-ink nums shrink-0">
          {empty ? '—' : formatHours(period.averagePerLoggedDay)}
          {!empty && (
            <span className="text-ink-3 font-normal text-xs">/day</span>
          )}
        </span>
      </div>

      <div className="flex justify-between items-center gap-3 mt-1.5">
        <span className="flex items-center gap-2 min-w-0">
          <MiniBar
            hours={period.averagePerLoggedDay}
            target={targetHours}
            className="w-16 shrink-0"
          />
          <span className="text-ink-3 text-xs truncate">
            {empty
              ? 'Nothing logged'
              : `${formatHours(period.totalHours)} · ${period.loggedDays} ${
                  period.loggedDays === 1 ? 'day' : 'days'
                }`}
          </span>
        </span>
        {!empty && <Delta hours={period.differenceFromTarget} />}
      </div>
    </>
  )

  if (!onClick) return <div className="py-3">{body}</div>

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left py-3 group"
    >
      {body}
    </button>
  )
}
