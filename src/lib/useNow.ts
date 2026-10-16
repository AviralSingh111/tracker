import { useEffect, useState } from 'react'

/**
 * The current time, ticking only while the page is being looked at.
 *
 * An installed PWA is frozen when you switch away and thawed when you come
 * back, so a resumed app would otherwise show a clock stopped at whatever
 * second it was suspended on. Every signal that the app is in front of
 * someone again re-reads the wall clock, which is what makes a session that
 * started this morning show the right elapsed time the instant it's opened.
 */
export function useNow(fast: boolean) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const sync = () => {
      if (!document.hidden) setNow(Date.now())
    }

    const id = setInterval(sync, fast ? 1_000 : 30_000)
    document.addEventListener('visibilitychange', sync)
    // pageshow fires on a bfcache restore, which raises no visibility event.
    window.addEventListener('pageshow', sync)
    window.addEventListener('focus', sync)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('pageshow', sync)
      window.removeEventListener('focus', sync)
    }
  }, [fast])

  return now
}
