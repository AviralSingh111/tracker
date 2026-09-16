import { useState } from 'react'
import { formatDateKey, formatHours } from '../lib/format'
import { offDayLabel } from '../lib/holidays'
import type { DaySummary, TimeEntry } from '../types'
import { EntryRow } from './EntryRow'

interface HistoryTableProps {
  days: DaySummary[]
  entries: TimeEntry[]
  now: number
}

export function HistoryTable({ days, entries, now }: HistoryTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const sorted = [...days].sort((a, b) => b.date.localeCompare(a.date))

  const entriesByDate = new Map<string, TimeEntry[]>()
  for (const entry of entries) {
    const list = entriesByDate.get(entry.date) ?? []
    list.push(entry)
    entriesByDate.set(entry.date, list)
  }

  return (
    <div className="bg-neutral-900 rounded-2xl p-6">
      <p className="text-neutral-400 text-sm mb-3">Recent history</p>
      {sorted.length === 0 ? (
        <p className="text-neutral-600 text-sm">No entries yet.</p>
      ) : (
        <ul className="flex flex-col">
          {sorted.map((day) => {
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
        Tap a day to edit its clock-in and clock-out times.
      </p>
    </div>
  )
}
