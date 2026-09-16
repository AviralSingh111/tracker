import {
  addDoc,
  collection,
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

function entriesRef(uid: string) {
  return collection(db, 'users', uid, 'entries')
}

export function todayKey(d = new Date()) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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
      } satisfies TimeEntry
    })
    callback(entries)
  })
}

export async function clockIn(uid: string) {
  await addDoc(entriesRef(uid), {
    date: todayKey(),
    clockIn: Timestamp.now(),
    clockOut: null,
  })
}

export async function clockOut(uid: string, entryId: string) {
  await updateDoc(doc(db, 'users', uid, 'entries', entryId), {
    clockOut: Timestamp.now(),
  })
}
