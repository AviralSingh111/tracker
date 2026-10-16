import { useState } from 'react'
import { todayKey } from '../lib/dates'
import { addManualEntry } from '../lib/entries'
import { useAuth } from '../contexts/AuthContext'
import { Card, SectionLabel } from './ui'

export function ManualEntryForm() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(todayKey())
  const [clockInTime, setClockInTime] = useState('09:00')
  const [clockOutTime, setClockOutTime] = useState('18:00')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setError(null)
    setBusy(true)
    try {
      await addManualEntry(user.uid, date, clockInTime, clockOutTime)
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const input =
    'bg-raised text-ink text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-live nums'

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-ink-3 hover:text-ink-2 text-sm py-2 transition"
      >
        + Add an entry for another day
      </button>
    )
  }

  return (
    <Card className="px-5 py-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <SectionLabel>Add an entry</SectionLabel>

        <input
          type="date"
          required
          value={date}
          max={todayKey()}
          onChange={(e) => setDate(e.target.value)}
          className={input}
        />

        <div className="flex gap-2 items-center">
          <input
            type="time"
            required
            value={clockInTime}
            onChange={(e) => setClockInTime(e.target.value)}
            className={`${input} flex-1 min-w-0`}
          />
          <span className="text-ink-3 text-xs">–</span>
          <input
            type="time"
            required
            value={clockOutTime}
            onChange={(e) => setClockOutTime(e.target.value)}
            className={`${input} flex-1 min-w-0`}
          />
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex-1 bg-raised text-ink-2 rounded-xl py-2.5 text-sm font-medium hover:text-ink transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="flex-1 bg-live text-canvas rounded-xl py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
          >
            Save
          </button>
        </div>
      </form>
    </Card>
  )
}
