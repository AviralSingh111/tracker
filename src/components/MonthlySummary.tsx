import type { MonthSummary } from '../lib/averageCalc'
import { formatHours, formatMonthKey } from '../lib/format'

interface MonthlySummaryProps {
  months: MonthSummary[]
  selectedMonth: string
  onSelect: (month: string) => void
  targetHours: number
}

export function MonthlySummary({
  months,
  selectedMonth,
  onSelect,
  targetHours,
}: MonthlySummaryProps) {
  return (
    <div className="bg-neutral-900 rounded-2xl p-6">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-neutral-400 text-sm">Monthly average</p>
        <p className="text-neutral-600 text-xs">
          {formatHours(targetHours)}/day target
        </p>
      </div>

      <ul className="flex flex-col">
        {months.map((m) => {
          const isSelected = m.month === selectedMonth
          const ahead = m.differenceFromTarget >= 0

          return (
            <li key={m.month}>
              <button
                type="button"
                onClick={() => onSelect(m.month)}
                className={`w-full text-left rounded-lg px-3 py-2.5 transition ${
                  isSelected ? 'bg-neutral-800' : 'hover:bg-neutral-800/50'
                }`}
              >
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-sm text-neutral-200">
                    {formatMonthKey(m.month)}
                    {m.isCurrentMonth && (
                      <span className="text-neutral-500 text-xs"> · so far</span>
                    )}
                  </span>
                  <span className="text-sm font-semibold text-white tabular-nums">
                    {m.loggedDays === 0 ? '—' : formatHours(m.averagePerLoggedDay)}
                    {m.loggedDays > 0 && (
                      <span className="text-neutral-500 font-normal">/day</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-baseline gap-2 mt-0.5">
                  <span className="text-neutral-500 text-xs">
                    {m.loggedDays === 0
                      ? 'Nothing logged'
                      : `${formatHours(m.totalHours)} over ${m.loggedDays} logged ${
                          m.loggedDays === 1 ? 'day' : 'days'
                        }`}
                  </span>
                  {m.loggedDays > 0 && (
                    <span
                      className={`text-xs tabular-nums ${
                        ahead ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {ahead ? '+' : '−'}
                      {formatHours(Math.abs(m.differenceFromTarget))}
                    </span>
                  )}
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
