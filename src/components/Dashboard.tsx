import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  calculateRemaining,
  calculateWeekProgress,
  summarizeDays,
} from '../lib/averageCalc'
import { todayKey } from '../lib/dates'
import {
  clockIn,
  clockOut,
  closeStaleEntries,
  subscribeEntries,
} from '../lib/entries'
import { saveSettings, subscribeSettings } from '../lib/settings'
import type { TimeEntry, UserSettings } from '../types'
import { AlertBanner } from './AlertBanner'
import { ClockCard } from './ClockCard'
import { CountdownCard } from './CountdownCard'
import { HistoryTable } from './HistoryTable'
import { ManualEntryForm } from './ManualEntryForm'
import { SettingsPanel } from './SettingsPanel'

const HISTORY_DAYS = 30

export function Dashboard() {
  const { user, logout } = useAuth()
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [settings, setSettings] = useState<UserSettings>({ targetHours: 8 })
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [clockError, setClockError] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!user) return
    const unsubEntries = subscribeEntries(user.uid, HISTORY_DAYS, setEntries)
    const unsubSettings = subscribeSettings(user.uid, (next) => {
      setSettings(next)
      setSettingsLoaded(true)
    })
    return () => {
      unsubEntries()
      unsubSettings()
    }
  }, [user])

  // Tick every second while clocked in so the countdown runs live; 30s is
  // plenty otherwise.
  useEffect(() => {
    const isClockedIn = entries.some((e) => e.clockOut === null)
    const id = setInterval(() => setNow(Date.now()), isClockedIn ? 1_000 : 30_000)
    return () => clearInterval(id)
  }, [entries])

  // An entry left open past midnight is auto-closed at the daily target rather
  // than counting up forever. Waits for real settings so it credits the user's
  // own target, not the default.
  useEffect(() => {
    if (!user || !settingsLoaded) return
    closeStaleEntries(user.uid, entries, settings.targetHours).catch(() => {
      // Nothing actionable — the display cap in summarizeDays still holds.
    })
  }, [user, entries, settings.targetHours, settingsLoaded])

  // Only today's session is "live"; anything older is auto-closed above.
  const openEntry = entries.find(
    (e) => e.clockOut === null && e.date === todayKey(),
  )
  const days = summarizeDays(entries, now, settings.targetHours)
  const todayHours = days.find((d) => d.date === todayKey())?.hours ?? 0
  const hasEnoughData = days.length > 0
  const progress = calculateWeekProgress(entries, settings.targetHours, now)
  const remaining = calculateRemaining(entries, settings.targetHours, now)

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
    <div className="min-h-screen bg-neutral-950 px-4 py-8">
      <div className="max-w-md mx-auto flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold text-white">Tracker</h1>
          <button
            type="button"
            onClick={() => logout()}
            className="text-neutral-500 text-sm hover:text-white transition"
          >
            Sign out
          </button>
        </div>

        <ClockCard
          openEntry={openEntry}
          todayHours={todayHours}
          busy={busy}
          onClockIn={handleClockIn}
          onClockOut={handleClockOut}
        />

        {clockError && (
          <p className="text-red-400 text-sm text-center -mt-2">{clockError}</p>
        )}

        {hasEnoughData && (
          <CountdownCard
            remaining={remaining}
            targetHours={settings.targetHours}
            live={Boolean(openEntry)}
          />
        )}

        {hasEnoughData && <AlertBanner progress={progress} />}

        <SettingsPanel
          targetHours={settings.targetHours}
          onChange={(targetHours) => user && saveSettings(user.uid, { targetHours })}
        />

        <ManualEntryForm />

        <HistoryTable days={days} entries={entries} now={now} />
      </div>
    </div>
  )
}
