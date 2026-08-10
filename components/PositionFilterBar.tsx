'use client'

export type PositionFilterValue = 'ALL' | 'GK' | 'DEF' | 'MID' | 'FWD'

const OPTIONS: PositionFilterValue[] = ['ALL', 'GK', 'DEF', 'MID', 'FWD']

interface PositionFilterBarProps {
  value: PositionFilterValue
  onChange: (value: PositionFilterValue) => void
  className?: string
}

/** Shared segmented [All · GK · DEF · MID · FWD] control — composes with
 * whatever other filters (search/team/price) a picker already has. */
export function PositionFilterBar({ value, onChange, className = '' }: PositionFilterBarProps) {
  return (
    <div className={`flex gap-1.5 ${className}`}>
      {OPTIONS.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-colors ${
            value === opt
              ? 'bg-gaffer-orange text-white'
              : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70'
          }`}
        >
          {opt === 'ALL' ? 'All' : opt}
        </button>
      ))}
    </div>
  )
}
