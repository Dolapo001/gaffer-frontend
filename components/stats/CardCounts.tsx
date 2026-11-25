'use client'

import { cardCounts } from '@/lib/cards'

/** A player's yellow and red cards side by side, each as a small card shape with its count. */
export function CardCounts({ entry, size = 'md' }: { entry: unknown; size?: 'md' | 'lg' }) {
  const { yellow, red } = cardCounts(entry)
  const card = size === 'lg' ? 'w-4 h-[22px]' : 'w-[9px] h-3'
  const text = size === 'lg' ? 'text-[28px]' : 'text-[15px]'
  return (
    <span className="inline-flex items-center gap-3 tabular-nums" aria-label={`${yellow} yellow, ${red} red`}>
      <span className={`inline-flex items-center gap-1.5 ${yellow ? '' : 'opacity-35'}`} title="Yellow cards">
        <span className={`${card} rounded-[2px] bg-yellow-400`} aria-hidden="true" />
        <span className={`${text} font-semibold text-white`}>{yellow}</span>
      </span>
      <span className={`inline-flex items-center gap-1.5 ${red ? '' : 'opacity-35'}`} title="Red cards">
        <span className={`${card} rounded-[2px] bg-red-500`} aria-hidden="true" />
        <span className={`${text} font-semibold text-white`}>{red}</span>
      </span>
    </span>
  )
}
