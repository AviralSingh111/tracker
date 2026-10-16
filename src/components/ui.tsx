import type { ReactNode } from 'react'
import { formatHours } from '../lib/format'

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`bg-surface border border-line rounded-2xl ${className}`}
    >
      {children}
    </section>
  )
}

/** The small all-caps title that opens each block. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.09em] text-ink-3">
      {children}
    </p>
  )
}

/**
 * Hours against the target as a filled bar. Scaled to the target rather than
 * to the largest value, so a full bar always means "made it".
 */
export function MiniBar({
  hours,
  target,
  className = '',
}: {
  hours: number
  target: number
  className?: string
}) {
  const ratio = target > 0 ? hours / target : 0
  const met = ratio >= 0.999

  return (
    <span
      className={`inline-block h-1.5 rounded-full bg-raised overflow-hidden ${className}`}
    >
      <span
        className={`block h-full rounded-full ${met ? 'bg-ok' : 'bg-short'}`}
        style={{ width: `${Math.min(1, Math.max(0, ratio)) * 100}%` }}
      />
    </span>
  )
}

/**
 * A signed shortfall, said in words. "+1h" leaves the reader deciding whether
 * plus is good; "1h over" doesn't, and survives being read without colour.
 */
export function Delta({ hours }: { hours: number }) {
  if (Math.abs(hours) < 1 / 60) {
    return <span className="text-xs text-ok">on target</span>
  }
  const over = hours > 0
  return (
    <span className={`text-xs nums ${over ? 'text-ok' : 'text-short'}`}>
      {formatHours(Math.abs(hours))} {over ? 'over' : 'under'}
    </span>
  )
}
