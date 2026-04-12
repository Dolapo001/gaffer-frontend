'use client'

import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'
import type { Fixture } from '@/lib/services/fixture.service'

interface NextMatchCardProps {
  fixture: Fixture | null
  onPress?: (id: string) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function teamName(side: Fixture['homeTeamId']): string {
  if (!side || typeof side === 'string') return 'TBD'
  return side.name
}

function teamInitials(side: Fixture['homeTeamId']): string {
  if (!side || typeof side === 'string') return '?'
  return (side.shortName ?? side.name).slice(0, 3).toUpperCase()
}

function teamLogo(side: Fixture['homeTeamId']): string | null {
  if (!side || typeof side === 'string') return null
  return (side as any).logoUrl ?? null
}

function roundLabel(f: Fixture): string {
  if (!f.roundId || typeof f.roundId === 'string') return ''
  return f.roundId.name
}

function formatKickoff(iso: string) {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  }
}

// ─── TeamBadge ────────────────────────────────────────────────────────────────

function TeamBadge({ side }: { side: Fixture['homeTeamId'] }) {
  const logo = teamLogo(side)
  const initials = teamInitials(side)

  return (
    <div className="flex flex-col items-center gap-2.5 flex-1">
      <div className="w-[52px] h-[52px] rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center overflow-hidden shadow-lg">
        {logo ? (
          <img src={logo} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="font-chakra font-black text-white text-[13px]">{initials}</span>
        )}
      </div>
      <p className="text-white font-display font-bold text-[11px] text-center leading-tight px-1 line-clamp-2">
        {teamName(side)}
      </p>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NextMatchCard({ fixture, onPress }: NextMatchCardProps) {
  if (!fixture) return null

  const { date, time } = formatKickoff(fixture.kickoffAt)
  const round = roundLabel(fixture)

  return (
    <div className="w-full px-4 mb-4">
      {/* Section heading */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-white font-display font-bold text-sm uppercase tracking-wide">
          Next Match
        </h2>
        {round && (
          <span className="text-[9px] font-chakra font-black text-white/40 uppercase tracking-widest">
            {round}
          </span>
        )}
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => onPress?.(fixture._id)}
        className="w-full text-left"
      >
        <div
          className="rounded-[24px] overflow-hidden p-5"
          style={{
            background: 'linear-gradient(91deg, #4568DC 0%, #B06AB3 100%)',
            boxShadow: '0 14px 40px rgba(69,104,220,0.30)',
          }}
        >
          {/* Date pill */}
          <div className="flex items-center justify-center gap-1.5 mb-5">
            <Calendar size={11} className="text-white/70" />
            <span className="text-[10px] font-chakra font-bold text-white/70 uppercase tracking-wider">
              {date} &nbsp;·&nbsp; {time}
            </span>
          </div>

          {/* Teams row */}
          <div className="flex items-center justify-between gap-2">
            <TeamBadge side={fixture.homeTeamId} />

            {/* VS divider */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0 px-1">
              <span className="text-[10px] font-chakra font-black text-white/50 uppercase tracking-widest">
                vs
              </span>
              <div className="w-px h-5 bg-white/20" />
            </div>

            <TeamBadge side={fixture.awayTeamId} />
          </div>
        </div>
      </motion.button>
    </div>
  )
}
