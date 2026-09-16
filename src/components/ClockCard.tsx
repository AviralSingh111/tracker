import type { TimeEntry } from '../types'

interface ClockCardProps {
  openEntry: TimeEntry | undefined
  todayHours: number
  busy: boolean
  onClockIn: () => void
  onClockOut: () => void
}

function formatHours(hours: number) {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

export function ClockCard({
  openEntry,
  todayHours,
  busy,
  onClockIn,
  onClockOut,
}: ClockCardProps) {
  const isClockedIn = Boolean(openEntry)

  return (
    <div className="bg-neutral-900 rounded-2xl p-6 flex flex-col items-center gap-4">
      <div className="text-center">
        <p className="text-neutral-400 text-sm">Today</p>
        <p className="text-3xl font-semibold text-white">
          {formatHours(todayHours)}
        </p>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={isClockedIn ? onClockOut : onClockIn}
        className={`w-full rounded-xl py-3 font-medium transition disabled:opacity-50 ${
          isClockedIn
            ? 'bg-red-600 hover:bg-red-500 text-white'
            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
        }`}
      >
        {isClockedIn ? 'Clock out' : 'Clock in'}
      </button>

      {isClockedIn && openEntry && (
        <p className="text-neutral-500 text-xs">
          Clocked in at{' '}
          {new Date(openEntry.clockIn).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      )}
    </div>
  )
}
