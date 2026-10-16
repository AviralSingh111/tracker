import {
  formatCountdown,
  formatHours,
  formatHoursCompact,
  formatLeaveBy,
} from '../lib/format'
import { Card } from './ui'

interface HeroCardProps {
  todayHours: number
  targetHours: number
  remainingHours: number
  isWorkday: boolean
  offReason: string | null
  live: boolean
  now: number
  clockedInAt: string | null
}

const SIZE = 184
const STROKE = 9
const R = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * R

/** "7h 01m" with the units set smaller, so the figure carries the weight. */
function BigDuration({ hours }: { hours: number }) {
  const totalMinutes = Math.max(0, Math.round(hours * 60))
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  const unit = 'text-[0.5em] font-medium text-ink-2 ml-[0.08em]'

  return (
    <p className="text-[2.1rem] leading-none font-semibold text-ink nums">
      {h > 0 && (
        <>
          {h}
          <span className={unit}>h</span>{' '}
        </>
      )}
      {h > 0 ? String(m).padStart(2, '0') : m}
      <span className={unit}>m</span>
    </p>
  )
}

/**
 * Today at a glance. The ring carries the progress so the figure doesn't have
 * to be read to be understood, and the leave-by time answers the question the
 * countdown only implies.
 */
export function HeroCard({
  todayHours,
  targetHours,
  remainingHours,
  isWorkday,
  offReason,
  live,
  now,
  clockedInAt,
}: HeroCardProps) {
  const ratio = targetHours > 0 ? Math.min(1, todayHours / targetHours) : 0
  const done = isWorkday && remainingHours === 0
  // In progress is not a verdict: amber is reserved for a target that has
  // already been missed, so a running day reads as "live", not "short".
  const ringColor = done ? 'var(--color-ok)' : 'var(--color-live)'

  return (
    <Card className="px-5 pt-6 pb-5 flex flex-col items-center">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="var(--color-raised)"
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={ringColor}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - ratio)}
            style={{ transition: 'stroke-dashoffset 600ms ease-out' }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center px-7 text-center">
          <BigDuration hours={todayHours} />
          <p className="text-ink-3 text-xs mt-2">
            {isWorkday ? `of ${formatHoursCompact(targetHours)}` : 'logged today'}
          </p>
        </div>
      </div>

      <div className="mt-5 text-center min-h-[2.75rem] flex flex-col justify-center">
        {!isWorkday ? (
          <p className="text-ink-2 text-sm">{offReason} — no target today</p>
        ) : done ? (
          <p className="text-ok text-sm font-medium">Done for today</p>
        ) : live ? (
          <>
            <p className="text-ink text-lg font-medium nums">
              Leave by {formatLeaveBy(now, remainingHours)}
            </p>
            <p className="text-ink-3 text-xs mt-0.5 nums">
              {formatCountdown(remainingHours)} to go
            </p>
          </>
        ) : (
          <p className="text-ink-2 text-sm nums">
            {formatHours(remainingHours)} left today
          </p>
        )}
      </div>

      {clockedInAt && (
        <p className="text-ink-3 text-xs mt-2 nums">
          Clocked in at {clockedInAt}
        </p>
      )}
    </Card>
  )
}
