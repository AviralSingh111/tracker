import { formatDateKey } from '../lib/format'
import type { TimeEntry } from '../types'

/**
 * The commonest reason to open the archive is fixing a forgotten clock-out, so
 * it's raised here instead of waiting to be found.
 */
export function AutoClosedNudge({
  entry,
  onFix,
  onDismiss,
}: {
  entry: TimeEntry
  onFix: () => void
  onDismiss: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-short/25 bg-short/10 px-4 py-3">
      <p className="text-short/90 text-xs leading-relaxed flex-1">
        {formatDateKey(entry.date)} was auto-closed at your daily target — you
        forgot to clock out.
      </p>
      <button
        type="button"
        onClick={onFix}
        className="text-xs font-medium text-short shrink-0 hover:opacity-80 transition"
      >
        Fix
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-short/50 hover:text-short transition shrink-0"
      >
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
