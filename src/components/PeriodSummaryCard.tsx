import type { PeriodSummary } from '../lib/averageCalc'
import { formatHours } from '../lib/format'

interface PeriodSummaryCardProps {
  title: string
  periods: PeriodSummary[]
  /** Renders a period key as its label, e.g. "September 2026". */
  formatKey: (key: string) => string
  targetHours: number
}

export function PeriodSummaryCard({
  title,
  periods,
  formatKey,
  targetHours,
}: PeriodSummaryCardProps) {
  return (
    <div className="bg-neutral-900 rounded-2xl p-6">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <p className="text-neutral-400 text-sm">{title}</p>
        <p className="text-neutral-600 text-xs shrink-0">
          {formatHours(targetHours)}/day target
        </p>
      </div>
      <p className="text-neutral-600 text-xs mb-3">
        Including today's clock-in time
      </p>

      <ul className="flex flex-col gap-1">
        {periods.map((p) => {
          const ahead = p.differenceFromTarget >= 0

          return (
            <li key={p.key} className="px-1 py-1.5">
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-sm text-neutral-200">
                  {formatKey(p.key)}
                  {p.isCurrent && (
                    <span className="text-neutral-500 text-xs"> · so far</span>
                  )}
                </span>
                <span className="text-sm font-semibold text-white tabular-nums">
                  {p.loggedDays === 0 ? '—' : formatHours(p.averagePerLoggedDay)}
                  {p.loggedDays > 0 && (
                    <span className="text-neutral-500 font-normal">/day</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-baseline gap-2 mt-0.5">
                <span className="text-neutral-500 text-xs">
                  {p.loggedDays === 0
                    ? 'Nothing logged'
                    : `${formatHours(p.totalHours)} over ${p.loggedDays} logged ${
                        p.loggedDays === 1 ? 'day' : 'days'
                      }`}
                </span>
                {p.loggedDays > 0 && (
                  <span
                    className={`text-xs tabular-nums ${
                      ahead ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {ahead ? '+' : '−'}
                    {formatHours(Math.abs(p.differenceFromTarget))}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
