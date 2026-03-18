'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTournamentStore } from '@/store/tournamentStore'
import { TournamentCard } from '@/components/admin/TournamentCard'
import { CreateTournamentModal } from '@/components/tournament/CreateTournamentModal'
import { Search, Plus, Menu } from 'lucide-react'
import { GradientButton } from '@/components/GradientButton'

export default function TournamentsPage() {
  const router = useRouter()
  const { tournaments } = useTournamentStore()
  const [showCreate, setShowCreate] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = tournaments.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const hasTournaments = tournaments.length > 0

  return (
    <>
      <div className="min-h-screen bg-[#0F111A]">
        {/* Header Section */}
        <div className="px-6 pt-12 pb-6 space-y-8">
           <div className="flex items-center justify-between">
              <button className="w-10 h-10 flex items-center justify-center text-white/60">
                 <Menu size={28} />
              </button>
              
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

           <h2 className="font-chakra font-black text-xl text-white tracking-tight uppercase">Your Tournament</h2>
        </div>

        <div className="px-6 pb-40">
          {!hasTournaments ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1C1F2D] rounded-[40px] overflow-hidden border border-white/5 shadow-2xl relative p-8 text-center space-y-6"
            >
              <div className="bg-[#0F111A]/40 rounded-[32px] p-10 flex items-center justify-center">
                 <img src="/images/empty_tournament.png" className="w-48 opacity-40 grayscale" alt="" />
              </div>
              <div className="space-y-2">
                <h4 className="font-chakra font-black text-xl text-white uppercase tracking-tight">
                  You Don&apos;t have any Tournament
                </h4>
                <p className="text-white/40 text-sm font-medium">Create your first league to get started</p>
              </div>
              <GradientButton 
                onClick={() => setShowCreate(true)}
                className="h-14 w-full rounded-2xl font-chakra font-black text-base uppercase tracking-wider shadow-2xl shadow-orange-500/20"
              >
                Create Tournament
              </GradientButton>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filtered.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <TournamentCard tournament={t} onClick={() => router.push(`/admin/tournaments/${t.id}`)} />
                </motion.div>
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
