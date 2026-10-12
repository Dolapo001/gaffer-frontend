'use client'

export interface CardRules {
  yellow: { action: 'none' | 'break' | 'off'; minutes?: number }
  red: { action: 'off' | 'replace'; minutes?: number; nextMatchBan?: boolean }
}

export const STANDARD_CARD_RULES: CardRules = { yellow: { action: 'none' }, red: { action: 'off', nextMatchBan: false } }

const chip = (active: boolean) =>
  `px-3 h-10 rounded-xl text-xs font-chakra font-black border transition-colors ${
    active ? 'bg-orange-500 text-black border-orange-500' : 'bg-[#1E2032] text-white/70 border-white/5 hover:border-white/20'
  }`

function Minutes({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {[2, 5].map((m) => (
        <button key={m} type="button" onClick={() => onChange(m)} className={chip(value === m)}>{m} minutes</button>
      ))}
      <label className="flex items-center gap-2 text-xs text-white/50">
        Other
        <input
          inputMode="numeric"
          aria-label="Minutes"
          value={value === 2 || value === 5 ? '' : String(value || '')}
          onChange={(e) => onChange(Math.min(30, Number(e.target.value.replace(/\D/g, '')) || 0))}
          className="w-16 h-10 bg-[#181928] border border-white/10 rounded-xl px-3 text-white text-sm font-chakra font-bold"
        />
      </label>
    </div>
  )
}

/**
 * What a yellow and a red card mean in this tournament. The console tells the organiser what to do when a card is
 * shown, and the commentary says it too. Cards score Fantasy points either way.
 */
export function CardRulesPicker({ value, onChange }: { value: CardRules; onChange: (v: CardRules) => void }) {
  const { yellow, red } = value
  return (
    <div className="space-y-4">
      <label className="text-[11px] font-chakra font-black uppercase tracking-widest text-white/40 ml-1">Cards</label>

      <div className="space-y-2">
        <p className="text-xs text-white/60 ml-1">A yellow card means</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onChange({ ...value, yellow: { action: 'none' } })} className={chip(yellow.action === 'none')}>A caution only</button>
          <button type="button" onClick={() => onChange({ ...value, yellow: { action: 'break', minutes: yellow.minutes || 2 } })} className={chip(yellow.action === 'break')}>A short break</button>
          <button type="button" onClick={() => onChange({ ...value, yellow: { action: 'off' } })} className={chip(yellow.action === 'off')}>Sent off</button>
        </div>
        {yellow.action === 'break' && <Minutes value={yellow.minutes || 2} onChange={(m) => onChange({ ...value, yellow: { action: 'break', minutes: m } })} />}
      </div>

      <div className="space-y-2">
        <p className="text-xs text-white/60 ml-1">A red card means</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onChange({ ...value, red: { ...red, action: 'off' } })} className={chip(red.action === 'off')}>Sent off, team plays a player short</button>
          <button type="button" onClick={() => onChange({ ...value, red: { ...red, action: 'replace', minutes: red.minutes || 5 } })} className={chip(red.action === 'replace')}>Sent off, team can replace him after a while</button>
        </div>
        {red.action === 'replace' && <Minutes value={red.minutes || 5} onChange={(m) => onChange({ ...value, red: { ...red, action: 'replace', minutes: m } })} />}
        <label className="flex items-center gap-2 text-xs text-white/60 ml-1">
          <input
            type="checkbox"
            checked={!!red.nextMatchBan}
            onChange={(e) => onChange({ ...value, red: { ...red, nextMatchBan: e.target.checked } })}
          />
          The player also misses his team&apos;s next match
        </label>
      </div>
    </div>
  )
}

/** Only what differs from the standard game needs saving; null means the standard game. */
export function cardRulesPayload(v: CardRules) {
  const yellow = v.yellow.action === 'break' ? { action: 'break' as const, minutes: v.yellow.minutes || 2 } : { action: v.yellow.action }
  const red = v.red.action === 'replace'
    ? { action: 'replace' as const, minutes: v.red.minutes || 5, nextMatchBan: !!v.red.nextMatchBan }
    : { action: 'off' as const, nextMatchBan: !!v.red.nextMatchBan }
  return { yellow, red }
}

export function isStandardCards(v: CardRules): boolean {
  return v.yellow.action === 'none' && v.red.action === 'off' && !v.red.nextMatchBan
}
