import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { TimeEntry } from '../types'
import { todayKey } from './dates'

const MS_PER_HOUR = 1000 * 60 * 60

function entriesRef(uid: string) {
  return collection(db, 'users', uid, 'entries')
}

function entryDoc(uid: string, entryId: string) {
  return doc(db, 'users', uid, 'entries', entryId)
}

/** Subscribes to entries from the last `days` days, newest first. */
export function subscribeEntries(
  uid: string,
  days: number,
  callback: (entries: TimeEntry[]) => void,
) {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const cutoff = todayKey(since)

  const q = query(
    entriesRef(uid),
    where('date', '>=', cutoff),
    orderBy('date', 'desc'),
  )

  return onSnapshot(q, (snap) => {
    const entries = snap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        date: data.date,
        clockIn: (data.clockIn as Timestamp).toMillis(),
        clockOut: data.clockOut ? (data.clockOut as Timestamp).toMillis() : null,
        autoClosed: Boolean(data.autoClosed),
      } satisfies TimeEntry
    })
    callback(entries)
  })
}

/** Clocks in now, or at `atTime` ("HH:MM") today if the user started earlier than they opened the app. */
export async function clockIn(uid: string, atTime?: string) {
  const clockInDate = atTime ? new Date(`${todayKey()}T${atTime}`) : new Date()

  if (clockInDate.getTime() > Date.now()) {
    throw new Error('Clock-in time cannot be in the future')
  }

  await addDoc(entriesRef(uid), {
    date: todayKey(),
    clockIn: Timestamp.fromDate(clockInDate),
    clockOut: null,
  })
}

/** Clocks out now, or at `atTime` ("HH:MM") if you left before opening the app. */
export async function clockOut(uid: string, entry: TimeEntry, atTime?: string) {
  const clockOutDate = atTime
    ? new Date(`${todayKey()}T${atTime}`)
    : new Date()

  if (clockOutDate.getTime() > Date.now()) {
    throw new Error('Clock-out time cannot be in the future')
  }
  if (clockOutDate.getTime() <= entry.clockIn) {
    throw new Error('Clock out must be after clock in')
  }

  await updateDoc(entryDoc(uid, entry.id), {
    clockOut: Timestamp.fromDate(clockOutDate),
  })
}

/**
 * Closes entries left open past their own day, crediting the daily target.
 *
 * An open entry otherwise counts up to `now` forever, so one forgotten
 * clock-out would silently bank 20+ hours. The capped time is editable
 * afterwards like any other entry.
 */
export async function closeStaleEntries(
  uid: string,
  entries: TimeEntry[],
  targetHours: number,
) {
  const today = todayKey()
  const stale = entries.filter((e) => e.clockOut === null && e.date < today)

  await Promise.all(
    stale.map((entry) =>
      updateDoc(entryDoc(uid, entry.id), {
        clockOut: Timestamp.fromMillis(entry.clockIn + targetHours * MS_PER_HOUR),
        autoClosed: true,
      }),
    ),
  )
}

/** Rewrites an entry's clock-in/out times, keeping it on its own date. */
export async function updateEntryTimes(
  uid: string,
  entry: TimeEntry,
  clockInTime: string,
  clockOutTime: string,
) {
  const clockIn = new Date(`${entry.date}T${clockInTime}`)
  const clockOut = new Date(`${entry.date}T${clockOutTime}`)

  if (clockOut <= clockIn) {
    throw new Error('Clock out must be after clock in')
  }
  if (clockOut.getTime() > Date.now()) {
    throw new Error('Clock-out time cannot be in the future')
  }

  await updateDoc(entryDoc(uid, entry.id), {
    clockIn: Timestamp.fromDate(clockIn),
    clockOut: Timestamp.fromDate(clockOut),
    autoClosed: false,
  })
}

export async function deleteEntry(uid: string, entryId: string) {
  await deleteDoc(entryDoc(uid, entryId))
}

/** Adds a completed entry for a past/custom date, given local time-of-day strings like "09:30". */
export async function addManualEntry(
  uid: string,
  date: string,
  clockInTime: string,
  clockOutTime: string,
) {
  const clockIn = new Date(`${date}T${clockInTime}`)
  const clockOut = new Date(`${date}T${clockOutTime}`)

  if (clockOut <= clockIn) {
    throw new Error('Clock out must be after clock in')
  }

  await addDoc(entriesRef(uid), {
    date,
    clockIn: Timestamp.fromDate(clockIn),
    clockOut: Timestamp.fromDate(clockOut),
  })
}
