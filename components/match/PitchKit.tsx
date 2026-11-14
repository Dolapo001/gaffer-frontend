'use client'

/** Shared pieces for every pitch in the app: round photos, rating pills and the pitch markings. */
import { useState } from 'react'
import { getImageUrl } from '@/lib/api'

/** Rating colours, in bands: blue for 8+, green 7+, gold 6.5+, orange 6+, red below. */
export function ratingColour(r: number) {
  if (r >= 8) return '#1E8EF5'
  if (r >= 7) return '#16A34A'
  if (r >= 6.5) return '#C99A06'
  if (r >= 6) return '#E8730C'
  return '#DC2626'
}

function Silhouette() {
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden>
      <rect width="40" height="40" fill="#D5D8DE" />
      <circle cx="20" cy="15.5" r="6.5" fill="#A7ACB5" />
      <path d="M7 40c1.4-8 6.9-12.4 13-12.4S31.6 32 33 40z" fill="#A7ACB5" />
    </svg>
  )
}

export function Avatar({ photoUrl, size, dim = false }: { photoUrl?: string; size: number; dim?: boolean }) {
  const [failed, setFailed] = useState<string | null>(null)
  const src = photoUrl ? getImageUrl(photoUrl) : ''
  return (
    <span className={`block shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-white/20 ${dim ? 'opacity-60' : ''}`} style={{ width: size, height: size }}>
      {src && failed !== src ? <img src={src} alt="" className="h-full w-full object-cover object-top" onError={() => setFailed(src)} /> : <Silhouette />}
    </span>
  )
}

const LINE = 'rgba(255,255,255,0.16)'

/** One penalty area: the box, the six-yard box and the D. Drawn in pixels so the arcs stay round. */
function Area({ end }: { end: 'top' | 'bottom' }) {
  const open = end === 'top' ? { borderTop: 'none' } : { borderBottom: 'none' }
  return (
    <>
      <span className="absolute left-1/2 w-[42%] -translate-x-1/2" style={{ [end]: 0, height: 64, border: `1px solid ${LINE}`, ...open }} />
      <span className="absolute left-1/2 w-[18%] -translate-x-1/2" style={{ [end]: 0, height: 22, border: `1px solid ${LINE}`, ...open }} />
      <span className="absolute left-1/2 h-[12px] w-[60px] -translate-x-1/2 overflow-hidden" style={{ [end]: 65 }}>
        <span className="absolute left-0 h-[60px] w-[60px] rounded-full" style={{ [end]: -48, border: `1px solid ${LINE}` }} />
      </span>
    </>
  )
}

function Corner({ v, h }: { v: 'top' | 'bottom'; h: 'left' | 'right' }) {
  return (
    <span className="absolute h-[12px] w-[12px] overflow-hidden" style={{ [v]: 0, [h]: 0 }}>
      <span className="absolute h-[24px] w-[24px] rounded-full" style={{ [v]: -12, [h]: -12, border: `1px solid ${LINE}` }} />
    </span>
  )
}

/** Full pitch, or with `half` one half: halfway line and centre circle at the top, goal at the bottom. */
export function PitchMarkings({ half = false }: { half?: boolean }) {
  if (half) {
    return (
      <span className="pointer-events-none absolute inset-0" aria-hidden style={{ border: `1px solid ${LINE}`, borderTopColor: 'transparent' }}>
        <span className="absolute inset-x-0 top-0 h-px" style={{ background: LINE }} />
        <span className="absolute left-1/2 top-0 h-[48px] w-[96px] -translate-x-1/2 overflow-hidden">
          <span className="absolute left-0 top-[-48px] h-[96px] w-[96px] rounded-full" style={{ border: `1px solid ${LINE}` }} />
        </span>
        <Area end="bottom" />
        <Corner v="bottom" h="left" />
        <Corner v="bottom" h="right" />
      </span>
    )
  }
  return (
    <span className="pointer-events-none absolute inset-0" aria-hidden style={{ border: `1px solid ${LINE}` }}>
      <Area end="top" />
      <Area end="bottom" />
      <span className="absolute inset-x-0 top-1/2 h-px" style={{ background: LINE }} />
      <span className="absolute left-1/2 top-1/2 h-[96px] w-[96px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ border: `1px solid ${LINE}` }} />
      <Corner v="top" h="left" />
      <Corner v="top" h="right" />
      <Corner v="bottom" h="left" />
      <Corner v="bottom" h="right" />
    </span>
  )
}


/** The rating on the photo's lower edge, with a star beside it for the top-rated player. */
export function RatingPill({ rating, best = false, className = '' }: { rating: number; best?: boolean; className?: string }) {
  return (
    <span className={`absolute left-1/2 -translate-x-1/2 ${className}`}>
      {best && (
        <span className="absolute right-full top-1/2 mr-[3px] flex h-[15px] w-[15px] -translate-y-1/2 items-center justify-center rounded-full bg-[#16A34A]" title="Top rated">
          <svg viewBox="0 0 10 10" className="h-[9px] w-[9px]" aria-hidden>
            <path d="M5 .8l1.25 2.6 2.85.38-2.08 1.98.52 2.83L5 7.22 2.46 8.6l.52-2.83L.9 3.78l2.85-.38z" fill="#fff" />
          </svg>
        </span>
      )}
      <span
        className="flex h-[16px] min-w-[27px] items-center justify-center rounded-[3px] px-[3px] font-body text-[11.5px] font-bold leading-none tabular-nums text-white"
        style={{ background: ratingColour(rating) }}
      >
        {rating.toFixed(1)}
      </span>
    </span>
  )
}
