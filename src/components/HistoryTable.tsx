import { useState } from 'react'
import type { PeriodSummary } from '../lib/averageCalc'
import { monthOf, startOfWeek, thisMonthKey } from '../lib/dates'
import {
  formatDateKey,
  formatHours,
  formatMonthKey,
  formatWeekRange,
} from '../lib/format'
import { offDayLabel } from '../lib/holidays'
import type { DaySummary, TimeEntry } from '../types'
import { EntryRow } from './EntryRow'

type View = 'days' | 'weeks' | 'months'

/** Which period the day list is narrowed to. */
interface Scope {
  type: 'week' | 'month'
  key: string
}

interface HistoryTableProps {
  days: DaySummary[]
  entries: TimeEntry[]
  now: number
  weeks: PeriodSummary[]
  months: PeriodSummary[]
}

function scopeLabel(scope: Scope) {
  return scope.type === 'month'
    ? formatMonthKey(scope.key)
    : formatWeekRange(scope.key)
}

export function HistoryTable({
  days,
  entries,
  now,
  weeks,
  months,
}: HistoryTableProps) {
  const [view, setView] = useState<View>('days')
  const [scope, setScope] = useState<Scope>({
    type: 'month',
    key: thisMonthKey(),
  })
  const [expanded, setExpanded] = useState<string | null>(null)

  const entriesByDate = new Map<string, TimeEntry[]>()
  for (const entry of entries) {
    const list = entriesByDate.get(entry.date) ?? []
    list.push(entry)
    entriesByDate.set(entry.date, list)
  }

  const inScope = (dateKey: string) =>
    scope.type === 'month'
      ? monthOf(dateKey) === scope.key
      : startOfWeek(dateKey) === scope.key

  const scopedDays = days
    .filter((d) => inScope(d.date))
    .sort((a, b) => b.date.localeCompare(a.date))

  /** Drill from a period row into that period's days. */
  function drillInto(type: Scope['type'], key: string) {
    setScope({ type, key })
    setView('days')
    setExpanded(null)
  }

  const periods = view === 'weeks' ? weeks : months

  return (
    <div className="bg-neutral-900 rounded-2xl p-6">
      <div className="flex justify-between items-center gap-2 mb-3">
        <p className="text-neutral-400 text-sm truncate">
          {view === 'days' ? scopeLabel(scope) : 'History'}
        </p>
        <select
          value={view}
          onChange={(e) => {
            setView(e.target.value as View)
            setExpanded(null)
          }}
          className="bg-neutral-800 text-neutral-300 text-xs rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 shrink-0"
        >
          <option value="days">Days</option>
          <option value="weeks">Weeks</option>
          <option value="months">Months</option>
        </select>
      </div>

      {view !== 'days' ? (
        <ul className="flex flex-col">
          {periods.map((p) => {
            const ahead = p.differenceFromTarget >= 0
            const label =
              view === 'weeks' ? formatWeekRange(p.key) : formatMonthKey(p.key)

            return (
              <li
                key={p.key}
                className="border-b border-neutral-800 last:border-0"
              >
                <button
                  type="button"
                  onClick={() =>
                    drillInto(view === 'weeks' ? 'week' : 'month', p.key)
                  }
                  className="w-full text-left py-2.5 hover:opacity-80 transition"
                >
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-sm text-neutral-200">
                      {label}
                      {p.isCurrent && (
                        <span className="text-neutral-500 text-xs"> · so far</span>
                      )}
                    </span>
                    <span className="text-sm font-semibold text-white tabular-nums">
                      {p.loggedDays === 0
                        ? '—'
                        : `${formatHours(p.averagePerLoggedDay)}`}
                      {p.loggedDays > 0 && (
                        <span className="text-neutral-500 font-normal">
                          /day
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline gap-2 mt-0.5">
                    <span className="text-neutral-500 text-xs">
                      {p.loggedDays === 0
                        ? 'Nothing logged'
                        : `${formatHours(p.totalHours)} over ${
                            p.loggedDays
                          } logged ${p.loggedDays === 1 ? 'day' : 'days'}`}
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
                </button>
              </li>
            )
          })}
        </ul>
      ) : scopedDays.length === 0 ? (
        <p className="text-neutral-600 text-sm">Nothing logged in this period.</p>
      ) : (
        <ul className="flex flex-col">
          {scopedDays.map((day) => {
            const offReason = offDayLabel(day.date)
            const isExpanded = expanded === day.date
            const dayEntries = [...(entriesByDate.get(day.date) ?? [])].sort(
              (a, b) => a.clockIn - b.clockIn,
            )

            return (
              <li
                key={day.date}
                className="border-b border-neutral-800 last:border-0 py-2"
              >
                <button
                  type="button"
                  onClick={() => setExpanded(isExpanded ? null : day.date)}
                  className="w-full flex justify-between items-center text-sm text-neutral-300 hover:text-white transition"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`text-neutral-600 text-xs transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    >
                      ▶
                    </span>
                    {formatDateKey(day.date)}
                    {offReason && (
                      <span className="text-[11px] text-neutral-500 bg-neutral-800 rounded px-1.5 py-0.5">
                        {offReason}
                      </span>
                    )}
                  </span>
                  <span className="font-medium">{formatHours(day.hours)}</span>
                </button>

                {isExpanded && (
                  <div className="pl-5 mt-1 flex flex-col divide-y divide-neutral-800/60">
                    {dayEntries.map((entry) => (
                      <EntryRow key={entry.id} entry={entry} now={now} />
                    ))}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <p className="text-neutral-600 text-xs mt-3">
        {view === 'days'
          ? 'Tap a day to edit its clock-in and clock-out times.'
          : `Tap a ${view === 'weeks' ? 'week' : 'month'} to see its days.`}
      </p>
    </div>
  )
}
