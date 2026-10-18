'use client'

import React, { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { getImageUrl } from '@/lib/api'
import { playerFullName } from '@/lib/playerName'
import { getRatingBadgeStyle } from '@/lib/ratingsEngine'
import type { LineupPlayer, TeamLineupData } from './MatchLineupPitch'

const idOf = (v: any): string | null => (v == null ? null : typeof v === 'object' ? (v._id ? String(v._id) : null) : String(v))
const nameFromEventPlayer = (v: any): string | null => (v && typeof v === 'object' ? playerFullName(v, '') || null : null)

interface CameOn {
  player: LineupPlayer
  minute?: number
  outName?: string
}

/**
 * The substitutes for a match, one team at a time: first the players who came on (the minute and who they replaced),
 * then everyone in the squad who did not play. Players who are not picked in the lineup land here automatically.
 */
export function SubstitutesPanel({
  homeTeam,
  awayTeam,
  matchEvents = [],
  getRating,
  isAdmin = false,
  onPick,
}: {
  homeTeam: TeamLineupData
  awayTeam: TeamLineupData
  matchEvents?: any[]
  getRating: (p: LineupPlayer) => number
  isAdmin?: boolean
  onPick?: (player: LineupPlayer, side: 'home' | 'away') => void
}) {
  const [side, setSide] = useState<'home' | 'away'>('home')
  const team = side === 'home' ? homeTeam : awayTeam
  const bench = team.bench ?? []
  const everyone = [...team.starters, ...bench]

  const nameById = new Map(everyone.map((p) => [p.id, p.name]))
  const subEvents = matchEvents.filter((e) => ['sub', 'substitution'].includes(e.rawType || e.type))

  const cameOn: CameOn[] = []
  for (const e of subEvents) {
    const inId = idOf(e.playerInId)
    if (!inId) continue
    const player = everyone.find((p) => p.id === inId)
    if (!player || !bench.some((b) => b.id === inId)) continue
    const outId = idOf(e.playerOutId)
    cameOn.push({ player, minute: e.minute, outName: (outId && nameById.get(outId)) || nameFromEventPlayer(e.playerOutId) || undefined })
  }
  cameOn.sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))
  const cameOnIds = new Set(cameOn.map((c) => c.player.id))
  const unused = bench.filter((p) => !cameOnIds.has(p.id))

  if (!homeTeam.bench?.length && !awayTeam.bench?.length) return null

  const Row = ({ p, minute, outName }: { p: LineupPlayer; minute?: number; outName?: string }) => {
    const r = getRating(p)
    const style = getRatingBadgeStyle(r, p.hasRedCard)
    const showRating = minute != null
    return (
      <div
        onClick={() => isAdmin && onPick?.(p, side)}
        className={`flex items-center gap-3 py-3 border-b border-white/5 last:border-b-0 ${isAdmin ? 'cursor-pointer' : ''}`}
      >
        {p.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={getImageUrl(p.photoUrl)} alt="" className="w-11 h-11 rounded-full object-cover bg-white/10 shrink-0" />
        ) : (
          <div className="w-11 h-11 rounded-full bg-white/10 text-white/70 flex items-center justify-center text-sm font-black shrink-0">{p.name?.[0]?.toUpperCase() ?? '?'}</div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-white text-sm font-semibold truncate">
            <span className="text-white/40 mr-1.5">{p.jerseyNumber ?? ''}</span>
            {p.name}
          </p>
          {minute != null && (
            <p className="flex items-center gap-1.5 text-xs text-white/50 mt-0.5">
              <span className="inline-flex w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 items-center justify-center"><ArrowRight size={10} /></span>
              <span className="text-emerald-400 font-semibold">{minute}&apos;</span>
              {outName && <span className="truncate">Out: {outName}</span>}
            </p>
          )}
        </div>
        {showRating && <span className={`text-xs font-black px-2 py-1 rounded-md ${style.bgClass} ${style.textClass}`}>{r.toFixed(1)}</span>}
      </div>
    )
  }

  return (
    <section className="rounded-2xl bg-[#1c2230] border border-white/5 p-3.5 mt-2" aria-label="Substitutes">
      <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-black/30 mb-3" role="tablist" aria-label="Team">
        {([['home', homeTeam], ['away', awayTeam]] as const).map(([k, t]) => (
          <button
            key={k}
            role="tab"
            aria-selected={side === k}
            onClick={() => setSide(k)}
            className={`flex items-center justify-center gap-2 h-10 rounded-full text-xs font-bold uppercase tracking-wide transition-colors ${side === k ? 'bg-white text-black' : 'text-white/50'}`}
          >
            {t.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getImageUrl(t.logoUrl)} alt="" className="w-5 h-5 object-contain" />
            )}
            {t.shortName || t.name || t.teamName}
          </button>
        ))}
      </div>

      {cameOn.length > 0 && (
        <>
          <h4 className="text-white font-black text-sm text-center py-2">Substitutions</h4>
          {cameOn.map((c) => <Row key={c.player.id} p={c.player} minute={c.minute ?? 0} outName={c.outName} />)}
        </>
      )}

      {unused.length > 0 && (
        <>
          <h4 className="text-white/60 font-bold text-xs text-center py-2 uppercase tracking-widest">{cameOn.length > 0 ? 'Not used' : 'Substitutes'}</h4>
          {unused.map((p) => <Row key={p.id} p={p} />)}
        </>
      )}

      {cameOn.length === 0 && unused.length === 0 && (
        <p className="text-white/40 text-xs text-center py-4">No substitutes for {team.shortName || team.name || team.teamName}.</p>
      )}
    </section>
  )
}
