'use client'

import type { Decider } from '@/lib/services/fixture.service'

interface Props {
  value: Decider
  onChange: (next: Decider) => void
  disabled?: boolean
}

function Row({ label, hint, checked, onToggle, disabled }: { label: string; hint: string; checked: boolean; onToggle: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`flex items-center justify-between gap-4 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <span className="min-w-0">
        <span className="block text-white text-sm font-medium">{label}</span>
        <span className="block text-white/40 text-xs">{hint}</span>
      </span>
      <span className="relative inline-flex items-center flex-shrink-0">
        <input
          type="checkbox"
          className="sr-only peer"
          role="switch"
          aria-label={label}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onToggle(e.target.checked)}
        />
        <span className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-[#22C55E] peer-focus-visible:ring-2 peer-focus-visible:ring-white/40 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
      </span>
    </label>
  )
}

/**
 * What settles a match that finishes level. Both off: it stays a draw.
 * Extra time off and penalties on: straight to penalties.
 */
export function DeciderToggles({ value, onChange, disabled }: Props) {
  const extraTime = !!value.extraTime
  const penalties = !!value.penalties
  return (
    <div className="space-y-4 rounded-2xl bg-[#1E2032] border border-white/5 p-5">
      <p className="text-[13px] text-white/50 font-medium uppercase tracking-wider">If the match ends level</p>
      <Row label="Extra time" hint="Play on after full time. Goals in extra time count." checked={extraTime} disabled={disabled} onToggle={(v) => onChange({ extraTime: v, penalties })} />
      <Row label="Penalties" hint={extraTime ? 'A shootout if still level after extra time.' : 'Straight to a shootout, with no extra time.'} checked={penalties} disabled={disabled} onToggle={(v) => onChange({ extraTime, penalties: v })} />
      {!extraTime && !penalties && <p className="text-xs text-white/40">Both off: a level match stays a draw.</p>}
    </div>
  )
}
