import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { calculateWeekProgress, summarizeDays } from '../lib/averageCalc'
import { clockIn, clockOut, subscribeEntries, todayKey } from '../lib/entries'
import { notify } from '../lib/notify'
import { saveSettings, subscribeSettings } from '../lib/settings'
import type { TimeEntry, UserSettings } from '../types'
import { AlertBanner } from './AlertBanner'
import { ClockCard } from './ClockCard'
import { HistoryTable } from './HistoryTable'
import { ManualEntryForm } from './ManualEntryForm'
import { SettingsPanel } from './SettingsPanel'

const HISTORY_DAYS = 30

export function Dashboard() {
  const { user, logout } = useAuth()
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [settings, setSettings] = useState<UserSettings>({ targetHours: 8 })
  const [busy, setBusy] = useState(false)
  const [clockInError, setClockInError] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now())
  const lastAlertedRef = useRef(false)

  useEffect(() => {
    if (!user) return
    const unsubEntries = subscribeEntries(user.uid, HISTORY_DAYS, setEntries)
    const unsubSettings = subscribeSettings(user.uid, setSettings)
    return () => {
      unsubEntries()
      unsubSettings()
    }
  }, [user])

  // Tick every 30s so "today" hours and the alert stay live while clocked in.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const openEntry = entries.find((e) => e.clockOut === null)
  const days = summarizeDays(entries, now)
  const todayHours = days.find((d) => d.date === todayKey())?.hours ?? 0
  const hasEnoughData = days.length > 0
  const progress = calculateWeekProgress(entries, settings.targetHours, now)

  useEffect(() => {
    if (!hasEnoughData) {
      lastAlertedRef.current = false
      return
    }
    if (progress.isBehindTarget && !lastAlertedRef.current) {
      lastAlertedRef.current = true
      notify(
        'Tracker',
        `You need to average ${progress.requiredDailyAverageGoingForward.toFixed(1)}h/day for the rest of the week to hit your ${progress.targetHours}h target.`,
      )
    }
    if (!progress.isBehindTarget) {
      lastAlertedRef.current = false
    }
  }, [progress, hasEnoughData])

  async function handleClockIn(atTime: string) {
    if (!user) return
    setBusy(true)
    setClockInError(null)
    try {
      await clockIn(user.uid, atTime)
    } catch (err) {
      setClockInError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  async function handleClockOut() {
    if (!user || !openEntry) return
    setBusy(true)
    try {
      await clockOut(user.uid, openEntry.id)
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

        {clockInError && (
          <p className="text-red-400 text-sm text-center -mt-2">{clockInError}</p>
        )}

        {hasEnoughData && <AlertBanner progress={progress} />}

        <SettingsPanel
          targetHours={settings.targetHours}
          onChange={(targetHours) => user && saveSettings(user.uid, { targetHours })}
        />

        <ManualEntryForm />

        <HistoryTable days={days} />
      </div>
    </div>
  )
}
