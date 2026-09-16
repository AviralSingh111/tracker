export interface TimeEntry {
  id: string
  date: string // YYYY-MM-DD, local date the session started
  clockIn: number // epoch ms
  clockOut: number | null // epoch ms, null while still clocked in
  autoClosed?: boolean // clock-out was filled in for a forgotten entry
}

export interface UserSettings {
  targetHours: number // desired average hours per workday
}

export interface DaySummary {
  date: string
  hours: number
}
