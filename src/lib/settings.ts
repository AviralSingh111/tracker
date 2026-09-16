import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { UserSettings } from '../types'

const DEFAULT_SETTINGS: UserSettings = { targetHours: 8 }

function settingsRef(uid: string) {
  return doc(db, 'users', uid)
}

export function subscribeSettings(
  uid: string,
  callback: (settings: UserSettings) => void,
) {
  return onSnapshot(settingsRef(uid), (snap) => {
    const data = snap.data()
    callback(data ? { targetHours: data.targetHours ?? 8 } : DEFAULT_SETTINGS)
  })
}

export async function saveSettings(uid: string, settings: UserSettings) {
  await setDoc(settingsRef(uid), settings, { merge: true })
}
