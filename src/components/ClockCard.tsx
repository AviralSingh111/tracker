import { useState } from 'react'
import type { TimeEntry } from '../types'

interface ClockCardProps {
  openEntry: TimeEntry | undefined
  todayHours: number
  busy: boolean
  onClockIn: (atTime: string) => void
  onClockOut: () => void
}

function formatHours(hours: number) {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

function nowTimeString() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function ClockCard({
  openEntry,
  todayHours,
  busy,
  onClockIn,
  onClockOut,
}: ClockCardProps) {
  const isClockedIn = Boolean(openEntry)
  const [clockInTime, setClockInTime] = useState(nowTimeString)

  return (
    <div className="bg-neutral-900 rounded-2xl p-6 flex flex-col items-center gap-4">
      <div className="text-center">
        <p className="text-neutral-400 text-sm">Today</p>
        <p className="text-3xl font-semibold text-white">
          {formatHours(todayHours)}
        </p>
      </div>

      {!isClockedIn && (
        <label className="w-full flex flex-col gap-1">
          <span className="text-neutral-400 text-xs">
            What time did you clock in?
          </span>
          <input
            type="time"
            value={clockInTime}
            onChange={(e) => setClockInTime(e.target.value)}
            className="w-full bg-neutral-800 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>
      )}

      <button
        type="button"
        disabled={busy}
        onClick={() => (isClockedIn ? onClockOut() : onClockIn(clockInTime))}
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
