import type { DaySummary } from '../types'

export function HistoryTable({ days }: { days: DaySummary[] }) {
  const sorted = [...days].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="bg-neutral-900 rounded-2xl p-6">
      <p className="text-neutral-400 text-sm mb-3">Recent history</p>
      {sorted.length === 0 ? (
        <p className="text-neutral-600 text-sm">No entries yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((day) => (
            <li
              key={day.date}
              className="flex justify-between text-sm text-neutral-300 border-b border-neutral-800 pb-2 last:border-0"
            >
              <span>{day.date}</span>
              <span className="font-medium">{day.hours.toFixed(2)}h</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
