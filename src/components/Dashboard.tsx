import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  calculateRemaining,
  summarizeDays,
  summarizeMonths,
  summarizeWeeks,
} from '../lib/averageCalc'
import { todayKey } from '../lib/dates'
import { formatHours, toTimeInput } from '../lib/format'
import { offDayLabel } from '../lib/holidays'
import { useNow } from '../lib/useNow'
import {
  clockIn,
  clockOut,
  closeStaleEntries,
  subscribeEntries,
} from '../lib/entries'
import { saveSettings, subscribeSettings } from '../lib/settings'
import type { TimeEntry, UserSettings } from '../types'
import { ActionBar } from './ActionBar'
import { AutoClosedNudge } from './AutoClosedNudge'
import { HeroCard } from './HeroCard'
import { HistoryPanel } from './HistoryPanel'
import { ManualEntryForm } from './ManualEntryForm'
import { PullToRefresh } from './PullToRefresh'
import { SettingsPanel } from './SettingsPanel'
import { DashboardSkeleton } from './Skeleton'
import { StatusCard } from './StatusCard'

// A year, so past months keep their averages instead of ageing out.
const HISTORY_DAYS = 365
// How far back a forgotten clock-out is still worth raising.
const NUDGE_WINDOW_DAYS = 7

export function Dashboard() {
  const { user, logout } = useAuth()
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [entriesLoaded, setEntriesLoaded] = useState(false)
  const [settings, setSettings] = useState<UserSettings>({ targetHours: 8 })
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [clockError, setClockError] = useState<string | null>(null)
  const [focusDate, setFocusDate] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<string[]>([])
  // Bumped by a pull, which tears the listeners down and re-establishes them.
  const [reloadKey, setReloadKey] = useState(0)
  const historyRef = useRef<HTMLDivElement>(null)

  const isClockedIn = entries.some((e) => e.clockOut === null)
  const now = useNow(isClockedIn)

  useEffect(() => {
    if (!user) return
    const unsubEntries = subscribeEntries(user.uid, HISTORY_DAYS, (next) => {
      setEntries(next)
      setEntriesLoaded(true)
    })
    const unsubSettings = subscribeSettings(user.uid, (next) => {
      setSettings(next)
      setSettingsLoaded(true)
    })
    return () => {
      unsubEntries()
      unsubSettings()
    }
  }, [user, reloadKey])

  // An entry left open past midnight is auto-closed at the daily target rather
  // than counting up forever. Waits for real settings so it credits the user's
  // own target, not the default.
  useEffect(() => {
    if (!user || !settingsLoaded) return
    closeStaleEntries(user.uid, entries, settings.targetHours).catch(() => {
      // Nothing actionable — the display cap in summarizeDays still holds.
    })
  }, [user, entries, settings.targetHours, settingsLoaded])

  const handleRefresh = useCallback(async () => {
    setReloadKey((k) => k + 1)
  }, [])

  // Only today's session is "live"; anything older is auto-closed above.
  const openEntry = entries.find(
    (e) => e.clockOut === null && e.date === todayKey(),
  )
  const days = summarizeDays(entries, now, settings.targetHours)
  const todayHours = days.find((d) => d.date === todayKey())?.hours ?? 0
  const hasEnoughData = days.length > 0
  const remaining = calculateRemaining(entries, settings.targetHours, now)
  const weeks = summarizeWeeks(entries, settings.targetHours, now)
  const months = summarizeMonths(entries, settings.targetHours, now)

  // The tab itself reports the countdown, so checking it doesn't need the app.
  useEffect(() => {
    document.title = openEntry
      ? `${formatHours(remaining.todayRemainingHours)} left · Tracker`
      : 'Tracker'
  }, [openEntry, remaining.todayRemainingHours])

  const nudge = useMemo(() => {
    const cutoff = new Date(now)
    cutoff.setDate(cutoff.getDate() - NUDGE_WINDOW_DAYS)
    const earliest = todayKey(cutoff)
    return entries
      .filter(
        (e) => e.autoClosed && e.date >= earliest && !dismissed.includes(e.id),
      )
      .sort((a, b) => b.date.localeCompare(a.date))[0]
  }, [entries, dismissed, now])

  async function handleClockIn(atTime: string) {
    if (!user) return
    setBusy(true)
    setClockError(null)
    try {
      await clockIn(user.uid, atTime)
    } catch (err) {
      setClockError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  async function handleClockOut(atTime: string) {
    if (!user || !openEntry) return
    setBusy(true)
    setClockError(null)
    try {
      await clockOut(user.uid, openEntry, atTime)
    } catch (err) {
      setClockError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-canvas px-4 pt-5 pb-32">
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="max-w-md mx-auto flex flex-col gap-3">
          <header className="flex items-center justify-between gap-2 mb-1">
            <h1 className="text-lg font-semibold text-ink tracking-tight">
              Tracker
            </h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSettingsOpen(!settingsOpen)}
                aria-expanded={settingsOpen}
                className={`text-xs rounded-full px-2.5 py-1 border transition nums ${
                  settingsOpen
                    ? 'border-line bg-raised text-ink'
                    : 'border-line text-ink-3 hover:text-ink-2'
                }`}
              >
                {formatHours(settings.targetHours)}/day
              </button>
              <button
                type="button"
                onClick={() => logout()}
                className="text-ink-3 text-xs hover:text-ink-2 transition"
              >
                Sign out
              </button>
            </div>
          </header>

          {!entriesLoaded ? (
            <DashboardSkeleton />
          ) : (
            <>
              {settingsOpen && (
                <SettingsPanel
                  targetHours={settings.targetHours}
                  onChange={(targetHours) =>
                    user && saveSettings(user.uid, { targetHours })
                  }
                />
              )}

              {nudge && (
                <AutoClosedNudge
                  entry={nudge}
                  onFix={() => {
                    setFocusDate(nudge.date)
                    historyRef.current?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    })
                  }}
                  onDismiss={() => setDismissed([...dismissed, nudge.id])}
                />
              )}

              <HeroCard
                todayHours={todayHours}
                targetHours={settings.targetHours}
                remainingHours={remaining.todayRemainingHours}
                isWorkday={remaining.isTodayWorkday}
                offReason={offDayLabel(todayKey(new Date(now)))}
                live={Boolean(openEntry)}
                now={now}
                clockedInAt={openEntry ? toTimeInput(openEntry.clockIn) : null}
              />

              {hasEnoughData && (
                <StatusCard
                  days={days}
                  currentWeek={weeks.find((w) => w.isCurrent)}
                  currentMonth={months.find((m) => m.isCurrent)}
                  targetHours={settings.targetHours}
                  now={now}
                />
              )}

              <div ref={historyRef} className="scroll-mt-4">
                <HistoryPanel
                  key={focusDate ?? 'root'}
                  days={days}
                  entries={entries}
                  now={now}
                  weeks={weeks}
                  months={months}
                  targetHours={settings.targetHours}
                  focusDate={focusDate}
                />
              </div>

              <ManualEntryForm />
            </>
          )}
        </div>
      </PullToRefresh>

      <ActionBar
        openEntry={openEntry}
        now={now}
        busy={busy || !entriesLoaded}
        error={clockError}
        onClockIn={handleClockIn}
        onClockOut={handleClockOut}
      />
    </div>
  )
}
