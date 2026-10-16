import { useState } from 'react'
import type { PeriodSummary } from '../lib/averageCalc'
import { thisWeekKey } from '../lib/dates'
import { formatWeekRange } from '../lib/format'
import type { DaySummary } from '../types'
import { PeriodRow } from './PeriodRow'
import { Card, SectionLabel } from './ui'
import { WeekStrip, WeekStripLegend } from './WeekStrip'

interface StatusCardProps {
  days: DaySummary[]
  currentWeek: PeriodSummary | undefined
  currentMonth: PeriodSummary | undefined
  targetHours: number
  now: number
}

/**
 * Where you stand right now. Only the running week and month live here —
 * everything finished belongs to the archive, which is what stops the same
 * figures being printed twice on one screen.
 */
export function StatusCard({
  days,
  currentWeek,
  currentMonth,
  targetHours,
  now,
}: StatusCardProps) {
  const [legendOpen, setLegendOpen] = useState(false)

  return (
    <Card className="px-5 py-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <SectionLabel>This week</SectionLabel>
          <button
            type="button"
            onClick={() => setLegendOpen(!legendOpen)}
            aria-expanded={legendOpen}
            aria-label="What the bar colours mean"
            className={`transition ${
              legendOpen ? 'text-ink' : 'text-ink-3 hover:text-ink-2'
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              width="13"
              height="13"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="12" cy="12" r="9.5" />
              <path d="M12 11v5" />
              <path d="M12 7.6v.4" />
            </svg>
          </button>
        </div>
        <span className="text-[11px] text-ink-3 nums">
          {formatWeekRange(thisWeekKey(new Date(now)))}
        </span>
      </div>

      <WeekStrip days={days} targetHours={targetHours} now={now} />

      {legendOpen && <WeekStripLegend />}

      <div className="divide-y divide-line mt-2">
        {currentWeek && (
          <PeriodRow
            label="This week"
            period={currentWeek}
            targetHours={targetHours}
          />
        )}
        {currentMonth && (
          <PeriodRow
            label="This month"
            period={currentMonth}
            targetHours={targetHours}
          />
        )}
      </div>
    </Card>
  )
}
