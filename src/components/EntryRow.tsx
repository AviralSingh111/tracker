import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { deleteEntry, updateEntryTimes } from '../lib/entries'
import { formatHours, nowTimeString, toTimeInput } from '../lib/format'
import type { TimeEntry } from '../types'

const MS_PER_HOUR = 1000 * 60 * 60

/** One session within a day, editable in place. */
export function EntryRow({ entry, now }: { entry: TimeEntry; now: number }) {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [clockInTime, setClockInTime] = useState(() => toTimeInput(entry.clockIn))
  const [clockOutTime, setClockOutTime] = useState(() =>
    entry.clockOut ? toTimeInput(entry.clockOut) : nowTimeString(),
  )
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const isOpen = entry.clockOut === null
  const hours = ((entry.clockOut ?? now) - entry.clockIn) / MS_PER_HOUR

  function startEditing() {
    setClockInTime(toTimeInput(entry.clockIn))
    setClockOutTime(entry.clockOut ? toTimeInput(entry.clockOut) : nowTimeString())
    setError(null)
    setEditing(true)
  }

  async function save() {
    if (!user) return
    setBusy(true)
    setError(null)
    try {
      await updateEntryTimes(user.uid, entry, clockInTime, clockOutTime)
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!user) return
    if (!window.confirm('Delete this entry?')) return
    setBusy(true)
    try {
      await deleteEntry(user.uid, entry.id)
    } finally {
      setBusy(false)
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-2 text-xs text-neutral-400 py-1">
        <span className="tabular-nums">
          {toTimeInput(entry.clockIn)} – {isOpen ? 'now' : toTimeInput(entry.clockOut!)}
          <span className="text-neutral-600"> · {formatHours(hours)}</span>
        </span>
        <span className="flex items-center gap-2">
          {entry.autoClosed && (
            <span
              className="text-amber-500/80 text-[11px]"
              title="You forgot to clock out — we credited your daily target. Edit to correct it."
            >
              auto
            </span>
          )}
          <button
            type="button"
            onClick={startEditing}
            className="text-indigo-400 hover:text-indigo-300 transition"
          >
            Edit
          </button>
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 py-2">
      <div className="flex items-center gap-2">
        <input
          type="time"
          value={clockInTime}
          onChange={(e) => setClockInTime(e.target.value)}
          className="flex-1 min-w-0 bg-neutral-800 text-white text-xs rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <span className="text-neutral-600 text-xs">–</span>
        <input
          type="time"
          value={clockOutTime}
          onChange={(e) => setClockOutTime(e.target.value)}
          className="flex-1 min-w-0 bg-neutral-800 text-white text-xs rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex gap-2 text-xs">
        <button
          type="button"
          disabled={busy}
          onClick={save}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg py-1.5 font-medium transition"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg py-1.5 font-medium transition"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={remove}
          className="px-3 bg-neutral-800 hover:bg-red-900 disabled:opacity-50 text-red-400 rounded-lg py-1.5 font-medium transition"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
