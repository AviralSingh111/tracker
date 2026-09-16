import { useState } from 'react'
import { addManualEntry, todayKey } from '../lib/entries'
import { useAuth } from '../contexts/AuthContext'

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

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-2xl p-4 text-sm font-medium transition"
      >
        + Add entry for a custom date
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-neutral-900 rounded-2xl p-6 flex flex-col gap-3"
    >
      <p className="text-neutral-400 text-sm">Add a custom entry</p>

      <input
        type="date"
        required
        value={date}
        max={todayKey()}
        onChange={(e) => setDate(e.target.value)}
        className="bg-neutral-800 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <div className="flex gap-2">
        <input
          type="time"
          required
          value={clockInTime}
          onChange={(e) => setClockInTime(e.target.value)}
          className="flex-1 bg-neutral-800 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="time"
          required
          value={clockOutTime}
          onChange={(e) => setClockOutTime(e.target.value)}
          className="flex-1 bg-neutral-800 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg py-2 font-medium transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg py-2 font-medium transition"
        >
          Save
        </button>
      </div>
    </form>
  )
}
