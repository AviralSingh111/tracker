import { useState } from 'react'
import { formatHours, nowTimeString } from '../lib/format'
import type { TimeEntry } from '../types'

const MS_PER_HOUR = 1000 * 60 * 60

interface ActionBarProps {
  openEntry: TimeEntry | undefined
  now: number
  busy: boolean
  error: string | null
  onClockIn: (atTime: string) => void
  onClockOut: (atTime: string) => void
}

/**
 * The only control used daily, parked within thumb reach and always visible.
 * One tap stamps the current time; the time box is there for the rarer case of
 * logging after the fact, rather than standing between you and the button.
 */
export function ActionBar({
  openEntry,
  now,
  busy,
  error,
  onClockIn,
  onClockOut,
}: ActionBarProps) {
  const [customOpen, setCustomOpen] = useState(false)
  const [time, setTime] = useState(nowTimeString)

  const sessionHours = openEntry ? (now - openEntry.clockIn) / MS_PER_HOUR : 0

  function fire(atTime: string) {
    if (openEntry) onClockOut(atTime)
    else onClockIn(atTime)
    setCustomOpen(false)
  }

  function toggleCustom() {
    setTime(nowTimeString())
    setCustomOpen(!customOpen)
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-canvas/85 backdrop-blur-md">
      <div className="max-w-md mx-auto px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {error && <p className="text-danger text-xs mb-2">{error}</p>}

        {customOpen && (
          <div className="flex gap-2 mb-2">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="flex-1 min-w-0 bg-raised text-ink text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-live nums"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => fire(time)}
              className="px-4 rounded-xl bg-raised text-ink text-sm font-medium hover:bg-line transition disabled:opacity-50"
            >
              Confirm
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => fire(nowTimeString())}
            className={`flex-1 rounded-xl py-3.5 font-medium text-sm transition disabled:opacity-50 ${
              openEntry
                ? 'bg-raised text-ink hover:bg-line'
                : 'bg-ok text-canvas hover:opacity-90'
            }`}
          >
            {openEntry ? (
              <>
                Clock out
                <span className="text-ink-3 font-normal nums">
                  {' · '}
                  {formatHours(sessionHours)}
                </span>
              </>
            ) : (
              'Clock in'
            )}
          </button>

          <button
            type="button"
            onClick={toggleCustom}
            aria-label="Use a different time"
            aria-expanded={customOpen}
            className={`px-4 rounded-xl border border-line transition ${
              customOpen ? 'bg-raised text-ink' : 'text-ink-3 hover:text-ink-2'
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
