'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Search, ChevronRight, CheckCircle2 } from 'lucide-react'
import { CreateTournamentModal } from '@/components/tournament/CreateTournamentModal'
import { listOrgs } from '@/lib/services/org.service'
import { listCompetitions } from '@/lib/services/competition.service'

export default function TournamentsPage() {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: orgs, isLoading: isLoadingOrgs } = useQuery({ queryKey: ['orgs'], queryFn: listOrgs })
  const firstOrg = orgs?.[0]

  const handleCreateTournament = () => {
    if (!firstOrg) {
      router.push('/auth/signup/organization')
      return
    }
    setShowCreate(true)
  }

  const { data: competitions, isLoading } = useQuery({
    queryKey: ['competitions', firstOrg?._id],
    queryFn: () => listCompetitions(firstOrg!._id),
    enabled: !!firstOrg?._id,
  })

  const filtered = (competitions ?? []).filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sorted = [...filtered].sort((a, b) => {
    const order: Record<string, number> = { live: 0, draft: 1, published: 2, completed: 3, archived: 4 }
    return (order[a.status] ?? 99) - (order[b.status] ?? 99)
  })

  return (
    <div className="h-screen flex flex-col bg-[#181928] overflow-hidden relative">
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Header / Search */}
        <div className="px-6 pt-12 pb-6 space-y-6">
          <div className="w-full h-14 bg-[#1E2032] border border-white/5 rounded-2xl flex items-center px-4 gap-3 shadow-sm">
            <Search size={22} className="text-white/20" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-white text-sm w-full font-chakra font-medium placeholder:text-white/20"
            />
          </div>
          
          <h2 className="font-chakra font-black text-lg text-white tracking-widest uppercase">Your Tournament</h2>
        </div>

        {/* List / Empty State */}
        <div className="px-6 pb-40">
          {isLoading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 bg-[#1E2032] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1E2032] rounded-[32px] overflow-hidden border border-white/5 shadow-2xl flex flex-col items-center text-center p-6 space-y-6"
            >
              <div className="w-full h-44 rounded-2xl overflow-hidden bg-white/5">
                <img 
                    src="/images/empty_tournament.png" 
                    className="w-full h-full object-cover opacity-80" 
                    alt="No Tournaments"
                />
              </div>
              
              <p className="font-chakra font-bold text-lg text-white">
                {searchQuery ? 'No Results Found' : "You Don't have any Tournament"}
              </p>

              <button
                onClick={handleCreateTournament}
                className="w-full py-4 rounded-xl font-chakra font-black text-lg bg-gradient-to-r from-[#FF8904] to-[#E7000B] text-white uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all"
              >
                {firstOrg ? 'Create Tournament' : 'Set Up Organization First'}
              </button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {sorted.map((comp, i) => (
                <motion.button
                  key={comp._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => router.push(`/admin/tournaments/${comp._id}`)}
                  className="w-full bg-[#1E2032] border border-white/5 rounded-2xl p-4 flex items-center gap-4 group"
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/10 bg-gaffer-dark flex-shrink-0 relative">
                     {comp.bannerUrl ? (
                         <img src={comp.bannerUrl} alt="" className="w-full h-full object-cover" />
                     ) : (
                         <div className="w-full h-full flex items-center justify-center bg-white/5 text-gaffer-orange font-chakra font-black text-xl">
                            {comp.name.charAt(0)}
                         </div>
                     )}
                  </div>
                  
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-1.5">
                        <p className="text-white font-chakra font-black text-lg uppercase tracking-tight">{comp.name}</p>
                        <CheckCircle2 size={16} className="text-[#FF8904] fill-[#FF8904]/10" />
                    </div>
                    <p className="text-white/40 text-[11px] font-chakra font-bold uppercase tracking-wide">
                        {new Date(comp.startDate).toLocaleDateString()} - {new Date(comp.endDate).toLocaleDateString()}
                    </p>
                    <p className={`text-[10px] font-chakra font-black uppercase mt-1 tracking-wider ${
                      comp.status === 'live' ? 'text-green-500' : 
                      comp.status === 'draft' ? 'text-yellow-500' : 
                      'text-red-500'
                    }`}>
                      {comp.status}
                    </p>
                  </div>
                  
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
                     <ChevronRight size={20} />
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Plus Button */}
      {competitions && competitions.length > 0 && (
        <button
          onClick={handleCreateTournament}
          className="absolute bottom-28 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-[#FF8904] to-[#E7000B] text-white flex items-center justify-center shadow-[0_8px_32px_rgba(231,0,11,0.3)] active:scale-90 transition-transform z-30"
        >
          <div className="text-4xl font-light">+</div>
        </button>
      )}

      <AnimatePresence>
        {showCreate && <CreateTournamentModal onClose={() => setShowCreate(false)} />}
      </AnimatePresence>
    </div>
  )
}
