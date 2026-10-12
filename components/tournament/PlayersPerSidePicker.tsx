'use client'

import { presetFor, shootoutKicksFor } from '@/lib/squadRules'

const SIZES = [5, 6, 7, 8, 9, 10, 11]

interface Props {
  value: number
  onChange: (n: number) => void
  disabled?: boolean
  /** Shown under the choice, for example why it cannot change */
  note?: string | null
}

/**
 * How many players each team puts on the pitch. It sets the Fantasy squad, the bench, the club limit and the number
 * of penalty kicks in a shootout. 11 is the standard game.
 */
export function PlayersPerSidePicker({ value, onChange, disabled, note }: Props) {
  const preset = presetFor(value)
  return (
    <div className="space-y-3">
      <label className="text-[11px] font-chakra font-black uppercase tracking-widest text-white/40 ml-1">Players per side</label>
      <div role="radiogroup" aria-label="Players per side" className="grid grid-cols-7 gap-2">
        {SIZES.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            disabled={disabled}
            onClick={() => onChange(n)}
            className={`h-12 rounded-xl text-sm font-chakra font-black border transition-colors disabled:opacity-50 ${
              value === n ? 'bg-orange-500 text-black border-orange-500' : 'bg-[#1E2032] text-white/70 border-white/5 hover:border-white/20'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="text-xs text-white/50 ml-1 leading-relaxed">
        {value === 11 ? 'The standard game. ' : `${value}-a-side. `}
        Fantasy squad of {preset.squadSize} ({preset.squadSize - preset.benchSize} start, {preset.benchSize} on the bench), up to {preset.maxPerClub} players from one team,
        and {shootoutKicksFor(value)} penalty kicks each in a shootout. You can fine-tune the squad later.
      </p>
      {note && <p className="text-xs text-yellow-300/80 ml-1">{note}</p>}
    </div>
  )
}
