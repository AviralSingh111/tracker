import { useEffect, useState } from 'react'
import { Card, SectionLabel } from './ui'

const PRESETS = [7, 8]

interface SettingsPanelProps {
  targetHours: number
  onChange: (hours: number) => void
}

export function SettingsPanel({ targetHours, onChange }: SettingsPanelProps) {
  const isCustom = !PRESETS.includes(targetHours)
  const [draft, setDraft] = useState(isCustom ? String(targetHours) : '')

  // Typing "7.5" used to write 7 and then 7.5 — two saves, and every figure on
  // screen recomputing against a target nobody chose.
  useEffect(() => {
    const value = Number.parseFloat(draft)
    if (draft === '' || Number.isNaN(value)) return
    if (value < 1 || value > 24 || value === targetHours) return

    const id = setTimeout(() => onChange(value), 600)
    return () => clearTimeout(id)
  }, [draft, targetHours, onChange])

  const chip = 'flex-1 rounded-xl py-2.5 text-sm font-medium transition'

  return (
    <Card className="px-5 py-4">
      <SectionLabel>Daily target</SectionLabel>
      <div className="flex gap-2 mt-3">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => {
              setDraft('')
              onChange(preset)
            }}
            className={`${chip} ${
              targetHours === preset
                ? 'bg-ink text-canvas'
                : 'bg-raised text-ink-2 hover:text-ink'
            }`}
          >
            {preset}h
          </button>
        ))}
        <input
          type="number"
          min={1}
          max={24}
          step={0.5}
          value={draft}
          placeholder="Custom"
          onChange={(e) => setDraft(e.target.value)}
          className={`w-24 rounded-xl px-3 py-2.5 text-sm text-center outline-none focus:ring-2 focus:ring-live nums ${
            isCustom
              ? 'bg-ink text-canvas placeholder-canvas/50'
              : 'bg-raised text-ink-2 placeholder-ink-3'
          }`}
        />
      </div>
    </Card>
  )
}
