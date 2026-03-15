'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTournamentStore } from '@/store/tournamentStore'
import { TournamentCard } from '@/components/admin/TournamentCard'
import { CreateTournamentModal } from '@/components/tournament/CreateTournamentModal'
import { Plus, Trophy, Filter } from 'lucide-react'

type FilterType = 'all' | 'upcoming' | 'ongoing' | 'completed'

export default function TournamentsPage() {
  const router = useRouter()
  const { tournaments } = useTournamentStore()
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')

  const filtered = filter === 'all' ? tournaments : tournaments.filter((t) => t.status === filter)

  return (
    <>
      <div className="min-h-screen bg-gaffer-bg">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gaffer-bg/95 backdrop-blur-md border-b border-gaffer-border/50">
          <div className="flex items-center justify-between px-4 pt-12 pb-3">
            <div>
              <h1 className="font-display font-bold text-xl text-white">Tournaments</h1>
              <p className="text-gaffer-muted text-xs font-body mt-0.5">{tournaments.length} total</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-gradient-btn text-white font-display font-bold text-sm shadow-orange-glow"
            >
              <Plus size={16} />
              New
            </button>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4 pb-28">
          {/* Filter tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {(['all', 'ongoing', 'upcoming', 'completed'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-body font-semibold border transition-all capitalize ${
                  filter === f
                    ? 'bg-gaffer-orange/10 border-gaffer-orange text-gaffer-orange'
                    : 'bg-gaffer-card border-gaffer-border text-gaffer-muted hover:border-gaffer-orange/30'
                }`}
              >
                {f === 'all' ? `All (${tournaments.length})` : f}
              </button>
            ))}
          </div>

          {/* Tournament list */}
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 gap-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-gaffer-card border border-gaffer-border flex items-center justify-center">
                <Trophy size={28} className="text-gaffer-subtle" />
              </div>
              <div className="text-center">
                <p className="text-white font-body font-medium">No tournaments yet</p>
                <p className="text-gaffer-muted text-sm font-body mt-1">Create your first tournament to get started</p>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-gradient-btn text-white font-display font-bold text-sm shadow-orange-glow"
              >
                <Plus size={16} />
                Create Tournament
              </button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {filtered.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <TournamentCard tournament={t} onClick={() => router.push(`/admin/tournaments/${t.id}`)} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showCreate && <CreateTournamentModal onClose={() => setShowCreate(false)} />}
      </AnimatePresence>
    </>
  )
}
