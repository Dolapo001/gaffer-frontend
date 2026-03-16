'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Target } from 'lucide-react'
import { ALL_PLAYERS, LEAGUE_DETAIL } from '@/lib/leagueMockData'

function fetchScorers() {
  return new Promise<typeof ALL_PLAYERS>((resolve) =>
    setTimeout(() => resolve([...ALL_PLAYERS].sort((a, b) => b.goals - a.goals)), 500)
  )
}

export default function GoalScorersPage() {
  const router = useRouter()

  const { data: scorers, isLoading } = useQuery({
    queryKey: ['goal-scorers'],
    queryFn: fetchScorers,
  })

  return (
    <div className="min-h-screen bg-gaffer-bg pb-28">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-gaffer-bg/95 backdrop-blur-xl border-b border-gaffer-border">
        <div className="flex items-center gap-3 px-4 pt-12 pb-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-gaffer-card border border-gaffer-border flex items-center justify-center text-white"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="font-display font-black text-white text-sm tracking-widest uppercase">
              Goals Scored
            </h1>
            <p className="text-gaffer-muted text-[10px] font-body">{LEAGUE_DETAIL.name}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="bg-gaffer-card border border-gaffer-border rounded-2xl overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center px-4 py-2.5 border-b border-gaffer-border bg-gaffer-surface">
            <span className="text-[10px] font-body font-bold text-gaffer-muted w-6">#</span>
            <span className="text-[10px] font-body font-bold text-gaffer-muted">Player</span>
            <span className="text-[10px] font-body font-bold text-gaffer-muted w-12 text-center">Goals</span>
            <span className="text-[10px] font-body font-bold text-gaffer-muted w-10 text-center">Ast</span>
          </div>

          {isLoading
            ? [...Array(8)].map((_, i) => (
                <div key={i} className="h-14 bg-gaffer-card/50 animate-pulse border-b border-gaffer-border/30" />
              ))
            : (scorers ?? []).filter((p) => p.goals > 0).map((player, i) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center px-4 py-3 border-b border-gaffer-border/30 last:border-0"
                >
                  <span className={`text-[11px] font-display font-bold w-6 text-center ${
                    i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gaffer-subtle'
                  }`}>{i + 1}</span>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-orange-gradient-btn flex items-center justify-center text-xs text-white font-display font-bold flex-shrink-0">
                      {player.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-xs font-body font-semibold truncate">{player.name}</p>
                      <p className="text-gaffer-muted text-[10px] font-body">{player.teamName}</p>
                    </div>
                  </div>
                  <div className="w-12 flex items-center justify-center gap-1">
                    <Target size={12} className="text-gaffer-orange flex-shrink-0" />
                    <span className="text-gaffer-orange font-display font-bold text-sm">{player.goals}</span>
                  </div>
                  <span className="text-gaffer-muted font-body text-xs w-10 text-center">{player.assists}</span>
                </motion.div>
              ))}
        </div>
      </div>
    </div>
  )
}
