const PRESETS = [7, 8]

interface SettingsPanelProps {
  targetHours: number
  onChange: (hours: number) => void
}

export function SettingsPanel({ targetHours, onChange }: SettingsPanelProps) {
  const isCustom = !PRESETS.includes(targetHours)

  return (
    <div className="bg-neutral-900 rounded-2xl p-6">
      <p className="text-neutral-400 text-sm mb-3">Target average / day</p>
      <div className="flex gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            className={`flex-1 rounded-lg py-2 font-medium transition ${
              targetHours === preset
                ? 'bg-indigo-600 text-white'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            {preset} hrs
          </button>
        ))}
        <input
          type="number"
          min={1}
          max={24}
          step={0.5}
          value={isCustom ? targetHours : ''}
          placeholder="Custom"
          onChange={(e) => {
            const v = Number.parseFloat(e.target.value)
            if (!Number.isNaN(v)) onChange(v)
          }}
          className={`w-24 rounded-lg px-3 py-2 text-center outline-none focus:ring-2 focus:ring-indigo-500 ${
            isCustom
              ? 'bg-indigo-600 text-white placeholder-indigo-200'
              : 'bg-neutral-800 text-neutral-300 placeholder-neutral-500'
          }`}
        />
      </div>
    </div>
  )
}
