import type { CSSProperties } from 'react'

export function Skeleton({
  className = '',
  style,
}: {
  className?: string
  style?: CSSProperties
}) {
  return <div className={`skeleton ${className}`} style={style} />
}

/** Plain cards at roughly the heights of the real ones, so nothing jumps. */
export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading">
      <Skeleton className="rounded-2xl h-72" />
      <Skeleton className="rounded-2xl h-56" />
      <Skeleton className="rounded-2xl h-64" />
    </div>
  )
}
