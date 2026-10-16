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
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const isOpen = entry.clockOut === null
  const hours = ((entry.clockOut ?? now) - entry.clockIn) / MS_PER_HOUR

  function startEditing() {
    setClockInTime(toTimeInput(entry.clockIn))
    setClockOutTime(entry.clockOut ? toTimeInput(entry.clockOut) : nowTimeString())
    setError(null)
    setConfirmDelete(false)
    setEditing(true)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
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
    setBusy(true)
    try {
      await deleteEntry(user.uid, entry.id)
    } finally {
      setBusy(false)
    }
  }

  const input =
    'flex-1 min-w-0 bg-raised text-ink text-xs rounded-lg px-2.5 py-2 outline-none focus:ring-2 focus:ring-live nums'

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-2 text-xs py-1.5">
        <span className="text-ink-2 nums">
          {toTimeInput(entry.clockIn)} –{' '}
          {isOpen ? 'now' : toTimeInput(entry.clockOut!)}
          <span className="text-ink-3"> · {formatHours(hours)}</span>
        </span>
        <span className="flex items-center gap-2.5">
          {entry.autoClosed && (
            <span
              className="text-short/80 text-[10px] border border-short/30 rounded px-1.5 py-0.5"
              title="You forgot to clock out — your daily target was credited. Edit to correct it."
            >
              auto
            </span>
          )}
          <button
            type="button"
            onClick={startEditing}
            className="text-live hover:opacity-80 transition"
          >
            Edit
          </button>
        </span>
      </div>
    )
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-2 py-2">
      <div className="flex items-center gap-2">
        <input
          type="time"
          value={clockInTime}
          onChange={(e) => setClockInTime(e.target.value)}
          className={input}
        />
        <span className="text-ink-3 text-xs">–</span>
        <input
          type="time"
          value={clockOutTime}
          onChange={(e) => setClockOutTime(e.target.value)}
          className={input}
        />
      </div>

      {error && <p className="text-danger text-xs">{error}</p>}

      <div className="flex gap-2 text-xs">
        <button
          type="submit"
          disabled={busy}
          className="flex-1 bg-live text-canvas rounded-lg py-2 font-medium transition hover:opacity-90 disabled:opacity-50"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="flex-1 bg-raised text-ink-2 rounded-lg py-2 font-medium hover:text-ink transition"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => (confirmDelete ? remove() : setConfirmDelete(true))}
          onBlur={() => setConfirmDelete(false)}
          className={`px-3 rounded-lg py-2 font-medium transition disabled:opacity-50 ${
            confirmDelete
              ? 'bg-danger text-canvas'
              : 'bg-raised text-danger hover:bg-danger/15'
          }`}
        >
          {confirmDelete ? 'Sure?' : 'Delete'}
        </button>
      </div>
    </form>
  )
}
