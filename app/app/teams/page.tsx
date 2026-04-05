'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronLeft, Users } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { listPublicTeams } from '@/lib/services/team.service'

export default function PublicTeamsPage() {
  const router = useRouter()

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['public-teams'],
    queryFn: listPublicTeams,
    staleTime: 60_000,
  })

  return (
    <div className="min-h-screen bg-[#0F111A] text-white flex flex-col font-inter">
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-[#0F111A]/90 backdrop-blur-xl z-50">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full border border-white/10 text-white/60"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-chakra font-black text-xl uppercase tracking-tight italic">Teams</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 px-6 pb-24 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-[#1C1F2D] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : teams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Users size={28} className="text-white/20" />
            </div>
            <p className="text-white/30 font-chakra font-bold uppercase tracking-widest text-sm">No public teams</p>
          </div>
        ) : (
          <div className="space-y-3">
            {teams.map((team, i) => (
              <motion.div
                key={team._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[#1C1F2D] rounded-2xl p-4 flex items-center gap-4 border border-white/5"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 border border-white/10 p-1.5 shrink-0">
                  {team.logoUrl ? (
                    <img src={team.logoUrl} className="w-full h-full object-contain" alt={team.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users size={20} className="text-white/20" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-chakra font-black text-base uppercase tracking-tight text-white truncate">{team.name}</h3>
                  {team.handle && (
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">@{team.handle}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
