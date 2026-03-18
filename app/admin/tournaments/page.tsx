'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Search, Plus, Trophy } from 'lucide-react'
import { GradientButton } from '@/components/GradientButton'
import { CreateTournamentModal } from '@/components/tournament/CreateTournamentModal'
import { listOrgs } from '@/lib/services/org.service'
import { listCompetitions, type Competition } from '@/lib/services/competition.service'

function statusStyle(status: Competition['status']) {
  if (status === 'published') return 'text-green-400 bg-green-400/10 border-green-400/30'
  if (status === 'archived') return 'text-gaffer-subtle bg-gaffer-card border-gaffer-border'
  return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
}

export default function TournamentsPage() {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: orgs } = useQuery({ queryKey: ['orgs'], queryFn: listOrgs })
  const firstOrg = orgs?.[0]

  const { data: competitions, isLoading } = useQuery({
    queryKey: ['competitions', firstOrg?._id],
    queryFn: () => listCompetitions(firstOrg!._id),
    enabled: !!firstOrg?._id,
  })

  const filtered = (competitions ?? []).filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <div className="min-h-screen bg-[#0F111A]">
        {/* Header */}
        <div className="px-6 pt-12 pb-6 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-[280px] h-12 bg-[#1C1F2D] border border-white/5 rounded-2xl flex items-center px-4 gap-3">
              <Search size={20} className="text-white/30" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-white text-sm w-full font-medium"
              />
            </div>
          </div>
          <h2 className="font-chakra font-black text-xl text-white tracking-tight uppercase">Your Tournaments</h2>
        </div>

        <div className="px-6 pb-40">
          {isLoading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-20 bg-[#1C1F2D] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1C1F2D] rounded-[40px] overflow-hidden border border-white/5 shadow-2xl relative p-8 text-center space-y-6"
            >
              <div className="bg-[#0F111A]/40 rounded-[32px] p-10 flex items-center justify-center">
                <Trophy size={64} className="text-white/10" />
              </div>
              <div className="space-y-2">
                <h4 className="font-chakra font-black text-xl text-white uppercase tracking-tight">
                  {searchQuery ? 'No tournaments found' : "You Don't have any Tournament"}
                </h4>
                <p className="text-white/40 text-sm font-medium">
                  {searchQuery ? 'Try a different search' : 'Create your first league to get started'}
                </p>
              </div>
              {!searchQuery && (
                <GradientButton
                  onClick={() => setShowCreate(true)}
                  className="h-14 w-full rounded-2xl font-chakra font-black text-base uppercase tracking-wider shadow-2xl shadow-orange-500/20"
                >
                  Create Tournament
                </GradientButton>
              )}
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filtered.map((comp, i) => (
                <motion.button
                  key={comp._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(`/admin/tournaments/${comp._id}`)}
                  className="w-full text-left bg-[#1C1F2D] border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/5 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-gaffer-orange/10 border border-gaffer-orange/20 flex items-center justify-center flex-shrink-0">
                    <Trophy size={22} className="text-gaffer-orange" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-chakra font-bold text-base truncate">{comp.name}</p>
                    <p className="text-white/40 text-xs capitalize">{comp.sport} · {comp.gender}</p>
                  </div>
                  <span className={`text-[10px] font-display font-bold px-2 py-0.5 rounded-full border ${statusStyle(comp.status)}`}>
                    {comp.status}
                  </span>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowCreate(true)}
        className="fixed bottom-32 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-[#FF8A00] to-[#FF0000] flex items-center justify-center text-white shadow-[0_10px_30px_rgba(255,138,0,0.4)] z-40 active:scale-95 transition-transform"
      >
        <Plus size={32} strokeWidth={3} />
      </button>

      <AnimatePresence>
        {showCreate && <CreateTournamentModal onClose={() => setShowCreate(false)} />}
      </AnimatePresence>
    </>
  )
}
