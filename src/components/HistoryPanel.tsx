import { useState } from 'react'
import type { PeriodSummary } from '../lib/averageCalc'
import {
  daysOfWeek,
  monthOf,
  startOfWeek,
  todayKey,
  weekOverlapsMonth,
} from '../lib/dates'
import {
  formatDateKey,
  formatHours,
  formatMonthKey,
  formatWeekRange,
} from '../lib/format'
import { offDayLabel } from '../lib/holidays'
import type { DaySummary, TimeEntry } from '../types'
import { EntryRow } from './EntryRow'
import { Card, MiniBar, SectionLabel } from './ui'
import { PeriodRow } from './PeriodRow'

const COLLAPSED_MONTHS = 6

interface HistoryPanelProps {
  days: DaySummary[]
  entries: TimeEntry[]
  now: number
  weeks: PeriodSummary[]
  months: PeriodSummary[]
  targetHours: number
  /** A day to open straight to — set when a nudge sends you here to fix it. */
  focusDate: string | null
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

/**
 * The archive, as one drill path: months → weeks → days → sessions. The old
 * Days/Weeks/Months dropdown offered the three as peers while the data nests,
 * and a drill left you with no way back up.
 */
export function HistoryPanel({
  days,
  entries,
  now,
  weeks,
  months,
  targetHours,
  focusDate,
}: HistoryPanelProps) {
  // A nudge hands us a day to correct, and remounts this panel with it (see
  // the key in Dashboard) — so the path down to that day is simply the
  // starting state rather than an effect that re-navigates after render.
  const [month, setMonth] = useState<string | null>(
    focusDate ? monthOf(focusDate) : null,
  )
  const [week, setWeek] = useState<string | null>(
    focusDate ? startOfWeek(focusDate) : null,
  )
  const [expanded, setExpanded] = useState<string | null>(focusDate)
  const [showAllMonths, setShowAllMonths] = useState(false)

  const today = todayKey(new Date(now))
  const entriesByDate = new Map<string, TimeEntry[]>()
  for (const entry of entries) {
    const list = entriesByDate.get(entry.date) ?? []
    list.push(entry)
    entriesByDate.set(entry.date, list)
  }
  const hoursByDate = new Map(days.map((d) => [d.date, d.hours]))

  const crumbs: { label: string; onClick: () => void }[] = []
  if (month) {
    crumbs.push({
      label: 'History',
      onClick: () => {
        setMonth(null)
        setWeek(null)
        setExpanded(null)
      },
    })
  }
  if (week && month) {
    crumbs.push({
      label: formatMonthKey(month),
      onClick: () => {
        setWeek(null)
        setExpanded(null)
      },
    })
  }

  const heading = week
    ? formatWeekRange(week)
    : month
      ? formatMonthKey(month)
      : 'History'

  const visibleMonths = showAllMonths
    ? months
    : months.slice(0, COLLAPSED_MONTHS)

  return (
    <Card className="px-5 py-4">
      <div className="mb-1 min-h-[1rem]">
        {crumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-[11px] text-ink-3">
            {crumbs.map((c) => (
              <span key={c.label} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={c.onClick}
                  className="hover:text-ink-2 transition"
                >
                  {c.label}
                </button>
                <span className="text-line">/</span>
              </span>
            ))}
          </nav>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2 mb-1">
        <SectionLabel>{heading}</SectionLabel>
        {!month && (
          <span className="text-[11px] text-ink-3">tap to open</span>
        )}
      </div>

      {/* Months */}
      {!month && (
        <>
          <ul className="divide-y divide-line">
            {visibleMonths.map((m) => (
              <li key={m.key}>
                <PeriodRow
                  label={formatMonthKey(m.key)}
                  period={m}
                  targetHours={targetHours}
                  onClick={() => {
                    setMonth(m.key)
                    setExpanded(null)
                  }}
                />
              </li>
            ))}
          </ul>
          {months.length > COLLAPSED_MONTHS && (
            <button
              type="button"
              onClick={() => setShowAllMonths(!showAllMonths)}
              className="text-xs text-live hover:opacity-80 transition mt-3"
            >
              {showAllMonths
                ? 'Show less'
                : `Show all ${months.length} months`}
            </button>
          )}
        </>
      )}

      {/* Weeks of a month */}
      {month && !week && (
        <ul className="divide-y divide-line">
          {weeks
            .filter((w) => weekOverlapsMonth(w.key, month))
            .map((w) => (
              <li key={w.key}>
                <PeriodRow
                  label={formatWeekRange(w.key)}
                  period={w}
                  targetHours={targetHours}
                  onClick={() => {
                    setWeek(w.key)
                    setExpanded(null)
                  }}
                />
              </li>
            ))}
        </ul>
      )}

      {/* Days of a week */}
      {week && (
        <ul className="divide-y divide-line">
          {daysOfWeek(week)
            .filter((date) => date <= today)
            .map((date) => {
              const hours = hoursByDate.get(date) ?? 0
              const offReason = offDayLabel(date)
              const isExpanded = expanded === date
              const dayEntries = [...(entriesByDate.get(date) ?? [])].sort(
                (a, b) => a.clockIn - b.clockIn,
              )

              return (
                <li key={date} className="py-1">
                  <button
                    type="button"
                    disabled={dayEntries.length === 0}
                    onClick={() => setExpanded(isExpanded ? null : date)}
                    className="w-full flex items-center justify-between gap-3 py-2 text-left disabled:cursor-default"
                  >
                    <span className="flex items-center gap-2 min-w-0 text-ink-3">
                      {dayEntries.length > 0 ? (
                        <Chevron open={isExpanded} />
                      ) : (
                        <span className="w-3 shrink-0" />
                      )}
                      <span
                        className={`text-sm truncate ${
                          hours > 0 ? 'text-ink' : 'text-ink-3'
                        }`}
                      >
                        {formatDateKey(date)}
                      </span>
                      {offReason && (
                        <span className="text-[10px] text-ink-3 bg-raised rounded px-1.5 py-0.5 shrink-0">
                          {offReason}
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      {hours > 0 && !offReason && (
                        <MiniBar
                          hours={hours}
                          target={targetHours}
                          className="w-10"
                        />
                      )}
                      <span
                        className={`text-sm nums ${
                          hours > 0 ? 'text-ink font-medium' : 'text-ink-3'
                        }`}
                      >
                        {hours > 0 ? formatHours(hours) : '—'}
                      </span>
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="pl-5 pb-1 flex flex-col divide-y divide-line/60">
                      {dayEntries.map((entry) => (
                        <EntryRow key={entry.id} entry={entry} now={now} />
                      ))}
                    </div>
                  )}
                </li>
              )
            })}
        </ul>
      )}

      {week && (
        <p className="text-ink-3 text-[11px] mt-3">
          Tap a day to edit its sessions.
        </p>
      )}
    </Card>
  )
}
