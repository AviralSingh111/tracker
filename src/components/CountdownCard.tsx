import type { RemainingWork } from '../lib/averageCalc'
import { formatCountdown, formatHours } from '../lib/format'

interface CountdownCardProps {
  remaining: RemainingWork
  targetHours: number
  /** True while clocked in — the numbers are ticking down in real time. */
  live: boolean
}

interface RowProps {
  label: string
  hours: number
  note: string | null
  live: boolean
  doneLabel: string
  emphasis?: boolean
}

function Row({ label, hours, note, live, doneLabel, emphasis }: RowProps) {
  const done = hours === 0

  return (
    <div>
      <p className="text-neutral-500 text-xs mb-1">{label}</p>
      <p
        className={`font-semibold tabular-nums ${
          emphasis ? 'text-2xl' : 'text-xl'
        } ${done ? 'text-emerald-400' : emphasis ? 'text-white' : 'text-amber-400'}`}
      >
        {done ? doneLabel : live ? formatCountdown(hours) : formatHours(hours)}
      </p>
      {note && <p className="text-neutral-600 text-xs mt-1">{note}</p>}
    </div>
  )
}

export function CountdownCard({ remaining, targetHours, live }: CountdownCardProps) {
  const { todayRemainingHours, isTodayWorkday, week, month } = remaining

  function scopeNote(loggedWorkdays: number) {
    if (loggedWorkdays === 0) return 'Nothing logged yet'
    return `Across the ${loggedWorkdays} working ${
      loggedWorkdays === 1 ? 'day' : 'days'
    } you logged`
  }

  return (
    <div className="bg-neutral-900 rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <p className="text-neutral-400 text-sm">Time left</p>
        <p className="text-neutral-600 text-xs">
          {formatHours(targetHours)}/day target
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {!isTodayWorkday ? (
          <div>
            <p className="text-neutral-500 text-xs mb-1">Today</p>
            <p className="text-xl font-semibold text-neutral-500">
              No target today
            </p>
          </div>
        ) : (
          <Row
            label="Today"
            hours={todayRemainingHours}
            note={null}
            live={live}
            doneLabel="Done for today"
            emphasis
          />
        )}

        <div className="border-t border-neutral-800 pt-3">
          <Row
            label="This week"
            hours={week.remainingHours}
            note={scopeNote(week.loggedWorkdays)}
            live={live}
            doneLabel="Week on target"
          />
        </div>

        <div className="border-t border-neutral-800 pt-3">
          <Row
            label="This month"
            hours={month.remainingHours}
            note={scopeNote(month.loggedWorkdays)}
            live={live}
            doneLabel="Month on target"
          />
        </div>
      </div>
    </div>
  )
}
