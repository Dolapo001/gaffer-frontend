'use client'

import { useState } from 'react'
import type { FantasyPlayer } from '@/lib/services/fantasy.service'
import { getImageUrl } from '@/lib/api'

interface TopPlayersLeaderboardProps {
  players: FantasyPlayer[]
  gameweeksPlayed: number
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export function TopPlayersLeaderboard({ players, gameweeksPlayed }: TopPlayersLeaderboardProps) {
  const [mode, setMode] = useState<'total' | 'average'>('total')
  const [isExpanded, setIsExpanded] = useState(false)

  const sorted = [...players].sort((a, b) => (b.totalPoints ?? 0) - (a.totalPoints ?? 0))
  const limit = isExpanded ? 50 : 5
  const ranked = sorted.slice(0, limit)

  const valueFor = (p: FantasyPlayer) => {
    const total = p.totalPoints ?? 0
    if (mode === 'total') return `${total}pts`
    const avg = gameweeksPlayed > 0 ? (total / gameweeksPlayed).toFixed(1) : '0.0'
    return `${avg}pts`
  }

  return (
    <div className="bg-[#181C28] border border-white/10 rounded-3xl p-5 shadow-xl space-y-4">
      {/* Header with Title and Mode Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-white font-chakra font-black text-base uppercase tracking-tight">Top players</h3>

        <div className="flex items-center gap-1 bg-[#10121B] border border-white/5 p-1 rounded-full w-fit">
          <button
            onClick={() => setMode('total')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-chakra font-bold transition-all ${
              mode === 'total' ? 'bg-white text-black shadow-md' : 'text-white/50 hover:text-white'
            }`}
          >
            Total points
          </button>
          <button
            onClick={() => setMode('average')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-chakra font-bold transition-all ${
              mode === 'average' ? 'bg-white text-black shadow-md' : 'text-white/50 hover:text-white'
            }`}
          >
            Average points
          </button>
        </div>
      </div>

      {/* Player List */}
      <div className="space-y-3 pt-1">
        {ranked.length === 0 ? (
          <p className="text-white/40 text-xs font-chakra text-center py-6">No player points recorded yet.</p>
        ) : (
          ranked.map((p, i) => {
            const playerDoc = p.playerId
            const teamDoc = p.teamId
            const photoUrl = (playerDoc as any)?.photoUrl
            const fullName = playerDoc ? `${playerDoc.firstName} ${playerDoc.lastName}`.trim() : 'Player'
            const teamName = teamDoc?.shortName || teamDoc?.name || 'Team'

            return (
              <div key={p._id} className="flex items-center gap-3.5 py-1">
                {/* Ordinal Rank (1st, 2nd, 3rd, etc.) */}
                <span className="text-white/50 text-xs font-chakra font-bold w-7 shrink-0 text-left">
                  {getOrdinal(i + 1)}
                </span>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full overflow-hidden bg-[#242938] border border-white/10 flex items-center justify-center shrink-0">
                  {photoUrl ? (
                    <img src={getImageUrl(photoUrl)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-chakra font-bold text-white/40 text-xs uppercase">
                      {(playerDoc?.lastName || 'P').slice(0, 2)}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-chakra font-bold truncate leading-snug">
                    {fullName}
                  </p>
                  <p className="text-white/40 text-[11px] font-chakra font-medium truncate flex items-center gap-1">
                    <span>{teamName}</span>
                    <span>•</span>
                    <span className="uppercase">{p.position}</span>
                  </p>
                </div>

                {/* Points */}
                <span className="text-white font-chakra font-bold text-sm shrink-0">
                  {valueFor(p)}
                </span>
              </div>
            )
          })
        )}
      </div>

      {/* Expand / Collapse Button */}
      {sorted.length > 5 && (
        <div className="pt-2 text-center border-t border-white/5">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-purple-400 hover:text-purple-300 font-chakra font-bold text-xs transition-colors py-1 px-3"
          >
            {isExpanded ? 'Show less' : 'See all players'}
          </button>
        </div>
      )}
    </div>
  )
}
