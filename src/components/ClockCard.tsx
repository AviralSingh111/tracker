import { useState } from 'react'
import { formatHours, nowTimeString, toTimeInput } from '../lib/format'
import type { TimeEntry } from '../types'

interface ClockCardProps {
  openEntry: TimeEntry | undefined
  todayHours: number
  busy: boolean
  onClockIn: (atTime: string) => void
  onClockOut: (atTime: string) => void
}

const inputClass =
  'w-full bg-neutral-800 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500'

const buttonClass =
  'w-full rounded-xl py-3 font-medium transition disabled:opacity-50 text-white'

/** Split into two panels so each mounts fresh, defaulting its time box to now. */
function ClockInPanel({
  busy,
  onClockIn,
}: {
  busy: boolean
  onClockIn: (atTime: string) => void
}) {
  const [clockInTime, setClockInTime] = useState(nowTimeString)

  return (
    <>
      <label className="w-full flex flex-col gap-1">
        <span className="text-neutral-400 text-xs">
          What time did you clock in?
        </span>
        <input
          type="time"
          value={clockInTime}
          onChange={(e) => setClockInTime(e.target.value)}
          className={inputClass}
        />
      </label>
      <button
        type="button"
        disabled={busy}
        onClick={() => onClockIn(clockInTime)}
        className={`${buttonClass} bg-emerald-600 hover:bg-emerald-500`}
      >
        Clock in
      </button>
    </>
  )
}

function ClockOutPanel({
  openEntry,
  busy,
  onClockOut,
}: {
  openEntry: TimeEntry
  busy: boolean
  onClockOut: (atTime: string) => void
}) {
  const [clockOutTime, setClockOutTime] = useState(nowTimeString)

  return (
    <>
      <label className="w-full flex flex-col gap-1">
        <span className="text-neutral-400 text-xs">
          What time did you clock out?
        </span>
        <input
          type="time"
          value={clockOutTime}
          onChange={(e) => setClockOutTime(e.target.value)}
          className={inputClass}
        />
      </label>
      <button
        type="button"
        disabled={busy}
        onClick={() => onClockOut(clockOutTime)}
        className={`${buttonClass} bg-red-600 hover:bg-red-500`}
      >
        Clock out
      </button>
      <p className="text-neutral-500 text-xs">
        Clocked in at {toTimeInput(openEntry.clockIn)}
      </p>
    </>
  )
}

export function ClockCard({
  openEntry,
  todayHours,
  busy,
  onClockIn,
  onClockOut,
}: ClockCardProps) {
  return (
    <div className="bg-neutral-900 rounded-2xl p-6 flex flex-col items-center gap-4">
      <div className="text-center">
        <p className="text-neutral-400 text-sm">Today</p>
        <p className="text-3xl font-semibold text-white">
          {formatHours(todayHours)}
        </p>
      </div>

      {openEntry ? (
        <ClockOutPanel
          openEntry={openEntry}
          busy={busy}
          onClockOut={onClockOut}
        />
      ) : (
        <ClockInPanel busy={busy} onClockIn={onClockIn} />
      )}
    </div>
  )
}
