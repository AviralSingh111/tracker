import { useState } from 'react'
import { daysOfWeek, thisWeekKey, todayKey } from '../lib/dates'
import { formatDateKey, formatHours } from '../lib/format'
import { isWorkday, offDayLabel } from '../lib/holidays'
import type { DaySummary } from '../types'
import { Delta } from './ui'

/**
 * What each bar colour means. Defined beside the logic that assigns them so
 * the two can't drift apart, and rendered by whoever hosts the strip.
 */
const LEGEND = [
  { swatch: 'bg-ok', label: 'Met the daily target' },
  { swatch: 'bg-short', label: 'Short of the target' },
  { swatch: 'bg-live', label: 'Today — still running, no verdict yet' },
  { swatch: 'bg-live/40', label: 'Weekend or holiday — no target applied' },
  { swatch: 'bg-raised', label: 'Nothing logged' },
]

export function WeekStripLegend() {
  return (
    <ul className="flex flex-col gap-2 rounded-xl bg-raised/50 border border-line px-3 py-2.5 mt-3">
      {LEGEND.map((item) => (
        <li key={item.label} className="flex items-center gap-2.5">
          <span
            className={`w-2.5 h-2.5 rounded-sm shrink-0 ${item.swatch}`}
            aria-hidden="true"
          />
          <span className="text-[11px] text-ink-2 leading-snug">
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  )
}

const BAR_AREA = 68
const LABEL_H = 18
const DAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

/**
 * The week as seven bars against the target line. Height is read before any
 * figure is: the shape of the week lands in a glance, and the days you never
 * logged show up as gaps rather than needing a sentence to explain that they
 * don't count.
 *
 * Tapping a bar names it — a hover title would leave every touch device
 * unable to read its own chart.
 */
export function WeekStrip({
  days,
  targetHours,
  now,
}: {
  days: DaySummary[]
  targetHours: number
  now: number
}) {
  const today = todayKey(new Date(now))
  const [selected, setSelected] = useState<string | null>(null)

  const hoursByDate = new Map(days.map((d) => [d.date, d.hours]))
  const week = daysOfWeek(thisWeekKey(new Date(now)))

  const peak = Math.max(targetHours, ...week.map((d) => hoursByDate.get(d) ?? 0))
  const px = (hours: number) => Math.round((hours / peak) * BAR_AREA)

  // With nothing picked the caption still has something to say, so the strip
  // never reserves empty space.
  const detailDate = selected ?? today
  const detailHours = hoursByDate.get(detailDate) ?? 0
  const detailOff = offDayLabel(detailDate)

  return (
    <div>
      <div className="relative" style={{ height: BAR_AREA }}>
        {/* The target, drawn once across all seven days. */}
        <div
          className="absolute inset-x-0 border-t border-dashed border-line"
          style={{ bottom: px(targetHours) }}
        >
          <span className="absolute -top-2 right-0 text-[10px] text-ink-3 bg-surface pl-1 nums">
            {formatHours(targetHours)}
          </span>
        </div>

        <div className="absolute inset-0 flex items-end gap-1.5">
          {week.map((date) => {
            const hours = hoursByDate.get(date) ?? 0
            const isToday = date === today
            const future = date > today
            const isSelected = selected === date
            const barH = Math.max(hours > 0 ? 3 : 2, px(hours))

            const color = isToday
              ? 'bg-live'
              : hours === 0
                ? 'bg-raised'
                : !isWorkday(date)
                  ? 'bg-live/40'
                  : hours >= targetHours
                    ? 'bg-ok'
                    : 'bg-short'

            return (
              <button
                key={date}
                type="button"
                aria-pressed={isSelected}
                aria-label={`${formatDateKey(date)} — ${
                  hours > 0 ? formatHours(hours) : 'nothing logged'
                }`}
                onClick={() => setSelected(isSelected ? null : date)}
                className="relative flex-1 flex items-end group"
                style={{ height: BAR_AREA }}
              >
                {isSelected && hours > 0 && (
                  <span
                    className="absolute inset-x-0 text-[10px] text-ink font-medium nums text-center pointer-events-none"
                    style={{
                      // Sits above the bar, or tucks inside when the bar is
                      // tall enough to push the label off the top.
                      bottom:
                        barH + LABEL_H <= BAR_AREA ? barH + 2 : barH - LABEL_H,
                    }}
                  >
                    {formatHours(hours)}
                  </span>
                )}
                <span
                  className={`w-full rounded-sm transition-opacity ${color} ${
                    future ? 'opacity-30' : ''
                  } ${
                    isSelected
                      ? 'ring-2 ring-ink/70 ring-offset-2 ring-offset-surface'
                      : 'group-hover:opacity-80'
                  }`}
                  style={{ height: barH }}
                />
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex gap-1.5 mt-2">
        {week.map((date, i) => (
          <span
            key={date}
            className={`flex-1 text-center text-[11px] ${
              date === detailDate ? 'text-ink font-medium' : 'text-ink-3'
            }`}
          >
            {DAY_INITIALS[i]}
          </span>
        ))}
      </div>

      <div className="flex items-baseline justify-between gap-2 mt-2.5 min-h-[1.1rem]">
        <span className="text-[11px] text-ink-2 truncate">
          {formatDateKey(detailDate)}
          {detailOff && <span className="text-ink-3"> · {detailOff}</span>}
          <span className="text-ink-3">
            {' · '}
            {detailHours > 0
              ? formatHours(detailHours)
              : detailDate > today
                ? 'not yet'
                : 'nothing logged'}
          </span>
        </span>
        {detailHours > 0 && !detailOff && (
          <Delta hours={detailHours - targetHours} />
        )}
      </div>
    </div>
  )
}
