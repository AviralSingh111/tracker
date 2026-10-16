import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

const THRESHOLD = 64 // drag needed to arm a refresh
const MAX_PULL = 96
const RESTING = 52 // where the indicator parks while refreshing
const MIN_SPIN = 500 // a refresh faster than the eye still has to be seen

/**
 * Pull-to-refresh for the page. A standalone PWA has no browser chrome and no
 * native pull gesture, so without this there is no way to ask for fresh data
 * short of force-quitting the app.
 */
export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void>
  children: ReactNode
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const startY = useRef<number | null>(null)
  const pullRef = useRef(0)
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [settling, setSettling] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    function onTouchStart(e: TouchEvent) {
      if (refreshing || window.scrollY > 0) {
        startY.current = null
        return
      }
      startY.current = e.touches[0].clientY
    }

    function onTouchMove(e: TouchEvent) {
      if (startY.current === null || refreshing) return
      const dy = e.touches[0].clientY - startY.current

      if (dy <= 0) {
        // Dragging up is ordinary scrolling — hand it back to the browser.
        startY.current = null
        pullRef.current = 0
        setPull(0)
        return
      }

      // Resistance, so the sheet feels attached rather than dragged.
      const next = Math.min(MAX_PULL, dy * 0.5)
      pullRef.current = next
      setPull(next)
      e.preventDefault()
    }

    async function onTouchEnd() {
      if (startY.current === null || refreshing) return
      startY.current = null

      if (pullRef.current < THRESHOLD) {
        setSettling(true)
        pullRef.current = 0
        setPull(0)
        return
      }

      setRefreshing(true)
      setSettling(true)
      setPull(RESTING)
      try {
        await Promise.all([
          onRefresh(),
          new Promise((r) => setTimeout(r, MIN_SPIN)),
        ])
      } finally {
        setRefreshing(false)
        pullRef.current = 0
        setPull(0)
      }
    }

    host.addEventListener('touchstart', onTouchStart, { passive: true })
    // Non-passive: the drag has to be able to cancel the platform's own scroll.
    host.addEventListener('touchmove', onTouchMove, { passive: false })
    host.addEventListener('touchend', onTouchEnd)
    host.addEventListener('touchcancel', onTouchEnd)

    return () => {
      host.removeEventListener('touchstart', onTouchStart)
      host.removeEventListener('touchmove', onTouchMove)
      host.removeEventListener('touchend', onTouchEnd)
      host.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [onRefresh, refreshing])

  const progress = Math.min(1, pull / THRESHOLD)

  return (
    <div ref={hostRef}>
      <div
        className="absolute left-0 right-0 flex justify-center pointer-events-none z-20"
        style={{
          top: 0,
          transform: `translateY(${pull - 40}px)`,
          opacity: progress,
          transition: settling ? 'transform 260ms ease-out, opacity 260ms' : 'none',
        }}
      >
        <span className="rounded-full bg-surface border border-line p-2 text-ink-2">
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            className={refreshing ? 'animate-spin' : ''}
            style={
              refreshing ? undefined : { transform: `rotate(${progress * 270}deg)` }
            }
          >
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <path d="M21 3v6h-6" />
          </svg>
        </span>
      </div>

      <div
        style={{
          // Left untransformed at rest: a permanent compositing layer costs
          // memory and softens text for no gain.
          transform: pull === 0 ? undefined : `translateY(${pull}px)`,
          transition: settling ? 'transform 260ms ease-out' : 'none',
        }}
        onTransitionEnd={() => setSettling(false)}
      >
        {children}
      </div>
    </div>
  )
}
